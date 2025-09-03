from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import stripe
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from ...db.session import get_db
from ...db.models import Dealership, SubscriptionPlan, DealershipSubscription, SubscriptionEvent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["stripe"])

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Stripe webhook events for subscription tracking
    """
    try:
        # Test database connection
        try:
            await db.execute("SELECT 1")
        except Exception as db_error:
            logger.error(f"Database connection failed: {db_error}")
            raise HTTPException(status_code=500, detail="Database connection failed")
        # Get the raw body and signature
        body = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        if not webhook_secret:
            logger.error("STRIPE_WEBHOOK_SECRET environment variable not set")
            raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")
        
        if not stripe.api_key:
            logger.error("STRIPE_SECRET_KEY environment variable not set")
            raise HTTPException(status_code=500, detail="Stripe secret key not configured")
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                body, signature, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        logger.info(f"Received Stripe webhook: {event['type']}")
        logger.info(f"Event ID: {event.get('id')}")
        logger.info(f"Event data: {event.get('data', {}).get('object', {})}")
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            logger.info("Processing checkout.session.completed event")
            await handle_checkout_session_completed(event['data']['object'], db)
        elif event['type'] == 'customer.subscription.created':
            logger.info("Processing customer.subscription.created event")
            await handle_subscription_created(event['data']['object'], db)
        elif event['type'] == 'customer.subscription.updated':
            logger.info("Processing customer.subscription.updated event")
            await handle_subscription_updated(event['data']['object'], db)
        elif event['type'] == 'customer.subscription.deleted':
            logger.info("Processing customer.subscription.deleted event")
            await handle_subscription_deleted(event['data']['object'], db)
        elif event['type'] == 'invoice.payment_succeeded':
            logger.info("Processing invoice.payment_succeeded event")
            await handle_payment_succeeded(event['data']['object'], db)
        elif event['type'] == 'invoice.payment_failed':
            logger.info("Processing invoice.payment_failed event")
            await handle_payment_failed(event['data']['object'], db)
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_checkout_session_completed(session: Dict[str, Any], db: AsyncSession):
    """Handle successful checkout session"""
    logger.info(f"Processing checkout session completed: {session['id']}")
    logger.info(f"Session metadata: {session.get('metadata', {})}")
    
    metadata = session.get('metadata', {})
    dealership_id = metadata.get('dealership_id')
    product_id = metadata.get('product_id')
    
    logger.info(f"Dealership ID: {dealership_id}, Product ID: {product_id}")
    
    if not dealership_id or not product_id:
        logger.error("Missing dealership_id or product_id in session metadata")
        logger.error(f"Available metadata keys: {list(metadata.keys())}")
        return
    
    # Get the subscription plan
    try:
        plan = await db.execute(
            "SELECT * FROM subscription_plans WHERE stripe_product_id = :product_id",
            {"product_id": product_id}
        )
        plan = plan.fetchone()
        
        if not plan:
            logger.error(f"Subscription plan not found for product: {product_id}")
            return
        
        logger.info(f"Found subscription plan: {plan}")
    except Exception as e:
        logger.error(f"Error querying subscription plan: {e}")
        return
    
    # Create subscription record
    subscription_data = {
        "dealership_id": dealership_id,
        "subscription_plan_id": plan.id,
        "stripe_subscription_id": session.get('subscription'),
        "stripe_customer_id": session.get('customer'),
        "status": "active",
        "current_period_start": datetime.now(),
        "current_period_end": datetime.now().replace(day=28) + timedelta(days=32),  # Next month
    }
    
    result = await db.execute(
        """
        INSERT INTO dealership_subscriptions 
        (dealership_id, subscription_plan_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
        VALUES (:dealership_id, :subscription_plan_id, :stripe_subscription_id, :stripe_customer_id, :status, :current_period_start, :current_period_end)
        RETURNING id
        """,
        subscription_data
    )
    subscription_id = result.fetchone()[0]
    
    # Update dealership with current subscription
    await db.execute(
        "UPDATE dealerships SET current_subscription_id = :subscription_id WHERE id = :dealership_id",
        {"subscription_id": subscription_id, "dealership_id": dealership_id}
    )
    
    # Log the event
    await db.execute(
        """
        INSERT INTO subscription_events 
        (dealership_subscription_id, event_type, stripe_event_id, event_data)
        VALUES (:subscription_id, :event_type, :stripe_event_id, :event_data)
        """,
        {
            "subscription_id": subscription_id,
            "event_type": "created",
            "stripe_event_id": session['id'],
            "event_data": json.dumps({
                "tier": metadata.get('tier'),
                "quantity": metadata.get('quantity'),
                "price_per_unit": metadata.get('price_per_unit'),
                "setup_fee": metadata.get('setup_fee'),
            })
        }
    )
    
    await db.commit()
    logger.info(f"Subscription created successfully: {subscription_id}")

async def handle_subscription_created(subscription: Dict[str, Any], db: AsyncSession):
    """Handle subscription created event"""
    logger.info(f"Processing subscription created: {subscription['id']}")
    
    await db.execute(
        """
        UPDATE dealership_subscriptions 
        SET stripe_subscription_id = :stripe_id, stripe_customer_id = :customer_id, 
            status = :status, current_period_start = :period_start, current_period_end = :period_end
        WHERE stripe_subscription_id = :stripe_id
        """,
        {
            "stripe_id": subscription['id'],
            "customer_id": subscription['customer'],
            "status": subscription['status'],
            "period_start": datetime.fromtimestamp(subscription['current_period_start']),
            "period_end": datetime.fromtimestamp(subscription['current_period_end']),
        }
    )
    await db.commit()

async def handle_subscription_updated(subscription: Dict[str, Any], db: AsyncSession):
    """Handle subscription updated event"""
    logger.info(f"Processing subscription updated: {subscription['id']}")
    
    await db.execute(
        """
        UPDATE dealership_subscriptions 
        SET status = :status, current_period_start = :period_start, current_period_end = :period_end,
            canceled_at = :canceled_at
        WHERE stripe_subscription_id = :stripe_id
        """,
        {
            "stripe_id": subscription['id'],
            "status": subscription['status'],
            "period_start": datetime.fromtimestamp(subscription['current_period_start']),
            "period_end": datetime.fromtimestamp(subscription['current_period_end']),
            "canceled_at": datetime.fromtimestamp(subscription['canceled_at']) if subscription.get('canceled_at') else None,
        }
    )
    await db.commit()

async def handle_subscription_deleted(subscription: Dict[str, Any], db: AsyncSession):
    """Handle subscription deleted event"""
    logger.info(f"Processing subscription deleted: {subscription['id']}")
    
    await db.execute(
        """
        UPDATE dealership_subscriptions 
        SET status = 'canceled', canceled_at = :canceled_at
        WHERE stripe_subscription_id = :stripe_id
        """,
        {
            "stripe_id": subscription['id'],
            "canceled_at": datetime.now(),
        }
    )
    await db.commit()

async def handle_payment_succeeded(invoice: Dict[str, Any], db: AsyncSession):
    """Handle successful payment"""
    logger.info(f"Processing payment succeeded: {invoice['id']}")
    
    if not invoice.get('subscription'):
        return
    
    # Log the event
    result = await db.execute(
        "SELECT id FROM dealership_subscriptions WHERE stripe_subscription_id = :stripe_id",
        {"stripe_id": invoice['subscription']}
    )
    subscription = result.fetchone()
    
    if subscription:
        await db.execute(
            """
            INSERT INTO subscription_events 
            (dealership_subscription_id, event_type, stripe_event_id, event_data)
            VALUES (:subscription_id, :event_type, :stripe_event_id, :event_data)
            """,
            {
                "subscription_id": subscription[0],
                "event_type": "payment_succeeded",
                "stripe_event_id": invoice['id'],
                "event_data": json.dumps({
                    "amount_paid": invoice['amount_paid'],
                    "currency": invoice['currency'],
                })
            }
        )
        await db.commit()

async def handle_payment_failed(invoice: Dict[str, Any], db: AsyncSession):
    """Handle failed payment"""
    logger.info(f"Processing payment failed: {invoice['id']}")
    
    if not invoice.get('subscription'):
        return
    
    # Update subscription status
    await db.execute(
        "UPDATE dealership_subscriptions SET status = 'past_due' WHERE stripe_subscription_id = :stripe_id",
        {"stripe_id": invoice['subscription']}
    )
    
    # Log the event
    result = await db.execute(
        "SELECT id FROM dealership_subscriptions WHERE stripe_subscription_id = :stripe_id",
        {"stripe_id": invoice['subscription']}
    )
    subscription = result.fetchone()
    
    if subscription:
        await db.execute(
            """
            INSERT INTO subscription_events 
            (dealership_subscription_id, event_type, stripe_event_id, event_data)
            VALUES (:subscription_id, :event_type, :stripe_event_id, :event_data)
            """,
            {
                "subscription_id": subscription[0],
                "event_type": "payment_failed",
                "stripe_event_id": invoice['id'],
                "event_data": json.dumps({
                    "amount_due": invoice['amount_due'],
                    "currency": invoice['currency'],
                })
            }
        )
        await db.commit()

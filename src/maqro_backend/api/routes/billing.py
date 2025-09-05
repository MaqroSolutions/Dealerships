from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Dict

from maqro_backend.api.deps import get_db_session, get_user_dealership_id

router = APIRouter()


@router.get("/billing/subscription/current")
async def get_current_subscription(
    db: AsyncSession = Depends(get_db_session),
    dealership_id: str = Depends(get_user_dealership_id),
) -> Dict[str, Any]:
    """Return current dealership subscription details, if any."""
    q = text(
        """
        SELECT ds.id as subscription_id,
               ds.status,
               ds.current_period_start,
               ds.current_period_end,
               sp.name as plan_name,
               sp.stripe_product_id as plan_product_id,
               sp.monthly_price_cents
        FROM dealerships d
        LEFT JOIN dealership_subscriptions ds ON d.current_subscription_id = ds.id
        LEFT JOIN subscription_plans sp ON ds.subscription_plan_id = sp.id
        WHERE d.id = :dealership_id
        """
    )
    result = await db.execute(q, {"dealership_id": dealership_id})
    row = result.fetchone()
    if not row or row.subscription_id is None:
        return {"subscription": None}

    return {
        "subscription": {
            "id": str(row.subscription_id),
            "status": row.status,
            "current_period_start": row.current_period_start,
            "current_period_end": row.current_period_end,
            "plan": {
                "name": row.plan_name,
                "product_id": row.plan_product_id,
                "monthly_price_cents": row.monthly_price_cents,
            },
        }
    }


@router.get("/billing/plans")
async def list_plans(db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
    q = text(
        """
        SELECT id, stripe_product_id, name, description, monthly_price_cents, max_salespeople
        FROM subscription_plans
        ORDER BY monthly_price_cents ASC NULLS LAST
        """
    )
    result = await db.execute(q)
    rows = result.fetchall()
    plans = [
        {
            "id": str(r.id),
            "stripe_product_id": r.stripe_product_id,
            "name": r.name,
            "description": r.description,
            "monthly_price_cents": r.monthly_price_cents,
            "max_salespeople": r.max_salespeople,
        }
        for r in rows
    ]
    return {"plans": plans}



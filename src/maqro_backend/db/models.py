"""
SQLAlchemy models for Supabase integration

These models match the Supabase schema defined in frontend/supabase/schema.sql
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, func, text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Role(Base):
    """Role model for user permissions"""
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(Text, nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user_roles = relationship("UserRole", back_populates="role")


class UserRole(Base):
    """User role assignments per dealership"""
    __tablename__ = "user_roles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    role = relationship("Role", back_populates="user_roles")
    dealership = relationship("Dealership", back_populates="user_roles")


class SettingDefinition(Base):
    """Setting definitions and metadata"""
    __tablename__ = "setting_definitions"

    setting_key = Column(Text, primary_key=True)
    scope = Column(Text, nullable=False)
    description = Column(Text)
    default_value = Column(JSON, nullable=False)
    is_sensitive = Column(Boolean, default=False)

    # Relationships
    dealership_settings = relationship("DealershipSetting", back_populates="definition")
    user_settings = relationship("UserSetting", back_populates="definition")


class DealershipSetting(Base):
    """Dealership-level settings"""
    __tablename__ = "dealership_settings"

    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), primary_key=True)
    setting_key = Column(Text, ForeignKey("setting_definitions.setting_key"), primary_key=True)
    setting_value = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True))

    # Relationships
    dealership = relationship("Dealership", back_populates="dealership_settings")
    definition = relationship("SettingDefinition", back_populates="dealership_settings")


class UserSetting(Base):
    """User-level settings and preferences"""
    __tablename__ = "user_settings"

    user_id = Column(UUID(as_uuid=True), primary_key=True)
    setting_key = Column(Text, ForeignKey("setting_definitions.setting_key"), primary_key=True)
    setting_value = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True))

    # Relationships
    definition = relationship("SettingDefinition", back_populates="user_settings")


class Lead(Base):
    """Lead model matching Supabase leads table schema"""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(Text, nullable=False)
    car_interest = Column(Text, nullable=False)  # Renamed from 'car' to support types like 'sedan', 'Toyota Camry sedan'
    source = Column(Text, nullable=False)
    status = Column(Text, nullable=False)  # 'new', 'warm', 'hot', 'follow-up', 'cold', 'appointment_booked', 'deal_won', 'deal_lost'
    last_contact_at = Column(DateTime(timezone=True), nullable=False)
    email = Column(Text)
    phone = Column(Text)
    message = Column(Text)
    deal_value = Column(String)  # Using String to match DECIMAL(10,2)
    max_price = Column(Text)  # Maximum price range for the lead (flexible text format)
    appointment_datetime = Column(DateTime(timezone=True))
    assigned_user_id = Column(UUID(as_uuid=True))  # Assigned salesperson (nullable)
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)

    # Relationships
    conversations = relationship("Conversation", back_populates="lead", cascade="all, delete-orphan")
    dealership = relationship("Dealership", back_populates="leads")
    pending_approvals = relationship("PendingApproval", back_populates="lead", cascade="all, delete-orphan")


class Conversation(Base):
    """Conversation model for storing messages between leads and agents"""
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(Text, nullable=False)  # 'customer', 'agent', or 'system'

    # Relationships
    lead = relationship("Lead", back_populates="conversations")


class Inventory(Base):
    """Inventory model matching Supabase inventory table schema"""
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    make = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    year = Column(Integer, nullable=False)
    price = Column(String, nullable=False)  # Using String to match DECIMAL(10,2)
    mileage = Column(Integer)
    description = Column(Text)
    features = Column(Text)
    condition = Column(Text)  # Physical condition of the vehicle (excellent, good, fair, poor, etc.)
    stock_number = Column(Text)  # Stock number for vehicle identification
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)
    status = Column(Text, default="active")  # 'active', 'sold', 'pending'

    # Relationships
    dealership = relationship("Dealership", back_populates="inventory")


class UserProfile(Base):
    """User profile model matching Supabase user_profiles table schema"""
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"))
    full_name = Column(Text)
    phone = Column(Text)
    role = Column(Text)  # 'admin', 'salesperson'
    timezone = Column(Text, default="America/New_York")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    dealership = relationship("Dealership", back_populates="user_profiles")


class Dealership(Base):
    """Dealership model for storing organization-level data"""
    __tablename__ = "dealerships"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    name = Column(Text, nullable=False)
    location = Column(Text)
    integration_config = Column(JSON, default={})
    current_subscription_id = Column(UUID(as_uuid=True), ForeignKey("dealership_subscriptions.id"))

    # Relationships
    user_profiles = relationship("UserProfile", back_populates="dealership")
    inventory = relationship("Inventory", back_populates="dealership")
    leads = relationship("Lead", back_populates="dealership")
    pending_approvals = relationship("PendingApproval", back_populates="dealership")
    user_roles = relationship("UserRole", back_populates="dealership")
    dealership_settings = relationship("DealershipSetting", back_populates="dealership")
    invites = relationship("Invite", back_populates="dealership")
    dealership_subscriptions = relationship("DealershipSubscription", back_populates="dealership", foreign_keys="[DealershipSubscription.dealership_id]")
    current_subscription = relationship("DealershipSubscription", foreign_keys="[Dealership.current_subscription_id]")


class PendingApproval(Base):
    """Pending approval model for RAG response verification workflow"""
    __tablename__ = "pending_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)  # References auth.users(id)
    customer_message = Column(Text, nullable=False)
    generated_response = Column(Text, nullable=False)
    customer_phone = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending")  # 'pending', 'approved', 'rejected', 'expired', 'force_sent'
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), server_default=text("now() + interval '1 hour'"))

    # Relationships
    lead = relationship("Lead", back_populates="pending_approvals")
    dealership = relationship("Dealership", back_populates="pending_approvals")


class Invite(Base):
    """Invite model for salesperson invitations"""
    __tablename__ = "invites"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)
    email = Column(Text, nullable=False)
    token_hash = Column(Text, nullable=False, unique=True)
    role = Column(Text, nullable=False)  # 'owner', 'manager', 'salesperson'
    invited_by = Column(UUID(as_uuid=True), nullable=False)  # References auth.users(id)
    expires_at = Column(DateTime(timezone=True), server_default=text("now() + interval '7 days'"))
    used_at = Column(DateTime(timezone=True))
    status = Column(Text, nullable=False, default="pending")  # 'pending', 'accepted', 'expired', 'cancelled'

    # Relationships
    dealership = relationship("Dealership", back_populates="invites")


class SubscriptionPlan(Base):
    """Subscription plan model for Stripe products"""
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    stripe_product_id = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)  # 'Basic', 'Premium', 'Deluxe'
    description = Column(Text)
    monthly_price_cents = Column(Integer, nullable=False)  # Price in cents
    max_salespeople = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    dealership_subscriptions = relationship("DealershipSubscription", back_populates="subscription_plan")


class DealershipSubscription(Base):
    """Dealership subscription model for tracking active subscriptions"""
    __tablename__ = "dealership_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)
    subscription_plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    stripe_subscription_id = Column(Text, unique=True)
    stripe_customer_id = Column(Text)
    status = Column(Text, nullable=False, default="active")  # 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    canceled_at = Column(DateTime(timezone=True))

    # Relationships
    dealership = relationship("Dealership", back_populates="dealership_subscriptions", foreign_keys="[DealershipSubscription.dealership_id]")
    subscription_plan = relationship("SubscriptionPlan", back_populates="dealership_subscriptions")
    subscription_events = relationship("SubscriptionEvent", back_populates="dealership_subscription")


class SubscriptionEvent(Base):
    """Subscription event model for tracking all subscription changes"""
    __tablename__ = "subscription_events"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    dealership_subscription_id = Column(UUID(as_uuid=True), ForeignKey("dealership_subscriptions.id"), nullable=False)
    event_type = Column(Text, nullable=False)  # 'created', 'updated', 'canceled', 'renewed', 'payment_failed', etc.
    stripe_event_id = Column(Text, unique=True)
    event_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    dealership_subscription = relationship("DealershipSubscription", back_populates="subscription_events")

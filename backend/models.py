from datetime import datetime

def supplier_model(name, location, category, contact_email, items_supplied):
    return {
        "name": name,
        "location": location,
        "category": category,
        "contact_email": contact_email,
        "items_supplied": items_supplied,
        "risk_score": 0,
        "status": "active",
        "created_at": datetime.utcnow()
    }

def inventory_model(item_name, supplier_name, quantity, unit, reorder_threshold, days_remaining):
    return {
        "item_name": item_name,
        "supplier_name": supplier_name,
        "quantity": quantity,
        "unit": unit,
        "reorder_threshold": reorder_threshold,
        "days_remaining": days_remaining,
        "last_updated": datetime.utcnow()
    }

def alert_model(supplier_name, risk_level, reason, suggested_action):
    return {
        "supplier_name": supplier_name,
        "risk_level": risk_level,
        "reason": reason,
        "suggested_action": suggested_action,
        "resolved": False,
        "created_at": datetime.utcnow()
    }

def contract_model(supplier_name, contract_id, effective_date, expiration_date, contract_text):
    return {
        "supplier_name": supplier_name,
        "contract_id": contract_id,
        "effective_date": effective_date,
        "expiration_date": expiration_date,
        "contract_text": contract_text,
        "created_at": datetime.utcnow()
    }

from pydantic import BaseModel, Field
from typing import Literal

class RiskAnalysisSchema(BaseModel):
    risk_score: int = Field(..., ge=1, le=10)
    impact: str = Field(..., min_length=5)
    urgency: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    action: str = Field(..., min_length=5)
    confidence: Literal["HIGH", "MEDIUM", "LOW"]

class ActionPlanSchema(BaseModel):
    email_subject: str = Field(..., min_length=5)
    email_body: str = Field(..., min_length=10)
    backup_plan: str = Field(..., min_length=5)
    estimated_delay: str = Field(..., min_length=1)
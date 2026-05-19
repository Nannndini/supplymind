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
import sys
import os
import random
from datetime import datetime
from database import suppliers_collection, inventory_collection, contracts_collection, alerts_collection, users_collection
from models import supplier_model, inventory_model, contract_model
from auth import hash_password

CATEGORIES = ["Packaging", "Raw Material", "Printing", "Electronics", "Logistics", "Chemicals", "Hardware"]
LOCATIONS = ["Mumbai", "Chennai", "Hyderabad", "Bangalore", "Delhi", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat"]
ITEMS = {
    "Packaging": ["plastic caps", "bottles", "cardboard boxes", "bubble wrap", "crates"],
    "Raw Material": ["plastic granules", "steel coils", "aluminum sheets", "copper wire", "resins"],
    "Printing": ["labels", "stickers", "user manuals", "barcodes", "cartons"],
    "Electronics": ["resistors", "capacitors", "microcontrollers", "PCBs", "connectors"],
    "Logistics": ["shipping pallets", "cargo containers", "strapping bands", "shrink wrap"],
    "Chemicals": ["solvents", "adhesives", "colorants", "catalysts", "coatings"],
    "Hardware": ["screws", "bolts", "nuts", "brackets", "fasteners"]
}

def generate_synthetic_data(count=500):
    suppliers = []
    inventory = []
    contracts = []
    
    print(f"Generating {count} synthetic suppliers, inventory items, and contracts...")
    
    for i in range(1, count + 1):
        category = random.choice(CATEGORIES)
        location = random.choice(LOCATIONS)
        name = f"SynthSupplier_{i}_{location}"
        email = f"contact@{name.lower().replace('_', '')}.com"
        items_supplied = random.sample(ITEMS[category], k=random.randint(1, 2))
        
        # Supplier doc
        sup = supplier_model(name, location, category, email, items_supplied)
        suppliers.append(sup)
        
        # Inventory docs
        for item in items_supplied:
            inv = inventory_model(
                item_name=item,
                supplier_name=name,
                quantity=random.randint(1000, 10000),
                unit="units" if category not in ["Raw Material", "Chemicals"] else "kg",
                reorder_threshold=random.randint(200, 1500),
                days_remaining=random.randint(2, 25)
            )
            inventory.append(inv)
            
        # Contract doc
        contract_text = f"""
Delivery term: FOB {location}. {name} agrees to supply {', '.join(items_supplied)} to the Buyer within a lead time of {random.randint(3, 7)} business days.
FORCE MAJEURE: Excuses performance delays caused by catastrophic fire, union strikes, severe cyclones, coastal flooding, or municipal protests in {location}, provided notice is sent immediately.
LATE PENALTY: A late penalty of {random.uniform(1.0, 3.0):.1f}% per week will be applied for delays, capped at 10% of total shipment value.
"""
        con = contract_model(
            supplier_name=name,
            contract_id=f"CON-SYN-{i:03d}-2026",
            effective_date="2026-01-01",
            expiration_date="2027-12-31",
            contract_text=contract_text
        )
        contracts.append(con)
        
    return suppliers, inventory, contracts

def seed_db():
    print("🧹 Cleaning database collections...")
    suppliers_collection.delete_many({})
    inventory_collection.delete_many({})
    contracts_collection.delete_many({})
    alerts_collection.delete_many({})
    users_collection.delete_many({})
    
    suppliers, inventory, contracts = generate_synthetic_data(500)
    
    print("💾 Saving synthetic data to MongoDB...")
    try:
        suppliers_collection.insert_many(suppliers)
        inventory_collection.insert_many(inventory)
        contracts_collection.insert_many(contracts)
        
        # Seed default user
        default_user = {
            "username": "admin",
            "password_hash": hash_password("admin123")
        }
        users_collection.insert_one(default_user)
        print("👤 Seeded default user (admin/admin123) successfully.")
        
        if len(sys.argv) > 1 and sys.argv[1] == "--populate-embeddings":
            print("🔄 Generating embeddings for 500+ items (this will take a while and consumes API quota)...")
            from database import populate_embeddings
            populate_embeddings()
        else:
            print("⏭️ Skipping embedding generation to avoid Gemini API limit exhaustion. Run with '--populate-embeddings' if required.")
            
        print("🎉 Successfully seeded 500+ synthetic suppliers, inventory, and contracts!")
    except Exception as e:
        print(f"❌ Error seeding database: {e}")

if __name__ == "__main__":
    seed_db()

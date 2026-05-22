from database import suppliers_collection, inventory_collection, contracts_collection, alerts_collection, populate_embeddings
from models import supplier_model, inventory_model, contract_model

# Clear collections for clean seeding
print("🧹 Cleaning existing collections...")
suppliers_collection.delete_many({})
inventory_collection.delete_many({})
contracts_collection.delete_many({})
alerts_collection.delete_many({})

suppliers = [
    supplier_model("RajPlastics", "Mumbai", "Packaging", "raj@rajplastics.com", ["plastic caps", "bottles"]),
    supplier_model("ChennaiPolymers", "Chennai", "Raw Material", "info@chennaipolymers.com", ["plastic granules"]),
    supplier_model("HydroLabels", "Hyderabad", "Printing", "contact@hydrolabels.com", ["labels", "stickers"]),
]

inventory = [
    inventory_model("plastic caps", "RajPlastics", 5000, "units", 1000, 4),
    inventory_model("plastic granules", "ChennaiPolymers", 2000, "kg", 500, 8),
    inventory_model("labels", "HydroLabels", 10000, "units", 2000, 12),
]

contracts = [
    contract_model(
        supplier_name="RajPlastics",
        contract_id="CON-RAJ-2026",
        effective_date="2026-01-01",
        expiration_date="2027-12-31",
        contract_text=(
            "Delivery term: FOB Destination. RajPlastics agrees to supply plastic caps and bottles to the Buyer "
            "within a lead time of 5 business days from order confirmation. "
            "FORCE MAJEURE: Neither party shall be liable for failure to perform its obligations if such failure "
            "is due to acts of God, including but not limited to severe flooding, cyclones, earthquakes, storms, "
            "fires, droughts, or government-mandated shutdowns in the Mumbai region, provided written notice is "
            "sent within 48 hours of the event. "
            "LATE PENALTY: In the event of delivery delay exceeding the 5-day lead time, RajPlastics shall incur "
            "a penalty of 1.5% of the delayed order value per week, up to a maximum cap of 15% of the total order value."
        )
    ),
    contract_model(
        supplier_name="ChennaiPolymers",
        contract_id="CON-CHE-2026",
        effective_date="2026-01-01",
        expiration_date="2027-12-31",
        contract_text=(
            "Delivery term: Ex Works (EXW) Chennai. ChennaiPolymers agrees to supply plastic granules to the Buyer "
            "with a standard lead time of 7 business days from order placement. "
            "FORCE MAJEURE: ChennaiPolymers is excused from liability for delays caused by strikes, labour unrest, "
            "union protests, severe cyclones, coastal flooding, or electricity grid shutdowns in Chennai, provided "
            "written notice is given to the Buyer immediately within 24 hours. "
            "LATE PENALTY: A late penalty of 2.0% of the total shipment value will be applied for every 3 days of delay, "
            "capped at 10% of the total contract value."
        )
    ),
    contract_model(
        supplier_name="HydroLabels",
        contract_id="CON-HYD-2026",
        effective_date="2026-01-01",
        expiration_date="2027-12-31",
        contract_text=(
            "Delivery term: FOB Destination. HydroLabels agrees to supply printed labels and stickers within a lead "
            "time of 4 business days from digital proof approval. "
            "FORCE MAJEURE: Excuses performance delays caused by catastrophic fire, power outages, local municipal "
            "protests, strikes, shutdowns, or drought-related water shortages in Hyderabad affecting printing facilities, "
            "provided notice is sent within 72 hours. "
            "LATE PENALTY: HydroLabels agrees to a penalty of 1.0% per day of delay, up to a maximum of 12% of the "
            "affected purchase order value."
        )
    )
]

try:
    r1 = suppliers_collection.insert_many(suppliers)
    print("✅ Suppliers inserted:", r1.inserted_ids)
    
    r2 = inventory_collection.insert_many(inventory)
    print("✅ Inventory inserted:", r2.inserted_ids)
    
    r3 = contracts_collection.insert_many(contracts)
    print("✅ Contracts inserted:", r3.inserted_ids)
    
    print("🔄 Generating embeddings...")
    populate_embeddings()
    print("🎉 Seed data populated successfully!")
except Exception as e:
    print("❌ Error during seeding:", e)
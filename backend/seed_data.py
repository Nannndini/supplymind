from database import suppliers_collection, inventory_collection
from models import supplier_model, inventory_model

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

try:
    r1 = suppliers_collection.insert_many(suppliers)
    print("Suppliers inserted:", r1.inserted_ids)
    r2 = inventory_collection.insert_many(inventory)
    print("Inventory inserted:", r2.inserted_ids)
    print("✅ Seed data inserted")
except Exception as e:
    print("❌ Error:", e)
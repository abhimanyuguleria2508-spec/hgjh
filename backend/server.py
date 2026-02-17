from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    serial_number: str
    issuer_name: str
    issued_to_name: str
    item_type: str
    location: str
    status: str  # "Serviceable", "Pending Repair", "Beyond Economic Repair"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItemCreate(BaseModel):
    serial_number: str
    issuer_name: str
    issued_to_name: str
    item_type: str
    location: str
    status: str

class InventoryItemUpdate(BaseModel):
    issuer_name: Optional[str] = None
    issued_to_name: Optional[str] = None
    item_type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "Kalichindi QR Inventory System API"}

@api_router.post("/items", response_model=InventoryItem)
async def create_item(input: InventoryItemCreate):
    # Check if serial number already exists
    existing = await db.inventory_items.find_one({"serial_number": input.serial_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already exists")
    
    item_dict = input.model_dump()
    item_obj = InventoryItem(**item_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.inventory_items.insert_one(doc)
    return item_obj

@api_router.get("/items", response_model=List[InventoryItem])
async def get_items(
    status: Optional[str] = None,
    item_type: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    
    if status:
        query['status'] = status
    if item_type:
        query['item_type'] = item_type
    if search:
        query['$or'] = [
            {'serial_number': {'$regex': search, '$options': 'i'}},
            {'issuer_name': {'$regex': search, '$options': 'i'}},
            {'issued_to_name': {'$regex': search, '$options': 'i'}},
            {'location': {'$regex': search, '$options': 'i'}}
        ]
    
    items = await db.inventory_items.find(query, {"_id": 0}).sort('created_at', -1).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    
    return items

@api_router.get("/items/{serial_number}", response_model=InventoryItem)
async def get_item(serial_number: str):
    item = await db.inventory_items.find_one({"serial_number": serial_number}, {"_id": 0})
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    
    return item

@api_router.put("/items/{serial_number}", response_model=InventoryItem)
async def update_item(serial_number: str, input: InventoryItemUpdate):
    item = await db.inventory_items.find_one({"serial_number": serial_number}, {"_id": 0})
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.inventory_items.update_one(
        {"serial_number": serial_number},
        {"$set": update_data}
    )
    
    # Fetch updated item
    updated_item = await db.inventory_items.find_one({"serial_number": serial_number}, {"_id": 0})
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(updated_item.get('created_at'), str):
        updated_item['created_at'] = datetime.fromisoformat(updated_item['created_at'])
    if isinstance(updated_item.get('updated_at'), str):
        updated_item['updated_at'] = datetime.fromisoformat(updated_item['updated_at'])
    
    return updated_item

@api_router.delete("/items/{serial_number}")
async def delete_item(serial_number: str):
    result = await db.inventory_items.delete_one({"serial_number": serial_number})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted successfully"}

@api_router.get("/stats")
async def get_stats():
    total_items = await db.inventory_items.count_documents({})
    serviceable = await db.inventory_items.count_documents({"status": "Serviceable"})
    pending_repair = await db.inventory_items.count_documents({"status": "Pending Repair"})
    beyond_repair = await db.inventory_items.count_documents({"status": "Beyond Economic Repair"})
    
    return {
        "total_items": total_items,
        "serviceable": serviceable,
        "pending_repair": pending_repair,
        "beyond_repair": beyond_repair
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
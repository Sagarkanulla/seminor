from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import secrets
import string
from datetime import datetime
import json

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

# WebSocket connection manager for real-time messaging
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass

manager = ConnectionManager()

# Models
class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = Field(default_factory=lambda: ''.join(secrets.choice(string.digits) for _ in range(6)))
    password: str = Field(default_factory=lambda: ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8)))
    name: str
    creator_id: str
    creator_role: str = "faculty"  # faculty or student
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    participants: List[str] = Field(default_factory=list)

class CreateRoomRequest(BaseModel):
    name: str
    creator_name: str
    creator_role: str = "faculty"

class JoinRoomRequest(BaseModel):
    room_id: str
    password: str
    user_name: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    user_id: str
    user_name: str
    content: str
    message_type: str = "text"  # text, resource, file
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_anonymous: bool = True
    can_edit: bool = False  # Only faculty can edit messages
    is_deleted: bool = False

class SendMessageRequest(BaseModel):
    room_id: str
    user_id: str
    user_name: str
    content: str
    message_type: str = "text"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str  # faculty or student
    current_room: Optional[str] = None
    joined_at: datetime = Field(default_factory=datetime.utcnow)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Seminar Doubt Room API"}

@api_router.post("/rooms/create")
async def create_room(request: CreateRoomRequest):
    try:
        # Create user
        creator = User(
            name=request.creator_name,
            role=request.creator_role
        )
        await db.users.insert_one(creator.dict())
        
        # Create room
        room = Room(
            name=request.name,
            creator_id=creator.id,
            creator_role=request.creator_role,
            participants=[creator.id]
        )
        
        await db.rooms.insert_one(room.dict())
        
        return {
            "success": True,
            "room": {
                "room_id": room.room_id,
                "password": room.password,
                "name": room.name,
                "creator_id": creator.id,
                "creator_name": creator.name
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/rooms/join")
async def join_room(request: JoinRoomRequest):
    try:
        # Find room by room_id and password
        room = await db.rooms.find_one({
            "room_id": request.room_id,
            "password": request.password,
            "is_active": True
        }, {"_id": 0})
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found or invalid credentials")
        
        # Create user
        user = User(
            name=request.user_name,
            role="student",  # Default role for joiners
            current_room=room["room_id"]
        )
        await db.users.insert_one(user.dict())
        
        # Add user to room participants
        await db.rooms.update_one(
            {"room_id": request.room_id},
            {"$addToSet": {"participants": user.id}}
        )
        
        return {
            "success": True,
            "user": {
                "user_id": user.id,
                "user_name": user.name,
                "role": user.role
            },
            "room": {
                "room_id": room["room_id"],
                "name": room["name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str):
    try:
        messages = await db.messages.find({
            "room_id": room_id,
            "is_deleted": False
        }, {"_id": 0}).sort("timestamp", 1).to_list(1000)
        
        return {"success": True, "messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/send")
async def send_message(request: SendMessageRequest):
    try:
        # Get user info
        user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        message = Message(
            room_id=request.room_id,
            user_id=request.user_id,
            user_name=request.user_name,
            content=request.content,
            message_type=request.message_type,
            can_edit=(user["role"] == "faculty")
        )
        
        await db.messages.insert_one(message.dict())
        
        # Broadcast to all connections in the room
        await manager.broadcast_to_room(
            {
                "type": "new_message",
                "message": message.dict()
            },
            request.room_id
        )
        
        return {"success": True, "message": message.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user_id: str):
    try:
        # Check if user is faculty
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or user["role"] != "faculty":
            raise HTTPException(status_code=403, detail="Only faculty can delete messages")
        
        # Mark message as deleted
        result = await db.messages.update_one(
            {"id": message_id},
            {"$set": {"is_deleted": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True, "message": "Message deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time messaging
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
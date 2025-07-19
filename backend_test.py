#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Seminar Doubt Room
Tests all endpoints and WebSocket functionality
"""

import requests
import json
import asyncio
import websockets
import time
from datetime import datetime
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
WS_BASE = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')

print(f"Testing backend at: {API_BASE}")
print(f"WebSocket base: {WS_BASE}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
    
    def failure(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILURES:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

results = TestResults()

def test_api_root():
    """Test API root endpoint"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                results.success("API Root Endpoint")
                return True
            else:
                results.failure("API Root Endpoint", "Missing message in response")
        else:
            results.failure("API Root Endpoint", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("API Root Endpoint", str(e))
    return False

def test_room_creation():
    """Test room creation endpoint with faculty role"""
    try:
        payload = {
            "name": "Advanced Machine Learning Seminar",
            "creator_name": "Dr. Sarah Johnson",
            "creator_role": "faculty"
        }
        
        response = requests.post(f"{API_BASE}/rooms/create", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                "room" in data and 
                "room_id" in data["room"] and 
                "password" in data["room"] and
                len(data["room"]["room_id"]) == 6 and
                len(data["room"]["password"]) == 8):
                results.success("Room Creation (Faculty)")
                return data["room"]
            else:
                results.failure("Room Creation (Faculty)", "Invalid response format")
        else:
            results.failure("Room Creation (Faculty)", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Room Creation (Faculty)", str(e))
    return None

def test_room_creation_student():
    """Test room creation endpoint with student role"""
    try:
        payload = {
            "name": "Data Structures Study Group",
            "creator_name": "Alex Chen",
            "creator_role": "student"
        }
        
        response = requests.post(f"{API_BASE}/rooms/create", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                "room" in data and 
                "room_id" in data["room"] and 
                "password" in data["room"]):
                results.success("Room Creation (Student)")
                return data["room"]
            else:
                results.failure("Room Creation (Student)", "Invalid response format")
        else:
            results.failure("Room Creation (Student)", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Room Creation (Student)", str(e))
    return None

def test_room_joining_valid(room_info):
    """Test joining room with valid credentials"""
    if not room_info:
        results.failure("Room Joining (Valid)", "No room info provided")
        return None
    
    try:
        payload = {
            "room_id": room_info["room_id"],
            "password": room_info["password"],
            "user_name": "Emma Rodriguez"
        }
        
        response = requests.post(f"{API_BASE}/rooms/join", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                "user" in data and 
                "room" in data and
                data["user"]["user_name"] == "Emma Rodriguez" and
                data["user"]["role"] == "student"):
                results.success("Room Joining (Valid Credentials)")
                return data["user"]
            else:
                results.failure("Room Joining (Valid Credentials)", "Invalid response format")
        else:
            results.failure("Room Joining (Valid Credentials)", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Room Joining (Valid Credentials)", str(e))
    return None

def test_room_joining_invalid():
    """Test joining room with invalid credentials"""
    try:
        payload = {
            "room_id": "999999",
            "password": "wrongpwd",
            "user_name": "Test User"
        }
        
        response = requests.post(f"{API_BASE}/rooms/join", json=payload, timeout=10)
        
        if response.status_code == 404:
            results.success("Room Joining (Invalid Credentials)")
            return True
        else:
            results.failure("Room Joining (Invalid Credentials)", f"Expected 404, got {response.status_code}")
    except Exception as e:
        results.failure("Room Joining (Invalid Credentials)", str(e))
    return False

def test_send_message(room_info, user_info):
    """Test sending a message to a room"""
    if not room_info or not user_info:
        results.failure("Send Message", "Missing room or user info")
        return None
    
    try:
        payload = {
            "room_id": room_info["room_id"],
            "user_id": user_info["user_id"],
            "user_name": user_info["user_name"],
            "content": "What are the key differences between supervised and unsupervised learning algorithms?",
            "message_type": "text"
        }
        
        response = requests.post(f"{API_BASE}/messages/send", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                "message" in data and
                data["message"]["content"] == payload["content"]):
                results.success("Send Message")
                return data["message"]
            else:
                results.failure("Send Message", "Invalid response format")
        else:
            results.failure("Send Message", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Send Message", str(e))
    return None

def test_get_room_messages(room_info):
    """Test retrieving messages from a room"""
    if not room_info:
        results.failure("Get Room Messages", "No room info provided")
        return None
    
    try:
        response = requests.get(f"{API_BASE}/rooms/{room_info['room_id']}/messages", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "messages" in data:
                results.success("Get Room Messages")
                return data["messages"]
            else:
                results.failure("Get Room Messages", "Invalid response format")
        else:
            results.failure("Get Room Messages", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Get Room Messages", str(e))
    return None

def test_delete_message_faculty(message_info, faculty_user_id):
    """Test message deletion by faculty"""
    if not message_info or not faculty_user_id:
        results.failure("Delete Message (Faculty)", "Missing message or faculty info")
        return False
    
    try:
        response = requests.delete(
            f"{API_BASE}/messages/{message_info['id']}?user_id={faculty_user_id}", 
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                results.success("Delete Message (Faculty)")
                return True
            else:
                results.failure("Delete Message (Faculty)", "Invalid response format")
        else:
            results.failure("Delete Message (Faculty)", f"Status code: {response.status_code}")
    except Exception as e:
        results.failure("Delete Message (Faculty)", str(e))
    return False

def test_delete_message_student(message_info, student_user_id):
    """Test message deletion by student (should fail)"""
    if not message_info or not student_user_id:
        results.failure("Delete Message (Student Forbidden)", "Missing message or student info")
        return False
    
    try:
        response = requests.delete(
            f"{API_BASE}/messages/{message_info['id']}?user_id={student_user_id}", 
            timeout=10
        )
        
        if response.status_code == 403:
            results.success("Delete Message (Student Forbidden)")
            return True
        else:
            results.failure("Delete Message (Student Forbidden)", f"Expected 403, got {response.status_code}")
    except Exception as e:
        results.failure("Delete Message (Student Forbidden)", str(e))
    return False

async def test_websocket_connection(room_id):
    """Test WebSocket connection to a room"""
    try:
        ws_url = f"{WS_BASE}/ws/{room_id}"
        print(f"Connecting to WebSocket: {ws_url}")
        
        # Remove timeout parameter that's causing issues
        async with websockets.connect(ws_url) as websocket:
            # Connection successful
            results.success("WebSocket Connection")
            
            # Test keeping connection alive for a few seconds
            await asyncio.sleep(2)
            
            # Check if connection is still alive
            if not websocket.closed:
                results.success("WebSocket Connection Stability")
                return True
            else:
                results.failure("WebSocket Connection Stability", "Connection closed unexpectedly")
                
    except Exception as e:
        results.failure("WebSocket Connection", str(e))
    return False

def run_websocket_test(room_id):
    """Run WebSocket test in asyncio event loop"""
    try:
        return asyncio.run(test_websocket_connection(room_id))
    except Exception as e:
        results.failure("WebSocket Test Runner", str(e))
        return False

def main():
    """Run all backend tests"""
    print("🚀 Starting Seminar Doubt Room Backend API Tests")
    print(f"Timestamp: {datetime.now()}")
    print("-" * 60)
    
    # Test 1: API Root
    test_api_root()
    
    # Test 2: Room Creation (Faculty)
    faculty_room = test_room_creation()
    
    # Test 3: Room Creation (Student)
    student_room = test_room_creation_student()
    
    # Test 4: Room Joining (Valid)
    student_user = test_room_joining_valid(faculty_room)
    
    # Test 5: Room Joining (Invalid)
    test_room_joining_invalid()
    
    # Test 6: Send Message
    message = test_send_message(faculty_room, student_user)
    
    # Test 7: Get Room Messages
    messages = test_get_room_messages(faculty_room)
    
    # Test 8: Send another message for deletion test
    if faculty_room and student_user:
        delete_test_message = test_send_message(faculty_room, student_user)
        
        # Test 9: Delete Message (Student - should fail)
        if delete_test_message:
            test_delete_message_student(delete_test_message, student_user["user_id"])
        
        # Test 10: Delete Message (Faculty - should succeed)
        # First create a faculty user by getting creator info from room
        if delete_test_message and faculty_room.get("creator_id"):
            test_delete_message_faculty(delete_test_message, faculty_room["creator_id"])
    
    # Test 11: WebSocket Connection
    if faculty_room:
        run_websocket_test(faculty_room["room_id"])
    
    # Print final results
    success = results.summary()
    
    if success:
        print("\n🎉 All backend tests passed! Backend is working correctly.")
    else:
        print(f"\n⚠️  {results.failed} test(s) failed. Backend needs attention.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
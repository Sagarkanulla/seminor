import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for managing user state
const UserContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  return (
    <UserContext.Provider value={{ user, setUser, currentRoom, setCurrentRoom }}>
      <div className="App min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {!user ? (
          <WelcomePage />
        ) : !currentRoom ? (
          <RoomSelectionPage />
        ) : currentRoom.active ? (
          <ChatRoom />
        ) : (
          <RoomSelectionPage />
        )}
      </div>
    </UserContext.Provider>
  );
}

// Welcome page component
const WelcomePage = () => {
  const { setUser, setCurrentRoom } = React.useContext(UserContext);
  const [activeTab, setActiveTab] = useState("join");
  const [loading, setLoading] = useState(false);

  // Create Room Form
  const [createForm, setCreateForm] = useState({
    name: "",
    creator_name: "",
    creator_role: "faculty"
  });

  // Join Room Form  
  const [joinForm, setJoinForm] = useState({
    room_id: "",
    password: "",
    user_name: ""
  });

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.creator_name) return;
    
    setLoading(true);
    try {
      console.log("Creating room with data:", createForm);
      const response = await axios.post(`${API}/rooms/create`, createForm);
      console.log("Room creation response:", response.data);
      
      if (response.data.success) {
        const { room } = response.data;
        console.log("Setting user and room:", {
          user: {
            user_id: room.creator_id,
            user_name: room.creator_name,
            role: createForm.creator_role
          },
          room: room
        });
        
        setUser({
          user_id: room.creator_id,
          user_name: room.creator_name,
          role: createForm.creator_role
        });
        setCurrentRoom(room);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    }
    setLoading(false);
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinForm.room_id || !joinForm.password || !joinForm.user_name) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/rooms/join`, joinForm);
      if (response.data.success) {
        const { user, room } = response.data;
        setUser(user);
        setCurrentRoom(room);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please check your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Seminar Doubt Room</h1>
          <p className="text-gray-600">Connect, Ask, Learn Together</p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "join" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("join")}
          >
            Join Room
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "create" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("create")}
          >
            Create Room
          </button>
        </div>

        {activeTab === "join" ? (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter 6-digit room ID"
                value={joinForm.room_id}
                onChange={(e) => setJoinForm({...joinForm, room_id: e.target.value})}
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter room password"
                value={joinForm.password}
                onChange={(e) => setJoinForm({...joinForm, password: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                value={joinForm.user_name}
                onChange={(e) => setJoinForm({...joinForm, user_name: e.target.value})}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seminar/Room Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Data Structures Seminar"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                value={createForm.creator_name}
                onChange={(e) => setCreateForm({...createForm, creator_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={createForm.creator_role}
                onChange={(e) => setCreateForm({...createForm, creator_role: e.target.value})}
              >
                <option value="faculty">Faculty/Coordinator</option>
                <option value="student">Student</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Room Selection Page (shows room details after creation)
const RoomSelectionPage = () => {
  const { user, currentRoom, setCurrentRoom } = React.useContext(UserContext);
  
  const proceedToChat = () => {
    // This will trigger the ChatRoom component to render
    setCurrentRoom({...currentRoom, active: true});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Room Created Successfully!</h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="font-semibold text-lg text-gray-800 mb-4">{currentRoom.name}</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Room ID:</span>
                <span className="font-mono text-lg font-bold text-blue-600">{currentRoom.room_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Password:</span>
                <span className="font-mono text-lg font-bold text-green-600">{currentRoom.password}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Share these credentials with your students so they can join the room.
          </p>
        </div>
        
        <button
          onClick={proceedToChat}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Enter Room
        </button>
      </div>
    </div>
  );
};

// Chat Room Component
const ChatRoom = () => {
  const { user, currentRoom } = React.useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API}/rooms/${currentRoom.room_id}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const setupWebSocket = () => {
    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    wsRef.current = new WebSocket(`${wsUrl}/ws/${currentRoom.room_id}`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        setMessages(prev => [...prev, data.message]);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/messages/send`, {
        room_id: currentRoom.room_id,
        user_id: user.user_id,
        user_name: user.user_name,
        content: newMessage.trim(),
        message_type: "text"
      });

      if (response.data.success) {
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{currentRoom.name}</h1>
            <p className="text-sm text-gray-600">Room ID: {currentRoom.room_id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user.user_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {message.is_anonymous ? "Anonymous" : message.user_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-gray-800 leading-relaxed">{message.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-6">
        <form onSubmit={sendMessage} className="flex space-x-4">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ask / Doubt / Type anything here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading || !newMessage.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
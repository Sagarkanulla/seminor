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
  const [activeTab, setActiveTab] = useState("create");
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
    console.log("Create room function called!");
    console.log("Form data:", createForm);
    
    if (!createForm.name || !createForm.creator_name) {
      console.log("Form validation failed");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Making API request to:", `${API}/rooms/create`);
      const response = await axios.post(`${API}/rooms/create`, createForm);
      console.log("API response:", response.data);
      
      if (response.data.success) {
        const { room } = response.data;
        console.log("Room created successfully:", room);
        
        const userData = {
          user_id: room.creator_id,
          user_name: room.creator_name,
          role: createForm.creator_role
        };
        console.log("Setting user:", userData);
        console.log("Setting room:", room);
        
        setUser(userData);
        setCurrentRoom(room);
      } else {
        console.log("API returned success=false");
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      console.error("Error details:", error.response?.data);
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
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file type. Please upload PDF, DOC, PPT, TXT, or image files.");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target.result;
        
        const response = await axios.post(`${API}/messages/send`, {
          room_id: currentRoom.room_id,
          user_id: user.user_id,
          user_name: user.user_name,
          content: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileContent: base64Content
          }),
          message_type: "file"
        });

        if (response.data.success) {
          // Clear the file input
          event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Please try again.");
    }
    setUploading(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (message) => {
    return message.user_id === user.user_id;
  };

  const renderMessage = (message) => {
    const isMine = isMyMessage(message);
    
    if (message.message_type === "file") {
      const fileData = JSON.parse(message.content);
      const isImage = fileData.fileType.startsWith('image/');
      
      return (
        <div key={message.id} className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
            isMine 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : 'bg-white border rounded-bl-sm'
          } shadow-md`}>
            <div className="flex items-center space-x-2">
              {isImage ? (
                <img 
                  src={fileData.fileContent} 
                  alt={fileData.fileName}
                  className="max-w-full max-h-48 rounded-lg cursor-pointer"
                  onClick={() => window.open(fileData.fileContent, '_blank')}
                />
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isMine ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    📎
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
                      {fileData.fileName}
                    </p>
                    <p className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {(fileData.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = fileData.fileContent;
                      link.download = fileData.fileName;
                      link.click();
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      isMine 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Download
                  </button>
                </>
              )}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                {!message.is_anonymous && !isMine ? message.user_name : ''}
              </span>
              <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isMine 
            ? 'bg-blue-500 text-white rounded-br-sm' 
            : 'bg-white border rounded-bl-sm'
        } shadow-md`}>
          <p className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </p>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
              {!message.is_anonymous && !isMine ? message.user_name : ''}
            </span>
            <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{currentRoom.name}</h1>
            <p className="text-xs text-gray-500">Room ID: {currentRoom.room_id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user.user_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\"%3E%3Cg fill=\"%23f3f4f6\" fill-opacity=\"0.1\"%3E%3Cpolygon points=\"10 0 20 10 10 20 0 10\"/%3E%3C/g%3E%3C/svg%3E')"}}>
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
          <div className="space-y-2">
            {messages.map(renderMessage)}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            disabled={uploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            className="hidden"
          />

          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Ask / Doubt / Type anything here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          
          <button
            type="submit"
            className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading || (!newMessage.trim() && !uploading)}
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {uploading && (
          <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading file...
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Users, 
  MessageCircle, 
  Settings, 
  Share2,
  Calendar,
  Clock,
  Star,
  Award,
  DollarSign,
  FileText,
  Download,
  Camera,
  Phone,
  PhoneOff,
  MoreVertical,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const WebinarHost = ({ sessionId, onClose }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // main, chat, participants, settings
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({
    title: 'React Advanced Workshop',
    duration: '2 hours',
    participants: 12,
    maxParticipants: 50,
    price: 25,
    currency: 'USD'
  });

  const videoRef = useRef(null);
  const chatRef = useRef(null);

  // Mock participants data
  useEffect(() => {
    setParticipants([
      { id: 1, name: 'John Doe', avatar: '/avatars/john.jpg', isHost: true, isSpeaking: true, isMuted: false },
      { id: 2, name: 'Jane Smith', avatar: '/avatars/jane.jpg', isHost: false, isSpeaking: false, isMuted: true },
      { id: 3, name: 'Mike Johnson', avatar: '/avatars/mike.jpg', isHost: false, isSpeaking: false, isMuted: false },
      { id: 4, name: 'Sarah Wilson', avatar: '/avatars/sarah.jpg', isHost: false, isSpeaking: false, isMuted: false },
      { id: 5, name: 'David Brown', avatar: '/avatars/david.jpg', isHost: false, isSpeaking: false, isMuted: true },
    ]);

    setChatMessages([
      { id: 1, sender: 'John Doe', message: 'Welcome everyone to the React Advanced Workshop!', timestamp: '10:00 AM', isHost: true },
      { id: 2, sender: 'Jane Smith', message: 'Excited to learn!', timestamp: '10:01 AM', isHost: false },
      { id: 3, sender: 'Mike Johnson', message: 'Can we start with hooks?', timestamp: '10:02 AM', isHost: false },
      { id: 4, sender: 'John Doe', message: 'Absolutely! Let\'s dive into React Hooks.', timestamp: '10:03 AM', isHost: true },
    ]);
  }, []);

  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleAudio = () => setIsAudioOn(!isAudioOn);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const toggleRecording = () => setIsRecording(!isRecording);

  const handleEndSession = () => {
    if (confirm('Are you sure you want to end this session?')) {
      onClose();
    }
  };

  const renderMainView = () => (
    <div className="flex-1 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideoOn ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <Camera size={64} className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Your Video</h2>
                <p className="text-lg opacity-75">Camera is active</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-white text-center">
                <VideoOff size={64} className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Camera Off</h2>
                <p className="text-lg opacity-75">Click video button to enable</p>
              </div>
            </div>
          )}
        </div>

        {/* Session Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <h3 className="font-semibold">{sessionInfo.title}</h3>
          <div className="flex items-center gap-2 text-sm opacity-75">
            <Clock size={14} />
            <span>{sessionInfo.duration}</span>
            <Users size={14} />
            <span>{sessionInfo.participants}/{sessionInfo.maxParticipants}</span>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">REC</span>
          </div>
        )}

        {/* Screen Share Indicator */}
        {isScreenSharing && (
          <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-lg flex items-center gap-2">
            <Monitor size={16} />
            <span className="text-sm font-medium">Screen Sharing</span>
          </div>
        )}
      </div>

      {/* Participants Grid */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {participants.slice(0, 5).map((participant) => (
          <div key={participant.id} className="relative">
            <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center relative">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {participant.name.charAt(0)}
                </span>
              </div>
              
              {/* Status Indicators */}
              {participant.isSpeaking && (
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              )}
              {participant.isMuted && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <MicOff size={8} className="text-white" />
                </div>
              )}
              {participant.isHost && (
                <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star size={8} className="text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1 truncate">{participant.name}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatRef}>
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isHost ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              msg.isHost 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{msg.sender}</span>
                <span className="text-xs opacity-75">{msg.timestamp}</span>
              </div>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderParticipantsView = () => (
    <div className="flex-1 p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Participants ({participants.length})</h3>
        <button className="text-blue-500 text-sm">Invite</button>
      </div>
      
      {participants.map((participant) => (
        <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {participant.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{participant.name}</p>
              <p className="text-sm text-gray-500">
                {participant.isHost ? 'Host' : 'Participant'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {participant.isMuted && <MicOff size={16} className="text-red-500" />}
            {participant.isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
            <button className="p-1 hover:bg-gray-200 rounded">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettingsView = () => (
    <div className="flex-1 p-4 space-y-4">
      <h3 className="text-lg font-semibold">Session Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Session Title</label>
          <input
            type="text"
            value={sessionInfo.title}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            onChange={(e) => setSessionInfo({...sessionInfo, title: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Max Participants</label>
          <input
            type="number"
            value={sessionInfo.maxParticipants}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            onChange={(e) => setSessionInfo({...sessionInfo, maxParticipants: parseInt(e.target.value)})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Session Price</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={sessionInfo.price}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setSessionInfo({...sessionInfo, price: parseFloat(e.target.value)})}
            />
            <select
              value={sessionInfo.currency}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setSessionInfo({...sessionInfo, currency: e.target.value})}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Permissions</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              Allow participants to unmute themselves
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              Allow screen sharing
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Require approval to join
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Webinar Session</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Today, 2:00 PM</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} />
            </button>
            <button 
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              End Session
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Main View */}
          <div className="flex-1 flex flex-col">
            {currentView === 'main' && renderMainView()}
            {currentView === 'chat' && renderChatView()}
            {currentView === 'participants' && renderParticipantsView()}
            {currentView === 'settings' && renderSettingsView()}
          </div>

          {/* Right Panel - Controls */}
          <div className="w-80 bg-gray-50 border-l">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
              
              {/* Video/Audio Controls */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={toggleVideo}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${
                    isVideoOn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                  {isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
                </button>
                
                <button
                  onClick={toggleAudio}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${
                    isAudioOn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                  {isAudioOn ? 'Mute' : 'Unmute'}
                </button>
                
                <button
                  onClick={toggleScreenShare}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${
                    isScreenSharing ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <Monitor size={20} />
                  {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
              </div>

              {/* Session Actions */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={toggleRecording}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${
                    isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-700 rounded-lg">
                  <Share2 size={20} />
                  Share Session Link
                </button>
              </div>

              {/* Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView('main')}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${
                    currentView === 'main' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <Video size={16} />
                  Main View
                </button>
                
                <button
                  onClick={() => setCurrentView('chat')}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${
                    currentView === 'chat' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <MessageCircle size={16} />
                  Chat
                </button>
                
                <button
                  onClick={() => setCurrentView('participants')}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${
                    currentView === 'participants' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <Users size={16} />
                  Participants
                </button>
                
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${
                    currentView === 'settings' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarHost; 
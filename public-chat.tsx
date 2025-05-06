import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { useWebSocketStore } from "@/lib/websocket";
import { sendWebSocketMessage } from "@/lib/websocket-client";
import { User } from "@shared/schema";
import { getInitials } from "@/lib/utils";

interface ChatMessage {
  id: string;
  userId: number;
  user: User;
  content: string;
  timestamp: Date;
}

export default function PublicChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isConnected = useWebSocketStore(state => state.isConnected);
  
  // Listen for websocket public chat messages
  useEffect(() => {
    const handleNewPublicMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'public_chat') {
          const payload = data.payload;
          
          setChatMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            userId: payload.user.id,
            user: payload.user,
            content: payload.content,
            timestamp: new Date()
          }]);
          
          // Add user to participants if not already there
          setParticipants(prev => {
            if (!prev.find(p => p.id === payload.user.id)) {
              return [...prev, payload.user];
            }
            return prev;
          });
        }
        else if (data.type === 'public_chat_join') {
          // Someone joined the chat
          const newUser = data.payload.user;
          if (newUser && !participants.find(p => p.id === newUser.id)) {
            setParticipants(prev => [...prev, newUser]);
            
            // Add system message
            setChatMessages(prev => [...prev, {
              id: `system-${Date.now()}`,
              userId: -1, // System message
              user: { id: -1, username: 'System', displayName: 'System' } as User,
              content: `${newUser.displayName} joined the chat`,
              timestamp: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error("Error parsing public chat message:", error);
      }
    };
    
    // Get the WebSocket instance
    const ws = (window as any).webSocket;
    if (ws) {
      ws.addEventListener("message", handleNewPublicMessage);
      
      // Let the server know we joined the public chat
      if (user) {
        sendWebSocketMessage('public_chat_join', { userId: user.id });
      }
    }
    
    return () => {
      if (ws) {
        ws.removeEventListener("message", handleNewPublicMessage);
      }
    };
  }, [user, participants]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !isConnected) return;
    
    // Send message via WebSocket
    sendWebSocketMessage('public_chat', {
      userId: user.id,
      content: message.trim()
    });
    
    setMessage("");
  };
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Participants sidebar */}
        <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-lg">Public Chat</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {participants.length} participants
            </p>
          </div>
          <div className="p-2">
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src={participant.avatar || ''} alt={participant.displayName} />
                  <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{participant.displayName}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
          {/* Chat header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Public Chat Room</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    Disconnected
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-end space-x-2 ${
                    msg.userId === user.id ? 'justify-end' : 'justify-start'
                  } ${msg.userId === -1 ? 'justify-center' : ''}`}
                >
                  {msg.userId !== user.id && msg.userId !== -1 && (
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={msg.user.avatar || ''} alt={msg.user.displayName} />
                      <AvatarFallback>{getInitials(msg.user.displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  {msg.userId === -1 ? (
                    <div className="py-1 px-3 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`py-2 px-3 rounded-lg max-w-[70%] ${
                      msg.userId === user.id 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 rounded-tl-none'
                    }`}>
                      {msg.userId !== user.id && (
                        <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                          {msg.user.displayName}
                        </p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-xs mt-1 block ${
                        msg.userId === user.id ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Be the first to send a message!</p>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>
          
          {/* Chat input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <Input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-700 border-none rounded-full"
                disabled={!isConnected}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="ml-2 rounded-full"
                disabled={!message.trim() || !isConnected}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
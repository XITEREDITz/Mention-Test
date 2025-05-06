import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MessageWithUser, InsertMessage } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { sendWebSocketMessage } from "@/lib/websocket-client";

interface ChatWindowProps {
  userId1: number;
  userId2: number;
  onBack?: () => void;
}

export function ChatWindow({ userId1, userId2, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useMobile();
  
  // Fetch messages between the two users
  const { data: messages = [], isLoading, refetch } = useQuery<MessageWithUser[]>({
    queryKey: [`/api/messages/${userId1}/${userId2}`],
    enabled: !!userId1 && !!userId2
  });
  
  // Handle real-time WebSocket messages
  useEffect(() => {
    const ws = (window as any).webSocket;
    
    // Define WebSocket message handler for real-time message updates
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is a direct message for our conversation
        if (data.type === 'message' && 
            data.payload && 
            data.payload.senderId === userId2) {
          // Immediately refetch messages to show the new message
          refetch();
        }
      } catch (error) {
        console.error('Error handling WebSocket message in chat window:', error);
      }
    };
    
    // Add event listener if WebSocket is available
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleWebSocketMessage);
    }
    
    // Clean up event listener when component unmounts
    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [userId1, userId2, refetch]);
  
  // Fetch user data for the chat partner
  const { data: chatPartner } = useQuery<{
    id: number;
    username: string;
    displayName: string;
    avatar: string | null | undefined;
  }>({
    queryKey: [`/api/users/${userId2}`],
    enabled: !!userId2
  });
  
  // Mark messages as read
  useEffect(() => {
    if (userId1 && userId2 && messages.length > 0) {
      const hasUnread = messages.some(m => !m.read && m.senderId === userId2);
      
      if (hasUnread) {
        apiRequest('PUT', `/api/messages/read/${userId2}/${userId1}`, {});
      }
    }
  }, [userId1, userId2, messages]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      return apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId1}/${userId2}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${userId1}`] });
      setMessage("");
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const messageContent = message.trim();
    
    // Send through API
    sendMessageMutation.mutate({
      senderId: userId1,
      receiverId: userId2,
      content: messageContent,
      read: false
    });
    
    // Also send through WebSocket for real-time delivery
    // This helps ensure the message appears immediately for the recipient
    sendWebSocketMessage('direct_message', {
      senderId: userId1,
      receiverId: userId2,
      content: messageContent
    });
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  if (!chatPartner) return null;
  
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
        {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={chatPartner.avatar || undefined} alt={chatPartner.displayName} />
            <AvatarFallback>{chatPartner.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{chatPartner.displayName}</h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        
        <div className="ml-auto flex space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className={`flex items-end ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`py-2 px-3 rounded-lg max-w-[70%] ${
                i % 2 === 0 
                  ? 'bg-white dark:bg-gray-700 animate-pulse' 
                  : 'bg-primary animate-pulse'
              }`} style={{height: '60px', width: '200px'}}></div>
            </div>
          ))
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-end space-x-2 ${
                msg.senderId === userId1 ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.senderId !== userId1 && (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={chatPartner.avatar || undefined} alt={chatPartner.displayName} />
                  <AvatarFallback>{chatPartner.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`py-2 px-3 rounded-lg max-w-[70%] ${
                msg.senderId === userId1 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-700 rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <span className={`text-xs mt-1 block ${
                  msg.senderId === userId1 ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Input
            type="text"
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-700 border-none rounded-full"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2 rounded-full"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

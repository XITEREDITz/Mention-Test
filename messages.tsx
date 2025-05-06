import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ChatSection } from "@/components/chat/chat-section";
import { useWebSocketStore } from "@/lib/websocket";

interface MessagesProps {
  params?: {
    userId?: string;
  };
}

export default function Messages({ params }: MessagesProps) {
  const { user } = useAuth();
  const { resetMessageCount } = useWebSocketStore();
  const [, setLocation] = useLocation();
  
  const activeUserId = params?.userId ? parseInt(params.userId) : undefined;
  
  // Reset message count when viewing messages - only once when component mounts
  useEffect(() => {
    if (user) {
      resetMessageCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // only re-run when user changes
  
  if (!user) return null;
  
  const handleConversationSelect = (userId: number) => {
    setLocation(`/messages/${userId}`);
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <ChatSection 
        activeUserId={activeUserId} 
        onConversationSelect={handleConversationSelect} 
      />
    </div>
  );
}

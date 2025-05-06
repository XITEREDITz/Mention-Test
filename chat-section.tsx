import { useAuth } from "@/context/auth-context";
import { ConversationList } from "./conversation-list";
import { ChatWindow } from "./chat-window";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface ChatSectionProps {
  activeUserId?: number;
  onConversationSelect?: (userId: number) => void;
}

export function ChatSection({ activeUserId, onConversationSelect }: ChatSectionProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(activeUserId);

  if (!user) return null;

  const handleSelectConversation = (userId: number) => {
    setSelectedUserId(userId);
    if (onConversationSelect) {
      onConversationSelect(userId);
    }
  };

  if (isMobile) {
    // On mobile, show either the conversation list or the chat window
    return (
      <div className="h-full">
        {selectedUserId ? (
          <ChatWindow
            userId1={user.id}
            userId2={selectedUserId}
            onBack={() => setSelectedUserId(undefined)}
          />
        ) : (
          <ConversationList
            currentUserId={user.id}
            onSelect={handleSelectConversation}
          />
        )}
      </div>
    );
  }

  // On desktop, show both side by side
  return (
    <section className="hidden md:flex flex-col w-full h-full border-l border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex h-full">
        <ConversationList 
          currentUserId={user.id} 
          onSelect={handleSelectConversation}
          selectedUserId={selectedUserId}
        />
        
        {selectedUserId ? (
          <ChatWindow 
            userId1={user.id} 
            userId2={selectedUserId} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Select a conversation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Choose a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

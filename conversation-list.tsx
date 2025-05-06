import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  user: {
    id: number;
    username: string;
    displayName: string;
    avatar: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
    read: boolean;
  };
}

interface ConversationListProps {
  currentUserId: number;
  onSelect: (userId: number) => void;
  selectedUserId?: number;
}

export function ConversationList({ currentUserId, onSelect, selectedUserId }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: [`/api/conversations/${currentUserId}`],
    enabled: !!currentUserId
  });
  
  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(conv => 
        conv.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;
  
  // We removed the resetMessageCount effect from here since it's already in the Messages page
  // This was causing an infinite update loop
  
  return (
    <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-lg">Messages</h2>
        <Button variant="ghost" size="sm">
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div 
              key={conversation.user.id} 
              className={`flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-800 ${
                selectedUserId === conversation.user.id ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
              onClick={() => onSelect(conversation.user.id)}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conversation.user.avatar} alt={conversation.user.displayName} />
                  <AvatarFallback>{conversation.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"></span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-sm">{conversation.user.displayName}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                  </span>
                </div>
                <p className={`text-sm ${
                  !conversation.lastMessage.read && conversation.lastMessage.senderId !== currentUserId
                    ? 'font-semibold text-gray-800 dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-300'
                } truncate`}>
                  {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                  {conversation.lastMessage.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500 dark:text-gray-400">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}

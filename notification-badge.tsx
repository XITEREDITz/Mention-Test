import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useWebSocketStore } from "@/lib/websocket";

interface NotificationBadgeProps {
  type: "messages" | "notifications";
  className?: string;
}

export function NotificationBadge({ type, className }: NotificationBadgeProps) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  
  // Get unread counts from WebSocket store
  const unreadMessagesFromStore = useWebSocketStore(state => state.unreadMessages);
  const unreadNotificationsFromStore = useWebSocketStore(state => state.unreadNotifications);

  // Fetch initial counts from API
  const { data: unreadMessages } = useQuery({
    queryKey: ["/api/messages/unread", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const res = await fetch(`/api/messages/unread/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch unread messages");
      return await res.json();
    },
    enabled: !!user && type === "messages",
    refetchInterval: 30000, // Reduced polling frequency since we use WebSockets
  });

  const { data: unreadNotifications } = useQuery({
    queryKey: ["/api/notifications/unread", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const res = await fetch(`/api/notifications/unread/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch unread notifications");
      return await res.json();
    },
    enabled: !!user && type === "notifications",
    refetchInterval: 30000, // Reduced polling frequency since we use WebSockets
  });

  // Update count based on API data
  useEffect(() => {
    if (type === "messages" && unreadMessages !== undefined) {
      setCount(unreadMessages);
    } else if (type === "notifications" && unreadNotifications !== undefined) {
      setCount(unreadNotifications);
    }
  }, [type, unreadMessages, unreadNotifications]);
  
  // Update count based on WebSocket store data
  useEffect(() => {
    if (type === "messages") {
      setCount(unreadMessagesFromStore);
    } else if (type === "notifications") {
      setCount(unreadNotificationsFromStore);
    }
  }, [type, unreadMessagesFromStore, unreadNotificationsFromStore]);

  if (count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center ${className}`}
    >
      {count > 9 ? "9+" : count}
    </Badge>
  );
}
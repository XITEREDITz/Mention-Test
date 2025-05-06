import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { NotificationWithUser } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, UserPlus, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocketStore } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { resetNotificationCount } = useWebSocketStore();
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<NotificationWithUser[]>({
    queryKey: user ? [`/api/notifications/${user.id}`] : ['no-user'],
    enabled: !!user
  });
  
  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest('PUT', `/api/notifications/${user.id}/read-all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      resetNotificationCount();
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read."
      });
    }
  });
  
  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      console.log("Accepting friend request with ID:", requestId);
      return apiRequest('PUT', `/api/friend-requests/${requestId}`, { status: "accepted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${user?.id}`] });
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!"
      });
    },
    onError: (error) => {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mark all notifications as read when the page loads
  useEffect(() => {
    if (user && notifications && Array.isArray(notifications) && notifications.some((n: NotificationWithUser) => !n.read)) {
      markAllReadMutation.mutate();
    }
  }, [user, notifications]);
  
  // Reset notification count when viewing notifications
  useEffect(() => {
    resetNotificationCount();
  }, [resetNotificationCount]);
  
  if (!user) return null;
  
  const getNotificationContent = (notification: NotificationWithUser) => {
    const sender = notification.sender;
    if (!sender) return null;
    
    switch (notification.type) {
      case 'like':
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-red-100 dark:bg-red-900 p-2">
              <Heart className="h-5 w-5 text-red-500 dark:text-red-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                liked your post
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        );
        
      case 'comment':
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                commented on your post
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        );
        
      case 'follow':
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-purple-100 dark:bg-purple-900 p-2">
              <UserPlus className="h-5 w-5 text-purple-500 dark:text-purple-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                started following you
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Link href={`/profile/${sender.id}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
          </div>
        );
        
      case 'friend_request':
        console.log("Friend request notification:", notification);
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-green-100 dark:bg-green-900 p-2">
              <UserPlus className="h-5 w-5 text-green-500 dark:text-green-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                sent you a friend request
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  console.log("Accepting request with ID:", notification.entityId);
                  if (notification.entityId) {
                    acceptFriendRequestMutation.mutate(notification.entityId);
                  } else {
                    console.error("Missing entityId for friend request notification");
                    toast({
                      title: "Error",
                      description: "Could not process this request. Missing request ID.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={acceptFriendRequestMutation.isPending || !notification.entityId}
              >
                Accept
              </Button>
              <Link href={`/profile/${sender.id}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        );
        
      case 'friend_request_accepted':
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-green-100 dark:bg-green-900 p-2">
              <UserCheck className="h-5 w-5 text-green-500 dark:text-green-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                accepted your friend request
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Link href={`/profile/${sender.id}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
          </div>
        );
        
      case 'message':
        return (
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <p>
                <Link href={`/profile/${sender.id}`} className="font-semibold hover:underline">
                  {sender.displayName}
                </Link>{" "}
                sent you a message
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Link href={`/messages/${sender.id}`}>
              <Button variant="outline" size="sm">
                Reply
              </Button>
            </Link>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || !notifications || !Array.isArray(notifications) || notifications.length === 0}
        >
          Mark all as read
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center">
              <Skeleton className="w-10 h-10 rounded-full mr-4" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : notifications && Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification: NotificationWithUser) => (
            <div 
              key={notification.id} 
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${
                notification.read ? '' : 'border-l-4 border-primary'
              }`}
            >
              {getNotificationContent(notification)}
            </div>
          ))
        ) : (
          <div className="p-12 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <h3 className="font-semibold text-lg mb-2">No Notifications</h3>
            <p className="text-gray-500 dark:text-gray-400">
              You're all caught up! No new notifications at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

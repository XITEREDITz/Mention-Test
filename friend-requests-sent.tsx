import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { FriendRequest, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Clock, Check } from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

type SentFriendRequest = FriendRequest & {
  user: { 
    id: number; 
    username: string;
    displayName: string;
    avatar: string | null; 
  } | null;
};

export function FriendRequestsSent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedRequests, setExpandedRequests] = useState(false);
  
  const { data: sentRequests = [], isLoading, isError } = useQuery<SentFriendRequest[]>({
    queryKey: ['/api/friend-requests/sent'],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/friend-requests/${user.id}?isReceiver=false`);
      if (!res.ok) throw new Error('Failed to fetch sent friend requests');
      
      const requests = await res.json();
      
      // For each request, fetch the user details
      const requestsWithUsers = await Promise.all(
        requests.map(async (request: FriendRequest) => {
          const userRes = await fetch(`/api/users/${request.receiverId}`);
          const userData = userRes.ok ? await userRes.json() : null;
          return {
            ...request,
            user: userData
          };
        })
      );
      
      return requestsWithUsers;
    },
    enabled: !!user
  });
  
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('PUT', `/api/friend-requests/${requestId}`, { status: 'canceled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests/sent'] });
      toast({
        title: "Friend request canceled",
        description: "The friend request has been canceled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    }
  });
  
  const pendingRequests = sentRequests.filter(req => req.status === 'pending');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Sent Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Sent Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Failed to load sent friend requests
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (pendingRequests.length === 0) {
    return null;
  }
  
  const displayedRequests = expandedRequests ? pendingRequests : pendingRequests.slice(0, 3);
  const hasMoreRequests = pendingRequests.length > 3 && !expandedRequests;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Sent Friend Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedRequests.map((request) => (
          <div key={request.id} className="flex items-center space-x-4">
            <Link href={`/profile/${request.receiverId}`}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={request.user?.avatar || undefined} alt={request.user?.displayName} />
                <AvatarFallback>{getInitials(request.user?.displayName || "User")}</AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${request.receiverId}`}>
                <p className="font-medium truncate hover:underline cursor-pointer">
                  {request.user?.displayName || "User"}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                @{request.user?.username}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                disabled={cancelRequestMutation.isPending}
                onClick={() => cancelRequestMutation.mutate(request.id)}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <div className="flex items-center text-amber-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">Pending</span>
              </div>
            </div>
          </div>
        ))}
        
        {hasMoreRequests && (
          <Button
            variant="ghost" 
            className="w-full text-primary" 
            onClick={() => setExpandedRequests(true)}
          >
            Show all ({pendingRequests.length}) requests
          </Button>
        )}
        
        {expandedRequests && pendingRequests.length > 3 && (
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={() => setExpandedRequests(false)}
          >
            Show less
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
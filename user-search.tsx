import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { UserWithStats } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { X, Search, UserPlus, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function UserSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();
  
  // Search results query
  const { data: searchResults = [], isLoading, refetch } = useQuery<UserWithStats[]>({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || !user) return [];
      
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) {
        throw new Error('Failed to search users');
      }
      
      const users = await res.json();
      
      // Filter out the current user
      return users.filter((u: UserWithStats) => u.id !== user.id);
    },
    enabled: isSearching && !!searchQuery.trim() && !!user
  });
  
  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      if (!user) throw new Error("You must be logged in");
      return apiRequest('POST', '/api/friend-requests', { 
        senderId: user.id, 
        receiverId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send friend request: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async (followingId: number) => {
      if (!user) throw new Error("You must be logged in");
      return apiRequest('POST', '/api/follows', { 
        followerId: user.id, 
        followingId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      toast({
        title: "User followed",
        description: "You are now following this user",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to follow user: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async (followingId: number) => {
      if (!user) throw new Error("You must be logged in");
      return apiRequest('DELETE', `/api/follows/${user.id}/${followingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      toast({
        title: "User unfollowed",
        description: "You are no longer following this user",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to unfollow user: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    refetch();
  };
  
  const handleSendFriendRequest = (receiverId: number) => {
    if (sendFriendRequestMutation.isPending) return;
    sendFriendRequestMutation.mutate(receiverId);
  };
  
  const handleFollowToggle = (userId: number, isFollowing: boolean) => {
    if (followMutation.isPending || unfollowMutation.isPending) return;
    
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={!searchQuery.trim() || isLoading}>
            Search
          </Button>
        </form>
      </CardHeader>
      
      {isSearching && (
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <div key={result.id} className="flex items-center gap-3">
                <Link href={`/profile/${result.id}`}>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={result.avatar || undefined} alt={result.displayName} />
                    <AvatarFallback>{getInitials(result.displayName)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 overflow-hidden">
                  <Link href={`/profile/${result.id}`} className="font-medium hover:underline truncate block">
                    {result.displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{result.username}</p>
                </div>
                <div className="flex gap-2">
                  {result.isFriend ? (
                    <Button size="sm" variant="outline" className="flex items-center space-x-1" disabled>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Friends
                    </Button>
                  ) : result.hasPendingRequest ? (
                    <Button size="sm" variant="outline" className="flex items-center space-x-1" disabled>
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={() => handleSendFriendRequest(result.id)}
                      disabled={sendFriendRequestMutation.isPending}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Add Friend
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant={result.isFollowing ? "outline" : "default"}
                    onClick={() => handleFollowToggle(result.id, result.isFollowing || false)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                  >
                    {result.isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No users found. Try a different search term.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
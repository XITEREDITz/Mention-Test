import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { UserWithStats } from "@shared/schema";

export function FriendSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: suggestions, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ['/api/users/search', 'suggestions'],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/search?q=`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const users = await res.json();
      
      // Filter out the current user and users already following
      return users
        .filter((u: UserWithStats) => u.id !== user.id && !u.isFollowing)
        .slice(0, 3);
    },
    enabled: !!user
  });
  
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!user) throw new Error("You must be logged in");
      return apiRequest('POST', '/api/follows', { 
        followerId: user.id, 
        followingId: userId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/search', 'suggestions'] });
    }
  });
  
  const handleFollow = (userId: number) => {
    if (followMutation.isPending) return;
    followMutation.mutate(userId);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-3 space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="font-semibold">People you might know</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center">
            <Avatar className="w-12 h-12 mr-3">
              <AvatarImage src={suggestion.avatar} alt={suggestion.displayName} />
              <AvatarFallback>{suggestion.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{suggestion.displayName}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {suggestion._count?.followers 
                  ? `Followed by ${suggestion._count.followers} ${suggestion._count.followers === 1 ? 'person' : 'people'}`
                  : '@' + suggestion.username
                }
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-primary font-semibold ml-2"
              onClick={() => handleFollow(suggestion.id)}
              disabled={followMutation.isPending}
            >
              Follow
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" className="w-full text-primary text-sm">
          See More
        </Button>
      </CardFooter>
    </Card>
  );
}

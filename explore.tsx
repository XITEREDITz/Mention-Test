import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { PostWithUser, UserWithStats } from "@shared/schema";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Compass, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  
  // Fetch trending posts
  const { data: trendingPosts, isLoading: isLoadingTrending } = useQuery<PostWithUser[]>({
    queryKey: ['/api/posts?limit=10'],
    enabled: !!user
  });
  
  // Search users when query changes
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<UserWithStats[]>({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: !!searchQuery.trim()
  });
  
  if (!user) return null;
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {searchQuery ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          
          {isLoadingSearch ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`}>
                  <div className="flex items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold">{user.displayName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                    <Button variant="outline" size="sm">View Profile</Button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <Compass className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trending" className="space-y-6">
            {isLoadingTrending ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-full h-96 rounded-xl" />
                ))}
              </div>
            ) : trendingPosts && trendingPosts.length > 0 ? (
              <div className="space-y-4">
                {trendingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">No Trending Posts</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Check back later for trending content!
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array(9).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <img 
                    src={`https://source.unsplash.com/random/300x300?sig=${i}`} 
                    alt="Discover content" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="people" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={`https://source.unsplash.com/random/100x100?face&sig=${i}`} 
                      alt="Profile" 
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold">User #{i+1}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Popular account</p>
                  </div>
                  <Button variant="outline" size="sm">Follow</Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

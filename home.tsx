import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { FriendSuggestions } from "@/components/friend-suggestions";
import { FriendRequestsSent } from "@/components/friend-requests-sent";
import { ChatSection } from "@/components/chat/chat-section";
import { PostWithUser } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useMobile } from "@/hooks/use-mobile";

export default function Home() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [showChatSection, setShowChatSection] = useState(false);
  
  // Fetch feed posts
  const { data: posts = [], isLoading } = useQuery<PostWithUser[]>({
    queryKey: user ? [`/api/feed/${user.id}`] : ['feed-not-available'],
    enabled: !!user
  });
  
  // Reset chat section visibility on mobile when component mounts
  useEffect(() => {
    if (isMobile) {
      setShowChatSection(false);
    }
  }, [isMobile]);
  
  if (!user) return null;
  
  return (
    <div className="flex flex-1 h-full">
      {/* Feed Section */}
      <section className={`flex-1 overflow-y-auto pb-16 md:pb-0 ${showChatSection && !isMobile ? 'hidden md:block' : 'block'}`}>
        <Stories />
        
        <div className="space-y-4 px-4 pt-2 pb-4 md:max-w-xl lg:max-w-2xl mx-auto">
          {isLoading ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow">
                <div className="p-4 flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3 mt-1" />
                  </div>
                </div>
                <Skeleton className="w-full h-96" />
                <div className="p-4">
                  <Skeleton className="w-full h-20" />
                </div>
              </div>
            ))
          ) : posts && posts.length > 0 ? (
            <>
              {/* Friend Requests Sent */}
              <FriendRequestsSent />
              
              {posts.map((post, index) => (
                <div key={post.id}>
                  <PostCard post={post} />
                  
                  {/* Insert friend suggestions after the second post */}
                  {index === 1 && <div className="mt-4"><FriendSuggestions /></div>}
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Friend Requests Sent even when there's no posts */}
              <FriendRequestsSent />
              
              {/* Friend Suggestions */}
              <div className="mt-4">
                <FriendSuggestions />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow p-8 text-center mt-4">
                <h3 className="font-semibold text-lg">Welcome to Mention!</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Follow some users to see their posts in your feed.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Chat Section (Desktop Only) */}
      {!isMobile && (
        <div className="hidden md:block w-80">
          <ChatSection />
        </div>
      )}
    </div>
  );
}

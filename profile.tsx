import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post-card";
import { UserWithStats, PostWithUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Grid, Bookmark, Settings, UserPlus, UserCheck, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileModal } from "@/components/edit-profile-modal";

interface ProfileProps {
  params?: {
    userId?: string;
  };
}

export default function Profile({ params }: ProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const profileUserId = params?.userId ? parseInt(params.userId) : user?.id;
  const isOwnProfile = profileUserId === user?.id;
  
  // Fetch profile data
  const { data: profileUser, isLoading: isLoadingProfile } = useQuery<UserWithStats>({
    queryKey: [`/api/users/${profileUserId}`, { currentUserId: user?.id }],
    enabled: !!profileUserId && !!user
  });
  
  // Fetch user's posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery<PostWithUser[]>({
    queryKey: [`/api/posts?userId=${profileUserId}`],
    enabled: !!profileUserId
  });
  
  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profileUser) throw new Error("User not authenticated");
      
      if (profileUser.isFollowing) {
        return apiRequest('DELETE', `/api/follows/${user.id}/${profileUser.id}`, null);
      } else {
        return apiRequest('POST', '/api/follows', {
          followerId: user.id,
          followingId: profileUser.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}`, { currentUserId: user?.id }] });
      toast({
        title: profileUser?.isFollowing ? "Unfollowed" : "Followed",
        description: profileUser?.isFollowing 
          ? `You unfollowed ${profileUser?.displayName || 'this user'}`
          : `You are now following ${profileUser?.displayName || 'this user'}`,
      });
    }
  });
  
  // Friend request mutation
  const friendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profileUser) throw new Error("User not authenticated");
      
      return apiRequest('POST', '/api/friend-requests', {
        senderId: user.id,
        receiverId: profileUser.id,
        status: "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}`, { currentUserId: user?.id }] });
      toast({
        title: "Friend Request Sent",
        description: `You sent a friend request to ${profileUser?.displayName || 'this user'}`,
      });
    }
  });
  
  const handleFollowToggle = () => {
    if (followMutation.isPending) return;
    followMutation.mutate();
  };
  
  const handleFriendRequest = () => {
    if (friendRequestMutation.isPending) return;
    friendRequestMutation.mutate();
  };
  
  if (!user) return null;
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        {isLoadingProfile ? (
          <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
        ) : (
          <Avatar className="w-24 h-24 md:w-32 md:h-32">
            <AvatarImage src={profileUser?.avatar || ''} alt={profileUser?.displayName || ''} />
            <AvatarFallback>{profileUser?.displayName ? profileUser.displayName.charAt(0) : '?'}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 text-center md:text-left">
          {isLoadingProfile ? (
            <div className="space-y-4">
              <Skeleton className="h-7 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex justify-center md:justify-start gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold">{profileUser?.displayName}</h1>
                
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowEditProfile(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {profileUser?.isFriend ? (
                      <Button variant="default" size="sm" className="gap-2">
                        <UserCheck className="h-4 w-4" />
                        Friends
                      </Button>
                    ) : profileUser?.hasPendingRequest ? (
                      <Button variant="outline" size="sm" className="gap-2" disabled>
                        <UserPlus className="h-4 w-4" />
                        Request Pending
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleFriendRequest}
                        disabled={friendRequestMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Friend
                      </Button>
                    )}
                    
                    <Button
                      variant={profileUser?.isFollowing ? "outline" : "secondary"}
                      size="sm"
                      className="gap-2"
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                    >
                      {profileUser?.isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {profileUser?.bio || `@${profileUser?.username}`}
              </p>
              
              <div className="flex justify-center md:justify-start gap-6 text-sm">
                <div>
                  <span className="font-semibold">{profileUser?._count?.posts || 0}</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">posts</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser?._count?.followers || 0}</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser?._count?.following || 0}</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">following</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Profile Content Tabs */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="posts" className="gap-2">
            <Grid className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Saved
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-6">
          {isLoadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-96 rounded-xl" />
              ))}
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="font-semibold text-lg mb-2">No Posts Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isOwnProfile 
                  ? "Share your moments by creating your first post!"
                  : `${profileUser?.displayName} hasn't posted anything yet.`
                }
              </p>
              {isOwnProfile && (
                <Button className="mt-4">Create Post</Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <div className="text-center py-12">
            <h3 className="font-semibold text-lg mb-2">No Saved Items</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isOwnProfile 
                ? "Items you save will appear here."
                : "This tab is only visible to the account owner."
              }
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}

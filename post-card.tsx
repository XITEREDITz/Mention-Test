import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, FileVolume2, Play, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { PostWithUser, CommentWithUser, InsertComment } from "@shared/schema";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: PostWithUser;
}

export function PostCard({ post: initialPost }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [post, setPost] = useState<PostWithUser>(initialPost);
  const [isSaved, setIsSaved] = useState(false);
  const queryClient = useQueryClient();
  
  // Update local post state when props change
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  
  // Fetch comments for this post
  const { data: comments = [] } = useQuery<CommentWithUser[]>({
    queryKey: [`/api/comments/${post.id}`],
    enabled: !!post
  });
  
  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in");
      
      if (post.isLiked) {
        await apiRequest('DELETE', `/api/likes/${user.id}/${post.id}`);
        // Update local state optimistically
        setPost(prev => ({
          ...prev,
          isLiked: false,
          _count: {
            ...prev._count!,
            likes: (prev._count?.likes || 0) - 1
          }
        }));
      } else {
        await apiRequest('POST', '/api/likes', { userId: user.id, postId: post.id });
        // Update local state optimistically
        setPost(prev => ({
          ...prev,
          isLiked: true,
          _count: {
            ...prev._count!,
            likes: (prev._count?.likes || 0) + 1
          }
        }));
      }
    },
    onError: (error) => {
      // Revert optimistic update on error
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/feed/${user?.id}`] });
    }
  });
  
  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async (commentData: InsertComment) => {
      return apiRequest('POST', '/api/comments', commentData);
    },
    onSuccess: (data) => {
      // Update local state optimistically
      setPost(prev => ({
        ...prev,
        _count: {
          ...prev._count!,
          comments: (prev._count?.comments || 0) + 1
        }
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${post.id}`] });
      setComment("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  });
  
  const handleLike = () => {
    if (likeMutation.isPending || !user) return;
    likeMutation.mutate();
  };
  
  const handleSave = () => {
    // Toggle saved state (in a real app, this would be persisted)
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Post unsaved" : "Post saved",
      description: isSaved ? "Removed from your saved items" : "Added to your saved items",
    });
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim() || commentMutation.isPending) return;
    
    commentMutation.mutate({
      postId: post.id,
      userId: user.id,
      content: comment.trim()
    });
  };
  
  // Display only 2 comments by default, unless showAllComments is true
  const displayComments = showAllComments 
    ? comments 
    : comments.slice(0, 2);
  
  return (
    <Card className="overflow-hidden card-container mb-6 transition-all duration-300 hover:shadow-md border-none">
      <CardHeader className="p-4 pb-3 space-y-0">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3 story-avatar">
            <AvatarImage src={post.user?.avatar || undefined} alt={post.user?.displayName || ""} />
            <AvatarFallback>{post.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer">{post.user?.displayName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="relative">
        {post.mediaUrl && (
          <img 
            src={post.mediaUrl} 
            alt={post.content || "Post image"}
            className="w-full h-96 object-cover transition-transform duration-500 hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Available';
            }}
          />
        )}
        
        {post.isReel && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30"
            >
              <FileVolume2 className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 right-4 glass-card px-2 py-1 rounded-full text-xs">
              <Play className="h-3 w-3 inline mr-1" /> Reel
            </div>
          </>
        )}
        
        {post.mediaType === 'carousel' && (
          <div className="absolute bottom-4 right-4 glass-card px-2 py-1 rounded-full text-xs">
            <ImageIcon className="h-3 w-3 inline mr-1" /> 1/4
          </div>
        )}
      </div>
      
      <CardContent className="p-4 pt-3">
        <div className="flex justify-between mb-3">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="post-action-button p-0 h-auto"
              onClick={handleLike}
              disabled={likeMutation.isPending || !user}
            >
              <Heart 
                className={`h-5 w-5 mr-1 transform transition-transform active:scale-125 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span className={`${post.isLiked ? 'text-red-500' : ''}`}>{post._count?.likes || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="post-action-button p-0 h-auto"
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              <span>{post._count?.comments || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="post-action-button p-0 h-auto"
            >
              <Send className="h-5 w-5 mr-1 transform transition-transform hover:translate-x-1" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="post-action-button p-0 h-auto"
            onClick={handleSave}
          >
            <Bookmark className={`h-5 w-5 transform transition-transform hover:scale-110 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
        
        {/* Post Caption */}
        {post.content && (
          <div className="mb-3">
            <span className="font-semibold text-sm mr-2 hover:text-primary transition-colors cursor-pointer">{post.user?.displayName}</span>
            <span className="text-sm">{post.content}</span>
          </div>
        )}
        
        {/* Comments */}
        {comments.length > 2 && !showAllComments && (
          <button 
            className="text-sm text-gray-500 dark:text-gray-400 mb-2 hover:text-primary transition-colors"
            onClick={() => setShowAllComments(true)}
          >
            View all {post._count?.comments} comments
          </button>
        )}
        
        <div className="space-y-2 mb-2">
          {displayComments.map((comment) => (
            <div key={comment.id} className="flex items-start">
              <span className="font-semibold text-sm mr-2 hover:text-primary transition-colors cursor-pointer">{comment.user?.displayName}</span>
              <span className="text-sm">{comment.content}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <form onSubmit={handleAddComment} className="w-full flex items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <Input 
            type="text" 
            placeholder="Add a comment..." 
            className="modern-input flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={commentMutation.isPending || !user}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            className="modern-button text-primary font-semibold text-sm ml-2 py-1 px-3"
            disabled={!comment.trim() || commentMutation.isPending || !user}
          >
            Post
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

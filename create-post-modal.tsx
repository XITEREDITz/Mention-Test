import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Film, Camera } from "lucide-react";
import { InsertPost } from "@shared/schema";
import { formatMediaUrl } from "@/lib/utils";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReel, setIsReel] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        toast({
          title: "Invalid file",
          description: "Please select an image or video file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setIsReel(isVideo);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };
  
  // Clear selected file
  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
      return apiRequest('POST', '/api/posts', postData);
    },
    onSuccess: () => {
      // Invalidate and refetch feed and posts
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/feed/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts?userId=${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts`] });
      }
      
      // Reset form and close modal
      setContent("");
      clearSelectedFile();
      setIsReel(false);
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive",
      });
      return;
    }
    
    if (!content && !selectedFile) {
      toast({
        title: "Error",
        description: "Your post needs either text or media",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      let mediaUrl = '';
      
      if (selectedFile) {
        // Convert the file to a data URL
        const reader = new FileReader();
        const mediaUrlPromise = new Promise<string>((resolve) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
        });
        reader.readAsDataURL(selectedFile);
        
        mediaUrl = await mediaUrlPromise;
      }
      
      // Create the post
      createPostMutation.mutate({
        userId: user.id,
        content,
        mediaUrl,
        mediaType: isReel ? "video" : "image",
        isReel
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the media file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    if (!createPostMutation.isPending && !isUploading) {
      setContent("");
      clearSelectedFile();
      setIsReel(false);
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="content">Caption</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <input
            type="file"
            id="postMedia"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          
          {!previewUrl ? (
            <div 
              className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add('border-primary', 'text-primary');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('border-primary', 'text-primary');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('border-primary', 'text-primary');
                
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  const isVideo = file.type.startsWith('video/');
                  const isImage = file.type.startsWith('image/');
                  
                  if (isVideo || isImage) {
                    setSelectedFile(file);
                    setIsReel(isVideo);
                    const fileUrl = URL.createObjectURL(file);
                    setPreviewUrl(fileUrl);
                  } else {
                    toast({
                      title: "Invalid file",
                      description: "Please select an image or video file",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              <Camera className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Click to add media</p>
              <p className="text-xs mt-1">Photos or videos</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden border border-border h-48 relative">
              {isReel && selectedFile?.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Media Preview"
                  className="w-full h-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {selectedFile && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="is-reel" className="flex items-center space-x-2 cursor-pointer">
                <div className={`p-1 rounded-md ${isReel ? 'bg-primary/10' : 'bg-muted'}`}>
                  {isReel ? (
                    <Film className="h-4 w-4 text-primary" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </div>
                <span>Post as {isReel ? 'Reel' : 'Image'}</span>
              </Label>
              <Switch 
                id="is-reel" 
                checked={isReel} 
                onCheckedChange={setIsReel}
                disabled={selectedFile && selectedFile.type.startsWith('video/')}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={createPostMutation.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={(!content && !selectedFile) || createPostMutation.isPending || isUploading}
            >
              {isUploading || createPostMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Processing..." : "Posting..."}
                </>
              ) : (
                'Post'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon, Camera } from "lucide-react";
import { InsertStory } from "@shared/schema";
import { formatMediaUrl } from "@/lib/utils";

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStoryModal({ open, onClose }: CreateStoryModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
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
  
  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: InsertStory) => {
      return apiRequest('POST', '/api/stories', storyData);
    },
    onSuccess: () => {
      // Invalidate and refetch stories
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/stories/feed/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/stories/${user.id}`] });
      }
      
      // Reset form and close modal
      clearSelectedFile();
      
      toast({
        title: "Story created",
        description: "Your story has been published successfully!",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create story: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a story",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFile || !previewUrl) {
      toast({
        title: "Error",
        description: "Please select an image for your story",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload the file to the server using FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Upload file first
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadResult = await uploadResponse.json();
      const mediaUrl = uploadResult.url; // This returns the path to the uploaded file
      
      // Calculate expiry time - 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Create the story with the uploaded image URL, ensuring proper URL format
      createStoryMutation.mutate({
        userId: user.id,
        mediaUrl: formatMediaUrl(mediaUrl),
        mediaType: "image", // Currently only supporting image stories
        expiresAt
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload the image. Please try again with a smaller image.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    if (!createStoryMutation.isPending && !isUploading) {
      clearSelectedFile();
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Story</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input
            type="file"
            id="storyImage"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          
          {!previewUrl ? (
            <div 
              className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors"
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
                  if (file.type.startsWith('image/')) {
                    setSelectedFile(file);
                    const fileUrl = URL.createObjectURL(file);
                    setPreviewUrl(fileUrl);
                  } else {
                    toast({
                      title: "Invalid file",
                      description: "Please select an image file (JPEG, PNG, etc.)",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              <Camera className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Click to select an image</p>
              <p className="text-xs mt-1">or drag and drop</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden border border-border h-60 relative">
              <img
                src={previewUrl}
                alt="Story Preview"
                className="w-full h-full object-cover"
              />
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
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={createStoryMutation.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedFile || createStoryMutation.isPending || isUploading}
              className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-600 hover:to-pink-600"
            >
              {isUploading || createStoryMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Processing..." : "Posting..."}
                </>
              ) : (
                'Share Story'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
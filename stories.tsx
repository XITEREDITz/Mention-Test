import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Plus, ChevronLeft, ChevronRight, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatMediaUrl } from "@/lib/utils";
import { StoryWithUser } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreateStoryModal } from "./create-story-modal";

export function Stories() { // Keeping function name for compatibility, but displaying as "Status"
  const { user } = useAuth();
  const [showStory, setShowStory] = useState<StoryWithUser | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  
  const { data: stories = [], isLoading } = useQuery<StoryWithUser[]>({
    queryKey: user ? [`/api/stories/feed/${user.id}`] : ['stories-not-available'],
    enabled: !!user
  });
  
  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('stories-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      const newPosition = scrollPosition + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setScrollPosition(newPosition);
    }
  };

  // Function to handle switching between stories
  const navigateStories = (direction: 'prev' | 'next') => {
    if (!stories.length) return;
    
    if (direction === 'prev' && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setShowStory(stories[activeStoryIndex - 1]);
    } else if (direction === 'next' && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setShowStory(stories[activeStoryIndex + 1]);
    } else if (direction === 'next') {
      // If we're at the end, close the story viewer
      setShowStory(null);
      setActiveStoryIndex(0);
    }
  };
  
  // Update activeStoryIndex when a story is clicked
  const handleStoryClick = (story: StoryWithUser) => {
    const index = stories.findIndex(s => s.id === story.id);
    if (index !== -1) {
      setActiveStoryIndex(index);
      setShowStory(story);
    }
  };
  
  return (
    <>
      <div className="my-6">
        <h2 className="text-xl font-bold mb-4 px-4 flex items-center">
          <span className="gradient-text mr-2">Status Updates</span> 
          <span className="text-sm text-gray-500 font-normal">Stay connected</span>
        </h2>
        
        <div className="status-grid px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" id="stories-container">
          <div className="status-item flex flex-col">
            <Button 
              variant="outline" 
              className="status-create-button p-0 relative border border-gray-200 dark:border-gray-700 hover:border-primary bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              onClick={() => setIsCreateStoryOpen(true)}
            >
              <div className="flex flex-col items-center justify-center py-6 w-full h-full">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Add Status</span>
              </div>
            </Button>
          </div>
            
          {isLoading && Array(5).fill(0).map((_, i) => (
            <div key={i} className="status-item animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex items-center mt-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
            
          {stories && stories.map((story) => (
            <div key={story.id} className="status-item overflow-hidden">
              <button 
                onClick={() => handleStoryClick(story)}
                className="status-card w-full relative group"
              >
                <div className="relative rounded-lg overflow-hidden h-40 w-full">
                  <img 
                    src={story.mediaUrl} 
                    alt={story.user.displayName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x400?text=Status";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center">
                  <Avatar className="w-8 h-8 ring-2 ring-primary/50 mr-2">
                    <AvatarImage src={story.user.avatar || ''} alt={story.user.displayName} />
                    <AvatarFallback>{story.user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium line-clamp-1">{story.user.displayName}</p>
                    <p className="text-white/70 text-xs">{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-primary/80 text-white text-xs rounded-full">New</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Viewer Dialog */}
      <Dialog open={!!showStory} onOpenChange={() => setShowStory(null)}>
        <DialogContent className="p-0 max-w-2xl w-full h-[85vh] sm:h-[90vh] border-none bg-background shadow-2xl overflow-hidden">
          {showStory && (
            <div className="relative w-full h-full flex flex-col md:flex-row">
              {/* Left side - Image viewer */}
              <div className="relative w-full md:w-3/4 h-full flex-shrink-0 bg-black">
                {/* Status navigation indicators */}
                <div className="absolute top-4 left-0 right-0 z-20 px-6 flex space-x-2 justify-center">
                  {stories.map((_, idx) => (
                    <button 
                      key={idx} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeStoryIndex 
                          ? 'bg-primary w-8' 
                          : idx < activeStoryIndex 
                            ? 'bg-white/80 w-4' 
                            : 'bg-white/30 w-4'
                      }`}
                      onClick={() => {
                        setActiveStoryIndex(idx);
                        setShowStory(stories[idx]);
                      }}
                    />
                  ))}
                </div>
                
                {/* Navigation buttons - now visible and styled differently */}
                <div className="absolute inset-y-0 left-0 z-10 flex items-center">
                  <button 
                    className="ml-2 h-12 w-12 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all duration-300"
                    onClick={() => navigateStories('prev')}
                    disabled={activeStoryIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="absolute inset-y-0 right-0 z-10 flex items-center">
                  <button 
                    className="mr-2 h-12 w-12 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all duration-300"
                    onClick={() => navigateStories('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Status image with zoom effect */}
                <div className="relative w-full h-full overflow-hidden">
                  <img 
                    src={formatMediaUrl(showStory.mediaUrl)} 
                    alt="Status Update" 
                    className="w-full h-full object-contain transform transition-transform duration-700 hover:scale-105"
                    onError={(e) => {
                      console.error("Error loading status image:", showStory.mediaUrl);
                      e.currentTarget.src = "https://placehold.co/600x800/gray/white?text=Status+Unavailable";
                    }}
                  />
                </div>
              </div>
              
              {/* Right side - Info and interactions (only on medium screens and up) */}
              <div className="hidden md:flex md:w-1/4 flex-col bg-background border-l border-gray-200 dark:border-gray-800">
                {/* User info */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 ring-2 ring-primary/30">
                      <AvatarImage src={showStory.user.avatar || ''} alt={showStory.user.displayName} />
                      <AvatarFallback>{showStory.user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{showStory.user.displayName}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(showStory.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Status info */}
                <div className="p-4 flex-grow">
                  <h4 className="font-medium text-sm mb-2">About this status</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Status updates disappear after 24 hours. Share your moments with friends.
                  </p>
                  
                  <div className="flex space-x-2 mb-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Heart className="h-4 w-4 mr-1" /> Like
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-1" /> Reply
                    </Button>
                  </div>
                </div>
                
                {/* Close button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowStory(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Mobile footer */}
              <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2 border border-white">
                      <AvatarImage src={showStory.user.avatar || ''} alt={showStory.user.displayName} />
                      <AvatarFallback>{showStory.user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white">{showStory.user.displayName}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 rounded-full h-8 w-8 p-0"
                    onClick={() => setShowStory(null)}
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="flex-1 text-white bg-white/10 hover:bg-white/20">
                    <Heart className="h-4 w-4 mr-1" /> Like
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-white bg-white/10 hover:bg-white/20">
                    <MessageCircle className="h-4 w-4 mr-1" /> Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Status Modal */}
      <CreateStoryModal 
        open={isCreateStoryOpen} 
        onClose={() => setIsCreateStoryOpen(false)} 
      />
    </>
  );
}

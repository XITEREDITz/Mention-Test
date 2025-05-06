import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Home, Search, MessageSquare, Bell, User, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePostModal } from "./create-post-modal";
import { NotificationBadge } from "./notification-badge";

export function MobileNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  if (!isMobile) return null;
  
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-gray-200 dark:border-gray-800 py-2 px-6 flex justify-between items-center z-50">
        <Link to="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className={location === "/" ? "text-primary" : "text-gray-500 dark:text-gray-400"}
          >
            <Home className="h-6 w-6" />
          </Button>
        </Link>
        
        <Link to="/explore">
          <Button 
            variant="ghost" 
            size="icon" 
            className={location === "/explore" ? "text-primary" : "text-gray-500 dark:text-gray-400"}
          >
            <Search className="h-6 w-6" />
          </Button>
        </Link>
        
        <Button 
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white p-3 rounded-lg -mt-5 shadow-lg h-14 w-14 flex items-center justify-center"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
        
        <Link to="/messages">
          <Button 
            variant="ghost" 
            size="icon" 
            className={location.startsWith("/messages") ? "text-primary" : "text-gray-500 dark:text-gray-400"}
          >
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              <NotificationBadge type="messages" />
            </div>
          </Button>
        </Link>
        
        <Link to="/notifications">
          <Button 
            variant="ghost" 
            size="icon" 
            className={location === "/notifications" ? "text-primary" : "text-gray-500 dark:text-gray-400"}
          >
            <div className="relative">
              <Bell className="h-6 w-6" />
              <NotificationBadge type="notifications" />
            </div>
          </Button>
        </Link>
      </nav>
      
      <CreatePostModal open={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </>
  );
}

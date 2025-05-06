import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { 
  Home, 
  Search, 
  MessageSquare, 
  Bell, 
  User, 
  PlusSquare, 
  Compass, 
  UserPlus 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreatePostModal } from "./create-post-modal";
import { useWebSocketStore } from "@/lib/websocket";
import { Badge } from "@/components/ui/badge";

export function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { unreadMessages, unreadNotifications, resetMessageCount, resetNotificationCount } = useWebSocketStore();

  // Reset message/notification counts when visiting their respective pages
  useEffect(() => {
    if (location.startsWith('/messages')) {
      resetMessageCount();
    } else if (location === '/notifications') {
      resetNotificationCount();
    }
  }, [location, resetMessageCount, resetNotificationCount]);
  
  const isActive = (path: string) => {
    if (path === '/') return location === path;
    return location.startsWith(path);
  };
  
  // Define our navigation items for mobile
  const navItems = [
    { path: "/", label: "Feed", icon: Home },
    { path: "/explore", label: "Discover", icon: Compass },
    { path: "/notifications", label: "Activity", icon: Bell, badge: unreadNotifications },
    { path: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
    { path: "/profile", label: "Profile", icon: User, avatar: true }
  ];
  
  return (
    <>
      {/* Create post floating action button */}
      <button 
        onClick={() => setShowCreatePost(true)}
        className="md:hidden fixed z-[60] bottom-24 right-6 bg-primary text-white p-3 rounded-full shadow-lg flex items-center justify-center"
        aria-label="Create new post"
      >
        <PlusSquare className="h-6 w-6" />
      </button>
      
      {/* Mobile navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 py-3 px-6 flex justify-between items-center z-50">
        {navItems.map(({ path, icon: Icon, badge, avatar }) => (
          <Link key={path} to={path}>
            <div className="flex flex-col items-center">
              <div className={`relative p-2 ${
                isActive(path) 
                  ? 'text-primary' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {avatar && user ? (
                  <Avatar className={`h-6 w-6 ${isActive(path) ? 'ring-2 ring-primary' : ''}`}>
                    <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                
                {typeof badge === 'number' && badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {badge > 9 ? '9+' : badge}
                  </Badge>
                )}
              </div>
              
              {/* Indicator dot for active page */}
              <div className={`h-1 w-1 rounded-full mt-1 ${
                isActive(path) ? 'bg-primary' : 'bg-transparent'
              }`}></div>
            </div>
          </Link>
        ))}
      </nav>
      
      <CreatePostModal open={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </>
  );
}
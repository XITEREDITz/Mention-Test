import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useWebSocketStore } from "@/lib/websocket";
import { Bell, Inbox, Search, Menu, X, Sun, Moon, Settings, Users, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();
  const { unreadMessages, unreadNotifications } = useWebSocketStore();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  
  // Handle scroll for hiding/showing header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  
  // Toggle dark mode
  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };
  
  return (
    <header className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700 py-2 md:py-3 px-4 md:px-6 flex justify-between items-center sticky top-0 z-50 transition-all duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Left section */}
      <div className="flex items-center space-x-3 md:space-x-6">
        {/* Mobile-only menu button */}
        <button className="md:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        {/* Logo for desktop */}
        <div className="hidden md:block">
          <h1 className="text-xl font-bold">
            <span className="text-primary">M</span>
            <span className="text-gray-800 dark:text-white">ention</span>
          </h1>
        </div>
        
        {/* Search bar */}
        <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-full md:w-72' : 'w-auto'}`}>
          {isSearchOpen ? (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm px-2"
                autoFocus
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="hidden md:inline-block ml-2 text-sm text-gray-500 dark:text-gray-400">Search...</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center space-x-1 md:space-x-3">
        {/* Navigation buttons for desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <Link to="/explore">
            <Button variant="ghost" size="sm" className="rounded-full px-3">
              <Compass className="h-4 w-4 mr-2" />
              <span>Explore</span>
            </Button>
          </Link>
          
          <Link to="/find-friends">
            <Button variant="ghost" size="sm" className="rounded-full px-3">
              <Users className="h-4 w-4 mr-2" />
              <span>Connections</span>
            </Button>
          </Link>
        </div>
        
        {/* Theme toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700" />
          )}
        </button>
        
        {/* Messages button */}
        <Link to="/messages">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Inbox className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Badge>
            )}
          </button>
        </Link>
        
        {/* Notifications button */}
        <Link to="/notifications">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </button>
        </Link>
        
        {/* User profile dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-0.5 hover:ring-2 hover:ring-primary/20 transition-all">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={user.avatar || ''} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.displayName}</span>
                  <span className="text-xs text-gray-500 truncate">{user.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link to="/messages">
                <DropdownMenuItem className="cursor-pointer">
                  Messages
                  {unreadMessages > 0 && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {unreadMessages}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </Link>
              <Link to="/notifications">
                <DropdownMenuItem className="cursor-pointer">
                  Notifications
                  {unreadNotifications > 0 && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {unreadNotifications}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </Link>
              <Link to="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 dark:text-red-400">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

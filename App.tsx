import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Explore from "@/pages/explore";
import Notifications from "@/pages/notifications";
import FindFriends from "@/pages/find-friends";
import PublicChat from "@/pages/public-chat";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { useEffect } from "react";
import { useWebSocketStore } from "@/lib/websocket";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Protected route wrapper
function PrivateRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Still checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component {...rest} />;
}

// Public route wrapper (accessible only when NOT authenticated)
function PublicRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Still checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If authenticated, redirect to home
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  // Redirect from root if not authenticated
  useEffect(() => {
    if (window.location.pathname === "/" && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);
  
  return (
    <Switch>
      <Route path="/login">{() => <PublicRoute component={Login} />}</Route>
      <Route path="/register">{() => <PublicRoute component={Register} />}</Route>
      
      <Route path="/">{() => <PrivateRoute component={Home} />}</Route>
      <Route path="/messages">{() => <PrivateRoute component={Messages} />}</Route>
      <Route path="/messages/:userId">{(params) => <PrivateRoute component={() => <Messages params={params} />} />}</Route>
      <Route path="/profile">{() => <PrivateRoute component={Profile} />}</Route>
      <Route path="/profile/:userId">{(params) => <PrivateRoute component={() => <Profile params={params} />} />}</Route>
      <Route path="/explore">{() => <PrivateRoute component={Explore} />}</Route>
      <Route path="/notifications">{() => <PrivateRoute component={Notifications} />}</Route>
      <Route path="/find-friends">{() => <PrivateRoute component={FindFriends} />}</Route>
      <Route path="/public-chat">{() => <PrivateRoute component={PublicChat} />}</Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const connect = useWebSocketStore(state => state.connect);
  const disconnect = useWebSocketStore(state => state.disconnect);
  
  // Initialize WebSocket connection for authenticated users
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id);
    } else {
      disconnect();
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id, connect, disconnect]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppRoutes />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
      {/* New layout structure with a unique design */}
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left navigation panel with unique style */}
        <div className="hidden md:flex md:w-16 lg:w-20 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex-col items-center py-6 border-r border-gray-100 dark:border-gray-700">
          <div className="mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-xl font-bold">
              M
            </div>
          </div>
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top header bar */}
          <div className="flex-shrink-0">
            <Header />
          </div>
          
          {/* Main scrollable content */}
          <div className="flex-1 overflow-y-auto pt-2 pb-16 md:pb-4 px-1 md:px-4">
            <div className="max-w-screen-xl mx-auto">
              <AppRoutes />
            </div>
          </div>
          
          {/* Mobile navigation */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
        
        {/* Right panel for desktop (messages/notifications) */}
        <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-100 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-lg">Activity</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary">🔔</span>
                </div>
                <div>
                  <p className="text-sm font-medium">New connection request</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary">💬</span>
                </div>
                <div>
                  <p className="text-sm font-medium">New message from Alex</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">10 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <AuthProvider>
          <AppLayout />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

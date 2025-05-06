import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form setup
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Form submission handler
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.username, values.password);
      
      toast({
        title: "Login successful",
        description: "Welcome back to Mention!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch">
      {/* Left Auth Panel */}
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-500 dark:from-primary dark:to-blue-400 text-transparent bg-clip-text">
              Mention
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Connect. Share. Discover.
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-center">
                Log in to your account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} 
                            className="border-2 focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} 
                            className="border-2 focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log in"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Test accounts:</p>
            <p className="mt-1">username: <span className="font-mono">alex</span> | password: <span className="font-mono">password123</span></p>
            <p className="mt-1">username: <span className="font-mono">sophia</span> | password: <span className="font-mono">password123</span></p>
          </div>
        </div>
      </div>

      {/* Right Hero Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 via-purple-600 to-blue-600 text-white p-8 flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to Mention</h2>
          <p className="text-xl mb-8">Your all-in-one platform for social connection and content sharing</p>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="p-3 bg-white/20 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <h3 className="font-semibold">Share Posts</h3>
              <p className="text-sm mt-1 text-white/80">Share your moments with friends</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="p-3 bg-white/20 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video">
                  <path d="m22 8-6 4 6 4V8Z"/>
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                </svg>
              </div>
              <h3 className="font-semibold">Create Reels</h3>
              <p className="text-sm mt-1 text-white/80">Short and captivating videos</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="p-3 bg-white/20 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                  <path d="M12 8v8"/>
                </svg>
              </div>
              <h3 className="font-semibold">Daily Stories</h3>
              <p className="text-sm mt-1 text-white/80">Share updates that last 24 hours</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="p-3 bg-white/20 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold">Real-time Chat</h3>
              <p className="text-sm mt-1 text-white/80">Connect instantly with friends</p>
            </div>
          </div>
          
          <p className="text-sm text-white/80">Join millions of users already enjoying Mention's seamless experience</p>
        </div>
      </div>
    </div>
  );
}

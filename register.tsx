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
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form setup
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Form submission handler
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await register(values.username, values.displayName, values.password);
      
      toast({
        title: "Registration successful",
        description: "Welcome to Mention!",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
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
              Join the community today
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-center">
                Create a new account
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
                          <Input placeholder="Choose a username" {...field} 
                            className="border-2 focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} 
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
                          <Input type="password" placeholder="Create a password" {...field} 
                            className="border-2 focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} 
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
                        Creating account...
                      </>
                    ) : (
                      "Sign up"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right Hero Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 via-purple-600 to-blue-600 text-white p-8 flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">Create Your Mention Profile</h2>
          <p className="text-xl mb-8">Get started with your social journey in a few simple steps</p>
          
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm text-left">
              <div className="p-3 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" x2="19" y1="8" y2="14"/>
                  <line x1="22" x2="16" y1="11" y2="11"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Create Your Profile</h3>
                <p className="text-sm mt-1 text-white/80">Personalize your account with a unique username and photo</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm text-left">
              <div className="p-3 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Connect with Friends</h3>
                <p className="text-sm mt-1 text-white/80">Find and follow your friends and favorite creators</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm text-left">
              <div className="p-3 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                  <path d="M12 12v9"/>
                  <path d="m16 16-4-4-4 4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Share Your Content</h3>
                <p className="text-sm mt-1 text-white/80">Upload photos, videos, reels and create stories</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-white/80">Join millions of users already enjoying Mention's seamless experience</p>
        </div>
      </div>
    </div>
  );
}

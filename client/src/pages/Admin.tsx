import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { checkAdminStatus, loginAdmin } from "@/lib/auth";
import Dashboard from "@/components/admin/Dashboard";
import Users from "@/components/admin/Users";
import Traffic from "@/components/admin/Traffic";
import Settings from "@/components/admin/Settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Admin() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check if admin is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAdmin } = await checkAdminStatus();
        setIsAuthenticated(isAdmin);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await loginAdmin(data);
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "Welcome to the admin panel",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Admin Login</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            {...field}
                            className="bg-[#F7F2FA]"
                          />
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
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="bg-[#F7F2FA]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full py-2 rounded-full text-sm font-medium bg-primary hover:bg-primary-dark text-white"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Default credentials: admin / admin123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
            <p className="text-secondary">Monitor and manage proxy service usage</p>
          </div>
          
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="border-b border-gray-200 mb-6 w-full justify-start bg-transparent">
              <TabsTrigger 
                value="dashboard"
                className="py-2 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="py-2 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="traffic"
                className="py-2 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                Traffic
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="py-2 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
            <TabsContent value="users">
              <Users />
            </TabsContent>
            <TabsContent value="traffic">
              <Traffic />
            </TabsContent>
            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

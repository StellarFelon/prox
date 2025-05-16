import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Lock, HomeIcon, SettingsIcon, InfoIcon, MenuIcon, SunIcon, MoonIcon } from "lucide-react";
import { logoutAdmin } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isAdmin: boolean;
  adminInfo: { username: string } | null;
}

export default function Header({ isAdmin, adminInfo }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out from the admin panel.",
      });
      // Redirect to home page
      setLocation("/");
      // Reload to clear state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Lock className="h-6 w-6" />
            <span className="text-xl font-medium">ProxyGuard</span>
          </Link>
          
          <div className="hidden md:flex space-x-1 text-sm">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-primary-dark flex items-center space-x-1 px-4 py-2 rounded-full">
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" className="text-white hover:bg-primary-dark flex items-center space-x-1 px-4 py-2 rounded-full">
                <SettingsIcon className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </Link>
            <a href="#features">
              <Button variant="ghost" className="text-white hover:bg-primary-dark flex items-center space-x-1 px-4 py-2 rounded-full">
                <InfoIcon className="h-4 w-4" />
                <span>Features</span>
              </Button>
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <span className="text-xs hidden md:inline-block bg-white/20 px-2 py-1 rounded-full">
                {adminInfo?.username || 'Admin'}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-primary-dark rounded-full"
              onClick={toggleTheme}
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
            
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-primary-dark rounded-full hidden md:inline-flex"
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-primary-dark rounded-full md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 space-y-1">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-primary-dark w-full justify-start">
                Home
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" className="text-white hover:bg-primary-dark w-full justify-start">
                Admin
              </Button>
            </Link>
            <a href="#features">
              <Button variant="ghost" className="text-white hover:bg-primary-dark w-full justify-start">
                Features
              </Button>
            </a>
            {isAdmin && (
              <Button 
                variant="ghost" 
                className="text-white hover:bg-primary-dark w-full justify-start"
                onClick={handleLogout}
              >
                Logout ({adminInfo?.username || 'Admin'})
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

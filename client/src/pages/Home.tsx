import { Link } from "wouter";
import ProxyForm from "@/components/ProxyForm";
import FeatureCard from "@/components/FeatureCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ShieldIcon, 
  LockIcon, 
  Shield, 
  CheckCircle
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: ShieldIcon,
      title: "IP Masking",
      description: "Hide your real IP address and location to browse anonymously and securely."
    },
    {
      icon: LockIcon,
      title: "Bypass Restrictions",
      description: "Access geo-restricted content and bypass network firewalls with our proxy service."
    },
    {
      icon: Shield,
      title: "Encrypted Traffic",
      description: "All your web traffic is encrypted to protect your data from interception."
    }
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Secure Web Browsing</h1>
            <p className="text-lg mb-6 font-medium text-foreground">Browse privately with our secure proxy service. Bypass network restrictions and mask your IP address with just a few clicks.</p>
            
            <div className="mb-6">
              <ProxyForm />
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="rounded-xl shadow-lg overflow-hidden">
              <img 
                src="/assets/network.gif"
                alt="Network security visualization" 
                className="w-full h-full min-h-[300px] object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  console.error('Failed to load image:', img.src);
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

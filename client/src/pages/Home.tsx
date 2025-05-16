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
            <h1 className="text-4xl font-bold mb-4 text-primary">Secure Web Browsing</h1>
            <p className="text-lg mb-6 text-secondary">Browse privately with our secure proxy service. Bypass network restrictions and mask your IP address with just a few clicks.</p>
            
            <div className="mb-6">
              <ProxyForm />
            </div>
            
            <Alert className="bg-primary-light border-l-4 border-primary">
              <ShieldIcon className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary font-medium">Your privacy is our priority</AlertTitle>
              <AlertDescription className="text-secondary-dark">
                Your browsing data is encrypted and we don't store your activity logs.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=900"
              alt="Network security visualization" 
              className="rounded-xl shadow-lg w-full h-auto"
            />
          </div>
        </div>
        
        {/* Features Section */}
        <section id="features" className="py-12 scroll-mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mx-auto mb-4">1</div>
              <h3 className="font-medium mb-2">Enter URL</h3>
              <p className="text-sm text-secondary">Input the website address you want to visit</p>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mx-auto mb-4">2</div>
              <h3 className="font-medium mb-2">We Fetch Content</h3>
              <p className="text-sm text-secondary">Our servers request the content on your behalf</p>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mx-auto mb-4">3</div>
              <h3 className="font-medium mb-2">Traffic Encrypted</h3>
              <p className="text-sm text-secondary">All data is securely encrypted</p>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mx-auto mb-4">4</div>
              <h3 className="font-medium mb-2">Browse Securely</h3>
              <p className="text-sm text-secondary">Access content privately and securely</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  FacebookIcon, 
  MailIcon, 
  MessageCircleIcon, 
  RssIcon, 
  SendIcon,
  Lock
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1C1B1F] text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              ProxyGuard
            </h3>
            <p className="text-sm text-gray-400">
              Secure web browsing solution providing privacy and unrestricted access to the internet.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors duration-200">
                  Features
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors duration-200">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200">
                  Acceptable Use
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200">
                  DMCA
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <MailIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <MessageCircleIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <RssIcon className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-gray-400">Subscribe to our newsletter for updates</p>
            <div className="mt-2 flex">
              <Input type="email" placeholder="Your email" className="rounded-r-none" />
              <Button className="bg-primary hover:bg-primary-dark text-white rounded-l-none px-3">
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} ProxyGuard. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

interface UpdateSettingPayload {
  key: string;
  value: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch settings
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error fetching settings",
        description: error instanceof Error ? error.message : "Failed to load settings",
        variant: "destructive",
      });
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (data: UpdateSettingPayload) => {
      const res = await apiRequest("PUT", `/api/admin/settings/${data.key}`, { value: data.value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating setting",
        description: error instanceof Error ? error.message : "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Helper function to find a setting by key
  const getSetting = (key: string): string => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || "";
  };

  // Helper function to update a setting
  const updateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">System Settings</h3>
          
          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-secondary mb-1">Proxy Server Location</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select 
                  defaultValue={getSetting("proxyLocation")} 
                  onValueChange={(value) => updateSetting("proxyLocation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="eu">Europe</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="auto">Auto (Best Performance)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-secondary mb-1">Connection Timeout (seconds)</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input 
                  type="number" 
                  value={getSetting("connectionTimeout")}
                  onChange={(e) => updateSetting("connectionTimeout", e.target.value)}
                  min="5"
                  max="120"
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="block text-sm font-medium text-secondary mb-1">Enable HTTPS Redirection</Label>
                <p className="text-xs text-secondary">Automatically redirect HTTP requests to HTTPS</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Switch
                  checked={getSetting("enableHttpsRedirect") === "true"}
                  onCheckedChange={(checked) => updateSetting("enableHttpsRedirect", checked.toString())}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="block text-sm font-medium text-secondary mb-1">Block Malicious Content</Label>
                <p className="text-xs text-secondary">Filter out known malicious websites and content</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Switch
                  checked={getSetting("blockMaliciousContent") === "true"}
                  onCheckedChange={(checked) => updateSetting("blockMaliciousContent", checked.toString())}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Admin Account</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-secondary mb-1">Email Address</Label>
              <Input type="email" value="admin@proxyguard.com" readOnly />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-secondary mb-1">Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-secondary mb-1">New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
            </div>
            
            <div className="pt-2">
              <Button className="bg-primary hover:bg-primary-dark text-white">
                Update Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

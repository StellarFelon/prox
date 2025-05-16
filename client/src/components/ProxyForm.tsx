import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useFingerprint } from "@/hooks/useFingerprint";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LinkIcon, XIcon, ShieldIcon } from "lucide-react";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL including https:// or http://"),
  hideReferer: z.boolean().default(false),
  removeCookies: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProxyForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { fingerprint } = useFingerprint();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      hideReferer: false,
      removeCookies: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Set fingerprint header to be captured by the server
      const headers = fingerprint 
        ? { "x-fingerprint": fingerprint }
        : undefined;
      
      // Construct URL for GET proxy request
      const params = new URLSearchParams();
      params.append('url', data.url);
      if (data.hideReferer) params.append('hideReferer', 'true');
      if (data.removeCookies) params.append('removeCookies', 'true');
      
      // Display success toast
      toast({
        title: "Success!",
        description: "You are now browsing securely through our proxy.",
      });
      
      // Open the proxy URL in a new tab
      window.open(`/api/proxy?${params.toString()}`, "_blank");
      
      // Reset the form
      form.reset({
        url: "",
        hideReferer: false,
        removeCookies: false,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to access the site",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearUrl = () => {
    form.setValue("url", "");
    form.setFocus("url");
  };

  return (
    <Card className="shadow-lg border-2 border-border rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base font-semibold">Enter URL to browse securely</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        <Input
                          placeholder="https://example.com"
                          className="pl-10 pr-10 py-6 bg-background border-2 border-input focus:border-primary focus:ring-1 focus:ring-primary"
                          {...field}
                        />
                        {field.value && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-foreground hover:text-primary"
                              onClick={clearUrl}
                            >
                              <XIcon className="h-5 w-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </div>
                  <FormDescription className="text-sm font-medium text-foreground">
                    Enter the complete URL including https:// or http://
                  </FormDescription>
                  <FormMessage className="font-medium" />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-3 bg-accent/30 p-3 rounded-lg">
              <h3 className="font-semibold text-foreground">Privacy Options</h3>
              <FormField
                control={form.control}
                name="hideReferer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-2"
                      />
                    </FormControl>
                    <FormLabel className="text-base font-medium cursor-pointer text-foreground">
                      Hide referer information
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="removeCookies"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-2"
                      />
                    </FormControl>
                    <FormLabel className="text-base font-medium cursor-pointer text-foreground">
                      Remove cookies and tracking
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-full text-base font-medium tracking-wide bg-primary hover:opacity-90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Processing..." : "Browse Securely"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

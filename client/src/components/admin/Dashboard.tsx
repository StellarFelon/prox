import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { 
  Area, 
  AreaChart,
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalRequests: number;
  activeUsers: number;
  blockedAttempts: number;
}

interface RecentActivity {
  id: number;
  visitorId: number;
  url: string;
  status: string;
  responseStatus: number | null;
  timestamp: string;
  ipAddress?: string;
}

// Simulated traffic data for visualization
const trafficData = [
  { name: "00:00", requests: 42 },
  { name: "03:00", requests: 28 },
  { name: "06:00", requests: 15 },
  { name: "09:00", requests: 65 },
  { name: "12:00", requests: 87 },
  { name: "15:00", requests: 102 },
  { name: "18:00", requests: 95 },
  { name: "21:00", requests: 78 },
];

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error fetching stats",
        description: error instanceof Error ? error.message : "Failed to load dashboard data",
        variant: "destructive",
      });
    },
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["/api/admin/recent-activity"],
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error fetching recent activity",
        description: error instanceof Error ? error.message : "Failed to load recent activity",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary-light dark:bg-blue-900/30 rounded-lg overflow-hidden border-2">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Total Requests</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">{stats?.totalRequests.toLocaleString() || "0"}</p>
                <p className="text-sm font-medium text-foreground">All time requests processed</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-accent/30 rounded-lg overflow-hidden border-2">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Active Users</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">{stats?.activeUsers.toLocaleString() || "0"}</p>
                <p className="text-sm font-medium text-foreground">Currently online</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/20 rounded-lg overflow-hidden border-2">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Blocked Attempts</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">{stats?.blockedAttempts.toLocaleString() || "0"}</p>
                <p className="text-sm font-medium text-foreground">In the past 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-2">
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold text-foreground mb-4">Traffic Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trafficData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{fill: 'var(--foreground)'}} />
                <YAxis tick={{fill: 'var(--foreground)'}} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                  labelStyle={{color: 'hsl(var(--foreground))'}}
                  itemStyle={{color: 'hsl(var(--foreground))'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorRequests)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-2">
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">Request URL</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {isLoadingActivity ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-40" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-16" />
                      </td>
                    </tr>
                  ))
                ) : recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity: RecentActivity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {activity.ipAddress || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {activity.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.status === "success" ? (
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800 font-medium">
                            Success
                          </Badge>
                        ) : activity.status === "blocked" ? (
                          <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 font-medium">
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800 font-medium">
                            {activity.status}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-base font-medium text-foreground">
                      No recent activity found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

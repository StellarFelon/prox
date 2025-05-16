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
        <Card className="bg-primary-light rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-primary mb-1">Total Requests</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats?.totalRequests.toLocaleString() || "0"}</p>
                <p className="text-sm text-secondary">All time requests processed</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[#E8DEF8] rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-secondary mb-1">Active Users</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats?.activeUsers.toLocaleString() || "0"}</p>
                <p className="text-sm text-secondary">Currently online</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[#FFD8E4] rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-tertiary mb-1">Blocked Attempts</h3>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats?.blockedAttempts.toLocaleString() || "0"}</p>
                <p className="text-sm text-secondary">In the past 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Traffic Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trafficData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6750A4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6750A4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#6750A4" 
                  fillOpacity={1} 
                  fill="url(#colorRequests)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Request URL</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark">
                        {activity.ipAddress || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark">
                        {activity.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.status === "success" ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Success
                          </Badge>
                        ) : activity.status === "blocked" ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {activity.status}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
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

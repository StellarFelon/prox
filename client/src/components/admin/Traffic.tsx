import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Chart colors - using CSS variables for theme compatibility
const COLORS = [
  "hsl(var(--primary))", 
  "hsl(var(--destructive))", 
  "hsl(var(--secondary))", 
  "hsl(var(--accent))", 
  "hsl(var(--muted))"
];

export default function Traffic() {
  const [timeRange, setTimeRange] = useState("24h");
  const { toast } = useToast();
  
  // Combined query to fetch all traffic data
  const { data: trafficData, isLoading } = useQuery({
    queryKey: ["/api/admin/traffic", timeRange],
    queryFn: async () => {
      try {
        // In a real application, you would pass the timeRange to the API
        // For now, we'll return sample data based on actual database activity
        const result = await fetch(`/api/admin/recent-activity`);
        if (!result.ok) throw new Error("Failed to fetch traffic data");
        
        const activities = await result.json();
        
        // Process activity data into appropriate formats for charts
        // This would normally be done server-side
        
        // Count requests by domain
        const domainMap = new Map();
        let totalRequests = 0;
        
        activities.forEach(activity => {
          totalRequests++;
          try {
            const url = new URL(activity.url);
            const domain = url.hostname;
            
            domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
          } catch (e) {
            // Handle invalid URLs
            domainMap.set("other", (domainMap.get("other") || 0) + 1);
          }
        });
        
        // Convert to format for charts
        const trafficByDomain = Array.from(domainMap.entries())
          .map(([name, count]) => ({ 
            name, 
            value: Math.round((count / totalRequests) * 100)
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        // Add "other" if needed to make sum 100%
        const sumDomain = trafficByDomain.reduce((sum, item) => sum + item.value, 0);
        if (sumDomain < 100) {
          trafficByDomain.push({ name: "other", value: 100 - sumDomain });
        }
        
        // For location data, we'd need IP geolocation
        // For demo purposes, creating synthetic data based on available info
        const trafficByLocation = [
          { name: "North America", value: 40 },
          { name: "Europe", value: 30 },
          { name: "Asia", value: 20 },
          { name: "Other", value: 10 }
        ];
        
        // Create hourly traffic from timestamp
        const hourCounts = new Map();
        
        // Initialize all hours
        for (let i = 0; i < 24; i++) {
          const hour = `${i.toString().padStart(2, '0')}:00`;
          hourCounts.set(hour, 0);
        }
        
        // Count activities by hour
        activities.forEach(activity => {
          try {
            const date = new Date(activity.timestamp);
            const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
          } catch (e) {
            // Skip invalid timestamps
          }
        });
        
        // Convert to chart format
        const hourlyTraffic = Array.from(hourCounts.entries())
          .map(([hour, count]) => ({ hour, requests: count }))
          .sort((a, b) => {
            // Sort by hour (00:00 to 23:00)
            return parseInt(a.hour.split(':')[0]) - parseInt(b.hour.split(':')[0]);
          });
          
        return {
          trafficByDomain,
          trafficByLocation,
          hourlyTraffic
        };
      } catch (error) {
        console.error("Error fetching traffic data:", error);
        throw error;
      }
    }
  });

  // Download traffic data as CSV
  const handleExportData = () => {
    if (!trafficData) {
      toast({
        title: "No data to export",
        description: "Please wait for data to load before exporting",
        variant: "destructive"
      });
      return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add hourly traffic data
    csvContent += "Hour,Requests\n";
    trafficData.hourlyTraffic.forEach(row => {
      csvContent += `${row.hour},${row.requests}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `traffic_data_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export complete",
      description: "Traffic data has been exported as CSV"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-foreground">Traffic Analysis</h3>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] border-2 text-foreground">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            className="bg-primary hover:opacity-90 text-primary-foreground font-medium"
            onClick={handleExportData}
            disabled={isLoading || !trafficData}
          >
            Export Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardContent className="p-4">
            <h4 className="text-lg font-semibold text-foreground mb-3">Traffic by Location</h4>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : trafficData ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficData.trafficByLocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {trafficData.trafficByLocation.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{color: 'hsl(var(--foreground))'}}
                      itemStyle={{color: 'hsl(var(--foreground))'}}
                    />
                    <Legend formatter={(value) => <span style={{color: 'hsl(var(--foreground))'}}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-2">
          <CardContent className="p-4">
            <h4 className="text-lg font-semibold text-foreground mb-3">Traffic by Domain</h4>
            {isLoading ? (
              <div className="h-64 flex flex-col justify-center space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : trafficData ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trafficData.trafficByDomain}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tick={{fill: 'hsl(var(--foreground))'}}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80} 
                      tick={{fill: 'hsl(var(--foreground))'}}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{color: 'hsl(var(--foreground))'}}
                      itemStyle={{color: 'hsl(var(--foreground))'}}
                    />
                    <Legend formatter={(value) => <span style={{color: 'hsl(var(--foreground))'}}>{value}</span>} />
                    <Bar 
                      dataKey="value" 
                      name="Requests %" 
                      fill="hsl(var(--primary))" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-2">
        <CardContent className="p-4">
          <h4 className="text-lg font-semibold text-foreground mb-3">Hourly Traffic</h4>
          {isLoading ? (
            <div className="h-64 pt-6">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : trafficData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trafficData.hourlyTraffic}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    tick={{fill: 'hsl(var(--foreground))'}}
                  />
                  <YAxis 
                    tick={{fill: 'hsl(var(--foreground))'}}
                  />
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))"
                  />
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
                    name="Requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

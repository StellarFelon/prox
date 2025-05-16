import { useState } from "react";
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

// Sample data for charts
const trafficByLocation = [
  { name: "United States", value: 35 },
  { name: "Europe", value: 30 },
  { name: "Asia", value: 25 },
  { name: "Africa", value: 5 },
  { name: "Other", value: 5 },
];

const trafficByDomain = [
  { name: "example.com", value: 20 },
  { name: "google.com", value: 15 },
  { name: "github.com", value: 12 },
  { name: "netflix.com", value: 10 },
  { name: "youtube.com", value: 8 },
  { name: "other", value: 35 },
];

const hourlyTraffic = [
  { hour: "00:00", requests: 42 },
  { hour: "01:00", requests: 35 },
  { hour: "02:00", requests: 30 },
  { hour: "03:00", requests: 28 },
  { hour: "04:00", requests: 22 },
  { hour: "05:00", requests: 18 },
  { hour: "06:00", requests: 15 },
  { hour: "07:00", requests: 25 },
  { hour: "08:00", requests: 40 },
  { hour: "09:00", requests: 65 },
  { hour: "10:00", requests: 75 },
  { hour: "11:00", requests: 82 },
  { hour: "12:00", requests: 87 },
  { hour: "13:00", requests: 90 },
  { hour: "14:00", requests: 95 },
  { hour: "15:00", requests: 102 },
  { hour: "16:00", requests: 98 },
  { hour: "17:00", requests: 95 },
  { hour: "18:00", requests: 92 },
  { hour: "19:00", requests: 88 },
  { hour: "20:00", requests: 82 },
  { hour: "21:00", requests: 78 },
  { hour: "22:00", requests: 65 },
  { hour: "23:00", requests: 55 },
];

// Colors for charts
const COLORS = ["#6750A4", "#7D5260", "#625B71", "#4F378B", "#633B48", "#4A4458"];

export default function Traffic() {
  const [timeRange, setTimeRange] = useState("24h");

  const handleExportData = () => {
    // In a real implementation, this would create a CSV file to download
    alert("Data export functionality would be implemented here");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Traffic Analysis</h3>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={handleExportData}
          >
            Export Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Traffic by Location</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficByLocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficByLocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Traffic by Domain</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trafficByDomain}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Requests %" fill="#6750A4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Hourly Traffic</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyTraffic}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6750A4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6750A4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" />
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
    </div>
  );
}

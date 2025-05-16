import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Visitor {
  id: number;
  ipAddress: string;
  fingerprint: string | null;
  userAgent: string | null;
  blocked: boolean;
  firstSeen: string;
  lastSeen: string;
}

interface VisitorsResponse {
  visitors: Visitor[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function Users() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch visitors
  const { data, isLoading } = useQuery<VisitorsResponse>({
    queryKey: ["/api/admin/visitors", page, pageSize],
    retry: 1,
    onError: (error) => {
      toast({
        title: "Error fetching users",
        description: error instanceof Error ? error.message : "Failed to load user data",
        variant: "destructive",
      });
    },
  });

  // Block/unblock mutation
  const blockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: number; blocked: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/visitors/${id}/block`, { blocked });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/visitors"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleBlockToggle = (visitor: Visitor) => {
    blockMutation.mutate({
      id: visitor.id,
      blocked: !visitor.blocked,
    });
  };

  const filteredVisitors = data?.visitors.filter(visitor => 
    visitor.ipAddress.includes(searchTerm) || 
    visitor.fingerprint?.includes(searchTerm) ||
    visitor.userAgent?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const goToNextPage = () => {
    if (data && page < data.pagination.totalPages) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">User Management</h3>
        <div className="flex space-x-2">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Fingerprint</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Last Active</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-20" />
                      </td>
                    </tr>
                  ))
                ) : filteredVisitors.length > 0 ? (
                  filteredVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark">{visitor.ipAddress}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark font-mono text-xs">{visitor.fingerprint || "Unknown"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark">{new Date(visitor.lastSeen).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visitor.blocked ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Allowed
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {visitor.blocked ? (
                          <Button 
                            variant="ghost" 
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 mr-3"
                            onClick={() => handleBlockToggle(visitor)}
                            disabled={blockMutation.isPending}
                          >
                            Allow
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 mr-3"
                            onClick={() => handleBlockToggle(visitor)}
                            disabled={blockMutation.isPending}
                          >
                            Block
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="text-secondary hover:text-primary hover:bg-primary-light"
                              onClick={() => setSelectedVisitor(visitor)}
                            >
                              Details
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Visitor Details</AlertDialogTitle>
                              <AlertDialogDescription>
                                <div className="space-y-2 mt-2">
                                  <div>
                                    <span className="font-medium">IP Address:</span> {selectedVisitor?.ipAddress}
                                  </div>
                                  <div>
                                    <span className="font-medium">Fingerprint:</span> {selectedVisitor?.fingerprint || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">User Agent:</span> <span className="text-xs">{selectedVisitor?.userAgent || "Unknown"}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">First Seen:</span> {selectedVisitor ? new Date(selectedVisitor.firstSeen).toLocaleString() : ""}
                                  </div>
                                  <div>
                                    <span className="font-medium">Last Seen:</span> {selectedVisitor ? new Date(selectedVisitor.lastSeen).toLocaleString() : ""}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span> {selectedVisitor?.blocked ? "Blocked" : "Allowed"}
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                              {selectedVisitor && (
                                <AlertDialogAction
                                  className={selectedVisitor.blocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                                  onClick={() => handleBlockToggle(selectedVisitor)}
                                >
                                  {selectedVisitor.blocked ? "Allow User" : "Block User"}
                                </AlertDialogAction>
                              )}
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {data && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-secondary">
            Showing {filteredVisitors.length} of {data.pagination.total} users
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToPrevPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToNextPage}
              disabled={page >= data.pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

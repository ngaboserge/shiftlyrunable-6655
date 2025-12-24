import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Plus, Briefcase, User, MapPin, DollarSign, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployerDashboard() {
  const [view, setView] = useState<"dashboard" | "my-shifts" | "profile">("dashboard");

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ["employer-shifts"],
    queryFn: async () => {
      const response = await apiClient.api.shifts.employer["my-shifts"].$get();
      return response.json();
    },
  });

  const activeShifts = shiftsData?.shifts?.filter((s: any) => s.status === "active") || [];
  const pendingApplications = activeShifts.reduce((acc: number, shift: any) => acc + (shift.pendingApplications || 0), 0);

  const getShiftTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      warehouse: "bg-blue-100 text-blue-800",
      retail: "bg-green-100 text-green-800",
      hospitality: "bg-purple-100 text-purple-800",
      delivery: "bg-orange-100 text-orange-800",
      events: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.active;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Employer Dashboard</h2>
        <p className="opacity-90">Manage your shifts and workers</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
                <p className="text-2xl font-bold">{activeShifts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
                <p className="text-2xl font-bold">{pendingApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Shifts</p>
                <p className="text-2xl font-bold">{shiftsData?.shifts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activeShifts.length > 0 ? (
            <div className="space-y-3">
              {activeShifts.slice(0, 5).map((shift: any) => (
                <div key={shift.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{shift.title}</h4>
                      <Badge className={getShiftTypeColor(shift.shiftType)}>
                        {shift.shiftType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {shift.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${shift.payRate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {shift.applicationCount} applications
                      </span>
                    </div>
                  </div>
                  <Link to={`/employer/shift/${shift.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No active shifts</p>
              <Link to="/employer/post-shift">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Shift
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMyShifts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Shifts</h2>
        <Link to="/employer/post-shift">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Post Shift
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : shiftsData?.shifts && shiftsData.shifts.length > 0 ? (
        <div className="space-y-4">
          {shiftsData.shifts.map((shift: any) => (
            <Card key={shift.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold mb-1">{shift.title}</h4>
                    <Badge className={getStatusColor(shift.status)}>
                      {shift.status}
                    </Badge>
                  </div>
                  <Badge className={getShiftTypeColor(shift.shiftType)}>
                    {shift.shiftType}
                  </Badge>
                </div>
                
                <p className="text-sm mb-4 line-clamp-2">{shift.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">${shift.payRate}/hr</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {shift.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {shift.workersApproved}/{shift.workersNeeded} filled
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {shift.applicationCount} applications
                  </div>
                </div>

                {shift.pendingApplications > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg mb-3">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      {shift.pendingApplications} pending application(s) need review
                    </p>
                  </div>
                )}

                <Link to={`/employer/shift/${shift.id}`}>
                  <Button className="w-full md:w-auto">
                    Manage Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No shifts posted yet</p>
            <Link to="/employer/post-shift">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Shift
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Profile settings coming soon</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4">
        {view === "dashboard" && renderDashboard()}
        {view === "my-shifts" && renderMyShifts()}
        {view === "profile" && renderProfile()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 py-2">
            <button
              onClick={() => setView("dashboard")}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-lg transition-colors",
                view === "dashboard" ? "text-blue-600 bg-blue-50 dark:bg-blue-950" : "text-muted-foreground"
              )}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <Link to="/employer/post-shift" className="flex flex-col items-center gap-1 py-3 rounded-lg transition-colors text-muted-foreground hover:text-blue-600">
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Post Shift</span>
            </Link>
            <button
              onClick={() => setView("my-shifts")}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-lg transition-colors",
                view === "my-shifts" ? "text-blue-600 bg-blue-50 dark:bg-blue-950" : "text-muted-foreground"
              )}
            >
              <Briefcase className="h-6 w-6" />
              <span className="text-xs font-medium">My Shifts</span>
            </button>
            <button
              onClick={() => setView("profile")}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-lg transition-colors",
                view === "profile" ? "text-blue-600 bg-blue-50 dark:bg-blue-950" : "text-muted-foreground"
              )}
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

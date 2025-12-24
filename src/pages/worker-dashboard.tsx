import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Map, User, MapPin, DollarSign, Clock, Briefcase, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkerDashboard() {
  const [view, setView] = useState<"dashboard" | "map" | "profile">("dashboard");
  const [filters, setFilters] = useState({
    distance: "",
    minPay: "",
    maxPay: "",
    shiftType: "",
    sortBy: "nearest",
  });

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ["shifts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.distance) params.append("distance", filters.distance);
      if (filters.minPay) params.append("minPay", filters.minPay);
      if (filters.maxPay) params.append("maxPay", filters.maxPay);
      if (filters.shiftType) params.append("shiftType", filters.shiftType);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      
      const response = await apiClient.api.shifts.$get({ query: Object.fromEntries(params) });
      return response.json();
    },
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const response = await apiClient.api.applications["my-applications"].$get();
      return response.json();
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await apiClient.api.users.profile.$get();
      return response.json();
    },
  });

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
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status] || colors.pending;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="opacity-90">Find your next shift below</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Distance (km)</label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Pay ($/hr)</label>
            <Input
              type="number"
              placeholder="e.g., 15"
              value={filters.minPay}
              onChange={(e) => setFilters({ ...filters, minPay: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Pay ($/hr)</label>
            <Input
              type="number"
              placeholder="e.g., 30"
              value={filters.maxPay}
              onChange={(e) => setFilters({ ...filters, maxPay: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Shift Type</label>
            <Select value={filters.shiftType} onValueChange={(value) => setFilters({ ...filters, shiftType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest">Nearest First</SelectItem>
                <SelectItem value="highest_pay">Highest Pay</SelectItem>
                <SelectItem value="soonest">Soonest Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Available Shifts</h3>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : shiftsData?.shifts && shiftsData.shifts.length > 0 ? (
          <div className="space-y-4">
            {shiftsData.shifts.map((shift: any) => (
              <Card key={shift.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{shift.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shift.employer?.companyName || shift.employer?.name}
                      </p>
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
                      <MapPin className="h-4 w-4" />
                      {shift.distance ? `${shift.distance.toFixed(1)} km` : "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {shift.applicationCount} applied
                    </div>
                  </div>

                  {shift.userApplication ? (
                    <Badge className={getStatusColor(shift.userApplication.status)}>
                      {shift.userApplication.status}
                    </Badge>
                  ) : (
                    <Link to={`/worker/shift/${shift.id}`}>
                      <Button className="w-full md:w-auto">View & Apply</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No shifts available at the moment</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderMap = () => (
    <div>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Map view will be implemented here</p>
          <Link to="/worker/map" className="block mt-4">
            <Button className="w-full">Open Full Map View</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Completed Shifts</p>
              <p className="text-2xl font-bold">{userData?.user?.completedShifts || 0}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">${userData?.user?.totalEarnings?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Reliability Score</p>
              <p className="text-2xl font-bold">{userData?.user?.reliabilityScore?.toFixed(0) || 100}%</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Applications</p>
              <p className="text-2xl font-bold">
                {applicationsData?.applications?.filter((a: any) => a.application.status === "pending").length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applicationsData?.applications && applicationsData.applications.length > 0 ? (
            <div className="space-y-3">
              {applicationsData.applications.slice(0, 5).map((item: any) => (
                <div key={item.application.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.shift?.title}</p>
                    <p className="text-sm text-muted-foreground">{item.shift?.date}</p>
                  </div>
                  <Badge className={getStatusColor(item.application.status)}>
                    {item.application.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No applications yet</p>
          )}
        </CardContent>
      </Card>

      <Link to="/worker/profile/edit">
        <Button className="w-full">Edit Profile</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4">
        {view === "dashboard" && renderDashboard()}
        {view === "map" && renderMap()}
        {view === "profile" && renderProfile()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 py-2">
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
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-lg transition-colors",
                view === "map" ? "text-blue-600 bg-blue-50 dark:bg-blue-950" : "text-muted-foreground"
              )}
            >
              <Map className="h-6 w-6" />
              <span className="text-xs font-medium">Map</span>
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

import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, DollarSign, Clock, Briefcase, Building, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";

export default function WorkerShiftDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: shiftData, isLoading } = useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      const response = await apiClient.api.shifts[":id"].$get({ param: { id: id! } });
      return response.json();
    },
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.applications.$post({
        json: { shiftId: id! },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!shiftData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Shift not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{shiftData.title}</h1>
          <p className="opacity-90">{shiftData.employer?.companyName || shiftData.employer?.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Shift Details</CardTitle>
              <Badge className={getShiftTypeColor(shiftData.shiftType)}>
                {shiftData.shiftType}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pay Rate</p>
                  <p className="text-xl font-bold">${shiftData.payRate}/hr</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-semibold">{shiftData.date}</p>
                  <p className="text-sm">{shiftData.startTime} - {shiftData.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <MapPin className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold">
                    {shiftData.distance ? `${shiftData.distance.toFixed(1)} km away` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Applicants</p>
                  <p className="font-semibold">{shiftData.applicationCount || 0} applied</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{shiftData.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h3>
              <p className="text-muted-foreground">{shiftData.address}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Employer
              </h3>
              <p className="text-muted-foreground">
                {shiftData.employer?.companyName || shiftData.employer?.name}
              </p>
            </div>

            {shiftData.isUrgent && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  🚨 Urgent Shift - Immediate hire needed!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {shiftData.userApplication ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">Your Application</p>
                  <p className="text-sm text-muted-foreground">
                    Applied on {new Date(shiftData.userApplication.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(shiftData.userApplication.status)}>
                  {shiftData.userApplication.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="w-full"
            size="lg"
          >
            {applyMutation.isPending ? "Applying..." : "Apply for This Shift"}
          </Button>
        )}
      </div>
    </div>
  );
}

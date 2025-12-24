import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Phone, CheckCircle, XCircle, Award } from "lucide-react";
import { toast } from "sonner";

export default function EmployerShiftDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: shiftData } = useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      const response = await apiClient.api.shifts[":id"].$get({ param: { id: id! } });
      return response.json();
    },
    enabled: !!id,
  });

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ["shift-applications", id],
    queryFn: async () => {
      const response = await apiClient.api.applications.shift[":shiftId"].$get({ 
        param: { shiftId: id! } 
      });
      return response.json();
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: "approved" | "rejected" }) => {
      const response = await apiClient.api.applications[":id"].status.$patch({
        param: { id: applicationId },
        json: { status },
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Application ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["shift-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["employer-shifts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update application");
    },
  });

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
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const pendingApplications = applicationsData?.applications?.filter(
    (a: any) => a.application.status === "pending"
  ) || [];

  const approvedApplications = applicationsData?.applications?.filter(
    (a: any) => a.application.status === "approved"
  ) || [];

  const otherApplications = applicationsData?.applications?.filter(
    (a: any) => !["pending", "approved"].includes(a.application.status)
  ) || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{shiftData?.title}</h1>
          <p className="opacity-90">
            {shiftData?.date} • ${shiftData?.payRate}/hr
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
              <p className="text-3xl font-bold">{applicationsData?.applications?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">{pendingApplications.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {approvedApplications.length}/{shiftData?.workersNeeded || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {pendingApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingApplications.map((item: any) => (
                <div
                  key={item.application.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{item.worker?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {item.worker?.phone}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.application.status)}>
                      {item.application.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Reliability Score</p>
                        <p className="font-semibold">
                          {item.worker?.reliabilityScore?.toFixed(0) || 100}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Completed Shifts</p>
                        <p className="font-semibold">{item.worker?.completedShifts || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          applicationId: item.application.id,
                          status: "approved",
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          applicationId: item.application.id,
                          status: "rejected",
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {approvedApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approved Workers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvedApplications.map((item: any) => (
                <div
                  key={item.application.id}
                  className="flex justify-between items-center p-4 border rounded-lg bg-green-50 dark:bg-green-950"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.worker?.name}</p>
                      <p className="text-sm text-muted-foreground">{item.worker?.phone}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.application.status)}>
                    {item.application.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {otherApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherApplications.map((item: any) => (
                <div
                  key={item.application.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{item.worker?.name}</p>
                    <p className="text-sm text-muted-foreground">{item.worker?.phone}</p>
                  </div>
                  <Badge className={getStatusColor(item.application.status)}>
                    {item.application.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {applicationsData?.applications?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No applications yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

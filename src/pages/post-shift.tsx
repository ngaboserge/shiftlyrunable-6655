import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

export default function PostShift() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    latitude: 0,
    longitude: 0,
    address: "",
    date: "",
    startTime: "",
    endTime: "",
    payRate: "",
    shiftType: "warehouse" as const,
    workersNeeded: "1",
    isUrgent: false,
  });
  const [locationLoading, setLocationLoading] = useState(false);

  const postShift = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.api.shifts.$post({
        json: {
          ...data,
          payRate: parseFloat(data.payRate),
          workersNeeded: parseInt(data.workersNeeded),
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Shift posted successfully!");
      navigate("/employer/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post shift");
    },
  });

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLocationLoading(false);
          toast.success("Location detected");
        },
        (error) => {
          console.error(error);
          toast.error("Could not detect location");
          setLocationLoading(false);
        }
      );
    } else {
      toast.error("Geolocation not supported");
      setLocationLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error("Please set the shift location");
      return;
    }
    if (!formData.payRate || parseFloat(formData.payRate) <= 0) {
      toast.error("Please enter a valid pay rate");
      return;
    }
    postShift.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl">Post a New Shift</CardTitle>
            </div>
            <CardDescription>
              Fill in the details to attract qualified workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Warehouse Associate, Event Staff"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the job responsibilities, requirements, etc."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftType">Shift Type *</Label>
                <Select
                  value={formData.shiftType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, shiftType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payRate">Pay Rate ($/hour) *</Label>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    value={formData.payRate}
                    onChange={(e) =>
                      setFormData({ ...formData, payRate: e.target.value })
                    }
                    placeholder="e.g., 18.50"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workersNeeded">Number of Workers Needed *</Label>
                <Input
                  id="workersNeeded"
                  type="number"
                  min="1"
                  value={formData.workersNeeded}
                  onChange={(e) =>
                    setFormData({ ...formData, workersNeeded: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {locationLoading ? "Detecting..." : "Use Current Location"}
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-sm text-muted-foreground">
                    Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Business St, City, State"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isUrgent">Urgent Shift</Label>
                  <p className="text-sm text-muted-foreground">
                    Send push notifications to nearby workers
                  </p>
                </div>
                <Switch
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isUrgent: checked })
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={postShift.isPending}
                >
                  {postShift.isPending ? "Posting..." : "Post Shift"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

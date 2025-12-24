import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Briefcase, User } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "worker";
  
  const [formData, setFormData] = useState({
    phone: "",
    latitude: 0,
    longitude: 0,
    address: "",
    skills: "",
    companyName: "",
    industry: "",
  });
  const [locationLoading, setLocationLoading] = useState(false);

  const workerOnboarding = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.api.onboarding.worker.$post({
        json: {
          phone: data.phone,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          skills: data.skills || undefined,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Welcome to Shiftly!");
      navigate("/worker/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Onboarding failed");
    },
  });

  const employerOnboarding = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.api.onboarding.employer.$post({
        json: {
          companyName: data.companyName,
          phone: data.phone,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          industry: data.industry || undefined,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Welcome to Shiftly!");
      navigate("/employer/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Onboarding failed");
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
      toast.error("Please set your location");
      return;
    }
    if (role === "worker") {
      workerOnboarding.mutate(formData);
    } else {
      if (!formData.companyName) {
        toast.error("Please enter your company name");
        return;
      }
      employerOnboarding.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {role === "worker" ? (
                <User className="h-8 w-8 text-blue-600" />
              ) : (
                <Briefcase className="h-8 w-8 text-blue-600" />
              )}
              <CardTitle className="text-2xl">
                {role === "worker" ? "Worker Profile Setup" : "Employer Profile Setup"}
              </CardTitle>
            </div>
            <CardDescription>
              Complete your profile to {role === "worker" ? "find shifts" : "post shifts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {role === "employer" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
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
                  placeholder="123 Main St, City, State"
                  required
                />
              </div>

              {role === "worker" ? (
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (optional)</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                    placeholder="e.g., Warehouse experience, Forklift certified, Customer service"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    placeholder="e.g., Retail, Hospitality, Logistics"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={workerOnboarding.isPending || employerOnboarding.isPending}
              >
                {workerOnboarding.isPending || employerOnboarding.isPending
                  ? "Setting up..."
                  : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

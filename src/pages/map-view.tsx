import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Clock, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const { data: shiftsData } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const response = await apiClient.api.shifts.$get();
      return response.json();
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation([40.7128, -74.006]);
        }
      );
    } else {
      setUserLocation([40.7128, -74.006]);
    }
  }, []);

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

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Shifts Near You</h1>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={userLocation}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <MapUpdater center={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={userLocation}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>

          {shiftsData?.shifts?.map((shift: any) => (
            <Marker
              key={shift.id}
              position={[shift.latitude, shift.longitude]}
            >
              <Popup maxWidth={300}>
                <Card className="border-0 shadow-none">
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-sm">{shift.title}</h3>
                      <Badge className={getShiftTypeColor(shift.shiftType)}>
                        {shift.shiftType}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {shift.description}
                    </p>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-semibold">${shift.payRate}/hr</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {shift.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {shift.distance ? `${shift.distance.toFixed(1)} km away` : "N/A"}
                      </div>
                    </div>

                    <Link to={`/worker/shift/${shift.id}`}>
                      <Button size="sm" className="w-full text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from "react-router-dom";


const ReportIssue = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    title: "",
    description: "",
    name: "",
    email: "",
  });


  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // New map/modal state
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Default to Hetauda, Nepal (fallback). Will be overridden on mount if geolocation available.
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.4167, 85.0333]);
  const [tempPosition, setTempPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [tempAddress, setTempAddress] = useState<string | null>(null);

  const mapRef = React.useRef<any | null>(null);
  const markerRef = React.useRef<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletLoadError, setLeafletLoadError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);  // Store the actual file
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = () => {
    // Mock location selection - in real app would use map API
    setSelectedLocation({
      lat: 37.7749,
      lng: -122.4194,
      address: "123 Main Street, San Francisco, CA 94102"
    });
    toast({
      title: "Location selected",
      description: "Your current location has been set as the issue location.",
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please sign in to submit a report.",
      });
      navigate("/login");
      return;
    }

    // Client-side validation
    if (!formData.category || !formData.severity) {
      setError("Please select a category and severity.");
      return;
    }
    // simple email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData and append all fields - avoid shadowing state variable name
      const payload = new FormData();
      payload.append("category", formData.category);
      payload.append("severity", formData.severity);
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("name", formData.name);
      payload.append("email", formData.email);

      if (selectedLocation) {
        payload.append("location_lat", String(selectedLocation.lat));
        payload.append("location_lng", String(selectedLocation.lng));
        payload.append("location_address", selectedLocation.address);
      }

      if (selectedFile) {
        payload.append("image", selectedFile);
      }

      const response = await fetch("http://127.0.0.1:8000/api/reports/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` // DO NOT set Content-Type for multipart
        },
        body: payload,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Submission error:", data);
        // show backend validation messages if present
        if (data && typeof data === "object") {
          const msg = data.detail || Object.values(data).flat().join(", ");
          setError(msg || "Submission failed.");
        } else {
          setError("Submission failed.");
        }
        toast({
          title: "Error submitting report",
          description: "Please check all required fields and try again.",
        });
      } else {
        toast({
          title: "Report submitted successfully!",
          description: "Thank you for helping protect our Community.",
        });
        // Reset form
        setFormData({
          category: "",
          severity: "",
          title: "",
          description: "",
          name: "",
          email: "",
        });
        setSelectedLocation(null);
        setUploadedImage(null);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please try again.");
    }
    setIsSubmitting(false);
  };

  // Open the map modal and try to set current geolocation as default center
  const openLocationPicker = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter([lat, lng]);
          setTempPosition({ lat, lng });
          setIsMapOpen(true);
        },
        () => {
          // geolocation failed / denied -> open with fallback center
          setMapCenter([27.4167, 85.0333]);
          setTempPosition({ lat: 27.4167, lng: 85.0333 });
          setIsMapOpen(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsMapOpen(true);
    }
  };

  // Confirm selection from map modal: reverse geocode (Nominatim) for an address, then set selectedLocation
  const confirmMapSelection = async () => {
    if (!tempPosition) {
      toast({ title: "No location selected", description: "Please click on the map to select a location." });
      return;
    }
    const { lat, lng } = tempPosition;
    // prefer already-fetched tempAddress; otherwise fall back to reverse geocode
    let address = tempAddress || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    if (!tempAddress) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.display_name) address = json.display_name;
        }
      } catch { /* ignore */ }
    }
    setSelectedLocation({ lat, lng, address });
    setIsMapOpen(false);
    toast({ title: "Location selected", description: "Location saved for the report." });
  };

  // Load Leaflet JS/CSS from CDN when modal opens
  useEffect(() => {
    if (!isMapOpen || leafletLoaded || leafletLoadError) return;
    // Inject CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Inject JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => setLeafletLoadError("Map unavailable. Please use coordinates input.");
      document.body.appendChild(script);
    } else {
      // script already present
      if ((window as any).L) setLeafletLoaded(true);
    }
  }, [isMapOpen, leafletLoaded, leafletLoadError]);

  // Initialize / cleanup plain Leaflet map when loaded and modal opened/closed
  useEffect(() => {
    if (!isMapOpen) {
      // cleanup map on modal close
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }
    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L) {
      setLeafletLoadError("Map library missing. Use coordinate inputs.");
      return;
    }
    // initialize map only once per modal open
    if (!mapRef.current) {
      const m = L.map("leaflet-map", { center: mapCenter, zoom: 16 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(m);
      // click handler to set tempPosition and marker (show loading popup while reverse geocoding)
      m.on("click", (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setTempPosition({ lat, lng });
        setTempAddress(null);
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
          markerRef.current.bindPopup("Loading place name...").openPopup();
        } else {
          markerRef.current = L.circleMarker(e.latlng, { color: "red", radius: 8 }).addTo(m);
          markerRef.current.bindPopup("Loading place name...").openPopup();
        }
        // reverse geocode and update popup
        reverseGeocode(lat, lng);
      });
      // if we already have a tempPosition, show marker and fetch address
      if (tempPosition) {
        markerRef.current = L.circleMarker([tempPosition.lat, tempPosition.lng], { color: "red", radius: 8 }).addTo(m);
        markerRef.current.bindPopup("Loading place name...").openPopup();
        m.setView([tempPosition.lat, tempPosition.lng], 16);
        reverseGeocode(tempPosition.lat, tempPosition.lng);
      }
      mapRef.current = m;
    }
    return () => {
      // do not remove map here; modal-close effect handles cleanup
    };
  }, [isMapOpen, leafletLoaded, mapCenter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep marker in sync when tempPosition changes (e.g., geolocation or manual inputs)
  useEffect(() => {
    if (!tempPosition) return;
    // update map/marker when available
    if (mapRef.current) {
      try {
        // re-evaluate layout then pan/center to the new position so marker and tiles align
        mapRef.current.invalidateSize();
        mapRef.current.panTo([tempPosition.lat, tempPosition.lng]);
        if (markerRef.current) {
          markerRef.current.setLatLng([tempPosition.lat, tempPosition.lng]);
          markerRef.current.bindPopup("Loading place name...").openPopup();
        } else {
          const L = (window as any).L;
          if (L) {
            markerRef.current = L.circleMarker([tempPosition.lat, tempPosition.lng], { color: "red", radius: 8 }).addTo(mapRef.current);
            markerRef.current.bindPopup("Loading place name...").openPopup();
          }
        }
      } catch { /* ignore errors while map is initializing */ }
    }
    // fetch place/building name for the new coordinates
    reverseGeocode(tempPosition.lat, tempPosition.lng);
  }, [tempPosition]);

  // Reverse geocode helper: fetch place/building name and update tempAddress + marker popup
  const reverseGeocode = async (lat: number, lng: number) => {
    setTempAddress(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`);
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const display = json?.display_name || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
      setTempAddress(display);
      // update marker popup if present
      if (markerRef.current) {
        try {
          markerRef.current.bindPopup(display).openPopup();
        } catch { /* ignore popup errors */ }
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  // On mount: try to set default location to the user's current position.
  // If unavailable, fall back to Hetauda, Nepal.
  useEffect(() => {
    const HETAUDA: { lat: number; lng: number } = { lat: 27.4167, lng: 85.0333 };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter([lat, lng]);
          setTempPosition({ lat, lng });
        },
        () => {
          setMapCenter([HETAUDA.lat, HETAUDA.lng]);
          setTempPosition({ lat: HETAUDA.lat, lng: HETAUDA.lng });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setMapCenter([HETAUDA.lat, HETAUDA.lng]);
      setTempPosition({ lat: HETAUDA.lat, lng: HETAUDA.lng });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Report an Issue
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help us improve our city by reporting problems in your neighborhood.
            Every report moves us closer to a cleaner, safer, and better community.
          </p>
        </div>

        {/* Report Form */}
        <Card className="eco-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span>Issue Details</span>
            </CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us understand and address the issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Issue Category</Label>
                  <Select name="category" required value={formData.category} onValueChange={value => setFormData(f => ({ ...f, category: value }))}>
                    <SelectTrigger className="eco-input">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road & Infrastructure</SelectItem>
                      <SelectItem value="water">Water & Utilities</SelectItem>
                      <SelectItem value="electricity">Electricity Problems</SelectItem>
                      <SelectItem value="park">Park & Recreation</SelectItem>
                      <SelectItem value="environment">Environmental Issue</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity Level</Label>
                  <Select name="severity" required value={formData.severity} onValueChange={value => setFormData(f => ({ ...f, severity: value }))}>
                    <SelectTrigger className="eco-input">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of the issue"
                  className="eco-input"
                  required
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide detailed information about the issue..."
                  className="eco-input min-h-[120px]"
                  required
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex space-x-2">
                  <Input
                    value={selectedLocation?.address || ''}
                    placeholder="Click 'Use Current Location' or enter address manually"
                    className="eco-input flex-1"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="eco-outline"
                    onClick={openLocationPicker}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Use Current Location</span>
                  </Button>
                </div>
                {selectedLocation && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 mt-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Location confirmed</span>
                  </div>
                )}
              </div>

              {/* Map modal (popup) */}
              {isMapOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setIsMapOpen(false)} />
                  <div className="relative w-[90%] max-w-4xl bg-background rounded-lg shadow-lg p-4 z-10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Select Location</h3>
                      <div className="space-x-2">
                        <Button type="button" variant="eco-ghost" onClick={() => setIsMapOpen(false)}>Cancel</Button>
                        <Button type="button" variant="eco" onClick={confirmMapSelection}>Confirm</Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Click on the map to set the marker. You can also adjust coordinates below or use your device's location.
                      </p>
                      {/* If Leaflet loaded, render interactive container, otherwise fallback to coordinate inputs */}
                      {leafletLoaded ? (
                        <div id="leaflet-map" className="h-96 w-full rounded overflow-hidden" />
                      ) : (
                        <div className="space-y-3">
                          {leafletLoadError ? (
                            <div className="text-sm text-red-600">{leafletLoadError}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Loading map…</div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="lat">Latitude</Label>
                              <Input
                                id="lat"
                                type="number"
                                step="any"
                                value={tempPosition ? String(tempPosition.lat) : ""}
                                onChange={(e) => setTempPosition(p => ({ lat: Number(e.target.value || 0), lng: p?.lng ?? mapCenter[1] }))}
                                className="eco-input"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="lng">Longitude</Label>
                              <Input
                                id="lng"
                                type="number"
                                step="any"
                                value={tempPosition ? String(tempPosition.lng) : ""}
                                onChange={(e) => setTempPosition(p => ({ lat: p?.lat ?? mapCenter[0], lng: Number(e.target.value || 0) }))}
                                className="eco-input"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button type="button" variant="eco-outline" onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                  setTempPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                });
                              } else {
                                toast({ title: "Geolocation unavailable", description: "Your browser doesn't support geolocation." });
                              }
                            }}>
                              Use Current Location
                            </Button>
                            <a
                              className="text-sm text-muted-foreground underline"
                              target="_blank"
                              rel="noreferrer"
                              href={tempPosition ? `https://www.openstreetmap.org/?mlat=${tempPosition.lat}&mlon=${tempPosition.lng}#map=18/${tempPosition.lat}/${tempPosition.lng}` : 'https://www.openstreetmap.org'}
                            >
                              Preview on OpenStreetMap
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Adjust coordinates and press Confirm to save this location for the report.
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo Evidence (Optional)</Label>
                <div
                  className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedImage}
                        alt="Uploaded evidence"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="eco-outline"
                        onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setSelectedFile(null); }}
                        className="mx-auto"
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Upload a photo to help illustrate the issue
                        </p>
                        <div className="mx-auto">
                          <Button type="button" variant="eco-outline" className="flex items-center space-x-2 mx-auto">
                            <Upload className="h-4 w-4" />
                            <span>Choose File</span>
                          </Button>
                        </div>
                        <input
                          id="photo-upload"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    className="eco-input"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                  />
 
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                   <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="eco-input"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-border/50">
                {/* <Button type="button" variant="eco-ghost">
                  Save as Draft
                </Button> */}
                <Button 
                  type="submit" 
                  variant="eco" 
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card className="eco-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>What happens next?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Review Process</h3>
                <p className="text-sm text-muted-foreground">
                  Our team reviews your report within 24 hours
                </p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Investigation</h3>
                <p className="text-sm text-muted-foreground">
                  Local authorities are notified and begin investigation
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Resolution</h3>
                <p className="text-sm text-muted-foreground">
                  You receive updates on the resolution progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;
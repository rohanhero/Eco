import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import heroBackground from "@/assets/background.jpg";

const ReportIssue = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
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

  // Duplicate detection modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);
  const [pendingReportData, setPendingReportData] = useState<FormData | null>(
    null,
  );

  // Map/modal state
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    27.4167, 85.0333,
  ]);
  const [tempPosition, setTempPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [tempAddress, setTempAddress] = useState<string | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletLoadError, setLeafletLoadError] = useState<string | null>(null);

  // Live validation state for contact information
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Email regex for validation
  const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  // Validate name: non-empty and at least 2 characters
  const validateName = (name: string) => {
    if (!name || !name.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (name.trim().length < 5) {
      setNameError("Name must be at least 5 characters");
      return false;
    }
    setNameError(null);
    return true;
  };

  // Validate email: valid email format
  const validateEmail = (email: string) => {
    if (!email || !email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Store the actual file
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
      address: "123 Main Street, San Francisco, CA 94102",
    });
    toast({
      title: "Location selected",
      description: "Your current location has been set as the issue location.",
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    validateName(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    validateEmail(value);
  };

  const handleProceedWithSubmission = async () => {
    if (!pendingReportData) return;

    setShowDuplicateModal(false);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/api/reports/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: pendingReportData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Submission error:", data);
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
          description: "Thank you for helping protect our City.",
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
        setPendingReportData(null);
        setPotentialDuplicates([]);
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleCancelSubmission = () => {
    setShowDuplicateModal(false);
    setPendingReportData(null);
    setPotentialDuplicates([]);
    setIsSubmitting(false);
  };

  const handleConfirmSubmission = async () => {
    if (!pendingReportData) return;

    const token = localStorage.getItem("access");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please sign in to submit a report.",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setShowDuplicateModal(false);

    try {
      // Add force flag to bypass duplicate check
      pendingReportData.append("force_submit", "true");

      const response = await fetch("http://127.0.0.1:8000/api/reports/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // DO NOT set Content-Type for multipart
        },
        body: pendingReportData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Submission error:", data);
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
          description: "Thank you for helping protect our City.",
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
    } finally {
      setIsSubmitting(false);
      setPendingReportData(null);
      setPotentialDuplicates([]);
    }
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
    // Validate name and email
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    if (!isNameValid || !isEmailValid) {
      setError("Please fix the errors in contact information.");
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
          Authorization: `Bearer ${token}`, // DO NOT set Content-Type for multipart
        },
        body: payload,
      });

      const data = await response.json().catch(() => null);

      if (response.status === 409 && data && data.potential_duplicates) {
        // Duplicates found - show modal for user confirmation
        setPotentialDuplicates(data.potential_duplicates);
        setPendingReportData(payload);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }

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
          description: "Thank you for helping protect our City.",
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

          // Update map center and temp position
          setMapCenter([lat, lng]);
          setTempPosition({ lat, lng });
          setTempAddress(null);

          // Open modal after setting location
          setIsMapOpen(true);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          // fallback to default Kathmandu location
          const fallback = { lat: 27.7172, lng: 85.324 }; // Kathmandu center
          setMapCenter([fallback.lat, fallback.lng]);
          setTempPosition(fallback);
          setTempAddress(null);
          setIsMapOpen(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }, // 5 minute cache
      );
    } else {
      // No geolocation support, use default
      const fallback = { lat: 27.7172, lng: 85.324 };
      setMapCenter([fallback.lat, fallback.lng]);
      setTempPosition(fallback);
      setTempAddress(null);
      setIsMapOpen(true);
    }
  };

  // Confirm selection from map modal: reverse geocode (Nominatim) for an address, then set selectedLocation
  const confirmMapSelection = async () => {
    if (!tempPosition) {
      toast({
        title: "No location selected",
        description: "Please click on the map to select a location.",
      });
      return;
    }
    const { lat, lng } = tempPosition;
    // prefer already-fetched tempAddress; otherwise fall back to reverse geocode
    let address = tempAddress || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    if (!tempAddress) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        );
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.display_name) address = json.display_name;
        }
      } catch {
        /* ignore */
      }
    }
    setSelectedLocation({ lat, lng, address });
    setIsMapOpen(false);
    toast({
      title: "Location selected",
      description: "Location saved for the report.",
    });
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
      script.onerror = () =>
        setLeafletLoadError("Map unavailable. Please use coordinates input.");
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
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
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
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(m);

      // Store map reference
      mapRef.current = m;

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
          markerRef.current = L.circleMarker(e.latlng, {
            color: "red",
            radius: 8,
          }).addTo(m);
          markerRef.current.bindPopup("Loading place name...").openPopup();
        }
        // reverse geocode and update popup
        reverseGeocode(lat, lng);
      });

      // if we already have a tempPosition, show marker and fetch address
      if (tempPosition) {
        markerRef.current = L.circleMarker(
          [tempPosition.lat, tempPosition.lng],
          { color: "red", radius: 8 },
        ).addTo(m);
        markerRef.current.bindPopup("Loading place name...").openPopup();
        reverseGeocode(tempPosition.lat, tempPosition.lng);
      }
    }
  }, [isMapOpen, leafletLoaded, leafletLoadError]);

  // Update map center when mapCenter changes
  useEffect(() => {
    if (mapRef.current && mapCenter) {
      mapRef.current.setView(mapCenter, 16);
    }
  }, [mapCenter]);

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
            markerRef.current = L.circleMarker(
              [tempPosition.lat, tempPosition.lng],
              { color: "red", radius: 8 },
            ).addTo(mapRef.current);
            markerRef.current.bindPopup("Loading place name...").openPopup();
          }
        }
      } catch {
        /* ignore errors while map is initializing */
      }
    }
    // fetch place/building name for the new coordinates
    reverseGeocode(tempPosition.lat, tempPosition.lng);
  }, [tempPosition]);

  // Reverse geocode helper: fetch place/building name and update tempAddress + marker popup
  const reverseGeocode = async (lat: number, lng: number) => {
    setTempAddress(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      );
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const display =
        json?.display_name || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
      setTempAddress(display);
      // update marker popup if present
      if (markerRef.current) {
        try {
          markerRef.current.bindPopup(display).openPopup();
        } catch {
          /* ignore popup errors */
        }
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  // On mount: try to set default location to the user's current position.
  // If unavailable, fall back to Hetauda, Nepal.
  useEffect(() => {
    const HETAUDA: { lat: number; lng: number } = {
      lat: 27.4167,
      lng: 85.0333,
    };
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
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setMapCenter([HETAUDA.lat, HETAUDA.lng]);
      setTempPosition({ lat: HETAUDA.lat, lng: HETAUDA.lng });
    }
  }, []);

  // Auto-fill contact info from cached profile (if available) and validate once
  useEffect(() => {
    let mounted = true;
    const storedName = localStorage.getItem("user_name") || "";
    const storedEmail = localStorage.getItem("user_email") || "";
    // If we have cached values use them
    if (storedName || storedEmail) {
      setFormData((f) => ({ ...f, name: storedName, email: storedEmail }));
      if (storedName) validateName(storedName);
      if (storedEmail) validateEmail(storedEmail);
      return;
    }
    // Otherwise, if logged in try to fetch profile from API (mirrors Navigation behavior)
    const token = localStorage.getItem("access");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const name = json?.name || "";
          const email = json?.email || "";
          if (name || email) {
            setFormData((f) => ({ ...f, name, email }));
            if (name) validateName(name);
            if (email) validateEmail(email);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden text-white isolate"
        >
          <img src={heroBackground} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/80 to-[#12A66A]/40" />
          <div className="relative p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-medium">
              <MapPin className="h-3.5 w-3.5" /> Civic reporting
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">
              Report an Issue
            </h1>
            <p className="text-sm sm:text-[15px] text-white/80 mt-2 max-w-xl">
              Report civic issues directly and transparently. Your reports help
              keep Hetauda clean, safe and moving.
            </p>
          </div>
        </motion.section>

        {/* Two-column form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-5 grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-4 sm:gap-6 items-start"
        >
          {/* LEFT — issue details */}
          <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Report Issue Details</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Provide as much detail as possible so we can act fast.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Category + Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Issue Category</Label>
                  <Select
                    name="category"
                    required
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((f) => ({ ...f, category: value }))
                    }
                  >
                    <SelectTrigger className="eco-input">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={6} className="z-[60] max-h-[280px] rounded-xl border border-border/60 bg-white shadow-eco-lg">
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
                  <Select
                    name="severity"
                    required
                    value={formData.severity}
                    onValueChange={(value) =>
                      setFormData((f) => ({ ...f, severity: value }))
                    }
                  >
                    <SelectTrigger className="eco-input">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={6} className="z-[60] max-h-[280px] rounded-xl border border-border/60 bg-white shadow-eco-lg">
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
                  className="eco-input min-h-[110px]"
                  required
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              {/* Location summary (edit opens the map modal) */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input
                    value={selectedLocation?.address || ""}
                    placeholder="Selected location appears here"
                    className="eco-input flex-1"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="eco-outline"
                    onClick={openLocationPicker}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Use Current Location</span>
                  </Button>
                </div>
                {selectedLocation && (
                  <div className="flex items-center gap-2 text-sm text-primary mt-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Location confirmed ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})</span>
                  </div>
                )}
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Photo Evidence (Optional)</Label>
                <div
                  className="border-2 border-dashed border-border/70 rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {uploadedImage ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <img
                        src={uploadedImage}
                        alt="Uploaded evidence"
                        className="max-w-full h-32 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="eco-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                          setSelectedFile(null);
                        }}
                        className="mx-auto"
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-muted-foreground py-4">
                      <Camera className="h-6 w-6" />
                      <p className="text-[13px]">Upload a photo to help illustrate the issue</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    className="eco-input bg-muted/50 cursor-not-allowed"
                    required
                    value={formData.name}
                    disabled
                    title="Name (auto-filled)"
                  />
                  {nameError && (
                    <div className="text-destructive text-sm">{nameError}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Your email"
                    className="eco-input bg-muted/50 cursor-not-allowed"
                    required
                    value={formData.email}
                    disabled
                    title="Email (auto-filled)"
                  />
                  {emailError && (
                    <div className="text-destructive text-sm">{emailError}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — location, guidance, submit */}
          <div className="space-y-4 sm:space-y-5">
            {/* Selected location card */}
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-[15px]">Selected Location</h3>
                <MapPin className="h-4 w-4 text-primary" />
              </div>

              {selectedLocation ? (
                <div className="mt-3">
                  {/* Live map preview of the picked spot (same OSM embed used on Report detail) */}
                  <div className="relative rounded-xl overflow-hidden border border-border/70 aspect-[4/3]">
                    <iframe
                      title="Selected location preview"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0, pointerEvents: "none" }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        selectedLocation.lng - 0.005
                      },${selectedLocation.lat - 0.005},${
                        selectedLocation.lng + 0.005
                      },${selectedLocation.lat + 0.005}&layer=mapnik&marker=${
                        selectedLocation.lat
                      },${selectedLocation.lng}`}
                    />
                    <span className="absolute bottom-2.5 left-2.5 inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground/80 border border-border/60 shadow-sm">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</span>
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[13px] leading-5 text-foreground/85 break-words">{selectedLocation.address}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-[13px] text-muted-foreground">
                  No location selected yet. Pick a spot on the map so crews can
                  find the issue.
                </p>
              )}

              <Button
                type="button"
                variant="eco-outline"
                onClick={openLocationPicker}
                className="mt-3 w-full rounded-xl"
              >
                {selectedLocation ? "Change location" : "Select location on map"}
              </Button>
            </div>

            {/* Guidance card */}
            <div className="rounded-2xl bg-secondary/50 border border-border/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-[15px] text-primary">Good to know</h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-[13px] leading-5 text-foreground/80">
                <li className="flex gap-2"><span className="text-primary font-semibold">•</span> Every report is reviewed within 24 hours.</li>
                <li className="flex gap-2"><span className="text-primary font-semibold">•</span> Keep titles short and descriptions specific.</li>
                <li className="flex gap-2"><span className="text-primary font-semibold">•</span> A photo or map pin speeds up the fix.</li>
              </ul>
            </div>

            {/* Error + submit */}
            <div className="space-y-3">
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-[13px] px-4 py-3">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                variant="eco"
                disabled={isSubmitting || !!nameError || !!emailError}
                className="w-full rounded-xl h-11 text-[15px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </motion.form>

        {/* What happens next */}
        <div className="mt-8 rounded-2xl bg-white border border-border/70 shadow-eco p-5 sm:p-7">
          <h2 className="font-display text-lg font-semibold tracking-tight">What happens next?</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: 1, title: "Review Process", text: "Our team reviews your report within 24 hours", bg: "bg-secondary", tone: "text-primary" },
              { n: 2, title: "Investigation", text: "Local authorities are notified and begin investigation", bg: "bg-blue-50", tone: "text-blue-600" },
              { n: 3, title: "Resolution", text: "You receive updates on the resolution progress", bg: "bg-emerald-50", tone: "text-emerald-600" },
            ].map((step) => (
              <div key={step.n} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-3">
                <div className={`${step.bg} h-10 w-10 rounded-full grid place-items-center shrink-0`}>
                  <span className={`${step.tone} font-bold`}>{step.n}</span>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-[15px]">{step.title}</h3>
                  <p className="text-[13px] text-muted-foreground mt-1">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location map modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMapOpen(false)}
          />
          <div className="relative w-full max-w-4xl bg-background rounded-2xl shadow-eco-lg p-4 sm:p-5 z-10 max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display text-lg font-semibold">Select Location</h3>
              <div className="space-x-2">
                <Button type="button" variant="eco-ghost" onClick={() => setIsMapOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="eco" className="rounded-xl" onClick={confirmMapSelection}>
                  Confirm
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Click on the map to set the marker. You can also adjust coordinates
              below or use your device's location.
            </p>
            {leafletLoaded ? (
              <div id="leaflet-map" className="h-96 w-full rounded-xl overflow-hidden border border-border/60" />
            ) : (
              <div className="space-y-3">
                {leafletLoadError ? (
                  <div className="text-sm text-destructive">{leafletLoadError}</div>
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
                      onChange={(e) =>
                        setTempPosition((p) => ({
                          lat: Number(e.target.value || 0),
                          lng: p?.lng ?? mapCenter[1],
                        }))
                      }
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
                      onChange={(e) =>
                        setTempPosition((p) => ({
                          lat: p?.lat ?? mapCenter[0],
                          lng: Number(e.target.value || 0),
                        }))
                      }
                      className="eco-input"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="eco-outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setTempPosition({
                              lat: pos.coords.latitude,
                              lng: pos.coords.longitude,
                            });
                          },
                        );
                      } else {
                        toast({
                          title: "Geolocation unavailable",
                          description: "Your browser doesn't support geolocation.",
                        });
                      }
                    }}
                  >
                    Use Current Location
                  </Button>
                  <a
                    className="text-sm text-muted-foreground underline"
                    target="_blank"
                    rel="noreferrer"
                    href={
                      tempPosition
                        ? `https://www.openstreetmap.org/?mlat=${tempPosition.lat}&mlon=${tempPosition.lng}#map=18/${tempPosition.lat}/${tempPosition.lng}`
                        : "https://www.openstreetmap.org"
                    }
                  >
                    Preview on OpenStreetMap
                  </a>
                </div>
              </div>
            )}
            <div className="mt-3 text-[13px] text-muted-foreground">
              Adjust coordinates and press Confirm to save this location for the report.
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Detection Modal */}
      <AlertDialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <AlertDialogContent className="max-w-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Potential Duplicate Reports Found</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found {potentialDuplicates.length} similar report
              {potentialDuplicates.length > 1 ? "s" : ""} that might be
              duplicates of your submission. Please review them below and decide
              whether to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {potentialDuplicates.map((duplicate) => (
              <div key={duplicate.id} className="border rounded-xl p-4 bg-muted/40">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h4 className="font-medium text-sm">{duplicate.title}</h4>
                  <span className="shrink-0 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-full font-semibold">
                    {Math.round(duplicate.similarity_score * 100)}% similar
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Category: {duplicate.category} • Severity: {duplicate.severity}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  Submitted:{" "}
                  {new Date(duplicate.created_at).toLocaleDateString()}
                </p>
                {duplicate.location_distance_km && (
                  <p className="text-xs text-muted-foreground">
                    Distance: {duplicate.location_distance_km.toFixed(1)} km away
                  </p>
                )}
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubmission}>
              Cancel Submission
            </AlertDialogCancel>
            <AlertDialogAction className="rounded-lg" onClick={handleConfirmSubmission}>
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportIssue;

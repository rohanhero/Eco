import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ReportIssue = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    title: "",
    description: "",
    name: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: selectedLocation,
          image: uploadedImage,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Submission failed.");
        toast({
          title: "Error submitting report",
          description: data.detail || "Submission failed.",
        });
      } else {
        toast({
          title: "Report submitted successfully!",
          description: "Thank you for helping protect our environment. We'll review your report shortly.",
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
      }
    } catch (err) {
      setError("Network error.");
      toast({
        title: "Network error",
        description: "Could not submit report.",
      });
    }
    setIsSubmitting(false);
  };

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
                      <SelectItem value="air-quality">Road & Infrastructure</SelectItem>
                      <SelectItem value="water">Water & Utilities</SelectItem>
                      <SelectItem value="electricity">Electricity Problems</SelectItem>
                      <SelectItem value="electricity">Park & Recreation</SelectItem>
                      <SelectItem value="electricity">Environmental Issue</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="waste">Others</SelectItem>
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
                    onClick={handleLocationSelect}
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

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo Evidence (Optional)</Label>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
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
                        onClick={() => setUploadedImage(null)}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Upload a photo to help illustrate the issue
                        </p>
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <Button type="button" variant="eco-outline" className="flex items-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <span>Choose File</span>
                          </Button>
                        </Label>
                        <input
                          id="photo-upload"
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
                <Button type="button" variant="eco-ghost">
                  Save as Draft
                </Button>
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
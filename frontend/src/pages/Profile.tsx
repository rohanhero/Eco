import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ReportCard, { Report } from "@/components/ReportCard";
import {
  MapPin,
  TrendingUp,
  Users,
  Shield,
  Leaf,
  Droplets,
  Zap,
  Wind,
} from "lucide-react";
import heroBackground from "@/assets/background.jpg";

// Mock data for reports
const mockReports: Report[] = [
  {
    id: "1",
    title: "Illegal Dumping in Riverside Park",
    description:
      "Large amounts of construction waste dumped near the river. This is affecting local wildlife and water quality.",
    category: "waste",
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "Riverside Park, San Francisco, CA",
    },
    author: "Sarah Chen",
    createdAt: "2024-01-15T10:30:00Z",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
    status: "pending",
  },
  {
    id: "2",
    title: "Water Leak in Main Street",
    description:
      "Continuous water leak from underground pipe causing flooding and water waste.",
    category: "water",
    location: {
      lat: 37.7849,
      lng: -122.4094,
      address: "123 Main Street, San Francisco, CA",
    },
    author: "Mike Rodriguez",
    createdAt: "2024-01-14T14:15:00Z",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Broken Street Light",
    description:
      "Street light has been broken for weeks, creating safety hazards and energy waste.",
    category: "electricity",
    location: {
      lat: 37.7649,
      lng: -122.4294,
      address: "Oak Avenue & Pine Street, San Francisco, CA",
    },
    author: "Lisa Park",
    createdAt: "2024-01-13T09:45:00Z",
    status: "resolved",
  },
];

const stats = [
  {
    label: "Total Reports",
    value: "1,247",
    icon: MapPin,
    color: "text-blue-600",
  },
  {
    label: "Issues Resolved",
    value: "892",
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    label: "Active Users",
    value: "3,451",
    icon: Users,
    color: "text-purple-600",
  },
  {
    label: "Communities Protected",
    value: "48",
    icon: Shield,
    color: "text-orange-600",
  },
];

const categories = [
  {
    name: "Waste Management",
    icon: Leaf,
    count: 342,
    color: "text-green-600 bg-green-100",
  },
  {
    name: "Water Issues",
    icon: Droplets,
    count: 289,
    color: "text-blue-600 bg-blue-100",
  },
  {
    name: "Electricity Problems",
    icon: Zap,
    count: 156,
    color: "text-yellow-600 bg-yellow-100",
  },
  {
    name: "Air Quality",
    icon: Wind,
    count: 98,
    color: "text-purple-600 bg-purple-100",
  },
];

const Profile = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/reports/")
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleViewDetails = (id: string) => {
    navigate(`/reports/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Recent Reports */}
      <section className="py-16 bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Your Reports
              </h2>
              <p className="text-muted-foreground">
                All issues you have reported
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="text-center col-span-3">Loading reports...</div>
            ) : (
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </div>
        </div>
      </section>
      {/* ...you can add more profile-specific sections here if needed... */}
    </div>
  );
};

export default Profile;
             
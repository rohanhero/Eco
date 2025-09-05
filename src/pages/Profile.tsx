import { Link } from "react-router-dom";
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

const Home = () => {
  const handleViewDetails = (id: string) => {
    console.log("View report details:", id);
    // Navigate to report details page
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
    

      {/* Recent Reports */}
      <section className="py-16 bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Recent Reports
              </h2>
              <p className="text-muted-foreground">
                Latest environmental issues reported by our community
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of environmentally conscious citizens who are
            actively protecting their communities. Start reporting issues today.
          </p>
          <div className="space-x-4">
            <Link to="/signup">
              <Button variant="eco" size="lg" className="text-lg px-8">
                Get Started Now
              </Button>
            </Link>
            <Link to="/report">
              <Button variant="eco-outline" size="lg" className="text-lg px-8">
                Report Your First Issue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

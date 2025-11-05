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
    const load = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/");
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("Failed to fetch reports", res.status, payload);
          setReports([]);
        } else {
          if (Array.isArray(payload)) {
            setReports(payload);
          } else if (payload && Array.isArray((payload as any).results)) {
            setReports((payload as any).results);
          } else {
            console.error("Unexpected reports payload shape:", payload);
            setReports([]);
          }
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    load();
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

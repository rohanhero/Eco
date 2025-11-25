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
import { useEffect, useState } from "react";

const stats = [
  {
    label: "Total Reports",
    value: "500",
    icon: MapPin,
    color: "text-blue-600",
  },
  {
    label: "Issues Resolved",
    value: "200",
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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: Check login status
  const isLoggedIn = !!localStorage.getItem("access");

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
        console.error("Network or parsing error fetching reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleViewDetails = (id: string) => {
    console.log("View report details:", id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="hero-section min-h-[70vh] flex items-center justify-center text-white relative"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Building a Better Community
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-fade-in">
            Report city issues, track their progress, and help build a safer,
            cleaner community for everyone.
          </p>
          <div className="flex flex-col gap-4 lg:flex-row m-auto justify-center">
            <Link to="/report">
              <Button variant="eco" size="lg" className="text-lg px-8">
                Report an Issue
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant="eco-outline"
                size="lg"
                className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="text-center animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${stat.color} bg-opacity-10`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-16 bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Recent Reports
              </h2>
              <p className="text-muted-foreground">
                Latest issues reported by our community
              </p>
            </div>
            <Link to={isLoggedIn ? "/profile" : "/login"}>
              <Button
              variant="eco-outline"
              className="transition-all duration-300 hover:scale-105">
              {isLoggedIn ? "View All Reports" : "Log in to View Reports"}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {loading ? (
       <div className="text-center col-span-3">Loading reports...</div>
            ) : !isLoggedIn ? (
        <div className="text-center col-span-3 text-lg text-muted-foreground">
              🚫 Please log in to view community reports.
          <br />
            <Link to="/login"
             className="inline-block mt-2 px-5 py-2 rounded-full bg-primary/10 text-primary font-medium 
             hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
              Log in to continue
            </Link>
      </div>
          ) :  ( reports
        .filter((r) => !(r as any).resolved) // 👈 show only pending reports
        .slice(0, 3)   // 👈 show only first 3 reports
        .map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onViewDetails={handleViewDetails} />
      ))
  )}
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
            Together, we can create a cleaner, safer, and more vibrant city for
            everyone.
          </p>

          {/* 🔥 UPDATED CTA BUTTONS */}
          <div className="space-x-4 flex flex-col gap-4 lg:flex-row justify-center">
            {!isLoggedIn && (
              <Link to="/signup">
                <Button variant="eco" size="lg" className="text-lg px-8">
                  Get Started Now
                </Button>
              </Link>
            )}

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

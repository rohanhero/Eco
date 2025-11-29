import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ReportCard, { Report } from "@/components/ReportCard";

const Profile = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access");

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="p-10 rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg flex flex-col items-center">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 animate-pulse">
            Access Restricted
          </h2>
          <p className="text-gray-700 text-lg mb-6 text-center max-w-md">
            Oops! You must be logged in to view the progress reports.
          </p>
        </div>
        <div className="absolute bottom-10 flex gap-3 opacity-100 animate-bounce">
          <span className="text-3xl">🔐</span>
          <span className="text-3xl">📄</span>
          <span className="text-3xl">⚡</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/");
        const payload = await res.json().catch(() => null);
        let data: Report[] = [];

        if (res.ok) {
          if (Array.isArray(payload)) data = payload;
          else if (payload?.results) data = payload.results;
        }

        // Sort pending first
        const sorted = data.sort((a, b) => {
          const sa = (a as any).resolved ? 1 : 0;
          const sb = (b as any).resolved ? 1 : 0;
          return sa - sb;
        });

        setReports(sorted);
      } catch (err) {
        console.error("Error fetching:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const handleViewDetails = (id: string) => navigate(`/reports/${id}`);

  // Filter and search logic
 const filteredReports = reports
  .filter((r) => {
    if (filter === "pending") return !(r as any).resolved;
    if (filter === "resolved") return (r as any).resolved;
    return true;
  })
  .filter((r) => {
    const title = r.title?.toLowerCase() || "";
    const category = r.category?.toLowerCase() || "";
    const name = r.name?.toLowerCase() || ""; // <-- add reporter name
    const query = searchQuery.toLowerCase();
    return title.includes(query) || category.includes(query) || name.includes(query);
  });



  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-3xl font-bold">All Reports</h2>
          <input
            type="text"
            placeholder="🔍Search by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="eco-input bg-white/70 backdrop-blur-md border border-green-200 px-4 py-2 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 w-full md:w-80"
          />
        </div>

        {/* Short-by Dropdown */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="appearance-none bg-white/70 backdrop-blur-md border border-green-200 px-4 py-2 pr-10 rounded-xl shadow-md font-medium text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 hover:shadow-lg"
          >
            <option value="all">📄 All Reports</option>
            <option value="pending">⏳ Pending</option>
            <option value="resolved">✅ Resolved</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
          </span>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-center col-span-3">Loading...</div>
          ) : filteredReports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

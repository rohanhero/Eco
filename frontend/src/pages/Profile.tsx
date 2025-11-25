import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ReportCard, { Report } from "@/components/ReportCard";

const Profile = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

// Check login status
const isLoggedIn = !!localStorage.getItem("access");

// If not logged in, show message instead of reports
if (!isLoggedIn) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="p-10 rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 animate-pulse">
          Access Restricted
        </h2>
        <p className="text-gray-700 text-lg mb-6 text-center max-w-md">
          Oops! You must be logged in to view the progress reports.  
          Secure your account and jump right in.
        </p>
      </div>
      {/* Floating icons animation */}
      <div className="absolute bottom-10 flex gap-3 opacity-100 animate-bounce">
        <span className="text-3xl">🔐</span>
        <span className="text-3xl">📄</span>
        <span className="text-3xl">⚡</span>
      </div>
    </div>
  );
}

useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reports/");
      const payload = await res.json().catch(() => null);

      let data: Report[] = [];

      if (!res.ok) {
        console.error("Failed to fetch reports", res.status, payload);
      } else {
        if (Array.isArray(payload)) {
          data = payload;
        } else if (payload && Array.isArray((payload as any).results)) {
          data = (payload as any).results;
        } else {
          console.error("Unexpected reports payload shape:", payload);
        }
      }

      // ⭐ SORT REPORTS HERE (Pending → In-progress → Resolved)
      const sorted = data.sort((a, b) => {
        const sa = a.status || (a as any).resolved ? "resolved" : "pending";
        const sb = b.status || (b as any).resolved ? "resolved" : "pending";

        if (sa === sb) return 0; // same status
        return sa === "pending" ? -1 : 1; // pending first, resolved last
      });

      setReports(sorted);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);


// 
  const handleViewDetails = (id: string) => {
    navigate(`/reports/${id}`);
  };

  // Split reports into pending and resolved
const pendingReports = reports.filter(r => !(r as any).resolved);
const resolvedReports = reports.filter(r => (r as any).resolved);


  return (
    <div className="min-h-screen bg-background">
     {/* Pending / In-Progress Reports */}
<section className="py-16 bg-gradient-card">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold mb-4">Pending Reports</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="text-center col-span-3">Loading...</div>
      ) : pendingReports.length === 0 ? (
        <p>No pending reports.</p>
      ) : (
        pendingReports.map((report) => (
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
{/* Resolved Reports */}
<section className="py-16 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-bold mb-4">Resolved Reports</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="text-center col-span-3">Loading...</div>
      ) : resolvedReports.length === 0 ? (
        <p>No resolved reports yet.</p>
      ) : (
        resolvedReports.map((report) => (
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

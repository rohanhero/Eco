import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReportCard, { Report } from "@/components/ReportCard";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AuroraBackground } from "@/components/ui/aurora-background";

const Profile = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "inprogress" | "resolved"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access");

  const getReportStatus = (report: Partial<Record<string, any>>) => {
    const rawStatus = String(
      report?.status ?? (report?.resolved ? "resolved" : "pending"),
    ).toLowerCase();

    if (rawStatus === "inprogress" || rawStatus === "in-progress")
      return "inprogress";
    if (rawStatus === "resolved" || rawStatus === "complete") return "resolved";
    return "pending";
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
        <div className="p-10 rounded-2xl shadow-xl bg-white/80 backdrop-blur-lg flex flex-col items-center w-full max-w-md">
          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 animate-pulse text-center">
            Access Restricted
          </h2>
          <p className="text-gray-700 text-lg mb-6 text-center">
            Oops! You must be logged in to view the progress reports.
          </p>
        </div>

        <div className="absolute bottom-10 flex gap-3 opacity-100 animate-bounce text-3xl">
          🔐📄⚡
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

        const sorted = data.sort((a, b) => {
          const statusOrder: Record<string, number> = {
            pending: 0,
            inprogress: 1,
            resolved: 2,
          };
          const sa = statusOrder[getReportStatus(a)] ?? 0;
          const sb = statusOrder[getReportStatus(b)] ?? 0;
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

  const filteredReports = reports
    .filter((r) => {
      const status = getReportStatus(r);
      if (filter === "pending") return status === "pending";
      if (filter === "inprogress") return status === "inprogress";
      if (filter === "resolved") return status === "resolved";
      return true;
    })
    .filter((r) => {
      const query = searchQuery.toLowerCase();
      return (
        r.title?.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.name?.toLowerCase().includes(query)
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 bg-white">
        <AuroraBackground className="opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 text-xs font-semibold tracking-widest uppercase text-primary">Community feed</div>
            <h2 className="font-display text-[28px] sm:text-[36px] font-bold tracking-tighter mt-2">All Reports</h2>
            <p className="text-sm text-muted-foreground mt-1">Verified civic ledger — search, filter, and track every report.</p>
          </motion.div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-[360px]">
              <input
                type="text"
                placeholder="Search title, category, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="eco-input w-full pl-4 pr-4 py-2.5 rounded-full text-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-full rounded-full bg-white border border-border/60 shadow-eco font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border border-border/60">
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ------- Responsive Grid of Cards — 1 row 2 sections on mobile ------- */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {loading ? (
            <div className="col-span-2 lg:col-span-3 text-center">Loading...</div>
          ) : filteredReports.length === 0 ? (
            <p className="col-span-2 lg:col-span-3 text-center text-gray-500">
              No reports found.
            </p>
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

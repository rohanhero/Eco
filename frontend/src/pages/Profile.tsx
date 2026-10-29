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
import {
  FolderKanban,
  CircleAlert,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  LogIn,
} from "lucide-react";
import heroBackground from "@/assets/background.jpg";

const Profile = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "inprogress" | "resolved"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    if (!isLoggedIn) return;
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

  const total = reports.length;
  const pendingCount = reports.filter((r) => getReportStatus(r) === "pending").length;
  const inProgressCount = reports.filter((r) => getReportStatus(r) === "inprogress").length;
  const resolvedCount = reports.filter((r) => getReportStatus(r) === "resolved").length;

  const statusStats = [
    { label: "Total Reports", value: total, icon: FolderKanban, tone: "text-primary" },
    { label: "Pending", value: pendingCount, icon: CircleAlert, tone: "text-orange-600" },
    { label: "In Progress", value: inProgressCount, icon: Clock, tone: "text-blue-600" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, tone: "text-emerald-600" },
  ];

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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl border border-border/70 shadow-eco p-8 text-center"
          >
            <div className="mx-auto h-12 w-12 rounded-xl bg-secondary grid place-items-center">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight mt-4">Access Restricted</h2>
            <p className="text-sm text-muted-foreground mt-2">
              You must be logged in to view the reports.
            </p>
            <a
              href="/login"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-eco hover:bg-primary/90 transition-colors"
            >
              Log in to continue
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner — inset */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <section className="relative rounded-2xl overflow-hidden text-white isolate">
        <img src={heroBackground} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/80 to-[#12A66A]/40" />
        <div className="relative p-6 sm:p-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-medium">
              <MapPin className="h-3.5 w-3.5" /> Community reports
            </div>
            <h1 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight mt-3">All Reports</h1>
            <p className="text-sm sm:text-[15px] text-white/80 mt-2 max-w-xl">
              Search, filter, and track every report the community has submitted.
            </p>
          </motion.div>
        </div>
      </section>
      </div>

      {/* Stat cards — derived from real data */}
      <section className="relative -mt-6 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statusStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                  className="bg-white rounded-2xl border border-border/70 shadow-eco p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center shrink-0">
                      <Icon className={`h-[18px] w-[18px] ${stat.tone}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold tracking-tight font-display leading-none">
                        {loading ? "–" : stat.value}
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-[380px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="eco-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-full rounded-xl bg-white border border-border/70 shadow-eco font-medium">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-eco-lg border border-border/60">
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12 bg-white rounded-2xl border border-dashed">
              No reports found.
            </p>
          ) : (
            filteredReports.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

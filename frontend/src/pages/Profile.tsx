import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  LogIn,
  ClipboardList,
  Plus,
} from "lucide-react";

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
    { label: "Total Reports", value: total, icon: ClipboardList, iconBg: "bg-emerald-100", tone: "text-[#087A50]" },
    { label: "Pending", value: pendingCount, icon: Clock, iconBg: "bg-amber-100", tone: "text-amber-600" },
    { label: "In Progress", value: inProgressCount, icon: Clock, iconBg: "bg-sky-100", tone: "text-sky-600" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, iconBg: "bg-emerald-100", tone: "text-emerald-600" },
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
            <h2 className="text-2xl font-bold tracking-tight mt-4">Access Restricted</h2>
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
      {/* Banner — full-bleed dark green */}
      <section className="eg-banner text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 sm:pt-12 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl sm:text-[52px] font-extrabold tracking-tight leading-[1.05]">
                All Reports
              </h1>
              <p className="text-base sm:text-lg text-white/80 mt-3 max-w-xl">
                Track community issues and their resolution progress.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-sm font-medium text-white/90">
              <MapPin className="h-4 w-4" /> Hetauda, Nepal
            </span>
          </motion.div>
        </div>
      </section>

      {/* Stat cards — overlapping the banner, as in the design */}
      <section className="relative z-10 -mt-12" aria-label="Report statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statusStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                  className="eg-lift bg-white rounded-2xl border border-border/70 shadow-eco-lg p-5"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`h-12 w-12 shrink-0 rounded-full ${stat.iconBg} grid place-items-center`}
                    >
                      <Icon className={`h-6 w-6 ${stat.tone}`} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="block text-[34px] font-extrabold tracking-tight text-[#064A37] leading-none mt-1">
                        {loading ? "–" : stat.value}
                      </span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="eco-input w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white shadow-eco"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-full h-12 rounded-xl bg-white border border-border/70 shadow-eco font-medium">
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
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[#12A66A] text-white font-bold text-sm shadow-eco transition-all hover:-translate-y-0.5 hover:bg-[#0d8a57] shrink-0"
          >
            <Plus className="h-4 w-4" /> New Report
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="eg-reveal is-visible col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-border/70 shadow-eco">
              <div className="mx-auto h-11 w-11 rounded-xl bg-secondary grid place-items-center mb-3">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold">No reports found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or filter.</p>
            </div>
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

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReportCard, { Report } from "@/components/ReportCard";
import {
  MapPin,
  Plus,
  FolderKanban,
  Wallet,
  Info,
  ArrowRight,
  CheckCircle2,
  Clock,
  CircleAlert,
  Shield,
} from "lucide-react";
import heroBackground from "@/assets/background.jpg";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Report an Issue",
    description: "Report civic issues with location, photo and severity.",
    href: "/report",
    icon: Plus,
  },
  {
    title: "Track Reports",
    description: "Follow every report you've submitted, with live status.",
    href: "/profile",
    icon: FolderKanban,
  },
  {
    title: "Pay Tax",
    description: "Pay municipal taxes online quickly and securely.",
    href: "/tax-payment",
    icon: Wallet,
  },
  {
    title: "About Us",
    description: "Learn about EcoGuard and how we serve Hetauda.",
    href: "/about",
    icon: Info,
  },
];

const Home = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem("access");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/");
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          setReports([]);
        } else {
          if (Array.isArray(payload)) setReports(payload);
          else if (payload && Array.isArray((payload as any).results))
            setReports((payload as any).results);
          else setReports([]);
        }
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Stats derived from real fetched reports — nothing hardcoded.
  // Backend sends statuses like "inprogress"; normalize separators first.
  const normalizeStatus = (s?: string) =>
    (s || "").toLowerCase().replace(/[\s_-]+/g, "");
  const totalReports = reports.length;
  const resolvedCount = reports.filter(
    (r) => normalizeStatus(r.status) === "resolved",
  ).length;
  const inProgressCount = reports.filter(
    (r) => normalizeStatus(r.status) === "inprogress",
  ).length;
  const pendingCount = reports.filter(
    (r) => normalizeStatus(r.status) === "pending",
  ).length;

  const summaryStats = [
    {
      label: "Total Reports",
      value: totalReports,
      icon: MapPin,
      tone: "text-primary",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      tone: "text-blue-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: CircleAlert,
      tone: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <img
          src={heroBackground}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/80 to-[#12A66A]/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-medium mb-5"
          >
            <MapPin className="h-3.5 w-3.5" />
            Hetauda Sub-Metropolitan City
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.05] tracking-tight max-w-xl text-balance"
          >
            A Better Hetauda, Together
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-4 text-[15px] sm:text-lg leading-7 text-white/85 max-w-xl"
          >
            Report issues, track progress, and help build a cleaner, safer and
            more developed city.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-7 flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] shadow-eco hover:bg-primary/90 transition-colors"
            >
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/tax-payment"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/10 border border-white/25 backdrop-blur font-semibold text-[15px] hover:bg-white hover:text-primary transition-colors"
            >
              Pay Tax
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats — derived from real data */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {summaryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                  className="bg-white rounded-2xl border border-border/70 shadow-eco p-5"
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center mb-4">
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </div>
                  <div className="text-[28px] font-bold tracking-tight font-display text-foreground leading-none">
                    {loading ? "–" : stat.value}
                  </div>
                  <div className="text-[12px] font-semibold text-muted-foreground mt-2">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore services */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[26px] sm:text-[32px] font-bold tracking-tight">
            Explore Services
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Everything the city offers, one dashboard away.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_300px] gap-4">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={s.href}
                    className="block h-full p-5 rounded-2xl bg-white border border-border/70 shadow-eco hover:shadow-eco-lg hover:-translate-y-0.5 transition-all"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="mt-5 font-display font-semibold text-[16px]">
                      {s.title}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {s.description}
                    </p>
                  </Link>
                </motion.div>
              );
            })}

            {/* Wide green card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative rounded-2xl overflow-hidden sm:col-span-2 lg:col-span-1 lg:row-span-1"
            >
              <img
                src={heroBackground}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#07583F]/90 via-[#07583F]/70 to-[#064A37]/60" />
              <div className="relative h-full flex flex-col justify-between p-5 text-white min-h-[190px]">
                <Shield className="h-5 w-5 text-white/80" />
                <div>
                  <div className="font-display text-lg font-semibold leading-snug">
                    Together for a Better & advance Hetauda
                  </div>
                  <Link
                    to="/report"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 hover:text-white hover:underline"
                  >
                    Report an Issue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-10 sm:py-12 bg-card border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-bold tracking-tight">
                Recent Reports
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Latest issues reported by the community.
              </p>
            </div>
            <Link to={isLoggedIn ? "/profile" : "/login"}>
              <Button variant="eco-outline" className="rounded-full">
                {isLoggedIn ? "View all reports" : "Log in to view"}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : !isLoggedIn ? (
              <div className="col-span-full bg-white rounded-2xl border border-border/70 shadow-eco p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-secondary grid place-items-center mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="font-semibold">
                  Please log in to view community reports
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  We keep reports authenticated for quality and accountability.
                </p>
                <Link
                  to="/login"
                  className="inline-flex mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-eco"
                >
                  Log in to continue
                </Link>
              </div>
            ) : reports.filter(
                (r) => (r.status || "").toLowerCase() !== "resolved",
              ).length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-10 bg-white rounded-2xl border border-dashed">
                No pending reports — be the first to report.
              </div>
            ) : (
              reports
                .filter((r) => (r.status || "").toLowerCase() !== "resolved")
                .slice(0, 3)
                .map((report, i) => (
                  <ReportCard key={report.id} report={report} index={i} />
                ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-8 sm:p-10 text-center">
            <h2 className="font-display text-[26px] sm:text-[32px] font-bold tracking-tight">
              Ready to make a difference?
            </h2>
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 max-w-xl mx-auto">
              Together we can create a cleaner, safer and more vibrant city.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              {!isLoggedIn && (
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold shadow-eco hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              )}
              <Link
                to="/report"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-border bg-white font-semibold text-foreground hover:bg-muted/60 transition-colors"
              >
                Report an Issue
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

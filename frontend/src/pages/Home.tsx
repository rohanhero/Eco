import { Link } from "react-router-dom";
import ReportCard, { Report } from "@/components/ReportCard";
import {
  MapPin,
  FolderKanban,
  Info,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  FileText,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/background.jpg";

const services = [
  {
    title: "Report an Issue",
    description: "Submit civic issues with photo and location.",
    href: "/report",
    icon: ClipboardList,
    cta: "Report now →",
  },
  {
    title: "Track Reports",
    description: "Monitor status and updates on your submissions.",
    href: "/profile",
    icon: FolderKanban,
    cta: "View reports →",
  },
  {
    title: "Pay Tax",
    description: "Pay municipal taxes securely online.",
    href: "/tax-payment",
    icon: CreditCard,
    cta: "Pay now →",
  },
  {
    title: "About Us",
    description: "Learn more about EcoGuard and our mission.",
    href: "/about",
    icon: Info,
    cta: "Learn more →",
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
      icon: ClipboardList,
      iconBg: "bg-emerald-100",
      tone: "text-[#087A50]",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      tone: "text-emerald-600",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      iconBg: "bg-sky-100",
      tone: "text-sky-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: AlertTriangle,
      iconBg: "bg-amber-100",
      tone: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full-bleed dark green over city background, skyline silhouette at the base */}
      <section className="eg-hero relative text-white overflow-hidden">
        <img src={heroBackground} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/85 to-[#12A66A]/55" />
        <svg
          aria-hidden
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="eg-skyline absolute bottom-0 left-0 w-full h-[72px] sm:h-[110px] pointer-events-none"
        >
          <path
            fill="currentColor"
            d="M0 120V78h48v-14h22v14h30V58h26v20h18V44h30v34h24V66h28v12h20V52h34v26h26V64h30v14h22V48h28v30h24V60h32v18h18V40h30v38h26V62h28v16h24V46h32v32h20V66h30v12h26V50h28v28h22V64h30v14h24V52h30v26h26V120H0z"
          />
          <circle cx="120" cy="52" r="16" fill="currentColor" />
          <circle cx="1180" cy="46" r="20" fill="currentColor" />
          <circle cx="1330" cy="58" r="14" fill="currentColor" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24 sm:pt-16 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-primary text-[13px] font-semibold shadow-eco"
          >
            <MapPin className="h-4 w-4" />
            Hetauda Sub-Metropolitan City
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-[40px] sm:text-6xl lg:text-[64px] font-extrabold leading-[1.05] tracking-tight max-w-3xl text-balance mt-5"
          >
            A Better Hetauda, Together
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-4 text-base sm:text-lg leading-7 text-white/85 max-w-2xl"
          >
            Report issues, track progress, and help build a cleaner, safer and
            more developed city.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded-xl bg-[#12A66A] text-white font-bold text-[15px] shadow-eco-lg transition-all hover:-translate-y-0.5 hover:bg-[#0d8a57]"
            >
              <FileText className="h-5 w-5" />
              Report an Issue
            </Link>
            <Link
              to="/tax-payment"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded-xl border-2 border-white/70 bg-white/5 backdrop-blur font-bold text-[15px] text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-primary"
            >
              <CreditCard className="h-5 w-5" />
              Pay Tax
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats — one white bar, fully visible below the hero */}
      <section className="relative z-10" aria-label="Report statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eg-stat-divider -mt-10 grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white border border-border/70 shadow-eco-lg overflow-hidden">
            {summaryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-3.5 p-5 sm:p-6"
                >
                  <span
                    className={`h-12 w-12 shrink-0 rounded-full ${stat.iconBg} grid place-items-center`}
                  >
                    <Icon className={`h-6 w-6 ${stat.tone}`} />
                  </span>
                  <span>
                    <span className="block text-[34px] sm:text-4xl font-extrabold tracking-tight text-[#064A37] leading-none">
                      {loading ? "–" : stat.value}
                    </span>
                    <span className="block text-[13px] font-medium text-muted-foreground mt-1.5">
                      {stat.label}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore services */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#064A37]">
              Explore Services
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Everything you need for a cleaner, safer city
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
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
                    className="eg-lift flex h-full flex-col items-center text-center p-6 rounded-2xl bg-white border border-border/70 shadow-eco"
                  >
                    <span className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center">
                      <Icon className="h-7 w-7 text-primary" />
                    </span>
                    <span className="mt-4 font-bold text-[17px] text-[#064A37]">
                      {s.title}
                    </span>
                    <span className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                      {s.description}
                    </span>
                    <span className="mt-3 text-[13px] font-bold text-primary">
                      {s.cta}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#064A37]">
              Recent Reports
            </h2>
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              className="shrink-0 text-[14px] font-bold text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : !isLoggedIn ? (
              <div className="col-span-full bg-white rounded-2xl border border-border/70 shadow-eco p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-secondary grid place-items-center mb-3">
                  <FileText className="h-6 w-6 text-primary" />
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

      {/* CTA — full-width dark green band */}
      <section className="eg-banner text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <h2 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight shrink-0">
            Ready to make a difference?
          </h2>
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-[#12A66A] text-white font-bold text-[15px] shadow-eco-lg transition-all hover:-translate-y-0.5 hover:bg-[#0d8a57] shrink-0"
          >
            Report an Issue Now <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[15px] text-white/85 lg:ml-auto">
            Together, keeping our city clean and safe.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;

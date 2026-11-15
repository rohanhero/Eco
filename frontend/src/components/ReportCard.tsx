import { Link, useNavigate } from "react-router-dom";
import {
  Recycle,
  Droplets,
  Zap,
  Wind,
  Construction,
  Trees,
  MapPin,
  Eye,
  CalendarDays,
  CircleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@/utils/formatDate";

export interface Report {
  id: number | string;
  title: string;
  description?: string;
  category: string;
  severity?: string;
  status?: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  upvote_count?: number;
  comment_count?: number;
  view_count?: number;
  view_count__gte?: number;
  created_at?: string;
  report_number?: string;
  reporter?: string;
  display_date?: string;
  image?: string | { image_url?: string };
  [key: string]: any;
}

// Category icons + accent colors
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  "Waste Management": { icon: Recycle, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  "Water & Utilities": { icon: Droplets, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
  "Electricity Problems": { icon: Zap, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  "Air Quality": { icon: Wind, color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
  "Road & Infrastructure": { icon: Construction, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
  "Park & Recreation": { icon: Trees, color: "text-green-700", bg: "bg-green-50 border-green-100" },
};

const DEFAULT_CATEGORY = {
  icon: CircleAlert,
  color: "text-slate-600",
  bg: "bg-slate-50 border-slate-100",
};

// Status badge colors — orange pending, blue in progress, green resolved (default slate)
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-orange-400 text-white border-orange-400" },
  "in progress": { label: "In Progress", className: "bg-amber-300 text-amber-950 border-amber-300" },
  "in_progress": { label: "In Progress", className: "bg-amber-300 text-amber-950 border-amber-300" },
  inprogress: { label: "In Progress", className: "bg-amber-300 text-amber-950 border-amber-300" },
  resolved: { label: "Resolved ✓", className: "bg-emerald-500 text-white border-emerald-500" },
};

const getStatusMeta = (status?: string) => {
  if (!status) return null;
  const key = status.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  return (
    STATUS_CONFIG[key] || {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      className: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
};

// Solid category chip colours, as in the approved design.
const categoryChipClass = (category?: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("air") || c.includes("pollution")) return "bg-orange-400 text-white border-orange-400";
  if (c.includes("street")) return "bg-sky-500 text-white border-sky-500";
  if (c.includes("water")) return "bg-sky-500 text-white border-sky-500";
  if (c.includes("electric")) return "bg-amber-400 text-amber-950 border-amber-400";
  return "bg-[#087A50] text-white border-[#087A50]";
};

const ReportCard = ({ report, index }: { report: Report; index?: number }) => {
  const navigate = useNavigate();
  const categoryMeta = CATEGORY_CONFIG[report.category] || DEFAULT_CATEGORY;
  const CategoryIcon = categoryMeta.icon;
  const statusMeta = getStatusMeta(report.status);

  const displayImage =
    typeof report.image === "string"
      ? report.image
      : (report as any)?.image?.image_url || null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index ?? 0, 8) * 0.05 }}
      className="group eg-lift bg-white rounded-2xl border border-border/70 shadow-eco overflow-hidden flex flex-col"
    >
      {/* Image or category header */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={report.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className={`absolute inset-0 grid place-items-center border-b ${categoryMeta.bg}`}>
            <CategoryIcon className={`h-9 w-9 ${categoryMeta.color}`} />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm ${categoryChipClass(report.category)}`}
          >
            <CategoryIcon className="h-3 w-3" />
            {report.category}
          </span>
        </div>
        {statusMeta && (
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <button
          onClick={() => navigate(`/reports/${report.id}`)}
          className="text-left flex items-start gap-2"
        >
          <h3 className="font-bold text-[17px] leading-snug text-[#064A37] group-hover:text-primary transition-colors line-clamp-2">
            {report.title}
          </h3>
        </button>

        <div className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {report.location ||
              report.location_address ||
              report.reporter ||
              "Hetauda"}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-3 text-[13px] text-muted-foreground">
          {report.display_date || report.created_at ? (
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(report.display_date || report.created_at)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {`${report.view_count ?? 0} views`}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <Link
            to={`/reports/${report.id}`}
            className="inline-flex items-center gap-1 text-[13px] text-primary font-bold hover:underline"
          >
            View details →
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default ReportCard;

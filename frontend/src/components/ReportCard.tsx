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
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

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
  pending: { label: "Pending", className: "bg-orange-50 text-orange-700 border-orange-200" },
  "in progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "in_progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  inprogress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
      className="group bg-white rounded-2xl border border-border/70 shadow-eco overflow-hidden flex flex-col hover:shadow-eco-lg transition-shadow duration-300"
    >
      {/* Image or category header */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={report.title}
            className="w-full h-full object-cover"
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur ${categoryMeta.bg} ${categoryMeta.color}`}
          >
            <CategoryIcon className="h-3 w-3" />
            {report.category}
          </span>
        </div>
        {statusMeta && (
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur bg-white/80 ${statusMeta.className}`}
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
          <h3 className="font-display font-semibold text-[15.5px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {report.title}
          </h3>
          <MoreHorizontal className={`h-4 w-4 mt-1 shrink-0 transition-colors ${categoryMeta.color}`} />
        </button>

        {report.description && (
          <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground line-clamp-2">
            {report.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {report.location ||
                report.location_address ||
                report.reporter ||
                "Hetauda"}
            </span>
          </span>
          {report.display_date || report.created_at ? (
            <span className="inline-flex items-center gap-1 shrink-0">
              <CalendarDays className="h-3.5 w-3.5" />
              {(report.display_date || report.created_at)?.slice(0, 10)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {report.view_count ?? 0} views
          </span>
          <Link
            to={`/reports/${report.id}`}
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
          >
            View details →
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default ReportCard;

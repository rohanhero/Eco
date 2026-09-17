import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, User, Eye, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";

export interface Report {
  name: any;
  user: any;
  id: string;
  title: string;
  description: string;
  category: "waste" | "water" | "electricity" | "air-quality";
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  author: string;
  createdAt: string;
  imageUrl?: string;
  status: "pending" | "inprogress" | "resolved" | string;
  view_count?: number;
}

interface ReportCardProps {
  report: Report;
  onViewDetails: (id: string) => void;
}

const categoryColors = {
  waste: "bg-orange-100 text-orange-800 border-orange-200",
  water: "bg-blue-100 text-blue-800 border-blue-200",
  electricity: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "air-quality": "bg-purple-100 text-purple-800 border-purple-200",
};

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  inprogress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onViewDetails }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/reports/${report.id}`);
  };

  // Determine status from `status` field if present, otherwise fall back to `resolved`
  const rawStatus = (report as any).status
    ? String((report as any).status).toLowerCase()
    : (report as any).resolved
      ? "resolved"
      : "pending";
  const displayStatus =
    rawStatus === "inprogress"
      ? "In Progress"
      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const statusColor = statusColors[rawStatus] || statusColors.pending;

  // safe fallbacks for possibly-missing fields coming from backend
  const category = (report as any).category || "waste";
  const title = report.title || "Untitled";
  const description = report.description || "";
  const location_address =
    (report as any).location_address ||
    (report as any).location?.address ||
    "Unknown location";
  const author = (report as any).author || (report as any).name || "Anonymous";
  const createdAt =
    (report as any).createdAt ||
    (report as any).created_at ||
    new Date().toISOString();
  const imageUrl = (report as any).imageUrl || (report as any).image || "";

  return (
    <div className="group relative overflow-hidden rounded-[14px] sm:rounded-[18px] border border-border/60 bg-white shadow-eco hover:shadow-eco-lg hover:-translate-y-[2px] transition-all duration-300 cursor-pointer" onClick={handleCardClick}>
      <MagicCard className="rounded-[inherit] p-0" gradientColor="hsl(152 45% 32% / 0.10)">
        <Card className="border-0 shadow-none bg-transparent rounded-[inherit]">
      {imageUrl && imageUrl !== "" ? (
        <div className="relative h-[112px] sm:h-[168px] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5">
            <Badge variant="secondary" className={`rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold tracking-wide border backdrop-blur ${categoryColors[category as keyof typeof categoryColors] || categoryColors["waste"]}`}>
              {String(category).replace("-", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Badge variant="outline" className={`rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold bg-white/90 backdrop-blur border-white/40 ${statusColor}`}>
              {displayStatus}
            </Badge>
          </div>
        </div>
      ) : (
        <CardHeader className="pb-3 pt-5">
          <div className="flex justify-between items-start mb-2.5">
            <Badge variant="secondary" className={`rounded-full text-[11px] ${categoryColors[category as keyof typeof categoryColors] || categoryColors["waste"]}`}>
              {String(category).replace("-", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" className={`rounded-full text-[11px] ${statusColor}`}>
              {displayStatus}
            </Badge>
          </div>
        </CardHeader>
      )}

      {!imageUrl && (
        <CardHeader className="pb-2 pt-3 sm:pt-0 px-3 sm:px-6">
          <CardTitle className="text-[14px] sm:text-[17px] font-semibold tracking-tight leading-5 line-clamp-2 group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-[12px] sm:text-[13.5px] leading-4 sm:leading-5 line-clamp-2">{description.length > 100 ? `${description.substring(0, 100)}…` : description}</CardDescription>
        </CardHeader>
      )}
      {imageUrl && (
        <CardHeader className="pb-2 pt-3 sm:pt-4 px-3 sm:px-6">
          <CardTitle className="text-[14px] sm:text-[17px] font-semibold tracking-tight leading-4 sm:leading-5 line-clamp-2 group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-[12px] sm:text-[13.5px] leading-4 sm:leading-5 line-clamp-2">{description.length > 100 ? `${description.substring(0, 100)}…` : description}</CardDescription>
        </CardHeader>
      )}

      <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] text-muted-foreground">
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="truncate">{location_address}</span>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] text-muted-foreground">
          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{author}</span>
        </div>

        <div className="mt-3 sm:mt-4 flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50 text-[11px] sm:text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {(report as any).view_count || 0}</span>
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
      </MagicCard>
      <BorderBeam duration={7} size={90} className="from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ReportCard;

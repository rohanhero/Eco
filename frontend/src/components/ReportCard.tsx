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
    <Card className="eco-card group cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="secondary"
            className={
              categoryColors[category as keyof typeof categoryColors] ||
              categoryColors["waste"]
            }
          >
            {String(category).replace("-", " ").toUpperCase()}
          </Badge>
          <Badge variant="outline" className={statusColor}>
            {displayStatus}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description.length > 100
            ? `${description.substring(0, 100)}...`
            : description}
        </CardDescription>
      </CardHeader>

      {imageUrl && imageUrl !== "" && (
        <div className="px-6 pb-3">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-40 object-cover rounded-lg border border-border/50"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{location_address}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{author}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{(report as any).view_count || 0}</span>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;

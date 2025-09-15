import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, User, Eye, MessageSquare } from "lucide-react";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: "waste" | "water" | "electricity" | "air-quality";
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  author: string;
  createdAt: string;
  imageUrl?: string;
  status: "pending" | "in-progress" | "resolved";
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

const statusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onViewDetails }) => {
  return (
    <Card
      className="eco-card group cursor-pointer"
      onClick={() => onViewDetails(report.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="secondary"
            className={categoryColors[report.category]}
          >
            {report.category.replace("-", " ").toUpperCase()}
          </Badge>
          <Badge variant="outline" className={statusColors[report.status]}>
            {report.status.replace("-", " ")}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {report.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {report.description.length > 100
            ? `${report.description.substring(0, 100)}...`
            : report.description}
        </CardDescription>
      </CardHeader>

      {report.imageUrl && (
        <div className="px-6 pb-3">
          <img
            src={report.imageUrl}
            alt={report.title}
            className="w-full h-40 object-cover rounded-lg border border-border/50"
          />
        </div>
      )}

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{report.location.address}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{report.author}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>23</span>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;

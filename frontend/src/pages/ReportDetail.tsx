// ReportDetail.tsx (Modern Layout)
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  Star,
  Send,
  Camera,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast"; // your toast hook

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  name: string;
  email: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  image_url?: string;
  created_at: string;
  resolved: boolean;
  average_rating?: number | null;
  comments_count?: number;
}

interface Comment {
  id: number;
  user_name: string;
  user_email?: string;
  text: string;
  rating: number;
  created_at: string;
}

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const token = localStorage.getItem("access");
  const API_BASE = "http://127.0.0.1:8000/api";

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setReport(null);
      } else {
        const data = await res.json();
        setReport(data);
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReport();
      fetch(`${API_BASE}/reports/${id}/increment_views/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  }, [id]);

  const fetchComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/comments/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    setLoggedIn(Boolean(token));
  }, [token]);

  const handleSubmitComment = async () => {
    if (!token)
      return toast({
        title: "Login required",
        description: "Please log in to submit a comment.",
      });
    if (!newComment.trim())
      return toast({
        title: "Empty comment",
        description: "Please write something.",
      });
    if (newRating < 1 || newRating > 5)
      return toast({
        title: "Invalid rating",
        description: "Rating must be 1-5.",
      });

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment.trim(), rating: newRating }),
      });

      if (res.status === 201 || res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewComment("");
        setNewRating(5);
        fetchReport();
        toast({
          title: "Comment submitted",
          description: "Your comment has been added.",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.detail || "Failed to submit comment.",
        });
      }
    } catch {
      toast({ title: "Network Error", description: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    onRate,
  }: {
    rating: number;
    onRate?: (r: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer transition ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onClick={() => onRate?.(star)}
        />
      ))}
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading report...
      </div>
    );
  if (!report)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="mb-4 text-muted-foreground">Report not found</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );

  const status = report.resolved ? "Resolved" : "Pending";
  const statusColor = report.resolved
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Button
          variant="eco-outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Report Card */}
        <Card className="space-y-6 p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold mb-1">
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
              <Badge className={statusColor}>{status}</Badge>
            </div>
            {report.average_rating && (
              <div className="mt-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {report.average_rating} · {report.comments_count ?? 0} reviews
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Category
                </p>
                <p className="text-lg font-medium">
                  {report.category.replace("-", " ").toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Severity
                </p>
                <p className="text-lg font-medium">
                  {report.severity.replace("-", " ").toUpperCase()}
                </p>
              </div>
            </div>

            {/* Map + Evidence Image centered */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-start mt-6">
              {/* Location Map */}
              <div className="flex flex-col items-center w-80">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </h3>
                <div className="w-80 h-80 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                  {report.location_lat && report.location_lng ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0, pointerEvents: "none" }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        report.location_lng - 0.01
                      },${report.location_lat - 0.01},${
                        report.location_lng + 0.01
                      },${report.location_lat + 0.01}&layer=mapnik&marker=${
                        report.location_lat
                      },${report.location_lng}`}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Map not available
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Photo */}
              {report.image_url && (
                <div className="flex flex-col items-center w-80">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Evidence Photo
                  </h3>
                  <div className="w-80 h-80 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                    <img
                      src={report.image_url}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reporter Info */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Reporter Information</h4>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" /> {report.name}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />{" "}
                {report.email}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />{" "}
                {new Date(report.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Comments & Ratings</h4>

              {loggedIn && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-3">
                  <StarRating rating={newRating} onRate={setNewRating} />
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-border/50 rounded-md focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />{" "}
                    {submitting ? "Submitting..." : "Submit Comment"}
                  </Button>
                </div>
              )}

              {!loggedIn && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-center">
                  Please{" "}
                  <Button
                    variant="eco"
                    size="sm"
                    onClick={() => navigate("/login")}
                  >
                    Log In
                  </Button>{" "}
                  to comment
                </div>
              )}

              {commentsLoading ? (
                <p className="text-center text-muted-foreground">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-card border border-border/50 p-3 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{comment.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <StarRating rating={comment.rating} />
                      </div>
                      <p className="mt-2 text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Info */}
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                report.resolved ? "bg-green-50" : "bg-yellow-50"
              }`}
            >
              {report.resolved ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h5 className="font-semibold text-green-900">
                      Issue Resolved
                    </h5>
                    <p className="text-sm text-green-800">
                      This issue has been addressed and resolved.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h5 className="font-semibold text-yellow-900">
                      Pending Review
                    </h5>
                    <p className="text-sm text-yellow-800">
                      This report is currently being reviewed by our team.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportDetail;

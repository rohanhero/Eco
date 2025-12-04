// ReportDetail.tsx (Modern Layout)
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
  MoreHorizontal, // <-- (ADDED)
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  is_owner?: boolean;
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

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingRating, setEditingRating] = useState(5);
  const [editingLoading, setEditingLoading] = useState(false);

  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // <-- (ADDED)
  const menuRef = useRef<HTMLDivElement | null>(null); // <-- (ADDED)

  const token = localStorage.getItem("access");
  const API_BASE = "http://127.0.0.1:8000/api";

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) setReport(null);
      else setReport(await res.json());
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
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error(err);
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

      if (res.ok || res.status === 201) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewComment("");
        setNewRating(5);
        fetchReport();
        toast({
          title: "Comment submitted",
          description: "Your comment has been added.",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Please try again later.",
      });
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

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
    setEditingRating(comment.rating);
    setOpenMenuId(null);
  };

  const updateComment = async () => {
    if (!editingCommentId || !token) return;
    setEditingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/comments/${editingCommentId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: editingText,
          rating: editingRating,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setEditingCommentId(null);
        toast({
          title: "Comment updated",
          description: "Your comment has been edited successfully.",
        });
      }
    } catch {
      toast({ title: "Error", description: "Update failed." });
    } finally {
      setEditingLoading(false);
    }
  };

  const status = report?.resolved ? "Resolved" : "Pending";
  const statusColor = report?.resolved
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";

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

        <Card className="space-y-6 p-6">
          <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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

            {/* Map + Evidence Image */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center sm:items-start mt-6 w-full">
              <div className="flex flex-col items-center w-full sm:w-80">
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

              {report.image_url && (
                <div className="flex flex-col items-center w-full sm:w-80">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Evidence Photo
                  </h3>
                  <div className="w-full sm:w-80 h-64 sm:h-80 rounded-lg overflow-hidden border border-border/50">
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

            {/* COMMENTS SECTION */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Comments & Ratings</h4>

              {loggedIn ? (
                <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                  <StarRating rating={newRating} onRate={setNewRating} />

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border rounded-md"
                  />

                  <Button onClick={handleSubmitComment} disabled={submitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Comment"}
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg border text-center">
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

              {/* Comments List */}
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
                      className="bg-card border p-3 rounded-lg relative"
                    >
                      {/* If editing */}
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <StarRating
                            rating={editingRating}
                            onRate={setEditingRating}
                          />

                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            rows={3}
                          />

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={updateComment}
                              disabled={editingLoading}
                            >
                              Save
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">
                                {comment.user_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                            <StarRating rating={comment.rating} />
                          </div>

                          <p className="mt-2 text-sm">{comment.text}</p>

                          {comment.is_owner && (
                            <div
                              className="absolute top-8 right-3"
                              ref={menuRef}
                            >
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === comment.id
                                      ? null
                                      : comment.id
                                  )
                                }
                                className="p-1 rounded-full hover:bg-gray-200"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </button>

                              {/* Dropdown menu */}
                              {openMenuId === comment.id && (
                                <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-md z-20">
                                  <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                    onClick={() => startEditing(comment)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-red-600"
                                    onClick={() =>
                                      setCommentToDelete(comment.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATUS INFO */}
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

      {/* Delete Confirmation Modal */}
      {commentToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-5 rounded-lg w-80 space-y-4">
            <h5 className="text-lg font-semibold">Delete Comment?</h5>
            <p>
              Are you sure you want to delete this comment? 
            </p>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCommentToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!token) return;
                  try {
                    const res = await fetch(
                      `${API_BASE}/comments/${commentToDelete}/`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                    if (res.status === 204) {
                      setComments((prev) =>
                        prev.filter((c) => c.id !== commentToDelete)
                      );
                      toast({
                        title: "Comment deleted",
                        description: "Your comment has been removed.",
                      });
                    }
                  } catch {
                    toast({ title: "Error", description: "Delete failed." });
                  } finally {
                    setCommentToDelete(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;

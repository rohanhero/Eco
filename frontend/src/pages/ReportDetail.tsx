// ReportDetail.tsx (Municipal redesign — logic preserved)
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  User,
  Mail,
  AlertTriangle,
  Star,
  Send,
  Camera,
  MoreHorizontal,
  CheckCircle2,
  History,
  ImageOff,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import heroBackground from "@/assets/background.jpg";

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
  status?: string;
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

  // Scroll to top on mount / id change — fixes opening at bottom
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // fallback for browsers without instant
    document.documentElement.scrollTop = 0;
  }, [id]);

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
    size = "h-5 w-5",
  }: {
    rating: number;
    onRate?: (r: number) => void;
    size?: string;
  }) => (
    <div className="flex gap-1" role={onRate ? "radiogroup" : undefined} aria-label={onRate ? "Select a rating" : "Rating"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} transition ${
            onRate ? "cursor-pointer " : ""
          }${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onClick={() => onRate?.(star)}
          aria-hidden={!onRate}
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
          prev.map((c) => (c.id === updated.id ? updated : c)),
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

  const rawStatus = report?.status
    ? String(report.status).toLowerCase()
    : report?.resolved
      ? "resolved"
      : "pending";

  const status =
    rawStatus === "inprogress"
      ? "In Progress"
      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  // Hero pill (kept status vocabulary; colors from the palette)
  const statusPillClass =
    rawStatus === "inprogress"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : rawStatus === "resolved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-orange-50 text-orange-700 border-orange-200";

  // Progress tracker: derive active step from the real status only.
  // Completed: Reported (and Under Review for inprogress/resolved). No fabricated dates.
  const reportedDate = report?.created_at
    ? new Date(report.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const currentStep =
    rawStatus === "resolved" ? 4 : rawStatus === "inprogress" ? 3 : 2;
  const steps = [
    { label: "Reported", meta: reportedDate },
    { label: "Under Review", meta: "—" },
    { label: "In Progress", meta: "Currently" },
    { label: "Resolved", meta: "Pending" },
  ];

  const initials = (name?: string) =>
    name && name.trim() ? name.trim()[0].toUpperCase() : "U";

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );

  if (!report)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-8 text-center max-w-sm w-full">
          <h2 className="font-display text-xl font-bold tracking-tight">Report not found</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This report may have been removed or the link is broken.
          </p>
          <Button variant="eco" className="mt-5 w-full rounded-xl" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* HERO — inset banner */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <section className="relative rounded-2xl overflow-hidden text-white isolate">
        <img src={heroBackground} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/80 to-[#12A66A]/40" />
        <div className="relative p-5 sm:p-7 pb-7">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 h-9 pl-3.5 pr-4 rounded-full bg-white text-foreground text-[13px] font-semibold shadow-eco hover:bg-white/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </motion.div>

          <div className="mt-4 flex flex-col-reverse gap-3 md:flex-row md:items-end md:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-[30px] sm:text-[38px] font-bold tracking-tight leading-tight">
                {report.title}
              </h1>
              {report.description && (
                <p className="mt-1.5 text-[13px] sm:text-[14px] leading-6 text-white/80 line-clamp-2">
                  {report.description}
                </p>
              )}
            </motion.div>

            <span
              className={`inline-flex shrink-0 items-center gap-2 self-start md:self-auto px-3.5 py-2 rounded-full text-[13px] font-semibold border shadow-eco ${statusPillClass}`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {status}
            </span>
          </div>
        </div>
      </section>
      </div>

      {/* MAIN CARD */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="bg-white rounded-[20px] border border-border/70 shadow-eco-lg p-4 sm:p-6 space-y-5"
        >
          {/* METADATA ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:divide-x sm:divide-border/70">
            {[
              {
                label: "Category",
                value: report.category ? report.category.replace("-", " ").toUpperCase() : "Not specified",
                icon: MapPin,
                iconBg: "bg-secondary",
                iconColor: "text-primary",
              },
              {
                label: "Severity",
                value: report.severity ? report.severity.replace("-", " ").toUpperCase() : "Not specified",
                icon: AlertTriangle,
                iconBg: "bg-amber-50 border border-amber-100",
                iconColor: "text-amber-500",
              },
              {
                label: "Reported On",
                value: report.created_at
                  ? new Date(report.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—",
                icon: CalendarDays,
                iconBg: "bg-secondary",
                iconColor: "text-primary",
              },
            ].map((meta, i) => {
              const Icon = meta.icon;
              return (
                <div key={meta.label} className={`flex items-center gap-3.5 px-2 sm:px-4 py-2 ${i === 0 ? "sm:pl-0" : ""}`}>
                  <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${meta.iconBg}`}>
                    <Icon className={`h-[22px] w-[22px] ${meta.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-muted-foreground">{meta.label}</div>
                    <div className="text-[15px] font-semibold tracking-tight truncate">{meta.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LOCATION / EVIDENCE / REPORTER */}
          <div className="grid grid-cols-1 lg:grid-cols-[44fr_30fr_26fr] gap-4 sm:gap-5">
            {/* Location */}
            <div className="rounded-[16px] border border-border/70 bg-white p-4">
              <h3 className="flex items-center gap-2 font-display font-semibold text-[15px]">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </h3>
              <div className="relative mt-3 rounded-xl overflow-hidden border border-border/70 aspect-[4/3]">
                {report.location_lat && report.location_lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    title={`Map showing the location of ${report.title}`}
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
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/40">
                    Map not available
                  </div>
                )}
                {report.location_address && (
                  <span className="absolute bottom-2.5 left-2.5 inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground/80 border border-border/60 shadow-sm truncate">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{report.location_address}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Evidence Photo */}
            <div className="rounded-[16px] border border-border/70 bg-white p-4">
              <h3 className="flex items-center gap-2 font-display font-semibold text-[15px]">
                <Camera className="h-4 w-4 text-primary" />
                Evidence Photo
              </h3>
              <div className="relative mt-3 rounded-xl overflow-hidden border border-border/70 aspect-[3/4] lg:aspect-auto lg:h-[calc(100%-2.25rem)] min-h-[220px] bg-muted/40">
                {report.image_url ? (
                  <img
                    src={report.image_url}
                    alt={`Evidence photo for ${report.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageOff className="h-7 w-7" />
                    <p className="text-[13px]">No photo was attached</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reported By */}
            <div className="rounded-[16px] border border-primary/15 bg-secondary/40 p-4 flex flex-col">
              <h3 className="flex items-center gap-2 font-display font-semibold text-[15px]">
                <User className="h-4 w-4 text-primary" />
                Reported By
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center py-5 text-center">
                <div className="h-16 w-16 rounded-full bg-white border-2 border-primary/20 grid place-items-center shadow-eco">
                  <span className="font-display text-xl font-bold text-primary">{initials(report.name)}</span>
                </div>
                <div className="mt-3 font-semibold text-[15px] truncate max-w-full">
                  {report.name || "Anonymous"}
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{report.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COMMENTS & RATINGS */}
          <div className="border-t border-border/60 pt-5">
            <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
              <span className="h-8 w-8 rounded-full bg-secondary grid place-items-center">
                <Star className="h-4 w-4 text-primary" />
              </span>
              Comments &amp; Ratings
            </h3>

            {/* Rating + comment form */}
            {loggedIn ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr] gap-5 md:gap-8">
                {/* Rating control */}
                <div className="flex flex-col items-start gap-2.5 md:border-r md:border-border/60 md:pr-8">
                  <StarRating rating={newRating} onRate={setNewRating} size="h-8 w-8" />
                  <p className="text-sm text-muted-foreground">
                    {report.average_rating != null ? (
                      <>
                        <span className="font-semibold text-foreground">{report.average_rating.toFixed(1)}</span>
                        {" · "}
                        {report.comments_count ?? 0} {report.comments_count === 1 ? "Rating" : "Ratings"}
                      </>
                    ) : (
                      "No ratings yet"
                    )}
                  </p>
                </div>

                {/* Comment form */}
                <div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    aria-label="Write a comment"
                    className="bg-muted/50 border border-border/70 w-full px-4 py-3 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 placeholder:text-muted-foreground/70 resize-none transition-all"
                  />
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="eco"
                      onClick={handleSubmitComment}
                      disabled={submitting}
                      className="rounded-full h-10 px-5 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? "Submitting..." : "Submit Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-4 text-center text-sm">
                Please{" "}
                <Button
                  variant="eco"
                  size="sm"
                  className="rounded-full mx-1"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>{" "}
                to comment and rate this report
              </div>
            )}

            {/* Comments list */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm rounded-xl border border-dashed">
                No comments yet. Be the first to share your thoughts.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-border/70 bg-white/60 p-4 relative"
                  >
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <StarRating rating={editingRating} onRate={setEditingRating} />

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
                        <div className={`flex items-start justify-between gap-3 ${comment.is_owner ? "pr-9" : ""}`}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0">
                              <span className="text-sm font-bold text-primary">{initials(comment.user_name)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {comment.user_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={comment.rating} />
                        </div>

                        <p className="mt-2.5 text-sm leading-6">{comment.text}</p>

                        {comment.is_owner && (
                          <div
                            className="absolute top-3 right-3"
                            ref={menuRef}
                          >
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === comment.id
                                    ? null
                                    : comment.id,
                                )
                              }
                              className="p-1.5 rounded-full hover:bg-muted/70 transition-colors"
                              aria-label="Comment options"
                            >
                              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </button>

                            {/* Dropdown menu */}
                            {openMenuId === comment.id && (
                              <div className="absolute right-0 mt-2 w-28 bg-white border border-border/60 rounded-xl shadow-eco-lg z-20 overflow-hidden">
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm transition-colors"
                                  onClick={() => startEditing(comment)}
                                >
                                  Edit
                                </button>

                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm text-red-600 transition-colors"
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

          {/* REPORT PROGRESS TRACKER */}
          <div className="rounded-[16px] border border-primary/15 bg-secondary/30 p-4 sm:p-5">
            <h3 className="flex items-center gap-2.5 font-display text-[16px] font-semibold tracking-tight">
              <History className="h-[18px] w-[18px] text-primary" />
              Report Progress
            </h3>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-y-6">
              {steps.map((step, i) => {
                const stepIndex = i + 1;
                const isComplete = stepIndex < currentStep || rawStatus === "resolved";
                const isCurrent = stepIndex === currentStep && rawStatus !== "resolved";
                return (
                  <div
                    key={step.label}
                    className={`relative flex flex-col items-center text-center ${
                      i < steps.length - 1
                        ? "md:border-r md:border-border/60"
                        : ""
                    }`}
                  >
                    {/* connector for mobile: skip, use dividers */}
                    <div
                      className={`h-8 w-8 rounded-full grid place-items-center border-2 transition-colors ${
                        isComplete
                          ? "bg-primary border-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-white border-primary"
                            : "bg-white border-border text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-[18px] w-[18px]" />
                      ) : isCurrent ? (
                        <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-border" />
                      )}
                    </div>
                    <div
                      className={`mt-2 text-[13px] font-semibold ${
                        isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isCurrent ? "text-primary font-medium" : "text-muted-foreground/80"}`}>
                      {isCurrent ? step.meta : isComplete ? (i === 0 ? step.meta : "Completed") : step.meta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {commentToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white p-5 rounded-2xl w-80 space-y-4 shadow-eco-lg">
            <h5 className="font-display text-lg font-semibold">Delete Comment?</h5>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this comment?</p>
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
                      },
                    );
                    if (res.status === 204) {
                      setComments((prev) =>
                        prev.filter((c) => c.id !== commentToDelete),
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

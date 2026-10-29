import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FileText,
  User as UserIcon,
  Clock,
  Users,
  CheckCircle2,
  LayoutDashboard,
  Map as MapIcon,
  MessageSquare,
  Receipt,
  Search,
  RefreshCw,
  LogOut,
  Menu,
  Leaf,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getAdminAuthHeader, logoutAdmin } from "@/utils/auth";

const API_BASE = "http://127.0.0.1:8000/api";

type User = {
  id: number;
  name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
};

type Report = {
  id: number;
  title: string;
  category: string;
  severity: string;
  email: string;
  name: string;
  created_at: string;
  resolved: boolean;
  view_count: number;
  status?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
};

type Comment = {
  id: number;
  report: number;
  report_title: string;
  user: number;
  user_name: string;
  user_email: string;
  text: string;
  rating: number;
  created_at: string;
};

type TaxPayment = {
  id: number;
  pid: string;
  user: number;
  user_name: string;
  user_email: string;
  amount: string;
  tax_period: string;
  description: string;
  status: string;
  created_at: string;
};

type Stats = {
  users: number;
  reports: number;
  resolved_reports: number;
  pending_reports: number;
  comments: number;
  tax_payments: number;
  pending_payments: number;
};

type AdminTab =
  | "dashboard"
  | "map"
  | "reports"
  | "users"
  | "comments"
  | "payments";

/* ---------------------------------- shared UI helpers ---------------------------------- */

const CATEGORY_LABEL: Record<string, string> = {
  road: "Road & Infrastructure",
  water: "Water & Utilities",
  electricity: "Electricity",
  park: "Park & Recreation",
  environment: "Environment",
  waste: "Waste Management",
  others: "Other",
};
const categoryLabel = (c: string) =>
  CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

const CATEGORY_COLORS: Record<string, string> = {
  road: "#3b82f6",
  water: "#06b6d4",
  electricity: "#f59e0b",
  park: "#22c55e",
  environment: "#8b5cf6",
  waste: "#f97316",
  others: "#94a3b8",
};

const getReportStatus = (r: Report) =>
  r.status ? String(r.status) : r.resolved ? "resolved" : "pending";

const statusLabel = (s: string) =>
  s === "inprogress"
    ? "In Progress"
    : s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_DESCRIPTION: Record<string, string> = {
  pending: "New",
  inprogress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

const STATUS_HEX: Record<string, string> = {
  pending: "#3b82f6",
  inprogress: "#f59e0b",
  resolved: "#22c55e",
  rejected: "#ef4444",
};

const BADGE_BASE =
  "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium";

const StatusBadge = ({ status }: { status: string }) => {
  const cls =
    status === "resolved"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "inprogress"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "rejected"
          ? "border-red-200 bg-red-50 text-red-700"
          : status === "pending"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`${BADGE_BASE} ${cls}`} title={statusLabel(status)}>
      {statusLabel(status)}
    </span>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const cls =
    severity === "urgent"
      ? "border-rose-200 bg-rose-100 text-rose-700"
      : severity === "high"
        ? "border-red-200 bg-red-50 text-red-600"
        : severity === "medium"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`${BADGE_BASE} ${cls}`} title={`Severity: ${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const cls =
    status === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";
  return <span className={`${BADGE_BASE} ${cls}`}>{statusLabel(status)}</span>;
};

const RoleBadge = ({ user }: { user: User }) =>
  user.is_superuser ? (
    <span className={`${BADGE_BASE} border-primary/20 bg-primary/10 text-primary`}>
      Superuser
    </span>
  ) : user.is_staff ? (
    <span className={`${BADGE_BASE} border-slate-200 bg-slate-100 text-slate-700`}>
      Staff
    </span>
  ) : (
    <span className={`${BADGE_BASE} border-slate-200 bg-white text-muted-foreground`}>
      User
    </span>
  );

const AccountBadge = ({ active }: { active: boolean }) =>
  active ? (
    <span className={`${BADGE_BASE} border-blue-200 bg-blue-50 text-blue-700`}>
      Active
    </span>
  ) : (
    <span className={`${BADGE_BASE} border-slate-200 bg-slate-100 text-slate-500`}>
      Disabled
    </span>
  );

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatLocation = (r: Report) => {
  if (r.location_address) return r.location_address;
  if (r.location_lat != null && r.location_lng != null)
    return `${r.location_lat.toFixed(4)}, ${r.location_lng.toFixed(4)}`;
  return "—";
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "A";

const SEARCH_PLACEHOLDER: Record<AdminTab, string> = {
  dashboard: "Search issues, reporters, locations…",
  map: "Search issues, reporters, locations…",
  reports: "Search issues, reporters, locations…",
  users: "Search users by name or email…",
  comments: "Search comments, users, reports…",
  payments: "Search payments by PID, user…",
};

const rowMatchesSearch = (values: (string | null | undefined)[], search: string) =>
  !search ||
  values.some((v) => (v ?? "").toLowerCase().includes(search.toLowerCase()));

const inputValueClass = "h-9";
const selectClass =
  "h-9 rounded-md border border-input bg-card px-2.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/40";
const thClass =
  "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tdClass = "px-4 py-3 align-middle text-sm";

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
    <Inbox className="h-8 w-8 text-muted-foreground/50" />
    <p className="text-sm">{label}</p>
  </div>
);

/* ---------------------------------- map ---------------------------------- */

const AdminMap = ({
  markers,
  className,
}: {
  markers: Report[];
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
    }).setView([27.7, 85.32], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const points: [number, number][] = [];
    markers.forEach((r) => {
      if (r.location_lat == null || r.location_lng == null) return;
      const point: [number, number] = [r.location_lat, r.location_lng];
      points.push(point);
      const status = getReportStatus(r);
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = r.title;
      const meta = document.createElement("div");
      meta.className = "text-muted-foreground";
      meta.textContent = `${STATUS_DESCRIPTION[status] ?? statusLabel(status)} · ${r.name || r.email} · ${new Date(r.created_at).toLocaleDateString()}`;
      popup.append(title, meta);
      L.circleMarker(point, {
        radius: 7,
        weight: 2,
        color: "#ffffff",
        fillColor: STATUS_HEX[status] ?? "#94a3b8",
        fillOpacity: 0.95,
      })
        .bindTooltip(`${r.title} — ${STATUS_DESCRIPTION[status] ?? statusLabel(status)}`, { direction: "top" })
        .bindPopup(popup)
        .addTo(layer);
    });
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points).pad(0.25));
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [markers]);

  return <div ref={containerRef} className={className} />;
};

const MapLegend = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
    {Object.entries(STATUS_DESCRIPTION).map(([key, label]) => (
      <span key={key} className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
          style={{ backgroundColor: STATUS_HEX[key] }}
        />
        {label}
      </span>
    ))}
  </div>
);

/* ---------------------------------- component ---------------------------------- */

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mapCategory, setMapCategory] = useState("all");
  const [mapStatus, setMapStatus] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "unauthorized" | "error"
  >("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [payments, setPayments] = useState<TaxPayment[]>([]);
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    is_staff: false,
    is_superuser: false,
  });
  const [newUserErrors, setNewUserErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [newReport, setNewReport] = useState({
    title: "",
    category: "road",
    severity: "low",
    description: "",
    location_address: "",
  });
  const [newReportErrors, setNewReportErrors] = useState<{
    title?: string;
    category?: string;
    severity?: string;
    description?: string;
  }>({});
  const [newComment, setNewComment] = useState({
    report: "",
    text: "",
    rating: 5,
  });
  const [newCommentErrors, setNewCommentErrors] = useState<{
    report?: string;
    text?: string;
    rating?: string;
  }>({});
  const [popup, setPopup] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogDescription, setConfirmDialogDescription] = useState("");
  const [confirmDialogAction, setConfirmDialogAction] = useState<
    (() => void) | null
  >(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [adminLoginData, setAdminLoginData] = useState({
    email: "",
    password: "",
  });
  const [adminError, setAdminError] = useState<string | null>(null);

  const fetchJson = async (url: string, init: RequestInit = {}) => {
    const authHeader = getAdminAuthHeader();
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(init.headers as Record<string, string>),
      },
      ...init,
    });
    if (res.status === 401 || res.status === 403) {
      setStatus("unauthorized");
      throw new Error("Unauthorized");
    }
    return res.json();
  };

  const loadAdmin = async () => {
    const token = localStorage.getItem("admin_access");
    if (!token) {
      setStatus("unauthorized");
      return;
    }

    try {
      const info = await fetchJson(`${API_BASE}/admin/whoami/`);
      setUserInfo(info);
      if (!info.is_staff && !info.is_superuser) {
        setStatus("unauthorized");
        return;
      }
      setStatus("ready");
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadReports(),
        loadComments(),
        loadPayments(),
      ]);
    } catch (error: unknown) {
      const isUnauthorized =
        error instanceof Error && error.message === "Unauthorized";
      if (isUnauthorized) {
        setStatus("unauthorized");
      } else {
        setStatus("error");
      }
    }
  };

  const loadStats = async () => {
    const data = await fetchJson(`${API_BASE}/admin/stats/`);
    setStats(data);
  };

  const loadUsers = async () => {
    const data = await fetchJson(`${API_BASE}/admin/users/`);
    setUsers(data);
  };

  const loadReports = async () => {
    const data = await fetchJson(`${API_BASE}/admin/reports/`);
    setReports(data);
  };

  const loadComments = async () => {
    const data = await fetchJson(`${API_BASE}/admin/comments/`);
    setComments(data);
  };

  const loadPayments = async () => {
    const data = await fetchJson(`${API_BASE}/admin/tax-payments/`);
    setPayments(data);
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminError(null);
    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminLoginData),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("unauthorized");
        setAdminError(
          data.detail ||
            data.non_field_errors?.[0] ||
            "Invalid admin credentials.",
        );
        return;
      }

      if (!data.user?.is_staff && !data.user?.is_superuser) {
        setStatus("unauthorized");
        setAdminError("Admin account required.");
        return;
      }

      localStorage.setItem("admin_access", data.access);
      localStorage.setItem("admin_refresh", data.refresh);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      localStorage.setItem("admin_user_name", data.user.name || "");
      localStorage.setItem("admin_user_email", data.user.email || "");

      await loadAdmin();
    } catch (err) {
      setStatus("error");
      setAdminError("Network error. Please check your connection.");
    }
  };

  /* ------------------------------- derived data ------------------------------- */

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [reports],
  );

  const recentIssues = useMemo(
    () =>
      sortedReports
        .filter((r) =>
          rowMatchesSearch(
            [r.title, r.category, r.name, r.email, r.location_address],
            search,
          ),
        )
        .slice(0, 6),
    [sortedReports, search],
  );

  const mapReports = useMemo(
    () =>
      sortedReports.filter(
        (r) =>
          r.location_lat != null &&
          r.location_lng != null &&
          (mapCategory === "all" || r.category === mapCategory) &&
          (mapStatus === "all" || getReportStatus(r) === mapStatus),
      ),
    [sortedReports, mapCategory, mapStatus],
  );

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    reports.forEach((r) =>
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1),
    );
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({
        name: categoryLabel(cat),
        value: count,
        fill: CATEGORY_COLORS[cat] ?? "#94a3b8",
      }));
  }, [reports]);

  const categoryTotal = useMemo(
    () => categoryData.reduce((sum, d) => sum + d.value, 0),
    [categoryData],
  );

  const activity = useMemo(() => {
    const items = [
      ...sortedReports.slice(0, 6).map((r) => ({
        id: `r-${r.id}`,
        ts: r.created_at,
        icon: "report" as const,
        text: `New issue reported — ${r.title}`,
        sub: `${r.name || r.email} · ${categoryLabel(r.category)}`,
      })),
      ...[...comments]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 4)
        .map((c) => ({
          id: `c-${c.id}`,
          ts: c.created_at,
          icon: "comment" as const,
          text: `New comment on “${c.report_title}”`,
          sub: c.user_name || c.user_email,
        })),
      ...payments
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 3)
        .map((p) => ({
          id: `p-${p.id}`,
          ts: p.created_at,
          icon: "payment" as const,
          text: `Tax payment ${p.pid}`,
          sub: `${p.amount} · ${statusLabel(p.status)}`,
        })),
    ];
    return items
      .sort(
        (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
      )
      .slice(0, 8);
  }, [sortedReports, comments, payments]);

  const filteredReports = useMemo(
    () =>
      sortedReports.filter(
        (r) =>
          rowMatchesSearch(
            [r.title, r.category, r.name, r.email, r.location_address],
            search,
          ) &&
          (reportStatusFilter === "all" ||
            getReportStatus(r) === reportStatusFilter),
      ),
    [sortedReports, search, reportStatusFilter],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        rowMatchesSearch(
          [u.name, u.email, u.is_superuser ? "superuser" : u.is_staff ? "staff" : "user"],
          search,
        ),
      ),
    [users, search],
  );

  const filteredComments = useMemo(
    () =>
      comments.filter((c) =>
        rowMatchesSearch([c.report_title, c.user_name, c.user_email, c.text], search),
      ),
    [comments, search],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) =>
        rowMatchesSearch([p.pid, p.user_email, p.user_name, p.description, p.tax_period], search),
      ),
    [payments, search],
  );

  /* ------------------------------- actions (logic unchanged) ------------------------------- */

  const refreshData = async () => {
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadReports(),
      loadComments(),
      loadPayments(),
    ]);
  };

  const showPopup = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setPopup({ text, type });
    window.setTimeout(() => setPopup(null), 4500);
  };

  const validateEmail = (value: string) => {
    // Must start with a letter, contain at least one letter, not purely numeric — rejects 111@gmail.com
    return /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value) && !/^[0-9]+@/.test(value);
  };

  const validateUserForm = (values = newUser) => {
    const errors: { name?: string; email?: string; password?: string } = {};
    if (!values.name.trim()) {
      errors.name = "Name is required.";
    } else if (values.name.trim().length < 3) {
      errors.name = "Name should be at least 3 characters.";
    }

    if (!values.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(values.email)) {
      if (/^[0-9]+@/.test(values.email) || /^[0-9]/.test(values.email) && !/[A-Za-z]/.test(values.email.split("@")[0])) {
        errors.email = "Email cannot be numeric only — must start with a letter (e.g. john@gmail.com).";
      } else {
        errors.email = "Enter a valid email address (e.g. name@example.com).";
      }
    } else if (values.email.toLowerCase() === "111@gmail.com") {
      errors.email = "This email is not allowed.";
    }

    if (!values.password.trim()) {
      errors.password = "Password is required.";
    } else if (values.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    setNewUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateReportForm = (values = newReport) => {
    const errors: {
      title?: string;
      category?: string;
      severity?: string;
      description?: string;
    } = {};
    if (!values.title.trim()) {
      errors.title = "Report title is required.";
    }
    if (!values.category.trim()) {
      errors.category = "Category is required.";
    }
    if (!values.severity.trim()) {
      errors.severity = "Severity is required.";
    }
    if (!values.description.trim()) {
      errors.description = "Description is required.";
    }
    setNewReportErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCommentForm = (values = newComment) => {
    const errors: { report?: string; text?: string; rating?: string } = {};
    if (!values.report) {
      errors.report = "Select a report first.";
    }
    if (!values.text.trim()) {
      errors.text = "Comment text is required.";
    }
    if (values.rating < 1 || values.rating > 5) {
      errors.rating = "Rating must be between 1 and 5.";
    }
    setNewCommentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openConfirmDialog = (
    title: string,
    description: string,
    action: () => void,
  ) => {
    setConfirmDialogTitle(title);
    setConfirmDialogDescription(description);
    setConfirmDialogAction(() => action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialog = () => {
    setConfirmDialogOpen(false);
    if (confirmDialogAction) {
      confirmDialogAction();
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin");
  };

  const confirmDeleteRecord = (url: string, label: string) => {
    openConfirmDialog(
      `Delete ${label}`,
      `Are you sure you want to delete ${label}? This action cannot be undone.`,
      () => deleteRecord(url, label),
    );
  };

  const deleteRecord = async (url: string, label: string) => {
    console.log(`Admin delete triggered for ${label}:`, url);

    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      setMessage("Admin authorization is missing.");
      showPopup("Admin authorization is missing.", "error");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });

      console.log(
        `Admin delete response for ${label}:`,
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const messageText =
          body?.detail || body?.message || `Unable to delete ${label}.`;
        setMessage(messageText);
        showPopup(messageText, "error");
        if (response.status === 401 || response.status === 403) {
          setStatus("unauthorized");
        }
        return;
      }

      const successMessage = `${label} deleted successfully.`;
      setMessage(successMessage);
      showPopup(successMessage, "success");
      const id = Number(url.split("/").filter(Boolean).pop());
      if (url.includes("/admin/users/")) {
        setUsers((prev) => prev.filter((item) => item.id !== id));
      } else if (url.includes("/admin/reports/")) {
        setReports((prev) => prev.filter((item) => item.id !== id));
      } else if (url.includes("/admin/comments/")) {
        setComments((prev) => prev.filter((item) => item.id !== id));
      } else if (url.includes("/admin/tax-payments/")) {
        setPayments((prev) => prev.filter((item) => item.id !== id));
      }
      await refreshData();
    } catch (error) {
      const errorMessage = `Unable to delete ${label}.`;
      setMessage(errorMessage);
      showPopup(errorMessage, "error");
      console.error("deleteRecord error:", error);
    }
  };

  const patchRecord = async (
    url: string,
    body: Record<string, unknown>,
    label: string,
    confirmMessage?: string,
  ) => {
    if (confirmMessage) {
      openConfirmDialog(`Confirm ${label}`, confirmMessage, () =>
        patchRecord(url, body, label),
      );
      return;
    }

    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      const messageText = "Admin authorization is missing.";
      setMessage(messageText);
      showPopup(messageText, "error");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const messageText =
          body?.detail || body?.message || `Unable to update ${label}.`;
        setMessage(messageText);
        showPopup(messageText, "error");
        if (response.status === 401 || response.status === 403) {
          setStatus("unauthorized");
        }
        return;
      }

      const successMessage = `${label} updated successfully.`;
      setMessage(successMessage);
      showPopup(successMessage, "success");
      await refreshData();
    } catch {
      const messageText = `Unable to update ${label}.`;
      setMessage(messageText);
      showPopup(messageText, "error");
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateUserForm()) {
      showPopup("Please fix the user form errors before submitting.", "error");
      return;
    }

    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      const messageText = "Admin authorization is missing.";
      setMessage(messageText);
      showPopup(messageText, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const messageText =
          body?.detail || body?.message || "Unable to create new user.";
        setMessage(messageText);
        showPopup(messageText, "error");
        return;
      }

      const successMessage = "New user created successfully.";
      setMessage(successMessage);
      showPopup(successMessage, "success");
      setNewUser({
        name: "",
        email: "",
        password: "",
        is_staff: false,
        is_superuser: false,
      });
      await Promise.all([loadStats(), loadUsers()]);
    } catch {
      const messageText = "Unable to create new user.";
      setMessage(messageText);
      showPopup(messageText, "error");
    }
  };

  const updateUser = async (
    userId: number,
    changes: Record<string, unknown>,
    label: string,
  ) => {
    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      const messageText = "Admin authorization is missing.";
      setMessage(messageText);
      showPopup(messageText, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const messageText =
          body?.detail || body?.message || `Unable to update ${label}.`;
        setMessage(messageText);
        showPopup(messageText, "error");
        return;
      }

      const successMessage = `${label} updated successfully.`;
      setMessage(successMessage);
      showPopup(successMessage, "success");
      await Promise.all([loadStats(), loadUsers()]);
    } catch {
      const messageText = `Unable to update ${label}.`;
      setMessage(messageText);
      showPopup(messageText, "error");
    }
  };

  const handleCreateReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateReportForm()) {
      showPopup(
        "Please fix the report form errors before submitting.",
        "error",
      );
      return;
    }

    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      const messageText = "Admin authorization is missing.";
      setMessage(messageText);
      showPopup(messageText, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(newReport),
      });
      const data = await response.json();
      if (!response.ok) {
        const messageText =
          data.detail || data.message || "Unable to create report.";
        setMessage(messageText);
        showPopup(messageText, "error");
        return;
      }

      const successMessage = "Report added successfully.";
      setMessage(successMessage);
      showPopup(successMessage, "success");
      setNewReport({
        title: "",
        category: "road",
        severity: "low",
        description: "",
        location_address: "",
      });
      await Promise.all([loadStats(), loadReports()]);
    } catch {
      const messageText = "Unable to create report.";
      setMessage(messageText);
      showPopup(messageText, "error");
    }
  };

  const handleCreateComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCommentForm()) {
      showPopup(
        "Please fix the comment form errors before submitting.",
        "error",
      );
      return;
    }

    const authHeader = getAdminAuthHeader();
    if (!authHeader) {
      const messageText = "Admin authorization is missing.";
      setMessage(messageText);
      showPopup(messageText, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          report: Number(newComment.report),
          text: newComment.text,
          rating: newComment.rating,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const messageText =
          data.detail || data.message || "Unable to create comment.";
        setMessage(messageText);
        showPopup(messageText, "error");
        return;
      }

      const successMessage = "Comment posted successfully.";
      setMessage(successMessage);
      showPopup(successMessage, "success");
      setNewComment({ report: "", text: "", rating: 5 });
      await Promise.all([loadStats(), loadComments()]);
    } catch {
      const messageText = "Unable to create comment.";
      setMessage(messageText);
      showPopup(messageText, "error");
    }
  };

  const saveCommentEdit = async () => {
    if (editingCommentId === null) {
      return;
    }

    openConfirmDialog(
      "Save comment changes",
      "Do you want to save your edits to this comment?",
      async () => {
        const authHeader = getAdminAuthHeader();

        if (!authHeader) {
          const messageText = "Admin authorization is missing.";
          setMessage(messageText);
          showPopup(messageText, "error");
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE}/admin/comments/${editingCommentId}/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({ text: editingCommentText }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            const messageText =
              data.detail ||
              data.message ||
              `Unable to update comment ${editingCommentId}.`;
            setMessage(messageText);
            showPopup(messageText, "error");
            return;
          }
          const successMessage = `Comment ${editingCommentId} updated successfully.`;
          setMessage(successMessage);
          showPopup(successMessage, "success");
          setEditingCommentId(null);
          setEditingCommentText("");
          await loadComments();
        } catch {
          const messageText = `Unable to update comment ${editingCommentId}.`;
          setMessage(messageText);
          showPopup(messageText, "error");
        }
      },
    );
  };

  const markAllPaymentsSuccess = async () => {
    openConfirmDialog(
      "Mark all payments success",
      "Are you sure you want to mark all pending payments as success?",
      async () => {
        const authHeader = getAdminAuthHeader();
        if (!authHeader) {
          const messageText = "Admin authorization is missing.";
          setMessage(messageText);
          showPopup(messageText, "error");
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE}/admin/tax-payments/mark-all-success/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
            },
          );
          const data = await response.json();
          if (!response.ok) {
            const messageText =
              data.detail ||
              data.message ||
              "Unable to mark all payments as success.";
            setMessage(messageText);
            showPopup(messageText, "error");
            return;
          }
          const successMessage =
            data.message || "Marked all pending payments as success.";
          setMessage(successMessage);
          showPopup(successMessage, "success");
          await Promise.all([loadStats(), loadPayments()]);
        } catch {
          const messageText = "Unable to mark all payments as success.";
          setMessage(messageText);
          showPopup(messageText, "error");
        }
      },
    );
  };

  const gotoTab = (next: AdminTab) => {
    setTab(next);
    tabsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ------------------------------- early returns: loading / login / error ------------------------------- */

  if (status === "loading") {
    return (
      <div className="eg-admin flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Leaf className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin panel…
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="eg-admin flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card shadow-eco-lg">
          <div className="border-b border-border/70 bg-primary px-6 py-6 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">EcoGuard</p>
                <p className="text-xs text-primary-foreground/70">
                  Municipal Issue Management
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/85">
              Sign in with your admin credentials to access the admin panel.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={adminLoginData.email}
                  onChange={(event) =>
                    setAdminLoginData({
                      ...adminLoginData,
                      email: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Your password"
                  value={adminLoginData.password}
                  onChange={(event) =>
                    setAdminLoginData({
                      ...adminLoginData,
                      password: event.target.value,
                    })
                  }
                />
              </div>
              {adminError && (
                <p className="text-sm text-destructive" role="alert">
                  {adminError}
                </p>
              )}
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              This page is only for admin users. Regular users should use the
              normal login page.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="eg-admin flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-eco">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Unable to load admin panel</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            There was a problem loading admin data. Check your connection and
            try again.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="sm" onClick={loadAdmin}>
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- main layout ------------------------------- */

  const NAV_ITEMS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "map", label: "Map View", icon: <MapIcon className="h-4 w-4" /> },
    { key: "reports", label: "Issues", icon: <FileText className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { key: "comments", label: "Comments", icon: <MessageSquare className="h-4 w-4" /> },
    { key: "payments", label: "Payments", icon: <Receipt className="h-4 w-4" /> },
  ];

  const SidebarNav = () => (
    <nav className="flex flex-col gap-1 px-3" aria-label="Admin sections">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => {
            setMobileNavOpen(false);
            gotoTab(item.key);
          }}
          aria-current={tab === item.key ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === item.key
              ? "bg-white/15 text-white"
              : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );

  const brandBlock = (
    <div className="flex items-center gap-2.5 px-3 py-1">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <Leaf className="h-5 w-5 text-emerald-300" />
      </div>
      <div>
        <p className="text-base font-semibold leading-tight text-white">EcoGuard</p>
        <p className="text-[11px] leading-tight text-primary-foreground/60">
          Municipal Issue Management
        </p>
      </div>
    </div>
  );

  const roleText = userInfo?.is_superuser
    ? "Administrator"
    : userInfo?.is_staff
      ? "Staff"
      : "Administrator";

  const currentReportsList = filteredReports;

  return (
    <div className="eg-admin min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-black/10 bg-[hsl(152_62%_16%)] lg:flex">
        <div className="px-2 py-5">{brandBlock}</div>
        <div className="mt-2 flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
        <div className="border-t border-white/10 p-4">
          <p className="text-xs font-medium text-white">{userInfo?.name ?? "—"}</p>
          <p className="mt-0.5 truncate text-[11px] text-primary-foreground/60">
            {userInfo?.email ?? ""}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card px-3 sm:gap-3 sm:px-5">
          <Sheet
            open={mobileNavOpen}
            onOpenChange={setMobileNavOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 border-0 bg-[hsl(152_62%_16%)] p-0 [&>button]:text-white"
            >
              <SheetHeader className="px-3 py-5">
                <SheetTitle asChild>
                  <div>{brandBlock}</div>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  EcoGuard admin navigation
                </SheetDescription>
              </SheetHeader>
              <div className="py-2">
                <SidebarNav />
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={SEARCH_PLACEHOLDER[tab]}
              aria-label="Search admin records"
              className={`${inputValueClass} pl-8`}
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshData}
              aria-label="Refresh data"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md p-1.5 pr-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials(userInfo?.name ?? "")}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight">
                      {userInfo?.name ?? "Admin"}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-tight">
                      {roleText}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-medium">{userInfo?.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {userInfo?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6" ref={tabsAnchorRef}>
          {message && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
              {message}
            </div>
          )}

          {/* ================================ DASHBOARD ================================ */}
          {tab === "dashboard" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Welcome back, {(userInfo?.name ?? "Admin").split(" ")[0]}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Manage issues, users and payments for your municipality.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(
                  [
                    {
                      label: "Total Issues",
                      value: stats?.reports,
                      icon: <FileText className="h-4 w-4" />,
                      tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
                    },
                    {
                      label: "Resolved",
                      value: stats?.resolved_reports,
                      icon: <CheckCircle2 className="h-4 w-4" />,
                      tone: "text-blue-700 bg-blue-50 border-blue-100",
                    },
                    {
                      label: "Active Users",
                      value: stats?.users,
                      icon: <Users className="h-4 w-4" />,
                      tone: "text-violet-700 bg-violet-50 border-violet-100",
                    },
                    {
                      label: "Pending Issues",
                      value: stats?.pending_reports,
                      icon: <Clock className="h-4 w-4" />,
                      tone: "text-amber-700 bg-amber-50 border-amber-100",
                    },
                  ] as const
                ).map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-lg border bg-card p-4 shadow-eco"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-md border ${kpi.tone}`}
                      >
                        {kpi.icon}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {kpi.value ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                {/* Map panel */}
                <section className="rounded-lg border bg-card shadow-eco">
                  <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">Issue Locations</h2>
                      <p className="text-xs text-muted-foreground">
                        {mapReports.length} mapped issue
                        {mapReports.length === 1 ? "" : "s"} with coordinates
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Filter map by category"
                        className={selectClass}
                        value={mapCategory}
                        onChange={(e) => setMapCategory(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter map by status"
                        className={selectClass}
                        value={mapStatus}
                        onChange={(e) => setMapStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">New</option>
                        <option value="inprogress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <AdminMap markers={mapReports} className="h-[320px] w-full" />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 p-3">
                    <MapLegend />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gotoTab("map")}
                    >
                      View on Full Map
                    </Button>
                  </div>
                </section>

                {/* Category donut */}
                <section className="rounded-lg border bg-card p-4 shadow-eco">
                  <h2 className="text-sm font-semibold">Issues by Category</h2>
                  {categoryData.length === 0 ? (
                    <EmptyState label="No reported issues yet." />
                  ) : (
                    <>
                      <div className="relative mx-auto mt-2 h-[220px] max-w-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="62%"
                              outerRadius="92%"
                              paddingAngle={2}
                              strokeWidth={1}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`${value}`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 grid place-items-center">
                          <div className="text-center">
                            <p className="text-xl font-semibold tracking-tight">
                              {categoryTotal}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Total Issues
                            </p>
                          </div>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {categoryData.map((entry) => (
                          <li
                            key={entry.name}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: entry.fill }}
                            />
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">
                              {entry.name}
                            </span>
                            <span className="font-medium">{entry.value}</span>
                            <span className="w-10 text-right text-xs text-muted-foreground">
                              {((entry.value / categoryTotal) * 100).toFixed(0)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              </div>

              {/* Quick actions */}
              <section className="rounded-lg border bg-card p-4 shadow-eco">
                <h2 className="text-sm font-semibold">Quick Actions</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Button className="justify-start gap-2" onClick={() => gotoTab("reports")}>
                    <Plus className="h-4 w-4" />
                    Add New Issue
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => gotoTab("payments")}
                  >
                    <Receipt className="h-4 w-4" />
                    Review Payments
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => gotoTab("users")}
                  >
                    <Users className="h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => gotoTab("comments")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Moderate Comments
                  </Button>
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                {/* Recent issues */}
                <section className="overflow-hidden rounded-lg border bg-card shadow-eco">
                  <div className="flex items-center justify-between border-b border-border/70 p-4">
                    <h2 className="text-sm font-semibold">Recent Issues</h2>
                    <Button variant="ghost" size="sm" onClick={() => gotoTab("reports")}>
                      View All Issues
                    </Button>
                  </div>
                  {recentIssues.length === 0 ? (
                    <EmptyState label="No recent issues found." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] text-left">
                        <thead className="border-b border-border/70 bg-muted/40">
                          <tr>
                            <th className={thClass}>ID</th>
                            <th className={thClass}>Title</th>
                            <th className={thClass}>Category</th>
                            <th className={thClass}>Location</th>
                            <th className={thClass}>Reported By</th>
                            <th className={thClass}>Status</th>
                            <th className={thClass}>Priority</th>
                            <th className={thClass}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentIssues.map((report) => (
                            <tr
                              key={report.id}
                              className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                            >
                              <td className={`${tdClass} font-medium text-muted-foreground`}>
                                #{report.id}
                              </td>
                              <td className={`${tdClass} max-w-[220px] truncate font-medium`}>
                                {report.title}
                              </td>
                              <td className={`${tdClass} text-muted-foreground`}>
                                {categoryLabel(report.category)}
                              </td>
                              <td className={`${tdClass} max-w-[180px] truncate text-muted-foreground`}>
                                {formatLocation(report)}
                              </td>
                              <td className={`${tdClass} text-muted-foreground`}>
                                {report.name || report.email}
                              </td>
                              <td className={tdClass}>
                                <StatusBadge status={getReportStatus(report)} />
                              </td>
                              <td className={tdClass}>
                                <SeverityBadge severity={report.severity} />
                              </td>
                              <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                                {formatDateTime(report.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Recent activity */}
                <section className="rounded-lg border bg-card p-4 shadow-eco">
                  <h2 className="text-sm font-semibold">Recent Activity</h2>
                  {activity.length === 0 ? (
                    <EmptyState label="No activity yet." />
                  ) : (
                    <ul className="mt-2 divide-y divide-border/60">
                      {activity.map((item) => (
                        <li key={item.id} className="flex gap-3 py-2.5">
                          <span
                            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                              item.icon === "report"
                                ? "border-blue-100 bg-blue-50 text-blue-600"
                                : item.icon === "comment"
                                  ? "border-green-100 bg-green-50 text-green-600"
                                  : "border-amber-100 bg-amber-50 text-amber-600"
                            }`}
                          >
                            {item.icon === "report" ? (
                              <FileText className="h-3.5 w-3.5" />
                            ) : item.icon === "comment" ? (
                              <MessageSquare className="h-3.5 w-3.5" />
                            ) : (
                              <Receipt className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.text}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.sub} · {formatDateTime(item.ts)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* ================================ MAP VIEW ================================ */}
          {tab === "map" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Map View</h1>
                  <p className="text-sm text-muted-foreground">
                    All reported issues with coordinates, filtered live from the
                    issue list.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter by category"
                    className={selectClass}
                    value={mapCategory}
                    onChange={(e) => setMapCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by status"
                    className={selectClass}
                    value={mapStatus}
                    onChange={(e) => setMapStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">New</option>
                    <option value="inprogress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <section className="overflow-hidden rounded-lg border bg-card shadow-eco">
                <AdminMap markers={mapReports} className="h-[65vh] min-h-[400px] w-full" />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 p-3">
                  <MapLegend />
                  <p className="text-xs text-muted-foreground">
                    {mapReports.length} of {reports.length} issues shown — issues
                    without coordinates are not displayed.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* ================================ ISSUES ================================ */}
          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Issues</h1>
                  <p className="text-sm text-muted-foreground">
                    Review and update issue reports.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter by status"
                    className={selectClass}
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">New</option>
                    <option value="inprogress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span className="text-sm text-muted-foreground">
                    {filteredReports.length} of {reports.length}
                  </span>
                </div>
              </div>

              <section className="rounded-lg border bg-card shadow-eco">
                <div className="border-b border-border/70 p-4">
                  <h2 className="text-sm font-semibold">Add a new report</h2>
                  <p className="text-xs text-muted-foreground">
                    Create a report directly from the admin panel.
                  </p>
                  <form
                    onSubmit={handleCreateReport}
                    className="mt-4 grid gap-4 lg:grid-cols-2"
                  >
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-report-title">
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="new-report-title"
                          placeholder="Road flooding at 5th avenue"
                          value={newReport.title}
                          onChange={(event) => {
                            const next = {
                              ...newReport,
                              title: event.target.value,
                            };
                            setNewReport(next);
                            validateReportForm(next);
                          }}
                          onBlur={() => validateReportForm()}
                          aria-invalid={!!newReportErrors.title}
                        />
                        {newReportErrors.title && (
                          <p className="text-xs text-destructive">
                            {newReportErrors.title}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="new-report-category">
                            Category <span className="text-destructive">*</span>
                          </Label>
                          <select
                            id="new-report-category"
                            className={`w-full ${selectClass}`}
                            value={newReport.category}
                            onChange={(event) => {
                              const next = {
                                ...newReport,
                                category: event.target.value,
                              };
                              setNewReport(next);
                              validateReportForm(next);
                            }}
                            onBlur={() => validateReportForm()}
                            aria-invalid={!!newReportErrors.category}
                          >
                            <option value="road">Road &amp; Infrastructure</option>
                            <option value="water">Water &amp; Utilities</option>
                            <option value="electricity">Electricity Problems</option>
                            <option value="park">Park &amp; Recreation</option>
                            <option value="environment">Environmental Issue</option>
                            <option value="waste">Waste Management</option>
                            <option value="others">Others</option>
                          </select>
                          {newReportErrors.category && (
                            <p className="text-xs text-destructive">
                              {newReportErrors.category}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="new-report-severity">
                            Severity <span className="text-destructive">*</span>
                          </Label>
                          <select
                            id="new-report-severity"
                            className={`w-full ${selectClass}`}
                            value={newReport.severity}
                            onChange={(event) => {
                              const next = {
                                ...newReport,
                                severity: event.target.value,
                              };
                              setNewReport(next);
                              validateReportForm(next);
                            }}
                            onBlur={() => validateReportForm()}
                            aria-invalid={!!newReportErrors.severity}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          {newReportErrors.severity && (
                            <p className="text-xs text-destructive">
                              {newReportErrors.severity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-report-description">
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="new-report-description"
                          placeholder="Describe the issue in detail"
                          value={newReport.description}
                          onChange={(event) => {
                            const next = {
                              ...newReport,
                              description: event.target.value,
                            };
                            setNewReport(next);
                            validateReportForm(next);
                          }}
                          onBlur={() => validateReportForm()}
                          aria-invalid={!!newReportErrors.description}
                        />
                        {newReportErrors.description && (
                          <p className="text-xs text-destructive">
                            {newReportErrors.description}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-report-address">Location address</Label>
                        <Input
                          id="new-report-address"
                          placeholder="Optional street or neighborhood"
                          value={newReport.location_address}
                          onChange={(event) =>
                            setNewReport({
                              ...newReport,
                              location_address: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Button type="submit">Create report</Button>
                      </div>
                    </div>
                  </form>
                </div>

                {currentReportsList.length === 0 ? (
                  <EmptyState label="No issues match your filters." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left">
                      <thead className="border-b border-border/70 bg-muted/40">
                        <tr>
                          <th className={thClass}>ID</th>
                          <th className={thClass}>Title</th>
                          <th className={thClass}>Category</th>
                          <th className={thClass}>Location</th>
                          <th className={thClass}>Reported By</th>
                          <th className={thClass}>Status</th>
                          <th className={thClass}>Priority</th>
                          <th className={thClass}>Date</th>
                          <th className={`${tdClass} w-10 text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentReportsList.map((report) => {
                          const reportStatus = getReportStatus(report);
                          return (
                            <tr
                              key={report.id}
                              className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                            >
                              <td className={`${tdClass} font-medium text-muted-foreground`}>
                                #{report.id}
                              </td>
                              <td className={`${tdClass} max-w-[220px] truncate font-medium`}>
                                {report.title}
                              </td>
                              <td className={`${tdClass} text-muted-foreground`}>
                                {categoryLabel(report.category)}
                              </td>
                              <td className={`${tdClass} max-w-[180px] text-muted-foreground`}>
                                <span className="block max-w-[180px] truncate">
                                  {formatLocation(report)}
                                </span>
                                {report.location_lat != null &&
                                  report.location_lng != null && (
                                    <span className="block text-xs text-muted-foreground/70">
                                      {report.location_lat.toFixed(4)},{" "}
                                      {report.location_lng.toFixed(4)}
                                    </span>
                                  )}
                              </td>
                              <td className={`${tdClass} text-muted-foreground`}>
                                {report.name || report.email}
                              </td>
                              <td className={tdClass}>
                                <StatusBadge status={reportStatus} />
                              </td>
                              <td className={tdClass}>
                                <SeverityBadge severity={report.severity} />
                              </td>
                              <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                                {formatDateTime(report.created_at)}
                              </td>
                              <td className={`${tdClass} text-right`}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Actions for report ${report.id}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    {reportStatus !== "inprogress" &&
                                      !report.resolved && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setReports((prev) =>
                                              prev.map((r) =>
                                                r.id === report.id
                                                  ? { ...r, status: "inprogress" }
                                                  : r,
                                              ),
                                            );
                                            patchRecord(
                                              `${API_BASE}/admin/reports/${report.id}/`,
                                              { status: "inprogress" },
                                              `report ${report.id}`,
                                            );
                                          }}
                                        >
                                          Mark In Progress
                                        </DropdownMenuItem>
                                      )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        patchRecord(
                                          `${API_BASE}/admin/reports/${report.id}/`,
                                          {
                                            status: report.resolved
                                              ? "pending"
                                              : "resolved",
                                          },
                                          `report ${report.id}`,
                                        )
                                      }
                                    >
                                      {report.resolved
                                        ? "Unresolve"
                                        : "Mark Resolved"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() =>
                                        confirmDeleteRecord(
                                          `${API_BASE}/admin/reports/${report.id}/`,
                                          `report ${report.id}`,
                                        )
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================ USERS ================================ */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Users</h1>
                  <p className="text-sm text-muted-foreground">
                    Control admin users and registered accounts.
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>

              <section className="rounded-lg border bg-card shadow-eco">
                <div className="border-b border-border/70 p-4">
                  <h2 className="text-sm font-semibold">Create account</h2>
                  <form
                    onSubmit={handleCreateUser}
                    className="mt-3 grid gap-4 xl:grid-cols-[1.6fr_1fr]"
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-user-name">Name *</Label>
                        <Input
                          id="new-user-name"
                          placeholder="Full name"
                          value={newUser.name}
                          onChange={(event) => {
                            const next = { ...newUser, name: event.target.value };
                            setNewUser(next);
                            validateUserForm(next);
                          }}
                          onBlur={() => validateUserForm()}
                          aria-invalid={!!newUserErrors.name}
                        />
                        {newUserErrors.name && (
                          <p className="text-xs text-destructive">
                            {newUserErrors.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-user-email">Email *</Label>
                        <Input
                          id="new-user-email"
                          type="email"
                          placeholder="admin@example.com"
                          value={newUser.email}
                          onChange={(event) => {
                            const next = { ...newUser, email: event.target.value };
                            setNewUser(next);
                            validateUserForm(next);
                          }}
                          onBlur={() => validateUserForm()}
                          aria-invalid={!!newUserErrors.email}
                        />
                        {newUserErrors.email && (
                          <p className="text-xs text-destructive">
                            {newUserErrors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-user-password">Password *</Label>
                        <Input
                          id="new-user-password"
                          type="password"
                          placeholder="At least 8 characters"
                          value={newUser.password}
                          onChange={(event) => {
                            const next = {
                              ...newUser,
                              password: event.target.value,
                            };
                            setNewUser(next);
                            validateUserForm(next);
                          }}
                          onBlur={() => validateUserForm()}
                          aria-invalid={!!newUserErrors.password}
                        />
                        {newUserErrors.password && (
                          <p className="text-xs text-destructive">
                            {newUserErrors.password}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <div className="grid w-full gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                        <label className="flex items-center gap-2 text-muted-foreground">
                          <input
                            id="new-user-staff"
                            type="checkbox"
                            checked={newUser.is_staff}
                            onChange={(event) =>
                              setNewUser({
                                ...newUser,
                                is_staff: event.target.checked,
                              })
                            }
                          />
                          Staff account
                        </label>
                        <label className="flex items-center gap-2 text-muted-foreground">
                          <input
                            id="new-user-superuser"
                            type="checkbox"
                            checked={newUser.is_superuser}
                            onChange={(event) =>
                              setNewUser({
                                ...newUser,
                                is_superuser: event.target.checked,
                              })
                            }
                          />
                          Superuser access
                        </label>
                        <Button type="submit" className="w-full justify-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Create account
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>

                {filteredUsers.length === 0 ? (
                  <EmptyState label="No users match your search." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead className="border-b border-border/70 bg-muted/40">
                        <tr>
                          <th className={thClass}>Name</th>
                          <th className={thClass}>Email</th>
                          <th className={thClass}>Role</th>
                          <th className={thClass}>Status</th>
                          <th className={`${tdClass} w-10 text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                          >
                            <td className={`${tdClass} font-medium`}>
                              <span className="flex items-center gap-2.5">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                  {initials(user.name)}
                                </span>
                                {user.name}
                              </span>
                            </td>
                            <td className={`${tdClass} text-muted-foreground`}>
                              {user.email}
                            </td>
                            <td className={tdClass}>
                              <RoleBadge user={user} />
                            </td>
                            <td className={tdClass}>
                              <AccountBadge active={user.is_active} />
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for user ${user.email}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateUser(
                                        user.id,
                                        { is_staff: !user.is_staff },
                                        `user ${user.email}`,
                                      )
                                    }
                                  >
                                    {user.is_staff
                                      ? "Revoke staff"
                                      : "Make staff"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateUser(
                                        user.id,
                                        { is_superuser: !user.is_superuser },
                                        `user ${user.email}`,
                                      )
                                    }
                                  >
                                    {user.is_superuser
                                      ? "Revoke superuser"
                                      : "Make superuser"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      confirmDeleteRecord(
                                        `${API_BASE}/admin/users/${user.id}/`,
                                        `user ${user.email}`,
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================ COMMENTS ================================ */}
          {tab === "comments" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Comments</h1>
                  <p className="text-sm text-muted-foreground">
                    Moderate and remove comments.
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredComments.length} of {comments.length} comments
                </span>
              </div>

              <section className="rounded-lg border bg-card shadow-eco">
                <div className="border-b border-border/70 p-4">
                  <h2 className="text-sm font-semibold">
                    Add a comment to a report
                  </h2>
                  <form
                    onSubmit={handleCreateComment}
                    className="mt-3 grid gap-4 lg:grid-cols-2"
                  >
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-comment-report">
                          Report <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="new-comment-report"
                          className={`w-full ${selectClass}`}
                          value={newComment.report}
                          onChange={(event) => {
                            const next = {
                              ...newComment,
                              report: event.target.value,
                            };
                            setNewComment(next);
                            validateCommentForm(next);
                          }}
                          onBlur={() => validateCommentForm()}
                          aria-invalid={!!newCommentErrors.report}
                        >
                          <option value="">Select a report</option>
                          {reports.map((report) => (
                            <option key={report.id} value={report.id}>
                              {report.title}
                            </option>
                          ))}
                        </select>
                        {newCommentErrors.report && (
                          <p className="text-xs text-destructive">
                            {newCommentErrors.report}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-comment-rating">
                          Rating <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="new-comment-rating"
                          className={`w-full ${selectClass}`}
                          value={newComment.rating}
                          onChange={(event) => {
                            const next = {
                              ...newComment,
                              rating: Number(event.target.value),
                            };
                            setNewComment(next);
                            validateCommentForm(next);
                          }}
                          onBlur={() => validateCommentForm()}
                          aria-invalid={!!newCommentErrors.rating}
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} stars
                            </option>
                          ))}
                        </select>
                        {newCommentErrors.rating && (
                          <p className="text-xs text-destructive">
                            {newCommentErrors.rating}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-comment-text">Comment text</Label>
                        <Textarea
                          id="new-comment-text"
                          placeholder="Write your comment here"
                          value={newComment.text}
                          onChange={(event) => {
                            const next = {
                              ...newComment,
                              text: event.target.value,
                            };
                            setNewComment(next);
                            validateCommentForm(next);
                          }}
                          onBlur={() => validateCommentForm()}
                          aria-invalid={!!newCommentErrors.text}
                        />
                        {newCommentErrors.text && (
                          <p className="text-xs text-destructive">
                            {newCommentErrors.text}
                          </p>
                        )}
                      </div>
                      <div>
                        <Button type="submit">Post comment</Button>
                      </div>
                    </div>
                  </form>
                </div>

                {editingCommentId !== null && (
                  <div className="border-b border-border/70 bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          Editing comment #{editingCommentId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Update the text and save to apply the change.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveCommentEdit}
                        >
                          Save changes
                        </Button>
                      </div>
                    </div>
                    <textarea
                      className="mt-3 min-h-[110px] w-full rounded-md border border-input bg-card p-3 text-sm outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                      value={editingCommentText}
                      onChange={(event) =>
                        setEditingCommentText(event.target.value)
                      }
                    />
                  </div>
                )}

                {filteredComments.length === 0 ? (
                  <EmptyState label="No comments match your search." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead className="border-b border-border/70 bg-muted/40">
                        <tr>
                          <th className={thClass}>Report</th>
                          <th className={thClass}>User</th>
                          <th className={thClass}>Comment</th>
                          <th className={thClass}>Rating</th>
                          <th className={`${tdClass} w-10 text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComments.map((comment) => (
                          <tr
                            key={comment.id}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                          >
                            <td className={`${tdClass} max-w-[200px] truncate font-medium`}>
                              {comment.report_title}
                            </td>
                            <td className={`${tdClass} text-muted-foreground`}>
                              {comment.user_name || comment.user_email}
                              <span className="block text-xs text-muted-foreground/70">
                                {comment.user_email}
                              </span>
                            </td>
                            <td className={`${tdClass} max-w-[280px] text-muted-foreground`}>
                              <span className="block max-w-[280px] truncate">
                                {comment.text}
                              </span>
                            </td>
                            <td className={`${tdClass} text-muted-foreground`}>
                              {comment.rating} / 5
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit comment ${comment.id}`}
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingCommentText(comment.text);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Actions for comment ${comment.id}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingCommentText(comment.text);
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() =>
                                        confirmDeleteRecord(
                                          `${API_BASE}/admin/comments/${comment.id}/`,
                                          `comment ${comment.id}`,
                                        )
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================ PAYMENTS ================================ */}
          {tab === "payments" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Tax Payments
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Approve or remove pending payments.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {filteredPayments.length} of {payments.length} payments
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={markAllPaymentsSuccess}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Mark all success
                  </Button>
                </div>
              </div>

              <section className="rounded-lg border bg-card shadow-eco">
                {filteredPayments.length === 0 ? (
                  <EmptyState label="No payments match your search." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left">
                      <thead className="border-b border-border/70 bg-muted/40">
                        <tr>
                          <th className={thClass}>PID</th>
                          <th className={thClass}>User</th>
                          <th className={thClass}>Amount</th>
                          <th className={thClass}>Period</th>
                          <th className={thClass}>Status</th>
                          <th className={thClass}>Date</th>
                          <th className={`${tdClass} w-10 text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                          >
                            <td className={`${tdClass} font-mono text-xs`}>
                              {payment.pid}
                            </td>
                            <td className={`${tdClass} text-muted-foreground`}>
                              {payment.user_name || payment.user_email}
                              <span className="block text-xs text-muted-foreground/70">
                                {payment.user_email}
                              </span>
                            </td>
                            <td className={`${tdClass} font-medium`}>
                              {payment.amount}
                            </td>
                            <td className={`${tdClass} text-muted-foreground`}>
                              {payment.tax_period}
                            </td>
                            <td className={tdClass}>
                              <PaymentStatusBadge status={payment.status} />
                            </td>
                            <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                              {formatDateTime(payment.created_at)}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for payment ${payment.pid}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44"
                                >
                                  {payment.status !== "success" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        patchRecord(
                                          `${API_BASE}/admin/tax-payments/${payment.id}/`,
                                          { status: "success" },
                                          `payment ${payment.pid}`,
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Mark success
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      confirmDeleteRecord(
                                        `${API_BASE}/admin/tax-payments/${payment.id}/`,
                                        `payment ${payment.pid}`,
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {popup && (
        <div
          className={`fixed right-4 top-20 z-50 w-full max-w-sm rounded-lg border bg-card p-4 shadow-eco-lg sm:right-6 ${
            popup.type === "error"
              ? "border-red-200"
              : popup.type === "success"
                ? "border-green-200"
                : "border-border"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              {popup.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : popup.type === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {popup.type === "success"
                    ? "Success"
                    : popup.type === "error"
                      ? "Error"
                      : "Info"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {popup.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setPopup(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDialog}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<
    "dashboard" | "users" | "reports" | "comments" | "payments"
  >("dashboard");
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "unauthorized" | "error"
  >("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Users", count: stats.users },
      { name: "Reports", count: stats.reports },
      { name: "Pending", count: stats.pending_reports },
      { name: "Solved", count: stats.resolved_reports },
    ];
  }, [stats]);

  const issuePieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Solved", value: stats.resolved_reports },
      { name: "Pending", value: stats.pending_reports },
    ];
  }, [stats]);
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [payments, setPayments] = useState<TaxPayment[]>([]);
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

  const [adminLoginData, setAdminLoginData] = useState({
    email: "",
    password: "",
  });
  const [adminError, setAdminError] = useState<string | null>(null);

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
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
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
      errors.email = "Enter a valid email address.";
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
    body: Record<string, any>,
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
    changes: Record<string, any>,
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-lg font-medium">Loading admin panel...</div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <Card className="w-full max-w-lg border border-slate-800 bg-slate-900/95 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white">Admin Login</CardTitle>
            <CardDescription>
              Sign in with your admin credentials to access the Eco Guard admin
              panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                <p className="text-sm text-destructive">{adminError}</p>
              )}
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-400">
              This page is only for admin users. Regular users should use the
              normal login page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle>Unable to load admin panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was a problem loading admin data. Check your connection and
              try again.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="eco" size="sm" onClick={loadAdmin}>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/40">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] p-6 sm:p-8 lg:p-10">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_15%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_35%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div>
                  <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                    Control panel
                  </span>
                  <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Admin insights
                  </h1>
                  <p className="mt-4 max-w-2xl text-slate-300 sm:text-lg">
                    View system health, resolve reports faster and manage users
                    with analytics dashboard.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/95 p-5 backdrop-blur-xl">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                      Active admin
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {userInfo?.name ?? "—"}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Current session
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/95 p-5 backdrop-blur-xl">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                      Latest refresh
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">Live snapshot</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/95 p-6 shadow-inner shadow-slate-950/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                      Reports
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {stats?.reports ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/95 p-6 shadow-inner shadow-slate-950/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                      Resolved
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {stats?.resolved_reports ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20">
              <div className="grid gap-6">
                <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 text-white shadow-inner shadow-slate-950/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Live summary</h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Instant overview for the full system.
                      </p>
                    </div>
                    <div className="inline-flex rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-300">
                      System
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/90 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                        Total users
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {stats?.users ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/90 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                        Pending Issue
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {stats?.pending_reports ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/90 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                        Comments
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {stats?.comments ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/90 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                        Payments
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {stats?.tax_payments ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">
                    Quick actions
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Jump to your most used admin sections.
                  </p>
                  <div className="mt-6 grid gap-3">
                    <Button
                      type="button"
                      variant="eco"
                      onClick={() => setTab("users")}
                      className="w-full justify-start"
                    >
                      Review users
                    </Button>
                    <Button
                      type="button"
                      variant="eco"
                      onClick={() => setTab("reports")}
                      className="w-full justify-start"
                    >
                      Review reports
                    </Button>
                    <Button
                      type="button"
                      variant="eco"
                      onClick={() => setTab("payments")}
                      className="w-full justify-start"
                    >
                      Review payments
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-8 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-slate-200 bg-white p-6 text-slate-900">
                <CardHeader>
                  <CardTitle className="text-xl">Issue trend</CardTitle>
                  <CardDescription>
                    Total users, reports, pending issues and resolved issues.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                      <XAxis dataKey="name" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#22C55E"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white p-6 text-slate-900">
                <CardHeader>
                  <CardTitle className="text-xl">Resolved vs pending</CardTitle>
                  <CardDescription>
                    Distribution of solved and pending issues in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issuePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={4}
                        label
                      >
                        {issuePieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={index === 0 ? "#22C55E" : "#F97316"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-6 sm:px-8">
            {message && (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                {message}
              </div>
            )}

            {popup && (
              <div
                className={`fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-3xl border p-4 shadow-2xl transition-all ${
                  popup.type === "success"
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-50"
                    : popup.type === "error"
                      ? "border-rose-400 bg-rose-500/10 text-rose-50"
                      : "border-slate-600 bg-slate-950/95 text-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {popup.type === "success"
                        ? "Success"
                        : popup.type === "error"
                          ? "Error"
                          : "Info"}
                    </p>
                    <p className="text-sm leading-6">{popup.text}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-slate-300 hover:text-white"
                    onClick={() => setPopup(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

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
                  <AlertDialogCancel
                    onClick={() => setConfirmDialogOpen(false)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDialog}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="mt-6 rounded-[1.75rem] bg-slate-900/95 p-6 shadow-inner shadow-slate-950/10 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as typeof tab)}
                >

                  
                  
                  <TabsList className="grid w-full grid-cols-5 gap-2 rounded-full bg-slate-950/80 p-1 shadow-inner shadow-slate-950/20 sm:w-auto">
                    {/* <TabsTrigger value="dashboard">Dashboard</TabsTrigger> */}
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                  </TabsList>
                  <TabsContent value="users">
                    <div className="mt-6 space-y-6">
                      <Card className="border border-slate-800 bg-slate-950/90 p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-white">
                              Users
                            </CardTitle>
                            <CardDescription>
                              Control admin users and registered accounts.
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {users.length} total
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <form
                            onSubmit={handleCreateUser}
                            className="grid gap-4 xl:grid-cols-[1.6fr_1fr]"
                          >
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label htmlFor="new-user-name">Name</Label>
                                <Input
                                  id="new-user-name"
                                  placeholder="Full name"
                                  value={newUser.name}
                                  onChange={(event) => {
                                    const next = {
                                      ...newUser,
                                      name: event.target.value,
                                    };
                                    setNewUser(next);
                                    validateUserForm(next);
                                  }}
                                />
                                {newUserErrors.name && (
                                  <p className="text-sm text-destructive">
                                    {newUserErrors.name}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-user-email">Email</Label>
                                <Input
                                  id="new-user-email"
                                  type="email"
                                  placeholder="admin@example.com"
                                  value={newUser.email}
                                  onChange={(event) => {
                                    const next = {
                                      ...newUser,
                                      email: event.target.value,
                                    };
                                    setNewUser(next);
                                    validateUserForm(next);
                                  }}
                                />
                                {newUserErrors.email && (
                                  <p className="text-sm text-destructive">
                                    {newUserErrors.email}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-user-password">
                                  Password
                                </Label>
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
                                />
                                {newUserErrors.password && (
                                  <p className="text-sm text-destructive">
                                    {newUserErrors.password}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                              <div className="space-y-3 text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                  <input
                                    id="new-user-staff"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                    checked={newUser.is_staff}
                                    onChange={(event) =>
                                      setNewUser({
                                        ...newUser,
                                        is_staff: event.target.checked,
                                      })
                                    }
                                  />
                                  <Label
                                    htmlFor="new-user-staff"
                                    className="mb-0"
                                  >
                                    Staff account
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    id="new-user-superuser"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                    checked={newUser.is_superuser}
                                    onChange={(event) =>
                                      setNewUser({
                                        ...newUser,
                                        is_superuser: event.target.checked,
                                      })
                                    }
                                  />
                                  <Label
                                    htmlFor="new-user-superuser"
                                    className="mb-0"
                                  >
                                    Superuser access
                                  </Label>
                                </div>
                              </div>
                              <Button type="submit" variant="eco">
                                Create account
                              </Button>
                            </div>
                          </form>

                          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/85">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                                  <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {users.map((user) => (
                                    <tr
                                      key={user.id}
                                      className="border-b border-slate-800/70"
                                    >
                                      <td className="px-4 py-4 text-slate-100">
                                        {user.name}
                                      </td>
                                      <td className="px-4 py-4 text-slate-300">
                                        {user.email}
                                      </td>
                                      <td className="px-4 py-4 text-slate-300">
                                        {user.is_superuser
                                          ? "Superuser"
                                          : user.is_staff
                                            ? "Staff"
                                            : "User"}
                                      </td>
                                      <td className="px-4 py-4 text-slate-300">
                                        {user.is_active ? "Active" : "Disabled"}
                                      </td>
                                      <td className="px-4 py-4 text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
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
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                              updateUser(
                                                user.id,
                                                {
                                                  is_superuser:
                                                    !user.is_superuser,
                                                },
                                                `user ${user.email}`,
                                              )
                                            }
                                          >
                                            {user.is_superuser
                                              ? "Revoke superuser"
                                              : "Make superuser"}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                              confirmDeleteRecord(
                                                `${API_BASE}/admin/users/${user.id}/`,
                                                `user ${user.email}`,
                                              )
                                            }
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="reports">
                    <div className="mt-6 space-y-6">
                      <Card className="border border-slate-800 bg-slate-950/90 p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-white">
                              Reports
                            </CardTitle>
                            <CardDescription>
                              Review and update issue reports.
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {reports.length} items
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="rounded-3xl border border-slate-800 bg-slate-950/85 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <p className="text-lg font-semibold text-white">
                                  Add a new report
                                </p>
                                <p className="text-sm text-slate-400">
                                  Create a report directly from the admin panel.
                                </p>
                              </div>
                            </div>
                            <form
                              onSubmit={handleCreateReport}
                              className="mt-5 grid gap-4 lg:grid-cols-2"
                            >
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-report-title">
                                    Title
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
                                  />
                                  {newReportErrors.title && (
                                    <p className="text-sm text-destructive">
                                      {newReportErrors.title}
                                    </p>
                                  )}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-report-category">
                                      Category
                                    </Label>
                                    <select
                                      id="new-report-category"
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      value={newReport.category}
                                      onChange={(event) => {
                                        const next = {
                                          ...newReport,
                                          category: event.target.value,
                                        };
                                        setNewReport(next);
                                        validateReportForm(next);
                                      }}
                                    >
                                      <option value="road">
                                        Road & Infrastructure
                                      </option>
                                      <option value="water">
                                        Water & Utilities
                                      </option>
                                      <option value="electricity">
                                        Electricity Problems
                                      </option>
                                      <option value="park">
                                        Park & Recreation
                                      </option>
                                      <option value="environment">
                                        Environmental Issue
                                      </option>
                                      <option value="waste">
                                        Waste Management
                                      </option>
                                      <option value="others">Others</option>
                                    </select>
                                    {newReportErrors.category && (
                                      <p className="text-sm text-destructive">
                                        {newReportErrors.category}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-report-severity">
                                      Severity
                                    </Label>
                                    <select
                                      id="new-report-severity"
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      value={newReport.severity}
                                      onChange={(event) => {
                                        const next = {
                                          ...newReport,
                                          severity: event.target.value,
                                        };
                                        setNewReport(next);
                                        validateReportForm(next);
                                      }}
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                      <option value="urgent">Urgent</option>
                                    </select>
                                    {newReportErrors.severity && (
                                      <p className="text-sm text-destructive">
                                        {newReportErrors.severity}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-report-description">
                                    Description
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
                                  />
                                  {newReportErrors.description && (
                                    <p className="text-sm text-destructive">
                                      {newReportErrors.description}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new-report-address">
                                    Location address
                                  </Label>
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
                                <Button type="submit" variant="eco">
                                  Create report
                                </Button>
                              </div>
                            </form>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                              <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                                <tr>
                                  <th className="px-4 py-3">Title</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Severity</th>
                                  <th className="px-4 py-3">Reporter</th>
                                  <th className="px-4 py-3">Location</th>
                                  <th className="px-4 py-3">Resolved</th>
                                  <th className="px-4 py-3 text-right">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {reports.map((report) => (
                                  <tr
                                    key={report.id}
                                    className="border-b border-slate-800/70"
                                  >
                                    <td className="px-4 py-4 text-slate-100">
                                      {report.title}
                                    </td>
                                    <td className="px-4 py-4 text-slate-300">
                                      {report.category}
                                    </td>
                                    <td className="px-4 py-4 text-slate-300">
                                      {report.severity}
                                    </td>
                                    <td className="px-4 py-4 text-slate-300">
                                      {report.email}
                                    </td>
                                    <td className="px-4 py-4 text-slate-300">
                                      {report.location_address
                                        ? report.location_address
                                        : "No address"}
                                      <div className="mt-1 text-xs text-slate-500">
                                        {report.location_lat != null &&
                                        report.location_lng != null
                                          ? `${report.location_lat.toFixed(4)}, ${report.location_lng.toFixed(4)}`
                                          : "Coordinates unavailable"}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-300">
                                      {report.resolved ? "Yes" : "No"}
                                    </td>
                                    <td className="flex justify-end gap-2 px-4 py-4">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                          patchRecord(
                                            `${API_BASE}/admin/reports/${report.id}/`,
                                            { resolved: !report.resolved },
                                            `report ${report.id}`,
                                          )
                                        }
                                      >
                                        {report.resolved
                                          ? "Unresolve"
                                          : "Resolve"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          confirmDeleteRecord(
                                            `${API_BASE}/admin/reports/${report.id}/`,
                                            `report ${report.id}`,
                                          )
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments">
                    <div className="mt-6 space-y-6">
                      <Card className="border border-slate-800 bg-slate-950/90 p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-white">
                              Comments
                            </CardTitle>
                            <CardDescription>
                              Moderate and remove comments.
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {comments.length} items
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6 overflow-x-auto">
                          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
                            <p className="text-lg font-semibold text-slate-900">
                              Add a comment to a report
                            </p>
                            <p className="text-sm text-slate-500">
                              Choose a report and post a comment from the admin
                              panel.
                            </p>
                            <form
                              onSubmit={handleCreateComment}
                              className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]"
                            >
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-comment-report">
                                    Report
                                  </Label>
                                  <select
                                    id="new-comment-report"
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={newComment.report}
                                    onChange={(event) => {
                                      const next = {
                                        ...newComment,
                                        report: event.target.value,
                                      };
                                      setNewComment(next);
                                      validateCommentForm(next);
                                    }}
                                  >
                                    <option value="">Select a report</option>
                                    {reports.map((report) => (
                                      <option key={report.id} value={report.id}>
                                        {report.title}
                                      </option>
                                    ))}
                                  </select>
                                  {newCommentErrors.report && (
                                    <p className="text-sm text-destructive">
                                      {newCommentErrors.report}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new-comment-rating">
                                    Rating
                                  </Label>
                                  <select
                                    id="new-comment-rating"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={newComment.rating}
                                    onChange={(event) => {
                                      const next = {
                                        ...newComment,
                                        rating: Number(event.target.value),
                                      };
                                      setNewComment(next);
                                      validateCommentForm(next);
                                    }}
                                  >
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <option key={rating} value={rating}>
                                        {rating} stars
                                      </option>
                                    ))}
                                  </select>
                                  {newCommentErrors.rating && (
                                    <p className="text-sm text-destructive">
                                      {newCommentErrors.rating}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-comment-text">
                                    Comment text
                                  </Label>
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
                                  />
                                  {newCommentErrors.text && (
                                    <p className="text-sm text-destructive">
                                      {newCommentErrors.text}
                                    </p>
                                  )}
                                </div>
                                <Button type="submit" variant="eco">
                                  Post comment
                                </Button>
                              </div>
                            </form>
                          </div>
                          {editingCommentId !== null && (
                            <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-emerald-100">
                                    Editing comment #{editingCommentId}
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    Update the text and save to apply the
                                    change.
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
                                    variant="eco"
                                    size="sm"
                                    onClick={saveCommentEdit}
                                  >
                                    Save changes
                                  </Button>
                                </div>
                              </div>
                              <textarea
                                className="mt-4 min-h-[140px] w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                                value={editingCommentText}
                                onChange={(event) =>
                                  setEditingCommentText(event.target.value)
                                }
                              />
                            </div>
                          )}
                          <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                              <tr>
                                <th className="px-4 py-3">Report</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Comment</th>
                                <th className="px-4 py-3">Rating</th>
                                <th className="px-4 py-3 text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {comments.map((comment) => (
                                <tr
                                  key={comment.id}
                                  className="border-b border-slate-800/70"
                                >
                                  <td className="px-4 py-4 text-slate-100">
                                    {comment.report_title}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {comment.user_email || comment.user_name}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {comment.text}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {comment.rating}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex flex-wrap justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditingCommentText(comment.text);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          confirmDeleteRecord(
                                            `${API_BASE}/admin/comments/${comment.id}/`,
                                            `comment ${comment.id}`,
                                          )
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="payments">
                    <div className="mt-6 space-y-6">
                      <Card className="border border-slate-800 bg-slate-950/90 p-6">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-white">
                              Tax Payments
                            </CardTitle>
                            <CardDescription>
                              Approve or remove pending payments.
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {payments.length} items
                            </Badge>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={markAllPaymentsSuccess}
                            >
                              Mark all success
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                              <tr>
                                <th className="px-4 py-3">PID</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((payment) => (
                                <tr
                                  key={payment.id}
                                  className="border-b border-slate-800/70"
                                >
                                  <td className="px-4 py-4 text-slate-100">
                                    {payment.pid}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {payment.user_email}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {payment.amount}
                                  </td>
                                  <td className="px-4 py-4 text-slate-300">
                                    {payment.status}
                                  </td>
                                  <td className="flex justify-end gap-2 px-4 py-4">
                                    {payment.status !== "success" && (
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                          patchRecord(
                                            `${API_BASE}/admin/tax-payments/${payment.id}/`,
                                            { status: "success" },
                                            `payment ${payment.pid}`,
                                          )
                                        }
                                      >
                                        Mark success
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        confirmDeleteRecord(
                                          `${API_BASE}/admin/tax-payments/${payment.id}/`,
                                          `payment ${payment.pid}`,
                                        )
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

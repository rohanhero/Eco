import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { motion } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TextAnimate } from "@/components/ui/text-animate";
import { AuroraText } from "@/components/ui/aurora-text";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AuroraBackground } from "@/components/ui/aurora-background";

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
  >("users");
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "unauthorized" | "error"
  >("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [payments, setPayments] = useState<TaxPayment[]>([]);

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
      // include in-progress slice if backend starts providing it
      ...((stats as any).in_progress_reports
        ? [{ name: "In Progress", value: (stats as any).in_progress_reports }]
        : []),
      { name: "Pending", value: stats.pending_reports },
    ];
  }, [stats]);

  const totalIssues = useMemo(() => {
    return (
      (stats?.resolved_reports || 0) +
      (stats?.pending_reports || 0) +
      ((stats as any)?.in_progress_reports || 0)
    );
  }, [stats]);

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
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <Card className="w-full max-w-lg border border-border/60 bg-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-foreground">Admin Login</CardTitle>
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
            <div className="mt-4 text-center text-sm text-foreground/70">
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
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-white shadow-eco-lg sm:rounded-[2rem]">
          <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1.35fr_0.85fr] lg:p-10">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-white p-5 shadow-eco sm:rounded-[2rem] sm:p-8">
              <AuroraBackground className="opacity-15" />
              {/* Small navbar — premium, logout here */}
              <div className="relative flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 rounded-full bg-white/80 backdrop-blur-xl border border-border/60 shadow-eco">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center shadow-eco">
                    <span className="text-[11px] font-bold text-white">EG</span>
                  </div>
                  <span className="text-sm font-semibold tracking-tight">Eco Guard • Admin</span>
                  <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <Button variant="eco-outline" size="sm" onClick={handleLogout} className="rounded-full shadow-sm gap-1.5">
                  Logout
                </Button>
              </div>
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div>
                  <TextAnimate as="h1" by="word" animation="blurInUp" className="mt-6 text-4xl font-semibold tracking-tight font-display sm:text-5xl justify-start">
                    Admin insights
                  </TextAnimate>
                  <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg">
                    View system health, resolve reports faster and manage users
                    with <AuroraText speed={1.2}>premium analytics</AuroraText> dashboard.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MagicCard className="rounded-[1.75rem] p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-foreground/70">
                      Active admin
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {userInfo?.name ?? "—"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Current session
                    </p>
                    <BorderBeam size={80} duration={6} className="from-transparent via-primary/20 to-transparent" />
                  </MagicCard>
                  <MagicCard className="rounded-[1.75rem] p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-foreground/70">
                      Latest refresh
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Live snapshot</p>
                    <BorderBeam size={80} duration={6} delay={2} className="from-transparent via-emerald-500/20 to-transparent" />
                  </MagicCard>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MagicCard className="rounded-[1.75rem] p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-foreground/70">
                      Reports
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">
                      {stats?.reports !== undefined ? <NumberTicker value={stats.reports} /> : "—"}
                    </p>
                    <BorderBeam size={80} duration={7} className="from-transparent via-sky-500/20 to-transparent" />
                  </MagicCard>
                  <MagicCard className="rounded-[1.75rem] p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-foreground/70">
                      Resolved
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-600">
                      {stats?.resolved_reports !== undefined ? <NumberTicker value={stats.resolved_reports} /> : "—"}
                    </p>
                    <BorderBeam size={80} duration={7} delay={2} className="from-transparent via-emerald-500/20 to-transparent" />
                  </MagicCard>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/60 bg-white p-4 shadow-2xl shadow-eco/20 sm:rounded-[2rem] sm:p-6">
              <div className="grid gap-6">
                <div className="rounded-[1.75rem] border border-border/60 bg-white p-6 text-foreground shadow-inner shadow-eco/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Live summary</h2>
                      <p className="mt-2 text-sm text-foreground/70">
                        Instant overview for the full system.
                      </p>
                    </div>
                    <div className="inline-flex rounded-full bg-muted/80 px-4 py-2 text-sm text-muted-foreground">
                      System
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <MagicCard className="rounded-[1.5rem] p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-foreground/70">
                        Total users
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">
                        {stats?.users !== undefined ? <NumberTicker value={stats.users} /> : "—"}
                      </p>
                      <BorderBeam size={70} duration={7} className="from-transparent via-sky-500/20 to-transparent" />
                    </MagicCard>
                    <MagicCard className="rounded-[1.5rem] p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-foreground/70">
                        Pending Issue
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-amber-600">
                        {stats?.pending_reports !== undefined ? <NumberTicker value={stats.pending_reports} /> : "—"}
                      </p>
                      <BorderBeam size={70} duration={7} delay={1} className="from-transparent via-amber-500/20 to-transparent" />
                    </MagicCard>
                    <MagicCard className="rounded-[1.5rem] p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-foreground/70">
                        Comments
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">
                        {stats?.comments !== undefined ? <NumberTicker value={stats.comments} /> : "—"}
                      </p>
                      <BorderBeam size={70} duration={7} delay={2} className="from-transparent via-violet-500/20 to-transparent" />
                    </MagicCard>
                    <MagicCard className="rounded-[1.5rem] p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-foreground/70">
                        Payments
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">
                        {stats?.tax_payments !== undefined ? <NumberTicker value={stats.tax_payments} /> : "—"}
                      </p>
                      <BorderBeam size={70} duration={7} delay={3} className="from-transparent via-emerald-500/20 to-transparent" />
                    </MagicCard>
                  </div>
                </div>

                <MagicCard className="rounded-[1.75rem] p-6">
                  <h3 className="text-xl font-semibold tracking-tight font-display">
                    Quick actions
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Jump to your most used admin sections — Magic + Vengence.
                  </p>
                  <div className="mt-6 grid gap-3">
                    <ShimmerButton
                      shimmerColor="#10b981"
                      background="linear-gradient(135deg, hsl(155 62% 21%) 0%, hsl(152 48% 32%) 100%)"
                      className="w-full"
                      onClick={() => {
                        setTab("users");
                        tabsAnchorRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      Review users
                    </ShimmerButton>
                    <ShimmerButton
                      shimmerColor="#0ea5e9"
                      background="white"
                      className="w-full border border-primary/15"
                      onClick={() => {
                        setTab("reports");
                        tabsAnchorRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      <span className="text-primary">Review reports</span>
                    </ShimmerButton>
                    <ShimmerButton
                      shimmerColor="#f59e0b"
                      background="white"
                      className="w-full border border-amber-200"
                      onClick={() => {
                        setTab("payments");
                        tabsAnchorRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      <span className="text-amber-600">Review payments</span>
                    </ShimmerButton>
                  </div>
                  <BorderBeam size={90} duration={8} className="from-transparent via-primary/15 to-transparent" />
                </MagicCard>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-white px-4 py-5 sm:px-8 sm:py-8">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="relative overflow-hidden border border-border/60 bg-white p-4 text-foreground sm:p-6 shadow-eco">
                <BorderBeam size={120} duration={8} className="from-transparent via-primary/15 to-transparent" />
                <CardHeader>
                  <CardTitle className="text-xl font-display">Issue trend</CardTitle>
                  <CardDescription>
                    Total users, reports, pending issues and resolved issues.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradCount"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#22C55E"
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="100%"
                            stopColor="#22C55E"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                      <XAxis dataKey="name" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          value,
                          String(name).toUpperCase(),
                        ]}
                        contentStyle={{
                          background: "#0f1724",
                          border: "1px solid #1e293b",
                        }}
                      />
                      <Legend wrapperStyle={{ color: "#94a3b8" }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#22C55E"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: "#fff", strokeWidth: 1.5 }}
                        activeDot={{ r: 6 }}
                        strokeLinecap="round"
                        fill="url(#gradCount)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border border-border/60 bg-white p-4 text-foreground sm:p-6 shadow-eco">
                <BorderBeam size={120} duration={8} delay={2} className="from-transparent via-emerald-500/15 to-transparent" />
                <CardHeader>
                  <CardTitle className="text-xl font-display">Resolved vs pending</CardTitle>
                  <CardDescription>
                    Distribution of solved and pending issues in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{ top: 20, bottom: 20, left: 10, right: 10 }}
                    >
                      <Pie
                        data={issuePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={58}
                        paddingAngle={4}
                        labelLine={false}
                        label={({ name, percent }) => (
                          <text fill="#cbd5e1">{`${name} (${(percent * 100).toFixed(0)}%)`}</text>
                        )}
                      >
                        {issuePieData.map((entry) => {
                          const name = String(entry.name).toLowerCase();
                          const fill =
                            name.includes("solv") || name.includes("resolved")
                              ? "#22C55E"
                              : name.includes("in progress") ||
                                  name.includes("inprogress")
                                ? "#60A5FA"
                                : "#F97316"; // pending/or fallback
                          return <Cell key={entry.name} fill={fill} />;
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${value}`,
                          name,
                        ]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ color: "#94a3b8" }}
                      />
                      {/* center label */}
                      {totalIssues > 0 && (
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#cbd5e1"
                          fontSize={18}
                          fontWeight={700}
                        >
                          {totalIssues}
                        </text>
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t border-border/60 bg-white px-6 py-6 sm:px-8">
            {message && (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                {message}
              </div>
            )}

            {popup && (
              <div
                className={`fixed bottom-4 left-4 right-4 z-50 max-w-sm rounded-3xl border p-4 shadow-2xl transition-all sm:bottom-6 sm:right-6 sm:left-auto ${
                  popup.type === "success"
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-50"
                    : popup.type === "error"
                      ? "border-rose-400 bg-rose-500/10 text-rose-50"
                      : "border-slate-600 bg-white text-foreground"
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
                    className="text-sm text-muted-foreground hover:text-foreground"
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

            <div
              ref={tabsAnchorRef}
              className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-inner shadow-eco/10 sm:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as typeof tab)}
                >
                  <TabsList className="grid w-full grid-cols-2 gap-2 rounded-full bg-white/80 p-1 shadow-inner shadow-eco/20 sm:grid-cols-4 sm:w-auto">
                    {/* <TabsTrigger value="dashboard">Dashboard</TabsTrigger> */}
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                  </TabsList>
                  <TabsContent value="users">
                    <div className="mt-6 space-y-6">
                      <Card className="border border-border/60 bg-white/90 p-4 sm:p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-foreground">
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
                                <Label htmlFor="new-user-name">Name *</Label>
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
                                  onBlur={() => validateUserForm()}
                                  className={newUserErrors.name ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                  aria-invalid={!!newUserErrors.name}
                                />
                                {newUserErrors.name && (
                                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-destructive" /> {newUserErrors.name}
                                  </motion.p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-user-email">Email *</Label>
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
                                  onBlur={() => validateUserForm()}
                                  className={newUserErrors.email ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                  aria-invalid={!!newUserErrors.email}
                                />
                                {newUserErrors.email && (
                                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-destructive" /> {newUserErrors.email}
                                  </motion.p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-user-password">
                                  Password *
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
                                  onBlur={() => validateUserForm()}
                                  className={newUserErrors.password ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                  aria-invalid={!!newUserErrors.password}
                                />
                                {newUserErrors.password && (
                                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-destructive" /> {newUserErrors.password}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                            <div className="grid gap-4 rounded-3xl border border-border/60 bg-white/80 p-4">
                              <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <input
                                    id="new-user-staff"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-border bg-white text-emerald-500 focus:ring-emerald-500"
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
                                    className="h-4 w-4 rounded border-border bg-white text-emerald-500 focus:ring-emerald-500"
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

                          <div className="overflow-hidden rounded-3xl border border-border/60 bg-white/85">
                            <div className="overflow-x-auto">
                              <table className="min-w-[720px] w-full text-left text-sm">
                                <thead className="border-b border-border/60 bg-white/90 text-foreground/70">
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
                                      className="border-b border-border/60/70"
                                    >
                                      <td className="px-4 py-4 text-foreground">
                                        {user.name}
                                      </td>
                                      <td className="px-4 py-4 text-muted-foreground">
                                        {user.email}
                                      </td>
                                      <td className="px-4 py-4 text-muted-foreground">
                                        {user.is_superuser
                                          ? "Superuser"
                                          : user.is_staff
                                            ? "Staff"
                                            : "User"}
                                      </td>
                                      <td className="px-4 py-4 text-muted-foreground">
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
                      <Card className="border border-border/60 bg-white/90 p-4 sm:p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-foreground">
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
                          <div className="rounded-3xl border border-border/60 bg-white/85 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <p className="text-lg font-semibold text-foreground">
                                  Add a new report
                                </p>
                                <p className="text-sm text-foreground/70">
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
                                    className={newReportErrors.title ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                    aria-invalid={!!newReportErrors.title}
                                  />
                                  {newReportErrors.title && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-destructive" /> {newReportErrors.title}
                                    </motion.p>
                                  )}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-report-category">
                                      Category <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                      id="new-report-category"
                                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${newReportErrors.category ? "border-destructive bg-destructive/5 focus-visible:ring-destructive/20" : "border-input bg-background"}`}
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
                                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-destructive" /> {newReportErrors.category}
                                      </motion.p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-report-severity">
                                      Severity <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                      id="new-report-severity"
                                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${newReportErrors.severity ? "border-destructive bg-destructive/5 focus-visible:ring-destructive/20" : "border-input bg-background"}`}
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
                                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-destructive" /> {newReportErrors.severity}
                                      </motion.p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="grid gap-4">
                                <div className="space-y-2">
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
                                    className={newReportErrors.description ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                    aria-invalid={!!newReportErrors.description}
                                  />
                                  {newReportErrors.description && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-destructive" /> {newReportErrors.description}
                                    </motion.p>
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
                            <table className="min-w-[760px] w-full text-left text-sm">
                              <thead className="border-b border-border/60 bg-white/90 text-foreground/70">
                                <tr>
                                  <th className="px-4 py-3">Title</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Severity</th>
                                  <th className="px-4 py-3">Reporter</th>
                                  <th className="px-4 py-3">Location</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3 text-right">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {reports.map((report) => (
                                  <tr
                                    key={report.id}
                                    className="border-b border-border/60/70"
                                  >
                                    <td className="px-4 py-4 text-foreground">
                                      {report.title}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
                                      {report.category}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
                                      {report.severity}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
                                      {report.email}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
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
                                    <td className="px-4 py-4 text-muted-foreground">
                                      {(() => {
                                        const status = (report as any).status
                                          ? String((report as any).status)
                                          : report.resolved
                                            ? "resolved"
                                            : "pending";
                                        return (
                                          status.charAt(0).toUpperCase() +
                                          status.slice(1)
                                        );
                                      })()}
                                    </td>
                                    <td className="flex flex-wrap justify-end gap-2 px-4 py-4">
                                      {/* In-progress button */}
                                      {!(
                                        (report as any).status === "inprogress"
                                      ) &&
                                        !report.resolved && (
                                          <Button
                                            type="button"
                                            variant="eco"
                                            size="sm"
                                            onClick={async () => {
                                              // Optimistically update UI to show in-progress immediately
                                              setReports((prev) =>
                                                prev.map((r) =>
                                                  r.id === report.id
                                                    ? {
                                                        ...r,
                                                        status: "inprogress",
                                                      }
                                                    : r,
                                                ),
                                              );
                                              // Send patch to server (will refresh data on success)
                                              patchRecord(
                                                `${API_BASE}/admin/reports/${report.id}/`,
                                                { status: "inprogress" },
                                                `report ${report.id}`,
                                              );
                                            }}
                                          >
                                            In progress
                                          </Button>
                                        )}

                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
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
                      <Card className="border border-border/60 bg-white/90 p-4 sm:p-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-foreground">
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
                                    Report <span className="text-destructive">*</span>
                                  </Label>
                                  <select
                                    id="new-comment-report"
                                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${newCommentErrors.report ? "border-destructive bg-destructive/5 text-destructive" : "border-slate-200 bg-white text-slate-900"}`}
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
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-destructive" /> {newCommentErrors.report}
                                    </motion.p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new-comment-rating">
                                    Rating <span className="text-destructive">*</span>
                                  </Label>
                                  <select
                                    id="new-comment-rating"
                                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${newCommentErrors.rating ? "border-destructive bg-destructive/5" : "border-input bg-background text-foreground"}`}
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
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-destructive" /> {newCommentErrors.rating}
                                    </motion.p>
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
                                    onBlur={() => validateCommentForm()}
                                    className={newCommentErrors.text ? "border-destructive focus-visible:ring-destructive/20 bg-destructive/5" : ""}
                                    aria-invalid={!!newCommentErrors.text}
                                  />
                                  {newCommentErrors.text && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-destructive flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-destructive" /> {newCommentErrors.text}
                                    </motion.p>
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
                                  <p className="text-sm text-muted-foreground">
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
                                className="mt-4 min-h-[140px] w-full rounded-3xl border border-border/60 bg-white/90 p-4 text-sm text-foreground focus:border-emerald-500 focus:outline-none"
                                value={editingCommentText}
                                onChange={(event) =>
                                  setEditingCommentText(event.target.value)
                                }
                              />
                            </div>
                          )}
                          <table className="min-w-[760px] w-full text-left text-sm">
                            <thead className="border-b border-border/60 bg-white/90 text-foreground/70">
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
                                  className="border-b border-border/60/70"
                                >
                                  <td className="px-4 py-4 text-foreground">
                                    {comment.report_title}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
                                    {comment.user_email || comment.user_name}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
                                    {comment.text}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
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
                      <Card className="border border-border/60 bg-white/90 p-4 sm:p-6">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-xl text-foreground">
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
                          <table className="min-w-[760px] w-full text-left text-sm">
                            <thead className="border-b border-border/60 bg-white/90 text-foreground/70">
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
                                  className="border-b border-border/60/70"
                                >
                                  <td className="px-4 py-4 text-foreground">
                                    {payment.pid}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
                                    {payment.user_email}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
                                    {payment.amount}
                                  </td>
                                  <td className="px-4 py-4 text-muted-foreground">
                                    {payment.status}
                                  </td>
                                  <td className="flex flex-wrap justify-end gap-2 px-4 py-4">
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

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: number | string;
  user?: any;
  title?: string;
  description?: string;
  status?: string;
  created_at?: string;
  owner?: any;
  owner_email?: string;
  user_email?: string;
  email?: string;
  author?: any;
  created_by?: string | number;
};

type User = {
  id?: string | number;
  name?: string;
  email?: string;
};

export default function MyReports() {
  const navigate = useNavigate();
  const { toast } = useToast?.() || { toast: (opts: any) => {} };
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string | number>>(
    new Set()
  );

  // State for modal popup
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const token = localStorage.getItem("access");

  const parseJwt = (t?: string | null) => {
    if (!t) return null;
    try {
      const parts = t.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        decodeURIComponent(
          escape(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
        )
      );
      return payload;
    } catch {
      return null;
    }
  };

  const isPendingStatus = (s: any) => {
    if (s === null || s === undefined) return true;
    const str = String(s).toLowerCase();
    return /(pend|new|submit|open|await|in[_-]?rev|draft)/i.test(str);
  };

  const getReportImage = (r: Report) => {
    if (!r) return null;
    const maybe = (v: any) => (v === undefined || v === null ? null : v);
    const direct =
      maybe((r as any).image) ||
      maybe((r as any).photo) ||
      maybe((r as any).thumbnail);
    if (direct && typeof direct === "string") return direct;

    const arrCandidates = ["images", "photos", "attachments", "files"];
    for (const key of arrCandidates) {
      const val = (r as any)[key];
      if (Array.isArray(val) && val.length) {
        const first = val[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object") {
          return first.url || first.src || first.path || first.file || null;
        }
      }
    }

    const imgObj = (r as any).image;
    if (imgObj && typeof imgObj === "object") {
      return imgObj.url || imgObj.path || imgObj.src || null;
    }
    return null;
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const fetchUserAndReports = async () => {
      setLoading(true);
      setError(null);

      try {
let userData: User | null = null;
try {
  const res = await fetch("http://127.0.0.1:8000/api/user/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (res.ok) {
    const parsed = await res.json().catch(() => null);
    if (parsed) {
      userData = {
        id: parsed.id ?? parsed.pk ?? parsed.user_id ?? parsed.uid,
        email: parsed.email ?? parsed.user_email,
        name: parsed.name ?? parsed.username ?? parsed.full_name,
      };
    }
  }
} catch {}

        if (!userData) {
          const id = localStorage.getItem("user_id");
          const email = localStorage.getItem("user_email");
          const name = localStorage.getItem("user_name");
          if (id || email) {
            userData = {
              id: id ?? undefined,
              email: email ?? undefined,
              name: name ?? undefined,
            };
          }
        }

        if (!userData) {
          const payload = parseJwt(token);
          if (payload) {
            userData = {
              id: payload.user_id ?? payload.id ?? payload.sub ?? undefined,
              email: payload.email ?? payload.user_email ?? undefined,
              name: payload.name ?? payload.username ?? undefined,
            };
          }
        }

        if (!mounted) return;

        if (!userData) {
          setCurrentUser(null);
          setReports([]);
          setError("Unable to determine current user.");
          return;
        }

        setCurrentUser(userData);

        const matchesUser = (r: Report) => {
          const uid = userData?.id != null ? String(userData.id) : null;
          const uemail = userData?.email
            ? String(userData.email).toLowerCase()
            : null;

          if (r.user != null) {
            if (typeof r.user === "number" || typeof r.user === "string") {
              if (uid && String(r.user) === uid) return true;
            } else if (typeof r.user === "object") {
              if (r.user.id != null && uid && String(r.user.id) === uid)
                return true;
              if (
                r.user.email &&
                uemail &&
                String(r.user.email).toLowerCase() === uemail
              )
                return true;
            }
          }

          if (r.created_by != null && uid && String(r.created_by) === uid)
            return true;
          if (r.owner != null) {
            if (typeof r.owner === "number" || typeof r.owner === "string") {
              if (uid && String(r.owner) === uid) return true;
            } else if (typeof r.owner === "object") {
              if (r.owner.id != null && uid && String(r.owner.id) === uid)
                return true;
              if (
                r.owner.email &&
                uemail &&
                String(r.owner.email).toLowerCase() === uemail
              )
                return true;
            }
          }

          const emailCandidates = [
            r.owner_email,
            r.user_email,
            r.email,
            (r.author && typeof r.author === "object" && r.author.email) ||
              null,
          ]
            .filter(Boolean)
            .map((s: string) => String(s).toLowerCase());

          if (uemail && emailCandidates.includes(uemail)) return true;

          return false;
        };

        const res = await fetch("http://127.0.0.1:8000/api/reports/", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json().catch(() => []);
        if (!mounted) return;

        const allUserReports = Array.isArray(json)
          ? json.filter((r: any) => matchesUser(r))
          : [];
        const pendingUserReports = allUserReports.filter((r: any) =>
          isPendingStatus(r.status)
        );

        setReports(pendingUserReports);
      } catch (e) {
        console.error(e);
        setError("Network error or failed to fetch data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserAndReports();

    return () => {
      mounted = false;
    };
  }, [token, navigate]);

  // Open modal on delete click
  const confirmDelete = (report: Report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  // Actually delete report
  const handleDelete = async (id: Report["id"], status?: string) => {
  setModalOpen(false); // close modal
  if (!token) {
    navigate("/login");
    return;
  }

  if (!isPendingStatus(status)) {
    toast?.({
      title: "Cannot delete",
      description: "Only pending reports can be deleted.",
      variant: "destructive",
    });
    return;
  }

  setDeletingIds((s) => {
    const c = new Set(s);
    c.add(id);
    return c;
  });

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/reports/${id}/delete/`, // <-- notice /delete/ here
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (res.ok) {
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
      toast?.({
        title: "Deleted",
        description: "Report deleted successfully.",
        variant: "default",
      });
    } else {
      const txt = await res.text().catch(() => "");
      toast?.({
        title: "Delete failed",
        description: txt || "Could not delete the report.",
        variant: "destructive",
      });
    }
  } catch {
    toast?.({
      title: "Network error",
      description: "Could not delete the report.",
      variant: "destructive",
    });
  } finally {
    setDeletingIds((s) => {
      const c = new Set(s);
      c.delete(id);
      return c;
    });
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            My Reports
          </h1>
          <Button
            onClick={() => navigate(-1)}
            variant="eco-ghost"
            size="sm"
            className="sm:ml-auto"
          >
            Back
          </Button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-20 text-lg font-medium">
            Loading reports…
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-20 text-lg font-medium">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-gray-400 text-center py-20 text-lg font-medium">
            You have no pending reports.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => {
              const imgSrc = getReportImage(r);

              return (
                <article
                  key={r.id}
                  className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={r.title || "report image"}
                        className="object-cover w-full h-full"
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).style.display =
                            "none")
                        }
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">
                        {(r.title && r.title.charAt(0).toUpperCase()) || "U"}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 truncate mb-2">
                        {r.title || "Untitled Report"}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-4">
                        {r.description || "No description"}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString()
                          : ""}
                      </span>

                      <Button
                        variant="eco-outline"
                        size="sm"
                        onClick={() => confirmDelete(r)}
                        disabled={deletingIds.has(r.id)}
                      >
                        {deletingIds.has(r.id) ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-white via-gray-50 to-white rounded-2xl shadow-2xl p-6 w-80 sm:w-96 text-center transform scale-95 animate-scaleIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Delete Report?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedReport.title}</span>?
            </p>
            <div className="flex justify-center gap-6">
              <Button
                variant="destructive"
                className="px-6 py-2 text-lg font-semibold hover:bg-red-600 transition"
                onClick={() =>
                  handleDelete(selectedReport.id, selectedReport.status)
                }
              >
                Yes
              </Button>
              <Button
                variant="eco-ghost"
                className="px-6 py-2 text-lg font-semibold hover:bg-gray-200 transition"
                onClick={() => setModalOpen(false)}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

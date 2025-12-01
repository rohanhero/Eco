import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status?: string;
  image?: string | { url: string };
};

export default function MyReports() {
  const navigate = useNavigate();
  const { toast } = useToast?.() || { toast: (opts: any) => {} };
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const token = localStorage.getItem("access");

  const isPendingStatus = (s?: string) => {
    if (!s) return true;
    return /(pend|new|submit|open|await|in[_-]?rev|draft)/i.test(s);
  };

  const getReportImage = (r: Report) => {
    if (!r || !r.image) return null;
    if (typeof r.image === "string") return r.image;
    if (typeof r.image === "object") return r.image.url || null;
    return null;
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/my/", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch reports");

        const json = await res.json();
        if (!mounted) return;

        const pendingReports = Array.isArray(json)
          ? json.filter((r) => isPendingStatus(r.status))
          : [];

        setReports(pendingReports);
      } catch (e) {
        console.error(e);
        setError("Network error or failed to fetch data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      mounted = false;
    };
  }, [token, navigate]);

  const confirmDelete = (report: Report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const handleDelete = async (id: number, status?: string) => {
    setModalOpen(false);
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

    setDeletingIds((s) => new Set(s).add(id));

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/reports/${id}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
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
          <Button onClick={() => navigate(-1)} variant="eco-ghost" size="sm">
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

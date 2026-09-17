import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import ReportCard, { Report } from "@/components/ReportCard";
import { Button } from "@/components/ui/button";
import { CATEGORY_META } from "./Categories";
import { AuroraBackground } from "@/components/ui/aurora-background";

const normalize = (cat?: string) => (cat || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/_/g, "-");

const CategoryReports = () => {
  const { slug = "all" } = useParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/");
        const payload = await res.json().catch(() => null);
        let data: Report[] = [];
        if (Array.isArray(payload)) data = payload;
        else if (payload?.results) data = payload.results;
        setReports(data);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const meta = slug !== "all" ? CATEGORY_META[slug] : null;

  const filtered = useMemo(() => {
    let out = reports;
    if (slug !== "all") {
      const s = normalize(slug);
      // alias handling: air-quality ↔ environment
      const aliases: Record<string, string[]> = {
        "air-quality": ["air-quality", "air", "environment"],
        environment: ["environment", "air-quality", "air"],
        waste: ["waste"],
        water: ["water"],
        electricity: ["electricity"],
        road: ["road"],
        park: ["park"],
        others: ["others", "other"],
      };
      const keys = aliases[s] || [s];
      out = out.filter((r: any) => {
        const c = normalize(r.category);
        return keys.some((k) => c.includes(k) || k.includes(c));
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) =>
        r.title?.toLowerCase().includes(q) ||
        (r as any).description?.toLowerCase().includes(q) ||
        r.location_address?.toLowerCase().includes(q) ||
        (r as any).category?.toLowerCase().includes(q)
      );
    }
    return out;
  }, [reports, slug, query]);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 bg-white">
        <AuroraBackground className="opacity-25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" /> All categories</Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 text-xs font-semibold tracking-widest uppercase text-primary">
                {slug === "all" ? "All reports" : meta?.label || slug}
              </div>
              <h1 className="font-display text-[28px] sm:text-[36px] font-bold tracking-tighter mt-2">
                {slug === "all" ? "Every report" : meta?.label || "Reports"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{meta?.hint || "Filtered by category — premium, verified feed."} • {filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, location..." className="eco-input w-full pl-9 pr-3 py-2.5 rounded-full text-sm" />
              </div>
              <Link to="/categories"><Button variant="eco-outline" className="rounded-full hidden sm:inline-flex"><SlidersHorizontal className="h-4 w-4 mr-2" />Browse all</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[18px] border border-border/60 shadow-eco p-10 text-center">
            <div className="font-semibold">No reports in this category yet</div>
            <p className="text-sm text-muted-foreground mt-1">Be the first to report — it takes 45 seconds.</p>
            <Link to="/report" className="inline-flex mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold">Report an issue</Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filtered.map((r) => (
              <ReportCard key={r.id} report={r} onViewDetails={() => {}} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryReports;

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Droplets, Zap, Wind, MapPin, Trees, Sparkles, ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { AuroraBackground } from "@/components/ui/aurora-background";

export const CATEGORY_META: Record<string, { label: string; hint: string; icon: any; accent: string }> = {
  waste: { label: "Waste Management", hint: "Bins, dumps & collection", icon: Leaf, accent: "from-emerald-500 to-green-600" },
  water: { label: "Water Issues", hint: "Leaks, supply & drainage", icon: Droplets, accent: "from-sky-500 to-cyan-600" },
  electricity: { label: "Electricity", hint: "Outages, poles & lighting", icon: Zap, accent: "from-amber-500 to-orange-600" },
  road: { label: "Road & Infrastructure", hint: "Potholes, roads & bridges", icon: MapPin, accent: "from-slate-600 to-zinc-700" },
  park: { label: "Park & Recreation", hint: "Parks, playgrounds & greenery", icon: Trees, accent: "from-green-600 to-emerald-700" },
  environment: { label: "Environmental", hint: "Pollution, trees & air", icon: Wind, accent: "from-violet-500 to-purple-600" },
  "air-quality": { label: "Air Quality", hint: "Smoke, dust & air", icon: Wind, accent: "from-violet-500 to-purple-600" },
  others: { label: "Others", hint: "Everything else", icon: Sparkles, accent: "from-zinc-500 to-stone-600" },
};

export const CATEGORY_ORDER = ["waste", "water", "electricity", "road", "park", "environment", "others"];

const Categories = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.06]" />
        <AuroraBackground className="opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border/60 shadow-eco text-xs font-semibold tracking-widest uppercase text-primary">Browse by category</div>
          <h1 className="font-display text-[32px] sm:text-[40px] font-bold tracking-tighter mt-3">All categories</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">Choose a category to see only related reports. Every card is a live feed, just data.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CATEGORY_ORDER.map((slug, i) => {
            const meta = CATEGORY_META[slug];
            const Icon = meta.icon;
            return (
              <motion.div key={slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.5 }}>
                <Link to={`/categories/${slug}`}>
                  <GlowCard className="h-full hover:shadow-eco-lg transition-all hover:-translate-y-1">
                    <div className="p-4 sm:p-6 h-full flex flex-col">
                      <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br ${meta.accent} grid place-items-center shadow-eco mb-3 sm:mb-4`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="text-[13px] sm:text-[16px] font-semibold tracking-tight leading-tight">{meta.label}</div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{meta.hint}</div>
                      <div className="mt-4 sm:mt-5 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-primary">View <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/categories/all" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-eco hover:bg-primary/90">Show all reports <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
};

export default Categories;

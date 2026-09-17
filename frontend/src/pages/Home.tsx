import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReportCard, { Report } from "@/components/ReportCard";
import { MapPin, TrendingUp, Users, Shield, Leaf, Droplets, Zap, Wind, Sparkles, ArrowRight } from "lucide-react";
import heroBackground from "@/assets/background.jpg";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TextAnimate } from "@/components/ui/text-animate";
import { AuroraText } from "@/components/ui/aurora-text";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const stats = [
  { label: "Total Reports", value: 500, icon: MapPin, suffix: "+" },
  { label: "Issues Resolved", value: 200, icon: TrendingUp, suffix: "+" },
  { label: "Active Citizens", value: 3451, icon: Users, suffix: "" },
  { label: "Wards Protected", value: 48, icon: Shield, suffix: "" },
];

const categories = [
  { name: "Waste Management", slug: "waste", icon: Leaf, count: 342, hint: "Bins, dumps, collection", accent: "from-emerald-500 to-green-600" },
  { name: "Water Issues", slug: "water", icon: Droplets, count: 289, hint: "Leaks, supply, drainage", accent: "from-sky-500 to-cyan-600" },
  { name: "Electricity", slug: "electricity", icon: Zap, count: 156, hint: "Outages, poles, lighting", accent: "from-amber-500 to-orange-600" },
  { name: "Air Quality", slug: "air-quality", icon: Wind, count: 98, hint: "Pollution, smoke, dust", accent: "from-violet-500 to-purple-600" },
];

const Home = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem("access");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reports/");
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          setReports([]);
        } else {
          if (Array.isArray(payload)) setReports(payload);
          else if (payload && Array.isArray((payload as any).results)) setReports((payload as any).results);
          else setReports([]);
        }
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewDetails = (id: string) => {
    console.log("View report details:", id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — Vengence Aurora + AnimMaster scroll reveal */}
      <section className="hero-section min-h-[62vh] lg:min-h-[68vh] flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBackground} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        </div>
        <AuroraBackground />
        {/* editorial top badge */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-xs font-medium tracking-wide text-white/90 mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_hsl(142_76%_36%_/_0.9)] animate-pulse" />
            Live civic reports • Hetauda • Real-time
            <Sparkles className="h-3.5 w-3.5 opacity-70" />
          </motion.div>

          <div className="max-w-3xl">
            <TextAnimate
              as="h1"
              by="word"
              animation="blurInUp"
              delay={0.1}
              className="font-display text-[42px] sm:text-[54px] lg:text-[62px] font-bold leading-[0.95] tracking-[-0.03em] text-white"
            >
              Building a Better Community
            </TextAnimate>
            <p className="mt-5 text-[17px] sm:text-[18px] leading-7 text-white/80 max-w-2xl text-balance">
              Report city issues, track their progress, and help build a safer, cleaner community — with <AuroraText className="font-semibold">premium, transparent ledger</AuroraText> for every ward.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link to="/report">
                <ShimmerButton shimmerColor="#ffffff" background="linear-gradient(135deg, hsl(155 62% 21%) 0%, hsl(152 48% 32%) 100%)" className="px-7 h-12 text-[15px] gap-2 shadow-eco">
                  <span className="flex items-center gap-2">Report an Issue <ArrowRight className="h-4 w-4" /></span>
                </ShimmerButton>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-[15px] bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white hover:text-primary">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-8 flex items-center gap-3 text-xs text-white/60"
            >
              <span className="h-px w-8 bg-white/20" /> Trusted by 3,400+ citizens • No spam, no noise
            </motion.div>
          </div>

          {/* glass stat preview — Skiper-style bento hint */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7 }}
            className="hidden lg:flex absolute right-6 bottom-6 gap-3"
          >
            <div className="glass-dark rounded-2xl px-5 py-4 text-white min-w-[180px]">
              <div className="text-[11px] tracking-widest uppercase opacity-70">Resolution rate</div>
              <div className="text-2xl font-bold font-display tracking-tighter">92.4%</div>
              <div className="text-xs opacity-60">Avg. 2.1 days to action</div>
            </div>
            <div className="glass rounded-2xl px-5 py-4 min-w-[170px]">
              <div className="text-[11px] tracking-widest uppercase text-muted-foreground">Active wards</div>
              <div className="text-2xl font-bold font-display tracking-tighter text-foreground">12 / 19</div>
              <div className="text-xs text-muted-foreground">Monitored live</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats — Vengence Stats Counter with scroll trigger */}
      <section className="relative -mt-6 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-[18px] border border-border/60 shadow-eco p-5 sm:p-6 hover:shadow-eco-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/[0.08] border border-primary/10 grid place-items-center mb-4">
                    <Icon className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <div className="text-[28px] font-bold tracking-tighter font-display text-foreground flex items-baseline gap-1">
                    <NumberTicker value={stat.value} className="text-foreground" />{stat.suffix && <span className="text-primary">{stat.suffix}</span>}
                  </div>
                  <div className="text-[12px] font-semibold tracking-widest uppercase text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories — Bento Grid inspired by Vengence Expandable Bento */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-bold tracking-tighter">Explore by category</h2>
              <p className="text-sm text-muted-foreground mt-1">A curated bento of what citizens report most.</p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex text-sm font-medium text-primary hover:underline items-center gap-1">Browse all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat, i) => {
              const Icon = (cat as any).icon;
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <Link to={`/categories/${(cat as any).slug}`} className="block h-full">
                    <div className="relative h-full overflow-hidden rounded-[16px] border border-border/60 bg-card">
                      <MagicCard className="h-full p-5 flex flex-col" gradientColor="hsl(152 45% 32% / 0.12)">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${(cat as any).accent} grid place-items-center shadow-eco mb-4`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-[15px] font-semibold tracking-tight">{cat.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{(cat as any).hint}</div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] tracking-widest uppercase font-semibold text-muted-foreground">{cat.count} reports</span>
                          <span className="h-6 w-6 grid place-items-center rounded-full bg-muted border border-border/60"><ArrowRight className="h-3 w-3" /></span>
                        </div>
                      </MagicCard>
                      <BorderBeam duration={8} size={120} className="from-transparent via-primary/40 to-transparent" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="sm:hidden mt-4 flex justify-center">
            <Link to="/categories" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Browse all categories <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-8 sm:py-10 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-bold tracking-tighter">Recent reports</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest issues reported by our community — verified and triaged.</p>
            </div>
            <Link to={isLoggedIn ? "/profile" : "/login"}>
              <Button variant="eco-outline" className="rounded-full">{isLoggedIn ? "View all reports" : "Log in to view"}</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {loading ? (
              <div className="col-span-2 lg:col-span-3 flex items-center justify-center py-16">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : !isLoggedIn ? (
              <div className="col-span-2 lg:col-span-3 bg-white rounded-[18px] border border-border/60 shadow-eco p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-3"><Shield className="h-6 w-6 text-primary" /></div>
                <div className="font-semibold">Please log in to view community reports</div>
                <p className="text-sm text-muted-foreground mt-1">We keep reports authenticated for quality and accountability.</p>
                <Link to="/login" className="inline-flex mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-eco">Log in to continue</Link>
              </div>
            ) : reports.filter((r) => !(r as any).resolved).length === 0 ? (
              <div className="col-span-2 lg:col-span-3 text-center text-muted-foreground py-10 bg-white rounded-[18px] border border-dashed">No pending reports — be the first to report.</div>
            ) : (
              reports
                .filter((r) => !(r as any).resolved)
                .slice(0, 3)
                .map((report) => (
                  <ReportCard key={report.id} report={report} onViewDetails={handleViewDetails} />
                ))
            )}
          </div>
        </div>
      </section>

      {/* CTA — Magic Card + BorderBeam + Aurora */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-white shadow-eco-lg">
            <MagicCard gradientColor="hsl(152 45% 32% / 0.08)" className="p-0">
              <AuroraBackground className="opacity-40" />
              <div className="relative p-8 sm:p-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/15 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Premium civic experience — Magic UI</div>
                <TextAnimate as="h2" by="word" animation="blurInUp" className="font-display text-[28px] sm:text-[34px] font-bold tracking-tighter mt-4 justify-center">Ready to make a difference?</TextAnimate>
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 max-w-2xl mx-auto text-balance">Together we can create a cleaner, safer and more vibrant city. Your report takes 45 seconds — the impact lasts years.</p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  {!isLoggedIn && (
                    <Link to="/signup"><ShimmerButton className="px-7 h-11">Get Started Now</ShimmerButton></Link>
                  )}
                  <Link to="/report"><Button size="lg" variant="eco-outline" className="rounded-full px-7 h-11">Report your first issue</Button></Link>
                </div>
              </div>
            </MagicCard>
            <BorderBeam duration={10} size={250} className="from-transparent via-primary/30 to-transparent" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

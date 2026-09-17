import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/background.jpg";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { StaggerText } from "@/components/ui/stagger-text";
import { GlowCard } from "@/components/ui/glow-card";

// Contact Card Component
interface ContactCardProps {
  name: string;
  department: string;
  photoUrl?: string;
  className?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  name,
  department,
  photoUrl,
  className = "",
}) => {
  const displayPhoto =
    photoUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full ${className}`}
    >
      <GlowCard className="overflow-hidden">
        <div className="bg-white overflow-hidden">
          <div className="h-28 sm:h-48 bg-gradient-to-br from-primary/10 via-emerald-50 to-cyan-50 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(40% 60% at 50% 30%, hsl(152 45% 32% / 0.18) 0%, transparent 70%)" }} />
            <img src={displayPhoto} alt={name} className="relative h-20 w-20 sm:h-36 sm:w-36 rounded-full object-cover border-[3px] sm:border-[5px] border-white shadow-eco-lg" />
          </div>
          <div className="p-3 sm:p-6">
            <h2 className="font-display text-[13px] sm:text-[18px] font-semibold tracking-tight text-foreground leading-tight line-clamp-1">{name}</h2>
            <p className="text-[10px] sm:text-[13px] tracking-wide uppercase font-semibold text-primary/70 mt-1 line-clamp-1">{department}</p>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section — premium aurora, fit on mobile */}
      <section className="hero-section min-h-[52vh] sm:min-h-[64vh] flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBackground} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/55" />
        </div>
        <AuroraBackground />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-3xl mx-auto px-4 py-10 sm:py-14 w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[11px] sm:text-xs font-medium text-white/85 mb-3 sm:mb-4 max-w-full">Our story • Civic impact</div>
          <StaggerText as="h1" divideBy="word" className="font-display text-[30px] xs:text-[34px] sm:text-[52px] font-bold leading-[0.95] tracking-tighter text-white justify-center flex-wrap max-w-full px-2 sm:px-0">
            EcoGuard
          </StaggerText>
          <div className="mt-2 font-display text-[16px] sm:text-[26px] font-semibold tracking-tight bg-gradient-to-r from-emerald-200 to-green-300 bg-clip-text text-transparent px-2 sm:px-0">Fixing Issues, One Report at a Time</div>
          <p className="text-[13.5px] sm:text-[18px] leading-6 sm:leading-7 text-white/80 mt-4 sm:mt-5 text-balance mx-auto max-w-[32ch] sm:max-w-none px-2 sm:px-0">
            Join our community in tracking and reporting municipal problems. Together, we improve city services and build a cleaner, safer neighborhood.
          </p>
          <div className="mt-6 sm:mt-7">
            <Link to="/report">
              <Button size="lg" variant="eco" className="rounded-full px-6 sm:px-8 h-10 sm:h-12 text-[14px] sm:text-[15px]">Report an Issue</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Our Mission Section */}
      <section className="py-8 sm:py-12 bg-gray-50 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 relative inline-block text-gray-800">
            Our Mission
            <span className="absolute left-0 -bottom-2 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></span>
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left text-sm sm:text-lg text-muted-foreground bg-white shadow-lg rounded-xl p-4 sm:p-6"
          >
            <ol className="list-decimal list-inside space-y-2 sm:space-y-3 break-words">
              <li className="text-left sm:text-justify hover:translate-x-1 transition-transform duration-300">
                Empower communities to actively improve their city by reporting
                local issues and collaborating on solutions.
              </li>
              <li className="text-left sm:text-justify hover:translate-x-1 transition-transform duration-300">
                Track problems and work together to create cleaner, safer, and
                better-maintained neighborhoods.
              </li>
              <li className="text-left sm:text-justify hover:translate-x-1 transition-transform duration-300">
                Make city improvement simple, actionable, and inclusive for all
                residents.
              </li>
              <li className="text-left sm:text-justify hover:translate-x-1 transition-transform duration-300">
                Foster a sense of civic responsibility and encourage community
                engagement in maintaining the city.
              </li>
              <li className="text-left sm:text-justify hover:translate-x-1 transition-transform duration-300">
                Support sustainable practices and initiatives that lead to a
                healthier, more vibrant, and resilient community.
              </li>
            </ol>
          </motion.div>
        </div>
      </section>

      {/* Contact Card Section — 2 per row on mobile, premium */}
      <section className="py-8 sm:py-12 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-gray-800 relative inline-block">
            Our Developers
            <span className="absolute left-1/2 -bottom-4 transform -translate-x-1/2 w-16 sm:w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></span>
          </h2>
          <motion.div
            className="grid grid-cols-2 gap-3 sm:gap-8 max-w-[640px] mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ContactCard
              name="Rohan Bista"
              department="Full Stack"
              photoUrl="rohan.jpg"
            />
            <ContactCard
              name="Aaradhya Gauri Dhakal"
              department="Frontend collaboration"
              photoUrl="hehe"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

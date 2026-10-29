import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBackground from "@/assets/background.jpg";
import {
  Target,
  Eye,
  ClipboardCheck,
  SearchCheck,
  Wrench,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

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
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className={`w-full ${className}`}
    >
      <div className="bg-white rounded-2xl border border-border/70 shadow-eco overflow-hidden hover:shadow-eco-lg transition-shadow">
        <div className="h-24 sm:h-40 bg-secondary flex items-center justify-center">
          <img
            src={displayPhoto}
            alt={name}
            className="h-16 w-16 sm:h-28 sm:w-28 rounded-full object-cover border-[3px] sm:border-[5px] border-white shadow-eco"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="p-3 sm:p-5 text-center">
          <h2 className="font-display text-[14px] sm:text-[17px] font-semibold tracking-tight text-foreground leading-tight">
            {name}
          </h2>
          <p className="text-[10px] sm:text-[12px] tracking-wide uppercase font-semibold text-primary/80 mt-1">
            {department}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const steps = [
  {
    icon: ClipboardCheck,
    title: "Report the issue",
    text: "Pick a category, add a photo and drop a pin on the map.",
  },
  {
    icon: SearchCheck,
    title: "We review & assign",
    text: "The team reviews each report and routes it to the right department.",
  },
  {
    icon: Wrench,
    title: "Track the fix",
    text: "Follow the status from In Progress to Resolved, right in your feed.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Banner — inset */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <section className="relative rounded-2xl overflow-hidden text-white isolate">
        <img src={heroBackground} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064A37]/95 via-[#07583F]/80 to-[#12A66A]/40" />
        <div className="relative p-6 sm:p-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-medium">
              About EcoGuard
            </div>
            <h1 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight mt-3">
              About EcoGuard
            </h1>
            <p className="text-sm sm:text-[15px] text-white/80 mt-2 max-w-xl">
              EcoGuard is a transparent and accountable municipality designed
              and developed by roh4n.com, helping neighbors report, track and
              resolve civic issues across the city.
            </p>
            <Link
              to="/report"
              className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-eco hover:bg-primary/90 transition-colors"
            >
              Report an issue
            </Link>
          </motion.div>
        </div>
      </section>
      </div>

      {/* Mission & Vision */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-border/70 shadow-eco p-6 sm:p-8"
            >
              <div className="h-11 w-11 rounded-xl bg-secondary grid place-items-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mt-5">Our Mission</h2>
              <p className="text-sm sm:text-[15px] leading-6 text-muted-foreground mt-2">
                Empower communities to actively improve their city by creating
                better civic and social relationships, solving residential
                problems, and managing the city together — making improvement
                simple, actionable and inclusive for all residents.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="bg-white rounded-2xl border border-border/70 shadow-eco p-6 sm:p-8"
            >
              <div className="h-11 w-11 rounded-xl bg-secondary grid place-items-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mt-5">Our Vision</h2>
              <p className="text-sm sm:text-[15px] leading-6 text-muted-foreground mt-2">
                A Hetauda where every local problem is seen, tracked and fixed
                together — cleaner, safer and better maintained
                neighborhoods built through engaged citizens, sustainable
                practices and transparent governance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 bg-card border-y border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[26px] sm:text-[32px] font-bold tracking-tight text-center">
            How it works
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Three steps, and the city does the rest.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="relative text-center"
                >
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold grid place-items-center">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-[16px] mt-4">{step.title}</h3>
                  <p className="text-[13px] leading-5 text-muted-foreground mt-1.5 max-w-[26ch] mx-auto">
                    {step.text}
                  </p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+44px)] w-[calc(100%-88px)] border-t border-dashed border-border/80" aria-hidden />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[26px] sm:text-[32px] font-bold tracking-tight text-center">
            Contact Information
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Questions, feedback or a partnership idea? Reach out.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="mailto:hetauda@ecoguard.com"
              className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 flex items-start gap-3 hover:shadow-eco-lg transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                <Mail className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Email</div>
                <div className="text-sm font-semibold mt-0.5 truncate">hetauda@ecoguard.com</div>
              </div>
            </a>
            <a
              href="tel:+9779845000001"
              className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 flex items-start gap-3 hover:shadow-eco-lg transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                <Phone className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Phone</div>
                <div className="text-sm font-semibold mt-0.5">+977 984500001</div>
              </div>
            </a>
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                <MapPin className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Office</div>
                <div className="text-sm font-semibold mt-0.5">Hetauda, Nepal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Developers */}
      <section className="py-12 sm:py-14 bg-card border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Our Developers</h2>
          <motion.div
            className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[560px] mx-auto mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ContactCard name="Rohan Bista" department="Full Stack" photoUrl="rohan.jpg" />
            <ContactCard name="Aaradhya Gauri Dhakal" department="Frontend collaboration" photoUrl="hehe" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 20% 0%, hsl(152 48% 32% / 1) 0%, transparent 55%), radial-gradient(circle at 90% 20%, hsl(145 38% 38% / 1) 0%, transparent 50%)` }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-5 sm:pb-6">
        {/* Mobile premium: 1 col → 2 col grid for links/contact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Logo — spans full width on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="col-span-2 md:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <div className="bg-gradient-primary p-2 rounded-[10px] shadow-eco">
                <img src="/logo.png" alt="Eco Guard Logo" className="h-5 w-5" />
              </div>
              <span className="text-[17px] sm:text-[18px] font-bold tracking-[-0.02em] font-display bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Eco Guard
              </span>
              <span className="inline-flex ml-1 px-2 py-0.5 rounded-full bg-primary/[0.07] border border-primary/10 text-[10px] font-semibold tracking-widest uppercase text-primary">Civic</span>
            </div>
            <p className="text-[13px] sm:text-[14.5px] leading-5 sm:leading-6 text-muted-foreground mb-4 sm:mb-5 max-w-md text-balance">
              Empowering communities through collaborative reporting — no noise, just outcomes.
            </p>
            <div className="flex items-center gap-2">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-full bg-muted/60 border border-border/60 text-muted-foreground hover:text-primary hover:bg-white hover:border-primary/15 hover:shadow-eco active:scale-95 transition-all"
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links — compact 2-col on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="col-span-1"
          >
            <h3 className="text-[11px] sm:text-[12px] font-semibold tracking-widest uppercase text-foreground/70 mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm">
              <li><Link to="/" className="inline-flex py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors">Home</Link></li>
              <li><Link to="/report" className="inline-flex py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors">Report Issue</Link></li>
              <li><Link to="/about" className="inline-flex py-1 text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="inline-flex py-1 text-muted-foreground hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="inline-flex py-1 text-muted-foreground hover:text-primary transition-colors">Terms</Link></li>
            </ul>
          </motion.div>

          {/* Contact — compact */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="col-span-1"
          >
            <h3 className="text-[11px] sm:text-[12px] font-semibold tracking-widest uppercase text-foreground/70 mb-3 sm:mb-4">Contact</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm">
              <li className="flex items-center gap-2 text-muted-foreground"><span className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 grid place-items-center rounded-full bg-muted border border-border/60"><Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span><span className="truncate text-xs sm:text-sm">hetauda@ecoguard.com</span></li>
              <li className="flex items-center gap-2 text-muted-foreground"><span className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 grid place-items-center rounded-full bg-muted border border-border/60"><Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span><span className="text-xs sm:text-sm">+977 984500001</span></li>
              <li className="flex items-start gap-2 text-muted-foreground"><span className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 grid place-items-center rounded-full bg-muted border border-border/60 mt-0.5"><MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span><span className="text-xs sm:text-sm leading-tight">Hetauda, Bagmati Province</span></li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright — stacked centered on mobile, premium */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-t border-border/60 mt-6 sm:mt-6 pt-4 sm:pt-5 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-center sm:text-left"
        >
          <p className="text-[12px] sm:text-[13px] text-muted-foreground">
            © {new Date().getFullYear()} Eco Guard. All rights reserved.
          </p>
          <p className="text-[11px] sm:text-[12px] tracking-wide uppercase font-medium text-muted-foreground/60">Built with precision • just product</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

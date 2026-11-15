import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#064A37] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-primary p-2 rounded-[10px] shadow-eco">
                <img src="/logo.png" alt="Eco Guard Logo" className="h-5 w-5" />
              </div>
              <span className="text-[19px] font-bold tracking-[-0.02em] text-white">
                EcoGuard
              </span>
              <span className="inline-flex ml-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold tracking-widest uppercase text-white/90">
                Civic OS
              </span>
            </div>
            <p className="text-[14px] leading-6 text-white/70 mt-4 max-w-sm">
              Civic platform for Hetauda Sub-Metropolitan City. Working
              together for a cleaner, safer, developed community.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[17px] font-bold tracking-tight">Contact</h3>
            <ul className="mt-4 space-y-3 text-[14px] text-white/80">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-white/60" />
                <a
                  href="mailto:hetauda@ecoguard.com"
                  className="break-all hover:text-white transition-colors"
                >
                  hetauda@ecoguard.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-white/60" />
                <span>+977 984500001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-white/60" />
                <span>Hetauda, Bagmati Province</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[17px] font-bold tracking-tight">Quick Links</h3>
            <nav className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-[14px] text-white/80">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-white/40">•</span>
              <Link to="/report" className="hover:text-white transition-colors">Report Issue</Link>
              <span className="text-white/40">•</span>
              <Link to="/profile" className="hover:text-white transition-colors">Reports</Link>
              <span className="text-white/40">•</span>
              <Link to="/tax-payment" className="hover:text-white transition-colors">Pay Tax</Link>
              <span className="text-white/40">•</span>
              <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            </nav>
            <nav className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-white/60">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span className="text-white/30">•</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span className="text-white/30">•</span>
              <a href="mailto:hetauda@ecoguard.com" className="hover:text-white transition-colors">Help Centre</a>
              <span className="text-white/30">•</span>
              <a href="mailto:hetauda@ecoguard.com" className="hover:text-white transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#0a7a4d]">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 text-center text-[13px] text-white/90">
          © {new Date().getFullYear()} EcoGuard • Hetauda Sub-Metropolitan
          City • All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

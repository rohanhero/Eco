import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ReportIssue from "./pages/ReportIssue";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import About from "./pages/About";
import ReportDetail from "./pages/ReportDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import MyReports from "./pages/MyReports";
import TaxpayerPortal from "./pages/TaxpayerPortal";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const appId = "2ee83f65b808584a80a29c63efa01bd77";
    const kommunicateSettings = {
      appId,
      popupWidget: true,
      automaticChatOpenOnNavigation: true,
    };

    const loadKommunicate = () => {
      if ((window as any).kommunicateLoaded) return;
      (window as any).kommunicate = (window as any).kommunicate || {};
      (window as any).kommunicate._globals = kommunicateSettings;

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://widget.kommunicate.io/v2/kommunicate.app";
      document.head.appendChild(script);
      (window as any).kommunicateLoaded = true;
    };

    const removeKommunicate = () => {
      document
        .querySelectorAll("script[src*='kommunicate.app']")
        .forEach((el) => el.remove());
      document
        .querySelectorAll("[id*='kommunicate'], [class*='kommunicate']")
        .forEach((el) => el.remove());
      delete (window as any).kommunicate;
      (window as any).kommunicateLoaded = false;
    };

    if (!isAdminRoute) {
      loadKommunicate();
    } else {
      removeKommunicate();
    }
  }, [isAdminRoute]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navigation />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/tax-payment" element={<TaxpayerPortal />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />
          {/* <Route path="/verify-email" element={<VerifyEmail />} /> */}
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

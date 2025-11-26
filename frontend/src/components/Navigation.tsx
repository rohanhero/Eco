import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, MapPin, Plus, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const location = useLocation();

  // Profile UI state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // initials: show only first char of name, fallback to first char of email, fallback to "U"
  const initials = (p?: { name: string; email: string } | null) => {
    if (!p) return "U";
    if (p.name && p.name.trim()) {
      return p.name.trim()[0].toUpperCase();
    }
    if (p.email && p.email.trim()) return p.email.trim()[0].toUpperCase();
    return "U";
  };
  // friendly display name inside panel
  const displayName = profile?.name?.trim()
    ? profile!.name
    : profile?.email
    ? profile.email.trim()[0].toUpperCase()
    : "U";

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Report Issue", href: "/report", icon: Plus },
    { name: "About Us", href: "/about", icon: MapPin },
    { name: "Reports", href: "/profile", icon: Folder },
  ];

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("access"));
    // Listen for storage changes (e.g., login/logout in other tabs)
    const handleStorage = () => setLoggedIn(!!localStorage.getItem("access"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [location.pathname, loggedIn]);

  // Fetch profile when logged in (API first, fallback to localStorage)
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("access");
    if (!loggedIn || !token) {
      setProfile(null);
      return;
    }
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json().catch(() => null);
          setProfile({
            name: json?.name || localStorage.getItem("user_name") || "",
            email: json?.email || localStorage.getItem("user_email") || "",
          });
        } else {
          setProfile({
            name: localStorage.getItem("user_name") || "",
            email: localStorage.getItem("user_email") || "",
          });
        }
      } catch {
        if (!mounted) return;
        setProfile({
          name: localStorage.getItem("user_name") || "",
          email: localStorage.getItem("user_email") || "",
        });
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [loggedIn]);

  // Close profile panel on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileOpen) return;
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    // clear cached profile
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    setLoggedIn(false);
    window.location.href = "/";
  };

  // Save profile (PATCH) with basic validation and error display
  const saveProfile = async (updated: { name: string; email: string }) => {
    const token = localStorage.getItem("access");
    setSaving(true);
    setProfileError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!updated.name || !updated.name.trim()) {
      setProfileError("Name cannot be empty.");
      setSaving(false);
      return;
    }
    if (!emailRegex.test(updated.email)) {
      setProfileError("Enter a valid email address.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name: updated.name, email: updated.email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (json) {
          if (json.detail) setProfileError(String(json.detail));
          else {
            const msgs: string[] = [];
            if (json.email)
              msgs.push(
                Array.isArray(json.email)
                  ? json.email.join(", ")
                  : String(json.email)
              );
            if (json.name)
              msgs.push(
                Array.isArray(json.name)
                  ? json.name.join(", ")
                  : String(json.name)
              );
            setProfileError(
              msgs.length ? msgs.join(" • ") : "Failed to save profile"
            );
          }
        } else setProfileError("Failed to save profile");
      } else {
        setProfile(updated);
        localStorage.setItem("user_name", updated.name);
        localStorage.setItem("user_email", updated.email);
        setProfileOpen(false);
      }
    } catch {
      setProfileError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const openProfileModal = () => {
    if (!profileOpen) {
      setProfileOpen(true);
      setIsOpen(false); // always close mobile menu when opening profile
    }
  };

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg group-hover:shadow-glow transition-all duration-300">
              <img src="logo.png" alt="Eco Guard Logo" className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Eco Guard
            </span>
          </Link>

          {/* Desktop Navigation + Auth Buttons */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "eco" : "eco-ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
            {/* Auth Buttons */}
            {/* Hide Sign In and Get Started on /signup if logged in */}
            {!(loggedIn && location.pathname === "/signup") && !loggedIn && (
              <>
                <Link to="/login" className="ml-2">
                  <Button variant="eco-outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="eco" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            {/* Show only Logout if logged in */}
            {loggedIn && (
              <>
                <Button
                  variant="eco-outline"
                  size="sm"
                  className="ml-2"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
                {/* Profile circle - opens modal only */}
                <button
                  onClick={openProfileModal}
                  className="ml-3 h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground shadow-sm hover:shadow-glow transition-all"
                  aria-haspopup="true"
                  aria-label="Open profile"
                >
                  {loadingProfile ? "..." : initials(profile)}
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="eco-ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "eco" : "eco-ghost"}
                    className="w-full justify-start space-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border/50 space-y-2">
              {/* Hide Sign In and Get Started on /signup if logged in */}
              {!(loggedIn && location.pathname === "/signup") && !loggedIn && (
                <>
                  <Link to="/login">
                    <Button
                      variant="eco-outline"
                      className="w-full my-4"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button
                      variant="eco"
                      className="w-full"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              {/* Show only Logout if logged in */}
              {loggedIn && (
                <>
                  <Button
                    variant="eco-outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                  <Button
                    variant="eco-ghost"
                    className="w-full mt-2 flex items-center justify-center space-x-2"
                    onClick={openProfileModal}
                    aria-label="Open Profile"
                  >
                    {/* Avatar with initial */}
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
                      {loadingProfile ? "…" : initials(profile)}
                    </span>
                    <span className="font-medium">
                      {profile?.name?.split(" ")[0] ||
                        profile?.email?.split("@")[0] ||
                        "Profile"}
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal - single modal for desktop & mobile */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setProfileOpen(false)}
          />
          {/* Modal */}
          <div className=" fixed top-10 w-full max-w-sm bg-background rounded-xl shadow-eco-lg border border-border/50 p-6 z-50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                  {initials(profile)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-foreground leading-tight truncate">
                    {profile?.name || profile?.email || "Profile"}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {profile?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0 ml-2"
                aria-label="Close"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ProfileEditor
              profile={profile}
              onSave={saveProfile}
              onCancel={() => setProfileOpen(false)}
              saving={saving}
              error={profileError}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

// At the bottom (outside the Navigation function)
function ProfileEditor({ profile, onSave, onCancel, saving, error }: any) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
    setNameError("");
    setEmailError("");
  }, [profile]);

  const handleNameChange = (value: string) => {
    setName(value);

    const nameRegex = /^[A-Za-z\s]+$/; // Only letters and spaces

    if (!value.trim()) {
      setNameError("Name cannot be empty.");
    } else if (!nameRegex.test(value)) {
      setNameError("Name can only contain letters.");
    } else if (value.trim().length < 5) {
      setNameError("Name must be at least 5 characters long.");
    } else {
      setNameError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[a-za-z][a-za-z0-9]*@[a-za-z0-9]+\.[a-za-z]{2,}$/;
    if (!emailRegex.test(value)) setEmailError("Invalid email address!");
    else setEmailError("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4 space-y-3 border border-border/30">
        <div>
          <Label htmlFor="pname" className="font-medium">
            Name
          </Label>
          <Input
            id="pname"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus
          />
          {nameError && <p className="text-red-600 text-sm">{nameError}</p>}
        </div>
        <div>
          <Label htmlFor="pemail" className="font-medium">
            Email
          </Label>
          <Input
            id="pemail"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
          />
          {emailError && <p className="text-red-600 text-sm">{emailError}</p>}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="eco-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="eco"
            onClick={() => onSave({ name: name.trim(), email: email.trim() })}
            disabled={saving || !!nameError || !!emailError}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // initials: prefer name; otherwise use first char of email
  const initials = (p?: { name: string; email: string } | null) => {
    if (!p) return "U";
    if (p.name && p.name.trim()) {
      const parts = p.name.trim().split(/\s+/);
      return (parts[0][0] || "U").toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "");
    }
    if (p.email && p.email.trim()) return p.email.trim()[0].toUpperCase();
    return "U";
  };
  // friendly display name inside panel
  const displayName = profile?.name?.trim() ? profile!.name : (profile?.email ? profile.email.trim()[0].toUpperCase() : "U");

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Report Issue', href: '/report', icon: Plus },
    { name: 'About Us', href: '/about', icon: MapPin },
    { name: 'Reports', href: '/profile', icon: Folder },
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
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json().catch(() => null);
          setProfile({
            name: json?.name || (localStorage.getItem("user_name") || ""),
            email: json?.email || (localStorage.getItem("user_email") || "")
          });
        } else {
          setProfile({ name: localStorage.getItem("user_name") || "", email: localStorage.getItem("user_email") || "" });
        }
      } catch {
        if (!mounted) return;
        setProfile({ name: localStorage.getItem("user_name") || "", email: localStorage.getItem("user_email") || "" });
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [loggedIn]);

  // Close profile panel on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileOpen) return;
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
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
          Accept: "application/json"
        },
        body: JSON.stringify({ name: updated.name, email: updated.email })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (json) {
          if (json.detail) setProfileError(String(json.detail));
          else {
            const msgs: string[] = [];
            if (json.email) msgs.push(Array.isArray(json.email) ? json.email.join(", ") : String(json.email));
            if (json.name) msgs.push(Array.isArray(json.name) ? json.name.join(", ") : String(json.name));
            setProfileError(msgs.length ? msgs.join(" • ") : "Failed to save profile");
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
                <Button variant="eco-outline" size="sm" className="ml-2" onClick={handleLogout}>
                  Logout
                </Button>
                {/* Profile circle */}
                <div className="relative ml-3" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground shadow-sm"
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    {loadingProfile ? "..." : initials(profile)}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-background border border-border/50 rounded-md shadow-lg p-4 z-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">{initials(profile)}</div>
                          <div>
                            <div className="font-semibold text-sm">{displayName}</div>
                            <div className="text-xs text-muted-foreground">{profile?.email || ""}</div>
                          </div>
                        </div>
                        <button className="text-sm text-muted-foreground" onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}>Close</button>
                      </div>
                      <ProfileEditor profile={profile} onSave={saveProfile} onCancel={() => setProfileOpen(false)} saving={saving} error={profileError} />
                    </div>
                  )}
                </div>
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
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                    <Button variant="eco-outline" className="w-full my-4" onClick={() => setIsOpen(false)}>
                      Sign In 
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="eco" className="w-full" size="sm" onClick={() => setIsOpen(false)}>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              {/* Show only Logout if logged in */}
              {loggedIn && (
                <>
                  <Button variant="eco-outline" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                  <Button variant="eco-ghost" className="w-full mt-2" onClick={() => { setProfileOpen(true); setIsOpen(false); }}>
                    Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

// Small inline editor component to keep main file concise
function ProfileEditor({ profile, onSave, onCancel, saving, error }: any) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  useEffect(() => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
  }, [profile]);
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="pname">Name</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} className="eco-input mt-1" />
      </div>
      <div>
        <Label htmlFor="pemail">Email</Label>
        <Input id="pemail" value={email} onChange={(e) => setEmail(e.target.value)} className="eco-input mt-1" />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="eco-ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="eco" onClick={() => onSave({ name: name.trim(), email: email.trim() })} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
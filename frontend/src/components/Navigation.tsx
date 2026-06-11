import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, MapPin, Plus, Folder, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // or wherever your toast hook is
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const resolveImageUrl = (url?: string | null) => {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `http://127.0.0.1:8000${url}`;
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  // Profile UI state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    image_url?: string;
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
    { name: "Reports", href: "/profile", icon: Folder },
    { name: "Pay Tax", href: "/tax-payment", icon: Users },
    { name: "About Us", href: "/about", icon: MapPin },
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
            image_url: json?.image_url || null,
          });
        } else {
          setProfile({
            name: localStorage.getItem("user_name") || "",
            email: localStorage.getItem("user_email") || "",
            image_url: null,
          });
        }
      } catch {
        if (!mounted) return;
        setProfile({
          name: localStorage.getItem("user_name") || "",
          email: localStorage.getItem("user_email") || "",
          image_url: null,
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
  const saveProfile = async (updated: {
    name: string;
    email: string;
    password?: string;
    image?: File;
  }) => {
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
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("name", updated.name);
      formData.append("email", updated.email);
      if (updated.image) {
        formData.append("image", updated.image);
      }

      // 1️⃣ Update name, email & image
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (json?.detail) setProfileError(String(json.detail));
        else if (json?.email) setProfileError(String(json.email[0]));
        else setProfileError("User is already exists with this email.");
        setSaving(false);
        return;
      }

      // 2️⃣ Update password if provided
      if (updated.password) {
        const passRes = await fetch(
          "http://127.0.0.1:8000/api/change-password/",
          {
            method: "POST",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ new_password: updated.password }),
          },
        );

        if (!passRes.ok) {
          const passJson = await passRes.json().catch(() => null);
          setProfileError(passJson?.detail || "Failed to update password");
          setSaving(false);
          return;
        }
      }

      // 3️⃣ Success: update local profile and close modal
      setProfile({
        name: updated.name,
        email: updated.email,
        image_url: json?.image_url || profile?.image_url,
      });
      localStorage.setItem("user_name", updated.name);
      localStorage.setItem("user_email", updated.email);
      setProfileOpen(false);

      // Success toast
      toast({
        title: "Success!",
        description: "Your profile information has been updated successfully.",
        variant: "default", // or "success" if your toast supports it
      });
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
              <img src="/logo.png" alt="Eco Guard Logo" className="h-6 w-6" />
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
                  className="ml-3 h-9 w-9 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm hover:shadow-glow transition-all"
                  aria-haspopup="true"
                  aria-label="Open profile"
                >
                  {loadingProfile ? (
                    "..."
                  ) : profile?.image_url ? (
                    <img
                      src={resolveImageUrl(profile.image_url) ?? undefined}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full bg-gradient-primary text-primary-foreground font-semibold text-sm">
                      {initials(profile)}
                    </span>
                  )}
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
                    {/* Avatar with image or initial */}
                    {profile?.image_url ? (
                      <img
                        src={resolveImageUrl(profile.image_url) ?? undefined}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">
                        {loadingProfile ? "…" : initials(profile)}
                      </span>
                    )}
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
                <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                  {profile?.image_url ? (
                    <img
                      src={resolveImageUrl(profile.image_url) ?? undefined}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      {initials(profile)}
                    </div>
                  )}
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

//validation impliment
function ProfileEditor({ profile, onSave, onCancel, saving, error }: any) {
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    profile?.image_url || null,
  );
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [imageError, setImageError] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
    setImagePreview(profile?.image_url || null);
  }, [profile]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!value.trim()) setNameError("Name cannot be empty.");
    else if (/[^a-zA-Z\s]/.test(value))
      setNameError("Name cannot contain numbers or special characters.");
    else if (value.trim().length < 5)
      setNameError("Name must be at least 5 characters.");
    else setNameError("");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) setEmailError("Enter a valid email address.");
    else setEmailError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!value) {
      setPasswordError("");
      return;
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(value))
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
      );
    else setPasswordError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB.");
      return;
    }

    setImage(file);
    setImageError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSaveProfile = () => {
    if (
      !nameError &&
      !emailError &&
      !imageError &&
      (!password || !passwordError)
    ) {
      const payload: any = { name: name.trim(), email: email.trim() };
      if (password) payload.password = password;
      if (image) payload.image = image;
      onSave(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
            {imagePreview ? (
              <img
                src={resolveImageUrl(imagePreview) ?? undefined}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {name ? name[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            title="Change profile picture"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          {imagePreview && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title="Remove image"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Click the + button to upload a profile picture
          </p>
        </div>
        {imageError && (
          <p className="text-red-600 text-sm text-center">{imageError}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="pname">Name</Label>
        <Input
          id="pname"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1"
        />
        {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="pemail">Email</Label>
        <Input
          id="pemail"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className="mt-1"
        />
        {emailError && (
          <p className="text-red-600 text-sm mt-1">{emailError}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="ppassword">New Password</Label>
        <Input
          id="ppassword"
          type="password"
          value={password}
          placeholder="Enter new password"
          onChange={(e) => handlePasswordChange(e.target.value)}
          className="mt-1"
        />
        {passwordError && (
          <p className="text-red-600 text-sm mt-1">{passwordError}</p>
        )}
      </div>

      {/* Server error */}
      {error && (
        <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
          {error}
        </p>
      )}

      {/* Buttons: left = Your Reports, right = Cancel / Save */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <Button
            variant="eco-outline"
            onClick={() => {
              try {
                onCancel?.();
              } catch {}
              navigate("/my-reports");
            }}
            disabled={saving}
            title="View your submitted reports"
          >
            Your Reports
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button variant="eco-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="eco" onClick={onSaveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="pt-6 mt-4 border-t border-border/50 text-center">
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogTrigger asChild>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm px-4 py-1.5 rounded-md transition-all duration-300 hover:scale-[1.03]"
              size="sm"
            >
              Delete Account
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md animate-in fade-in zoom-in duration-300">
            {!deleting ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-red-600 font-semibold animate-in slide-in-from-top-2 duration-300">
                    Confirm Account Deletion
                  </DialogTitle>
                  <DialogDescription className="animate-in fade-in duration-500">
                    This action is <strong>permanent</strong>. All your data
                    will be deleted. Are you sure you want to continue?
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-4 animate-in fade-in duration-500">
                  <Button
                    variant="ghost"
                    onClick={() => setOpenDeleteModal(false)}
                    className="transition-all duration-300 hover:scale-[1.05] w-full sm:w-auto"
                  >
                    Cancel
                  </Button>

                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all duration-300 hover:scale-[1.07] w-full sm:w-auto"
                    onClick={async () => {
                      setDeleting(true);

                      const token = localStorage.getItem("access");
                      const res = await fetch(
                        "http://127.0.0.1:8000/api/delete-account/",
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: token ? `Bearer ${token}` : "",
                          },
                        },
                      );

                      if (res.ok) {
                        localStorage.removeItem("access");
                        localStorage.removeItem("refresh");
                        localStorage.removeItem("user_name");
                        localStorage.removeItem("user_email");
                        localStorage.removeItem("user");

                        // Auto-redirect after showing animation
                        setTimeout(() => {
                          window.location.href = "/";
                        }, 1200);
                      } else {
                        setDeleting(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="text-center py-8 animate-in fade-in duration-500">
                {/* Animated Green Check */}
                <div className="flex justify-center mb-3">
                  <div className="bg-green-100 p-4 rounded-full animate-in zoom-in duration-500">
                    <svg
                      className="w-10 h-10 text-green-600 animate-in fade-in duration-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                <h2 className="text-green-600 font-semibold text-lg animate-in fade-in duration-700">
                  Account Deleted
                </h2>

                <p className="text-muted-foreground text-sm mt-1 animate-in fade-in duration-700">
                  Redirecting…
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

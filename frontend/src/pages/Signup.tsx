import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Leaf, Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react";

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);

  // Dialog controls
  const [openSendOtp, setOpenSendOtp] = useState(false);
  const [openVerifyOtp, setOpenVerifyOtp] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/");
    }
  }, [navigate]);

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  // ===== LIVE FIELD VALIDATION =====
  const validateField = (id: string, value: string) => {
    const errors = { ...fieldErrors };

    if (id === "name") {
      if (!value.trim()) {
        errors.name = "Enter your name.";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        errors.name = "You can't add numbers or special characters in name.";
      } else {
        errors.name = "";
      }
    }

    if (id === "email") {
      if (!value.trim()) {
        errors.email = "Enter your email.";
      } else if (!/^[a-za-z][a-za-z0-9]*@gmail\.com$/.test(value)) {
        errors.email = "Enter a valid Email address.";
      } else {
        errors.email = "";
      }
      setEmailVerified(false); // If user edits email again → reset verification
    }

    if (id === "password") {
      if (!value.trim()) {
        errors.password = "Enter your password.";
      } else if (value.length < 8) {
        errors.password = "At least 8 characters required.";
      } else if (!/[A-Z]/.test(value)) {
        errors.password = "Must contain one uppercase letter.";
      } else if (!/\d/.test(value)) {
        errors.password = "Must contain one number.";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        errors.password = "Must contain one special character.";
      } else {
        errors.password = "";
      }
    }

    if (id === "confirmPassword") {
      if (value !== formData.password) {
        errors.confirmPassword = "Passwords do not match.";
      } else {
        errors.confirmPassword = "";
      }
    }

    setFieldErrors(errors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (id === "password") checkPasswordStrength(value);
    validateField(id, value);
  };

  // Checks form validity excluding email verification status
  const isFormValidWithoutEmailVerification = () => {
    return (
      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword &&
      termsAccepted &&
      formData.name &&
      formData.email &&
      formData.password &&
      formData.confirmPassword
    );
  };

  const validateForm = () => {
    // full validation including email verification
    return isFormValidWithoutEmailVerification() && emailVerified;
  };

  // ========== SEND OTP ==========
  const handleSendOtp = async () => {
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/send-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to send OTP.");
        return;
      }

      setOpenSendOtp(false);
      setOpenVerifyOtp(true);
    } catch {
      setError("Network error.");
    }
  };

  // ========== VERIFY OTP ==========
  const handleVerifyOtp = async () => {
    setOtpError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.detail || "Invalid OTP.");
        return;
      }

      setEmailVerified(true);
      setOpenVerifyOtp(false);
      setOtp("");
    } catch {
      setOtpError("Network error.");
    }
  };

  // ========== SIGNUP SUBMIT ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // basic validation (fields + terms)
    if (!isFormValidWithoutEmailVerification()) {
      setError("Please fix errors before submitting.");
      return;
    }

    // If email isn't verified yet, open the OTP flow first
    if (!emailVerified) {
      setOpenSendOtp(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "User with this email already exists.");
      } else {
        navigate("/login");
      }
    } catch {
      setError("Network error.");
    }

    setIsLoading(false);
  };

  const strengthCriteria = [
    { key: "hasMinLength", label: "At least 8 characters" },
    { key: "hasUpperCase", label: "One uppercase letter" },
    { key: "hasNumber", label: "One number" },
    { key: "hasSpecialChar", label: "One special character" },
  ];

  // ----- OTP helpers for 6-box UI -----
  const handleOtpChange = (index: number, value: string) => {
    // allow only digits
    const digit = value.replace(/\D/g, "");
    const otpArr = otp.split("");
    // ensure length 6
    for (let i = 0; i < 6; i++) {
      if (!otpArr[i]) otpArr[i] = "";
    }

    otpArr[index] = digit ? digit[0] : "";
    const newOtp = otpArr.join("").slice(0, 6);
    setOtp(newOtp);

    // focus next if digit entered
    if (digit) {
      const next = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement | null;
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      const otpArr = otp.split("");
      // if current box empty, move back
      if (!otpArr[index] && index > 0) {
        const prev = document.getElementById(
          `otp-${index - 1}`,
        ) as HTMLInputElement | null;
        if (prev) {
          prev.focus();
          // also clear previous box
          const newOtpArr = otpArr.slice();
          newOtpArr[index - 1] = "";
          setOtp(newOtpArr.join(""));
        }
      } else {
        // clear current box
        const otpArr2 = otp.split("");
        otpArr2[index] = "";
        setOtp(otpArr2.join(""));
      }
    }

    // allow arrow navigation
    if (e.key === "ArrowLeft" && index > 0) {
      const prev = document.getElementById(
        `otp-${index - 1}`,
      ) as HTMLInputElement | null;
      if (prev) prev.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      const next = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement | null;
      if (next) next.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (!paste) return;
    const digits = paste.slice(0, 6).split("");
    const otpArr = ["", "", "", "", "", ""];
    for (let i = 0; i < digits.length; i++) {
      otpArr[i] = digits[i];
      const el = document.getElementById(`otp-${i}`) as HTMLInputElement | null;
      if (el) el.value = digits[i];
    }
    setOtp(otpArr.join(""));
    // focus next empty or last
    const nextIndex = Math.min(digits.length, 5);
    const nextEl = document.getElementById(
      `otp-${nextIndex}`,
    ) as HTMLInputElement | null;
    if (nextEl) nextEl.focus();
  };

  return (
    <>
      {/* ===================== OTP DIALOG — SEND OTP ====================== */}
      <Dialog open={openSendOtp} onOpenChange={setOpenSendOtp}>
        <DialogContent className="max-w-sm p-6 rounded-xl shadow-lg bg-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              We will send a (OTP) to <strong>{formData.email}</strong>. Enter
              the OTP to verify your email.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="w-1/2 mr-2"
              onClick={() => setOpenSendOtp(false)}
            >
              Cancel
            </Button>
            <Button className="w-1/2 ml-2" onClick={handleSendOtp}>
              Send OTP
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================= VERIFY OTP POPUP (REPLACED) ======================= */}
      <Dialog open={openVerifyOtp} onOpenChange={setOpenVerifyOtp}>
        <DialogContent className="max-w-sm p-6 rounded-xl shadow-lg bg-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Enter OTP
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Enter the 6-digit OTP sent to <strong>{formData.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Modern 6 Box OTP UI */}
          <div className="mt-4">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center border border-gray-300 rounded-md text-lg font-semibold
                    focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-red-600 text-sm mt-2 text-center">
                {otpError}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="w-1/2 mr-2"
              onClick={() => setOpenVerifyOtp(false)}
            >
              Cancel
            </Button>
            <Button className="w-1/2 ml-2" onClick={handleVerifyOtp}>
              Verify OTP
            </Button>
          </div>

          {/* Resend */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Didn’t receive OTP?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={handleSendOtp}
            >
              Resend
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== ORIGINAL SIGNUP PAGE ===================== */}
      <div
        className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: "url('login2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 w-full max-w-md">
          <Card className="eco-card shadow-eco-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
                  <img
                    src="logo.png"
                    alt="Eco Guard Logo"
                    className="h-7 w-7"
                  />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Join Eco Guard
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Start reporting, start improving – sign up now
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="eco-input pl-10"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-red-500 text-xs">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="eco-input pl-10 pr-20"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />

                    {/* Verify Button */}
                    {/* Verify Button – only show when email is valid */}
                    {!emailVerified &&
                      !fieldErrors.email &&
                      formData.email.trim() !== "" && (
                        <button
                          type="button"
                          onClick={() => setOpenSendOtp(true)}
                          className="absolute right-3 top-2 text-xs bg-primary text-white px-2 py-1 rounded-md hover:bg-primary-glow"
                        >
                          Verify
                        </button>
                      )}

                    {emailVerified && (
                      <span className="absolute right-3 top-3 text-green-600 text-xs font-semibold">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="eco-input pl-10 pr-10"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs">
                      {fieldErrors.password}
                    </p>
                  )}

                  <div className="space-y-2">
                    {strengthCriteria.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <Check
                          className={`h-3 w-3 ${
                            passwordStrength[
                              key as keyof typeof passwordStrength
                            ]
                              ? "text-green-600"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength[
                              key as keyof typeof passwordStrength
                            ]
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="eco-input pl-10 pr-10"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms & Privacy */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 rounded border-border mt-1"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    aria-label="Accept terms and privacy"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-primary hover:text-primary-glow"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:text-primary-glow"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="eco"
                  className="w-full"
                  disabled={isLoading || !emailVerified || !termsAccepted}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary-glow font-medium transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-white/80">
            <p className="text-sm">
              🔎 Spot an issue? Report it and be part of the change.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;

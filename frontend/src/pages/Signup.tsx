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
import { Leaf, Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    // Name
    if (id === "name") {
      if (!value.trim()) {
        errors.name = "Enter your name.";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        errors.name = "You can't add numbers or special characters in name.";
      } else {
        errors.name = "";
      }
    }

    // EMAIL VALIDATION (Same as Signup)
    if (id === "email") {
      if (!value.trim()) {
        errors.email = "Enter your email.";
      } else if (!/^[a-za-z][a-za-z0-9]*@gmail\.com$/.test(value)) {
        errors.email = "Enter a valid Email address.";
      } else {
        errors.email = "";
      }
    }

    // Password
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

    // Confirm Password
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
    if (id === "password") {
      checkPasswordStrength(value);
    }
    validateField(id, value);
  };

  const validateForm = () => {
    return (
      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword &&
      formData.name &&
      formData.email &&
      formData.password &&
      formData.confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      setError("Please fix errors before submitting.");
      setIsLoading(false);
      return;
    }

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
        setError(data.detail || "Signup failed.");
      } else {
        navigate("/login");
      }
    } catch (err) {
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

  return (
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
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
                <img src="logo.png" alt="Eco Guard Logo" className="h-7 w-7" />
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
                    className="eco-input pl-10"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
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
                  <p className="text-red-500 text-xs">{fieldErrors.password}</p>
                )}

                {/* Password Strength Indicator */}
                <div className="space-y-2">
                  {strengthCriteria.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center space-x-2 text-xs"
                    >
                      <Check
                        className={`h-3 w-3 ${
                          passwordStrength[key as keyof typeof passwordStrength]
                            ? "text-green-600"
                            : "text-gray-300"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength[key as keyof typeof passwordStrength]
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  className="rounded border-border mt-1"
                  required
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

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="eco"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
            </div>

            {/* Sign In Link */}
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

        {/* Environmental Message */}
        <div className="text-center mt-6 text-white/80">
          <p className="text-sm">
            🔎 Spot an issue? Report it and be part of the change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

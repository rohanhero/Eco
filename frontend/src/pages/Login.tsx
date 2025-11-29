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
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // localStorage.setItem("user", JSON.stringify(response.data.user));

      const data = await response.json();

      if (!response.ok) {
        if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setError("Login failed. Please check your credentials.");
        }
      } else {
        // Store tokens
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        // Store user info from response
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("user_name", data.user.name || "");
          localStorage.setItem("user_email", data.user.email || "");
        }

        // Redirect to home
        navigate("/");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('login.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30"></div>

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
              Welcome Back to Eco Guard
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to start improving our city
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange(e);

                      // Live validation
                      const emailRegex =
                        /^[a-za-z][a-za-z0-9]*@[a-za-z0-9]+\.[a-za-z]{2,}$/;
                      if (!emailRegex.test(value)) {
                        setEmailError(
                          "Enter a valid Email address."
                        );
                      } else {
                        setEmailError(""); // Clear error if valid
                      }
                    }}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
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
                    placeholder="Enter your password"
                    className="eco-input pl-10 pr-10"
                    required
                    value={formData.password}
                    onChange={handleChange}
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
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  Forgot password?
                </Link>
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
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Message */}
        <div className="text-center mt-6 text-white/80">
          <p className="text-sm">
            🔰 Join our mission to improve the city, one report at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

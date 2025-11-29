import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa"; // Only the lock icon remains

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, and a number."
      );
    } else {
      setPasswordError("");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = localStorage.getItem("reset_email");
    const otp = localStorage.getItem("reset_otp");

    if (!email || !otp) {
      setError("Missing OTP or Email");
      return;
    }

    if (passwordError) {
      setError("Please fix password errors before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/reset-password/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, new_password: newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to reset password");
      } else {
        setMsg("Password reset successfully!");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      {/* City skyline background */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#4ade80"
            fillOpacity="0.29"
            d="M0,160L48,160C96,160,192,160,288,170.7C384,181,480,203,576,213.3C672,224,768,224,864,224C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <Card className="relative w-full max-w-md shadow-xl rounded-2xl border border-gray-200 overflow-hidden bg-white z-10">
        <CardHeader className="flex items-center justify-center bg-green-100 py-6 relative">
          {/* Logo instead of leaf icon */}
          <div className="absolute left-6">
            <img
              src="/favicon.ico" // Make sure favicon.ico is in public folder
              alt="Eco Guard Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          <p className="text-gray-700 text-sm text-center">
            Set a strong password to secure your Eco Guard account.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1 relative">
              <label className="text-gray-800 font-medium">New Password</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter new password"
                  required
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 transition duration-200 rounded-md pl-10"
                />
                <FaLock className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm">{passwordError}</p>
              )}
            </div>

            {error && <p className="text-red-600 font-medium">{error}</p>}
            {msg && <p className="text-green-600 font-medium">{msg}</p>}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg shadow-md transition transform hover:scale-105"
              disabled={loading || !!passwordError}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

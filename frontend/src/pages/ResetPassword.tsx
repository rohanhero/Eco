import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);

    // Password validation regex
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label>New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              {passwordError && (
                <p className="text-red-600 text-sm">{passwordError}</p>
              )}
            </div>

            {error && <p className="text-red-600">{error}</p>}
            {msg && <p className="text-green-600">{msg}</p>}

            <Button
              type="submit"
              className="w-full"
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

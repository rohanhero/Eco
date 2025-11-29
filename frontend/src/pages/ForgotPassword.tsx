import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/send-reset-otp/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
      } else {
        localStorage.setItem("reset_email", email);
        setMessage("OTP sent successfully!");
        setTimeout(() => navigate("/verify-otp"), 800);
      }
    } catch {
      setError("Network error. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden p-4">
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

      <Card className="relative w-full max-w-md shadow-xl rounded-2xl border border-gray-200 overflow-hidden bg-white z-10 animate-fadeIn">
        <CardHeader className="flex items-center justify-center bg-green-100 py-6 relative">
          {/* Logo */}
          <div className="absolute left-6">
            <img
              src="/favicon.ico"
              alt="Eco Guard Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Forgot Password
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1 relative">
              <label className="text-gray-800 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 transition duration-200 rounded-md"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg shadow-md transition transform hover:scale-105"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fade-in animation */}
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default ForgotPassword;

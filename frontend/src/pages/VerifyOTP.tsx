import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(
    "OTP has been sent to your email."
  );
  const [timeLeft, setTimeLeft] = useState(60); // 1 minutes in seconds
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError("OTP expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    localStorage.setItem("reset_otp", otp);
    navigate("/reset-password");
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
            Verify OTP
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {msg && (
            <p className="text-green-600 text-sm text-center animate-fadeIn">
              {msg}
            </p>
          )}
          {timeLeft > 0 && (
            <p className="text-gray-600 text-sm text-center">
              OTP expires in:{" "}
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </p>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1">
              <label className="text-gray-800 font-medium">OTP</label>
              <Input
                type="text"
                maxLength={6}
                placeholder="6-digit OTP"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 transition duration-200 rounded-md text-center tracking-widest text-lg"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg shadow-md transition transform hover:scale-105"
            >
              Verify OTP
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Simple fade-in animation */}
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

export default VerifyOTP;

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const VerifyOTP = () => {
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(
    "OTP has been sent to your email."
  );
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer
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

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Handle individual OTP box change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number, value: string) => {
    if (value === "") {
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    const finalOtp = otpValues.join("");

    if (finalOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    localStorage.setItem("reset_otp", finalOtp);
    navigate("/reset-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden p-4">
      {/* Green background wave */}
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

          {/* NEW OTP BOXES */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      handleBackspace(index, digit);
                    }
                  }}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-green-400 transition tracking-widest"
                />
              ))}
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg shadow-md transition transform hover:scale-105"
            >
              Verify OTP
            </Button>
          </form>
        </CardContent>
      </Card>

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

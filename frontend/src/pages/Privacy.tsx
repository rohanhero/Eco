import { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

const Privacy = () => {
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeUp");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    sectionsRef.current.forEach((section) => observer.observe(section));
  }, []);

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden py-16 px-4">
      {/* City skyline background */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full object-cover opacity-40"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#4ade80"
            fillOpacity="0.4"
            d="M0,160L48,160C96,160,192,160,288,170.7C384,181,480,203,576,213.3C672,224,768,224,864,224C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Card className="shadow-xl rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <CardHeader className="text-center bg-green-100 py-8 relative">
            <div className="flex justify-center mb-3">
              <Lock className="h-12 w-12 text-green-700 animate-bounce" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-green-800">
              Privacy Policy
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 text-gray-700 leading-relaxed px-6 py-8">
            <div
              ref={addToRefs}
              className="opacity-0 translate-y-6 transition-all duration-700"
            >
              <p className="text-lg">
                Your privacy matters to us. This policy explains how EcoGuard
                collects, uses, and protects your personal information.
              </p>
            </div>

            <div
              ref={addToRefs}
              className="opacity-0 translate-y-6 transition-all duration-700"
            >
              <h3 className="text-2xl font-semibold text-green-700 mb-2">
                1. Information We Collect
              </h3>
              <p className="text-gray-600">
                We collect basic user information such as name, email, and
                reported issue data to improve service quality and track
                reports.
              </p>
            </div>

            <div
              ref={addToRefs}
              className="opacity-0 translate-y-6 transition-all duration-700"
            >
              <h3 className="text-2xl font-semibold text-green-700 mb-2">
                2. How Your Data is Used
              </h3>
              <p className="text-gray-600">
                Your information is used only for platform functionality:
                reporting issues, showing updates, and enhancing service
                reliability. We do not sell or misuse your data.
              </p>
            </div>

            <div
              ref={addToRefs}
              className="opacity-0 translate-y-6 transition-all duration-700"
            >
              <h3 className="text-2xl font-semibold text-green-700 mb-2">
                3. Data Protection
              </h3>
              <p className="text-gray-600">
                EcoGuard uses secure protocols and encrypted connections to
                protect your data from unauthorized access or misuse.
              </p>
            </div>

            <div
              ref={addToRefs}
              className="opacity-0 translate-y-6 transition-all duration-700"
            >
              <p className="text-lg font-medium">
                By using our platform, you consent to the collection and use of
                information as described in this privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animations */}
      <style>
        {`
          .animate-bounce {
            animation: bounce 1.5s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }

          .animate-fadeUp {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Privacy;

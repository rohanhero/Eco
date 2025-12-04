import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero text-white">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-4">Oops! This page doesn't exist</p>
        <p className="text-lg text-gray-200 mb-8">
          The environmental issue you're looking for might have been resolved or
          moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-primary text-primary-foreground font-medium rounded-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

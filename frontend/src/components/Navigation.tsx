import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, Home, MapPin, Plus, User } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Report Issue', href: '/report', icon: Plus },
    { name: 'About Us', href: '/about', icon: MapPin },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("access"));
    // Listen for storage changes (e.g., login/logout in other tabs)
    const handleStorage = () => setLoggedIn(!!localStorage.getItem("access"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [location.pathname, loggedIn]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg group-hover:shadow-glow transition-all duration-300">
              <img src="logo.png" alt="Eco Guard Logo" className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Eco Guard
            </span>
          </Link>

          {/* Desktop Navigation + Auth Buttons */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "eco" : "eco-ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
            {/* Auth Buttons */}
            {/* Hide Sign In and Get Started on /signup if logged in */}
            {!(loggedIn && location.pathname === "/signup") && !loggedIn && (
              <>
                <Link to="/login" className="ml-2">
                  <Button variant="eco-outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="eco" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            {/* Show only Logout if logged in */}
            {loggedIn && (
              <Button variant="eco-outline" size="sm" className="ml-2" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="eco-ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "eco" : "eco-ghost"}
                    className="w-full justify-start space-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border/50 space-y-2">
              {/* Hide Sign In and Get Started on /signup if logged in */}
              {!(loggedIn && location.pathname === "/signup") && !loggedIn && (
                <>
                  <Link to="/login">
                    <Button variant="eco-outline" className="w-full my-4" onClick={() => setIsOpen(false)}>
                      Sign In 
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="eco" className="w-full" size="sm" onClick={() => setIsOpen(false)}>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              {/* Show only Logout if logged in */}
              {loggedIn && (
                <Button variant="eco-outline" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
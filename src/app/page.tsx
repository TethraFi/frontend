"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Header visibility state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Supported chains animation state
  const [isChainsVisible, setIsChainsVisible] = useState(false);
  const chainsRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      title: "Real-Time Charts",
      description:
        "Live market data with advanced technical indicators and trading tools",
      image: "/images/DEX.png",
    },
    {
      title: "Tap to Position",
      description: "Tap to trade to open position when the line crosses it",
      image: "/images/TapPosition.png",
    },
    {
      title: "One Tap to Profit",
      description:
        "Instantly profit with a single tap when the price line crosses your position",
      image: "/images/TapProfit.png",
    },
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle header visibility based on user activity
  useEffect(() => {
    const resetInactivityTimer = () => {
      // Show header
      setIsHeaderVisible(true);

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Only hide header if user has scrolled past hero section (more than 100px)
      if (window.scrollY > 100) {
        // Set new timer to hide header after 2 seconds of inactivity
        inactivityTimerRef.current = setTimeout(() => {
          setIsHeaderVisible(false);
        }, 2000);
      }
    };

    // Add event listeners for user activity
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("mousedown", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);
    window.addEventListener("touchstart", resetInactivityTimer);

    // Initialize timer
    resetInactivityTimer();

    return () => {
      // Cleanup
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("mousedown", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("scroll", resetInactivityTimer);
      window.removeEventListener("touchstart", resetInactivityTimer);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? "#06b6d4" : "#10b981",
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - distance / 150) * 0.1;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Carousel auto-transition with progress
  useEffect(() => {
    if (isCarouselPaused) return;

    setCarouselProgress(0);

    // Progress bar animation (100 steps in 3 seconds)
    const progressInterval = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 30);

    // Change slide after 3 seconds
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [currentSlide, slides.length, isCarouselPaused]);

  // Chains animation on scroll
  useEffect(() => {
    const handleChainsScroll = () => {
      if (!chainsRef.current) return;

      const rect = chainsRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Show chains when section is visible (60% threshold)
      // Hide chains when scrolled past the section
      if (rect.top <= windowHeight * 0.6 && rect.bottom >= windowHeight * 0.4) {
        setIsChainsVisible(true);
      } else {
        setIsChainsVisible(false);
      }
    };

    window.addEventListener("scroll", handleChainsScroll);
    handleChainsScroll(); // Check on mount

    return () => window.removeEventListener("scroll", handleChainsScroll);
  }, []);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setCarouselProgress(0);
  };

  return (
    <div className="w-full bg-black text-white overflow-hidden">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full z-30 flex justify-center transition-all duration-700 p-8 md:px-12 ${
          isHeaderVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <nav
          className={`flex items-center justify-between transition-all duration-700 ${
            scrollY > 50
              ? "bg-black/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-2xl px-6 py-3 max-w-5xl w-full"
              : "bg-transparent border-transparent w-full px-0 py-0"
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Tethra Finance Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-semibold text-xl">Tethra Finance</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-gray-300">
            <Link
              href="#features"
              className="hover:text-white transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#chains"
              className="hover:text-white transition-colors duration-200"
            >
              Chains
            </Link>
            <Link
              href="#smart-contracts"
              className="hover:text-white transition-colors duration-200"
            >
              Smart Contract
            </Link>
          </div>

          <Link
            href="/trade"
            className="font-semibold text-white py-2 px-6 rounded-lg
                       bg-gradient-to-r from-cyan-500 to-emerald-500
                       hover:from-cyan-600 hover:to-emerald-600
                       transition-all duration-300 ease-in-out
                       hover:shadow-lg hover:shadow-cyan-500/30"
          >
            Launch App
          </Link>
        </nav>
      </header>

      {/* Hero Section with Layered Text */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Animated Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0"
          style={{ opacity: 0.6 }}
        />

        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10"
            style={{
              animation: "gradientShift 15s ease infinite",
            }}
          />
          <div
            className="absolute w-full h-full bg-gradient-to-tl from-emerald-500/10 via-transparent to-cyan-500/10"
            style={{
              animation: "gradientShift 20s ease infinite reverse",
            }}
          />
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
              animation: "gridMove 20s linear infinite",
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl"
            style={{
              top: "10%",
              left: "10%",
              animation: "float 20s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"
            style={{
              bottom: "10%",
              right: "10%",
              animation: "float 25s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute w-64 h-64 rounded-full bg-cyan-500/10 blur-2xl"
            style={{
              top: "50%",
              right: "20%",
              animation: "float 30s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl"
            style={{
              top: "30%",
              left: "60%",
              animation: "float 35s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-2xl"
            style={{
              bottom: "30%",
              left: "30%",
              animation: "float 28s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-12 h-12 border border-cyan-500/20 rotate-45"
            style={{
              top: "20%",
              left: "15%",
              animation: "floatSlow 40s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-16 h-16 border border-emerald-500/20 rounded-full"
            style={{
              top: "70%",
              right: "25%",
              animation: "floatSlow 45s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute w-10 h-10 border border-cyan-500/30"
            style={{
              top: "40%",
              right: "15%",
              animation:
                "rotate 60s linear infinite, floatSlow 35s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-8 h-8 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rotate-12"
            style={{
              bottom: "40%",
              left: "20%",
              animation: "floatSlow 50s ease-in-out infinite",
            }}
          />
        </div>

        {/* Background Decorative Elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {/* Left Side Decorative Lines */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-screen">
            {/* Vertical Lines - Much Longer - Animated */}
            <div
              className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent animate-pulse"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute left-12 top-0 w-0.5 h-5/6 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "4s" }}
            ></div>
            <div
              className="absolute left-24 top-0 w-0.5 h-3/4 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "5s" }}
            ></div>
            <div
              className="absolute left-36 top-0 w-0.5 h-2/3 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse"
              style={{ animationDuration: "6s" }}
            ></div>

            {/* Horizontal Lines - Much Longer */}
            <div
              className="absolute left-0 top-1/2 w-96 h-0.5 bg-gradient-to-r from-cyan-500/40 to-transparent animate-pulse"
              style={{ animationDuration: "4s" }}
            ></div>
            <div
              className="absolute left-0 top-1/3 w-72 h-0.5 bg-gradient-to-r from-cyan-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "5s" }}
            ></div>
            <div
              className="absolute left-0 top-2/3 w-72 h-0.5 bg-gradient-to-r from-cyan-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "6s" }}
            ></div>
            <div
              className="absolute left-0 top-1/4 w-56 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "7s" }}
            ></div>
            <div
              className="absolute left-0 top-3/4 w-56 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "8s" }}
            ></div>

            {/* Corner Accent */}
            <div className="absolute left-0 top-1/2 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50 animate-pulse"></div>
          </div>

          {/* Right Side Decorative Lines */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-screen">
            {/* Vertical Lines - Much Longer - Animated */}
            <div
              className="absolute right-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent animate-pulse"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute right-12 top-0 w-0.5 h-5/6 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "4s" }}
            ></div>
            <div
              className="absolute right-24 top-0 w-0.5 h-3/4 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "5s" }}
            ></div>
            <div
              className="absolute right-36 top-0 w-0.5 h-2/3 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse"
              style={{ animationDuration: "6s" }}
            ></div>

            {/* Horizontal Lines - Much Longer */}
            <div
              className="absolute right-0 top-1/2 w-96 h-0.5 bg-gradient-to-l from-emerald-500/40 to-transparent animate-pulse"
              style={{ animationDuration: "4s" }}
            ></div>
            <div
              className="absolute right-0 top-1/3 w-72 h-0.5 bg-gradient-to-l from-emerald-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "5s" }}
            ></div>
            <div
              className="absolute right-0 top-2/3 w-72 h-0.5 bg-gradient-to-l from-emerald-500/30 to-transparent animate-pulse"
              style={{ animationDuration: "6s" }}
            ></div>
            <div
              className="absolute right-0 top-1/4 w-56 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "7s" }}
            ></div>
            <div
              className="absolute right-0 top-3/4 w-56 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent animate-pulse"
              style={{ animationDuration: "8s" }}
            ></div>

            {/* Corner Accent */}
            <div className="absolute right-0 top-1/2 w-4 h-4 border-r-2 border-t-2 border-emerald-500/50 animate-pulse"></div>
          </div>

          {/* Subtle Corner Dots - Top Left */}
          <div className="absolute top-32 left-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/20"></div>
          </div>

          {/* Subtle Corner Dots - Top Right */}
          <div className="absolute top-32 right-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
          </div>

          {/* Subtle Corner Dots - Bottom Left */}
          <div className="absolute bottom-32 left-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/20"></div>
          </div>

          {/* Subtle Corner Dots - Bottom Right */}
          <div className="absolute bottom-32 right-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
          </div>

          {/* Diagonal Lines - Top Left to Center */}
          <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent rotate-45 origin-left"></div>

          {/* Diagonal Lines - Top Right to Center */}
          <div className="absolute top-1/4 right-1/4 w-32 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent -rotate-45 origin-right"></div>

          {/* Subtle Glow Spots */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>

          {/* Additional Decorative Elements */}

          {/* Grid Pattern Subtle */}
          <div className="absolute top-0 left-1/4 w-64 h-64 border border-cyan-500/10 rounded-lg rotate-12"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 border border-emerald-500/10 rounded-lg -rotate-12"></div>

          {/* Floating Circles - Top */}
          <div className="absolute top-24 left-1/3 w-2 h-2 rounded-full border border-cyan-500/30"></div>
          <div className="absolute top-32 left-1/3 translate-x-12 w-3 h-3 rounded-full border border-cyan-500/20"></div>
          <div className="absolute top-28 left-1/3 translate-x-24 w-1.5 h-1.5 rounded-full bg-cyan-500/20"></div>

          {/* Floating Circles - Bottom */}
          <div className="absolute bottom-24 right-1/3 w-2 h-2 rounded-full border border-emerald-500/30"></div>
          <div className="absolute bottom-32 right-1/3 -translate-x-12 w-3 h-3 rounded-full border border-emerald-500/20"></div>
          <div className="absolute bottom-28 right-1/3 -translate-x-24 w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>

          {/* Cross Pattern - Left */}
          <div className="absolute top-1/3 left-48">
            <div className="w-8 h-0.5 bg-cyan-500/20 absolute top-0 left-0"></div>
            <div className="w-0.5 h-8 bg-cyan-500/20 absolute top-0 left-0 translate-x-3.5"></div>
          </div>

          {/* Cross Pattern - Right */}
          <div className="absolute top-2/3 right-48">
            <div className="w-8 h-0.5 bg-emerald-500/20 absolute top-0 left-0"></div>
            <div className="w-0.5 h-8 bg-emerald-500/20 absolute top-0 left-0 translate-x-3.5"></div>
          </div>

          {/* Hexagon Outlines */}
          <div className="absolute top-1/4 right-1/3 w-16 h-16 border border-emerald-500/15 rotate-45"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-cyan-500/15 rotate-45"></div>

          {/* Small Dots Scattered */}
          <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-cyan-500/30 rounded-full"></div>
          <div className="absolute top-2/3 left-2/3 w-1 h-1 bg-emerald-500/30 rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-500/20 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-emerald-500/20 rounded-full"></div>

          {/* Connecting Lines - Decorative */}
          <div className="absolute top-1/3 left-1/2 w-24 h-0.5 bg-gradient-to-r from-cyan-500/10 to-transparent rotate-12"></div>
          <div className="absolute bottom-1/3 right-1/2 w-24 h-0.5 bg-gradient-to-l from-emerald-500/10 to-transparent -rotate-12"></div>

          {/* Triangle Outlines */}
          <div className="absolute top-1/4 left-2/3 w-12 h-12 border-t border-l border-cyan-500/15 rotate-45"></div>
          <div className="absolute bottom-1/4 right-2/3 w-12 h-12 border-b border-r border-emerald-500/15 rotate-45"></div>
        </div>

        {/* TAP Text - Background Layer (Cyan - matching left logo) with Parallax */}
        <div
          className={`absolute top-12 left-0 pointer-events-none select-none pl-2 md:pl-5 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
          }`}
          style={{
            zIndex: 1,
            transform: `translateY(${scrollY * 0.3}px) translateX(${
              isLoaded ? 0 : "-5rem"
            })`,
            transitionDelay: "200ms",
          }}
        >
          <h2
            className="text-[12rem] md:text-[16rem] 2xl:text-[20rem] 3xl:text-[24rem] font-black leading-none text-[#06b6d4] opacity-70 hover:opacity-100 transition-opacity duration-500 [transform:scaleY(1.8)_scaleX(0.7)] md:[transform:scaleY(1.4)_scaleX(0.7)]"
            style={{
              fontFamily: "Arial Black, Impact, sans-serif",
              letterSpacing: "-0.05em",
              fontStretch: "ultra-condensed",
              transformOrigin: "top left",
              textShadow: "0 0 40px rgba(6, 182, 212, 0.3)",
            }}
          >
            TAP
          </h2>
        </div>

        {/* TRADE Text - Background Layer (Emerald - matching right logo) with Parallax */}
        <div
          className={`absolute -bottom-4 right-0 pointer-events-none select-none pr-2 md:pr-5 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
          }`}
          style={{
            zIndex: 1,
            transform: `translateY(${-scrollY * 0.3}px) translateX(${
              isLoaded ? 0 : "5rem"
            })`,
            transitionDelay: "300ms",
          }}
        >
          <h2
            className="text-[12rem] md:text-[16rem] lg:text-[20rem] 2xl:text-[23rem] 3xl:text-[26rem] font-black leading-none text-[#10b981] opacity-70 hover:opacity-100 transition-opacity duration-500 [transform:scaleY(2)_scaleX(0.7)] md:[transform:scaleY(1.4)_scaleX(0.7)]"
            style={{
              fontFamily: "Arial Black, Impact, sans-serif",
              letterSpacing: "-0.05em",
              fontStretch: "ultra-condensed",
              transformOrigin: "bottom right",
              textShadow: "0 0 40px rgba(16, 185, 129, 0.3)",
            }}
          >
            TRADE
          </h2>
        </div>

        {/* Center Content - Front Layer */}
        <div
          className={`relative z-10 flex items-center justify-center min-h-screen lg:-translate-x-48 md:translate-x-0 translate-x-10 translate-y-5 transition-all duration-1000 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{
            transform: `translate(-3rem, ${scrollY * -0.1}px) scale(${
              isLoaded ? 1 : 0.75
            })`,
            transitionDelay: "100ms",
          }}
        >
          {/* Logo with dramatic effects */}
          <div className="relative group">
            {/* Animated Ring Around Logo */}
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-500/30 scale-125"
              style={{
                animation: "rotate 20s linear infinite",
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-150"
              style={{
                animation: "rotate 30s linear infinite reverse",
              }}
            />

            {/* Outer Glow - Only on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/40 group-hover:to-emerald-500/40 blur-3xl transition-all duration-500 scale-150"></div>

            {/* Pulsing Background */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 blur-2xl"
              style={{
                animation: "pulse 4s ease-in-out infinite",
              }}
            />

            {/* Logo */}
            <Image
              src="/images/logo.png"
              alt="Tethra Finance"
              width={350}
              height={350}
              className="relative drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:drop-shadow-[0_0_80px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-700 cursor-pointer md:scale-120 2xl:scale-150"
              priority
              style={{
                filter:
                  "drop-shadow(0 0 30px rgba(6,182,212,0.3)) drop-shadow(0 0 50px rgba(16,185,129,0.2))",
              }}
            />
          </div>
        </div>

        {/* Description Text - Bottom Left */}
        <div
          className={`hidden lg:block absolute bottom-16 left-16 max-w-2xl z-10 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          }`}
          style={{
            transform: `translateY(${scrollY * -0.2}px) translateX(${
              isLoaded ? 0 : "-2.5rem"
            })`,
            transitionDelay: "400ms",
          }}
        >
          <div className="relative group">
            {/* Background blur box */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent backdrop-blur-sm rounded-lg group-hover:from-black/80 transition-all duration-300"></div>

            {/* Animated border */}
            <div className="absolute inset-0 rounded-lg">
              <div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-emerald-500/50 to-cyan-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  padding: "2px",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            </div>

            {/* Text content */}
            <div className="relative p-8 border-l-4 border-cyan-500/50 group-hover:border-cyan-500 transition-all duration-300">
              <p className="text-base md:text-lg text-white leading-relaxed">
                Oracle-based perpetual trading protocol with tap-to-trade
                interface - making leveraged trading as intuitive as tapping a
                chart, powered by Pyth Network oracle and Account Abstraction.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gray-400 text-sm font-medium">
            Scroll to explore
          </span>
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Platform Preview Section with Carousel */}
      <section
        id="features"
        className="relative z-20 bg-black pb-20 mt-30 px-4"
      >
        <div className="container mx-auto max-w-7xl">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Professional Trading Interface
            </h2>
            <p className="text-xl text-gray-400">
              Experience institutional-grade trading tools in a decentralized
              environment
            </p>
          </div>

          {/* Carousel Container */}
          <div
            className="relative md:top-20 top-10 space-y-5"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Text Content Below Image */}
            <div className="text-center max-h-xl md:-translate-y-5">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 transition-all duration-500">
                {slides[currentSlide].title}
              </h3>
              <p className="text-base md:text-lg text-gray-400 transition-all duration-500">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Slides */}
            <div className="relative h-[60vw] overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? "opacity-100 translate-x-0 scale-100"
                      : "opacity-0 translate-x-20 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="relative group">
                    {/* Animated glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Screenshot */}
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 group-hover:border-cyan-500/60 group-hover:shadow-cyan-500/40 transition-all duration-500 group-hover:scale-[1.02]">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        width={1920}
                        height={1080}
                        className="w-full h-auto"
                        priority={index === 0}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                      {/* Interactive corner highlights */}
                      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/0 group-hover:border-cyan-500/50 transition-all duration-500"></div>
                      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-emerald-500/0 group-hover:border-emerald-500/50 transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Carousel Indicators - Dots */}
              <div className="absolute bottom-1/15 xl:bottom-[22vh] 2xl:bottom-[45vh] flex place-self-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlideChange(index)}
                    className={`relative overflow-hidden transition-all duration-500 ease-in-out rounded-full ${
                      index === currentSlide
                        ? "w-12 h-3"
                        : "w-3 h-3 bg-gray-600 hover:bg-gray-400 hover:scale-110"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {index === currentSlide ? (
                      <>
                        {/* Background */}
                        <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                        {/* Progress bar */}
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-100 shadow-lg shadow-cyan-500/50"
                          style={{ width: `${carouselProgress}%` }}
                        ></div>
                      </>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature highlights below screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-60 md:mt-40 xl:-mt-15">
            <div className="group/card p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/50 hover:from-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div className="text-cyan-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative">
                Real-Time Charts
              </h3>
              <p className="text-gray-400 relative">
                Live market data with advanced technical indicators and trading
                tools
              </p>
            </div>

            <div className="group/card p-6 rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 hover:from-emerald-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div className="text-emerald-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative">
                One-Click Trading
              </h3>
              <p className="text-gray-400 relative">
                Execute trades instantly with our streamlined tap-to-trade
                interface
              </p>
            </div>

            <div className="group/card p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/50 hover:from-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div className="text-cyan-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative">
                Grid Management
              </h3>
              <p className="text-gray-400 relative">
                Manage multiple positions simultaneously with visual grid
                trading
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Chains Section */}
      <section
        ref={chainsRef}
        id="supported-chains"
        className="relative py-32 px-4 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

        {/* Tech Stack Half Circles - At screen edges */}
        {/* Left Half Circle - Frontend (facing right) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-700 ease-out hidden lg:block"
          style={{
            left: "-250px",
            opacity: isChainsVisible ? 1 : 0,
            transform: `translateY(-50%) translateX(${
              isChainsVisible ? "0" : "-100px"
            })`,
          }}
        >
          <div className="relative w-[500px] h-[500px]">
            {/* Half Circle Border - Right half visible */}
            <div
              className="absolute inset-0 rounded-full border-4 border-emerald-500/30"
              style={{
                clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
              }}
            ></div>

            {/* Tethra Logo - Right half visible */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{
                clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
              }}
            >
              <div className="relative bg-black rounded-full p-6 border-2 border-emerald-500/50">
                <Image
                  src="/images/logo.png"
                  alt="Tethra Finance"
                  width={100}
                  height={100}
                  className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                />
              </div>
            </div>

            {/* Frontend Tech Icons - Static positions */}
            {/* Next.js - Top */}
            <div className="absolute left-1/2 top-[10%] translate-x-[20%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-emerald-500/40 hover:border-emerald-500 hover:scale-110 transition-all cursor-pointer">
                  <Image
                    src="/images/nextjs.png"
                    alt="Next.js"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                  Next.js
                </span>
              </div>
            </div>

            {/* React - Right Middle */}
            <div className="absolute right-[15%] top-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-emerald-500/40 hover:border-emerald-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#61DAFB">
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M12,10.11C13.03,10.11 13.87,10.95 13.87,12C13.87,13 13.03,13.85 12,13.85C10.97,13.85 10.13,13 10.13,12C10.13,10.95 10.97,10.11 12,10.11M7.37,20C8,20.38 9.38,19.8 10.97,18.3C10.45,17.71 9.94,17.07 9.46,16.4C8.64,16.32 7.83,16.2 7.06,16.04C6.55,18.18 6.74,19.65 7.37,20M8.08,14.26L7.79,13.75C7.68,14.04 7.57,14.33 7.5,14.61C7.77,14.67 8.07,14.72 8.38,14.77C8.28,14.6 8.18,14.43 8.08,14.26M14.62,13.5L15.43,12L14.62,10.5C14.32,9.97 14,9.5 13.71,9.03C13.17,9 12.6,9 12,9C11.4,9 10.83,9 10.29,9.03C10,9.5 9.68,9.97 9.38,10.5L8.57,12L9.38,13.5C9.68,14.03 10,14.5 10.29,14.97C10.83,15 11.4,15 12,15C12.6,15 13.17,15 13.71,14.97C14,14.5 14.32,14.03 14.62,13.5M12,6.78C11.81,7 11.61,7.23 11.41,7.5C11.61,7.5 11.8,7.5 12,7.5C12.2,7.5 12.39,7.5 12.59,7.5C12.39,7.23 12.19,7 12,6.78M12,17.22C12.19,17 12.39,16.77 12.59,16.5C12.39,16.5 12.2,16.5 12,16.5C11.8,16.5 11.61,16.5 11.41,16.5C11.61,16.77 11.81,17 12,17.22M16.62,4C16,3.62 14.62,4.2 13.03,5.7C13.55,6.29 14.06,6.93 14.54,7.6C15.36,7.68 16.17,7.8 16.94,7.96C17.45,5.82 17.26,4.35 16.62,4M15.92,9.74L16.21,10.25C16.32,9.96 16.43,9.67 16.5,9.39C16.23,9.33 15.93,9.28 15.62,9.23C15.72,9.4 15.82,9.57 15.92,9.74M17.37,2.69C18.84,3.53 19,5.74 18.38,8.32C20.92,9.07 22.75,10.31 22.75,12C22.75,13.69 20.92,14.93 18.38,15.68C19,18.26 18.84,20.47 17.37,21.31C15.91,22.15 13.92,21.19 12,19.36C10.08,21.19 8.09,22.15 6.62,21.31C5.16,20.47 5,18.26 5.62,15.68C3.08,14.93 1.25,13.69 1.25,12C1.25,10.31 3.08,9.07 5.62,8.32C5,5.74 5.16,3.53 6.62,2.69C8.09,1.85 10.08,2.81 12,4.64C13.92,2.81 15.91,1.85 17.37,2.69M17.08,12C17.42,12.75 17.72,13.5 17.97,14.26C20.07,13.63 21.25,12.73 21.25,12C21.25,11.27 20.07,10.37 17.97,9.74C17.72,10.5 17.42,11.25 17.08,12M6.92,12C6.58,11.25 6.28,10.5 6.03,9.74C3.93,10.37 2.75,11.27 2.75,12C2.75,12.73 3.93,13.63 6.03,14.26C6.28,13.5 6.58,12.75 6.92,12M15.92,14.26C15.82,14.43 15.72,14.6 15.62,14.77C15.93,14.72 16.23,14.67 16.5,14.61C16.43,14.33 16.32,14.04 16.21,13.75L15.92,14.26M13.03,18.3C14.62,19.8 16,20.38 16.62,20C17.26,19.65 17.45,18.18 16.94,16.04C16.17,16.2 15.36,16.32 14.54,16.4C14.06,17.07 13.55,17.71 13.03,18.3M8.08,9.74C8.18,9.57 8.28,9.4 8.38,9.23C8.07,9.28 7.77,9.33 7.5,9.39C7.57,9.67 7.68,9.96 7.79,10.25L8.08,9.74M10.97,5.7C9.38,4.2 8,3.62 7.37,4C6.74,4.35 6.55,5.82 7.06,7.96C7.83,7.8 8.64,7.68 9.46,7.6C9.94,6.93 10.45,6.29 10.97,5.7Z"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                  React
                </span>
              </div>
            </div>

            {/* Tailwind - Bottom */}
            <div className="absolute left-1/2 bottom-[10%] translate-x-[20%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-emerald-500/40 hover:border-emerald-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#06B6D4">
                    <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"></path>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                  Tailwind
                </span>
              </div>
            </div>

            {/* Frontend Label */}
            <div className="absolute left-1/2 -bottom-16 translate-x-[20%]">
              <h3 className="text-2xl md:text-3xl font-bold text-emerald-400">
                Frontend
              </h3>
            </div>
          </div>
        </div>

        {/* Right Half Circle - Blockchain (facing left) */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-700 ease-out hidden lg:block"
          style={{
            right: "-250px",
            opacity: isChainsVisible ? 1 : 0,
            transform: `translateY(-50%) translateX(${
              isChainsVisible ? "0" : "100px"
            })`,
          }}
        >
          <div className="relative w-[500px] h-[500px]">
            {/* Half Circle Border - Left half visible */}
            <div
              className="absolute inset-0 rounded-full border-4 border-cyan-500/30"
              style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
            ></div>

            {/* Tethra Logo - Left half visible */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
            >
              <div className="relative bg-black rounded-full p-6 border-2 border-cyan-500/50">
                <Image
                  src="/images/logo.png"
                  alt="Tethra Finance"
                  width={100}
                  height={100}
                  className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                />
              </div>
            </div>

            {/* Blockchain Tech Icons - Static positions */}
            {/* Base - Top */}
            <div className="absolute left-1/2 top-[10%] -translate-x-[120%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/40 hover:border-cyan-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 111 111" className="w-10 h-10" fill="none">
                    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
                    <path
                      d="M54.9219 85.8281C71.9719 85.8281 85.8438 71.9563 85.8438 54.9063C85.8438 37.8563 71.9719 23.9844 54.9219 23.9844C39.0469 23.9844 25.9844 35.8688 24.2344 51.3688H65.1594V58.4438H24.2344C25.9844 73.9438 39.0469 85.8281 54.9219 85.8281Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  Base
                </span>
              </div>
            </div>

            {/* Flow - Left Middle Top */}
            <div className="absolute left-[22%] top-[38%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/40 hover:border-cyan-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 225 225" className="w-10 h-10" fill="none">
                    <circle cx="112.5" cy="112.5" r="112.5" fill="#00EF8B" />
                    <path
                      d="M112.5 45C140.938 45 164.062 68.125 164.062 96.5625V128.438C164.062 156.875 140.938 180 112.5 180C84.0625 180 60.9375 156.875 60.9375 128.438V96.5625C60.9375 68.125 84.0625 45 112.5 45Z"
                      fill="white"
                    />
                    <path
                      d="M112.5 60C132.594 60 148.75 76.1562 148.75 96.25V128.75C148.75 148.844 132.594 165 112.5 165C92.4062 165 76.25 148.844 76.25 128.75V96.25C76.25 76.1562 92.4062 60 112.5 60Z"
                      fill="#16FF99"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  Flow
                </span>
              </div>
            </div>

            {/* Foundry - Left Top */}
            <div className="absolute left-[15%] top-[25%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/40 hover:border-cyan-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 32 32" className="w-9 h-9" fill="white">
                    <path d="M16 0l-4 7.2L16 10l4-2.8L16 0zm0 12l-8 5.6L16 22l8-4.4L16 12zm-8 9.6L16 26l8-4.4L16 32l-8-10.4z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  Foundry
                </span>
              </div>
            </div>

            {/* Ethers.js - Left Bottom */}
            <div className="absolute left-[15%] bottom-[25%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/40 hover:border-cyan-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 293 163" className="w-10 h-10" fill="none">
                    <path
                      d="M146.5 0L73 81.5L146.5 122L220 81.5L146.5 0Z"
                      fill="#627EEA"
                    />
                    <path
                      d="M146.5 163L73 103L146.5 81.5L220 103L146.5 163Z"
                      fill="#627EEA"
                      opacity="0.6"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  ethers.js
                </span>
              </div>
            </div>

            {/* Privy - Bottom */}
            <div className="absolute left-1/2 bottom-[10%] -translate-x-[120%] pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 aspect-square rounded-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/40 hover:border-cyan-500 hover:scale-110 transition-all cursor-pointer">
                  <svg viewBox="0 0 120 120" className="w-9 h-9">
                    <circle cx="60" cy="60" r="60" fill="black" />
                    <circle cx="60" cy="40" r="15" fill="white" />
                    <circle cx="40" cy="70" r="15" fill="white" />
                    <circle cx="80" cy="70" r="15" fill="white" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  Privy
                </span>
              </div>
            </div>

            {/* Blockchain Label */}
            <div className="absolute left-1/2 -bottom-16 -translate-x-[120%]">
              <h3 className="text-2xl md:text-3xl font-bold text-cyan-400">
                Blockchain
              </h3>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10" id="chains">
          {/* Section Title */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Supported Chains
            </h2>
            <p className="text-xl text-gray-400">
              Trade seamlessly across multiple blockchain networks
            </p>
          </div>

          {/* Chains Grid */}
          <div className="relative">
            {/* Center Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="relative group cursor-pointer focus:outline-none"
                aria-label="Back to top"
              >
                {/* Animated Ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-cyan-500/30 scale-125"
                  style={{
                    animation: "rotate 15s linear infinite",
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-150"
                  style={{
                    animation: "rotate 20s linear infinite reverse",
                  }}
                />

                {/* Glow Effect - Default */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-2xl scale-150 opacity-100 group-hover:opacity-0 transition-opacity duration-500"></div>

                {/* Glow Effect - Hover (Gradient Circle) */}
                <div className="absolute inset-0 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #06b6d4, #10b981, #06b6d4, #10b981, #06b6d4)",
                      animation: "rotate 3s linear infinite",
                    }}
                  ></div>
                </div>

                {/* Tethra Logo */}
                <div className="relative bg-black rounded-full p-6 border-2 border-cyan-500/50 group-hover:border-cyan-500 group-hover:scale-110 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]">
                  <Image
                    src="/images/logo.png"
                    alt="Tethra Finance"
                    width={120}
                    height={120}
                    className="w-32 h-32 md:w-44 md:h-44 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] group-hover:drop-shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-500"
                  />
                </div>
              </button>
            </div>

            {/* Chain Logos in Circle - With Rotation Animation */}
            <div
              className="relative w-full max-w-2xl mx-auto aspect-square"
              style={{
                animation: isChainsVisible
                  ? "rotateChains 60s linear infinite"
                  : "none",
              }}
            >
              {[
                {
                  name: "Bitcoin",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
                  position: 0,
                },
                {
                  name: "Ethereum",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
                  position: 1,
                },
                {
                  name: "Solana",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
                  position: 2,
                },
                {
                  name: "Avalanche",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png",
                  position: 3,
                },
                {
                  name: "NEAR",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png",
                  position: 4,
                },
                {
                  name: "BNB",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
                  position: 5,
                },
                {
                  name: "Ripple",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png",
                  position: 6,
                },
                {
                  name: "Arbitrum",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
                  position: 7,
                },
                {
                  name: "Polygon",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
                  position: 8,
                },
                {
                  name: "Dogecoin",
                  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png",
                  position: 9,
                },
              ].map((chain, index) => {
                const totalChains = 10;
                const angle = (chain.position * 360) / totalChains - 90; // -90 to start from top
                const radius = 45; // percentage
                const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

                return (
                  <div
                    key={chain.name}
                    className={`absolute group/chain cursor-pointer transition-all duration-1000 ease-out ${
                      isChainsVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      left: isChainsVisible ? `${x}%` : "50%",
                      top: isChainsVisible ? `${y}%` : "50%",
                      transform: "translate(-50%, -50%)",
                      transitionDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Connection Line to Center */}
                    <div
                      className="absolute w-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover/chain:opacity-100 transition-opacity duration-300"
                      style={{
                        height: `${radius * 2}%`,
                        transformOrigin: "top center",
                        transform: `rotate(${angle + 90}deg)`,
                        top: "50%",
                        left: "50%",
                      }}
                    />

                    {/* Chain Logo Container */}
                    <div
                      className="relative"
                      style={{
                        animation: isChainsVisible
                          ? "rotateChains 60s linear infinite reverse"
                          : "none",
                      }}
                    >
                      {/* Glow on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-emerald-500/0 group-hover/chain:from-cyan-500/30 group-hover/chain:to-emerald-500/30 rounded-full blur-xl scale-150 transition-all duration-300"></div>

                      {/* Logo */}
                      <div className="relative bg-gray-900 rounded-full p-3 md:p-4 border border-gray-700 group-hover/chain:border-cyan-500/50 group-hover/chain:scale-110 transition-all duration-300">
                        <img
                          src={chain.logo}
                          alt={chain.name}
                          className="max-w-8 max-h-8 md:max-w-12 md:max-h-12"
                        />
                      </div>

                      {/* Chain Name */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/chain:opacity-100 transition-opacity duration-300">
                        <span className="text-xs md:text-sm text-cyan-400 font-medium">
                          {chain.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-32">
            {/* <p className="text-gray-400 text-lg">More chains coming soon...</p> */}
          </div>
        </div>
      </section>

      {/* Smart Contract Code Section */}
      <section
        id="smart-contracts"
        className="relative py-20 px-6 sm:px-15 bg-black overflow-hidden"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - VS Code Style Editor */}
            <div className="relative">
              {/* VS Code Window */}
              <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
                {/* Title Bar */}
                <div className="bg-[#323233] px-4 py-2 flex items-center justify-between border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                    </div>
                    <span className="text-gray-400 text-sm ml-4">
                      OneTapProfit.sol
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tab Bar */}
                <div className="bg-[#252526] px-2 py-1 flex items-center gap-2 border-b border-gray-800">
                  <div className="bg-[#1e1e1e] px-3 py-1 rounded-t text-gray-300 text-xs flex items-center gap-2 border-t-2 border-cyan-500">
                    <span>OneTapProfit.sol</span>
                    <span className="text-gray-500">×</span>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="bg-[#1e1e1e] p-4 font-mono text-xs md:text-sm overflow-x-auto">
                  <pre className="text-gray-300">
                    <code>
                      {`1  // SPDX-License-Identifier: MIT
2  pragma solidity ^0.8.20;
3
4  import "@openzeppelin/contracts/access/AccessControl.sol";
5  import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
6  import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
7
8  /**
9   * @title OneTapProfit
10  * @notice Binary option-style trading
11  * @dev Users tap grid, pay USDC, win if price hits
12  */
13 contract OneTapProfit is AccessControl {
14
15    IERC20 public immutable usdc;
16    ITreasuryManager public treasuryManager;
17
18    uint256 public constant GRID_DURATION = 10;
19    uint256 public constant BASE_MULTIPLIER = 110;
20    uint256 public constant TRADING_FEE_BPS = 5;
21
22    mapping(uint256 => Bet) public bets;
23
24    function `}
                      <span className="text-cyan-400">placeBet</span>
                      {`(
25       uint256 targetPrice,
26       uint256 amount
27    ) external {
28       // Tap to profit logic
29    }
30 }`}
                    </code>
                  </pre>
                </div>

                {/* Status Bar */}
                <div className="bg-[#007acc] px-4 py-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-white">
                    <span>Solidity</span>
                    <span>UTF-8</span>
                    <span>LF</span>
                  </div>
                  <div className="text-white">
                    <span>Ln 24, Col 14</span>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 blur-2xl -z-10"></div>
            </div>

            {/* Right Side - Description */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Smart Contracts
              </h2>

              <p className="text-xl text-gray-300 leading-relaxed">
                Built with security and efficiency in mind. Our smart contracts
                power the entire trading ecosystem.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Audited & Secure
                    </h3>
                    <p className="text-gray-400">
                      Thoroughly tested and audited smart contracts
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Gas Optimized
                    </h3>
                    <p className="text-gray-400">
                      Minimal transaction costs for maximum efficiency
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Non-Custodial
                    </h3>
                    <p className="text-gray-400">
                      You always maintain full control of your assets
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <a
                  href="https://github.com/TethraFi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Tethra Finance Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-gray-400">
                © 2025 Tethra Finance. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6 text-gray-400">
              <span className="hover:text-white transition-colors">
                Twitter
              </span>
              <span className="hover:text-white transition-colors">
                Discord
              </span>
              <Link href="https://github.com/Tethra-Dex" target="_blank" className="hover:text-white transition-colors">
                GitHub
              </Link>
              <span className="hover:text-white transition-colors">
                Docs
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx global>{`
        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        body::-webkit-scrollbar {
          width: 8px;
        }

        body::-webkit-scrollbar-track {
          background: #000;
        }

        body::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #10b981);
          border-radius: 4px;
        }

        body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #059669);
        }

        @keyframes gradientShift {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -40px) rotate(90deg);
          }
          50% {
            transform: translate(-30px, -20px) rotate(180deg);
          }
          75% {
            transform: translate(-10px, 30px) rotate(270deg);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateChains {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        /* Enhance existing animations */
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Scroll-based animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        /* Glow effect */
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.6),
              0 0 60px rgba(16, 185, 129, 0.4);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

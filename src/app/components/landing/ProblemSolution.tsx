'use client';

import { useEffect, useState, useRef } from 'react';

export default function ProblemSolution() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionTop, setSectionTop] = useState(0);

  useEffect(() => {
    if (sectionRef.current) {
      setSectionTop(sectionRef.current.offsetTop);
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate progress within this section (0 to 1)
  const progress = sectionRef.current
    ? Math.max(0, Math.min(1, (scrollY - sectionTop + window.innerHeight / 2) / window.innerHeight))
    : 0;

  const problems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Form-Heavy Workflow",
      description: "5-8 clicks to place a single order. Too slow for active traders."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Repetitive Confirmations",
      description: "Pop-ups for every single trade slow down execution speed."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "High Friction Onboarding",
      description: "Requires MetaMask, seed phrases, and ETH for gas fees."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
      title: "Low Fill Rates",
      description: "Exact limit orders have only 30% fill rate due to price precision."
    }
  ];

  const solutions = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      title: "Tap-to-Trade",
      description: "Pre-configure range size, duration, and collateral. Then just tap the chart to instantly deploy orders.",
      benefit: "95% fill rate vs 30%",
      gradient: "from-blue-500 to-cyan-500",
      glowColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/50"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Session Keys",
      description: "Approve ONCE for the session. All subsequent trades execute instantly with NO pop-ups!",
      benefit: "Zero friction trading",
      gradient: "from-purple-500 to-pink-500",
      glowColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/50"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Account Abstraction",
      description: "Email/social login via Privy. No MetaMask needed. Pay gas fees with USDC instead of ETH.",
      benefit: "Onboard in 30 seconds",
      gradient: "from-green-500 to-emerald-500",
      glowColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/50"
    }
  ];

  return (
    <section ref={sectionRef} className="min-h-screen py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative">
        {/* Problems Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              The Problem with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Current DeFi Trading
              </span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="group relative"
                style={{
                  opacity: Math.min(1, progress * 3),
                  transform: `translateY(${Math.max(0, 50 - progress * 150)}px)`,
                  transition: 'all 0.6s ease-out'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 hover:border-red-500/50 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500">
                      {problem.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{problem.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{problem.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Divider */}
        <div className="relative my-24">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div
            className="relative flex justify-center"
            style={{
              opacity: Math.max(0, (progress - 0.3) * 2),
              transform: `scale(${0.5 + Math.max(0, (progress - 0.3) * 1)})`,
              transition: 'all 0.8s ease-out'
            }}
          >
            <div className="bg-black px-6 py-3 rounded-full border border-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-sm font-semibold text-gray-400">Our Solution</span>
            </div>
          </div>
        </div>

        {/* Solutions Section */}
        <div>
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{
                opacity: Math.max(0, (progress - 0.4) * 2),
                transform: `translateY(${Math.max(0, 30 - (progress - 0.4) * 100)}px)`,
                transition: 'all 0.6s ease-out'
              }}
            >
              The{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                Tethra
              </span>{' '}
              Solution
            </h2>
            <div
              className="w-32 h-1 bg-gradient-to-r from-blue-400 to-green-400 mx-auto"
              style={{
                opacity: Math.max(0, (progress - 0.4) * 2),
                transform: `scaleX(${Math.max(0, (progress - 0.4) * 2)})`,
                transition: 'all 0.8s ease-out'
              }}
            ></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="group relative"
                style={{
                  opacity: Math.max(0, (progress - 0.5 - index * 0.1) * 2),
                  transform: `translateY(${Math.max(0, 80 - (progress - 0.5 - index * 0.1) * 200)}px)`,
                  transition: `all 0.${6 + index}s ease-out`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${solution.glowColor} rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                <div className={`relative bg-gray-900/90 backdrop-blur-sm p-8 rounded-3xl border border-gray-800 hover:${solution.borderColor} transition-all duration-300 h-full`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center mb-6 text-white`}>
                    {solution.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{solution.title}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {solution.description}
                  </p>
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{solution.benefit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

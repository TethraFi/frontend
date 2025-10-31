'use client';

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-green-900/30 p-12 rounded-3xl border border-gray-700 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Trade <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Smarter</span>?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join Tethra and experience the future of decentralized perpetual trading.
              Fast, intuitive, and built for both beginners and professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/trade"
                className="inline-block font-semibold text-white py-4 px-10 rounded-lg text-lg
                           bg-gradient-to-br from-purple-600 to-blue-500
                           hover:bg-gradient-to-bl focus:ring-4 focus:outline-none
                           focus:ring-blue-300 dark:focus:ring-blue-800
                           transition-all duration-300 ease-in-out
                           hover:shadow-lg hover:shadow-blue-500/50
                           transform hover:scale-105"
              >
                Launch App
              </Link>

              <Link
                href="#"
                className="inline-block font-semibold text-white py-4 px-10 rounded-lg text-lg
                           border-2 border-gray-600 hover:border-gray-400
                           transition-all duration-300 ease-in-out
                           hover:bg-gray-800"
              >
                Read Documentation
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  8
                </div>
                <div className="text-sm text-gray-400 mt-1">Trading Pairs</div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  50x
                </div>
                <div className="text-sm text-gray-400 mt-1">Max Leverage</div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  95%
                </div>
                <div className="text-sm text-gray-400 mt-1">Fill Rate</div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  30s
                </div>
                <div className="text-sm text-gray-400 mt-1">Onboarding Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Built on</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-gray-300 font-semibold">
              <span className="text-blue-400">Base</span> Network
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full" />
            <div className="text-gray-300 font-semibold">
              Powered by <span className="text-purple-400">Pyth</span> Oracle
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full" />
            <div className="text-gray-300 font-semibold">
              Secured by <span className="text-green-400">Privy</span> AA
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

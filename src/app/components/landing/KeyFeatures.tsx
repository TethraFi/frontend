'use client';

export default function KeyFeatures() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Tethra</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Professional trading meets mobile-game simplicity
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Feature 1: Tap-to-Trade */}
          <div className="bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-800 p-8 rounded-2xl border border-blue-500/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Tap-to-Trade Range Orders</h3>
                <p className="text-blue-400 text-sm mb-4">The fastest way to place orders in DeFi</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Pre-configure once:</span> Set range size, duration, collateral, and leverage
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Tap anywhere on chart:</span> Instantly deploy range orders at that price level
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">95% fill rate:</span> Range orders execute anywhere within your zone vs 30% for exact limits
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Visual trading:</span> See all your orders and positions directly on the chart
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-blue-400">Example:</span> Configure ±$100 range, 1 hour duration.
                Tap chart at $98,500 → System creates range order $98,400-$98,600 instantly!
              </p>
            </div>
          </div>

          {/* Feature 2: Session Keys */}
          <div className="bg-gradient-to-br from-purple-900/20 via-gray-900 to-gray-800 p-8 rounded-2xl border border-purple-500/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Zero-Popup Fast Trading</h3>
                <p className="text-purple-400 text-sm mb-4">Session keys eliminate confirmation fatigue</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">One-time approval:</span> Enable session at start of trading
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">No more pop-ups:</span> All trades execute instantly after first approval
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Secure limits:</span> Set max per trade and max total spending
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Revokable anytime:</span> Disable session keys whenever you want
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-purple-400">Result:</span> Trade 100x in a row without seeing a single confirmation pop-up.
                Maximum speed for scalpers and active traders.
              </p>
            </div>
          </div>

          {/* Feature 3: Account Abstraction */}
          <div className="bg-gradient-to-br from-green-900/20 via-gray-900 to-gray-800 p-8 rounded-2xl border border-green-500/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Effortless Onboarding</h3>
                <p className="text-green-400 text-sm mb-4">Start trading in 30 seconds with email login</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Email/social login:</span> No MetaMask or browser extension needed
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">No seed phrases:</span> Embedded wallet created automatically via Privy
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Pay gas with USDC:</span> No need to buy ETH for transaction fees
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Self-custody:</span> Your keys, your coins - always in your control
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Oracle-Based */}
          <div className="bg-gradient-to-br from-cyan-900/20 via-gray-900 to-gray-800 p-8 rounded-2xl border border-cyan-500/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Pyth Oracle Integration</h3>
                <p className="text-cyan-400 text-sm mb-4">Real-time pricing without AMM complexity</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Real-time feeds:</span> 1-5 second price updates from Pyth Network
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Off-chain signing:</span> No gas fees for price updates
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">8 major assets:</span> BTC, ETH, SOL, AVAX, BNB, XRP, DOGE, LINK
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <span className="font-semibold">Leverage up to 50x:</span> Perpetual contracts with flexible leverage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

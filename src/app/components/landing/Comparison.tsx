'use client';

export default function Comparison() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Tethra Stands <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Out</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Compare us with leading DeFi perpetual platforms
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-semibold">Feature</th>
                <th className="text-center p-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Tethra</span>
                  </div>
                </th>
                <th className="text-center p-4 text-gray-400">GMX</th>
                <th className="text-center p-4 text-gray-400">dYdX</th>
                <th className="text-center p-4 text-gray-400">Hyperliquid</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Tap-to-Trade Interface</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Range Orders</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-green-400 mt-1">95% fill rate</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Account Abstraction</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-green-400 mt-1">Email login</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Session Keys (No Popups)</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-green-400 mt-1">Approve once</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Pay Gas with USDC</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                  <div className="text-xs text-gray-500 mt-1">ETH only</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-xs text-gray-500 mt-1">v4 only</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                </td>
              </tr>

              {/* Row 6 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Architecture</td>
                <td className="p-4 text-center">
                  <div className="text-sm text-green-400">Oracle-based</div>
                  <div className="text-xs text-gray-500 mt-1">Pyth Network</div>
                </td>
                <td className="p-4 text-center">
                  <div className="text-sm text-gray-400">AMM-based</div>
                </td>
                <td className="p-4 text-center">
                  <div className="text-sm text-gray-400">Orderbook</div>
                </td>
                <td className="p-4 text-center">
                  <div className="text-sm text-gray-400">Own L1</div>
                </td>
              </tr>

              {/* Row 7 */}
              <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">EVM Compatible</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-green-400 mt-1">Base</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-gray-500 mt-1">Arbitrum</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-gray-500 mt-1">Multi-chain</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">❌</span>
                  <div className="text-xs text-gray-500 mt-1">Own chain</div>
                </td>
              </tr>

              {/* Row 8 */}
              <tr className="hover:bg-gray-900/30 transition-colors">
                <td className="p-4 text-gray-300">Mobile-First UX</td>
                <td className="p-4 text-center">
                  <span className="text-2xl">✅</span>
                  <div className="text-xs text-green-400 mt-1">Touch-optimized</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-xs text-gray-500 mt-1">Desktop-first</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-xs text-gray-500 mt-1">Desktop-first</div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-xs text-gray-500 mt-1">Desktop-first</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Unique Selling Points */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-gray-900 p-6 rounded-xl border border-blue-500/30">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-bold mb-2">5x Faster</h3>
            <p className="text-gray-400 text-sm">
              Place orders 5x faster than competitors with tap-to-trade. No forms, no delays.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 p-6 rounded-xl border border-purple-500/30">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-xl font-bold mb-2">3x Better Fills</h3>
            <p className="text-gray-400 text-sm">
              95% fill rate with range orders vs 30% with exact limit orders on other platforms.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-gray-900 p-6 rounded-xl border border-green-500/30">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-xl font-bold mb-2">Zero Friction</h3>
            <p className="text-gray-400 text-sm">
              Email login, USDC gas payment, and session keys eliminate all onboarding friction.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

export default function HowItWorks() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Works</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Start trading in 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 -z-10" />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-blue-500/30 hover:border-blue-500 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    1
                  </div>
                  <h3 className="text-2xl font-bold">Connect Wallet</h3>
                </div>

                <div className="space-y-3 text-gray-300">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>Click "Connect Wallet"</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>Login with Email, Google, or Twitter</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>Privy creates your embedded wallet automatically</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>Deposit USDC to start trading</span>
                  </p>
                </div>

                <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    ⏱️ Takes only <span className="font-bold">30 seconds</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-purple-500/30 hover:border-purple-500 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    2
                  </div>
                  <h3 className="text-2xl font-bold">Configure</h3>
                </div>

                <div className="space-y-3 text-gray-300">
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Set your range size (Y-axis): ±$100</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Choose duration (X-axis): 1 hour</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Enter collateral amount: 100 USDC</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">→</span>
                    <span>Select leverage: 1x to 50x</span>
                  </p>
                </div>

                <div className="mt-6 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-purple-300">
                    💡 Configure <span className="font-bold">once</span>, use multiple times
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-green-500/30 hover:border-green-500 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    3
                  </div>
                  <h3 className="text-2xl font-bold">Tap & Trade</h3>
                </div>

                <div className="space-y-3 text-gray-300">
                  <p className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Activate Tap-to-Trade mode</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Tap anywhere on the chart</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Range order deploys instantly!</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Watch your position fill and profit in real-time</span>
                  </p>
                </div>

                <div className="mt-6 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-300">
                    ⚡ Just <span className="font-bold">1-2 clicks</span> per trade!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Flow */}
        <div className="mt-16 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-2xl border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Real Example: Opening a Long Position
          </h3>

          <div className="grid md:grid-cols-5 gap-4 text-center">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-gray-400 mb-1">You see ETH at</p>
              <p className="text-lg font-bold text-white">$3,500</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-2xl text-gray-600">→</div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-3xl mb-2">👆</div>
              <p className="text-sm text-gray-400 mb-1">You tap chart at</p>
              <p className="text-lg font-bold text-blue-400">$3,450</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-2xl text-gray-600">→</div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-400 mb-1">Range order created</p>
              <p className="text-lg font-bold text-green-400">$3,400-$3,500</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300 mb-2">
              Below current price = <span className="text-blue-400 font-semibold">LONG</span> automatically
            </p>
            <p className="text-gray-400 text-sm">
              When price touches your range ($3,400-$3,500), position opens instantly with 10x leverage on 100 USDC collateral
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

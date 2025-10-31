/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSwitchChain, useChainId } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { toast } from "react-hot-toast";
import { Copy, ExternalLink, LogOut, Wallet, Key, DollarSign, ChevronDown as ChevronDownIcon } from "lucide-react";
import { createPublicClient, http, formatUnits, encodeFunctionData } from "viem";
import { USDC_DECIMALS, getChainConfig, ChainType } from "@/config/chains";
import { useChain } from "../contexts/ChainContext";

// Mock USDC ABI with faucet function
const MOCK_USDC_ABI = [
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "hasClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const WalletConnectButton: React.FC = () => {
  const {
    ready,
    authenticated,
    login,
    logout,
    user,
    exportWallet,
    createWallet,
  } = usePrivy();
  const { wallets } = useWallets();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const { selectedChain, setSelectedChain } = useChain();
  const chainDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-create embedded wallet when user connects with external wallet
  useEffect(() => {
    const autoCreateEmbeddedWallet = async () => {
      if (!authenticated || !user) return;

      // Check if user has embedded wallet
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      );

      // If no embedded wallet exists, create one automatically
      if (!embeddedWallets || embeddedWallets.length === 0) {
        console.log("No embedded wallet found, auto-creating...");
        toast.loading("Setting up your embedded wallet...", {
          id: "auto-create",
        });

        try {
          await createWallet();
          toast.success("Embedded wallet created successfully!", {
            id: "auto-create",
            duration: 3000,
          });
        } catch (error: any) {
          console.error("Auto-create wallet error:", error);

          // Ignore error if wallet already exists
          if (error?.message?.includes("already has")) {
            toast.dismiss("auto-create");
          } else {
            toast.error("Failed to create embedded wallet", {
              id: "auto-create",
            });
          }
        }
      }
    };

    autoCreateEmbeddedWallet();
  }, [authenticated, user, createWallet]);

  // Auto-switch to Flow when authenticated
  useEffect(() => {
    const flowEvmTestnetId = 545; // Flow EVM Testnet chain ID
    if (authenticated && chainId !== flowEvmTestnetId) {
      switchChain({ chainId: flowEvmTestnetId });
      toast.success("Switching to Flow EVM Testnet network...");
    }
  }, [authenticated, chainId, switchChain]);

  // Fetch USDC balance based on selected chain
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user) return;

      // Get embedded wallet address
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      ) as any[];

      const embeddedWalletAddress =
        embeddedWallets?.[0]?.address || user?.wallet?.address;

      if (!embeddedWalletAddress) return;

      setIsLoadingBalance(true);
      try {
        // Get chain config based on selected chain
        const chainConfig = getChainConfig(selectedChain);

        const publicClient = createPublicClient({
          chain: selectedChain === 'base' ? baseSepolia : {
            id: chainConfig.id,
            name: chainConfig.name,
            nativeCurrency: chainConfig.nativeCurrency,
            rpcUrls: {
              default: { http: [chainConfig.rpcUrl] },
              public: { http: [chainConfig.rpcUrl] },
            },
            blockExplorers: {
              default: { name: 'Explorer', url: chainConfig.explorerUrl },
            },
          },
          transport: http(chainConfig.rpcUrl),
        });

        const balance = (await publicClient.readContract({
          address: chainConfig.contracts.mockUSDC as `0x${string}`,
          abi: [
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "balance", type: "uint256" }],
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [embeddedWalletAddress as `0x${string}`],
        })) as bigint;

        // Format USDC balance using configured decimals
        const formattedBalance = formatUnits(balance, USDC_DECIMALS);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        setUsdcBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user) {
      fetchUsdcBalance();
    }
  }, [authenticated, user, selectedChain]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is inside Privy modal (Privy modals have specific classes/attributes)
      const isPrivyModal =
        target.closest('[role="dialog"]') ||
        target.closest(".privy-modal") ||
        target.closest("#privy-modal-content");

      // Don't close if clicking inside Privy modal
      if (isPrivyModal) {
        return;
      }

      // Close only if clicking outside our dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close chain dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(target)) {
        setIsChainDropdownOpen(false);
      }
    };

    if (isChainDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChainDropdownOpen]);

  const getEmbeddedWalletAddress = () => {
    const embeddedWallets = user?.linkedAccounts?.filter(
      (account: any) =>
        account.type === "wallet" &&
        account.imported === false &&
        account.id !== undefined
    ) as any[];
    return embeddedWallets?.[0]?.address || user?.wallet?.address;
  };

  const handleCopyAddress = () => {
    const address = getEmbeddedWalletAddress();
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
      // Don't close the dropdown - keep it open for user convenience
    }
  };

  const handleViewExplorer = () => {
    const address = getEmbeddedWalletAddress();
    const chainConfig = getChainConfig(selectedChain);
    if (address) {
      window.open(`${chainConfig.explorerUrl}/address/${address}`, "_blank");
      // Don't close the dropdown - keep it open for user convenience
    }
  };

  const handleExportPrivateKey = async () => {
    try {
      // Find embedded wallet
      const embeddedWallets = user?.linkedAccounts?.filter(
        (account: any) =>
          account.type === "wallet" &&
          account.imported === false &&
          account.id !== undefined
      ) as any[];

      // Check if user has embedded wallet
      if (!embeddedWallets || embeddedWallets.length === 0) {
        toast.error("Embedded wallet not found. Please reconnect your wallet.");
        return;
      }

      // Get the embedded wallet address
      const embeddedWalletAddress = embeddedWallets[0]?.address;

      if (!embeddedWalletAddress) {
        toast.error("Embedded wallet address not found");
        return;
      }

      // Export the specific embedded wallet by passing its address
      // This will open Privy's modal for private key export
      await exportWallet({ address: embeddedWalletAddress });

      // Don't close the dropdown - keep wallet popup open after Privy modal closes
      // User might want to do other actions
      toast.success("Private key exported successfully!");
    } catch (error: any) {
      console.error("Error exporting wallet:", error);
      toast.error(error?.message || "Failed to export private key");
    }
  };

  const handleDisconnect = () => {
    logout();
    setIsDropdownOpen(false);
    toast.success("Wallet disconnected");
  };

  const handleClaimUSDC = async () => {
    if (!authenticated || !user) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Get embedded wallet
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    if (!embeddedWallet) {
      toast.error("Embedded wallet not found");
      return;
    }

    const walletAddress = embeddedWallet.address;

    setIsClaiming(true);
    const loadingToast = toast.loading("Preparing to claim...");

    try {
      // Get chain config based on selected chain
      const chainConfig = getChainConfig(selectedChain);
      const usdcAddress = chainConfig.contracts.mockUSDC;

      console.log(`💰 Claiming USDC on ${chainConfig.displayName}...`);
      console.log(`  Chain ID: ${chainConfig.id}`);
      console.log(`  USDC Address: ${usdcAddress}`);

      // Get wallet provider first
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Could not get wallet provider");
      }

      // Try to switch to the correct chain
      toast.loading(`Switching to ${chainConfig.displayName}...`, { id: loadingToast });

      try {
        await embeddedWallet.switchChain(chainConfig.id);
        console.log(`✅ Successfully switched to ${chainConfig.displayName}`);
      } catch (switchError: any) {
        console.error("Chain switch error:", switchError);
        console.error("Error details:", {
          code: switchError?.code,
          message: switchError?.message,
          data: switchError?.data
        });

        // Check if error is because chain doesn't exist (code 4902)
        // or if it's unrecognized chain (code -32603)
        const isChainNotAddedError =
          switchError?.code === 4902 ||
          switchError?.code === -32603 ||
          switchError?.message?.toLowerCase().includes('unrecognized chain') ||
          switchError?.message?.toLowerCase().includes('chain not added');

        if (selectedChain === 'flow' && isChainNotAddedError) {
          console.log("⚠️ Flow chain not in wallet, attempting to add...");
          toast.loading("Adding Flow EVM to wallet...", { id: loadingToast });

          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x' + chainConfig.id.toString(16),
                chainName: chainConfig.displayName,
                nativeCurrency: chainConfig.nativeCurrency,
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: [chainConfig.explorerUrl],
              }],
            });
            console.log("✅ Flow EVM added to wallet");
            toast.loading("Switching to Flow EVM...", { id: loadingToast });
          } catch (addError: any) {
            console.error("Failed to add chain:", addError);
            // If adding fails, it might be because it already exists
            // Try to switch again
            console.log("⚠️ Add chain failed, trying switch again...");
            try {
              await embeddedWallet.switchChain(chainConfig.id);
              console.log("✅ Successfully switched to Flow on retry");
            } catch (retrySwitchError) {
              console.error("Retry switch also failed:", retrySwitchError);
              throw new Error("Could not switch to Flow EVM. Please try manually switching in your wallet.");
            }
          }
        } else {
          // For other errors or Base chain, just continue
          // The wallet might already be on the correct chain
          console.log("⚠️ Switch failed but continuing anyway...");
        }
      }

      // Verify we're on the correct chain by checking current chainId
      toast.loading("Verifying network...", { id: loadingToast });

      let verifiedChain = false;
      try {
        const currentChainId = await provider.request({ method: 'eth_chainId' });
        const currentChainIdDecimal = parseInt(currentChainId as string, 16);

        console.log(`Current chain ID: ${currentChainIdDecimal}, Expected: ${chainConfig.id}`);

        if (currentChainIdDecimal !== chainConfig.id) {
          console.warn(`⚠️ Chain mismatch! Current: ${currentChainIdDecimal}, Expected: ${chainConfig.id}`);

          // Try one more time with wallet_switchEthereumChain
          toast.loading(`Requesting ${chainConfig.displayName} switch...`, { id: loadingToast });

          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x' + chainConfig.id.toString(16) }],
            });

            console.log("✅ Switched via wallet_switchEthereumChain");

            // Verify again
            const newChainId = await provider.request({ method: 'eth_chainId' });
            const newChainIdDecimal = parseInt(newChainId as string, 16);

            if (newChainIdDecimal !== chainConfig.id) {
              throw new Error("Chain still doesn't match after switch");
            }

            verifiedChain = true;
          } catch (switchError2: any) {
            console.error("Final switch attempt failed:", switchError2);

            // If chain still doesn't exist, try to add it one more time
            if (switchError2?.code === 4902) {
              toast.loading(`Adding ${chainConfig.displayName}...`, { id: loadingToast });

              try {
                await provider.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x' + chainConfig.id.toString(16),
                    chainName: chainConfig.displayName,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: [chainConfig.rpcUrl],
                    blockExplorerUrls: [chainConfig.explorerUrl],
                  }],
                });

                console.log("✅ Chain added successfully");
                verifiedChain = true;
              } catch (addError2) {
                console.error("Final add attempt failed:", addError2);
                toast.error(
                  `Unable to switch to ${chainConfig.displayName}. Please open your wallet and manually switch to ${chainConfig.displayName} network, then try again.`,
                  {
                    id: loadingToast,
                    duration: 7000
                  }
                );
                return;
              }
            } else {
              toast.error(
                `Unable to switch to ${chainConfig.displayName}. Please open your wallet and manually switch to ${chainConfig.displayName} network, then try again.`,
                {
                  id: loadingToast,
                  duration: 7000
                }
              );
              return;
            }
          }
        } else {
          verifiedChain = true;
        }

        if (verifiedChain) {
          console.log(`✅ Verified on ${chainConfig.displayName}`);
        }
      } catch (verifyError) {
        console.error("Failed to verify chain:", verifyError);
        // Continue anyway, the transaction will fail if wrong chain
      }

      // Force final switch using embeddedWallet.switchChain (most reliable)
      console.log("🔄 Force switching wallet to correct chain...");
      toast.loading(`Switching to ${chainConfig.displayName}...`, { id: loadingToast });

      try {
        await embeddedWallet.switchChain(chainConfig.id);
        console.log("✅ Wallet switched successfully");
      } catch (forceSwitchError) {
        console.error("⚠️ Force switch failed:", forceSwitchError);
        // Continue, but warn user
      }

      // Wait a bit for wallet to fully sync to new chain
      console.log("⏳ Waiting for wallet to sync...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Final verification right before transaction
      try {
        const finalChainId = await provider.request({ method: 'eth_chainId' });
        const finalChainIdDecimal = parseInt(finalChainId as string, 16);
        console.log(`🔍 Final chain check: ${finalChainIdDecimal} (expected: ${chainConfig.id})`);

        if (finalChainIdDecimal !== chainConfig.id) {
          throw new Error(
            `Wallet is still on chain ${finalChainIdDecimal} instead of ${chainConfig.id}. ` +
            `Please manually switch to ${chainConfig.displayName} in your wallet extension.`
          );
        }

        console.log("✅ Final verification passed - wallet on correct chain");
      } catch (finalCheckError) {
        console.error("❌ Final chain check failed:", finalCheckError);
        toast.error(
          `Wallet not on ${chainConfig.displayName}. Please manually switch your wallet to ${chainConfig.displayName} network and try again.`,
          {
            id: loadingToast,
            duration: 7000,
          }
        );
        return;
      }

      // Proceed with claim
      toast.loading("Checking claim status...", { id: loadingToast });

      // Create public client with correct RPC URL for the selected chain
      const publicClient = createPublicClient({
        chain: selectedChain === 'base' ? baseSepolia : {
          id: chainConfig.id,
          name: chainConfig.name,
          nativeCurrency: chainConfig.nativeCurrency,
          rpcUrls: {
            default: { http: [chainConfig.rpcUrl] },
            public: { http: [chainConfig.rpcUrl] },
          },
          blockExplorers: {
            default: { name: 'Explorer', url: chainConfig.explorerUrl },
          },
        },
        transport: http(chainConfig.rpcUrl),
      });

      console.log(`🔍 Using RPC: ${chainConfig.rpcUrl}`);

      // Check if user has already claimed using publicClient (correct RPC)
      let alreadyClaimed = false;
      try {
        console.log("📞 Calling hasClaimed...");
        alreadyClaimed = await Promise.race([
          publicClient.readContract({
            address: usdcAddress as `0x${string}`,
            abi: MOCK_USDC_ABI,
            functionName: "hasClaimed",
            args: [walletAddress as `0x${string}`],
          }) as Promise<boolean>,
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("hasClaimed timeout after 10s")), 10000)
          ),
        ]);
        console.log(`✅ Claim status: ${alreadyClaimed ? 'Already claimed' : 'Not claimed yet'}`);
      } catch (checkError: any) {
        console.error("⚠️ Failed to check claim status:", checkError);
        // If check fails, assume not claimed and continue
        // The actual transaction will fail if already claimed
        console.log("⚠️ Continuing without claim check...");
        alreadyClaimed = false;
      }

      if (alreadyClaimed) {
        toast.error(
          `You have already claimed USDC from the faucet on ${chainConfig.displayName}. Each wallet can only claim once per chain.`,
          {
            id: loadingToast,
            duration: 5000,
          }
        );
        return;
      }

      // Update loading message
      toast.loading("Claiming USDC from faucet...", { id: loadingToast });
      console.log("📝 Encoding faucet() call...");

      // Encode faucet() function call
      const data = encodeFunctionData({
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });

      console.log("💸 Sending transaction...");
      console.log("  From:", walletAddress);
      console.log("  To:", usdcAddress);
      console.log("  Data:", data);
      console.log("  Chain ID (hex):", '0x' + chainConfig.id.toString(16));

      // Send transaction to call faucet() with timeout
      // Include chainId in transaction to force wallet to switch
      const txHash = await Promise.race([
        provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: walletAddress,
              to: usdcAddress,
              data: data,
              chainId: '0x' + chainConfig.id.toString(16), // Force chain in transaction
            },
          ],
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Transaction timeout after 60s")), 60000)
        ),
      ]);

      console.log(`✅ Faucet claimed on ${chainConfig.displayName}:`, txHash);

      toast.success(`USDC claimed on ${chainConfig.displayName}! 🎉`, {
        id: loadingToast,
        duration: 4000,
      });

      // Show transaction link with correct explorer URL
      setTimeout(() => {
        toast.success(
          <div>
            View on {chainConfig.displayName} Explorer:{" "}
            <a
              href={`${chainConfig.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Click here
            </a>
          </div>,
          { duration: 5000 }
        );
      }, 500);

      // Reload the page to refresh balance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error claiming USDC:", error);
      console.error("Error type:", typeof error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        stack: error?.stack,
      });

      let errorMessage = "Failed to claim USDC from faucet";
      const chainName = selectedChain === 'base' ? 'Base Sepolia' : 'Flow Testnet';

      if (error?.message?.includes("timeout")) {
        errorMessage = `Request timeout. ${chainName} RPC might be slow. Please try again.`;
      } else if (error?.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (error?.message?.includes("already claimed")) {
        errorMessage = "You have already claimed USDC from this faucet";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        id: loadingToast,
        duration: 7000,
      });
    } finally {
      console.log("🏁 Claim process ended, resetting state...");
      setIsClaiming(false);
    }
  };

  if (!ready) {
    return null;
  }

  if (authenticated) {
    // Get embedded wallet address
    const embeddedWallets = user?.linkedAccounts?.filter(
      (account: any) =>
        account.type === "wallet" &&
        account.imported === false &&
        account.id !== undefined
    ) as any[];

    const embeddedWalletAddress =
      embeddedWallets?.[0]?.address || user?.wallet?.address;
    const shortAddress = embeddedWalletAddress
      ? `${embeddedWalletAddress.substring(
          0,
          6
        )}...${embeddedWalletAddress.substring(
          embeddedWalletAddress.length - 4
        )}`
      : "Connected";

    return (
      <div className="flex items-center">
        {/* Connect Wallet Button with Wallet Icon */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          {shortAddress}
        </button>

        {/* Chain Selector Button */}
        <div ref={chainDropdownRef} className="relative ml-3">
          <button
            onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
            className="flex items-center gap-2 px-3 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
            <img
              src={selectedChain === "base"
                ? "data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
                : "https://s2.coinmarketcap.com/static/img/coins/64x64/4558.png"
              }
              alt={selectedChain === "base" ? "Base" : "Flow"}
              className="w-6 h-6 object-contain"
            />
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 transition-transform ${isChainDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Chain Dropdown */}
          {isChainDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-[#1A2332] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  setSelectedChain("base");
                  setIsChainDropdownOpen(false);
                  toast.success("Switched to Base");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  selectedChain === "base" ? "bg-slate-700/30" : ""
                }`}
              >
                <img
                  src="data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
                  alt="Base"
                  className="w-6 h-6"
                />
                <span className="text-white text-sm font-medium">Base</span>
              </button>
              <button
                onClick={() => {
                  setSelectedChain("flow");
                  setIsChainDropdownOpen(false);
                  toast.success("Switched to Flow");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  selectedChain === "flow" ? "bg-slate-700/30" : ""
                }`}
              >
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/4558.png"
                  alt="Flow"
                  className="w-6 h-6 object-contain"
                />
                <span className="text-white text-sm font-medium">Flow</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Modal Content */}
            <div
              ref={dropdownRef}
              className="relative w-[520px] bg-[#16181D] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-100">
                    Tethra Wallet
                  </h2>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 hover:cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Wallet Address with Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Address Box */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/50 rounded-xl flex-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-slate-100 font-medium text-sm">
                      {shortAddress}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-slate-700/50 rounded-md transition-colors ml-auto cursor-pointer"
                      title="Copy Address"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                    </button>
                  </div>

                  {/* Action Icon Buttons - Separated */}
                  <button
                    onClick={handleViewExplorer}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleExportPrivateKey}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
                    title="Export Private Key"
                  >
                    <Key className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                    title="Disconnect"
                  >
                    <LogOut className="w-4 h-4 text-white hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Balance Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>Balance</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        $
                      </span>
                    </div>
                    <span className="text-slate-100 text-sm font-medium">
                      USDC
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-4xl font-bold text-slate-100 mb-5">
                  {isLoadingBalance ? (
                    <span className="text-slate-400 text-2xl">Loading...</span>
                  ) : (
                    <span>${usdcBalance || "0.00"}</span>
                  )}
                </div>

                {/* Deposit, Withdraw & Claim USDC Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors cursor-pointer">
                    Deposit
                  </button>
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors cursor-pointer">
                    Withdraw
                  </button>
                  <button
                    onClick={handleClaimUSDC}
                    disabled={isClaiming}
                    className="py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                    title="Claim 100 Mock USDC"
                  >
                    <DollarSign className="w-4 h-4" />
                    {isClaiming ? "Claiming..." : "Claim"}
                  </button>
                </div>
              </div>

              {/* Funding Activity Section */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-3">
                  Funding Activity
                </h3>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Empty State */}
                <div className="py-8 text-center">
                  <p className="text-slate-500 text-sm">
                    No funding activity yet
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* Connect Wallet Button with Wallet Icon */}

      <button
        onClick={login}
        className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg md:px-5 px-3 md:py-3 py-1 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
      >
        <Wallet className="w-5 h-5" />
        Connect wallet
      </button>

      {/* Chain Selector Button */}
      <div ref={chainDropdownRef} className="relative">
        <button
          onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
          className="flex items-center gap-2 px-3 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <img
            src={selectedChain === "base"
              ? "data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
              : "https://s2.coinmarketcap.com/static/img/coins/64x64/4558.png"
            }
            alt={selectedChain === "base" ? "Base" : "Flow"}
            className="w-6 h-6 object-contain"
          />
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 transition-transform ${isChainDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Chain Dropdown */}
        {isChainDropdownOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-[#1A2332] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <button
              onClick={() => {
                setSelectedChain("base");
                setIsChainDropdownOpen(false);
                toast.success("Switched to Base");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                selectedChain === "base" ? "bg-slate-700/30" : ""
              }`}
            >
              <img
                src="data:image/svg+xml,%3Csvg width='111' height='111' viewBox='0 0 111 111' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z' fill='%230052FF'/%3E%3C/svg%3E"
                alt="Base"
                className="w-6 h-6"
              />
              <span className="text-white text-sm font-medium">Base</span>
            </button>
            <button
              onClick={() => {
                setSelectedChain("flow");
                setIsChainDropdownOpen(false);
                toast.success("Switched to Flow");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                selectedChain === "flow" ? "bg-slate-700/30" : ""
              }`}
            >
              <img
                src="https://s2.coinmarketcap.com/static/img/coins/64x64/4558.png"
                alt="Flow"
                className="w-6 h-6 object-contain"
              />
              <span className="text-white text-sm font-medium">Flow</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnectButton;

/**
 * Hook to get Privy embedded wallet address
 */

import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';

interface EmbeddedWalletAccount {
  type: string;
  imported: boolean;
  id?: string;
  address: string;
}

export function useEmbeddedWallet() {
  const { user } = usePrivy();

  const embeddedWallet = useMemo(() => {
    if (!user?.linkedAccounts) return null;

    const wallets = user.linkedAccounts.filter(
      (account: unknown) => {
        const acc = account as { type: string; imported: boolean; id?: string };
        return acc.type === 'wallet' && acc.imported === false && acc.id !== undefined;
      }
    ) as EmbeddedWalletAccount[];

    return wallets?.[0] || null;
  }, [user]);

  return {
    address: embeddedWallet?.address as `0x${string}` | undefined,
    hasEmbeddedWallet: !!embeddedWallet,
    embeddedWallet,
  };
}

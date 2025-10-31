// Global TypeScript declarations
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] | undefined; }) => Promise<any>;
    };
  }
}

export {};
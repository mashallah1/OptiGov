import { useState, useCallback, useEffect } from "react";
import { createWalletClient, createPublicClient, custom } from "viem";
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  sepolia,
  bsc,
} from "viem/chains";

// ─── Supported EVM Chains ─────────────────────────────────────────────────────
// Add or remove chains here as needed.

export const SUPPORTED_CHAINS = {
  [mainnet.id]: mainnet,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [base.id]: base,
  [bsc.id]: bsc,
  [sepolia.id]: sepolia,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getProvider = () => {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
};

const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [chain, setChain] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [error, setError] = useState(null);

  // Builds both wallet + public clients for a given provider/address/chain
  const buildClients = useCallback((provider, address, numericChainId) => {
    const chainDef = SUPPORTED_CHAINS[numericChainId] ?? { id: numericChainId };

    const wallet = createWalletClient({
      account: address,
      chain: chainDef,
      transport: custom(provider),
    });

    const pub = createPublicClient({
      chain: chainDef,
      transport: custom(provider),
    });

    return { wallet, pub, chainDef };
  }, []);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    setAccount(null);
    setWalletClient(null);
    setPublicClient(null);
    setChain(null);
    setChainId(null);
    setStatus("idle");
    setError(null);
    localStorage.removeItem("walletConnected");
  }, []);

  // ── Switch Chain ─────────────────────────────────────────────────────────

  const switchChain = useCallback(async (targetChainId) => {
    const provider = getProvider();
    if (!provider) throw new Error("No wallet provider found.");

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      // Error 4902 = chain not added to the wallet yet — add it automatically
      if (err?.code === 4902) {
        const chainDef = SUPPORTED_CHAINS[targetChainId];
        if (!chainDef) throw new Error(`Chain ${targetChainId} is not configured.`);

        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${chainDef.id.toString(16)}`,
              chainName: chainDef.name,
              nativeCurrency: chainDef.nativeCurrency,
              rpcUrls: chainDef.rpcUrls.default.http,
              blockExplorerUrls: chainDef.blockExplorers
                ? [chainDef.blockExplorers.default.url]
                : [],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    const provider = getProvider();

    if (!provider) {
      setError("No wallet detected. Please install MetaMask or another EVM wallet.");
      setStatus("error");
      return;
    }

    try {
      const addresses = await provider.request({ method: "eth_requestAccounts" });
      const rawChainId = await provider.request({ method: "eth_chainId" });
      const numericChainId = parseInt(rawChainId, 16);

      const { wallet, pub, chainDef } = buildClients(provider, addresses[0], numericChainId);

      setAccount(addresses[0]);
      setWalletClient(wallet);
      setPublicClient(pub);
      setChain(chainDef);
      setChainId(numericChainId);
      setStatus("connected");

      localStorage.setItem("walletConnected", "true");
    } catch (err) {
      const message =
        err?.code === 4001
          ? "Connection rejected by user."
          : err?.message ?? "Connection failed.";
      setError(message);
      setStatus("error");
    }
  }, [buildClients]);

  // ── Sign Message (EIP-191) ────────────────────────────────────────────────

  const signMessage = useCallback(
    async (message) => {
      if (!walletClient) throw new Error("Wallet not connected.");
      return walletClient.signMessage({ message });
    },
    [walletClient]
  );

  // ── Sign Typed Data (EIP-712) ─────────────────────────────────────────────

  const signTypedData = useCallback(
    async ({ domain, types, primaryType, message }) => {
      if (!walletClient) throw new Error("Wallet not connected.");
      return walletClient.signTypedData({ domain, types, primaryType, message });
    },
    [walletClient]
  );

  // ── Send Transaction ──────────────────────────────────────────────────────

  const sendTransaction = useCallback(
    async ({ to, value, data }) => {
      if (!walletClient) throw new Error("Wallet not connected.");
      return walletClient.sendTransaction({ to, value, data });
    },
    [walletClient]
  );

  // ── Write Contract ────────────────────────────────────────────────────────
  // Pass a viem writeContract config: { address, abi, functionName, args, value? }

  const writeContract = useCallback(
    async (contractConfig) => {
      if (!walletClient) throw new Error("Wallet not connected.");
      return walletClient.writeContract(contractConfig);
    },
    [walletClient]
  );

  // ── Wallet Events ─────────────────────────────────────────────────────────

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts.length) return disconnect();
      const { wallet, pub, chainDef } = buildClients(provider, accounts[0], chainId);
      setAccount(accounts[0]);
      setWalletClient(wallet);
      setPublicClient(pub);
      setChain(chainDef);
    };

    const handleChainChanged = (newChainId) => {
      const numeric = parseInt(newChainId, 16);
      const { wallet, pub, chainDef } = buildClients(provider, account, numeric);
      setChainId(numeric);
      setWalletClient(wallet);
      setPublicClient(pub);
      setChain(chainDef);
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, chainId, buildClients, disconnect]);

  // ── Auto Reconnect ────────────────────────────────────────────────────────

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const tryReconnect = async () => {
      if (!localStorage.getItem("walletConnected")) return;

      const accounts = await provider.request({ method: "eth_accounts" });
      if (!accounts.length) return;

      const rawChainId = await provider.request({ method: "eth_chainId" });
      const numericChainId = parseInt(rawChainId, 16);
      const { wallet, pub, chainDef } = buildClients(provider, accounts[0], numericChainId);

      setAccount(accounts[0]);
      setWalletClient(wallet);
      setPublicClient(pub);
      setChain(chainDef);
      setChainId(numericChainId);
      setStatus("connected");
    };

    tryReconnect();
  }, [buildClients]);

  return {
    // State
    account,
    chain,
    chainId,
    status,
    error,
    // Clients (for advanced use)
    walletClient,
    publicClient,
    // Actions
    connect,
    disconnect,
    switchChain,
    // Signing & transactions
    signMessage,
    signTypedData,
    sendTransaction,
    writeContract,
    // Convenience
    shortAddress: shortenAddress(account),
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isSupportedChain: !!SUPPORTED_CHAINS[chainId],
  };
};

// ─── UI ───────────────────────────────────────────────────────────────────────

export const WalletButton = () => {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    shortAddress,
    chain,
    error,
  } = useWallet();

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isConnected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {chain?.name && (
            <span style={{ fontSize: "0.8em", color: "#888" }}>{chain.name}</span>
          )}
          <button onClick={disconnect} title="Disconnect wallet">
            {shortAddress}
          </button>
        </div>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

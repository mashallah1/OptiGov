import { useState, useCallback, useEffect } from "react";
import { createWalletClient, custom } from "viem";

// ─── GenLayer Bradbury Testnet Config ────────────────────────────────────────

const genlayerBradbury = {
  id: 1337, // ⚠️ REPLACE with real chainId if different
  name: "GenLayer Bradbury Testnet",
  network: "genlayer-bradbury",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bradbury.genlayer.com"], // ⚠️ confirm
    },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Explorer",
      url: "https://explorer.bradbury.genlayer.com", // ⚠️ confirm
    },
  },
  testnet: true,
};

// ─── Supported Chains (STRICT) ───────────────────────────────────────────────

const SUPPORTED_CHAINS = {
  [genlayerBradbury.id]: genlayerBradbury,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getProvider = () => {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
};

const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const createClient = useCallback((provider, account, chainId) => {
    const chain = SUPPORTED_CHAINS[chainId];
    if (!chain) return null;

    return createWalletClient({
      account,
      chain,
      transport: custom(provider),
    });
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    const provider = getProvider();

    if (!provider) {
      setError("No wallet detected. Install MetaMask.");
      setStatus("error");
      return;
    }

    try {
      const addresses = await provider.request({ method: "eth_requestAccounts" });
      const rawChainId = await provider.request({ method: "eth_chainId" });
      const numericChainId = parseInt(rawChainId, 16);

      // Enforce GenLayer
      if (!SUPPORTED_CHAINS[numericChainId]) {
        await switchChain(genlayerBradbury.id);
        setStatus("idle");
        return;
      }

      const client = createClient(provider, addresses[0], numericChainId);

      setAccount(addresses[0]);
      setWalletClient(client);
      setChainId(numericChainId);
      setStatus("connected");

      localStorage.setItem("walletConnected", "true");
    } catch (err) {
      const message =
        err?.code === 4001
          ? "Connection rejected by user."
          : err?.message ?? "Connection error.";

      setError(message);
      setStatus("error");
    }
  }, [createClient]);

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    setAccount(null);
    setWalletClient(null);
    setChainId(null);
    setStatus("idle");
    setError(null);

    localStorage.removeItem("walletConnected");
  }, []);

  // ── Switch Chain (AUTO ADD) ───────────────────────────────────────────────

  const switchChain = useCallback(async (targetChainId) => {
    const provider = getProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      if (err?.code === 4902) {
        const chain = SUPPORTED_CHAINS[targetChainId];
        if (!chain) return;

        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${chain.id.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: [chain.blockExplorers.default.url],
            },
          ],
        });
      }
    }
  }, []);

  // ── Events ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts.length) return disconnect();
      setAccount(accounts[0]);

      setWalletClient(createClient(provider, accounts[0], chainId));
    };

    const handleChainChanged = (newChainId) => {
      const numeric = parseInt(newChainId, 16);

      if (!SUPPORTED_CHAINS[numeric]) {
        setError("Please switch to GenLayer Bradbury Testnet.");
        setStatus("error");
        return;
      }

      setChainId(numeric);
      setWalletClient(createClient(provider, account, numeric));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, chainId, createClient, disconnect]);

  // ── Auto Reconnect ────────────────────────────────────────────────────────

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const reconnect = async () => {
      const wasConnected = localStorage.getItem("walletConnected");
      if (!wasConnected) return;

      const accounts = await provider.request({ method: "eth_accounts" });
      if (!accounts.length) return;

      const rawChainId = await provider.request({ method: "eth_chainId" });
      const numericChainId = parseInt(rawChainId, 16);

      if (!SUPPORTED_CHAINS[numericChainId]) return;

      const client = createClient(provider, accounts[0], numericChainId);

      setAccount(accounts[0]);
      setWalletClient(client);
      setChainId(numericChainId);
      setStatus("connected");
    };

    reconnect();
  }, [createClient]);

  return {
    account,
    walletClient,
    chainId,
    status,
    error,
    connect,
    disconnect,
    switchChain,
    shortAddress: shortenAddress(account),
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isSupportedChain: !!SUPPORTED_CHAINS[chainId],
  };
};

// ─── UI ─────────────────────────────────────────────────────────────────────

export const WalletButton = () => {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    shortAddress,
    error,
    isSupportedChain,
  } = useWallet();

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isConnected ? (
        <div>
          {!isSupportedChain && (
            <p style={{ color: "orange" }}>
              Switch to GenLayer Bradbury Testnet
            </p>
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

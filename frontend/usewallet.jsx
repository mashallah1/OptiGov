import React, { useState, useCallback } from "react";

const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      setStatus("error");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      setAccount(accounts[0]);
      setStatus("connected");

      window.ethereum.on("accountsChanged", (newAccounts) => {
        if (!newAccounts.length) return disconnect();
        setAccount(newAccounts[0]);
      });

    } catch (err) {
      setError(err?.code === 4001 ? "Rejected by user." : err?.message ?? "Failed.");
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    account,
    status,
    error,
    connect,
    disconnect,
    shortAddress: shortenAddress(account),
    isConnected: status === "connected",
    isConnecting: status === "connecting",
  };
};

export const WalletButton = () => {
  const { connect, disconnect, isConnected, isConnecting, shortAddress, error } = useWallet();

  return (
    <div>
      {error && <p style={{ color: "red", fontSize: "0.8em" }}>{error}</p>}
      {isConnected ? (
        <button
          onClick={disconnect}
          className="bg-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-600"
        >
          {shortAddress} · Disconnect
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-500 disabled:opacity-50"
        >
          {isConnecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};
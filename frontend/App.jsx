import { useEffect, useState } from "react"
import { createAccount, createClient, testnetBradbury, TransactionStatus } from "genlayer-js"
import { useWallet, WalletButton } from "./usewallet"

const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

const account = createAccount(PRIVATE_KEY)

const client = createClient({
  chain: testnetBradbury,
  account: account,
})

function App() {
  const { account: walletAccount, isConnected, connect } = useWallet()
  const [status_msg, setStatus_msg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState("")

  const switchToGenLayer = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1F49" }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x1F49",
              chainName: "GenLayer Bradbury Testnet",
              nativeCurrency: {
                name: "GEN",
                symbol: "GEN",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.bradbury.genlayer.com"],
              blockExplorerUrls: ["https://studio.genlayer.com"],
            },
          ],
        })
      } else {
        throw err
      }
    }
  }

  const getClient = () =>
    createClient({
      chain: testnetBradbury,
      account: account,
    })

  const fetchStatus = async () => {
    try {
      const client = getClient()
      const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_status",
        args: [],
      })
      setStatus_msg(typeof data === "string" ? JSON.parse(data) : data)
    } catch (err) {
      console.error("Status fetch failed:", err)
    }
  }

  const sendTx = async (functionName, args = []) => {
    await switchToGenLayer()

    const client = getClient()
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      value: 0n,
    })

    await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
    })

    await fetchStatus()
  }

  const submitProposal = async () => {
    if (!proposal.trim()) return alert("Enter a proposal first!")
    setLoading(true)
    try {
      await sendTx("set_proposal", [proposal])
      setProposal("")
    } catch (err) {
      alert(err.message)
    }
    setLoading(false)
  }

  const evaluate = async () => {
    setLoading(true)
    try {
      await sendTx("evaluate")
    } catch (err) {
      alert(err.message)
    }
    setLoading(false)
  }

  const vote = async (decision) => {
    setLoading(true)
    try {
      await sendTx("vote", [decision])
    } catch (err) {
      alert(err.message)
    }
    setLoading(false)
  }

  const finalize = async () => {
    setLoading(true)
    try {
      await sendTx("finalize")
    } catch (err) {
      alert(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isConnected) fetchStatus()
  }, [account, isConnected])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">⚡ OptiGov</h1>
        <WalletButton />
      </div>

      {!isConnected ? (
        <div className="text-center py-10">
          <button
            onClick={connect}
            className="bg-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all"
          >
            Connect Wallet to Participate
          </button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-slate-400">
            Connected:{" "}
            <span className="text-blue-400 font-mono text-sm">
              {account}
            </span>
          </p>

          <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800">
            <h2 className="text-xl font-semibold mb-3">📝 Submit Proposal</h2>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="What is your proposal?"
              className="w-full p-4 mb-4 rounded-xl bg-slate-800 text-white border border-slate-700 resize-none h-28 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={submitProposal}
              disabled={loading}
              className="bg-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              📨 Submit Proposal
            </button>
          </div>

          {status_msg && (
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl mb-8 border border-slate-800">
              <h2 className="text-xl font-semibold mb-3">📊 Proposal Status</h2>
              <p className="text-slate-300 mb-4 italic bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                "{status_msg?.proposal || "No active proposal"}"
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  Decision:{" "}
                  <b
                    className={
                      status_msg?.decision === 1
                        ? "text-green-400"
                        : status_msg?.decision === 2
                        ? "text-red-400"
                        : ""
                    }
                  >
                    {status_msg?.decision === 1
                      ? "✅ Approve"
                      : status_msg?.decision === 2
                      ? "❌ Reject"
                      : "⏳ Pending"}
                  </b>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  Votes: <b>{status_msg?.votes}</b>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  Finalized: {status_msg?.finalized ? "✅" : "❌"}
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  Challenged: {status_msg?.challenged ? "⚠️" : "❌"}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={evaluate}
              disabled={loading}
              className="bg-purple-600 p-4 rounded-xl hover:bg-purple-500 disabled:opacity-50 font-medium transition-colors"
            >
              🤖 Run AI Evaluation
            </button>

            <button
              onClick={() => vote(1)}
              disabled={loading}
              className="bg-green-600 p-4 rounded-xl hover:bg-green-500 disabled:opacity-50 font-medium transition-colors"
            >
              👍 Approve
            </button>

            <button
              onClick={() => vote(2)}
              disabled={loading}
              className="bg-red-600 p-4 rounded-xl hover:bg-red-500 disabled:opacity-50 font-medium transition-colors"
            >
              👎 Reject
            </button>

            <button
              onClick={finalize}
              disabled={loading}
              className="bg-blue-600 p-4 rounded-xl hover:bg-blue-500 col-span-2 md:col-span-1 disabled:opacity-50 font-medium transition-colors"
            >
              🏁 Finalize
            </button>
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <p className="animate-pulse">Processing transaction...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
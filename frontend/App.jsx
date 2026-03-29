import { useEffect, useState } from "react"
import { createClient, createAccount } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
import { TransactionStatus } from "genlayer-js/types"
import { useWallet, WalletButton } from "./usewallet"

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

function App() {
  const { account, isConnected, connect } = useWallet()
  const [status_msg, setStatus_msg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState("")

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
    fetchStatus()
  }, [account])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">⚡ OptiGov</h1>
        <WalletButton />
      </div>

      {!isConnected ? (
        <button
          onClick={connect}
          className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 mb-6"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="mb-6 text-slate-400">Connected: {account}</p>
      )}

      <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800">
        <h2 className="text-xl font-semibold mb-3">📝 Submit Proposal</h2>
        <textarea
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          className="w-full p-4 mb-4 rounded-xl bg-slate-800 text-white border border-slate-700 resize-none h-28"
        />
        <button
          onClick={submitProposal}
          disabled={loading || !isConnected}
          className="bg-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
        >
          📨 Submit Proposal
        </button>
      </div>

      {status_msg && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl mb-8 border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">📊 Proposal Status</h2>
          <p className="text-slate-300 mb-4 italic">"{status_msg?.proposal}"</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-800 p-3 rounded-xl">
              Decision:{" "}
              <b>
                {status_msg?.decision === 1
                  ? "✅ Approve"
                  : status_msg?.decision === 2
                  ? "❌ Reject"
                  : "⏳ Pending"}
              </b>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Votes: <b>{status_msg?.votes}</b>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Finalized: {status_msg?.finalized ? "✅" : "❌"}
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Challenged: {status_msg?.challenged ? "⚠️" : "❌"}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={evaluate}
          disabled={loading || !isConnected}
          className="bg-purple-600 p-4 rounded-xl hover:bg-purple-500 disabled:opacity-50"
        >
          🤖 Run AI Evaluation
        </button>
        <button
          onClick={() => vote(1)}
          disabled={loading || !isConnected}
          className="bg-green-600 p-4 rounded-xl hover:bg-green-500 disabled:opacity-50"
        >
          👍 Approve
        </button>
        <button
          onClick={() => vote(2)}
          disabled={loading || !isConnected}
          className="bg-red-600 p-4 rounded-xl hover:bg-red-500 disabled:opacity-50"
        >
          👎 Reject
        </button>
        <button
          onClick={finalize}
          disabled={loading || !isConnected}
          className="bg-blue-600 p-4 rounded-xl hover:bg-blue-500 col-span-2 md:col-span-1 disabled:opacity-50"
        >
          🏁 Finalize
        </button>
      </div>

      {loading && (
        <p className="mt-6 text-blue-400 animate-pulse">
          ⏳ Processing transaction...
        </p>
      )}
    </div>
  )
}

export default App
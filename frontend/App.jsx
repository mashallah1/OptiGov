import { useEffect, useState } from "react"
import axios from "axios"
import { useWallet, WalletButton } from "./usewallet"

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

function App() {
  const { account: walletAccount, isConnected, connect } = useWallet()
  const [status_msg, setStatus_msg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState("")

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/status`)
      setStatus_msg(res.data.data || res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const submitProposal = async () => {
    if (!proposal.trim()) return alert("Enter a proposal first!")
    setLoading(true)
    try {
      await axios.post(`${API}/proposal`, { text: proposal })
      await fetchStatus()
      setProposal("")
    } catch (err) {
      alert("Failed to submit proposal")
    }
    setLoading(false)
  }

  const evaluate = async () => {
    setLoading(true)
    try {
      await axios.post(`${API}/evaluate`)
      await fetchStatus()
    } catch (err) { alert(err.message) }
    setLoading(false)
  }

  const vote = async (decision) => {
    setLoading(true)
    try {
      await axios.post(`${API}/vote`, { decision })
      await fetchStatus()
    } catch (err) { alert(err.message) }
    setLoading(false)
  }

  const finalize = async () => {
    setLoading(true)
    try {
      await axios.post(`${API}/finalize`)
      await fetchStatus()
    } catch (err) { alert(err.message) }
    setLoading(false)
  }

  useEffect(() => { fetchStatus() }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">⚡ OptiGov</h1>
        <WalletButton />
      </div>

      {!isConnected ? (
        <button onClick={connect} className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 mb-6">
          Connect Wallet
        </button>
      ) : (
        <p className="mb-6 text-slate-400">Connected: {walletAccount}</p>
      )}

      <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800">
        <h2 className="text-xl font-semibold mb-3">📝 Submit Proposal</h2>
        <textarea
          placeholder="Enter your proposal here..."
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          className="w-full p-4 mb-4 rounded-xl bg-slate-800 text-white border border-slate-700 resize-none h-28"
        />
        <button
          onClick={submitProposal}
          disabled={loading}
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
              Decision: <b>{status_msg?.decision === 1 ? "✅ Approve" : status_msg?.decision === 2 ? "❌ Reject" : "⏳ Pending"}</b>
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
        <button onClick={evaluate} disabled={loading} className="bg-purple-600 p-4 rounded-xl hover:bg-purple-500 disabled:opacity-50">
          🤖 Run AI Evaluation
        </button>
        <button onClick={() => vote(1)} disabled={loading} className="bg-green-600 p-4 rounded-xl hover:bg-green-500 disabled:opacity-50">
          👍 Approve
        </button>
        <button onClick={() => vote(2)} disabled={loading} className="bg-red-600 p-4 rounded-xl hover:bg-red-500 disabled:opacity-50">
          👎 Reject
        </button>
        <button onClick={finalize} disabled={loading} className="bg-blue-600 p-4 rounded-xl hover:bg-blue-500 col-span-2 md:col-span-1 disabled:opacity-50">
          🏁 Finalize
        </button>
      </div>

      {loading && (
        <p className="mt-6 text-blue-400 animate-pulse">⏳ Processing transaction...</p>
      )}
    </div>
  )
}

export default App
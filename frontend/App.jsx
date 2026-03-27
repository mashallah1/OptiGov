import { useEffect, useState } from "react"
import axios from "axios"
import { useWallet, WalletButton } from "./usewallet"
import deployment from "./deployment.json"

const API = "http://localhost:3000"

function App() {
  const { account, isConnected } = useWallet()
  const [proposal, setProposal] = useState(deployment.proposal || "")
  const [status_msg, setStatus_msg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/status`)
      setStatus_msg(res.data.data || res.data)
    } catch (err) {
      setError("Failed to fetch status: " + err.message)
    }
  }

  const evaluate = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/evaluate`, { proposal })
      await fetchStatus()
    } catch (err) {
      setError("Evaluate failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const vote = async (decision) => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/vote`, { decision })
      await fetchStatus()
    } catch (err) {
      setError("Vote failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const challenge = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/challenge`)
      await fetchStatus()
    } catch (err) {
      setError("Challenge failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const finalize = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/finalize`)
      await fetchStatus()
    } catch (err) {
      setError("Finalize failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">⚡ OptiGov</h1>
        <WalletButton />
      </div>

      {/* CONNECTED ACCOUNT */}
      {isConnected && (
        <p className="mb-6 text-slate-400">
          Connected: {account}
        </p>
      )}

      {/* ERROR */}
      {error && (
        <p className="mb-4 text-red-400">{error}</p>
      )}

      {/* PROPOSAL INPUT */}
      <div className="mb-6">
        <textarea
          placeholder="Enter your proposal here..."
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
      </div>

      {/* STATUS CARD */}
      {status_msg && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl mb-8 border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">Proposal Status</h2>

          <p className="text-lg mb-4">
            Status: <span className="font-bold text-blue-400">{status_msg.status}</span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-800 p-3 rounded-xl">
              Decision: <b>{status_msg.decision === 1 ? "Approve" : status_msg.decision === 2 ? "Reject" : "Pending"}</b>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Votes: <b>{status_msg.votes}</b>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Finalized: {status_msg.finalized ? "✅" : "❌"}
            </div>
            <div className="bg-slate-800 p-3 rounded-xl">
              Challenged: {status_msg.challenged ? "⚠️" : "❌"}
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        <button
          onClick={evaluate}
          disabled={loading}
          className="bg-purple-600 p-4 rounded-xl hover:bg-purple-500 disabled:opacity-50"
        >
          🤖 Run AI Evaluation
        </button>

        <button
          onClick={() => vote(1)}
          disabled={loading}
          className="bg-green-600 p-4 rounded-xl hover:bg-green-500 disabled:opacity-50"
        >
          👍 Vote Approval
        </button>

        <button
          onClick={() => vote(2)}
          disabled={loading}
          className="bg-red-600 p-4 rounded-xl hover:bg-red-500 disabled:opacity-50"
        >
          👎 Vote Reject
        </button>

        <button
          onClick={challenge}
          disabled={loading}
          className="bg-yellow-600 p-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50"
        >
          ⚔️ Dispute Result
        </button>

        <button
          onClick={finalize}
          disabled={loading}
          className="bg-blue-600 p-4 rounded-xl hover:bg-blue-500 col-span-2 md:col-span-1 disabled:opacity-50"
        >
          🏁 Finalise Decision
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="mt-6 text-blue-400 animate-pulse">
          Processing transaction...
        </p>
      )}
    </div>
  )
}

export default App

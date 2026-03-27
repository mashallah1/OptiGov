import { useEffect, useState } from "react"
import axios from "axios"
import { useWallet, WalletButton } from "./usewallet";
import deployment from "./deployment.json"
const API = "http://localhost:3000"

function App() {
  const { account, isConnected, status } = useWallet()
  const [status_msg, setStatus_msg] = useState(null);
  // 📊 Fetch status
  const fetchStatus = async () => {
    const res = await axios.get(`${API}/status`)
    setStatus_msg(res.data.data || res.data);
  }

  // 🤖 Evaluate
  const evaluate = async () => {
    await axios.post(`${API}/evaluate`)
    fetchStatus()
  }

  // 🗳️ Vote
  const vote = async (decision) => {
    await axios.post(`${API}/vote`, { decision })
    fetchStatus()
  }

  // ⚔️ Challenge
  const challenge = async () => {
    await axios.post(`${API}/challenge`)
    fetchStatus()
  }

  // 🏁 Finalize
  const finalize = async () => {
    await axios.post(`${API}/finalize`)
    fetchStatus()
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="container">      
      <header>
        <h1>OptiGov</h1>
        <WalletButton />
      </header>
        {isConnected ? (
          <div>
            <p>Welcome! Your wallet {account} is connected.</p>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-500"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* CARD */}
      {status && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Proposal</h2>
          <p className="mb-4 text-slate-300">{status_msg.status}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>Decision: <b>{status_msg.decision}</b></div>
            <div>Votes: <b>{status_msg.votes}</b></div>
            <div>Finalized: {status_msg.finalized ? "✅" : "❌"}</div>
            <div>Challenged: {status_msg.challenged ? "⚠️" : "❌"}</div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button onClick={evaluate} className="btn bg-purple-600">
          🤖 Evaluate
        </button>

        <button onClick={() => vote(1)} className="btn bg-green-600">
          👍 Approve
        </button>

        <button onClick={() => vote(2)} className="btn bg-red-600">
          👎 Reject
        </button>

        <button onClick={challenge} className="btn bg-yellow-600">
          ⚔️ Challenge
        </button>

        <button onClick={finalize} className="btn bg-blue-600">
          🏁 Finalize
        </button>
      </div>
    </div>
  )
}

export default App

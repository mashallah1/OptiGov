import { useEffect, useState } from "react"
import axios from "axios"
import { createWalletClient, custom } from "viem"
import { mainnet } from "viem/chains"
import deployment from "./deployment.json"
const API = "http://localhost:3000"

function App() {
  const [status, setStatus] = useState(null)
  const [account, setAccount] = useState(null)
  const [walletClient, setWalletClient] = useState(null)

  // 🔌 Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask")
      return
    }

    const client = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    })

    const [address] = await client.requestAddresses()

    setAccount(address)
    setWalletClient(client)
  }

  // 📊 Fetch status
  const fetchStatus = async () => {
    const res = await axios.get(`${API}/status`)
    setStatus(res.data.data || res.data)
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
    <div className="min-h-screen bg-slate-950 text-white p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🧠 OptiGov</h1>

        {account ? (
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-sm">
            {account.slice(0,6)}...{account.slice(-4)}
          </div>
        ) : (
          <button
            onClick={connectWallet}
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
          <p className="mb-4 text-slate-300">{status.proposal}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>Decision: <b>{status.decision}</b></div>
            <div>Votes: <b>{status.votes}</b></div>
            <div>Finalized: {status.finalized ? "✅" : "❌"}</div>
            <div>Challenged: {status.challenged ? "⚠️" : "❌"}</div>
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

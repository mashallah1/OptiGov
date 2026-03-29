import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "https://opti-gov.vercel.app" }));

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const contractABI = [
  { name: "get_status", type: "function", inputs: [], outputs: [{ type: "string" }] },
  { name: "evaluate", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "vote", type: "function", inputs: [{ name: "my_decision", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "finalize", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "set_proposal", type: "function", inputs: [{ name: "proposal", type: "string" }], outputs: [] }
];

const publicClient = createPublicClient({
  transport: http("https://rpc.bradbury.genlayer.com")
});

if (!process.env.MY_PRIVATE_KEY) {
  throw new Error("MY_PRIVATE_KEY not set");
}

const account = privateKeyToAccount(process.env.MY_PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  transport: http("https://rpc.bradbury.genlayer.com")
});

let state = {
  proposal: "No proposal yet",
  decision: 0,
  votes: 0,
  finalized: false
};

app.get("/status", async (req, res) => {
  try {
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "get_status",
      args: [],
    });

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    state = parsed;

    res.json({ success: true, data: parsed });
  } catch (error) {
    res.json({ success: true, data: state, fallback: true });
  }
});

app.post("/evaluate", async (req, res) => {
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "evaluate",
      args: [],
    });

    res.json({ success: true, transactionHash: hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/vote", async (req, res) => {
  try {
    const { decision } = req.body;

    if (decision === undefined) {
      return res.status(400).json({
        success: false,
        error: "Decision required"
      });
    }

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "vote",
      args: [decision],
    });

    res.json({ success: true, transactionHash: hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/finalize", async (req, res) => {
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "finalize",
      args: [],
    });

    res.json({ success: true, transactionHash: hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/proposal", async (req, res) => {
  try {
    const { text } = req.body;

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "set_proposal",
      args: [text],
    });

    res.json({ success: true, hash });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.listen(port, () => {
  console.log(`🚀 OptiGov running on port ${port}`);
});
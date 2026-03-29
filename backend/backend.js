import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPublicClient, http } from "viem";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
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
  { name: "set_proposal", type: "function", inputs: [{ name: "text", type: "string" }], outputs: [{ type: "bool" }] },
];

const publicClient = createPublicClient({
  transport: http("https://rpc.bradbury.genlayer.com")
});

const glWrite = async (functionName, args = "") => {
  const cmd = `genlayer write ${CONTRACT_ADDRESS} ${functionName}${args ? " " + args : ""}`;
  console.log("Running:", cmd);
  const { stdout, stderr } = await execAsync(cmd);
  if (stderr && stderr.includes("Error")) throw new Error(stderr);
  return stdout;
};

let state = {
  proposal: "No proposal yet",
  decision: 0,
  votes: 0,
  finalized: false,
  challenged: false
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
  } catch {
    res.json({ success: true, data: state, fallback: true });
  }
});

app.post("/proposal", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Proposal text is required" });
    }
    const result = await glWrite("set_proposal", `--args "${text}"`);
    state.proposal = text;
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/evaluate", async (req, res) => {
  try {
    const result = await glWrite("evaluate");
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/vote", async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision || ![1, 2].includes(Number(decision))) {
      return res.status(400).json({ success: false, error: "Decision must be 1 or 2" });
    }
    const result = await glWrite("vote", `--args ${decision}`);
    state.votes += 1;
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/finalize", async (req, res) => {
  try {
    const result = await glWrite("finalize");
    state.finalized = true;
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => console.log(`🚀 OptiGov running on port ${port}`));
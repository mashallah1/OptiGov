import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "https://opti-gov.vercel.app" }));

app.set("json replacer", (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const client = createClient({ chain: testnetBradbury });
const account = createAccount(process.env.PRIVATE_KEY);

const glWrite = async (functionName, args = []) => {
  const txHash = await client.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0,
  });
  return { txHash };
};

const glRead = async (functionName, args = []) => {
  return await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: "accepted",
  });
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
    const data = await glRead("get_status");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    state = parsed;
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("Status error:", err);
    res.json({ success: true, data: state, fallback: true });
  }
});

app.post("/proposal", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Proposal text is required" });
    }
    const receipt = await glWrite("set_proposal", [text]);
    if (state) state.proposal = text;
    res.json({ success: true, receipt });
  } catch (err) {
    console.error("Proposal error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/evaluate", async (req, res) => {
  try {
    const receipt = await glWrite("evaluate");
    res.json({ success: true, receipt });
  } catch (err) {
    console.error("Evaluate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/vote", async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision || ![1, 2].includes(Number(decision))) {
      return res.status(400).json({ success: false, error: "Decision must be 1 or 2" });
    }
    const receipt = await glWrite("vote", [Number(decision)]);
    state.votes += 1;
    res.json({ success: true, receipt });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/finalize", async (req, res) => {
  try {
    const receipt = await glWrite("finalize");
    state.finalized = true;
    res.json({ success: true, receipt });
  } catch (err) {
    console.error("Finalize error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => console.log(`🚀 OptiGov running on port ${port}`));

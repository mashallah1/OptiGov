import "dotenv/config";
import express from "express";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ✅ Correct RPC
const publicClient = createPublicClient({
    transport: http("https://rpc.bradbury.genlayer.com")
});

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = createWalletClient({
    account,
    transport: http("https://rpc.bradbury.genlayer.com")
});

// fallback state
let state = {
    proposal: "No proposal yet",
    decision: 0,
    votes: 0,
    finalized: false,
    challenged: false
};

// ✅ GET status (fallback-safe)
app.get("/status", async (req, res) => {
    try {
        try {
            const data = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                functionName: "get_status",
                args: [],
            });

            const parsed = typeof data === "string" ? JSON.parse(data) : data;

            state = parsed; // update cache if works

            return res.json({ success: true, data: parsed });
        } catch (rpcError) {
            // fallback if RPC fails
            return res.json({
                success: true,
                data: state,
                fallback: true
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ POST evaluate
app.post("/evaluate", async (req, res) => {
    try {
        const { proposal } = req.body;
        state.proposal = proposal || state.proposal;
        const account = privateKeyToAccount(process.env.PRIVATE_KEY);

        const hash = await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: "evaluate",
            args: [],
            account
        });

        // update mock state
        state.decision = 1;

        res.json({
            success: true,
            transactionHash: hash,
            state
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ POST vote
app.post("/vote", async (req, res) => {
    try {
        const { decision } = req.body;

        state.decision = decision;

        const account = privateKeyToAccount(process.env.PRIVATE_KEY);

        await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: "vote",
            args: [decision],
            account
        });

        state.votes += 1;

        res.json({ success: true, state });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ POST challenge
app.post("/challenge", async (req, res) => {
    try {
        state.challenged = true
        const account = privateKeyToAccount(process.env.PRIVATE_KEY);

        await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: "challenge",
            args: [],
            account
        });

        state.challenged = true;

        res.json({ success: true, state });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ POST finalize
app.post("/finalize", async (req, res) => {
    try {
        state.finalized = true;
        const account = privateKeyToAccount(process.env.PRIVATE_KEY);

        await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: "finalize",
            args: [],
            account
        });

        state.finalized = true;

        res.json({ success: true, state });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 OptiGov Backend running at http://localhost:${port}`);
});
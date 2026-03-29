# OptiGov

A governance prototype combining AI-assisted evaluation with community voting, built on GenLayer with a hybrid backend architecture.

## 🌐 Links

* Frontend: https://opti-gov.vercel.app/
* Backend API: https://optigov.onrender.com
* Network: GenLayer Bradbury Testnet
* Contract Address: 0x6f3b0849c92e8A91DdDD304b5C616CBebfd137bE

## 🧠 Overview

OptiGov is a governance system where:

1. A proposal is submitted
2. It is evaluated (simulated AI logic in backend)
3. Users vote on the outcome
4. The result can be challenged and finalized

The project includes a GenLayer smart contract that implements AI-based evaluation logic, but due to RPC read limitations on the Bradbury testnet, the live application uses a backend state layer for reliability.


## ⚙️ Current Implementation

### What works on-chain

* Contract deployment on GenLayer
* Write operations (e.g. `evaluate()`) can be executed

### What is handled off-chain (backend)

* Proposal storage
* Status retrieval (`/status`)
* Voting state
* Challenge & finalize state

This hybrid approach ensures the app remains functional despite testnet limitations.

## 🔑 Features

### 🤖 Proposal Evaluation

* Users submit a proposal via the frontend
* Backend simulates evaluation logic
* Contract version exists but is not used for live reads

### 🗳️ Voting

* Users can vote approve/reject
* Votes are tracked in backend state

### ⚔️ Challenge

* Users can challenge a decision
* Updates state accordingly

### 🏁 Finalization

* Marks the proposal as finalized

### 🔐 Wallet Connection

* Basic wallet connection via frontend
* Used for identity display (not strict enforcement)


## 🏗️ Architecture

```
Frontend (React + Vite)
↓
Backend (Express API)  ← primary state layer
↓
GenLayer Contract (writes only / experimental)
```

### Stack

* **Frontend:** React, Vite, TailwindCSS
* **Backend:** Node.js, Express
* **Blockchain:** GenLayer (Bradbury Testnet)
* **Client:** viem

## 📡 API Endpoints

| Method | Endpoint   | Description                |
| ------ | ---------- | -------------------------- |
| GET    | /status    | Get current proposal state |
| POST   | /evaluate  | Submit + evaluate proposal |
| POST   | /vote      | Vote on proposal           |
| POST   | /challenge | Challenge result           |
| POST   | /finalize  | Finalize proposal          |


## 📜 Smart Contract (GenLayer)

A Python-based contract implementing:

* AI evaluation via `gl.nondet.exec_prompt`
* Deterministic consensus via `eq_principle.strict_eq`
* Voting, challenge, and finalize logic

⚠️ Note:
Contract read methods (e.g. `get_status`) are currently unreliable via RPC, so the frontend does not depend on them.


## 🚀 Running Locally

### Backend

```
cd backend
npm install
cp .env.example .env
npm start
```

### Frontend

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🔐 Environment Variables

### Backend `.env`

```
MY_PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address
PORT=3000
```

### Frontend `.env`

```
VITE_BACKEND_URL=http://localhost:3000
```

## 🧪 Notes

* The project demonstrates integration between AI logic and governance workflows
* Backend currently mirrors contract behavior for reliability
* Designed as a prototype for GenLayer-based intelligent contracts

## 👤 Author

Built for the GenLayer Hackathon by @mashallah1

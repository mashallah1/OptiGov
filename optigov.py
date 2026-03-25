# v0.2.3
# {"Depends": "py-genlayer:15qfivjvy80800rh998pcxmd2m8va1wq2qzqhz850n8ggcr4i9q0"}

from genlayer import *
import json

MAX_PROPOSAL_LENGTH = 1000
MAX_HASHTAGS = 10
CHALLENGE_WINDOW = 86400
QUORUM_THRESHOLD = 3

DECISION_NEEDS_REVIEW = u256(0)
DECISION_ACCEPT = u256(1)
DECISION_REJECT = u256(2)


class OptiGov(gl.Contract):

    proposal: str
    proposer: str
    owner: str

    decision: u256
    challenged: bool
    finalized: bool

    max_length: u256
    max_hashtags: u256
    quorum: u256

    vote_count: u256
    votes: TreeMap[str, u256]

    created_at: u256
    challenge_deadline: u256

    authorized_voters: DynArray[str]
    log: DynArray[str]

    def __init__(self):
        caller = str(gl.message.sender_address)

        self.proposal = "Test proposal"
        self.proposer = caller
        self.owner = caller

        self.decision = DECISION_NEEDS_REVIEW
        self.challenged = False
        self.finalized = False

        self.max_length = u256(MAX_PROPOSAL_LENGTH)
        self.max_hashtags = u256(MAX_HASHTAGS)
        self.quorum = u256(QUORUM_THRESHOLD)

        self.vote_count = u256(0)
        self.votes = TreeMap[str, u256]()

        # ❌ DO NOT use timestamp here
        self.created_at = u256(0)
        self.challenge_deadline = u256(0)

        self.authorized_voters = DynArray[str]([caller])
        self.log = DynArray[str]()

        self._append_log("CREATED")

    # ───────── Helpers ─────────

    def _init_time_if_needed(self):
        if int(self.created_at) == 0:
            now = u256(gl.block.timestamp)
            self.created_at = now
            self.challenge_deadline = u256(int(now) + CHALLENGE_WINDOW)

    def _only_owner(self):
        assert gl.message.sender_address == self.owner, "Not owner"

    def _only_voter(self):
        found = False
        for v in self.authorized_voters:
            if v == gl.message.sender_address:
                found = True
        assert found, "Not authorized voter"

    def _not_finalized(self):
        assert not self.finalized, "Already finalized"

    def _append_log(self, entry: str):
        self.log.append(entry)

    def _safe_json(self, raw: str) -> dict:
        try:
            return json.loads(raw.strip())
        except:
            return {"decision": 0}

    def _run_ai(self, prompt: str) -> dict:
        def call_ai():
            raw = gl.nondet.exec_prompt(prompt)
            return self._safe_json(raw)
        return gl.eq_principle.strict_eq(call_ai)

    def _validate_ai_decision(self, result: dict) -> u256:
        d = int(result.get("decision", 0))
        assert d in (0, 1, 2), "Invalid AI output"
        return u256(d)

    def _pre_check(self) -> bool:
        p = self.proposal
        return (
            len(p) <= int(self.max_length)
            and p.count("#") <= int(self.max_hashtags)
            and len(p.strip()) > 0
            and "<script" not in p.lower()
        )

    # ───────── Core ─────────

    @gl.public.write
    def evaluate(self) -> u256:

        self._init_time_if_needed()
        self._not_finalized()
        self._only_voter()

        if int(self.decision) != 0:
            return self.decision

        if not self._pre_check():
            self.decision = DECISION_REJECT
            return self.decision

        prompt = f"""Evaluate:

{self.proposal}

Return:
{{"decision": 0|1|2}}
"""

        result = self._run_ai(prompt)
        self.decision = self._validate_ai_decision(result)

        return self.decision

    @gl.public.write
    def vote(self, my_decision: int) -> bool:

        self._init_time_if_needed()
        self._not_finalized()
        self._only_voter()

        assert my_decision in (1, 2), "Invalid decision"

        caller = gl.message.sender_address

        assert self.votes.get(caller) is None, "Already voted"

        self.votes[caller] = u256(my_decision)
        self.vote_count = u256(int(self.vote_count) + 1)

        return True

    @gl.public.write
    def finalize(self) -> u256:

        self._init_time_if_needed()
        self._not_finalized()
        self._only_voter()

        assert int(self.vote_count) >= int(self.quorum), "No quorum"

        self.finalized = True
        return self.decision

    # ───────── Views ─────────

    @gl.public.view
    def get_status(self) -> str:
        return json.dumps({
            "proposal": self.proposal,
            "decision": int(self.decision),
            "votes": int(self.vote_count),
            "finalized": self.finalized,
        })
# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import json
import typing
import genlayer as gl
from genlayer.types import *


class RWAGuardian(gl.contract.Contract):
    asset_name: str
    asset_type: str
    source_url: str
    status: str
    score: u256
    summary: str
    last_checked: str
    verification_count: u256

    def __init__(self, asset_name: str, asset_type: str, source_url: str):
        self.asset_name = asset_name
        self.asset_type = asset_type
        self.source_url = source_url
        self.status = "UNVERIFIED"
        self.score = 0
        self.summary = "Asset has not been independently checked yet."
        self.last_checked = "Never"
        self.verification_count = 0

    @gl.public.view
    def get_asset(self) -> dict[str, typing.Any]:
        return {
            "asset_name": self.asset_name,
            "asset_type": self.asset_type,
            "source_url": self.source_url,
            "status": self.status,
            "score": self.score,
            "summary": self.summary,
            "last_checked": self.last_checked,
            "verification_count": self.verification_count,
        }

    @gl.public.write
    def update_asset(self, asset_name: str, asset_type: str, source_url: str) -> None:
        self.asset_name = asset_name
        self.asset_type = asset_type
        self.source_url = source_url
        self.status = "UNVERIFIED"
        self.score = 0
        self.summary = "Asset details updated. Run a new verification."
        self.last_checked = "Never"

    @gl.public.write
    def verify_asset(self) -> str:
        asset_name = self.asset_name
        asset_type = self.asset_type
        source_url = self.source_url

        def evaluate_asset() -> str:
            page = gl.nondet.web.render(source_url, mode="text")

            prompt = f"""
You are the independent verifier for an RWA verification registry.

Asset name: {asset_name}
Asset type: {asset_type}
Evidence URL: {source_url}

Review the evidence page below. Determine whether the page provides
credible, relevant evidence connected to the named asset or asset type.
Do not invent facts that are not supported by the page.

Return ONLY valid JSON with exactly these fields:
{{
  "status": "VERIFIED" | "REVIEW" | "UNVERIFIED",
  "score": integer from 0 to 100,
  "summary": "short explanation"
}}

Use VERIFIED when the page provides strong relevant evidence.
Use REVIEW when there is some relevant evidence but important uncertainty.
Use UNVERIFIED when the page does not provide sufficient relevant evidence.

Evidence page:
{page}
"""

            result = gl.nondet.exec_prompt(prompt)
            result = result.replace("```json", "").replace("```", "")
            parsed = json.loads(result)

            clean = {
                "status": str(parsed["status"]),
                "score": int(parsed["score"]),
                "summary": str(parsed["summary"]),
            }
            return json.dumps(clean, sort_keys=True)

        final_result = gl.eq_principle.strict_eq(evaluate_asset)
        result_json = json.loads(final_result)

        self.status = result_json["status"]
        self.score = result_json["score"]
        self.summary = result_json["summary"]
        self.last_checked = "Latest GenLayer verification"
        self.verification_count = self.verification_count + 1

        return final_result

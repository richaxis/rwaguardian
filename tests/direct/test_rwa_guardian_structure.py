from pathlib import Path

CONTRACT = Path(__file__).parents[2] / "contracts" / "rwa_guardian.py"

def test_rwa_guardian_contract_file_exists():
    assert CONTRACT.exists()

def test_rwa_guardian_has_required_public_methods():
    source = CONTRACT.read_text(encoding="utf-8")
    assert "class RWAGuardian" in source
    assert "def get_asset" in source
    assert "def update_asset" in source
    assert "def verify_asset" in source

def test_rwa_guardian_uses_genlayer_verification_primitives():
    source = CONTRACT.read_text(encoding="utf-8")
    assert "gl.nondet.web.render" in source
    assert "gl.nondet.exec_prompt" in source
    assert "gl.eq_principle.strict_eq" in source

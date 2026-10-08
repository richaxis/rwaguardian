"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { createTransactionKit } from "@genlayer/transaction-kit";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type Asset = {
  asset_name: string;
  asset_type: string;
  source_url: string;
  status: string;
  score: number | bigint;
  summary: string;
  last_checked: string;
  verification_count: number | bigint;
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
}

const CONTRACT = CONTRACT_ADDRESS as `0x${string}`;
const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio-dev.genlayer.com/api";

function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "verified") return "verified";
  if (s === "review") return "review";
  return "unverified";
}

export default function Home() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tx, setTx] = useState("");
  const [form, setForm] = useState({
    name: "Treasury Bill RWA #001",
    type: "Government Bond",
    url: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates",
  });

  const reader = useMemo(() => {
    return createClient({ chain: studioDevnet });
  }, []);

  async function loadAsset() {
    if (!CONTRACT) {
      setMessage("Add your deployed contract address to NEXT_PUBLIC_CONTRACT_ADDRESS.");
      return;
    }
    try {
      const result: any = await reader.readContract({
        address: CONTRACT as `0x${string}`,
        functionName: "get_asset",
        args: [],
      });
      setAsset({
        ...result,
        score: Number(result.score),
        verification_count: Number(result.verification_count),
      });
      setMessage("");
    } catch (e: any) {
      setMessage(`Could not read the contract yet: ${e?.message || "unknown error"}`);
    }
  }

  useEffect(() => {
    loadAsset();
    const timer = setInterval(loadAsset, 10000);
    return () => clearInterval(timer);
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      setMessage("Install MetaMask or another EIP-1193 wallet to write to GenLayer.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0];
      setWallet(address || "");

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xf22d" }],
        });
      } catch (switchError: any) {
        if (switchError?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xf22d",
              chainName: "GenLayer Studio Next",
              nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
              rpcUrls: [RPC],
              blockExplorerUrls: ["https://explorer-studio-dev.genlayer.com/"],
            }],
          });
        } else {
          throw switchError;
        }
      }

      setMessage("Wallet connected.");
    } catch (e: any) {
      setMessage(e?.message || "Wallet connection failed.");
    }
  }

  function makeKit() {
    if (!window.ethereum || !wallet) throw new Error("Connect your wallet first.");
    return createTransactionKit({
      chain: studioDevnet,
      provider: window.ethereum,
      account: wallet as `0x${string}`,
    });
  }

  async function sendWrite(method: string, args: any[]) {
    setLoading(true);
    setMessage("");
    setTx("");
    try {
      const kit = makeKit();
      const quote = await kit.estimate(
        { preset: "standard" },
        { kind: "write", address: CONTRACT, method, args }
      );
      const submitted = await kit.submit(quote, {
        kind: "write",
        address: CONTRACT,
        method,
        args,
      });
      setTx(submitted.genlayerTxId);
      setMessage("Transaction submitted. GenLayer is processing the request.");
      await kit.track(submitted.genlayerTxId, (status: any) => {
        setMessage(`GenLayer status: ${status.phase || status.statusName || "processing"}…`);
      });
      setMessage("Transaction completed. Refreshing asset state.");
      await loadAsset();
    } catch (e: any) {
      setMessage(e?.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateAsset() {
    if (!CONTRACT) return;
    await sendWrite("update_asset", [form.name, form.type, form.url]);
  }

  async function verifyAsset() {
    if (!CONTRACT) return;
    await sendWrite("verify_asset", []);
  }

  const score = asset ? Number(asset.score) : 0;

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="brandMark">R</span>
          RWA Guardian
        </div>
        <div className="navRight">
          <span className="pill">GENLAYER · STUDIO NEXT</span>
          <button className="connect" onClick={connectWallet}>
            {wallet ? shortAddress(wallet) : "Connect wallet"}
          </button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">Intelligent verification layer for RWAs</div>
          <h1>Real assets.<br />Verified onchain.</h1>
          <p>
            RWA Guardian uses a GenLayer Intelligent Contract to review public
            evidence about a real-world asset and turn that judgment into
            persistent onchain state.
          </p>
          <div className="ctas">
            <button className="primary" onClick={verifyAsset} disabled={loading || !CONTRACT}>
              {loading ? "Verifying…" : "Verify asset"}
            </button>
            <a className="secondary" href="#asset">View asset</a>
          </div>
          {message && <div className="notice" style={{ marginTop: 18 }}>{message}</div>}
          {tx && <div className="tx">TX: {tx}</div>}
        </div>

        <div className="heroCard">
          <div className="signal">LIVE VERIFICATION SIGNAL</div>
          <div className="score">{score}</div>
          <div className="scoreLabel">RWA confidence score / 100</div>
          <div className="status">
            {asset?.status || "WAITING FOR CONTRACT"}
          </div>
        </div>
      </section>

      <section className="section" id="asset">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Asset registry</div>
            <h2>One asset. One source of truth.</h2>
          </div>
          <div className="muted">GenLayer consensus powered</div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="assetTop">
              <div>
                <div className="assetTitle">{asset?.asset_name || "RWA Guardian demo asset"}</div>
                <div className="type">{asset?.asset_type || "Waiting for contract"}</div>
              </div>
              <span className={`badge ${statusClass(asset?.status || "UNVERIFIED")}`}>
                {asset?.status || "UNVERIFIED"}
              </span>
            </div>

            <div className="metrics">
              <div className="metric">
                <div className="metricValue">{score}</div>
                <div className="metricLabel">SCORE</div>
              </div>
              <div className="metric">
                <div className="metricValue">{asset?.verification_count ?? 0}</div>
                <div className="metricLabel">CHECKS</div>
              </div>
              <div className="metric">
                <div className="metricValue">{asset?.last_checked === "Never" ? "—" : "LIVE"}</div>
                <div className="metricLabel">EVIDENCE</div>
              </div>
            </div>

            <div className="summary">
              {asset?.summary || "Deploy the contract, add its address to Vercel, then this panel will read the asset state directly from GenLayer."}
            </div>

            {asset?.source_url && (
              <a
                className="muted"
                href={asset.source_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12 }}
              >
                Open evidence source ↗
              </a>
            )}
          </div>

          <div className="card">
            <div className="eyebrow">Admin / demo controls</div>
            <h2 style={{ margin: "12px 0 22px", fontSize: 28, letterSpacing: "-.05em" }}>
              Configure the RWA
            </h2>

            <div className="form">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Asset name"
              />
              <input
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Asset type"
              />
              <input
                className="input"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="Evidence URL"
              />
              <button className="action" onClick={updateAsset} disabled={loading || !CONTRACT}>
                Save asset
              </button>
              <button className="secondary" onClick={verifyAsset} disabled={loading || !CONTRACT}>
                Run GenLayer verification
              </button>
            </div>

            <div className="notice" style={{ marginTop: 18 }}>
              Verification is not a claim that the underlying asset legally exists.
              It is a demo of an Intelligent Contract evaluating public evidence and
              storing the resulting status on GenLayer.
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>RWA GUARDIAN / BUILT ON GENLAYER</span>
        <span>STUDIO NEXT · CHAIN 61997</span>
      </footer>
    </main>
  );
}

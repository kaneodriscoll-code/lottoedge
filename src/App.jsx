import { useState, useEffect } from "react";

// ── Minimal Saturday Lotto draw simulator ──────────────────────────────────
// Real app would fetch from API / CSV. We seed a deterministic PRNG so the
// demo produces consistent, realistic-looking results.
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateDraws(numDraws = 522) {
  const rand = seededRand(20160101);
  const draws = [];
  for (let i = 0; i < numDraws; i++) {
    const pool = Array.from({ length: 45 }, (_, k) => k + 1);
    const draw = [];
    for (let j = 0; j < 6; j++) {
      const idx = Math.floor(rand() * pool.length);
      draw.push(pool.splice(idx, 1)[0]);
    }
    const supps = [];
    for (let j = 0; j < 2; j++) {
      const idx = Math.floor(rand() * pool.length);
      supps.push(pool.splice(idx, 1)[0]);
    }
    draws.push({ main: draw.sort((a, b) => a - b), supps });
  }
  return draws;
}

const DRAWS = generateDraws(522);

// ── Combination generator ──────────────────────────────────────────────────
function combinations(arr, r) {
  const result = [];
  function helper(start, current) {
    if (current.length === r) { result.push([...current]); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      helper(i + 1, current);
      current.pop();
    }
  }
  helper(0, []);
  return result;
}

// ── Division checker ──────────────────────────────────────────────────────
function checkDivision(combo, draw) {
  const mainHits = combo.filter(n => draw.main.includes(n)).length;
  const suppHits = combo.filter(n => draw.supps.includes(n)).length;
  if (mainHits === 6) return 1;
  if (mainHits === 5 && suppHits >= 1) return 2;
  if (mainHits === 5) return 3;
  if (mainHits === 4) return 4;
  if (mainHits === 3 && suppHits >= 1) return 5;
  if (mainHits === 1 && suppHits >= 2) return 6;
  return null;
}

// ── Avg division payouts (AUD estimates) ──────────────────────────────────
const DIV_PAYOUTS = { 1: 1000000, 2: 6000, 3: 450, 4: 30, 5: 15, 6: 10 };
const DIV_LABELS = { 1: "Div 1", 2: "Div 2", 3: "Div 3", 4: "Div 4", 5: "Div 5", 6: "Div 6" };

// ── Backtest engine ───────────────────────────────────────────────────────
function backtest(numbers, systemSize, costPerEntry = 1.35) {
  const combos = combinations(numbers, 6);
  const numCombos = combos.length;
  const totalDraws = DRAWS.length;
  const costPerDraw = numCombos * costPerEntry;
  const totalCost = costPerDraw * totalDraws;

  const divCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let totalPrize = 0;

  DRAWS.forEach(draw => {
    combos.forEach(combo => {
      const div = checkDivision(combo, draw);
      if (div) {
        divCounts[div]++;
        totalPrize += DIV_PAYOUTS[div];
      }
    });
  });

  const netReturn = totalPrize - totalCost;
  const roi = ((totalPrize / totalCost) * 100).toFixed(1);

  return { divCounts, totalPrize, totalCost, netReturn, roi, numCombos, costPerDraw };
}

// ── Number frequency analysis ─────────────────────────────────────────────
function getFrequency() {
  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  DRAWS.forEach(d => d.main.forEach(n => freq[n]++));
  return freq;
}

const FREQ = getFrequency();

// ── Parse number input ────────────────────────────────────────────────────
function parseNumbers(str) {
  return str.split(/[\s,]+/).map(Number).filter(n => n >= 1 && n <= 45);
}

// ── Colour helpers ────────────────────────────────────────────────────────
const accent = "#00ff87";
const accent2 = "#00c8ff";
const warn = "#ff6b35";
const bg = "#0a0a0f";
const card = "#111118";
const border = "#1e1e2e";

// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const presets = [
    { label: "Set A", numbers: "9,10,13,17,21,28,33,42" },
    { label: "Set B", numbers: "1,9,13,16,33,34,42,45" },
    { label: "Set C ★", numbers: "5,6,8,29,30,37,38,44" },
  ];

  const [sets, setSets] = useState(presets.map(p => ({ ...p, result: null, error: "" })));
  const [activeTab, setActiveTab] = useState("backtest");
  const [comparing, setComparing] = useState(false);

  function runBacktest(idx) {
    const nums = parseNumbers(sets[idx].numbers);
    if (nums.length < 6 || nums.length > 12) {
      setSets(prev => prev.map((s, i) => i === idx ? { ...s, error: "Enter 6–12 unique numbers (1–45)" } : s));
      return;
    }
    const result = backtest(nums, nums.length);
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, result, error: "" } : s));
  }

  function runAll() {
    setComparing(true);
    sets.forEach((_, i) => runBacktest(i));
  }

  const freqEntries = Object.entries(FREQ).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: bg,
      minHeight: "100vh",
      color: "#e0e0f0",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .ball {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%;
          font-size: 11px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.15);
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: #e0e0f0; margin: 2px;
          transition: all 0.2s;
        }
        .ball.hot { background: linear-gradient(135deg, #00ff87 0%, #00c8ff 100%); color: #000; border-color: transparent; }
        .tab { cursor: pointer; padding: 8px 20px; border-radius: 4px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid transparent; transition: all 0.2s; }
        .tab.active { border-color: ${accent}; color: ${accent}; }
        .tab:hover:not(.active) { border-color: #333; }
        .set-card { background: ${card}; border: 1px solid ${border}; border-radius: 8px; padding: 20px; margin-bottom: 16px; transition: border-color 0.2s; }
        .set-card:hover { border-color: #2e2e4e; }
        .input-field { background: #0d0d18; border: 1px solid ${border}; border-radius: 4px; padding: 10px 14px; color: #e0e0f0; font-family: 'DM Mono', monospace; font-size: 13px; width: 100%; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: ${accent}; }
        .btn-primary { background: ${accent}; color: #000; border: none; border-radius: 4px; padding: 9px 20px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary { background: transparent; color: ${accent2}; border: 1px solid ${accent2}; border-radius: 4px; padding: 9px 20px; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(0,200,255,0.08); }
        .stat-box { background: #0d0d18; border: 1px solid ${border}; border-radius: 6px; padding: 14px 16px; flex: 1; min-width: 100px; }
        .positive { color: ${accent}; }
        .negative { color: ${warn}; }
        .neutral { color: ${accent2}; }
        .div-bar { height: 4px; border-radius: 2px; background: linear-gradient(90deg, ${accent}, ${accent2}); margin-top: 4px; }
        .freq-bar { height: 3px; border-radius: 2px; background: linear-gradient(90deg, ${accent}, ${accent2}); }
      `}</style>

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: accent }}>
            LOTTO<span style={{ color: accent2 }}>EDGE</span>
          </div>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.15em", marginTop: "2px" }}>SATURDAY LOTTO BACKTEST ENGINE</div>
        </div>
        <div style={{ fontSize: "11px", color: "#444", textAlign: "right" }}>
          <div style={{ color: "#666" }}>522 DRAWS LOADED</div>
          <div>2016 – 2026</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 32px 0", display: "flex", gap: 8 }}>
        {["backtest", "frequency", "compare"].map(t => (
          <div key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: "960px" }}>

        {/* ── BACKTEST TAB ── */}
        {activeTab === "backtest" && (
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "20px", letterSpacing: "0.1em" }}>
              ENTER UP TO 3 SYSTEM SETS · 6–12 NUMBERS · RANGE 1–45
            </div>

            {sets.map((set, idx) => (
              <div key={idx} className="set-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", color: accent2, letterSpacing: "0.12em" }}>{set.label}</div>
                  {set.result && (
                    <div style={{ fontSize: "10px", color: "#555" }}>
                      {set.result.numCombos} COMBOS · ${set.result.costPerDraw.toFixed(2)}/DRAW
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: "14px" }}>
                  <input
                    className="input-field"
                    value={set.numbers}
                    onChange={e => setSets(prev => prev.map((s, i) => i === idx ? { ...s, numbers: e.target.value, result: null } : s))}
                    placeholder="e.g. 5, 6, 8, 29, 30, 37, 38, 44"
                  />
                  <button className="btn-primary" onClick={() => runBacktest(idx)}>RUN</button>
                </div>

                {/* Ball display */}
                <div style={{ marginBottom: "12px" }}>
                  {parseNumbers(set.numbers).map(n => (
                    <span key={n} className={`ball ${FREQ[n] > 75 ? "hot" : ""}`}>{n}</span>
                  ))}
                </div>

                {set.error && <div style={{ color: warn, fontSize: "12px" }}>{set.error}</div>}

                {set.result && (
                  <div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "14px" }}>
                      <div className="stat-box">
                        <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px" }}>TOTAL COST</div>
                        <div style={{ fontSize: "16px", color: "#aaa" }}>${set.result.totalCost.toLocaleString()}</div>
                      </div>
                      <div className="stat-box">
                        <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px" }}>TOTAL PRIZE</div>
                        <div style={{ fontSize: "16px", color: "#aaa" }}>${set.result.totalPrize.toLocaleString()}</div>
                      </div>
                      <div className="stat-box">
                        <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px" }}>NET RETURN</div>
                        <div style={{ fontSize: "16px" }} className={set.result.netReturn >= 0 ? "positive" : "negative"}>
                          {set.result.netReturn >= 0 ? "+" : ""}${set.result.netReturn.toLocaleString()}
                        </div>
                      </div>
                      <div className="stat-box">
                        <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px" }}>ROI</div>
                        <div style={{ fontSize: "16px" }} className={set.result.roi >= 100 ? "positive" : "negative"}>
                          {set.result.roi}%
                        </div>
                      </div>
                    </div>

                    {/* Division hits */}
                    <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", letterSpacing: "0.1em" }}>DIVISION HITS</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Object.entries(set.result.divCounts).map(([div, count]) => (
                        <div key={div} style={{ background: "#0d0d18", border: `1px solid ${border}`, borderRadius: 4, padding: "8px 14px", minWidth: 70 }}>
                          <div style={{ fontSize: "10px", color: div === "1" ? accent : "#666" }}>{DIV_LABELS[div]}</div>
                          <div style={{ fontSize: "18px", color: div === "1" && count > 0 ? accent : "#e0e0f0", fontWeight: 500 }}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button className="btn-secondary" onClick={runAll} style={{ marginTop: 8 }}>
              ▶ RUN ALL SETS
            </button>
          </div>
        )}

        {/* ── FREQUENCY TAB ── */}
        {activeTab === "frequency" && (
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "20px", letterSpacing: "0.1em" }}>
              NUMBER FREQUENCY · 522 DRAWS · HOT = TOP 15
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {freqEntries.map(([num, count], i) => {
                const pct = (count / DRAWS.length * 100).toFixed(1);
                const isHot = i < 15;
                return (
                  <div key={num} style={{ background: card, border: `1px solid ${isHot ? "rgba(0,255,135,0.2)" : border}`, borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span className={`ball ${isHot ? "hot" : ""}`} style={{ margin: 0 }}>{num}</span>
                      <span style={{ fontSize: "10px", color: isHot ? accent : "#555" }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#0d0d18", borderRadius: 2, height: 3 }}>
                      <div className="freq-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "#444", marginTop: 4 }}>{count} draws</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMPARE TAB ── */}
        {activeTab === "compare" && (
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "20px", letterSpacing: "0.1em" }}>
              HEAD-TO-HEAD COMPARISON · RUN BACKTEST FIRST
            </div>

            {sets.every(s => !s.result) && (
              <div style={{ color: "#444", fontSize: "13px", padding: "40px 0" }}>
                Run backtest on your sets first, then compare here.
                <br /><br />
                <button className="btn-primary" onClick={() => { runAll(); setTimeout(() => setActiveTab("compare"), 100); }}>
                  RUN ALL &amp; COMPARE
                </button>
              </div>
            )}

            {sets.some(s => s.result) && (
              <div>
                {/* Summary table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ color: "#555", fontSize: "10px", letterSpacing: "0.1em" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>SET</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>COMBOS</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>COST/WK</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>NET</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>ROI</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>DIV 1</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>DIV 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sets.map((s, i) => s.result && (
                        <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
                          <td style={{ padding: "12px", color: accent2 }}>{s.label}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{s.result.numCombos}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>${s.result.costPerDraw.toFixed(2)}</td>
                          <td style={{ padding: "12px", textAlign: "right" }} className={s.result.netReturn >= 0 ? "positive" : "negative"}>
                            {s.result.netReturn >= 0 ? "+" : ""}${s.result.netReturn.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }} className={s.result.roi >= 100 ? "positive" : "negative"}>
                            {s.result.roi}%
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", color: s.result.divCounts[1] > 0 ? accent : "#666" }}>
                            {s.result.divCounts[1]}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{s.result.divCounts[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Combined stats */}
                {sets.filter(s => s.result).length === 3 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px", letterSpacing: "0.1em" }}>3-SET COMBINED PACKAGE</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[
                        { label: "WEEKLY COST", val: `$${sets.filter(s => s.result).reduce((a, s) => a + s.result.costPerDraw, 0).toFixed(2)}`, cls: "neutral" },
                        { label: "TOTAL COST (10YR)", val: `$${sets.filter(s => s.result).reduce((a, s) => a + s.result.totalCost, 0).toLocaleString()}`, cls: "" },
                        { label: "COMBINED NET", val: (() => { const n = sets.filter(s => s.result).reduce((a, s) => a + s.result.netReturn, 0); return `${n >= 0 ? "+" : ""}$${n.toLocaleString()}`; })(), cls: sets.filter(s => s.result).reduce((a, s) => a + s.result.netReturn, 0) >= 0 ? "positive" : "negative" },
                        { label: "DIV 1 HITS", val: sets.filter(s => s.result).reduce((a, s) => a + s.result.divCounts[1], 0), cls: "positive" },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="stat-box">
                          <div style={{ fontSize: "10px", color: "#555", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: "18px" }} className={cls}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 32px", borderTop: `1px solid ${border}`, fontSize: "10px", color: "#333", letterSpacing: "0.08em" }}>
        LOTTOEDGE MVP · SIMULATED DATA · NOT FINANCIAL ADVICE · PRIZE ESTIMATES ONLY
      </div>
    </div>
  );
}

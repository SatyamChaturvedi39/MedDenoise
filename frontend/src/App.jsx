import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Google Fonts ───────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── Global CSS ────────────────────────────────────────────────────
const globalCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #070b14;
    color: #c9d1e0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0d1422; }
  ::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: #2a4070; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.15); }
    50%       { box-shadow: 0 0 0 8px rgba(56,189,248,0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .fade-in { animation: fadeIn 0.4s ease both; }
  .card {
    background: linear-gradient(145deg, #0d1628, #0a1220);
    border: 1px solid #1a2540;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 18px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: #243560; }
  .glass {
    background: rgba(13,22,40,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(30,45,74,0.8);
    border-radius: 16px;
  }
  .noise-btn {
    background: #0d1628;
    border: 1px solid #1a2540;
    border-radius: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: left;
    font-family: 'Space Grotesk', sans-serif;
  }
  .noise-btn:hover { border-color: #2563eb; background: #111e38; }
  .noise-btn.active {
    background: linear-gradient(135deg, #0f2d5e, #0d1e42);
    border-color: #38bdf8;
    box-shadow: 0 0 20px rgba(56,189,248,0.12), inset 0 1px 0 rgba(56,189,248,0.1);
  }
  .upload-zone {
    border: 2px dashed #1a2540;
    border-radius: 16px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: linear-gradient(145deg, #0a1220, #0d1628);
    position: relative;
    overflow: hidden;
  }
  .upload-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(56,189,248,0.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .upload-zone:hover { border-color: #2563eb; background: linear-gradient(145deg, #0c1628, #101d34); }
  .upload-zone.dragging {
    border-color: #38bdf8;
    background: linear-gradient(145deg, #0d1e3a, #0f2040);
    box-shadow: 0 0 30px rgba(56,189,248,0.1);
  }
  .run-btn {
    background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
    border: none;
    border-radius: 10px;
    padding: 12px 28px;
    color: white;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.02em;
  }
  .run-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(14,165,233,0.3); }
  .run-btn:active { transform: translateY(0); }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .tab-btn {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 14px 22px;
    transition: all 0.18s;
    letter-spacing: 0.02em;
  }
  .tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }
  .tab-btn:not(.active) { color: #4b6080; }
  .tab-btn:not(.active):hover { color: #7899b8; }
  .metric-chip {
    background: linear-gradient(145deg, #0d1628, #0a1a30);
    border: 1px solid #1a2540;
    border-radius: 12px;
    padding: 16px 20px;
    flex: 1;
    min-width: 120px;
    text-align: center;
    transition: border-color 0.2s;
  }
  .metric-chip:hover { border-color: #243560; }
  .img-panel {
    background: #070b14;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #1a2540;
    position: relative;
  }
  .img-panel img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    image-rendering: pixelated;
  }
`;

const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ── Spinner ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #1a2540', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  );
}

// ── Image Panel ────────────────────────────────────────────────────
function ImgPanel({ src, label, step, color = '#38bdf8', isBase64 = false }) {
  const borderColor = { '#38bdf8': '#1a3a5c', '#f87171': '#5c1a1a', '#34d399': '#1a5c3a', '#f59e0b': '#5c3d1a' }[color] || '#1a2540';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ ...mono, fontSize: 10, color, background: `${color}18`, border: `1px solid ${color}44`, padding: '2px 7px', borderRadius: 20 }}>{step}</span>
        <span style={{ fontSize: 11, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.08em', ...mono }}>{label}</span>
      </div>
      <div className="img-panel" style={{ borderColor }}>
        {src
          ? <img src={isBase64 ? `data:image/png;base64,${src}` : src} alt={label} />
          : <span style={{ ...mono, fontSize: 10, color: '#1e2d4a' }}>—</span>
        }
      </div>
    </div>
  );
}

// ── Denoiser Tab ──────────────────────────────────────────────────
function Denoiser() {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noiseType, setNoiseType] = useState('gaussian');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef();

  const noiseOptions = [
    { id: 'gaussian',    label: 'Quantum Noise',  desc: 'σ=0.35 · low-dose X-ray',    icon: '〜' },
    { id: 'heavy',       label: 'Severe Noise',   desc: 'σ=0.55 · extreme degradation', icon: '≋' },
    { id: 'salt_pepper', label: 'Dead Pixels',    desc: '6% · detector failure',        icon: '⁘' },
    { id: 'corruption',  label: 'Data Loss',      desc: 'PACS transmission error',      icon: '▪' },
  ];

  // Reset results whenever a new file is selected
  function handleFile(file) {
    if (!file) return;
    setResult(null);
    setError(null);
    setLoading(false);
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
  }

  async function runDenoise() {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    form.append('image', selectedFile);
    form.append('noise_type', noiseType);
    try {
      const res = await axios.post(`${API}/denoise`, form);
      setResult(res.data);
    } catch {
      setError('Denoising failed — is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div>
      {/* Noise selector */}
      <div className="card">
        <div style={{ fontSize: 11, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, marginBottom: 14 }}>Noise Simulation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {noiseOptions.map(opt => (
            <button key={opt.id} onClick={() => setNoiseType(opt.id)}
              className={`noise-btn${noiseType === opt.id ? ' active' : ''}`}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: noiseType === opt.id ? '#38bdf8' : '#c9d1e0', marginBottom: 2 }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: '#4b6080', ...mono }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{ marginBottom: 18 }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🩻</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#c9d1e0', marginBottom: 6 }}>
          {preview ? 'Click to change image' : 'Drop a chest X-ray here'}
        </div>
        <div style={{ ...mono, fontSize: 11, color: '#4b6080' }}>JPG · PNG · WebP — auto-resized to 128×128</div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* File selected + Run button */}
      {preview && !loading && (
        <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <img src={preview} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #1a2540' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c9d1e0' }}>Image selected</div>
            <div style={{ ...mono, fontSize: 11, color: '#4b6080', marginTop: 2 }}>Noise: {noiseOptions.find(o=>o.id===noiseType)?.label}</div>
          </div>
          <button className="run-btn" onClick={runDenoise}>Run Denoising →</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderColor: '#1a3a5c' }}>
          <Spinner />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>Processing through U-Net...</div>
            <div style={{ ...mono, fontSize: 11, color: '#4b6080', marginTop: 3 }}>Encoder → Bottleneck → Decoder with skip connections</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card fade-in" style={{ borderColor: '#5c1a1a', background: 'linear-gradient(145deg,#1a0808,#120606)' }}>
          <span style={{ color: '#f87171', fontSize: 13 }}>⚠ {error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="fade-in">
          {/* Metric chips */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { label: 'PSNR Before', val: `${result.psnr_before} dB`, color: '#f87171' },
              { label: 'PSNR After',  val: `${result.psnr_after} dB`,  color: '#34d399' },
              { label: 'SSIM Before', val: result.ssim_before,          color: '#f87171' },
              { label: 'SSIM After',  val: result.ssim_after,           color: '#34d399' },
              { label: 'Noise Removed', val: `${result.noise_reduction}%`, color: '#38bdf8' },
            ].map(m => (
              <div key={m.label} className="metric-chip">
                <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{m.label}</div>
                <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Reconstruction pipeline */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Reconstruction Pipeline</div>
                <div style={{ ...mono, fontSize: 10, color: '#4b6080', marginTop: 3 }}>
                  PSNR gain: <span style={{ color: '#34d399' }}>+{(result.psnr_after - result.psnr_before).toFixed(2)} dB</span>
                  {' · '}SSIM gain: <span style={{ color: '#34d399' }}>+{(result.ssim_after - result.ssim_before).toFixed(4)}</span>
                </div>
              </div>
              <span style={{ ...mono, fontSize: 10, color: '#38bdf8', background: '#0f2040', border: '1px solid #1a3a5c', padding: '4px 10px', borderRadius: 20 }}>
                {result.noise_type?.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <ImgPanel src={preview}             label="Uploaded"        step="01" color="#38bdf8" isBase64={false} />
              <ImgPanel src={result.original_img} label="Preprocessed"    step="02" color="#38bdf8" isBase64={true} />
              <ImgPanel src={result.noisy_img}    label="Noisy Input"     step="03" color="#f87171" isBase64={true} />
              <ImgPanel src={result.denoised_img} label="Denoised Output" step="04" color="#34d399" isBase64={true} />
            </div>

            {/* Heatmap row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start', paddingTop: 18, borderTop: '1px solid #0f1e34' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Error Heatmap</div>
                <div className="img-panel" style={{ width: 140, borderColor: '#5c3d1a' }}>
                  <img src={`data:image/png;base64,${result.heatmap_img}`} alt="heatmap" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Interpretation</div>
                <div style={{ fontSize: 12, color: '#7899b8', lineHeight: 1.9 }}>
                  Shows <code style={{ ...mono, background: '#0f1e34', color: '#f59e0b', padding: '2px 7px', borderRadius: 5 }}>|x_clean − x̂|</code> per pixel.
                  <br /><span style={{ color: '#f87171' }}>■ Bright red</span> = high reconstruction effort (bone edges, rib margins).
                  <br /><span style={{ color: '#1e2d4a' }}>■ Dark</span> = smooth regions reconstructed with minimal error.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                  {[
                    { label: 'Loss function', val: 'L = 0.5·MSE + 0.5·(1−SSIM)' },
                    { label: 'Architecture', val: 'U-Net + skip connections' },
                    { label: 'MSE before', val: result.mse_before },
                    { label: 'MSE after',  val: result.mse_after },
                  ].map(r => (
                    <div key={r.label} style={{ background: '#0a1220', borderRadius: 8, padding: '10px 14px', border: '1px solid #0f1e34' }}>
                      <div style={{ ...mono, fontSize: 9, color: '#4b6080', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                      <div style={{ ...mono, fontSize: 11, color: '#7899b8' }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────
function Dashboard({ metrics }) {
  if (!metrics) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#4b6080', ...mono, fontSize: 13 }}>
      <Spinner /><br /><br />Loading model metrics...
    </div>
  );

  const ev      = metrics.evaluation?.gaussian   || metrics;
  const evSP    = metrics.evaluation?.salt_pepper;
  const evBlock = metrics.evaluation?.block_corrupt;
  const training = metrics.training || {};
  const dataset  = metrics.dataset  || {};
  const hasMulti = evSP && evBlock;

  const chartData = hasMulti ? [
    { name: 'Gaussian',     before: ev.psnr_noisy,    after: ev.psnr_denoised,    sb: ev.ssim_noisy,    sa: ev.ssim_denoised },
    { name: 'Salt&Pepper',  before: evSP.psnr_noisy,  after: evSP.psnr_denoised,  sb: evSP.ssim_noisy,  sa: evSP.ssim_denoised },
    { name: 'Block Corrupt',before: evBlock.psnr_noisy,after: evBlock.psnr_denoised,sb:evBlock.ssim_noisy,sa:evBlock.ssim_denoised },
  ] : [
    { name: 'Noisy',    psnr: ev.psnr_noisy,    ssim: ev.ssim_noisy },
    { name: 'Denoised', psnr: ev.psnr_denoised, ssim: ev.ssim_denoised },
  ];

  const tooltipStyle = { background: '#0a1220', border: '1px solid #1a2540', borderRadius: 8, color: '#c9d1e0', fontSize: 12 };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0d1e38, #081628)', borderColor: '#1a3a5c' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Model Dashboard</div>
            <p style={{ fontSize: 13, color: '#7899b8', lineHeight: 1.7, margin: 0, maxWidth: 600 }}>
              U-Net trained on <strong style={{ color: '#c9d1e0' }}>{dataset.name || 'Kaggle Chest X-Ray Pneumonia'}</strong> ({dataset.source || 'Guangzhou Women & Children\'s Medical Center'}).
              {training.noise_type ? ` Trained with ${training.noise_type} noise.` : ''} Input: {metrics.input_size || '128×128×1'}.
            </p>
          </div>
          <div style={{ flexShrink: 0, background: '#0a1628', border: '1px solid #1a3a5c', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ ...mono, fontSize: 10, color: '#4b6080', marginBottom: 4 }}>PARAMETERS</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{metrics.total_params?.toLocaleString() || '473,537'}</div>
          </div>
        </div>
      </div>

      {/* Metric chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'PSNR Before', val: `${ev.psnr_noisy} dB`,  color: '#f87171' },
          { label: 'PSNR After',  val: `${ev.psnr_denoised} dB`, color: '#34d399' },
          { label: 'PSNR Gain',   val: `+${ev.psnr_gain ?? (ev.psnr_denoised - ev.psnr_noisy).toFixed(2)} dB`, color: '#38bdf8' },
          { label: 'SSIM After',  val: ev.ssim_denoised,         color: '#34d399' },
          { label: 'Noise Removed', val: `${ev.noise_reduction_pct || '—'}%`, color: '#38bdf8' },
        ].map(c => (
          <div key={c.label} className="metric-chip">
            <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="card">
          <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>PSNR (dB) — Higher is Better</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e34" />
              <XAxis dataKey="name" tick={{ fill: '#4b6080', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#4b6080', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={tooltipStyle} />
              {hasMulti ? <><Bar dataKey="before" name="Before" fill="#f87171" radius={[4,4,0,0]} /><Bar dataKey="after" name="After" fill="#34d399" radius={[4,4,0,0]} /></>
                : <><Bar dataKey="psnr" name="PSNR" fill="#1d4ed8" radius={[4,4,0,0]} /></>}
              {hasMulti && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>SSIM — Higher is Better (0→1)</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e34" />
              <XAxis dataKey="name" tick={{ fill: '#4b6080', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis domain={[0, 1]} tick={{ fill: '#4b6080', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={tooltipStyle} />
              {hasMulti ? <><Bar dataKey="sb" name="Before" fill="#f87171" radius={[4,4,0,0]} /><Bar dataKey="sa" name="After" fill="#34d399" radius={[4,4,0,0]} /></>
                : <><Bar dataKey="ssim" name="SSIM" fill="#0ea5e9" radius={[4,4,0,0]} /></>}
              {hasMulti && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evaluation table */}
      {hasMulti && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Evaluation Across All Noise Types</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #0f1e34' }}>
                {['Noise Type','PSNR ↓','PSNR ↑','Gain','SSIM ↓','SSIM ↑','Noise Removed','Px Acc'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', color: '#4b6080', fontWeight: 500, textAlign: 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[ev, evSP, evBlock].map(r => (
                <tr key={r.noise_type} style={{ borderBottom: '1px solid #0a1220' }}>
                  <td style={{ padding: '10px', color: '#c9d1e0', textAlign: 'right' }}>{r.noise_type}</td>
                  <td style={{ padding: '10px', color: '#f87171', textAlign: 'right' }}>{r.psnr_noisy}</td>
                  <td style={{ padding: '10px', color: '#34d399', textAlign: 'right' }}>{r.psnr_denoised}</td>
                  <td style={{ padding: '10px', color: '#38bdf8', textAlign: 'right' }}>+{r.psnr_gain}</td>
                  <td style={{ padding: '10px', color: '#f87171', textAlign: 'right' }}>{r.ssim_noisy}</td>
                  <td style={{ padding: '10px', color: '#34d399', textAlign: 'right' }}>{r.ssim_denoised}</td>
                  <td style={{ padding: '10px', color: '#38bdf8', textAlign: 'right' }}>{r.noise_reduction_pct}%</td>
                  <td style={{ padding: '10px', color: '#f59e0b', textAlign: 'right' }}>{r.pixel_accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Architecture */}
      <div className="card">
        <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>U-Net Architecture</div>
        <div style={{ ...mono, fontSize: 12, lineHeight: 2.4 }}>
          {[
            ['INPUT',      '128×128×1',   '#e2e8f0', 'noisy grayscale X-ray'],
            ['Conv2D ×2',  '128×128×32',  '#38bdf8',  '32 filters · ReLU · BatchNorm  ──────── skip₁'],
            ['MaxPool',    '64×64×32',    '#4b6080',  '÷2 spatial dimensions'],
            ['Conv2D ×2',  '64×64×64',    '#38bdf8',  '64 filters · ReLU · BatchNorm  ──────── skip₂'],
            ['MaxPool',    '32×32×64',    '#4b6080',  '÷2 spatial dimensions'],
            ['BOTTLENECK', '32×32×128',   '#f59e0b',  '131,072 compressed values · Dropout(0.15)'],
            ['Up + skip₂', '64×64×(128+64)','#34d399','UpSample then Concatenate(skip₂)'],
            ['Conv2D ×2',  '64×64×64',    '#38bdf8',  '64 filters · ReLU · BatchNorm'],
            ['Up + skip₁', '128×128×(64+32)','#34d399','UpSample then Concatenate(skip₁)'],
            ['Conv2D ×2',  '128×128×32',  '#38bdf8',  '32 filters · ReLU · BatchNorm'],
            ['OUTPUT',     '128×128×1',   '#34d399',  'Conv1×1 · Sigmoid → clean reconstruction'],
          ].map(([stage, shape, color, note]) => (
            <div key={stage+shape} style={{ display: 'flex', gap: 18, alignItems: 'center', borderBottom: '1px solid #0a1220', paddingBottom: 2 }}>
              <span style={{ color, minWidth: 110, fontWeight: 600 }}>{stage}</span>
              <span style={{ color: '#4b6080', minWidth: 110 }}>{shape}</span>
              <span style={{ color: '#1e2d4a', fontSize: 11 }}>// {note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div className="card">
        <div style={{ ...mono, fontSize: 10, color: '#4b6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Clinical Use Cases</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '👶', title: 'Low-Dose Pediatric Radiology', text: 'Reduce radiation dose using low-dose protocols + AI denoising to restore diagnostic quality without harming children.' },
            { icon: '📡', title: 'Rural Telemedicine', text: 'Portable X-ray machines in field hospitals produce noisy images. Denoise before transmitting to remote radiologists.' },
            { icon: '🤖', title: 'AI Preprocessing Pipeline', text: 'Denoised images improve downstream pneumonia and fracture classifier accuracy as a preprocessing step.' },
            { icon: '🏥', title: 'Legacy Equipment Upgrade', text: 'Older X-ray machines produce noisier images. Software denoising extends their clinical usefulness affordably.' },
          ].map(c => (
            <div key={c.title} style={{ background: '#0a1220', border: '1px solid #0f1e34', borderRadius: 12, padding: '16px 18px', transition: 'border-color 0.18s' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c9d1e0', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#4b6080', lineHeight: 1.7 }}>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('denoise');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    axios.get(`${API}/metrics`).then(r => setMetrics(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <style>{globalCss}</style>

      {/* Header */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0 32px', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🩻</div>
              <span style={{ ...mono, fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>MedDenoise</span>
            </div>
            <span style={{ ...mono, fontSize: 11, color: '#1e2d4a', padding: '3px 10px', background: '#0a1220', border: '1px solid #0f1e34', borderRadius: 20 }}>U-Net · 128×128</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: metrics ? '#34d399' : '#4b6080', animation: metrics ? 'pulse-glow 2s infinite' : 'none' }} />
            <span style={{ ...mono, fontSize: 11, color: metrics ? '#34d399' : '#4b6080' }}>
              {metrics ? `MODEL LOADED · ${metrics.total_params?.toLocaleString() || '473,537'} params` : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ background: '#070b14', borderBottom: '1px solid #0f1e34', padding: '0 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex' }}>
          {[{ id: 'denoise', label: '⚕ Image Denoiser' }, { id: 'dashboard', label: '📊 Model Dashboard' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn${tab === t.id ? ' active' : ''}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
        {tab === 'denoise' && <Denoiser />}
        {tab === 'dashboard' && <Dashboard metrics={metrics} />}
      </main>
    </>
  );
}
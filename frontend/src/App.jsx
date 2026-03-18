import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const API = "http://localhost:5000/api";

// ── Fonts ─────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── Inline styles ─────────────────────────────────────────────────
const styles = {
  body: {
    background: '#0f1117', color: '#d1d5db',
    fontFamily: "'Inter', system-ui, sans-serif",
    minHeight: '100vh', margin: 0
  },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
  header: {
    background: '#161820', borderBottom: '1px solid #2a2d3a',
    padding: '14px 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50
  },
  main: { maxWidth: 1060, margin: '0 auto', padding: '28px 32px' },
  card: {
    background: '#161820', border: '1px solid #2a2d3a',
    borderRadius: 10, padding: 20, marginBottom: 16
  },
  label: {
    fontSize: 11, color: '#6b7280', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 6,
    fontFamily: "'JetBrains Mono', monospace"
  },
  btn: (active) => ({
    background: active ? '#3b82f620' : '#1e2030',
    border: `1px solid ${active ? '#3b82f6' : '#2a2d3a'}`,
    borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
    color: active ? '#60a5fa' : '#9ca3af',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    transition: 'all 0.15s'
  }),
  imgBox: (borderColor = '#2a2d3a') => ({
    border: `1px solid ${borderColor}`, borderRadius: 8,
    overflow: 'hidden', aspectRatio: '1', background: '#0f1117',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }),
  metricCard: {
    background: '#1e2030', borderRadius: 8, padding: '14px 16px',
    flex: 1, minWidth: 130, textAlign: 'center'
  },
  tab: (active) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    color: active ? '#60a5fa' : '#6b7280', padding: '12px 20px',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent'
  })
};

// ── Denoiser Tab ──────────────────────────────────────────────────
function Denoiser() {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noiseType, setNoiseType] = useState('gaussian');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const noiseOptions = [
    { id: 'gaussian', label: 'Quantum Noise', desc: 'σ=0.35 — most common in low-dose X-ray' },
    { id: 'heavy', label: 'Severe Noise', desc: 'σ=0.55 — extremely degraded signal' },
    { id: 'salt_pepper', label: 'Dead Pixels', desc: '6% — detector element failure' },
    { id: 'corruption', label: 'Data Loss', desc: 'PACS transmission corruption' },
  ];

  async function runDenoise(file) {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    setPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('image', file);
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
    runDenoise(e.dataTransfer.files[0]);
  }, [noiseType]);

  return (
    <div>
      {/* Description */}
      <div style={styles.card}>
        <h2 style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
          Medical Image Denoising
        </h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#9ca3af', margin: 0 }}>
          Upload any medical image (X-ray, CT scan, JPG/PNG). The autoencoder converts it to
          128×128 grayscale, applies clinical noise, and reconstructs a clean version.
          Trained on <strong style={{ color: '#d1d5db' }}>5,856 real chest X-rays</strong> from
          the Kaggle Chest X-Ray Pneumonia dataset.
        </p>
      </div>

      {/* Noise selector */}
      <div style={{ ...styles.card, padding: '16px 20px' }}>
        <div style={styles.label}>Select Noise Type</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {noiseOptions.map(opt => (
            <button key={opt.id} onClick={() => setNoiseType(opt.id)} style={styles.btn(noiseType === opt.id)}>
              <div style={{ fontSize: 12, fontWeight: 500, color: noiseType === opt.id ? '#60a5fa' : '#d1d5db' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : '#2a2d3a'}`,
          borderRadius: 10, padding: '32px 20px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 16,
          background: dragging ? '#3b82f608' : '#161820',
          transition: 'all 0.15s'
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
        <div style={{ color: '#d1d5db', fontSize: 14 }}>
          Drop an image here or <span style={{ color: '#60a5fa', textDecoration: 'underline' }}>browse</span>
        </div>
        <div style={{ ...styles.mono, fontSize: 11, color: '#6b7280', marginTop: 6 }}>
          JPG · PNG · WebP — any size, auto-resized to 128×128
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => runDenoise(e.target.files[0])} />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ ...styles.card, textAlign: 'center', border: '1px solid #3b82f644' }}>
          <div style={{ ...styles.mono, fontSize: 13, color: '#60a5fa' }}>
            ⏳ Processing through autoencoder...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ ...styles.card, border: '1px solid #ef444444', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Metrics row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'PSNR Before', val: `${result.psnr_before} dB`, color: '#f87171' },
              { label: 'PSNR After', val: `${result.psnr_after} dB`, color: '#34d399' },
              { label: 'SSIM Before', val: result.ssim_before, color: '#f87171' },
              { label: 'SSIM After', val: result.ssim_after, color: '#34d399' },
              { label: 'Noise Removed', val: `${result.noise_reduction}%`, color: '#60a5fa' },
            ].map(m => (
              <div key={m.label} style={styles.metricCard}>
                <div style={{ ...styles.label, marginBottom: 4 }}>{m.label}</div>
                <div style={{ ...styles.mono, fontSize: 20, fontWeight: 600, color: m.color }}>
                  {m.val}
                </div>
              </div>
            ))}
          </div>

          {/* Image panels */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Reconstruction Pipeline
              </h3>
              <span style={{ ...styles.mono, fontSize: 10, color: '#6b7280' }}>
                NOISE: {result.noise_type.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {/* Original upload */}
              <div>
                <div style={styles.label}>① Uploaded</div>
                <div style={styles.imgBox('#34d39966')}>
                  <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="upload" />
                </div>
              </div>
              {/* Preprocessed */}
              <div>
                <div style={styles.label}>② Preprocessed 128×128</div>
                <div style={styles.imgBox('#3b82f644')}>
                  <img src={`data:image/png;base64,${result.original_img}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} alt="pre" />
                </div>
              </div>
              {/* Noisy */}
              <div>
                <div style={styles.label}>③ Noisy Input</div>
                <div style={styles.imgBox('#f8717166')}>
                  <img src={`data:image/png;base64,${result.noisy_img}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} alt="noisy" />
                </div>
              </div>
              {/* Denoised */}
              <div>
                <div style={styles.label}>④ Denoised Output</div>
                <div style={styles.imgBox('#34d39966')}>
                  <img src={`data:image/png;base64,${result.denoised_img}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} alt="denoised" />
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 160px' }}>
                <div style={styles.label}>Error Heatmap</div>
                <div style={{ ...styles.imgBox('#f59e0b44'), width: 160 }}>
                  <img src={`data:image/png;base64,${result.heatmap_img}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} alt="heat" />
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
                <div style={styles.label}>Interpretation</div>
                <p>
                  Shows <code style={{ ...styles.mono, background: '#1e2030', padding: '2px 6px', borderRadius: 3, color: '#f59e0b' }}>|x_clean − x̂|</code> per pixel.
                  <span style={{ color: '#f87171' }}> Bright red</span> = high reconstruction effort (bone edges, rib margins).
                  <span style={{ color: '#6b7280' }}> Dark</span> = smooth areas reconstructed cleanly.
                </p>
              </div>
            </div>
          </div>

          {/* Math section */}
          <div style={styles.card}>
            <div style={styles.label}>Mathematical Formulation</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#1e2030', borderRadius: 8, padding: 14 }}>
                <div style={{ ...styles.mono, fontSize: 11, color: '#60a5fa', marginBottom: 6 }}>Loss Function</div>
                <div style={{ ...styles.mono, fontSize: 13, color: '#d1d5db', lineHeight: 2 }}>
                  L = (1/N) Σᵢ ‖xᵢ − g(f(x̃ᵢ))‖²
                </div>
                <div style={{ ...styles.mono, fontSize: 10, color: '#6b7280', lineHeight: 1.8, marginTop: 6 }}>
                  f = encoder, g = decoder<br />
                  x̃ = x + ε, ε ~ N(0, σ²)
                </div>
              </div>
              <div style={{ background: '#1e2030', borderRadius: 8, padding: 14 }}>
                <div style={{ ...styles.mono, fontSize: 11, color: '#60a5fa', marginBottom: 6 }}>This Image — Metrics</div>
                <div style={{ ...styles.mono, fontSize: 12, color: '#d1d5db', lineHeight: 2 }}>
                  PSNR: {result.psnr_before} → <span style={{ color: '#34d399' }}>{result.psnr_after} dB</span><br />
                  SSIM: {result.ssim_before} → <span style={{ color: '#34d399' }}>{result.ssim_after}</span><br />
                  MSE: {result.mse_before} → <span style={{ color: '#34d399' }}>{result.mse_after}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────
function Dashboard({ metrics }) {
  if (!metrics) return <div style={{ ...styles.mono, color: '#6b7280', padding: 40, textAlign: 'center' }}>Loading...</div>;

  const barData = [
    { name: 'Noisy', psnr: metrics.psnr_noisy, ssim: metrics.ssim_noisy },
    { name: 'Denoised', psnr: metrics.psnr_denoised, ssim: metrics.ssim_denoised }
  ];

  return (
    <div>
      <div style={styles.card}>
        <h2 style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
          Model Dashboard
        </h2>
        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>
          Evaluation on test set from Kaggle Chest X-Ray Pneumonia dataset (128×128 grayscale).
          Source: Guangzhou Women & Children's Medical Center.
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'PSNR Noisy', val: `${metrics.psnr_noisy} dB`, color: '#f87171' },
          { label: 'PSNR Denoised', val: `${metrics.psnr_denoised} dB`, color: '#34d399' },
          { label: 'PSNR Gain', val: `+${metrics.psnr_improvement} dB`, color: '#60a5fa' },
          { label: 'SSIM Noisy', val: metrics.ssim_noisy, color: '#f87171' },
          { label: 'SSIM Denoised', val: metrics.ssim_denoised, color: '#34d399' },
          { label: 'Parameters', val: metrics.total_params?.toLocaleString(), color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} style={styles.metricCard}>
            <div style={{ ...styles.label, marginBottom: 4 }}>{c.label}</div>
            <div style={{ ...styles.mono, fontSize: 18, fontWeight: 600, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* PSNR & SSIM bar charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={styles.card}>
          <div style={styles.label}>PSNR Comparison (dB) — Higher is Better</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid #2a2d3a', borderRadius: 6, color: '#d1d5db' }} />
              <Bar dataKey="psnr" radius={[4, 4, 0, 0]}>
                <Cell fill="#f87171" />
                <Cell fill="#34d399" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>SSIM Comparison — Higher is Better</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid #2a2d3a', borderRadius: 6, color: '#d1d5db' }} />
              <Bar dataKey="ssim" radius={[4, 4, 0, 0]}>
                <Cell fill="#f87171" />
                <Cell fill="#34d399" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Architecture */}
      <div style={styles.card}>
        <div style={styles.label}>Architecture — Convolutional Denoising Autoencoder</div>
        <div style={{ ...styles.mono, fontSize: 12, lineHeight: 2.2, color: '#d1d5db' }}>
          {[
            ['INPUT', '128×128×1', '#f3f4f6', 'noisy grayscale X-ray'],
            ['Conv2D', '128×128×32', '#60a5fa', '32 filters, 3×3, ReLU + BN'],
            ['MaxPool', '64×64×32', '#6b7280', '2×2 → halves spatial dims'],
            ['Conv2D', '64×64×64', '#60a5fa', '64 filters, 3×3, ReLU + BN'],
            ['MaxPool', '32×32×64', '#6b7280', '2×2 → halves again'],
            ['BOTTLENECK', '32×32×128', '#f59e0b', '← 131,072 compressed values'],
            ['Conv2D', '32×32×64', '#60a5fa', 'decode: 64 filters'],
            ['UpSample', '64×64×64', '#6b7280', '2×2 → doubles spatial dims'],
            ['Conv2D', '64×64×32', '#60a5fa', '32 filters, 3×3, ReLU + BN'],
            ['UpSample', '128×128×32', '#6b7280', '2×2 → restore original size'],
            ['OUTPUT', '128×128×1', '#34d399', 'sigmoid → clean reconstruction'],
          ].map(([stage, shape, color, note]) => (
            <div key={stage + shape} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ color, minWidth: 90, fontWeight: 600 }}>{stage}</span>
              <span style={{ color: '#6b7280', minWidth: 90 }}>{shape}</span>
              <span style={{ color: '#4b5563', fontSize: 11 }}>// {note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={styles.card}>
        <div style={styles.label}>Healthcare Use Cases</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Low-Dose Pediatric Radiology', text: 'Reduce radiation for children using low-dose protocols + AI denoising to restore diagnostic quality.' },
            { title: 'Rural Telemedicine', text: 'Portable X-ray machines produce noisy images. Denoise before transmitting to remote radiologists.' },
            { title: 'AI Preprocessing', text: 'Denoised images improve downstream classifier accuracy for pneumonia detection and fracture identification.' },
            { title: 'Legacy Equipment', text: 'Older X-ray machines produce noisier images. Software denoising extends their clinical usefulness.' },
          ].map(c => (
            <div key={c.title} style={{ background: '#1e2030', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>{c.text}</div>
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
    axios.get(`${API}/metrics`).then(r => setMetrics(r.data)).catch(() => { });
  }, []);

  return (
    <>
      <style>{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f1117; color: #d1d5db; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 2px; }
        code { font-family: 'JetBrains Mono', monospace; }`}</style>

      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ ...styles.mono, fontSize: 15, fontWeight: 600, color: '#60a5fa' }}>
            MedDenoise
          </span>
          <span style={{ ...styles.mono, fontSize: 11, color: '#6b7280' }}>
            Medical Image Denoising · Conv Autoencoder
          </span>
        </div>
        <div style={{ ...styles.mono, fontSize: 10, color: metrics ? '#34d399' : '#6b7280' }}>
          {metrics ? `● MODEL LOADED · ${metrics.total_params?.toLocaleString()} params` : '○ CONNECTING...'}
        </div>
      </header>

      <div style={{ background: '#161820', borderBottom: '1px solid #2a2d3a', padding: '0 32px', display: 'flex' }}>
        {[
          { id: 'denoise', label: 'Image Denoiser' },
          { id: 'dashboard', label: 'Model Dashboard' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={styles.tab(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <main style={styles.main}>
        {tab === 'denoise' && <Denoiser />}
        {tab === 'dashboard' && <Dashboard metrics={metrics} />}
      </main>
    </>
  );
}
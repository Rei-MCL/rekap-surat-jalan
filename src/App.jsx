import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  GANTI DENGAN URL APPS SCRIPT ANDA (dari Penerapan baru)
// ─────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbyG665qHhIqIZL65JpHkxVf8VfZ4TSJ75Pq9zRSuMRP/dev";

const STATUS_CONFIG = {
  Terkirim: { color: "#16a34a", bg: "#dcfce7" },
  Tunda:    { color: "#d97706", bg: "#fef3c7" },
  Kembali:  { color: "#ea580c", bg: "#ffedd5" },
  Batal:    { color: "#dc2626", bg: "#fee2e2" },
  Selesai:  { color: "#2563eb", bg: "#dbeafe" },
};

// ── Helpers ───────────────────────────────────────────────────
const toProperCase = (s) =>
  s ? s.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase()) : s;

const toNum = (v) => parseInt(String(v).replace(/[^0-9]/g, ""), 10);

const formatStamp = (d) =>
  new Date(d).toLocaleString("id-ID", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", second:"2-digit",
  });

const getSJPreview = (nomorSJ) => {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(-2);
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  const nn  = String(parseInt(nomorSJ) || 0).padStart(4, "0");
  return `SP/KLK-${yy}${mm}${nn}`;
};

async function apiGet(params) {
  const res  = await fetch(API_URL + "?" + new URLSearchParams(params), { redirect:"follow" });
  return JSON.parse(await res.text());
}
async function apiPost(body) {
  const res = await fetch(API_URL, {
    method:"POST", headers:{"Content-Type":"text/plain"},
    body: JSON.stringify(body), redirect:"follow",
  });
  return JSON.parse(await res.text());
}

// ── Bakar timestamp ke gambar ─────────────────────────────────
function burnTimestamp(file, driverName, formattedSJ, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const now  = new Date();
      const l1   = formatStamp(now);
      const l2   = `${driverName}  |  ${formattedSJ}`;
      const pad  = Math.max(10, img.width * 0.022);
      const fs   = Math.max(14, Math.floor(img.width * 0.032));
      ctx.font   = `bold ${fs}px monospace`;
      const bw   = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + pad * 2;
      const bh   = fs * 2 + pad * 2.5;
      const bx   = img.width - bw - pad, by = img.height - bh - pad;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(l1, bx+pad, by+pad+fs);
      ctx.fillStyle = "#facc15"; ctx.fillText(l2, bx+pad, by+pad+fs*2+pad*0.4);
      callback(c.toDataURL("image/jpeg", 0.75), now);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Shared style ──────────────────────────────────────────────
const IS = {
  width:"100%", padding:"12px 14px", borderRadius:10,
  border:"1.5px solid #cbd5e1", fontSize:15, color:"#1B2A4A",
  background:"#fff", boxSizing:"border-box",
  fontFamily:"'Inter',system-ui,sans-serif", outline:"none",
};
const ARW = {
  appearance:"none",
  backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
};

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, children, err, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>
        {label}
      </label>
      {children}
      {hint && !err && <p style={{ color:"#94a3b8", fontSize:11, marginTop:5 }}>{hint}</p>}
      {err  && <p style={{ color:"#dc2626", fontSize:12, marginTop:5 }}>{err}</p>}
    </div>
  );
}

// ── Dropdown + isi sendiri (single select) ───────────────────
function SelectWithCustom({ options, value, onChange, placeholder, hasError }) {
  const [isCustom, setIsCustom] = useState(false);
  const [raw, setRaw]           = useState("");

  const handleSelect = (e) => {
    if (e.target.value === "__CUSTOM__") { setIsCustom(true); onChange(""); }
    else { setIsCustom(false); onChange(e.target.value); }
  };
  const handleRaw = (e) => {
    setRaw(e.target.value);
    onChange(toProperCase(e.target.value));
  };
  const handleBlur = () => { const p = toProperCase(raw); setRaw(p); onChange(p); };

  return (
    <div>
      <select
        value={isCustom ? "__CUSTOM__" : (value||"")}
        onChange={handleSelect}
        style={{ ...IS, ...ARW, color:(value||isCustom)?"#1B2A4A":"#94a3b8",
          border:`1.5px solid ${hasError?"#f87171":"#cbd5e1"}` }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__CUSTOM__">Lainnya (isi sendiri)...</option>
      </select>
      {isCustom && (
        <div style={{ marginTop:8, position:"relative" }}>
          <input type="text" value={raw} onChange={handleRaw} onBlur={handleBlur}
            placeholder="Ketik nama (huruf besar otomatis)..."
            autoFocus
            style={{ ...IS, fontSize:14, border:`1.5px solid ${hasError?"#f87171":"#3b82f6"}` }} />
          <button onClick={() => { setIsCustom(false); setRaw(""); onChange(""); }}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:16, padding:4 }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ── Multi-select Ass. Driver (chip style) ────────────────────
function MultiSelectChip({ options, values, onChange }) {
  const [showInput, setShowInput] = useState(false);
  const [raw, setRaw]             = useState("");

  const toggle = (name) => {
    onChange(values.includes(name)
      ? values.filter(v => v !== name)
      : [...values, name]
    );
  };
  const addCustom = () => {
    const proper = toProperCase(raw.trim());
    if (proper && !values.includes(proper)) onChange([...values, proper]);
    setRaw(""); setShowInput(false);
  };
  const remove = (name) => onChange(values.filter(v => v !== name));

  return (
    <div>
      {/* Chips preset */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
        {options.map(name => {
          const sel = values.includes(name);
          return (
            <button key={name} onClick={() => toggle(name)} style={{
              padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:700,
              border: sel ? "none" : "1.5px solid #cbd5e1",
              background: sel ? "#1B2A4A" : "#fff",
              color: sel ? "#fff" : "#475569",
            }}>
              {sel ? "✓ " : ""}{name}
            </button>
          );
        })}
        <button onClick={() => setShowInput(!showInput)} style={{
          padding:"8px 16px", borderRadius:20, cursor:"pointer",
          border:"1.5px dashed #94a3b8", background:"#f8fafc",
          color:"#64748b", fontSize:13, fontWeight:700,
        }}>
          + Lainnya
        </button>
      </div>

      {/* Input nama custom */}
      {showInput && (
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <input type="text" value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()}
            placeholder="Ketik nama..."
            autoFocus
            style={{ ...IS, flex:1, fontSize:14 }} />
          <button onClick={addCustom} style={{
            padding:"0 16px", background:"#1B2A4A", color:"#fff",
            border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13,
          }}>Tambah</button>
        </div>
      )}

      {/* Tampilkan nama custom yang sudah ditambah */}
      {values.filter(v => !options.includes(v)).map(v => (
        <span key={v} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          background:"#1B2A4A", color:"#fff",
          padding:"6px 12px", borderRadius:20,
          fontSize:13, fontWeight:700, marginRight:6, marginTop:4,
        }}>
          {v}
          <button onClick={() => remove(v)} style={{
            background:"none", border:"none", color:"rgba(255,255,255,0.7)",
            cursor:"pointer", fontSize:14, padding:0, lineHeight:1,
          }}>✕</button>
        </span>
      ))}

      {values.length > 0 && (
        <p style={{ fontSize:11, color:"#64748b", marginTop:6 }}>
          Dipilih: <strong>{values.join(", ")}</strong>
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Terkirim"];
  return (
    <span style={{
      backgroundColor:cfg.bg, color:cfg.color,
      padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700,
    }}>{status}</span>
  );
}

function KmRow({ km1, km2 }) {
  if (!km1) return null;
  const jarak = km2 && Number(km2) > Number(km1) ? Number(km2) - Number(km1) : null;
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
      <span style={{ background:"#f1f5f9", color:"#475569", padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700 }}>
        🛣 {Number(km1).toLocaleString("id-ID")} km
      </span>
      {km2
        ? <span style={{ background:"#f1f5f9", color:"#475569", padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700 }}>
            🏁 {Number(km2).toLocaleString("id-ID")} km
          </span>
        : <span style={{ background:"#fef9c3", color:"#a16207", padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700 }}>
            🏁 Tiba belum diisi
          </span>
      }
      {jarak && (
        <span style={{ background:"#dbeafe", color:"#1d4ed8", padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700 }}>
          📏 {jarak.toLocaleString("id-ID")} km
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DRIVER VIEW
// ══════════════════════════════════════════════════════════════
function DriverView({ drivers, assDrivers }) {
  const [driver,     setDriver]     = useState("");
  const [assDriver,  setAssDriver]  = useState([]);   // array (multi)
  const [nomorSJ,    setNomorSJ]    = useState("");
  const [km1,        setKm1]        = useState("");
  const [km2,        setKm2]        = useState("");
  const [photo,      setPhoto]      = useState(null);
  const [photoTime,  setPhotoTime]  = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(null);
  const [error,      setError]      = useState({});

  const cameraRef  = useRef();
  const galleryRef = useRef();

  const today = new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

  const preview = getSJPreview(nomorSJ);

  const handleFile = (file) => {
    if (!file) return;
    if (!driver || !nomorSJ) {
      setError(p => ({ ...p, photo:"Isi Nama Driver & Nomor SJ dulu sebelum foto." }));
      return;
    }
    setError(p => ({ ...p, photo:"" }));
    setProcessing(true);
    burnTimestamp(file, driver, preview, (url, t) => {
      setPhoto(url); setPhotoTime(t); setProcessing(false);
    });
  };

  const validate = () => {
    const e = {};
    if (!driver) e.driver = "Pilih nama driver.";
    const n = parseInt(nomorSJ);
    if (!nomorSJ || isNaN(n) || n < 1 || n > 9999) e.nomorSJ = "Nomor SJ harus angka 1–9999.";
    const k1 = toNum(km1);
    if (!km1 || isNaN(k1) || k1 < 0) e.km1 = "KM Berangkat wajib diisi.";
    if (km2) {
      const k2 = toNum(km2);
      if (isNaN(k2) || k2 <= toNum(km1)) e.km2 = "KM Tiba harus lebih besar dari KM Berangkat.";
    }
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setError(errs); return; }
    setLoading(true);
    try {
      const nn = String(parseInt(nomorSJ)).padStart(4, "0");
      const result = await apiGet({
        action    : "addSJ",
        namaDriver: driver,
        assDriver : assDriver.join(", "),
        nomorSJ   : nn,
        km1       : toNum(km1),
        km2       : km2 ? toNum(km2) : "",
      });
      if (result.success) {
        if (photo && result.id) {
          try { await apiPost({ action:"uploadPhoto", sjId:result.id, photoBase64:photo }); }
          catch (_) {}
        }
        setSuccess({
          driver, assDriver: assDriver.join(" & "),
          formattedSJ: result.formattedSJ,
          timestamp: result.timestamp,
        });
        setNomorSJ(""); setKm1(""); setKm2("");
        setPhoto(null); setPhotoTime(null);
        setAssDriver([]); setError({});
      } else {
        setError({ submit: "Gagal menyimpan: " + (result.error || "Error tidak dikenal") });
      }
    } catch (e) {
      setError({ submit: "Koneksi bermasalah. Coba lagi." });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding:20 }}>
      <div style={{ marginBottom:20 }}>
        <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{today}</p>
        <h2 style={{ margin:"4px 0 0", fontSize:20, color:"#1B2A4A", fontWeight:800 }}>Input Surat Jalan</h2>
      </div>

      {success && (
        <div style={{ background:"#dcfce7", border:"1px solid #86efac", borderRadius:12,
          padding:"14px 16px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:10 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <p style={{ margin:0, fontWeight:700, color:"#15803d", fontSize:13 }}>
              {success.formattedSJ} berhasil disimpan!
            </p>
            <p style={{ margin:"2px 0 0", color:"#16a34a", fontSize:12 }}>
              {success.driver}{success.assDriver ? ` + ${success.assDriver}` : ""} · {success.timestamp}
            </p>
          </div>
        </div>
      )}

      {error.submit && (
        <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:12,
          padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, fontWeight:600 }}>
          ⚠️ {error.submit}
        </div>
      )}

      {/* Nama Driver */}
      <Field label="Nama Driver" err={error.driver}>
        <SelectWithCustom
          options={drivers}
          value={driver}
          onChange={v => { setDriver(v); setError(p=>({...p,driver:""})); setSuccess(null); }}
          placeholder="-- Pilih Driver --"
          hasError={!!error.driver}
        />
      </Field>

      {/* Ass. Driver (multi) */}
      <Field label="Ass. Driver">
        <MultiSelectChip
          options={assDrivers}
          values={assDriver}
          onChange={v => setAssDriver(v)}
        />
      </Field>

      {/* Nomor SJ */}
      <Field label="Nomor Surat Jalan" err={error.nomorSJ}
        hint={nomorSJ ? `Tersimpan di Sheets sebagai: ${preview}` : "Masukkan angka 1–9999 sesuai SJ fisik"}>
        <div style={{ position:"relative" }}>
          <span style={{
            position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
            color:"#94a3b8", fontWeight:700, fontSize:14, letterSpacing:1, pointerEvents:"none",
          }}>SJ</span>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={nomorSJ} placeholder="0001"
            onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g,"");
              setNomorSJ(v); setError(p=>({...p,nomorSJ:""})); setSuccess(null);
            }}
            style={{ ...IS, paddingLeft:40, fontSize:22, fontWeight:800, letterSpacing:3,
              border:`1.5px solid ${error.nomorSJ?"#f87171":"#cbd5e1"}` }}
          />
        </div>
      </Field>

      {/* KM */}
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 14px" }}>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:700, whiteSpace:"nowrap" }}>📍 DATA KILOMETER</span>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <Field label="KM Berangkat *" err={error.km1}>
          <input type="text" inputMode="numeric" pattern="[0-9]*"
            value={km1} placeholder="12500"
            onChange={e => { setKm1(e.target.value.replace(/[^0-9]/g,"")); setError(p=>({...p,km1:""})); }}
            style={{ ...IS, fontSize:15, fontWeight:700, border:`1.5px solid ${error.km1?"#f87171":"#cbd5e1"}` }} />
        </Field>
        <Field label="KM Tiba (opsional)" err={error.km2}>
          <input type="text" inputMode="numeric" pattern="[0-9]*"
            value={km2} placeholder="12650"
            onChange={e => { setKm2(e.target.value.replace(/[^0-9]/g,"")); setError(p=>({...p,km2:""})); }}
            style={{ ...IS, fontSize:15, fontWeight:700, border:`1.5px solid ${error.km2?"#f87171":"#cbd5e1"}` }} />
        </Field>
      </div>
      <p style={{ color:"#94a3b8", fontSize:11, margin:"0 0 18px" }}>KM Tiba bisa dikosongkan dan diisi nanti.</p>

      {/* Foto */}
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 14px" }}>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:700, whiteSpace:"nowrap" }}>📷 FOTO SURAT JALAN</span>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
      </div>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment"
        style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*"
        style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />

      {!photo && !processing && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
            {[["📷","Ambil Foto",cameraRef],["🖼","Dari Galeri",galleryRef]].map(([icon,lbl,ref]) => (
              <button key={lbl} onClick={() => ref.current.click()} style={{
                padding:"14px 10px", borderRadius:10,
                border:"1.5px dashed #94a3b8", background:"#f8fafc",
                cursor:"pointer", fontSize:13, fontWeight:700, color:"#475569",
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
              }}><span style={{ fontSize:26 }}>{icon}</span>{lbl}</button>
            ))}
          </div>
          {error.photo && <p style={{ color:"#dc2626", fontSize:12, marginBottom:8 }}>{error.photo}</p>}
          <p style={{ color:"#94a3b8", fontSize:11, marginBottom:18, textAlign:"center" }}>
            Foto opsional. Timestamp otomatis terbakar ke gambar.
          </p>
        </>
      )}

      {processing && (
        <div style={{ background:"#f1f5f9", borderRadius:10, padding:16,
          textAlign:"center", color:"#64748b", fontSize:13, marginBottom:18 }}>
          ⏳ Memproses gambar...
        </div>
      )}

      {photo && !processing && (
        <div style={{ marginBottom:18 }}>
          <div style={{ position:"relative" }}>
            <img src={photo} style={{ width:"100%", borderRadius:10,
              border:"2px solid #cbd5e1", display:"block" }} />
            <button onClick={() => { setPhoto(null); setPhotoTime(null); }} style={{
              position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.55)",
              color:"#fff", border:"none", borderRadius:20, padding:"4px 10px",
              fontSize:12, fontWeight:700, cursor:"pointer",
            }}>✕ Hapus</button>
          </div>
          <p style={{ color:"#16a34a", fontSize:11, marginTop:6, textAlign:"center", fontWeight:700 }}>
            ✅ {photoTime ? formatStamp(photoTime) : ""}
          </p>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} style={{
        width:"100%", padding:"14px",
        background: loading ? "#94a3b8" : "linear-gradient(135deg,#1B2A4A,#2d4a7a)",
        color:"#fff", border:"none", borderRadius:12,
        fontSize:15, fontWeight:800, cursor: loading?"default":"pointer",
        letterSpacing:0.5, boxShadow:"0 4px 12px rgba(27,42,74,0.3)",
      }}>
        {loading ? "⏳ Menyimpan..." : "Submit SJ"}
      </button>
      <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, marginTop:12 }}>
        Punya lebih dari 1 SJ? Submit ulang untuk SJ berikutnya.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN VIEW
// ══════════════════════════════════════════════════════════════
function AdminView() {
  const [sjList, setSjList]             = useState([]);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [editId, setEditId]             = useState(null);
  const [editStatus, setEditStatus]     = useState("");
  const [editKet, setEditKet]           = useState("");
  const [editKm2, setEditKm2]           = useState("");
  const [searchQ, setSearchQ]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [fullPhoto, setFullPhoto]       = useState(null);

  const today = new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

  const loadData = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const r = await apiGet({ action:"getSJList" });
      if (r.success) setSjList(r.data || []);
      else setErrorMsg("Gagal memuat: " + (r.error||"Error tidak dikenal"));
    } catch (e) {
      setErrorMsg("Koneksi bermasalah. Ketuk Refresh untuk coba lagi.");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = sjList.filter(sj => {
    const mS = filterStatus==="Semua" || sj.status===filterStatus;
    const q  = searchQ.toLowerCase();
    const mQ = String(sj.nomorSJ||"").toLowerCase().includes(q)
            || String(sj.namaDriver||"").toLowerCase().includes(q)
            || String(sj.assDriver||"").toLowerCase().includes(q);
    return mS && mQ;
  });

  const openEdit = (sj) => {
    setEditId(sj.id); setEditStatus(sj.status);
    setEditKet(sj.keterangan); setEditKm2(sj.km2?String(sj.km2):"");
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const r = await apiGet({
        action:"updateStatus", id:editId,
        status:editStatus, keterangan:editKet,
        km2: editKm2 ? toNum(editKm2) : "",
      });
      if (r.success) {
        setSjList(prev => prev.map(sj =>
          sj.id===editId
            ? { ...sj, status:editStatus, keterangan:editKet, km2:editKm2?toNum(editKm2):sj.km2 }
            : sj
        ));
        setEditId(null);
      }
    } catch (_) {}
    setSaving(false);
  };

  const countBy = (s) => sjList.filter(sj => sj.status===s).length;

  return (
    <div style={{ padding:20 }}>
      <div style={{ marginBottom:16 }}>
        <p style={{ color:"#64748b", fontSize:13, margin:0 }}>{today}</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ margin:"4px 0 0", fontSize:20, color:"#1B2A4A", fontWeight:800 }}>Monitor Surat Jalan</h2>
          <button onClick={loadData} style={{ padding:"6px 12px", background:"#f1f5f9",
            border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, color:"#475569" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:10,
          padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13, fontWeight:600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { label:"Total SJ", value:sjList.length,       color:"#1B2A4A", bg:"#f1f5f9" },
          { label:"Tunda",    value:countBy("Tunda"),     color:"#d97706", bg:"#fef3c7" },
          { label:"Kembali",  value:countBy("Kembali"),   color:"#dc2626", bg:"#fee2e2" },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:22, fontWeight:900, color:c.color }}>{c.value}</p>
            <p style={{ margin:0, fontSize:11, color:c.color, fontWeight:600 }}>{c.label}</p>
          </div>
        ))}
      </div>

      <input type="text" placeholder="Cari nomor SJ atau nama driver..."
        value={searchQ} onChange={e => setSearchQ(e.target.value)}
        style={{ ...IS, fontSize:13, marginBottom:12, border:"1.5px solid #cbd5e1" }} />

      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:16 }}>
        {["Semua",...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
            fontSize:12, fontWeight:700, whiteSpace:"nowrap",
            background: filterStatus===s ? "#1B2A4A" : "#f1f5f9",
            color:       filterStatus===s ? "#fff"    : "#64748b",
          }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8" }}>
          <p style={{ fontSize:32 }}>⏳</p>
          <p style={{ fontSize:14 }}>Memuat data dari database...</p>
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8" }}>
          <p style={{ fontSize:32 }}>📋</p>
          <p style={{ fontSize:14 }}>Belum ada SJ yang sesuai filter.</p>
        </div>
      ) : filtered.map(sj => (
        <div key={sj.id} style={{ background:"#fff", borderRadius:12, padding:"14px 16px",
          marginBottom:10, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:"1.5px solid #f1f5f9" }}>
          {editId===sj.id ? (
            <div>
              <p style={{ margin:"0 0 10px", fontWeight:800, color:"#1B2A4A" }}>{sj.nomorSJ}</p>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                style={{ ...IS, fontSize:14, marginBottom:8, border:"1.5px solid #cbd5e1" }}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>🏁 KM Tiba</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*"
                  value={editKm2}
                  placeholder={sj.km1 ? `> ${Number(sj.km1).toLocaleString("id-ID")}` : "KM tiba"}
                  onChange={e => setEditKm2(e.target.value.replace(/[^0-9]/g,""))}
                  style={{ ...IS, fontSize:14, border:"1.5px solid #cbd5e1" }} />
              </div>
              <input type="text" placeholder="Keterangan (opsional)"
                value={editKet} onChange={e => setEditKet(e.target.value)}
                style={{ ...IS, fontSize:14, marginBottom:10, border:"1.5px solid #cbd5e1" }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={saveEdit} disabled={saving} style={{
                  flex:1, padding:"10px",
                  background: saving?"#94a3b8":"#1B2A4A", color:"#fff",
                  border:"none", borderRadius:8, fontWeight:700,
                  cursor:saving?"default":"pointer", fontSize:13,
                }}>{saving?"Menyimpan...":"Simpan"}</button>
                <button onClick={() => setEditId(null)} style={{
                  flex:1, padding:"10px", background:"#f1f5f9", color:"#64748b",
                  border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13,
                }}>Batal</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:900, color:"#1B2A4A", letterSpacing:0.3 }}>
                      {sj.nomorSJ}
                    </span>
                    <StatusBadge status={sj.status} />
                    {sj.photoUrl && (
                      <span style={{ background:"#f0fdf4", color:"#16a34a",
                        padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700 }}>📷</span>
                    )}
                  </div>
                  <p style={{ margin:0, fontSize:12, color:"#64748b" }}>
                    {sj.namaDriver}
                    {sj.assDriver
                      ? <span style={{ color:"#94a3b8" }}> + {sj.assDriver}</span>
                      : null}
                    {" · "}{sj.timestamp}
                  </p>
                  <KmRow km1={sj.km1} km2={sj.km2} />
                  {sj.keterangan
                    ? <p style={{ margin:"5px 0 0", fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>
                        "{sj.keterangan}"
                      </p>
                    : null}
                </div>
                <button onClick={() => openEdit(sj)} style={{
                  padding:"8px 12px", background:"#f1f5f9", border:"none",
                  borderRadius:8, cursor:"pointer", color:"#475569",
                  fontSize:12, fontWeight:700, marginLeft:8, flexShrink:0,
                }}>Edit</button>
              </div>
              {sj.photoUrl && (
                <img src={sj.photoUrl} onClick={() => setFullPhoto(sj.photoUrl)} style={{
                  width:"100%", maxHeight:140, objectFit:"cover", marginTop:10,
                  borderRadius:8, border:"1.5px solid #e2e8f0", cursor:"zoom-in", display:"block",
                }} />
              )}
            </div>
          )}
        </div>
      ))}

      {fullPhoto && (
        <div onClick={() => setFullPhoto(null)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.92)",
          zIndex:9999, display:"flex", alignItems:"center",
          justifyContent:"center", padding:16,
        }}>
          <img src={fullPhoto} style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:8 }} />
          <button style={{
            position:"absolute", top:20, right:20,
            background:"rgba(255,255,255,0.15)", color:"#fff",
            border:"none", borderRadius:20, padding:"8px 16px",
            fontSize:14, fontWeight:700, cursor:"pointer",
          }}>✕ Tutup</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab,   setActiveTab]   = useState("driver");
  const [drivers,     setDrivers]     = useState([]);
  const [assDrivers,  setAssDrivers]  = useState([]);

  useEffect(() => {
    apiGet({ action:"getDriverList" })
      .then(r => { if (r.success) setDrivers(r.data); })
      .catch(() => {});
    apiGet({ action:"getAssDriverList" })
      .then(r => { if (r.success) setAssDrivers(r.data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      maxWidth:420, margin:"0 auto", minHeight:"100vh",
      background:"#f8fafc", fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:80,
    }}>
      <div style={{
        background:"linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%)",
        padding:"20px 20px 16px", color:"#fff",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{ fontSize:24 }}>🚚</span>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:900, letterSpacing:0.3 }}>Rekap Surat Jalan</h1>
          <p style={{ margin:0, fontSize:11, color:"#93c5fd" }}>Sistem Monitoring Pengiriman</p>
        </div>
      </div>

      {activeTab==="driver"
        ? <DriverView drivers={drivers} assDrivers={assDrivers} />
        : <AdminView />
      }

      <div style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:420, background:"#fff",
        borderTop:"1px solid #e2e8f0",
        display:"grid", gridTemplateColumns:"1fr 1fr",
        boxShadow:"0 -4px 12px rgba(0,0,0,0.08)",
      }}>
        {[
          { key:"driver", icon:"🙋", label:"Driver" },
          { key:"admin",  icon:"📋", label:"Admin"  },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:"12px 8px 10px", border:"none", background:"transparent",
            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            color: activeTab===tab.key ? "#1B2A4A" : "#94a3b8",
            borderTop: activeTab===tab.key ? "2.5px solid #1B2A4A" : "2.5px solid transparent",
          }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:11, fontWeight:700 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

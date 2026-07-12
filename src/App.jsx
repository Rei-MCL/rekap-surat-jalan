import { useState, useRef } from "react";

const DRIVERS = ["Andi", "Budi", "Cici", "Dedi", "Eko", "Fani"];

const STATUS_CONFIG = {
  Terkirim: { color: "#16a34a", bg: "#dcfce7", label: "Terkirim" },
  Tunda:    { color: "#d97706", bg: "#fef3c7", label: "Tunda" },
  Kembali:  { color: "#ea580c", bg: "#ffedd5", label: "Kembali" },
  Batal:    { color: "#dc2626", bg: "#fee2e2", label: "Batal" },
  Selesai:  { color: "#2563eb", bg: "#dbeafe", label: "Selesai" },
};

const formatTime = (date) =>
  date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const formatDate = (date) =>
  date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const formatStamp = (date) =>
  date.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

// ── Bakar timestamp ke dalam gambar via Canvas ──────────────
function burnTimestamp(file, driverName, nomorSJ, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const now      = new Date();
      const line1    = formatStamp(now);
      const line2    = `Driver: ${driverName}  |  SJ: ${nomorSJ}`;
      const pad      = Math.max(10, img.width * 0.022);
      const fontSize = Math.max(14, Math.floor(img.width * 0.032));

      ctx.font      = `bold ${fontSize}px monospace`;
      const w1      = ctx.measureText(line1).width;
      const w2      = ctx.measureText(line2).width;
      const boxW    = Math.max(w1, w2) + pad * 2;
      const boxH    = fontSize * 2 + pad * 2.5;
      const boxX    = img.width  - boxW - pad;
      const boxY    = img.height - boxH - pad;

      // Latar belakang semi-transparan
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      ctx.fill();

      // Teks putih
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line1, boxX + pad, boxY + pad + fontSize);
      ctx.fillStyle = "#facc15";
      ctx.fillText(line2, boxX + pad, boxY + pad + fontSize * 2 + pad * 0.4);

      callback(canvas.toDataURL("image/jpeg", 0.82), now);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Komponen preview foto ───────────────────────────────────
function PhotoPreview({ src, onRemove }) {
  const [full, setFull] = useState(false);
  return (
    <>
      <div style={{ position: "relative", marginTop: 10 }}>
        <img
          src={src}
          onClick={() => setFull(true)}
          style={{
            width: "100%", borderRadius: 10,
            border: "2px solid #cbd5e1", cursor: "zoom-in",
            display: "block",
          }}
        />
        <button
          onClick={onRemove}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            border: "none", borderRadius: 20,
            padding: "4px 10px", fontSize: 12, fontWeight: 700,
            cursor: "pointer",
          }}
        >✕ Hapus</button>
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          fontSize: 10, padding: "3px 8px", borderRadius: 6,
        }}>
          Ketuk untuk perbesar
        </div>
      </div>

      {/* Fullscreen modal */}
      {full && (
        <div
          onClick={() => setFull(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16,
          }}
        >
          <img src={src} style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8 }} />
          <button style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            border: "none", borderRadius: 20, padding: "8px 16px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>✕ Tutup</button>
        </div>
      )}
    </>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1.5px solid #cbd5e1", fontSize: 15, color: "#1B2A4A",
  background: "#fff", boxSizing: "border-box",
  fontFamily: "'Inter', system-ui, sans-serif", outline: "none",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Terkirim"];
  return (
    <span style={{
      backgroundColor: cfg.bg, color: cfg.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700,
    }}>{cfg.label}</span>
  );
}

function KmRow({ km1, km2 }) {
  if (!km1) return null;
  const jarak = km2 && km2 > km1 ? km2 - km1 : null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
      <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
        🛣 {Number(km1).toLocaleString("id-ID")} km
      </span>
      {km2
        ? <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
            🏁 {Number(km2).toLocaleString("id-ID")} km
          </span>
        : <span style={{ background: "#fef9c3", color: "#a16207", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
            🏁 Tiba belum diisi
          </span>
      }
      {jarak && (
        <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
          📏 {jarak.toLocaleString("id-ID")} km
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DRIVER VIEW
// ══════════════════════════════════════════════════════════════
function DriverView({ onSubmit }) {
  const [driver, setDriver]     = useState("");
  const [nomorSJ, setNomorSJ]   = useState("");
  const [km1, setKm1]           = useState("");
  const [km2, setKm2]           = useState("");
  const [photo, setPhoto]       = useState(null);   // base64 hasil canvas
  const [photoTime, setPhotoTime] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState({});

  const cameraRef  = useRef();
  const galleryRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!driver || !nomorSJ) {
      setError(p => ({ ...p, photo: "Isi Nama Driver & Nomor SJ dulu sebelum foto." }));
      return;
    }
    setError(p => ({ ...p, photo: "" }));
    setProcessing(true);
    const num = String(parseInt(nomorSJ)).padStart(4, "0");
    burnTimestamp(file, driver, num, (dataUrl, time) => {
      setPhoto(dataUrl);
      setPhotoTime(time);
      setProcessing(false);
    });
  };

  const validate = () => {
    const errs = {};
    if (!driver) errs.driver = "Pilih nama driver.";
    const num = parseInt(nomorSJ);
    if (!nomorSJ || isNaN(num) || num < 1 || num > 9999)
      errs.nomorSJ = "Nomor SJ harus angka 1–9999.";
    const k1 = parseInt(km1);
    if (!km1 || isNaN(k1) || k1 < 0) errs.km1 = "KM Berangkat wajib diisi.";
    if (km2) {
      const k2 = parseInt(km2);
      if (isNaN(k2) || k2 <= parseInt(km1))
        errs.km2 = "KM Tiba harus lebih besar dari KM Berangkat.";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setError(errs); return; }
    const sj = {
      id: Date.now(),
      namaDriver: driver,
      nomorSJ: String(parseInt(nomorSJ)).padStart(4, "0"),
      timestamp: new Date(),
      status: "Terkirim",
      keterangan: "",
      km1: parseInt(km1),
      km2: km2 ? parseInt(km2) : null,
      photo,
      photoTime,
    };
    onSubmit(sj);
    setSuccess(sj);
    setNomorSJ(""); setKm1(""); setKm2("");
    setPhoto(null); setPhotoTime(null); setError({});
  };

  const Field = ({ label, children, err, hint }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && !err && <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 5 }}>{hint}</p>}
      {err  && <p style={{ color: "#dc2626",  fontSize: 12, marginTop: 5 }}>{err}</p>}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{formatDate(new Date())}</p>
        <h2 style={{ margin: "4px 0 0", fontSize: 20, color: "#1B2A4A", fontWeight: 800 }}>Input Surat Jalan</h2>
      </div>

      {success && (
        <div style={{
          background: "#dcfce7", border: "1px solid #86efac",
          borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#15803d", fontSize: 13 }}>
              SJ {success.nomorSJ} berhasil diinput!
            </p>
            <p style={{ margin: "2px 0 0", color: "#16a34a", fontSize: 12 }}>
              {success.namaDriver} · {formatTime(success.timestamp)}
              {success.photo ? " · 📷 Foto tersimpan" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Nama Driver */}
      <Field label="Nama Driver" err={error.driver}>
        <select
          value={driver}
          onChange={e => { setDriver(e.target.value); setError(p => ({...p, driver:""})); setSuccess(null); }}
          style={{
            ...inputStyle, appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
            color: driver ? "#1B2A4A" : "#94a3b8",
            border: `1.5px solid ${error.driver ? "#f87171" : "#cbd5e1"}`,
          }}
        >
          <option value="">-- Pilih Driver --</option>
          {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>

      {/* Nomor SJ */}
      <Field label="Nomor Surat Jalan" err={error.nomorSJ}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "#94a3b8", fontWeight: 700, fontSize: 14, letterSpacing: 1,
          }}>SJ</span>
          <input
            type="number" min={1} max={9999} value={nomorSJ} placeholder="0001"
            onChange={e => { setNomorSJ(e.target.value); setError(p => ({...p, nomorSJ:""})); setSuccess(null); }}
            style={{
              ...inputStyle, paddingLeft: 40, fontSize: 22, fontWeight: 800, letterSpacing: 3,
              border: `1.5px solid ${error.nomorSJ ? "#f87171" : "#cbd5e1"}`,
            }}
          />
        </div>
      </Field>

      {/* Divider KM */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 14px" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>📍 DATA KILOMETER</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
        <Field label="KM Berangkat *" err={error.km1}>
          <input
            type="number" min={0} value={km1} placeholder="mis. 12500"
            onChange={e => { setKm1(e.target.value); setError(p => ({...p, km1:""})); }}
            style={{ ...inputStyle, fontSize: 14, fontWeight: 700, border: `1.5px solid ${error.km1 ? "#f87171" : "#cbd5e1"}` }}
          />
        </Field>
        <Field label="KM Tiba (opsional)" err={error.km2}>
          <input
            type="number" min={0} value={km2} placeholder="mis. 12650"
            onChange={e => { setKm2(e.target.value); setError(p => ({...p, km2:""})); }}
            style={{ ...inputStyle, fontSize: 14, fontWeight: 700, border: `1.5px solid ${error.km2 ? "#f87171" : "#cbd5e1"}` }}
          />
        </Field>
      </div>
      <p style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 18px" }}>
        KM Tiba bisa dikosongkan dan diisi nanti.
      </p>

      {/* Divider Foto */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 14px" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>📷 FOTO SURAT JALAN</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      {/* Input tersembunyi */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

      {!photo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
            <button
              onClick={() => cameraRef.current.click()}
              style={{
                padding: "14px 10px", borderRadius: 10,
                border: "1.5px dashed #94a3b8", background: "#f8fafc",
                cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 26 }}>📷</span>
              Ambil Foto
            </button>
            <button
              onClick={() => galleryRef.current.click()}
              style={{
                padding: "14px 10px", borderRadius: 10,
                border: "1.5px dashed #94a3b8", background: "#f8fafc",
                cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 26 }}>🖼</span>
              Dari Galeri
            </button>
          </div>
          {error.photo && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{error.photo}</p>}
          <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 18, textAlign: "center" }}>
            Foto opsional. Timestamp otomatis terbakar ke gambar.
          </p>
        </>
      )}

      {processing && (
        <div style={{
          background: "#f1f5f9", borderRadius: 10, padding: 16,
          textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 18,
        }}>
          ⏳ Memproses gambar & menambahkan timestamp...
        </div>
      )}

      {photo && !processing && (
        <div style={{ marginBottom: 18 }}>
          <PhotoPreview src={photo} onRemove={() => { setPhoto(null); setPhotoTime(null); }} />
          <p style={{ color: "#16a34a", fontSize: 11, marginTop: 6, textAlign: "center", fontWeight: 700 }}>
            ✅ Timestamp tercatat: {photoTime ? formatStamp(photoTime) : "-"}
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #1B2A4A, #2d4a7a)",
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          letterSpacing: 0.5, boxShadow: "0 4px 12px rgba(27,42,74,0.3)",
        }}
      >Submit SJ</button>

      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
        Punya lebih dari 1 SJ? Submit ulang untuk SJ berikutnya.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN VIEW
// ══════════════════════════════════════════════════════════════
function AdminView({ data, onUpdateStatus }) {
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [editId, setEditId]             = useState(null);
  const [editStatus, setEditStatus]     = useState("");
  const [editKet, setEditKet]           = useState("");
  const [editKm2, setEditKm2]           = useState("");
  const [searchQ, setSearchQ]           = useState("");
  const [fullPhoto, setFullPhoto]       = useState(null);

  const filtered = data.filter(sj => {
    const matchStatus = filterStatus === "Semua" || sj.status === filterStatus;
    const matchSearch = sj.nomorSJ.includes(searchQ) ||
      sj.namaDriver.toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openEdit = (sj) => {
    setEditId(sj.id); setEditStatus(sj.status);
    setEditKet(sj.keterangan); setEditKm2(sj.km2 ? String(sj.km2) : "");
  };

  const saveEdit = () => {
    onUpdateStatus(editId, editStatus, editKet, editKm2 ? parseInt(editKm2) : null);
    setEditId(null);
  };

  const countByStatus = (s) => data.filter(sj => sj.status === s).length;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{formatDate(new Date())}</p>
        <h2 style={{ margin: "4px 0 0", fontSize: 20, color: "#1B2A4A", fontWeight: 800 }}>Monitor Surat Jalan</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total SJ", value: data.length,              color: "#1B2A4A", bg: "#f1f5f9" },
          { label: "Tunda",    value: countByStatus("Tunda"),   color: "#d97706", bg: "#fef3c7" },
          { label: "Kembali",  value: countByStatus("Kembali"), color: "#dc2626", bg: "#fee2e2" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: c.color, fontWeight: 600 }}>{c.label}</p>
          </div>
        ))}
      </div>

      <input
        type="text" placeholder="Cari nomor SJ atau nama driver..."
        value={searchQ} onChange={e => setSearchQ(e.target.value)}
        style={{
          ...inputStyle, fontSize: 13, marginBottom: 12,
          border: "1.5px solid #cbd5e1",
        }}
      />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {["Semua", ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            background: filterStatus === s ? "#1B2A4A" : "#f1f5f9",
            color: filterStatus === s ? "#fff" : "#64748b",
          }}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <p style={{ fontSize: 32 }}>📋</p>
          <p style={{ fontSize: 14 }}>Belum ada SJ yang sesuai filter.</p>
        </div>
      ) : (
        filtered.map(sj => (
          <div key={sj.id} style={{
            background: "#fff", borderRadius: 12, padding: "14px 16px",
            marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            border: "1.5px solid #f1f5f9",
          }}>
            {editId === sj.id ? (
              <div>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#1B2A4A" }}>Edit SJ {sj.nomorSJ}</p>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  style={{ ...inputStyle, fontSize: 14, marginBottom: 8, border: "1.5px solid #cbd5e1" }}>
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    🏁 KM Tiba
                  </label>
                  <input type="number" min={0} value={editKm2}
                    placeholder={sj.km1 ? `> ${sj.km1.toLocaleString("id-ID")}` : "KM tiba"}
                    onChange={e => setEditKm2(e.target.value)}
                    style={{ ...inputStyle, fontSize: 14, border: "1.5px solid #cbd5e1" }}
                  />
                </div>
                <input type="text" placeholder="Keterangan (opsional)"
                  value={editKet} onChange={e => setEditKet(e.target.value)}
                  style={{ ...inputStyle, fontSize: 14, marginBottom: 10, border: "1.5px solid #cbd5e1" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{
                    flex: 1, padding: "10px", background: "#1B2A4A", color: "#fff",
                    border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13,
                  }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{
                    flex: 1, padding: "10px", background: "#f1f5f9", color: "#64748b",
                    border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13,
                  }}>Batal</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#1B2A4A", letterSpacing: 1 }}>
                        SJ {sj.nomorSJ}
                      </span>
                      <StatusBadge status={sj.status} />
                      {sj.photo && (
                        <span style={{
                          background: "#f0fdf4", color: "#16a34a",
                          padding: "2px 8px", borderRadius: 6,
                          fontSize: 11, fontWeight: 700,
                        }}>📷</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      {sj.namaDriver} · {formatTime(sj.timestamp)}
                    </p>
                    <KmRow km1={sj.km1} km2={sj.km2} />
                    {sj.keterangan && (
                      <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                        "{sj.keterangan}"
                      </p>
                    )}
                  </div>
                  <button onClick={() => openEdit(sj)} style={{
                    padding: "8px 12px", background: "#f1f5f9", border: "none",
                    borderRadius: 8, cursor: "pointer", color: "#475569",
                    fontSize: 12, fontWeight: 700, marginLeft: 8, flexShrink: 0,
                  }}>Edit</button>
                </div>

                {/* Thumbnail foto */}
                {sj.photo && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={sj.photo}
                      onClick={() => setFullPhoto(sj.photo)}
                      style={{
                        width: "100%", maxHeight: 140, objectFit: "cover",
                        borderRadius: 8, border: "1.5px solid #e2e8f0",
                        cursor: "zoom-in", display: "block",
                      }}
                    />
                    <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 4, textAlign: "right" }}>
                      Ketuk untuk perbesar · Disimpan 10 hari
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Fullscreen foto */}
      {fullPhoto && (
        <div
          onClick={() => setFullPhoto(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16,
          }}
        >
          <img src={fullPhoto} style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8 }} />
          <button style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            border: "none", borderRadius: 20, padding: "8px 16px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
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
  const [activeTab, setActiveTab] = useState("driver");
  const [sjList, setSjList]       = useState([]);

  const handleSubmit = (sj) => setSjList(prev => [sj, ...prev]);
  const handleUpdate = (id, status, keterangan, km2) => {
    setSjList(prev => prev.map(sj =>
      sj.id === id ? { ...sj, status, keterangan, km2: km2 ?? sj.km2 } : sj
    ));
  };

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative", paddingBottom: 80,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1B2A4A 0%, #2d4a7a 100%)",
        padding: "20px 20px 16px", color: "#fff",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>🚚</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: 0.3 }}>Rekap Surat Jalan</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#93c5fd" }}>Sistem Monitoring Pengiriman</p>
        </div>
      </div>

      {activeTab === "driver"
        ? <DriverView onSubmit={handleSubmit} />
        : <AdminView data={sjList} onUpdateStatus={handleUpdate} />
      }

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
      }}>
        {[
          { key: "driver", icon: "🙋", label: "Driver" },
          { key: "admin",  icon: "📋", label: "Admin"  },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "12px 8px 10px", border: "none", background: "transparent",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2,
            color: activeTab === tab.key ? "#1B2A4A" : "#94a3b8",
            borderTop: activeTab === tab.key ? "2.5px solid #1B2A4A" : "2.5px solid transparent",
          }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

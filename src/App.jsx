import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  KONFIGURASI — ganti sesuai kebutuhan
// ─────────────────────────────────────────────────────────────
const API_URL        = "https://script.google.com/macros/s/AKfycbw7iUHRyYbyrMxpPSjVkUMDds8i-jKpOhqDpsS-bjhstqHuQ6ED_YbaC0C89yK44GGu0A/exec";
const ADMIN_PASSWORD = "maxcell2026"; // harus sama dengan di Code.gs

const STATUS_CONFIG = {
  Selesai: { color:"#16a34a", bg:"#dcfce7", icon:"✅" },
  Tunda:   { color:"#d97706", bg:"#fef3c7", icon:"⏸" },
  Kembali: { color:"#ea580c", bg:"#ffedd5", icon:"🔄" },
  Batal:   { color:"#dc2626", bg:"#fee2e2", icon:"❌" },
};

const KATEGORI_LIST  = ["Keramik","Non-Keramik","Campuran"];
const JENIS_MOBIL    = ["Besar","Kecil"];
const DEFAULT_DRIVERS     = ["Mas Galang","Bang Yus","Om Ipul"];
const DEFAULT_ASS_DRIVERS = ["Adit","Agym"];

// ── Helpers ───────────────────────────────────────────────────
const toProperCase = (s) => s ? s.toLowerCase().replace(/(?:^|\s)\S/g, c=>c.toUpperCase()) : s;
const toNum        = (v) => parseInt(String(v).replace(/[^0-9]/g,""),10);
const getSJPreview = (n) => {
  const now=new Date(), yy=String(now.getFullYear()).slice(-2), mm=String(now.getMonth()+1).padStart(2,"0");
  return `SP/KLK-${yy}${mm}${String(parseInt(n)||0).padStart(4,"0")}`;
};
const getTodayStr = () => {
  const now=new Date();
  return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
};
const formatDateInput = (str) => {
  // "13/07/2026" → "2026-07-13" untuk input type=date
  if (!str) return "";
  const [d,m,y] = str.split("/");
  return `${y}-${m}-${d}`;
};
const parseDateInput = (val) => {
  // "2026-07-13" → "13/07/2026"
  if (!val) return "";
  const [y,m,d] = val.split("-");
  return `${d}/${m}/${y}`;
};

async function apiGet(params) {
  const res=await fetch(API_URL+"?"+new URLSearchParams(params),{redirect:"follow"});
  return JSON.parse(await res.text());
}

// ── Shared styles ─────────────────────────────────────────────
const IS={
  width:"100%",padding:"12px 14px",borderRadius:10,
  border:"1.5px solid #cbd5e1",fontSize:15,color:"#1B2A4A",
  background:"#fff",boxSizing:"border-box",
  fontFamily:"'Inter',system-ui,sans-serif",outline:"none",
};
const ARW={
  appearance:"none",
  backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",
};

function Field({label,children,err,hint}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>{label}</label>
      {children}
      {hint&&!err&&<p style={{color:"#94a3b8",fontSize:11,marginTop:5}}>{hint}</p>}
      {err&&<p style={{color:"#dc2626",fontSize:12,marginTop:5}}>{err}</p>}
    </div>
  );
}

function Divider({label}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0 14px"}}>
      <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      <span style={{fontSize:11,color:"#94a3b8",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>
      <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
    </div>
  );
}

function SelectWithCustom({options,value,onChange,placeholder,hasError}) {
  const [isCustom,setIsCustom]=useState(false);
  const [raw,setRaw]=useState("");
  return (
    <div>
      <select value={isCustom?"__CUSTOM__":(value||"")}
        onChange={e=>{if(e.target.value==="__CUSTOM__"){setIsCustom(true);onChange("");}else{setIsCustom(false);onChange(e.target.value);}}}
        style={{...IS,...ARW,color:(value||isCustom)?"#1B2A4A":"#94a3b8",border:`1.5px solid ${hasError?"#f87171":"#cbd5e1"}`}}>
        <option value="">{placeholder}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
        <option value="__CUSTOM__">Lainnya (isi sendiri)...</option>
      </select>
      {isCustom&&(
        <div style={{marginTop:8,position:"relative"}}>
          <input type="text" value={raw}
            onChange={e=>{setRaw(e.target.value);onChange(toProperCase(e.target.value));}}
            onBlur={()=>{const p=toProperCase(raw);setRaw(p);onChange(p);}}
            placeholder="Ketik nama..." autoFocus
            style={{...IS,fontSize:14,border:`1.5px solid ${hasError?"#f87171":"#3b82f6"}`}}/>
          <button onClick={()=>{setIsCustom(false);setRaw("");onChange("");}}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:4}}>✕</button>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({options,values,onChange}) {
  const [showCustom,setShowCustom]=useState(false);
  const [customVal,setCustomVal]=useState("");
  const remaining=options.filter(o=>!values.includes(o));
  return (
    <div>
      <select onChange={e=>{const v=e.target.value;if(!v)return;if(v==="__CUSTOM__"){setShowCustom(true);}else if(!values.includes(v)){onChange([...values,v]);}e.target.value="";}}
        defaultValue="" style={{...IS,...ARW,color:"#94a3b8"}}>
        <option value="">-- Pilih Ass. Driver --</option>
        {remaining.map(o=><option key={o} value={o}>{o}</option>)}
        <option value="__CUSTOM__">Lainnya (isi sendiri)...</option>
      </select>
      {showCustom&&(
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input type="text" value={customVal} onChange={e=>setCustomVal(e.target.value)}
            onBlur={()=>{if(customVal)setCustomVal(toProperCase(customVal));}}
            onKeyDown={e=>{if(e.key==="Enter"){const p=toProperCase(customVal.trim());if(p&&!values.includes(p))onChange([...values,p]);setCustomVal("");setShowCustom(false);}}}
            placeholder="Ketik nama..." autoFocus style={{...IS,flex:1,fontSize:14}}/>
          <button onClick={()=>{const p=toProperCase(customVal.trim());if(p&&!values.includes(p))onChange([...values,p]);setCustomVal("");setShowCustom(false);}}
            style={{padding:"0 16px",background:"#1B2A4A",color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13}}>OK</button>
          <button onClick={()=>{setShowCustom(false);setCustomVal("");}}
            style={{padding:"0 12px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13}}>✕</button>
        </div>
      )}
      {values.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
          {values.map(v=>(
            <span key={v} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#1B2A4A",color:"#fff",padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:700}}>
              {v}<button onClick={()=>onChange(values.filter(x=>x!==v))} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function KategoriSelector({value,onChange,hasError}) {
  const meta={"Keramik":{icon:"🧱",color:"#1B2A4A"},"Non-Keramik":{icon:"📦",color:"#0f766e"},"Campuran":{icon:"🔀",color:"#7c3aed"}};
  return (
    <div style={{display:"flex",gap:8}}>
      {KATEGORI_LIST.map(opt=>{
        const sel=value===opt,m=meta[opt];
        return (
          <button key={opt} onClick={()=>onChange(opt)} style={{
            flex:1,padding:"10px 6px",borderRadius:10,cursor:"pointer",
            border:sel?"none":`1.5px solid ${hasError?"#f87171":"#cbd5e1"}`,
            background:sel?m.color:"#fff",color:sel?"#fff":"#475569",
            fontSize:12,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            boxShadow:sel?`0 0 0 2px ${m.color}`:undefined,
          }}><span style={{fontSize:18}}>{m.icon}</span>{opt}</button>
        );
      })}
    </div>
  );
}

function StatusSelector({value,onChange}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {Object.entries(STATUS_CONFIG).map(([s,cfg])=>{
        const sel=value===s;
        return (
          <button key={s} onClick={()=>onChange(s)} style={{
            padding:"11px 12px",borderRadius:10,cursor:"pointer",
            border:sel?"none":"1.5px solid #cbd5e1",
            background:sel?cfg.bg:"#fff",color:sel?cfg.color:"#64748b",
            fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,
            boxShadow:sel?`0 0 0 2px ${cfg.color}`:"none",
          }}><span style={{fontSize:18}}>{cfg.icon}</span>{s}</button>
        );
      })}
    </div>
  );
}

function StatusBadge({status}) {
  const cfg=STATUS_CONFIG[status]||{color:"#475569",bg:"#f1f5f9",icon:"•"};
  return <span style={{backgroundColor:cfg.bg,color:cfg.color,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{cfg.icon} {status}</span>;
}

function KmRow({km1,km2}) {
  if(!km1)return null;
  const jarak=km2&&Number(km2)>Number(km1)?Number(km2)-Number(km1):null;
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}>
      <span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🛣 {Number(km1).toLocaleString("id-ID")} km</span>
      {km2?<span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🏁 {Number(km2).toLocaleString("id-ID")} km</span>
          :<span style={{background:"#fef9c3",color:"#a16207",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🏁 KM Tiba belum diisi</span>}
      {jarak&&<span style={{background:"#dbeafe",color:"#1d4ed8",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>📏 {jarak.toLocaleString("id-ID")} km</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════
function LoginScreen({drivers,onLogin}) {
  const [step,setStep]         = useState("choose"); // choose | driver | admin
  const [driverName,setDriver] = useState("");
  const [password,setPassword] = useState("");
  const [showPass,setShowPass] = useState(false);
  const [error,setError]       = useState("");
  const [loading,setLoading]   = useState(false);

  const handleDriverLogin=()=>{
    if(!driverName){setError("Pilih nama driver terlebih dahulu.");return;}
    onLogin({role:"driver",name:driverName});
  };

  const handleAdminLogin=async()=>{
    if(!password){setError("Masukkan password.");return;}
    setLoading(true);
    try {
      const r=await apiGet({action:"verifyAdmin",password});
      if(r.success){onLogin({role:"admin"});}
      else{setError("Password salah. Coba lagi.");}
    } catch(e){setError("Koneksi bermasalah. Coba lagi.");}
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%)",padding:"48px 24px 40px",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:52,marginBottom:12}}>🚚</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:0.5}}>Rekap Surat Jalan</h1>
        <p style={{margin:"6px 0 0",fontSize:13,color:"#93c5fd"}}>Sistem Monitoring Pengiriman Maxcell</p>
      </div>

      <div style={{flex:1,padding:24,maxWidth:420,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        {step==="choose"&&(
          <>
            <p style={{textAlign:"center",color:"#64748b",fontSize:14,marginBottom:24,fontWeight:600}}>
              Masuk sebagai:
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <button onClick={()=>{setStep("driver");setError("");}} style={{
                padding:"28px 16px",borderRadius:16,border:"1.5px solid #e2e8f0",
                background:"#fff",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <span style={{fontSize:40}}>🙋</span>
                <span style={{fontSize:15,fontWeight:800,color:"#1B2A4A"}}>Driver</span>
                <span style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>Input Surat Jalan</span>
              </button>
              <button onClick={()=>{setStep("admin");setError("");}} style={{
                padding:"28px 16px",borderRadius:16,border:"1.5px solid #e2e8f0",
                background:"#fff",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <span style={{fontSize:40}}>📋</span>
                <span style={{fontSize:15,fontWeight:800,color:"#1B2A4A"}}>Admin</span>
                <span style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>Monitor & Rekap</span>
              </button>
            </div>
          </>
        )}

        {step==="driver"&&(
          <>
            <button onClick={()=>{setStep("choose");setError("");setDriver("");}}
              style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:13,fontWeight:700,marginBottom:20,padding:0,display:"flex",alignItems:"center",gap:4}}>
              ← Kembali
            </button>
            <h2 style={{margin:"0 0 20px",fontSize:18,color:"#1B2A4A",fontWeight:800}}>Login Driver</h2>
            <Field label="Nama Driver" err={error}>
              <SelectWithCustom options={drivers} value={driverName}
                onChange={v=>{setDriver(v);setError("");}}
                placeholder="-- Pilih nama Anda --" hasError={!!error}/>
            </Field>
            <button onClick={handleDriverLogin} style={{
              width:"100%",padding:"14px",marginTop:8,
              background:"linear-gradient(135deg,#1B2A4A,#2d4a7a)",
              color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",
              boxShadow:"0 4px 12px rgba(27,42,74,0.3)",
            }}>Masuk sebagai Driver</button>
          </>
        )}

        {step==="admin"&&(
          <>
            <button onClick={()=>{setStep("choose");setError("");setPassword("");}}
              style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:13,fontWeight:700,marginBottom:20,padding:0,display:"flex",alignItems:"center",gap:4}}>
              ← Kembali
            </button>
            <h2 style={{margin:"0 0 20px",fontSize:18,color:"#1B2A4A",fontWeight:800}}>Login Admin</h2>
            <Field label="Password Admin" err={error}>
              <div style={{position:"relative"}}>
                <input
                  type={showPass?"text":"password"} value={password}
                  onChange={e=>{setPassword(e.target.value);setError("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}
                  placeholder="Masukkan password"
                  style={{...IS,paddingRight:48,border:`1.5px solid ${error?"#f87171":"#cbd5e1"}`}}/>
                <button onClick={()=>setShowPass(!showPass)} style={{
                  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#94a3b8",padding:4,
                }}>{showPass?"🙈":"👁"}</button>
              </div>
            </Field>
            <button onClick={handleAdminLogin} disabled={loading} style={{
              width:"100%",padding:"14px",marginTop:8,
              background:loading?"#94a3b8":"linear-gradient(135deg,#1B2A4A,#2d4a7a)",
              color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,
              cursor:loading?"default":"pointer",boxShadow:"0 4px 12px rgba(27,42,74,0.3)",
            }}>{loading?"Memverifikasi...":"Masuk sebagai Admin"}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DRIVER VIEW
// ══════════════════════════════════════════════════════════════
function DriverView({drivers,assDrivers,driverName}) {
  const [jenisMobil,setJenisMobil] = useState("");
  const [driver,setDriver]         = useState(driverName||"");
  const [assDriver,setAssDriver]   = useState([]);
  const [nomorSJ,setNomorSJ]       = useState("");
  const [kategori,setKategori]     = useState("");
  const [km1,setKm1]               = useState("");
  const [km2,setKm2]               = useState("");
  const [jamTiba,setJamTiba]       = useState("");
  const [jamSelesai,setJamSelesai] = useState("");
  const [status,setStatus]         = useState("Selesai");
  const [catatan,setCatatan]       = useState("");
  const [loading,setLoading]       = useState(false);
  const [success,setSuccess]       = useState(null);
  const [error,setError]           = useState({});

  const today=new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
  const preview=getSJPreview(nomorSJ);

  const validate=()=>{
    const e={};
    if(!jenisMobil)e.jenisMobil="Pilih jenis mobil.";
    if(!driver)e.driver="Pilih nama driver.";
    const n=parseInt(nomorSJ);
    if(!nomorSJ||isNaN(n)||n<1||n>9999)e.nomorSJ="Nomor SJ harus angka 1–9999.";
    if(!kategori)e.kategori="Pilih kategori SJ.";
    const k1=toNum(km1);
    if(!km1||isNaN(k1)||k1<0)e.km1="KM Berangkat wajib diisi.";
    if(km2){const k2=toNum(km2);if(isNaN(k2)||k2<=toNum(km1))e.km2="KM Tiba harus lebih besar dari KM Berangkat.";}
    return e;
  };

  const handleSubmit=async()=>{
    const errs=validate();
    if(Object.keys(errs).length){setError(errs);return;}
    setLoading(true);
    try {
      const nn=String(parseInt(nomorSJ)).padStart(4,"0");
      const result=await apiGet({
        action:"addSJ",jenisMobil,namaDriver:driver,assDriver:assDriver.join(", "),
        nomorSJ:nn,kategori,km1:toNum(km1),km2:km2?toNum(km2):"",
        jamTiba,jamSelesai,status,catatan,
      });
      if(result.success){
        setSuccess({driver,formattedSJ:result.formattedSJ,timestamp:result.timestamp,status,kategori,jenisMobil});
        setJenisMobil("");setNomorSJ("");setKategori("");
        setKm1("");setKm2("");setJamTiba("");setJamSelesai("");
        setStatus("Selesai");setCatatan("");setAssDriver([]);setError({});
      } else {
        setError({submit:"Gagal menyimpan: "+(result.error||"Error tidak dikenal")});
      }
    } catch(e){setError({submit:"Koneksi bermasalah. Coba lagi."});}
    setLoading(false);
  };

  return (
    <div style={{padding:20,paddingBottom:40}}>
      <div style={{marginBottom:20}}>
        <p style={{color:"#64748b",fontSize:13,margin:0}}>{today}</p>
        <h2 style={{margin:"4px 0 0",fontSize:20,color:"#1B2A4A",fontWeight:800}}>Input Surat Jalan</h2>
        <p style={{margin:"4px 0 0",fontSize:13,color:"#94a3b8"}}>Login sebagai: <strong style={{color:"#1B2A4A"}}>{driverName}</strong></p>
      </div>

      {success&&(
        <div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:12,padding:"14px 16px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <div>
            <p style={{margin:0,fontWeight:700,color:"#15803d",fontSize:13}}>{success.formattedSJ} berhasil disimpan!</p>
            <p style={{margin:"2px 0 0",color:"#16a34a",fontSize:12}}>{success.jenisMobil} · {success.driver} · {success.timestamp}</p>
            <p style={{margin:"2px 0 0",color:"#16a34a",fontSize:12}}>{success.kategori} · {success.status}</p>
          </div>
        </div>
      )}
      {error.submit&&(
        <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:12,padding:"12px 16px",marginBottom:16,color:"#dc2626",fontSize:13,fontWeight:600}}>
          ⚠️ {error.submit}
        </div>
      )}

      {/* Jenis Mobil */}
      <Field label="Jenis Mobil" err={error.jenisMobil}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {JENIS_MOBIL.map(jm=>{
            const sel=jenisMobil===jm,icon=jm==="Besar"?"🚛":"🚐";
            return (
              <button key={jm} onClick={()=>{setJenisMobil(jm);setError(p=>({...p,jenisMobil:""}));}} style={{
                padding:"14px 10px",borderRadius:10,cursor:"pointer",
                border:sel?"none":`1.5px solid ${error.jenisMobil?"#f87171":"#cbd5e1"}`,
                background:sel?"#1B2A4A":"#fff",color:sel?"#fff":"#475569",
                fontSize:14,fontWeight:800,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                boxShadow:sel?"0 0 0 2px #1B2A4A":undefined,
              }}><span style={{fontSize:28}}>{icon}</span>Mobil {jm}</button>
            );
          })}
        </div>
      </Field>

      {/* Nama Driver */}
      <Field label="Nama Driver" err={error.driver}>
        <SelectWithCustom options={drivers} value={driver}
          onChange={v=>{setDriver(v);setError(p=>({...p,driver:""}));setSuccess(null);}}
          placeholder="-- Pilih Driver --" hasError={!!error.driver}/>
      </Field>

      {/* Ass. Driver */}
      <Field label="Ass. Driver">
        <MultiSelectDropdown options={assDrivers} values={assDriver} onChange={setAssDriver}/>
      </Field>

      {/* Nomor SJ */}
      <Field label="Nomor Surat Jalan" err={error.nomorSJ}
        hint={nomorSJ?`Tersimpan sebagai: ${preview}`:"Masukkan angka 1–9999 sesuai SJ fisik"}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontWeight:700,fontSize:14,letterSpacing:1,pointerEvents:"none"}}>SJ</span>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={nomorSJ} placeholder="0001"
            onChange={e=>{setNomorSJ(e.target.value.replace(/[^0-9]/g,""));setError(p=>({...p,nomorSJ:""}));setSuccess(null);}}
            style={{...IS,paddingLeft:40,fontSize:22,fontWeight:800,letterSpacing:3,border:`1.5px solid ${error.nomorSJ?"#f87171":"#cbd5e1"}`}}/>
        </div>
      </Field>

      {/* Kategori */}
      <Field label="Kategori SJ" err={error.kategori}>
        <KategoriSelector value={kategori} onChange={v=>{setKategori(v);setError(p=>({...p,kategori:""}));}} hasError={!!error.kategori}/>
      </Field>

      {/* KM */}
      <Divider label="📍 DATA KILOMETER"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Field label="KM Berangkat" err={error.km1}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={km1} placeholder="12500"
            onChange={e=>{setKm1(e.target.value.replace(/[^0-9]/g,""));setError(p=>({...p,km1:""}));}}
            style={{...IS,fontSize:15,fontWeight:700,border:`1.5px solid ${error.km1?"#f87171":"#cbd5e1"}`}}/>
        </Field>
        <Field label="KM Tiba" err={error.km2}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={km2} placeholder="12650"
            onChange={e=>{setKm2(e.target.value.replace(/[^0-9]/g,""));setError(p=>({...p,km2:""}));}}
            style={{...IS,fontSize:15,fontWeight:700,border:`1.5px solid ${error.km2?"#f87171":"#cbd5e1"}`}}/>
        </Field>
      </div>

      {/* Jam */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Field label="🕐 Jam Tiba di Lokasi">
          <input type="time" value={jamTiba} onChange={e=>setJamTiba(e.target.value)}
            style={{...IS,fontSize:15,fontWeight:700,color:jamTiba?"#1B2A4A":"#94a3b8"}}/>
        </Field>
        <Field label="🏁 Jam Selesai">
          <input type="time" value={jamSelesai} onChange={e=>setJamSelesai(e.target.value)}
            style={{...IS,fontSize:15,fontWeight:700,color:jamSelesai?"#1B2A4A":"#94a3b8"}}/>
        </Field>
      </div>
      {jamTiba&&jamSelesai&&(()=>{
        const [h1,m1]=jamTiba.split(":").map(Number),[h2,m2]=jamSelesai.split(":").map(Number);
        let diff=(h2*60+m2)-(h1*60+m1);if(diff<0)diff+=1440;
        const h=Math.floor(diff/60),m=diff%60;
        return <p style={{color:"#16a34a",fontSize:12,fontWeight:700,marginBottom:14,marginTop:-8}}>⏱ Durasi pembongkaran: {h>0?`${h} jam ${m} menit`:`${m} menit`}</p>;
      })()}

      {/* Status */}
      <Divider label="📋 STATUS PENGIRIMAN"/>
      <Field label="Status saat ini"><StatusSelector value={status} onChange={setStatus}/></Field>

      {/* Catatan */}
      <Field label="Catatan">
        <textarea value={catatan} onChange={e=>setCatatan(e.target.value)}
          placeholder="Contoh: Tunda karena macet, barang kurang, dll..."
          rows={3} style={{...IS,resize:"none",fontSize:14,lineHeight:1.5}}/>
      </Field>

      <button onClick={handleSubmit} disabled={loading} style={{
        width:"100%",padding:"14px",
        background:loading?"#94a3b8":"linear-gradient(135deg,#1B2A4A,#2d4a7a)",
        color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,
        cursor:loading?"default":"pointer",letterSpacing:0.5,
        boxShadow:"0 4px 12px rgba(27,42,74,0.3)",
      }}>{loading?"⏳ Menyimpan...":"Submit SJ"}</button>
      <p style={{textAlign:"center",color:"#94a3b8",fontSize:12,marginTop:12}}>Punya lebih dari 1 SJ? Submit ulang untuk SJ berikutnya.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN MONITOR VIEW
// ══════════════════════════════════════════════════════════════
function AdminView() {
  const [sjList,setSjList]                 = useState([]);
  const [filterStatus,setFilterStatus]     = useState("Semua");
  const [editId,setEditId]                 = useState(null);
  const [editStatus,setEditStatus]         = useState("");
  const [editCatatan,setEditCatatan]       = useState("");
  const [editKm2,setEditKm2]               = useState("");
  const [editJamTiba,setEditJamTiba]       = useState("");
  const [editJamSelesai,setEditJamSelesai] = useState("");
  const [searchQ,setSearchQ]               = useState("");
  const [loading,setLoading]               = useState(false);
  const [saving,setSaving]                 = useState(false);
  const [errorMsg,setErrorMsg]             = useState("");

  const loadData=async()=>{
    setLoading(true);setErrorMsg("");
    try {
      const r=await apiGet({action:"getSJList"});
      if(r.success)setSjList(r.data||[]);
      else setErrorMsg("Gagal memuat: "+(r.error||"Error tidak dikenal"));
    } catch(e){setErrorMsg("Koneksi bermasalah. Ketuk Refresh.");}
    setLoading(false);
  };
  useEffect(()=>{loadData();},[]);

  const filtered=sjList.filter(sj=>{
    const mS=filterStatus==="Semua"||sj.status===filterStatus;
    const q=searchQ.toLowerCase();
    const mQ=String(sj.nomorSJ||"").toLowerCase().includes(q)||String(sj.namaDriver||"").toLowerCase().includes(q)||String(sj.kategori||"").toLowerCase().includes(q)||String(sj.jenisMobil||"").toLowerCase().includes(q);
    return mS&&mQ;
  });

  const openEdit=(sj)=>{setEditId(sj.id);setEditStatus(sj.status);setEditCatatan(sj.catatan||"");setEditKm2(sj.km2?String(sj.km2):"");setEditJamTiba(sj.jamTiba||"");setEditJamSelesai(sj.jamSelesai||"");};
  const saveEdit=async()=>{
    setSaving(true);
    try {
      const r=await apiGet({action:"updateStatus",id:editId,status:editStatus,catatan:editCatatan,km2:editKm2?toNum(editKm2):"",jamTiba:editJamTiba,jamSelesai:editJamSelesai});
      if(r.success){setSjList(prev=>prev.map(sj=>sj.id===editId?{...sj,status:editStatus,catatan:editCatatan,km2:editKm2?toNum(editKm2):sj.km2,jamTiba:editJamTiba,jamSelesai:editJamSelesai}:sj));setEditId(null);}
    } catch(_){}
    setSaving(false);
  };
  const countBy=(s)=>sjList.filter(sj=>sj.status===s).length;
  const KATMETA={"Keramik":{color:"#1B2A4A",bg:"#e8eaf6"},"Non-Keramik":{color:"#0f766e",bg:"#ccfbf1"},"Campuran":{color:"#7c3aed",bg:"#ede9fe"}};

  return (
    <div style={{padding:20}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{margin:0,fontSize:20,color:"#1B2A4A",fontWeight:800}}>Monitor Surat Jalan</h2>
          <button onClick={loadData} style={{padding:"6px 12px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,color:"#475569"}}>🔄 Refresh</button>
        </div>
      </div>

      {errorMsg&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:"12px 16px",marginBottom:16,color:"#dc2626",fontSize:13,fontWeight:600}}>⚠️ {errorMsg}</div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {label:"Total",value:sjList.length,color:"#1B2A4A",bg:"#f1f5f9"},
          {label:"Tunda",value:countBy("Tunda"),color:"#d97706",bg:"#fef3c7"},
          {label:"Kembali",value:countBy("Kembali"),color:"#ea580c",bg:"#ffedd5"},
        ].map(c=>(
          <div key={c.label} style={{background:c.bg,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:22,fontWeight:900,color:c.color}}>{c.value}</p>
            <p style={{margin:0,fontSize:11,color:c.color,fontWeight:600}}>{c.label}</p>
          </div>
        ))}
      </div>

      <input type="text" placeholder="Cari SJ, driver, kategori..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
        style={{...IS,fontSize:13,marginBottom:12,border:"1.5px solid #cbd5e1"}}/>

      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:16}}>
        {["Semua",...Object.keys(STATUS_CONFIG)].map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)} style={{
            padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",
            background:filterStatus===s?"#1B2A4A":"#f1f5f9",color:filterStatus===s?"#fff":"#64748b",
          }}>{s}</button>
        ))}
      </div>

      {loading?<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>⏳</p><p style={{fontSize:14}}>Memuat data...</p></div>
      :filtered.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>📋</p><p style={{fontSize:14}}>Belum ada SJ yang sesuai filter.</p></div>
      :filtered.map(sj=>(
        <div key={sj.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1.5px solid #f1f5f9"}}>
          {editId===sj.id?(
            <div>
              <p style={{margin:"0 0 10px",fontWeight:800,color:"#1B2A4A"}}>{sj.nomorSJ}</p>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Status</label>
              <StatusSelector value={editStatus} onChange={setEditStatus}/>
              <div style={{marginTop:10,marginBottom:8}}>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🏁 KM Tiba</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={editKm2} placeholder="KM tiba" onChange={e=>setEditKm2(e.target.value.replace(/[^0-9]/g,""))} style={{...IS,fontSize:14,border:"1.5px solid #cbd5e1"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🕐 Jam Tiba</label>
                  <input type="time" value={editJamTiba} onChange={e=>setEditJamTiba(e.target.value)} style={{...IS,fontSize:14,border:"1.5px solid #cbd5e1"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🏁 Jam Selesai</label>
                  <input type="time" value={editJamSelesai} onChange={e=>setEditJamSelesai(e.target.value)} style={{...IS,fontSize:14,border:"1.5px solid #cbd5e1"}}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>Catatan</label>
                <textarea value={editCatatan} onChange={e=>setEditCatatan(e.target.value)} placeholder="Catatan..." rows={2} style={{...IS,resize:"none",fontSize:14,border:"1.5px solid #cbd5e1"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveEdit} disabled={saving} style={{flex:1,padding:"10px",background:saving?"#94a3b8":"#1B2A4A",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:saving?"default":"pointer",fontSize:13}}>{saving?"Menyimpan...":"Simpan"}</button>
                <button onClick={()=>setEditId(null)} style={{flex:1,padding:"10px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>Batal</button>
              </div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#1B2A4A"}}>{sj.nomorSJ}</span>
                    <StatusBadge status={sj.status}/>
                    {sj.kategori&&<span style={{background:(KATMETA[sj.kategori]||{}).bg||"#f1f5f9",color:(KATMETA[sj.kategori]||{}).color||"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{sj.kategori}</span>}
                    {sj.jenisMobil&&<span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{sj.jenisMobil==="Besar"?"🚛":"🚐"} {sj.jenisMobil}</span>}
                  </div>
                  <p style={{margin:0,fontSize:12,color:"#64748b"}}>{sj.namaDriver}{sj.assDriver?<span style={{color:"#94a3b8"}}> + {sj.assDriver}</span>:null}{" · "}{sj.timestamp}</p>
                  <KmRow km1={sj.km1} km2={sj.km2}/>
                  {(sj.jamTiba||sj.jamSelesai)&&(
                    <p style={{margin:"4px 0 0",fontSize:12,color:"#475569"}}>
                      {sj.jamTiba?<>🕐 <strong>{sj.jamTiba}</strong></>:""}
                      {sj.jamTiba&&sj.jamSelesai?" · ":""}
                      {sj.jamSelesai?<>🏁 <strong>{sj.jamSelesai}</strong></>:""}
                      {sj.durasi?<> · ⏱ <strong>{sj.durasi}</strong></>:""}
                    </p>
                  )}
                  {/* Catatan merah */}
                  {sj.catatan&&(
                    <p style={{margin:"5px 0 0",fontSize:12,color:"#dc2626",fontWeight:600,background:"#fee2e2",padding:"4px 8px",borderRadius:6,display:"inline-block"}}>
                      ⚠️ {sj.catatan}
                    </p>
                  )}
                </div>
                <button onClick={()=>openEdit(sj)} style={{padding:"8px 12px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",color:"#475569",fontSize:12,fontWeight:700,marginLeft:8,flexShrink:0}}>Edit</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REKAP HARIAN VIEW
// ══════════════════════════════════════════════════════════════
function RekapView() {
  const [tanggal,setTanggal] = useState(getTodayStr());
  const [rekap,setRekap]     = useState(null);
  const [loading,setLoading] = useState(false);
  const [errorMsg,setErrorMsg]= useState("");

  const loadRekap=async(tgl)=>{
    setLoading(true);setErrorMsg("");setRekap(null);
    try {
      const r=await apiGet({action:"getRekapHarian",tanggal:tgl});
      if(r.success)setRekap(r.data);
      else setErrorMsg("Gagal memuat rekap.");
    } catch(e){setErrorMsg("Koneksi bermasalah.");}
    setLoading(false);
  };

  useEffect(()=>{loadRekap(tanggal);},[]);

  const handleDateChange=(e)=>{
    const tgl=parseDateInput(e.target.value);
    setTanggal(tgl);loadRekap(tgl);
  };

  const STATCOLOR={Selesai:"#16a34a",Tunda:"#d97706",Kembali:"#ea580c",Batal:"#dc2626"};
  const KATCOLOR={"Keramik":"#1B2A4A","Non-Keramik":"#0f766e","Campuran":"#7c3aed"};

  return (
    <div style={{padding:20}}>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:"0 0 4px",fontSize:20,color:"#1B2A4A",fontWeight:800}}>Rekap Harian</h2>
        <p style={{margin:0,fontSize:13,color:"#64748b"}}>Ringkasan pengiriman per tanggal</p>
      </div>

      {/* Date picker */}
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
        <input type="date" value={formatDateInput(tanggal)} onChange={handleDateChange}
          style={{...IS,flex:1,fontSize:14,fontWeight:700}}/>
        <button onClick={()=>loadRekap(tanggal)} style={{
          padding:"12px 16px",background:"#1B2A4A",color:"#fff",border:"none",
          borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap",
        }}>🔄 Muat</button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>⏳</p><p style={{fontSize:14}}>Memuat rekap...</p></div>}
      {errorMsg&&<div style={{background:"#fee2e2",borderRadius:10,padding:"12px 16px",color:"#dc2626",fontSize:13,fontWeight:600}}>⚠️ {errorMsg}</div>}

      {rekap&&!loading&&(
        <>
          {/* Summary cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            <div style={{background:"linear-gradient(135deg,#1B2A4A,#2d4a7a)",borderRadius:12,padding:"16px",color:"#fff",gridColumn:"1/-1"}}>
              <p style={{margin:0,fontSize:13,color:"#93c5fd",fontWeight:600}}>{tanggal}</p>
              <p style={{margin:"4px 0 0",fontSize:36,fontWeight:900}}>{rekap.totalSJ}</p>
              <p style={{margin:"2px 0 0",fontSize:13,color:"#93c5fd"}}>Total Surat Jalan hari ini</p>
            </div>
            {Object.entries(rekap.byStatus||{}).map(([s,n])=>(
              <div key={s} style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <p style={{margin:0,fontSize:22,fontWeight:900,color:STATCOLOR[s]||"#475569"}}>{n}</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:STATCOLOR[s]||"#64748b",fontWeight:700}}>{STATUS_CONFIG[s]?.icon||"•"} {s}</p>
              </div>
            ))}
          </div>

          {rekap.totalSJ===0&&(
            <div style={{textAlign:"center",padding:"20px",color:"#94a3b8"}}>
              <p style={{fontSize:32}}>📋</p>
              <p style={{fontSize:14}}>Tidak ada SJ pada tanggal ini.</p>
            </div>
          )}

          {rekap.totalSJ>0&&(
            <>
              {/* Per Driver */}
              <h3 style={{fontSize:14,fontWeight:800,color:"#374151",marginBottom:10}}>📊 Per Driver</h3>
              {(rekap.byDriver||[]).map(d=>(
                <div key={d.nama} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1.5px solid #f1f5f9"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontWeight:800,color:"#1B2A4A",fontSize:14}}>🙋 {d.nama}</span>
                    <span style={{background:"#1B2A4A",color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{d.totalSJ} SJ</span>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {d.totalKM>0&&<span style={{background:"#dbeafe",color:"#1d4ed8",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>📏 {d.totalKM.toLocaleString("id-ID")} km</span>}
                    {Object.entries(d.byStatus||{}).map(([s,n])=>(
                      <span key={s} style={{background:STATUS_CONFIG[s]?.bg||"#f1f5f9",color:STATCOLOR[s]||"#475569",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>
                        {STATUS_CONFIG[s]?.icon||"•"} {s}: {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Kategori & Mobil */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
                <div style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                  <h3 style={{fontSize:13,fontWeight:800,color:"#374151",margin:"0 0 10px"}}>📦 Kategori</h3>
                  {Object.entries(rekap.byKategori||{}).map(([k,n])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:700,color:KATCOLOR[k]||"#475569"}}>{k}</span>
                      <span style={{fontSize:14,fontWeight:900,color:KATCOLOR[k]||"#475569"}}>{n}</span>
                    </div>
                  ))}
                  {Object.keys(rekap.byKategori||{}).length===0&&<p style={{fontSize:12,color:"#94a3b8",margin:0}}>-</p>}
                </div>
                <div style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                  <h3 style={{fontSize:13,fontWeight:800,color:"#374151",margin:"0 0 10px"}}>🚛 Jenis Mobil</h3>
                  {Object.entries(rekap.byMobil||{}).map(([m,n])=>(
                    <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#475569"}}>{m==="Besar"?"🚛":"🚐"} {m}</span>
                      <span style={{fontSize:14,fontWeight:900,color:"#1B2A4A"}}>{n}</span>
                    </div>
                  ))}
                  {Object.keys(rekap.byMobil||{}).length===0&&<p style={{fontSize:12,color:"#94a3b8",margin:0}}>-</p>}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [session,   setSession]   = useState(null); // null | {role,name}
  const [adminTab,  setAdminTab]  = useState("monitor"); // monitor | rekap
  const [drivers,   setDrivers]   = useState(DEFAULT_DRIVERS);
  const [assDrivers,setAssDrivers]= useState(DEFAULT_ASS_DRIVERS);

  useEffect(()=>{
    apiGet({action:"getDriverList"}).then(r=>{if(r.success&&r.data?.length)setDrivers(r.data);}).catch(()=>{});
    apiGet({action:"getAssDriverList"}).then(r=>{if(r.success&&r.data?.length)setAssDrivers(r.data);}).catch(()=>{});
  },[]);

  const handleLogout=()=>{setSession(null);setAdminTab("monitor");};

  // Belum login
  if(!session) return <LoginScreen drivers={drivers} onLogin={setSession}/>;

  return (
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:"#f8fafc",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:session.role==="driver"?20:80}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%)",padding:"16px 20px",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🚚</span>
          <div>
            <h1 style={{margin:0,fontSize:15,fontWeight:900,letterSpacing:0.3}}>Rekap Surat Jalan</h1>
            <p style={{margin:0,fontSize:10,color:"#93c5fd"}}>{session.role==="driver"?`Driver · ${session.name}`:"Admin"}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700}}>
          Keluar
        </button>
      </div>

      {/* Content */}
      {session.role==="driver"
        ? <DriverView drivers={drivers} assDrivers={assDrivers} driverName={session.name}/>
        : adminTab==="monitor"
          ? <AdminView/>
          : <RekapView/>
      }

      {/* Tab bar — hanya untuk Admin */}
      {session.role==="admin"&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"#fff",borderTop:"1px solid #e2e8f0",display:"grid",gridTemplateColumns:"1fr 1fr",boxShadow:"0 -4px 12px rgba(0,0,0,0.08)"}}>
          {[{key:"monitor",icon:"📋",label:"Monitor"},{key:"rekap",icon:"📊",label:"Rekap Harian"}].map(tab=>(
            <button key={tab.key} onClick={()=>setAdminTab(tab.key)} style={{
              padding:"12px 8px 10px",border:"none",background:"transparent",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              color:adminTab===tab.key?"#1B2A4A":"#94a3b8",
              borderTop:adminTab===tab.key?"2.5px solid #1B2A4A":"2.5px solid transparent",
            }}>
              <span style={{fontSize:20}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:700}}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

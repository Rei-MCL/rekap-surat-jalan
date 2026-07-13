import { useState, useEffect } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbwPl1aBQFzbnYjh7uVpcjZ8Y6-qh5aCVjoTVXJ2jaryTyx3g_pCckdE8VYFJuaoh_b2Bw/exec";

const STATUS_CONFIG = {
  Selesai:{ color:"#16a34a", bg:"#dcfce7", icon:"✅" },
  Tunda:  { color:"#d97706", bg:"#fef3c7", icon:"⏸" },
  Kembali:{ color:"#ea580c", bg:"#ffedd5", icon:"🔄" },
  Batal:  { color:"#dc2626", bg:"#fee2e2", icon:"❌" },
};
const KATEGORI_LIST      = ["Keramik","Non-Keramik","Campuran"];
const JENIS_MOBIL        = ["Besar","Kecil"];
const DEFAULT_DRIVERS    = ["Mas Galang","Bang Yus","Om Ipul"];
const DEFAULT_ADMINS     = ["Mega","Ade","Vio","Dilla","Aghis"];
const DEFAULT_ASS        = ["Adit","Agym"];
const OFFLINE_QUEUE_KEY  = "sj_offline_queue";
const CRED_CACHE_KEY     = "sj_cached_creds";
const USER_LIST_CACHE_KEY= "sj_user_list";
const SUBMITTED_SJ_KEY   = "sj_submitted";

// ── Tracking SJ yang sudah diinput (untuk cek duplikat offline) ─
const getTodayKey = () => {
  const d=new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
};
const markSubmitted = (formattedSJ) => {
  try {
    const data=JSON.parse(localStorage.getItem(SUBMITTED_SJ_KEY)||"{}");
    const today=getTodayKey();
    if(!data[today])data[today]=[];
    if(!data[today].includes(formattedSJ))data[today].push(formattedSJ);
    // Hapus data lebih dari 3 hari
    const cutoff=String(parseInt(today)-3);
    Object.keys(data).forEach(k=>{if(k<cutoff)delete data[k];});
    localStorage.setItem(SUBMITTED_SJ_KEY,JSON.stringify(data));
  } catch {}
};
const isAlreadySubmitted = (formattedSJ) => {
  try {
    const data=JSON.parse(localStorage.getItem(SUBMITTED_SJ_KEY)||"{}");
    return (data[getTodayKey()]||[]).includes(formattedSJ);
  } catch { return false; }
};

// ── Hash sederhana untuk simpan kredensial offline ────────────
const simpleHash = str => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h=((h<<5)+h)+str.charCodeAt(i); h=h&h; }
  return h.toString(16);
};
const saveCred = (name, pass, role) => {
  try {
    const c = JSON.parse(localStorage.getItem(CRED_CACHE_KEY)||"{}");
    c[name] = { hash: simpleHash(pass), role };
    localStorage.setItem(CRED_CACHE_KEY, JSON.stringify(c));
  } catch {}
};
const verifyCred = (name, pass) => {
  try {
    const c = JSON.parse(localStorage.getItem(CRED_CACHE_KEY)||"{}");
    const e = c[name];
    if (e && e.hash === simpleHash(pass)) return { role: e.role };
  } catch {}
  return null;
};

// ── Helpers ───────────────────────────────────────────────────
const toProperCase = s => s ? s.toLowerCase().replace(/(?:^|\s)\S/g,c=>c.toUpperCase()) : s;
const toNum        = v => parseInt(String(v).replace(/[^0-9]/g,""),10);
const getSJPreview = n => {
  const d=new Date(), yy=String(d.getFullYear()).slice(-2), mm=String(d.getMonth()+1).padStart(2,"0");
  return `SP/KLK-${yy}${mm}${String(parseInt(n)||0).padStart(4,"0")}`;
};
const getTodayStr = () => {
  const d=new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};
const toDateInput  = s => { if(!s)return""; const[d,m,y]=s.split("/"); return`${y}-${m}-${d}`; };
const fromDateInput= v => { if(!v)return""; const[y,m,d]=v.split("-"); return`${d}/${m}/${y}`; };
const calcDurasiCl = (t1,t2) => {
  if(!t1||!t2)return"";
  try {
    const[h1,m1]=t1.split(":").map(Number),[h2,m2]=t2.split(":").map(Number);
    if([h1,m1,h2,m2].some(isNaN))return"";
    let d=(h2*60+m2)-(h1*60+m1); if(d<0)d+=1440; if(d===0)return"";
    const h=Math.floor(d/60),m=d%60;
    return h>0?`${h} jam ${m} menit`:`${m} menit`;
  } catch(e){return"";}
};

const getQueue = () => { try{return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)||"[]");}catch{return[];} };
const saveQueue = q => { try{localStorage.setItem(OFFLINE_QUEUE_KEY,JSON.stringify(q));}catch{} };

async function apiGet(params) {
  const res=await fetch(API_URL+"?"+new URLSearchParams(params),{redirect:"follow"});
  return JSON.parse(await res.text());
}

// ── Shared styles ─────────────────────────────────────────────
const IS={width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #cbd5e1",fontSize:15,color:"#1B2A4A",background:"#fff",boxSizing:"border-box",fontFamily:"'Inter',system-ui,sans-serif",outline:"none"};
const ARW={appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"};

function Field({label,children,err,hint}){return(<div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>{label}</label>{children}{hint&&!err&&<p style={{color:"#94a3b8",fontSize:11,marginTop:5}}>{hint}</p>}{err&&<p style={{color:"#dc2626",fontSize:12,marginTop:5}}>{err}</p>}</div>);}
function Divider({label}){return(<div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0 14px"}}><div style={{flex:1,height:1,background:"#e2e8f0"}}/><span style={{fontSize:11,color:"#94a3b8",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span><div style={{flex:1,height:1,background:"#e2e8f0"}}/></div>);}

function SelectWithCustom({options,value,onChange,placeholder,hasError}){
  const[isC,setC]=useState(false),[raw,setR]=useState("");
  return(<div><select value={isC?"__C__":(value||"")} onChange={e=>{if(e.target.value==="__C__"){setC(true);onChange("");}else{setC(false);onChange(e.target.value);}}} style={{...IS,...ARW,color:(value||isC)?"#1B2A4A":"#94a3b8",border:`1.5px solid ${hasError?"#f87171":"#cbd5e1"}`}}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}<option value="__C__">Lainnya (isi sendiri)...</option></select>{isC&&(<div style={{marginTop:8,position:"relative"}}><input type="text" value={raw} onChange={e=>{setR(e.target.value);onChange(toProperCase(e.target.value));}} onBlur={()=>{const p=toProperCase(raw);setR(p);onChange(p);}} placeholder="Ketik nama..." autoFocus style={{...IS,fontSize:14,border:"1.5px solid #3b82f6"}}/><button onClick={()=>{setC(false);setR("");onChange("");}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:4}}>✕</button></div>)}</div>);
}

function MultiSelectDropdown({options,values,onChange}){
  const[showC,setSC]=useState(false),[cv,setCV]=useState("");
  return(<div><select onChange={e=>{const v=e.target.value;if(!v)return;if(v==="__C__"){setSC(true);}else if(!values.includes(v)){onChange([...values,v]);}e.target.value="";}} defaultValue="" style={{...IS,...ARW,color:"#94a3b8"}}><option value="">-- Pilih Ass. Driver --</option>{options.filter(o=>!values.includes(o)).map(o=><option key={o} value={o}>{o}</option>)}<option value="__C__">Lainnya (isi sendiri)...</option></select>{showC&&(<div style={{display:"flex",gap:8,marginTop:8}}><input type="text" value={cv} onChange={e=>setCV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const p=toProperCase(cv.trim());if(p&&!values.includes(p))onChange([...values,p]);setCV("");setSC(false);}}} placeholder="Ketik nama..." autoFocus style={{...IS,flex:1,fontSize:14}}/><button onClick={()=>{const p=toProperCase(cv.trim());if(p&&!values.includes(p))onChange([...values,p]);setCV("");setSC(false);}} style={{padding:"0 16px",background:"#1B2A4A",color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13}}>OK</button><button onClick={()=>{setSC(false);setCV("");}} style={{padding:"0 12px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13}}>✕</button></div>)}{values.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{values.map(v=>(<span key={v} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#1B2A4A",color:"#fff",padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:700}}>{v}<button onClick={()=>onChange(values.filter(x=>x!==v))} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button></span>))}</div>)}</div>);
}

function KategoriSelector({value,onChange,hasError}){
  const m={"Keramik":{icon:"🧱",color:"#1B2A4A"},"Non-Keramik":{icon:"📦",color:"#0f766e"},"Campuran":{icon:"🔀",color:"#7c3aed"}};
  return(<div style={{display:"flex",gap:8}}>{KATEGORI_LIST.map(opt=>{const sel=value===opt,c=m[opt];return(<button key={opt} onClick={()=>onChange(opt)} style={{flex:1,padding:"10px 6px",borderRadius:10,cursor:"pointer",border:sel?"none":`1.5px solid ${hasError?"#f87171":"#cbd5e1"}`,background:sel?c.color:"#fff",color:sel?"#fff":"#475569",fontSize:12,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,boxShadow:sel?`0 0 0 2px ${c.color}`:undefined}}><span style={{fontSize:18}}>{c.icon}</span>{opt}</button>);})}</div>);
}

function StatusSelector({value,onChange}){
  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Object.entries(STATUS_CONFIG).map(([s,cfg])=>{const sel=value===s;return(<button key={s} onClick={()=>onChange(s)} style={{padding:"11px 12px",borderRadius:10,cursor:"pointer",border:sel?"none":"1.5px solid #cbd5e1",background:sel?cfg.bg:"#fff",color:sel?cfg.color:"#64748b",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,boxShadow:sel?`0 0 0 2px ${cfg.color}`:"none"}}><span style={{fontSize:18}}>{cfg.icon}</span>{s}</button>);})}</div>);
}

function StatusBadge({status}){
  const cfg=STATUS_CONFIG[status]||{color:"#475569",bg:"#f1f5f9",icon:"•"};
  return <span style={{backgroundColor:cfg.bg,color:cfg.color,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{cfg.icon} {status}</span>;
}

function KmRow({km1,km2}){
  if(!km1)return null;
  const j=km2&&Number(km2)>Number(km1)?Number(km2)-Number(km1):null;
  return(<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}><span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🛣 {Number(km1).toLocaleString("id-ID")} km</span>{km2?<span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🏁 {Number(km2).toLocaleString("id-ID")} km</span>:<span style={{background:"#fef9c3",color:"#a16207",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>🏁 KM Tiba belum diisi</span>}{j&&<span style={{background:"#dbeafe",color:"#1d4ed8",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>📏 {j.toLocaleString("id-ID")} km</span>}</div>);
}

// ── Catatan badge: hijau jika Selesai, merah jika ada masalah ─
function CatatanBadge({catatan,status}){
  if(!catatan)return null;
  const isOk=status==="Selesai";
  return(<p style={{margin:"6px 0 0",fontSize:12,fontWeight:700,color:isOk?"#16a34a":"#dc2626",background:isOk?"#dcfce7":"#fee2e2",padding:"5px 10px",borderRadius:8,display:"inline-flex",alignItems:"center",gap:4}}>{isOk?"✅":"⚠️"} {catatan}</p>);
}

// ══════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════
function LoginScreen({userList,onLogin,isOnline}){
  const[username,setUsername]=useState(""),[password,setPassword]=useState(""),
    [showPass,setShowPass]=useState(false),[error,setError]=useState(""),
    [loading,setLoading]=useState(false);
  const drivers=userList?.drivers||DEFAULT_DRIVERS;
  const admins=userList?.admins||DEFAULT_ADMINS;
  const owners=userList?.owners||["Owner"];

  const handleLogin=async()=>{
    if(!username){setError("Pilih nama.");return;}
    if(!password){setError("Masukkan password.");return;}

    // ── Mode Offline: cek kredensial yang sudah di-cache ─────
    if(!isOnline){
      const cached=verifyCred(username,password);
      if(cached){
        // Hanya driver yang bisa login offline
        if(cached.role!=="driver"){
          setError("Admin/Owner harus online untuk masuk.");
          return;
        }
        onLogin({role:cached.role,name:username});
      } else {
        setError("Offline: Login dulu sekali saat ada internet.");
      }
      return;
    }

    // ── Mode Online: verifikasi ke server ────────────────────
    setLoading(true);
    try{
      const r=await apiGet({action:"login",username,password});
      if(r.success){
        saveCred(username,password,r.role); // simpan untuk offline
        onLogin({role:r.role,name:r.displayName});
      }else{
        setError(r.error||"Nama atau password salah.");
      }
    }catch(e){setError("Koneksi bermasalah. Coba lagi.");}
    setLoading(false);
  };

  const RC={driver:"#1B2A4A",admin:"#0f766e",owner:"#7c3aed"};
  const RL={driver:"🙋 Driver",admin:"📋 Admin",owner:"👑 Owner"};
  const role=owners.includes(username)?"owner":admins.includes(username)?"admin":"driver";

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%)",padding:"48px 24px 40px",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:52,marginBottom:12}}>🚚</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:900}}>Rekap Surat Jalan</h1>
        <p style={{margin:"6px 0 0",fontSize:13,color:"#93c5fd"}}>Sistem Monitoring Pengiriman Maxcell Kolaka</p>
      </div>
      <div style={{flex:1,padding:24}}>

        {/* Indikator offline */}
        {!isOnline&&(
          <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:18}}>📵</span>
            <div>
              <p style={{margin:0,fontWeight:700,color:"#92400e",fontSize:13}}>Sedang Offline</p>
              <p style={{margin:"2px 0 0",color:"#b45309",fontSize:11}}>Driver: bisa masuk jika sudah pernah login online.<br/>Admin/Owner: perlu koneksi internet.</p>
            </div>
          </div>
        )}

        <p style={{textAlign:"center",color:"#64748b",fontSize:13,marginBottom:20,fontWeight:600}}>Masuk dengan akun Anda</p>
        <Field label="Nama" err={!username&&error?error:""}>
          <select value={username} onChange={e=>{setUsername(e.target.value);setError("");}} style={{...IS,...ARW,color:username?"#1B2A4A":"#94a3b8"}}>
            <option value="">-- Pilih nama --</option>
            <optgroup label="👑 Owner">{owners.map(n=><option key={n} value={n}>{n}</option>)}</optgroup>
            <optgroup label="📋 Admin">{admins.map(n=><option key={n} value={n}>{n}</option>)}</optgroup>
            <optgroup label="🙋 Driver">{drivers.map(n=><option key={n} value={n}>{n}</option>)}</optgroup>
          </select>
        </Field>
        <Field label="Password" err={username&&error?error:""}>
          <div style={{position:"relative"}}>
            <input type={showPass?"text":"password"} value={password}
              onChange={e=>{setPassword(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="Masukkan password"
              style={{...IS,paddingRight:48,border:`1.5px solid ${username&&error?"#f87171":"#cbd5e1"}`}}/>
            <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#94a3b8",padding:4}}>
              {showPass?"🙈":"👁"}
            </button>
          </div>
        </Field>
        {username&&<p style={{fontSize:12,color:RC[role],fontWeight:700,marginBottom:14,background:`${RC[role]}18`,padding:"6px 12px",borderRadius:8}}>{RL[role]} — {username}</p>}
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#94a3b8":"linear-gradient(135deg,#1B2A4A,#2d4a7a)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:loading?"default":"pointer",boxShadow:"0 4px 12px rgba(27,42,74,0.3)"}}>
          {loading?"Memverifikasi...":isOnline?"Masuk":"Masuk (Offline)"}
        </button>
        <p style={{textAlign:"center",color:"#cbd5e1",fontSize:11,marginTop:32,letterSpacing:0.5}}>© Reinhard J.C</p>
      </div>
    </div>
  );
}

// ── Input jam format 24 jam (ketik langsung, misal 13:30) ────
// ── Toast notification (muncul di bawah layar) ───────────────
function Toast({message,type="success",onClose}){
  useEffect(()=>{
    const t=setTimeout(onClose,4500);
    return()=>clearTimeout(t);
  },[onClose]);

  const cfg={
    success:{bg:"#dcfce7",border:"#86efac",color:"#15803d",icon:"✅"},
    error:  {bg:"#fee2e2",border:"#fca5a5",color:"#dc2626",icon:"❌"},
    warning:{bg:"#fef3c7",border:"#fbbf24",color:"#92400e",icon:"⚠️"},
    info:   {bg:"#dbeafe",border:"#93c5fd",color:"#1e40af",icon:"📥"},
  }[type]||{bg:"#f1f5f9",border:"#cbd5e1",color:"#475569",icon:"ℹ️"};

  return(
    <div style={{
      position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      width:"calc(100% - 32px)",maxWidth:388,
      background:cfg.bg,border:`1.5px solid ${cfg.border}`,
      borderRadius:14,padding:"14px 16px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
      zIndex:9500,display:"flex",alignItems:"center",gap:10,
      animation:"slideUp 0.25s ease",
    }}>
      <style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>
      <span style={{fontSize:22,flexShrink:0}}>{cfg.icon}</span>
      <p style={{margin:0,color:cfg.color,fontSize:13,fontWeight:700,flex:1,lineHeight:1.4}}>{message}</p>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:cfg.color,fontSize:20,padding:0,flexShrink:0,opacity:0.6}}>✕</button>
    </div>
  );
}

function TimeInput24({value,onChange,placeholder="HH:MM (24 jam)"}){
  const handleChange=(e)=>{
    let raw=e.target.value.replace(/[^0-9]/g,"");
    if(raw.length>4)raw=raw.slice(0,4);
    // Auto-sisipkan titik dua setelah 2 digit
    const fmt=raw.length>=3 ? raw.slice(0,2)+":"+raw.slice(2) : raw;
    onChange(fmt);
  };
  const handleBlur=()=>{
    if(!value)return;
    // Validasi & format ulang saat selesai input
    const clean=value.replace(/[^0-9:]/g,"");
    const parts=clean.split(":");
    if(parts.length===2){
      const h=Math.min(23,parseInt(parts[0])||0);
      const m=Math.min(59,parseInt(parts[1])||0);
      onChange(String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"));
    }
  };
  return(
    <div style={{position:"relative"}}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={5}
        style={{...IS,fontSize:16,fontWeight:700,
          color:value?"#1B2A4A":"#94a3b8",
          letterSpacing:value?2:0}}
      />
      {value&&(
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
          fontSize:11,color:"#94a3b8",fontWeight:600}}>
          {parseInt(value)<12?"pagi":parseInt(value)<17?"siang":parseInt(value)<20?"sore":"malam"}
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DRIVER VIEW — dengan offline queue
// ══════════════════════════════════════════════════════════════
function DriverView({assDrivers,driverName}){
  const[jenisMobil,setJM]=useState(""),[assDriver,setAD]=useState([]),
    [nomorSJ,setNSJ]=useState(""),[kategori,setKat]=useState(""),
    [km1,setKm1]=useState(""),[km2,setKm2]=useState(""),
    [jamTiba,setJT]=useState(""),[jamSelesai,setJS]=useState(""),
    [status,setStat]=useState("Selesai"),[catatan,setCat]=useState(""),
    [loading,setLoad]=useState(false),[error,setErr]=useState({});
  const[isOnline,setOnline]=useState(typeof navigator!=="undefined"?navigator.onLine:true);
  const[queueLen,setQLen]=useState(()=>getQueue().length);
  const[syncing,setSyncing]=useState(false);
  const[toast,setToast]=useState(null); // {message, type}

  const showToast=(message,type="success")=>{
    setToast({message,type});
  };
  const closeToast=()=>setToast(null);

  // ── Kirim antrian offline ke server ──────────────────────
  const syncQueue=async()=>{
    const q=getQueue();
    if(!q.length)return;
    setSyncing(true);
    const rem=[];
    for(const item of q){
      try{await apiGet(item);}
      catch{rem.push(item);}
    }
    saveQueue(rem);
    setQLen(rem.length);
    setSyncing(false);
  };

  useEffect(()=>{
    if(navigator.onLine){syncQueue();}
    const onOn=()=>{setOnline(true);syncQueue();};
    const onOff=()=>setOnline(false);
    window.addEventListener("online",onOn);
    window.addEventListener("offline",onOff);
    return()=>{
      window.removeEventListener("online",onOn);
      window.removeEventListener("offline",onOff);
    };
  },[]);

  const today=new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
  const preview=getSJPreview(nomorSJ);
  const durPrev=calcDurasiCl(jamTiba,jamSelesai);

  const validate=()=>{
    const e={};
    if(!jenisMobil)e.jenisMobil="Pilih jenis mobil.";
    const n=parseInt(nomorSJ);
    if(!nomorSJ||isNaN(n)||n<1||n>9999)e.nomorSJ="Nomor SJ harus angka 1–9999.";
    if(!kategori)e.kategori="Pilih kategori SJ.";
    const k1=toNum(km1);
    if(!km1||isNaN(k1)||k1<0)e.km1="KM Berangkat wajib diisi.";
    if(km2){const k2=toNum(km2);if(isNaN(k2)||k2<=toNum(km1))e.km2="KM Tiba harus > KM Berangkat.";}
    return e;
  };

  const resetForm=()=>{
    setJM("");setNSJ("");setKat("");setKm1("");setKm2("");
    setJT("");setJS("");setStat("Selesai");setCat("");setAD([]);setErr({});
  };

  const handleSubmit=async()=>{
    const errs=validate();
    if(Object.keys(errs).length){setErr(errs);return;}
    setLoad(true);
    const nn=String(parseInt(nomorSJ)).padStart(4,"0");
    const params={action:"addSJ",jenisMobil,namaDriver:driverName,assDriver:assDriver.join(", "),nomorSJ:nn,kategori,km1:toNum(km1),km2:km2?toNum(km2):"",jamTiba,jamSelesai,status,catatan};

    // ── Mode offline ─────────────────────────────────────────
    if(!isOnline){
      // Cek duplikat dari cache lokal
      if(isAlreadySubmitted(preview)){
        showToast(`⚠️ ${preview} sudah pernah diinput hari ini!\nPastikan nomor SJ benar.`,"warning");
        setLoad(false);
        return;
      }
      const q=[...getQueue(),params];
      saveQueue(q);
      setQLen(q.length);
      markSubmitted(preview);
      showToast(`📥 ${preview} tersimpan offline\nAkan dikirim otomatis saat ada internet.`,"info");
      resetForm();
      setLoad(false);
      return;
    }

    // ── Mode online ──────────────────────────────────────────
    try{
      const result=await apiGet(params);
      if(result.success){
        markSubmitted(result.formattedSJ);
        showToast(`✅ ${result.formattedSJ} berhasil disimpan!\n${jenisMobil} · ${driverName} · ${result.timestamp}`,"success");
        resetForm();
      } else if(result.isDuplicate){
        showToast(`⚠️ ${result.error||"SJ ini sudah berstatus Selesai."}\nNomor SJ Tunda/Kembali/Batal masih bisa diinput.`,"warning");
      } else {
        showToast("❌ Gagal menyimpan: "+(result.error||"Error tidak dikenal"),"error");
      }
    }catch(e){
      showToast("❌ Koneksi bermasalah. Coba lagi.","error");
    }
    setLoad(false);
  };

  return(
    <div style={{padding:20,paddingBottom:40}}>
      {/* Offline banner */}
      {!isOnline&&<div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>📵</span><div><p style={{margin:0,fontWeight:700,color:"#92400e",fontSize:13}}>Mode Offline</p><p style={{margin:0,fontSize:11,color:"#b45309"}}>SJ akan tersimpan & dikirim otomatis saat online</p></div></div>}
      {isOnline&&queueLen>0&&(
        <div style={{background:"#dbeafe",border:"1px solid #93c5fd",borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{syncing?"⏳":"📤"}</span>
            <div>
              <p style={{margin:0,fontWeight:700,color:"#1e40af",fontSize:13}}>{syncing?"Mengirim antrian...":queueLen+" SJ menunggu dikirim"}</p>
              <p style={{margin:0,fontSize:11,color:"#3b82f6"}}>{syncing?"Harap tunggu":"Akan dikirim otomatis"}</p>
            </div>
          </div>
          {!syncing&&<button onClick={syncQueue} style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Kirim</button>}
        </div>
      )}

      <div style={{marginBottom:20}}>
        <p style={{color:"#64748b",fontSize:13,margin:0}}>{today}</p>
        <h2 style={{margin:"4px 0 0",fontSize:20,color:"#1B2A4A",fontWeight:800}}>Input Surat Jalan</h2>
      </div>

      {/* Toast notification */}
      {toast&&<Toast message={toast.message} type={toast.type} onClose={closeToast}/>}

      {/* Error validasi form */}
      {error.submit&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:12,padding:"12px 16px",marginBottom:16,color:"#dc2626",fontSize:13,fontWeight:600}}>⚠️ {error.submit}</div>}

      {/* Jenis Mobil */}
      <Field label="Jenis Mobil" err={error.jenisMobil}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{JENIS_MOBIL.map(jm=>{const sel=jenisMobil===jm,icon=jm==="Besar"?"🚛":"🚐";return(<button key={jm} onClick={()=>{setJM(jm);setErr(p=>({...p,jenisMobil:""}));}} style={{padding:"14px 10px",borderRadius:10,cursor:"pointer",border:sel?"none":`1.5px solid ${error.jenisMobil?"#f87171":"#cbd5e1"}`,background:sel?"#1B2A4A":"#fff",color:sel?"#fff":"#475569",fontSize:14,fontWeight:800,display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:sel?"0 0 0 2px #1B2A4A":undefined}}><span style={{fontSize:28}}>{icon}</span>Mobil {jm}</button>);})}</div>
      </Field>

      <Field label="Ass. Driver"><MultiSelectDropdown options={assDrivers} values={assDriver} onChange={setAD}/></Field>

      <Field label="Nomor Surat Jalan" err={error.nomorSJ} hint={nomorSJ?`Tersimpan sebagai: ${preview}`:"Masukkan angka 1–9999"}>
        <div style={{position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontWeight:700,fontSize:14,letterSpacing:1,pointerEvents:"none"}}>SJ</span><input type="text" inputMode="numeric" pattern="[0-9]*" value={nomorSJ} placeholder="0001" onChange={e=>{setNSJ(e.target.value.replace(/[^0-9]/g,""));setErr(p=>({...p,nomorSJ:""}));setSucc(null);setDupWarn("");}} style={{...IS,paddingLeft:40,fontSize:22,fontWeight:800,letterSpacing:3,border:`1.5px solid ${error.nomorSJ?"#f87171":"#cbd5e1"}`}}/></div>
      </Field>

      <Field label="Kategori SJ" err={error.kategori}><KategoriSelector value={kategori} onChange={v=>{setKat(v);setErr(p=>({...p,kategori:""}));}} hasError={!!error.kategori}/></Field>

      <Divider label="📍 DATA KILOMETER"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Field label="KM Berangkat" err={error.km1}><input type="text" inputMode="numeric" pattern="[0-9]*" value={km1} placeholder="12500" onChange={e=>{setKm1(e.target.value.replace(/[^0-9]/g,""));setErr(p=>({...p,km1:""}));}} style={{...IS,fontSize:15,fontWeight:700,border:`1.5px solid ${error.km1?"#f87171":"#cbd5e1"}`}}/></Field>
        <Field label="KM Tiba" err={error.km2}><input type="text" inputMode="numeric" pattern="[0-9]*" value={km2} placeholder="12650" onChange={e=>{setKm2(e.target.value.replace(/[^0-9]/g,""));setErr(p=>({...p,km2:""}));}} style={{...IS,fontSize:15,fontWeight:700,border:`1.5px solid ${error.km2?"#f87171":"#cbd5e1"}`}}/></Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:durPrev?6:14}}>
        <Field label="🕐 Jam Tiba di Lokasi" hint="Format 24 jam · contoh: 13:30">
          <TimeInput24 value={jamTiba} onChange={setJT}/>
        </Field>
        <Field label="🏁 Jam Selesai" hint="Format 24 jam · contoh: 14:45">
          <TimeInput24 value={jamSelesai} onChange={setJS}/>
        </Field>
      </div>
      {durPrev&&<p style={{color:"#16a34a",fontSize:12,fontWeight:700,marginBottom:14}}>⏱ Durasi pembongkaran: {durPrev}</p>}

      <Divider label="📋 STATUS PENGIRIMAN"/>
      <Field label="Status saat ini"><StatusSelector value={status} onChange={setStat}/></Field>
      <Field label="Catatan"><textarea value={catatan} onChange={e=>setCat(e.target.value)} placeholder="Contoh: Tunda karena macet, barang kurang, dll..." rows={3} style={{...IS,resize:"none",fontSize:14,lineHeight:1.5}}/></Field>

      <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#94a3b8":"linear-gradient(135deg,#1B2A4A,#2d4a7a)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:loading?"default":"pointer",letterSpacing:0.5,boxShadow:"0 4px 12px rgba(27,42,74,0.3)"}}>{loading?"⏳ Menyimpan...":isOnline?"Submit SJ":"📥 Simpan Offline"}</button>
      <p style={{textAlign:"center",color:"#94a3b8",fontSize:12,marginTop:12}}>Punya lebih dari 1 SJ? Submit ulang untuk SJ berikutnya.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN MONITOR VIEW
// ══════════════════════════════════════════════════════════════
function AdminView(){
  const[sjList,setSL]=useState([]),[filterStat,setFS]=useState("Semua"),
    [editId,setEI]=useState(null),[editStat,setES]=useState(""),
    [editCat,setEC]=useState(""),[editKm2,setEK]=useState(""),
    [editJT,setEJT]=useState(""),[editJS,setEJS]=useState(""),
    [searchQ,setSQ]=useState(""),[loading,setLoad]=useState(false),
    [saving,setSav]=useState(false),[errMsg,setErrMsg]=useState("");

  const load=async()=>{
    setLoad(true);setErrMsg("");
    try{const r=await apiGet({action:"getSJList"});if(r.success)setSL(r.data||[]);else setErrMsg("Gagal: "+r.error);}
    catch(e){setErrMsg("Koneksi bermasalah.");}
    setLoad(false);
  };
  useEffect(()=>{load();},[]);

  const filtered=sjList.filter(sj=>{
    const mS=filterStat==="Semua"||sj.status===filterStat;
    const q=searchQ.toLowerCase();
    return mS&&(String(sj.nomorSJ||"").toLowerCase().includes(q)||String(sj.namaDriver||"").toLowerCase().includes(q)||String(sj.kategori||"").toLowerCase().includes(q)||String(sj.jenisMobil||"").toLowerCase().includes(q));
  });

  const openEdit=sj=>{setEI(sj.id);setES(sj.status);setEC(sj.catatan||"");setEK(sj.km2?String(sj.km2):"");setEJT(sj.jamTiba||"");setEJS(sj.jamSelesai||"");};
  const saveEdit=async()=>{
    setSav(true);
    try{const r=await apiGet({action:"updateStatus",id:editId,status:editStat,catatan:editCat,km2:editKm2?toNum(editKm2):"",jamTiba:editJT,jamSelesai:editJS});
      if(r.success){setSL(prev=>prev.map(sj=>sj.id===editId?{...sj,status:editStat,catatan:editCat,km2:editKm2?toNum(editKm2):sj.km2,jamTiba:editJT,jamSelesai:editJS}:sj));setEI(null);}}
    catch(_){}
    setSav(false);
  };

  const cBy=s=>sjList.filter(sj=>sj.status===s).length;
  const KM={"Keramik":{color:"#1B2A4A",bg:"#e8eaf6"},"Non-Keramik":{color:"#0f766e",bg:"#ccfbf1"},"Campuran":{color:"#7c3aed",bg:"#ede9fe"}};

  return(
    <div style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,color:"#1B2A4A",fontWeight:800}}>Monitor Surat Jalan</h2>
        <button onClick={load} style={{padding:"6px 12px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,color:"#475569"}}>🔄 Refresh</button>
      </div>
      {errMsg&&<div style={{background:"#fee2e2",borderRadius:10,padding:"12px 16px",marginBottom:16,color:"#dc2626",fontSize:13,fontWeight:600}}>⚠️ {errMsg}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[{l:"Total",v:sjList.length,c:"#1B2A4A",b:"#f1f5f9"},{l:"Tunda",v:cBy("Tunda"),c:"#d97706",b:"#fef3c7"},{l:"Kembali",v:cBy("Kembali"),c:"#ea580c",b:"#ffedd5"}].map(x=>(
          <div key={x.l} style={{background:x.b,borderRadius:10,padding:"10px 12px",textAlign:"center"}}><p style={{margin:0,fontSize:22,fontWeight:900,color:x.c}}>{x.v}</p><p style={{margin:0,fontSize:11,color:x.c,fontWeight:600}}>{x.l}</p></div>
        ))}
      </div>
      <input type="text" placeholder="Cari SJ, driver, kategori..." value={searchQ} onChange={e=>setSQ(e.target.value)} style={{...IS,fontSize:13,marginBottom:12,border:"1.5px solid #cbd5e1"}}/>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:16}}>
        {["Semua",...Object.keys(STATUS_CONFIG)].map(s=>(
          <button key={s} onClick={()=>setFS(s)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:filterStat===s?"#1B2A4A":"#f1f5f9",color:filterStat===s?"#fff":"#64748b"}}>{s}</button>
        ))}
      </div>
      {loading?<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>⏳</p><p>Memuat data...</p></div>
      :filtered.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>📋</p><p>Belum ada SJ.</p></div>
      :filtered.map(sj=>(
        <div key={sj.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1.5px solid #f1f5f9"}}>
          {editId===sj.id?(
            <div>
              <p style={{margin:"0 0 10px",fontWeight:800,color:"#1B2A4A"}}>{sj.nomorSJ}</p>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Status</label>
              <StatusSelector value={editStat} onChange={setES}/>
              <div style={{marginTop:10,marginBottom:8}}><label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🏁 KM Tiba</label><input type="text" inputMode="numeric" value={editKm2} placeholder="KM tiba" onChange={e=>setEK(e.target.value.replace(/[^0-9]/g,""))} style={{...IS,fontSize:14,border:"1.5px solid #cbd5e1"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🕐 Jam Tiba</label><TimeInput24 value={editJT} onChange={setEJT} placeholder="HH:MM"/></div>
                <div><label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🏁 Jam Selesai</label><TimeInput24 value={editJS} onChange={setEJS} placeholder="HH:MM"/></div>
              </div>
              <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>Catatan</label><textarea value={editCat} onChange={e=>setEC(e.target.value)} rows={2} style={{...IS,resize:"none",fontSize:14,border:"1.5px solid #cbd5e1"}}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveEdit} disabled={saving} style={{flex:1,padding:"10px",background:saving?"#94a3b8":"#1B2A4A",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:saving?"default":"pointer",fontSize:13}}>{saving?"Menyimpan...":"Simpan"}</button>
                <button onClick={()=>setEI(null)} style={{flex:1,padding:"10px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>Batal</button>
              </div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#1B2A4A"}}>{sj.nomorSJ}</span>
                    <StatusBadge status={sj.status}/>
                    {sj.kategori&&<span style={{background:(KM[sj.kategori]||{}).bg||"#f1f5f9",color:(KM[sj.kategori]||{}).color||"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{sj.kategori}</span>}
                    {sj.jenisMobil&&<span style={{background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{sj.jenisMobil==="Besar"?"🚛":"🚐"} {sj.jenisMobil}</span>}
                  </div>
                  <p style={{margin:0,fontSize:12,color:"#64748b"}}>{sj.namaDriver}{sj.assDriver?<span style={{color:"#94a3b8"}}> + {sj.assDriver}</span>:null}{" · "}{sj.timestamp}</p>
                  <KmRow km1={sj.km1} km2={sj.km2}/>
                  {(sj.jamTiba||sj.jamSelesai)&&<p style={{margin:"4px 0 0",fontSize:12,color:"#475569"}}>{sj.jamTiba?<>🕐 <strong>{sj.jamTiba}</strong></>:""}{sj.jamTiba&&sj.jamSelesai?" · ":""}{sj.jamSelesai?<>🏁 <strong>{sj.jamSelesai}</strong></>:""}{sj.durasi?<> · ⏱ <strong>{sj.durasi}</strong></>:""}</p>}
                  <CatatanBadge catatan={sj.catatan} status={sj.status}/>
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
function RekapView(){
  const[tanggal,setT]=useState(getTodayStr()),[rekap,setR]=useState(null),
    [loading,setLoad]=useState(false),[errMsg,setEM]=useState("");
  const load=async(tgl)=>{setLoad(true);setEM("");setR(null);try{const r=await apiGet({action:"getRekapHarian",tanggal:tgl});if(r.success)setR(r.data);else setEM("Gagal: "+r.error);}catch(e){setEM("Koneksi bermasalah.");}setLoad(false);};
  useEffect(()=>{load(tanggal);},[]);
  const SC={Selesai:"#16a34a",Tunda:"#d97706",Kembali:"#ea580c",Batal:"#dc2626"};
  const KC={"Keramik":"#1B2A4A","Non-Keramik":"#0f766e","Campuran":"#7c3aed"};
  return(
    <div style={{padding:20}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,color:"#1B2A4A",fontWeight:800}}>Rekap Harian</h2>
      <p style={{margin:"0 0 20px",fontSize:13,color:"#64748b"}}>Ringkasan pengiriman per tanggal</p>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <input type="date" value={toDateInput(tanggal)} onChange={e=>{const t=fromDateInput(e.target.value);setT(t);load(t);}} style={{...IS,flex:1,fontSize:14,fontWeight:700}}/>
        <button onClick={()=>load(tanggal)} style={{padding:"12px 16px",background:"#1B2A4A",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>🔄 Muat</button>
      </div>
      {loading&&<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}><p style={{fontSize:32}}>⏳</p><p>Memuat rekap...</p></div>}
      {errMsg&&<div style={{background:"#fee2e2",borderRadius:10,padding:"12px 16px",color:"#dc2626",fontSize:13,fontWeight:600}}>⚠️ {errMsg}</div>}
      {rekap&&!loading&&(
        <>
          <div style={{background:"linear-gradient(135deg,#1B2A4A,#2d4a7a)",borderRadius:12,padding:"16px",color:"#fff",marginBottom:16}}>
            <p style={{margin:0,fontSize:13,color:"#93c5fd",fontWeight:600}}>{tanggal}</p>
            <p style={{margin:"4px 0 0",fontSize:40,fontWeight:900}}>{rekap.totalSJ}</p>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#93c5fd"}}>Total Surat Jalan</p>
          </div>
          {rekap.totalSJ===0?<div style={{textAlign:"center",padding:"20px",color:"#94a3b8"}}><p style={{fontSize:32}}>📋</p><p>Tidak ada SJ pada tanggal ini.</p></div>:(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {Object.entries(rekap.byStatus||{}).map(([s,n])=>(
                  <div key={s} style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}><p style={{margin:0,fontSize:24,fontWeight:900,color:SC[s]||"#475569"}}>{n}</p><p style={{margin:"2px 0 0",fontSize:12,color:SC[s]||"#64748b",fontWeight:700}}>{STATUS_CONFIG[s]?.icon||"•"} {s}</p></div>
                ))}
              </div>
              <h3 style={{fontSize:14,fontWeight:800,color:"#374151",marginBottom:10}}>📊 Per Driver</h3>
              {(rekap.byDriver||[]).map(d=>(
                <div key={d.nama} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1.5px solid #f1f5f9"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontWeight:800,color:"#1B2A4A",fontSize:14}}>🙋 {d.nama}</span><span style={{background:"#1B2A4A",color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{d.totalSJ} SJ</span></div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {d.totalKM>0&&<span style={{background:"#dbeafe",color:"#1d4ed8",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>📏 {d.totalKM.toLocaleString("id-ID")} km</span>}
                    {Object.entries(d.byStatus||{}).map(([s,n])=><span key={s} style={{background:STATUS_CONFIG[s]?.bg||"#f1f5f9",color:SC[s]||"#475569",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{STATUS_CONFIG[s]?.icon||"•"} {s}: {n}</span>)}
                  </div>
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
                <div style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}><h3 style={{fontSize:13,fontWeight:800,color:"#374151",margin:"0 0 10px"}}>📦 Kategori</h3>{Object.entries(rekap.byKategori||{}).length===0?<p style={{fontSize:12,color:"#94a3b8",margin:0}}>-</p>:Object.entries(rekap.byKategori||{}).map(([k,n])=><div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:12,fontWeight:700,color:KC[k]||"#475569"}}>{k}</span><span style={{fontSize:16,fontWeight:900,color:KC[k]||"#475569"}}>{n}</span></div>)}</div>
                <div style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}><h3 style={{fontSize:13,fontWeight:800,color:"#374151",margin:"0 0 10px"}}>🚛 Jenis Mobil</h3>{Object.entries(rekap.byMobil||{}).length===0?<p style={{fontSize:12,color:"#94a3b8",margin:0}}>-</p>:Object.entries(rekap.byMobil||{}).map(([m,n])=><div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:12,fontWeight:700,color:"#475569"}}>{m==="Besar"?"🚛":"🚐"} {m}</span><span style={{fontSize:16,fontWeight:900,color:"#1B2A4A"}}>{n}</span></div>)}</div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// RIWAYAT PER DRIVER
// ══════════════════════════════════════════════════════════════
function RiwayatView({userList}){
  const drivers=[...DEFAULT_DRIVERS,...(userList?.drivers||[])].filter((v,i,a)=>a.indexOf(v)===i);
  const[selDriver,setSD]=useState(""),[dari,setDari]=useState(toDateInput(getTodayStr().replace(/(\d+)\/(\d+)\/(\d+)/,"$3-$2-$1").replace(/(\d{4})-(\d{2})-(\d{2})/,(_,y,m)=>`${y}-${m}-01`))),[sampai,setSampai]=useState(toDateInput(getTodayStr())),
    [data,setData]=useState(null),[loading,setLoad]=useState(false),[errMsg,setEM]=useState("");

  const load=async()=>{
    if(!selDriver){setEM("Pilih driver terlebih dahulu.");return;}
    setLoad(true);setEM("");setData(null);
    try{const r=await apiGet({action:"getRiwayatDriver",namaDriver:selDriver,dari:dari.replace(/-/g,'-'),sampai:sampai.replace(/-/g,'-')});
      if(r.success)setData(r.data);else setEM("Gagal: "+r.error);}
    catch(e){setEM("Koneksi bermasalah.");}
    setLoad(false);
  };

  const SC={Selesai:"#16a34a",Tunda:"#d97706",Kembali:"#ea580c",Batal:"#dc2626"};
  const KM={"Keramik":{color:"#1B2A4A",bg:"#e8eaf6"},"Non-Keramik":{color:"#0f766e",bg:"#ccfbf1"},"Campuran":{color:"#7c3aed",bg:"#ede9fe"}};

  return(
    <div style={{padding:20}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,color:"#1B2A4A",fontWeight:800}}>Riwayat Driver</h2>
      <p style={{margin:"0 0 20px",fontSize:13,color:"#64748b"}}>Filter SJ per driver & periode</p>

      {/* Filter */}
      <div style={{background:"#fff",borderRadius:12,padding:"16px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <Field label="Nama Driver">
          <select value={selDriver} onChange={e=>setSD(e.target.value)} style={{...IS,...ARW,color:selDriver?"#1B2A4A":"#94a3b8"}}>
            <option value="">-- Pilih Driver --</option>
            {drivers.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <Field label="Dari Tanggal"><input type="date" value={dari} onChange={e=>setDari(e.target.value)} style={{...IS,fontSize:14}}/></Field>
          <Field label="Sampai Tanggal"><input type="date" value={sampai} onChange={e=>setSampai(e.target.value)} style={{...IS,fontSize:14}}/></Field>
        </div>
        <button onClick={load} disabled={loading} style={{width:"100%",padding:"12px",background:loading?"#94a3b8":"#1B2A4A",color:"#fff",border:"none",borderRadius:10,fontWeight:800,cursor:loading?"default":"pointer",fontSize:14}}>{loading?"⏳ Memuat...":"🔍 Cari Riwayat"}</button>
        {errMsg&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,margin:0}}>{errMsg}</p>}
      </div>

      {data&&!loading&&(
        <>
          {/* Summary */}
          <div style={{background:"linear-gradient(135deg,#1B2A4A,#2d4a7a)",borderRadius:12,padding:"16px",color:"#fff",marginBottom:16}}>
            <p style={{margin:0,fontSize:13,color:"#93c5fd",fontWeight:600}}>🙋 {selDriver}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
              <div><p style={{margin:0,fontSize:32,fontWeight:900}}>{data.totalSJ}</p><p style={{margin:0,fontSize:12,color:"#93c5fd"}}>Total SJ</p></div>
              <div><p style={{margin:0,fontSize:32,fontWeight:900}}>{(data.totalKM||0).toLocaleString("id-ID")}</p><p style={{margin:0,fontSize:12,color:"#93c5fd"}}>Total KM</p></div>
            </div>
          </div>

          {/* By status */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {Object.entries(data.byStatus||{}).map(([s,n])=>(
              <div key={s} style={{background:"#fff",borderRadius:10,padding:"10px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}><p style={{margin:0,fontSize:20,fontWeight:900,color:SC[s]||"#475569"}}>{n}</p><p style={{margin:"2px 0 0",fontSize:11,color:SC[s]||"#64748b",fontWeight:700}}>{STATUS_CONFIG[s]?.icon||"•"} {s}</p></div>
            ))}
          </div>

          {data.totalSJ===0?<div style={{textAlign:"center",padding:"20px",color:"#94a3b8"}}><p style={{fontSize:32}}>📋</p><p>Tidak ada SJ pada periode ini.</p></div>:(
            <>
              <h3 style={{fontSize:14,fontWeight:800,color:"#374151",marginBottom:10}}>📋 Daftar SJ</h3>
              {(data.rows||[]).map(sj=>(
                <div key={sj.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1.5px solid #f1f5f9"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#1B2A4A"}}>{sj.nomorSJ}</span>
                    <StatusBadge status={sj.status}/>
                    {sj.kategori&&<span style={{background:(KM[sj.kategori]||{}).bg||"#f1f5f9",color:(KM[sj.kategori]||{}).color||"#475569",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{sj.kategori}</span>}
                  </div>
                  <p style={{margin:0,fontSize:12,color:"#64748b"}}>{sj.timestamp}</p>
                  <KmRow km1={sj.km1} km2={sj.km2}/>
                  {(sj.jamTiba||sj.jamSelesai)&&<p style={{margin:"3px 0 0",fontSize:12,color:"#475569"}}>{sj.jamTiba?<>🕐 <strong>{sj.jamTiba}</strong></>:""}{sj.jamTiba&&sj.jamSelesai?" · ":""}{sj.jamSelesai?<>🏁 <strong>{sj.jamSelesai}</strong></>:""}{sj.durasi?<> · ⏱ <strong>{sj.durasi}</strong></>:""}</p>}
                  <CatatanBadge catatan={sj.catatan} status={sj.status}/>
                </div>
              ))}
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
export default function App(){
  const[session,setSess]=useState(null),[adminTab,setTab]=useState("monitor"),
    [userList,setUL]=useState(null),[assDrivers,setAD]=useState(DEFAULT_ASS);

  // ── Track status koneksi ──────────────────────────────────
  const[isOnline,setOnline]=useState(typeof navigator!=="undefined"?navigator.onLine:true);
  useEffect(()=>{
    const onOn=()=>setOnline(true);
    const onOff=()=>setOnline(false);
    window.addEventListener("online",onOn);
    window.addEventListener("offline",onOff);
    return()=>{window.removeEventListener("online",onOn);window.removeEventListener("offline",onOff);};
  },[]);

  // ── Load user list, cache untuk offline ──────────────────
  useEffect(()=>{
    apiGet({action:"getUserList"})
      .then(r=>{
        if(r.success){
          setUL(r.data);
          try{localStorage.setItem(USER_LIST_CACHE_KEY,JSON.stringify(r.data));}catch{}
        }
      })
      .catch(()=>{
        // Gunakan cache saat offline
        try{
          const cached=JSON.parse(localStorage.getItem(USER_LIST_CACHE_KEY)||"null");
          if(cached)setUL(cached);
        }catch{}
      });
    apiGet({action:"getAssDriverList"})
      .then(r=>{if(r.success&&r.data?.length)setAD(r.data);})
      .catch(()=>{});
  },[]);

  const isAO=session?.role==="admin"||session?.role==="owner";
  const RL={driver:"🙋 Driver",admin:"📋 Admin",owner:"👑 Owner"};
  const RC={driver:"#1B2A4A",admin:"#0f766e",owner:"#7c3aed"};

  if(!session) return <LoginScreen userList={userList} onLogin={setSess} isOnline={isOnline}/>;

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:"#f8fafc",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:isAO?80:20}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%)",padding:"14px 20px",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🚚</span>
          <div>
            <h1 style={{margin:0,fontSize:15,fontWeight:900,letterSpacing:0.3}}>Rekap Surat Jalan</h1>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
              <span style={{fontSize:10,background:RC[session.role]||"#475569",color:"#fff",padding:"1px 6px",borderRadius:10,fontWeight:700}}>{RL[session.role]||session.role}</span>
              <span style={{fontSize:10,color:"#93c5fd"}}>{session.name}</span>
            </div>
          </div>
        </div>
        <button onClick={()=>{setSess(null);setTab("monitor");}} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700}}>Keluar</button>
      </div>

      {/* Content */}
      {session.role==="driver"
        ?<DriverView assDrivers={assDrivers} driverName={session.name}/>
        :adminTab==="monitor"?<AdminView/>
        :adminTab==="rekap"?<RekapView/>
        :<RiwayatView userList={userList}/>
      }

      {/* Tab bar Admin/Owner */}
      {isAO&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"#fff",borderTop:"1px solid #e2e8f0",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",boxShadow:"0 -4px 12px rgba(0,0,0,0.08)"}}>
          {[{key:"monitor",icon:"📋",label:"Monitor"},{key:"rekap",icon:"📊",label:"Rekap"},{key:"riwayat",icon:"🔍",label:"Riwayat"}].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"12px 8px 10px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:adminTab===t.key?"#1B2A4A":"#94a3b8",borderTop:adminTab===t.key?"2.5px solid #1B2A4A":"2.5px solid transparent"}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:700}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";

const EVENTS_JSON_URL = "https://raw.githubusercontent.com/bemtudo/SFEvents/main/events.json";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  .app { min-height:100vh; background:#0a0a0f; color:#e8e4d9; font-family:'Space Mono',monospace; position:relative; overflow-x:hidden; }
  .grid-bg { position:fixed; inset:0; background-image: linear-gradient(rgba(255,200,50,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(255,200,50,0.04) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
  .content { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:24px 20px; }
  .header { text-align:center; padding:40px 0 32px; }
  .eyebrow { font-size:11px; letter-spacing:4px; color:#ffc832; text-transform:uppercase; margin-bottom:12px; }
  h1 { font-family:'Syne',sans-serif; font-size:clamp(32px,6vw,56px); font-weight:800; color:#fff; letter-spacing:-1px; line-height:1; }
  h1 span { color:#ffc832; }
  .sub { margin-top:10px; font-size:12px; color:#6b6a5e; letter-spacing:1px; }
  .updated { font-size:10px; color:#3a3a4e; text-align:center; margin-top:6px; }
  .filter-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; align-items:center; }
  .filter-btn { padding:6px 14px; border-radius:6px; font-family:'Space Mono',monospace; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; border:1px solid #2a2a38; background:transparent; color:#6b6a5e; transition:all .15s; }
  .filter-btn.on { background:#1e1e2e; border-color:#ffc832; color:#ffc832; }
  .spacer { flex:1; }
  .refresh { padding:6px 14px; border-radius:6px; font-family:'Space Mono',monospace; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; border:1px solid #2a2a38; background:transparent; color:#6b6a5e; transition:all .15s; }
  .refresh:hover { color:#ffc832; border-color:#ffc832; }
  .search-row { margin-bottom:16px; }
  .search { width:100%; padding:10px 14px; background:#13131a; border:1px solid #2a2a38; border-radius:8px; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:12px; outline:none; transition:border-color .2s; }
  .search:focus { border-color:#ffc832; }
  .search::placeholder { color:#3a3a4e; }
  .results-hdr { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:#6b6a5e; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid #1e1e2e; }
  a.card { background:#13131a; border:1px solid #2a2a38; border-radius:10px; padding:16px; margin-bottom:10px; display:flex; gap:14px; align-items:flex-start; transition:border-color .2s,transform .15s; animation:slideIn .3s ease both; text-decoration:none; }
  a.card:hover { border-color:#3a3a58; transform:translateX(3px); }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:6px; }
  .dot-music { background:#ffc832; }
  .dot-bike  { background:#4ecdc4; }
  .evbody { flex:1; min-width:0; }
  .title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#fff; margin-bottom:4px; }
  .meta { font-size:11px; color:#6b6a5e; display:flex; flex-wrap:wrap; gap:10px; margin-bottom:6px; }
  .desc { font-size:12px; color:#9a9888; line-height:1.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tags { display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0; }
  .tag { font-size:10px; padding:2px 8px; border-radius:4px; border:1px solid #2a2a38; color:#6b6a5e; white-space:nowrap; }
  .tag-free { border-color:#2a4a2a; color:#4ec94e; }
  .loading { text-align:center; padding:60px 0; color:#6b6a5e; }
  .dots { font-size:28px; letter-spacing:4px; animation:pulse 1.2s infinite; }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
  .loading-txt { margin-top:12px; font-size:12px; letter-spacing:2px; }
  .empty { text-align:center; padding:48px 0; color:#3a3a4e; font-size:13px; letter-spacing:1px; line-height:2; }
  .error { background:#1e0a0a; border:1px solid #5a2020; color:#ff8888; border-radius:8px; padding:16px; font-size:12px; margin-bottom:16px; line-height:1.8; }
`;

export default function App() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [updatedAt, setUpdated] = useState("");
  const [city, setCity]         = useState("all");
  const [type, setType]         = useState("all");
  const [search, setSearch]     = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(EVENTS_JSON_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setEvents(data.events || []);
      setUpdated(data.updated_at || "");
    } catch(e) {
      setError("Couldn't load events. Make sure the GitHub Action has run at least once.\n" + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const fmt = iso => {
    try { return "Updated " + new Date(iso).toLocaleString("en-US", {month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}); }
    catch { return ""; }
  };

  const filtered = events.filter(e => {
    if (city !== "all" && e.city !== city) return false;
    if (type !== "all" && e.type !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.title||"").toLowerCase().includes(q) || (e.venue||"").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="grid-bg"/>
        <div className="content">
          <header className="header">
            <div className="eyebrow">Bay Area Events</div>
            <h1>SF + <span>Oakland</span></h1>
            <div className="sub">Music · Group Rides · Updated every 6h</div>
            {updatedAt && <div className="updated">{fmt(updatedAt)}</div>}
          </header>

          {error && <div className="error" style={{whiteSpace:"pre-line"}}>{error}</div>}

          <div className="search-row">
            <input className="search" placeholder="Search artist, venue, ride..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          <div className="filter-row">
            {["all","SF","Oakland"].map(c=>(
              <button key={c} className={"filter-btn"+(city===c?" on":"")} onClick={()=>setCity(c)}>
                {c==="all"?"All Cities":c}
              </button>
            ))}
            <div style={{width:12}}/>
            {["all","music","bike"].map(t=>(
              <button key={t} className={"filter-btn"+(type===t?" on":"")} onClick={()=>setType(t)}>
                {t==="all"?"All":t==="music"?"🎵 Music":"🚲 Rides"}
              </button>
            ))}
            <div className="spacer"/>
            <button className="refresh" onClick={load} disabled={loading}>↻ Refresh</button>
          </div>

          {loading && (
            <div className="loading">
              <div className="dots">· · ·</div>
              <div className="loading-txt">Loading events</div>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="results-hdr">{filtered.length} events</div>
              {filtered.map((e,i)=>(
                <a key={e.id||i} className="card" href={e.url||"#"} target="_blank" rel="noopener noreferrer"
                   style={{animationDelay:i*35+"ms"}}>
                  <div className={"dot dot-"+(e.type==="music"?"music":"bike")}/>
                  <div className="evbody">
                    <div className="title">{e.title}</div>
                    <div className="meta">
                      <span>📍 {e.venue}</span>
                      <span>📅 {e.date}</span>
                      {e.time && <span>🕐 {e.time}</span>}
                      <span>🌉 {e.city}</span>
                    </div>
                    {e.description && <div className="desc">{e.description}</div>}
                  </div>
                  <div className="tags">
                    <span className="tag">{e.source}</span>
                    {e.is_free && <span className="tag tag-free">Free</span>}
                  </div>
                </a>
              ))}
            </>
          )}

          {!loading && !error && events.length===0 && (
            <div className="empty">No events yet.<br/>Run the GitHub Action to populate data.</div>
          )}
          {!loading && events.length>0 && filtered.length===0 && (
            <div className="empty">No events match your filters.</div>
          )}
        </div>
      </div>
    </>
  );
}

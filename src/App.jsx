import { useState, useEffect } from "react";

const EVENTS_JSON_URL = "/events.json";

const MapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
  </svg>
);

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #191919;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    min-height: 100vh;
    background: #191919;
    color: #e6e6e5;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  .content {
    max-width: 780px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  /* ── Header ── */
  .header {
    padding: 32px 0 36px;
  }

  .header-label {
    font-size: 11px;
    font-weight: 500;
    color: #5c5c5a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  h1 {
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 600;
    color: #e6e6e5;
    letter-spacing: -0.5px;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .sub {
    font-size: 13px;
    color: #787774;
  }

  .updated {
    font-size: 12px;
    color: #4a4a48;
    margin-top: 4px;
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: #2f2f2f;
    margin-bottom: 24px;
  }

  /* ── Controls ── */
  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .search-wrap { position: relative; }

  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #5c5c5a;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .search {
    width: 100%;
    padding: 8px 12px 8px 34px;
    background: #252525;
    border: 1px solid #373737;
    border-radius: 6px;
    color: #e6e6e5;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }

  .search:focus {
    border-color: #5c5c5a;
    background: #2a2a2a;
  }

  .search::placeholder { color: #4a4a48; }

  .venue-select {
    padding: 8px 10px;
    background: #252525;
    border: 1px solid #373737;
    border-radius: 6px;
    color: #787774;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
    width: 100%;
  }

  .venue-select:focus { border-color: #5c5c5a; }

  .venue-select option { background: #252525; }

  /* Filter row */
  .filter-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    color: #787774;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    white-space: nowrap;
  }

  .filter-btn:hover {
    background: #2d2d2d;
    color: #b0b0ae;
  }

  .filter-btn.on {
    background: #2d2d2d;
    border-color: #4a4a48;
    color: #e6e6e5;
  }

  .filter-sep {
    width: 1px;
    height: 16px;
    background: #2f2f2f;
    flex-shrink: 0;
  }

  .spacer { flex: 1; }

  .refresh {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    color: #5c5c5a;
    transition: background 0.12s, color 0.12s;
  }

  .refresh:hover:not(:disabled) {
    background: #2d2d2d;
    color: #b0b0ae;
  }

  .refresh:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Results label ── */
  .results-hdr {
    font-size: 11px;
    font-weight: 500;
    color: #4a4a48;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
  }

  /* ── Event Card ── */
  a.card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 6px;
    margin-bottom: 2px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.1s;
    position: relative;
  }

  a.card:hover { background: #222222; }

  /* Type dot */
  .type-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  }

  .dot-music    { background: #e8a020; }
  .dot-bike     { background: #3aaa80; }
  .dot-theater  { background: #9b72cf; }
  .dot-film     { background: #4a90d9; }
  .dot-talks    { background: #4ab8b8; }

  .evbody { flex: 1; min-width: 0; }

  .title {
    font-size: 14px;
    font-weight: 500;
    color: #e6e6e5;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #787774;
  }

  .desc {
    font-size: 12px;
    color: #5c5c5a;
    line-height: 1.55;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Tags */
  .card-right {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .tag {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 3px;
    background: #2a2a2a;
    color: #787774;
    white-space: nowrap;
  }

  .tag-music {
    background: rgba(232, 160, 32, 0.14);
    color: #c88c18;
  }

  .tag-bike {
    background: rgba(58, 170, 128, 0.14);
    color: #2e9068;
  }

  .tag-theater {
    background: rgba(155, 114, 207, 0.14);
    color: #8a5fc0;
  }

  .tag-film {
    background: rgba(74, 144, 217, 0.14);
    color: #3a7bbf;
  }

  .tag-talks {
    background: rgba(74, 184, 184, 0.14);
    color: #2e9898;
  }

  .tag-free {
    background: rgba(82, 166, 100, 0.14);
    color: #3a9650;
  }

  /* Event image thumbnail */
  .event-img {
    width: 80px;
    height: 56px;
    border-radius: 5px;
    object-fit: cover;
    flex-shrink: 0;
    background: #2a2a2a;
    display: block;
    opacity: 0.9;
  }

  a.card:hover .event-img { opacity: 1; }

  .ext-icon {
    color: #3a3a38;
    margin-top: 4px;
  }

  a.card:hover .ext-icon { color: #787774; }

  /* ── Skeleton ── */
  .skeleton-list { display: flex; flex-direction: column; gap: 2px; }

  .skel-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 6px;
  }

  .skel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .skel-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }

  .skel-line {
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(90deg, #252525 25%, #2e2e2e 50%, #252525 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Empty / Error ── */
  .empty {
    text-align: center;
    padding: 64px 0;
    color: #4a4a48;
    font-size: 13px;
    line-height: 1.9;
  }

  .error {
    background: rgba(239, 68, 68, 0.07);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    margin-bottom: 16px;
    line-height: 1.7;
  }

  /* ── Responsive ── */
  @media (max-width: 520px) {
    .content { padding: 32px 16px 60px; }
    .header { padding: 20px 0 28px; }
    .card-right { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skel-line { animation: none; }
    a.card { transition: none; }
  }
`;

function SkeletonCard() {
  return (
    <div className="skel-card">
      <div className="skel-dot skel-line" style={{ width: 8, flexShrink: 0 }}/>
      <div className="skel-body">
        <div className="skel-line" style={{ width: "55%", height: 12 }}/>
        <div className="skel-line" style={{ width: "40%" }}/>
        <div className="skel-line" style={{ width: "72%" }}/>
      </div>
    </div>
  );
}

export default function App() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [updatedAt, setUpdated] = useState("");
  const [city, setCity]         = useState("all");
  const [type, setType]         = useState("all");
  const [venue, setVenue]       = useState("all");
  const [search, setSearch]     = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(EVENTS_JSON_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setEvents(data.events || []);
      setUpdated(data.updated_at || "");
    } catch (e) {
      setError("Couldn't load events. Make sure the GitHub Action has run at least once.\n" + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const fmt = iso => {
    try {
      return "Updated " + new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short"
      });
    } catch { return ""; }
  };

  const now = Date.now();
  const twoWeeksOut = now + 14 * 24 * 60 * 60 * 1000;
  const venueList = [...new Set(events.map(e => e.venue).filter(Boolean))].sort();
  const filtered = events.filter(e => {
    if (e.date_raw) {
      const t = new Date(e.date_raw).getTime();
      if (!isNaN(t) && t < now) return false;
      if (!isNaN(t) && t > twoWeeksOut) return false;
    }
    if (city !== "all" && e.city !== city) return false;
    if (type !== "all" && e.type !== type) return false;
    if (venue !== "all" && e.venue !== venue) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.title || "").toLowerCase().includes(q) || (e.venue || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="content">

          <header className="header">
            <div className="header-label">Bay Area</div>
            <h1>SF + Oakland Events</h1>
            <div className="sub">Music and group rides, updated every 6 hours</div>
            {updatedAt && <div className="updated">{fmt(updatedAt)}</div>}
          </header>

          <div className="divider"/>

          {error && <div className="error" style={{ whiteSpace: "pre-line" }}>{error}</div>}

          <div className="controls">
            <div className="search-wrap">
              <span className="search-icon"><SearchIcon/></span>
              <input
                className="search"
                placeholder="Search by artist, venue, or ride name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>

            <select
              className="venue-select"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              aria-label="Filter by venue"
            >
              <option value="all">All venues</option>
              {venueList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <div className="filter-row" role="toolbar" aria-label="Filters">
              {["all", "SF", "Oakland"].map(c => (
                <button
                  key={c}
                  className={"filter-btn" + (city === c ? " on" : "")}
                  onClick={() => setCity(c)}
                  aria-pressed={city === c}
                >
                  {c === "all" ? "All cities" : c}
                </button>
              ))}

              <div className="filter-sep" aria-hidden="true"/>

              {[
                { val: "all",     label: "All types" },
                { val: "music",   label: "Music"     },
                { val: "bike",    label: "Rides"     },
                { val: "theater", label: "Theater"   },
                { val: "film",    label: "Film"      },
                { val: "talks",   label: "Talks"     },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  className={"filter-btn" + (type === val ? " on" : "")}
                  onClick={() => setType(val)}
                  aria-pressed={type === val}
                >
                  {label}
                </button>
              ))}

              <div className="spacer"/>

              <button className="refresh" onClick={load} disabled={loading} aria-label="Refresh events">
                <RefreshIcon/>{loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {loading && (
            <div className="skeleton-list">
              {[0,1,2,3,4,5].map(i => <SkeletonCard key={i}/>)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="results-hdr">{filtered.length} events</div>
              {filtered.map((e, i) => {
                const typeInfo = {
                  music:   { dot: "dot-music",   tag: "tag-music",   label: "Music"   },
                  bike:    { dot: "dot-bike",    tag: "tag-bike",    label: "Ride"    },
                  theater: { dot: "dot-theater", tag: "tag-theater", label: "Theater" },
                  film:    { dot: "dot-film",    tag: "tag-film",    label: "Film"    },
                  talks:   { dot: "dot-talks",   tag: "tag-talks",   label: "Talk"    },
                }[e.type] || { dot: "dot-music", tag: "tag-music", label: e.type };
                return (
                  <a
                    key={e.id || i}
                    className="card"
                    href={e.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className={"type-dot " + typeInfo.dot}/>

                    <div className="evbody">
                      <div className="title">{e.title}</div>
                      <div className="meta">
                        {e.venue && (
                          <span className="meta-item"><MapPin/>{e.venue}</span>
                        )}
                        {e.date && (
                          <span className="meta-item"><CalIcon/>{e.date}</span>
                        )}
                        {e.time && (
                          <span className="meta-item"><ClockIcon/>{e.time}</span>
                        )}
                      </div>
                      {e.description && (
                        <div className="desc">{e.description}</div>
                      )}
                    </div>

                    <div className="card-right">
                      {e.image && (
                        <img className="event-img" src={e.image} alt={e.title} loading="lazy"/>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        <span className={"tag " + typeInfo.tag}>
                          {typeInfo.label}
                        </span>
                        {e.is_free && <span className="tag tag-free">Free</span>}
                        {e.source && <span className="tag">{e.source}</span>}
                        <span className="ext-icon"><ArrowIcon/></span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="empty">No events yet.<br/>Run the GitHub Action to populate data.</div>
          )}
          {!loading && events.length > 0 && filtered.length === 0 && (
            <div className="empty">No events match your filters.</div>
          )}

        </div>
      </div>
    </>
  );
}

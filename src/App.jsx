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
const KidIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
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
    transition: background 0.3s;
  }

  .app.family { background: #191917; }

  .content {
    max-width: 780px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  /* ── Header ── */
  .header {
    padding: 32px 0 36px;
  }

  .header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
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

  /* ── Family toggle ── */
  .family-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #252525;
    border: 1px solid #373737;
    border-radius: 20px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #787774;
    white-space: nowrap;
    flex-shrink: 0;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }

  .family-toggle:hover { border-color: #5c5c5a; color: #b0b0ae; }

  .family-toggle.on {
    background: rgba(232, 114, 106, 0.1);
    border-color: rgba(232, 114, 106, 0.4);
    color: #e8726a;
  }

  .toggle-switch {
    width: 28px;
    height: 16px;
    background: #373737;
    border-radius: 8px;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .family-toggle.on .toggle-switch { background: #e8726a; }

  .toggle-knob {
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
  }

  .family-toggle.on .toggle-knob { transform: translateX(12px); }

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
    gap: 6px;
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

  /* Filter rows */
  .filter-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: center;
    min-height: 28px;
  }

  .filter-label {
    font-size: 11px;
    font-weight: 500;
    color: #4a4a48;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    white-space: nowrap;
    padding: 0 4px 0 2px;
    align-self: center;
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

  .filter-btn:hover { background: #2d2d2d; color: #b0b0ae; }

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
    margin: 0 4px;
  }

  .spacer { flex: 1; }

  .venue-select {
    padding: 4px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #787774;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    max-width: 180px;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .venue-select:hover, .venue-select:focus {
    background: #2d2d2d;
    border-color: #4a4a48;
    color: #e6e6e5;
  }

  .venue-select option { background: #252525; color: #e6e6e5; }

  .clear-btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #373737;
    background: transparent;
    color: #5c5c5a;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    white-space: nowrap;
  }

  .clear-btn:hover {
    background: #2d2d2d;
    border-color: #4a4a48;
    color: #e6e6e5;
  }

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

  .refresh:hover:not(:disabled) { background: #2d2d2d; color: #b0b0ae; }
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
  .dot-family   { background: #e8726a; }

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

  .tag-music   { background: rgba(232,160,32,0.14);  color: #c88c18; }
  .tag-bike    { background: rgba(58,170,128,0.14);  color: #2e9068; }
  .tag-theater { background: rgba(155,114,207,0.14); color: #8a5fc0; }
  .tag-film    { background: rgba(74,144,217,0.14);  color: #3a7bbf; }
  .tag-talks   { background: rgba(74,184,184,0.14);  color: #2e9898; }
  .tag-family  { background: rgba(232,114,106,0.14); color: #c85550; }
  .tag-free    { background: rgba(82,166,100,0.14);  color: #3a9650; }

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

  .ext-icon { color: #3a3a38; margin-top: 4px; }
  a.card:hover .ext-icon { color: #787774; }

  /* ── Resources panel ── */
  .resources {
    margin-top: 40px;
    padding-top: 28px;
    border-top: 1px solid #2f2f2f;
  }

  .resources-hdr {
    font-size: 11px;
    font-weight: 500;
    color: #4a4a48;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 16px;
  }

  .resource-group {
    margin-bottom: 20px;
  }

  .resource-group-label {
    font-size: 11px;
    font-weight: 500;
    color: #5c5c5a;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 8px;
  }

  .resource-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  a.resource-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: #b0b0ae;
    font-size: 13px;
    transition: background 0.1s, color 0.1s;
  }

  a.resource-link:hover { background: #222222; color: #e6e6e5; }

  .resource-desc {
    font-size: 12px;
    color: #5c5c5a;
    margin-left: 8px;
  }

  .resource-left { display: flex; align-items: center; gap: 0; }

  /* ── Skeleton ── */
  .skeleton-list { display: flex; flex-direction: column; gap: 2px; }

  .skel-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 6px;
  }

  .skel-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
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
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.2);
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
    a.card, .family-toggle, .toggle-switch, .toggle-knob { transition: none; }
  }
`;

const RESOURCES = [
  {
    group: "Potrero Hill & Bernal Heights",
    links: [
      { label: "Potrero New Parents Saturday Stroller Walk", desc: "Weekly, 0–24 months", url: "https://nextdoor.com/events/ca/san-francisco/potrero-new-parents-saturday-meetup-and-group-stroller-walk-1975970" },
      { label: "Bernal Heights Parents Club", desc: "Neighborhood email list, 3000+ members", url: "https://groups.io/g/bernalheightsparents" },
      { label: "Mission Parents", desc: "Email list for Mission parents", url: "https://groups.io/g/missionparents/" },
    ],
  },
  {
    group: "Stroller Walks & Outdoor Groups",
    links: [
      { label: "SF Parents Outside", desc: "Hikes, beach, picnics with kids", url: "https://www.facebook.com/groups/447304308758958/" },
      { label: "Union Street Stroller Derby", desc: "Regular stroller walk group", url: "https://www.facebook.com/groups/160702841218345/" },
      { label: "Noe Valley Mamas Walking Group", desc: "Walks, coffee, playdates", url: "https://www.facebook.com/groups/1491942217561361/" },
    ],
  },
  {
    group: "New Parent Support",
    links: [
      { label: "Recess Collective", desc: "New parent groups, first Saturdays", url: "https://recesscollective.org/" },
      { label: "Mom Squad SF", desc: "In-person meetups + online community", url: "https://www.momsquadsf.com/" },
      { label: "SF Dads Group", desc: "Meetup group for Bay Area dads", url: "https://www.meetup.com/SanFranciscoDadsGroup/" },
      { label: "Golden Gate Mothers Group", desc: "Large SF moms community, 5000+ members", url: "https://www.ggmg.org/" },
    ],
  },
  {
    group: "Neighbourhood Groups",
    links: [
      { label: "SF Parent Groups", desc: "Directory of all SF neighbourhood parent lists", url: "https://sfparentgroups.com/" },
      { label: "SFPL Kids Events", desc: "Free library events for children & families", url: "https://sfpl.org/kids/events" },
    ],
  },
];

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

const TYPES = [
  { val: "all",     label: "All"     },
  { val: "music",   label: "Music"   },
  { val: "bike",    label: "Rides"   },
  { val: "theater", label: "Theater" },
  { val: "film",    label: "Film"    },
  { val: "talks",   label: "Talks"   },
  { val: "family",  label: "Family"  },
];

const DATE_RANGES = [
  { val: "any",     label: "Any"         },
  { val: "today",   label: "Today"       },
  { val: "weekend", label: "Weekend"     },
  { val: "week",    label: "Next 7 days" },
];

const TYPE_INFO = {
  music:   { dot: "dot-music",   tag: "tag-music",   label: "Music"   },
  bike:    { dot: "dot-bike",    tag: "tag-bike",    label: "Ride"    },
  theater: { dot: "dot-theater", tag: "tag-theater", label: "Theater" },
  film:    { dot: "dot-film",    tag: "tag-film",    label: "Film"    },
  talks:   { dot: "dot-talks",   tag: "tag-talks",   label: "Talk"    },
  family:  { dot: "dot-family",  tag: "tag-family",  label: "Family"  },
};

export default function App() {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [updatedAt, setUpdated]   = useState("");
  const [city, setCity]           = useState("all");
  const [type, setType]           = useState("all");
  const [venue, setVenue]         = useState("all");
  const [dateRange, setDateRange] = useState("any");
  const [search, setSearch]       = useState("");
  const [familyMode, setFamily]   = useState(false);

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

  const clearAll = () => {
    setCity("all"); setType("all"); setVenue("all");
    setDateRange("any"); setSearch("");
  };

  const isFiltered = city !== "all" || type !== "all" || venue !== "all" || dateRange !== "any" || search !== "";

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
    const t = e.date_raw ? new Date(e.date_raw).getTime() : NaN;
    if (!isNaN(t) && t < now) return false;
    if (!isNaN(t) && t > twoWeeksOut) return false;
    if (familyMode && !e.kid_friendly) return false;
    if (city !== "all" && e.city !== city) return false;
    if (type !== "all" && e.type !== type) return false;
    if (venue !== "all" && e.venue !== venue) return false;
    if (dateRange !== "any" && !isNaN(t)) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (dateRange === "today") {
        const end = new Date(today); end.setHours(23, 59, 59, 999);
        if (t < today.getTime() || t > end.getTime()) return false;
      } else if (dateRange === "weekend") {
        const day = today.getDay();
        const daysToSat = day === 6 ? 0 : (6 - day);
        const sat = new Date(today); sat.setDate(today.getDate() + daysToSat);
        const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23, 59, 59, 999);
        if (t < sat.getTime() || t > sun.getTime()) return false;
      } else if (dateRange === "week") {
        const end = new Date(today); end.setDate(today.getDate() + 7);
        if (t < today.getTime() || t > end.getTime()) return false;
      }
    }
    if (search) {
      const q = search.toLowerCase();
      return (e.title || "").toLowerCase().includes(q) || (e.venue || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <style>{STYLES}</style>
      <div className={"app" + (familyMode ? " family" : "")}>
        <div className="content">

          <header className="header">
            <div className="header-label">Bay Area</div>
            <div className="header-top">
              <div>
                <h1>SF + Oakland Events</h1>
                <div className="sub">
                  {familyMode
                    ? "Kid-friendly events and family resources"
                    : "Music, rides, theater, film and talks — updated every 6 hours"}
                </div>
                {updatedAt && <div className="updated">{fmt(updatedAt)}</div>}
              </div>
              <button
                className={"family-toggle" + (familyMode ? " on" : "")}
                onClick={() => setFamily(f => !f)}
                aria-pressed={familyMode}
              >
                <KidIcon/>
                <span className="toggle-switch"><span className="toggle-knob"/></span>
                Family
              </button>
            </div>
          </header>

          <div className="divider"/>

          {error && <div className="error" style={{ whiteSpace: "pre-line" }}>{error}</div>}

          <div className="controls">
            <div className="search-wrap">
              <span className="search-icon"><SearchIcon/></span>
              <input
                className="search"
                placeholder="Search events, artists, venues..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>

            <div className="filter-row" role="toolbar" aria-label="City and type filters">
              <span className="filter-label">City</span>
              {["all", "SF", "Oakland"].map(c => (
                <button
                  key={c}
                  className={"filter-btn" + (city === c ? " on" : "")}
                  onClick={() => setCity(c)}
                  aria-pressed={city === c}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
              <div className="filter-sep" aria-hidden="true"/>
              <span className="filter-label">Type</span>
              {TYPES.map(({ val, label }) => (
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

            <div className="filter-row" role="toolbar" aria-label="Date and venue filters">
              <span className="filter-label">When</span>
              {DATE_RANGES.map(({ val, label }) => (
                <button
                  key={val}
                  className={"filter-btn" + (dateRange === val ? " on" : "")}
                  onClick={() => setDateRange(val)}
                  aria-pressed={dateRange === val}
                >
                  {label}
                </button>
              ))}
              <div className="filter-sep" aria-hidden="true"/>
              <span className="filter-label">Venue</span>
              <select
                className="venue-select"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                aria-label="Filter by venue"
              >
                <option value="all">All</option>
                {venueList.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {isFiltered && (
                <button className="clear-btn" onClick={clearAll}>Clear</button>
              )}
            </div>
          </div>

          {loading && (
            <div className="skeleton-list">
              {[0,1,2,3,4,5].map(i => <SkeletonCard key={i}/>)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="results-hdr">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</div>
              {filtered.map((e, i) => {
                const info = TYPE_INFO[e.type] || { dot: "dot-music", tag: "tag-music", label: e.type };
                return (
                  <a
                    key={e.id || i}
                    className="card"
                    href={e.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className={"type-dot " + info.dot}/>
                    <div className="evbody">
                      <div className="title">{e.title}</div>
                      <div className="meta">
                        {e.venue && <span className="meta-item"><MapPin/>{e.venue}</span>}
                        {e.date  && <span className="meta-item"><CalIcon/>{e.date}</span>}
                        {e.time  && <span className="meta-item"><ClockIcon/>{e.time}</span>}
                      </div>
                      {e.description && <div className="desc">{e.description}</div>}
                    </div>
                    <div className="card-right">
                      {e.image && <img className="event-img" src={e.image} alt={e.title} loading="lazy"/>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        <span className={"tag " + info.tag}>{info.label}</span>
                        {e.is_free && <span className="tag tag-free">Free</span>}
                        {e.source  && <span className="tag">{e.source}</span>}
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
            <div className="empty">
              No events match your filters.<br/>
              <button className="clear-btn" style={{ marginTop: 12 }} onClick={clearAll}>Clear filters</button>
            </div>
          )}

          {familyMode && (
            <div className="resources">
              <div className="resources-hdr">Community resources</div>
              {RESOURCES.map(({ group, links }) => (
                <div key={group} className="resource-group">
                  <div className="resource-group-label">{group}</div>
                  <div className="resource-links">
                    {links.map(({ label, desc, url }) => (
                      <a key={label} className="resource-link" href={url} target="_blank" rel="noopener noreferrer">
                        <span className="resource-left">
                          {label}
                          <span className="resource-desc">— {desc}</span>
                        </span>
                        <ArrowIcon/>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

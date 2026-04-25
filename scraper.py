"""
Bay Area Events Scraper — pulls from iCal feeds, Grizzly Peak Cyclists,
Strava clubs, and Eventbrite. Saves to events.json.
"""
import os, json, re, urllib.request, urllib.parse
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

PACIFIC = ZoneInfo("America/Los_Angeles")

EVENTBRITE_TOKEN  = os.environ.get("EVENTBRITE_TOKEN", "")
TICKETMASTER_KEY  = os.environ.get("TICKETMASTER_KEY", "")

ICAL_FEEDS = [
    {
        "name": "SF Bay Area Bike Rides",
        "url": "https://calendar.google.com/calendar/ical/153b2a6fb43fbd5181d08b07751a854b9c49c7a46d4da32121b2233789bfad08%40group.calendar.google.com/public/basic.ics",
    },
]

STRAVA_CLUB_IDS = []

MUSIC_VENUE_KEYWORDS = [
    "rickshaw stop","the independent","great american music hall","fox theater",
    "cornerstone","bottom of the hill","fillmore","warfield","chapel","bimbo",
    "august hall","el rio","lost church","starline social club","make out room",
    "slim","924 gilman","elbo room","the regency",
    "new parish","uc theatre","greek theatre","yoshi's","sfjazz",
]

EVENTBRITE_VENUES = {
    "The Fillmore":            295214625,
    "Great American Music Hall": 211929829,
    "Rickshaw Stop":           60691239,
    "Bottom of the Hill":      62103889,
    "The Chapel":              226863719,
    "The Warfield":            108397109,
    "August Hall":             227630949,
    "El Rio":                  220362309,
    "The Lost Church":         191471719,
    "Make Out Room":           93291679,
    "924 Gilman":              295748754,
    "The Regency Ballroom":    291005983,
    "New Parish":              232676049,
    "UC Theatre":              171402229,
    "Greek Theatre":           150249499,
    "Yoshi's":                 36082625,
    "SFJAZZ Center":           230851499,
    "Cornerstone":             229432209,
    "Starline Social Club":    26190402,
    "Fox Theater Oakland":     156475849,
}

def parse_ical_dt(val):
    val = val.split(";")[-1]
    for fmt in ("%Y%m%dT%H%M%SZ", "%Y%m%dT%H%M%S", "%Y%m%d"):
        try:
            dt = datetime.strptime(val, fmt)
            if fmt.endswith("Z"):
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return None

def fetch_ical(feed):
    try:
        req = urllib.request.Request(feed["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  iCal error ({feed['name']}): {e}"); return []
    events, current = [], {}
    for line in raw.splitlines():
        line = line.rstrip()
        if line == "BEGIN:VEVENT": current = {}
        elif line == "END:VEVENT":
            if current: events.append(current)
        elif ":" in line:
            key, _, val = line.partition(":")
            current[key.split(";")[0].strip()] = val.strip()
    return events

def ical_to_event(raw, source_name):
    summary  = raw.get("SUMMARY", "Untitled Ride")
    location = raw.get("LOCATION", "")
    desc     = raw.get("DESCRIPTION", "")[:200].strip()
    url      = raw.get("URL", "")
    dtstart  = raw.get("DTSTART", "")
    dt       = parse_ical_dt(dtstart) if dtstart else None
    if dt and dt.tzinfo:
        dt = dt.astimezone(PACIFIC)
    date_str = dt.strftime("%a %b %-d") if dt else "TBD"
    time_str = dt.strftime("%-I:%M %p") if dt and "T" in dtstart else "All day"
    city     = "Oakland" if "oakland" in location.lower() else "SF"
    return {
        "id": f"ical-{abs(hash(summary+dtstart))}",
        "title": summary, "type": "bike", "venue": location or source_name,
        "city": city, "date": date_str, "date_raw": dt.isoformat() if dt else "",
        "time": time_str, "description": desc, "url": url,
        "source": source_name, "is_free": True,
    }

def fetch_gpc_rides():
    try:
        req = urllib.request.Request("https://www.grizz.org/rides/", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  GPC error: {e}"); return []
    events, seen = [], set()
    pattern = re.compile(r"(MON|TUE|WED|THU|FRI|SAT|SUN)\s+([A-Z]+\s+\d+)[^<]*?<[^>]+>([^<]{5,})</", re.I)
    for m in pattern.finditer(html):
        day, date_part, title = m.group(1), m.group(2), m.group(3).strip()
        if len(title) < 4 or title.startswith("<"): continue
        try:
            dt = datetime.strptime(f"{day} {date_part} 2026", "%a %b %d %Y")
            date_str = dt.strftime("%a %b %-d")
        except ValueError:
            date_str = f"{day} {date_part}"
        key = title+date_str
        if key in seen: continue
        seen.add(key)
        events.append({
            "id": f"gpc-{abs(hash(key))}", "title": title[:80], "type": "bike",
            "venue": "Grizzly Peak Cyclists", "city": "Oakland", "date": date_str,
            "date_raw": "", "time": "See website",
            "description": "Group ride — check grizz.org for pace, distance, and meeting point.",
            "url": "https://www.grizz.org/rides/", "source": "Grizzly Peak Cyclists", "is_free": True,
        })
    return events[:20]

def fetch_strava_club(club_id):
    try:
        req = urllib.request.Request(
            f"https://www.strava.com/clubs/{club_id}/group_events",
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  Strava {club_id} error: {e}"); return []
    events = []
    titles = re.findall(r'"title"\s*:\s*"([^"]+)"', html)
    dates  = re.findall(r'"start_date"\s*:\s*"([^"]+)"', html)
    for title, raw_date in zip(titles, dates):
        try:
            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            date_str, time_str = dt.strftime("%a %b %-d"), dt.strftime("%-I:%M %p")
        except Exception:
            date_str, time_str = "TBD", ""
        events.append({
            "id": f"strava-{club_id}-{abs(hash(title+raw_date))}", "title": title,
            "type": "bike", "venue": f"Strava Club {club_id}", "city": "SF",
            "date": date_str, "date_raw": raw_date, "time": time_str,
            "description": "Group ride on Strava.",
            "url": f"https://www.strava.com/clubs/{club_id}/group_events",
            "source": f"Strava Club {club_id}", "is_free": True,
        })
    return events

def fetch_eventbrite():
    if not EVENTBRITE_TOKEN:
        print("  Skipping Eventbrite (no token)"); return []
    all_events = []
    for venue_name, venue_id in EVENTBRITE_VENUES.items():
        url = f"https://www.eventbriteapi.com/v3/venues/{venue_id}/events/?status=live"
        try:
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {EVENTBRITE_TOKEN}"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            print(f"  {venue_name}: error — {e} — {e.read().decode()[:200]}"); continue
        except Exception as e:
            print(f"  {venue_name}: error — {e}"); continue
        events = data.get("events", [])
        print(f"  {venue_name}: {len(events)} events")
        for raw in events:
            start    = raw.get("start", {}).get("local", "")
            date_str, time_str, date_raw = "TBD", "", ""
            try:
                dt       = datetime.fromisoformat(start)
                date_str = dt.strftime("%a %b %-d")
                time_str = dt.strftime("%-I:%M %p")
                date_raw = dt.isoformat()
            except Exception: pass
            oakland_venues = {"New Parish", "Fox Theater Oakland", "Yoshi's", "Starline Social Club", "Cornerstone"}
            city = "Oakland" if venue_name in oakland_venues else "SF"
            all_events.append({
                "id":          f"eb-{raw.get('id')}",
                "title":       raw.get("name", {}).get("text", "Untitled"),
                "type":        "music",
                "venue":       venue_name,
                "city":        city,
                "date":        date_str,
                "date_raw":    date_raw,
                "time":        time_str,
                "description": (raw.get("description", {}).get("text") or "")[:200].strip(),
                "url":         raw.get("url", ""),
                "source":      "Eventbrite",
                "is_free":     raw.get("is_free", False),
            })
    return all_events

def fetch_ticketmaster():
    if not TICKETMASTER_KEY:
        print("  Skipping Ticketmaster (no key)"); return []
    # (venue_name, city_query, city_label, classification, event_type)
    venues = [
        # Music
        ("The Fillmore",                  "San Francisco", "SF",      "Music",          "music"),
        ("The Warfield",                  "San Francisco", "SF",      "Music",          "music"),
        ("Great American Music Hall",     "San Francisco", "SF",      "Music",          "music"),
        ("Fox Theater",                   "Oakland",       "Oakland", "Music",          "music"),
        ("Greek Theatre",                 "Berkeley",      "Oakland", "Music",          "music"),
        ("UC Theatre",                    "Berkeley",      "Oakland", "Music",          "music"),
        ("Yoshi's",                       "Oakland",       "Oakland", "Music",          "music"),
        ("SFJAZZ Center",                 "San Francisco", "SF",      "Music",          "music"),
        ("The Regency Ballroom",          "San Francisco", "SF",      "Music",          "music"),
        ("August Hall",                   "San Francisco", "SF",      "Music",          "music"),
        ("New Parish",                    "Oakland",       "Oakland", "Music",          "music"),
        # Theater
        ("SF Playhouse",                  "San Francisco", "SF",      "Arts & Theatre", "theater"),
        ("American Conservatory Theater", "San Francisco", "SF",      "Arts & Theatre", "theater"),
        ("Curran",                        "San Francisco", "SF",      "Arts & Theatre", "theater"),
        ("Orpheum Theatre San Francisco", "San Francisco", "SF",      "Arts & Theatre", "theater"),
        ("Golden Gate Theatre",           "San Francisco", "SF",      "Arts & Theatre", "theater"),
        ("Paramount Theatre",             "Oakland",       "Oakland", "Arts & Theatre", "theater"),
        # Film
        ("Castro Theatre",                "San Francisco", "SF",      "Film",           "film"),
    ]
    all_events = []
    for venue_name, city_query, city_label, classification, event_type in venues:
        params = {
            "apikey":   TICKETMASTER_KEY,
            "keyword":  venue_name,
            "city":     city_query,
            "stateCode":"CA",
            "classificationName": classification,
            "size":     50,
        }
        url = "https://app.ticketmaster.com/discovery/v2/events.json?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())
        except Exception as e:
            print(f"  {venue_name}: error — {e}"); continue
        events = (data.get("_embedded") or {}).get("events") or []
        print(f"  {venue_name}: {len(events)} events")
        for raw in events:
            dates    = raw.get("dates", {}).get("start", {})
            date_raw = dates.get("dateTime") or dates.get("localDate") or ""
            date_str, time_str = "TBD", ""
            if dates.get("localDate"):
                try:
                    dt       = datetime.strptime(dates["localDate"], "%Y-%m-%d")
                    date_str = dt.strftime("%a %b %-d")
                except Exception: pass
            if dates.get("localTime"):
                try:
                    dt       = datetime.strptime(dates["localTime"], "%H:%M:%S")
                    time_str = dt.strftime("%-I:%M %p")
                except Exception: pass
            url_link = (raw.get("url") or "")
            # Pick best 16:9 image around 640px wide
            images = raw.get("images") or []
            image_url = ""
            for img in sorted(images, key=lambda i: abs(i.get("width", 0) - 640)):
                if img.get("ratio") == "16_9" and not img.get("fallback"):
                    image_url = img.get("url", "")
                    break
            if not image_url:
                for img in images:
                    if not img.get("fallback"):
                        image_url = img.get("url", "")
                        break
            all_events.append({
                "id":          f"tm-{raw.get('id')}",
                "title":       raw.get("name", "Untitled"),
                "type":        event_type,
                "venue":       venue_name,
                "city":        city_label,
                "date":        date_str,
                "date_raw":    date_raw,
                "time":        time_str,
                "description": "",
                "url":         url_link,
                "image":       image_url,
                "source":      "Ticketmaster",
                "is_free":     False,
            })
    return all_events

def fetch_kqed():
    try:
        req = urllib.request.Request("https://www.kqed.org/events", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  KQED error: {e}"); return []
    idx = html.find("window.__INITIAL_STATE__")
    if idx == -1:
        print("  KQED: __INITIAL_STATE__ not found"); return []
    brace = html.find("{", idx)
    if brace == -1:
        return []
    try:
        state, _ = json.JSONDecoder().raw_decode(html[brace:])
    except Exception as e:
        print(f"  KQED: JSON error: {e}"); return []
    posts = state.get("postsReducer", {})
    now_ts = datetime.now(timezone.utc).timestamp()
    two_weeks = now_ts + 14 * 24 * 3600
    events = []
    for key, val in posts.items():
        if not key.startswith("events_") or not isinstance(val, dict):
            continue
        title    = val.get("title", "").strip()
        start_ts = val.get("startTime")
        if not title or not start_ts:
            continue
        if start_ts < now_ts or start_ts > two_weeks:
            continue
        try:
            dt       = datetime.fromtimestamp(start_ts, tz=PACIFIC)
            date_str = dt.strftime("%a %b %-d")
            time_str = dt.strftime("%-I:%M %p")
            date_raw = dt.isoformat()
        except Exception:
            date_str, time_str, date_raw = "TBD", "", ""
        price   = val.get("eventPrice", "")
        is_free = "free" in price.lower() if price else False
        events.append({
            "id":          f"kqed-{abs(hash(title + str(start_ts)))}",
            "title":       title,
            "type":        "talks",
            "venue":       val.get("venueName") or "KQED",
            "city":        "SF",
            "date":        date_str,
            "date_raw":    date_raw,
            "time":        time_str,
            "description": "",
            "url":         val.get("eventLink") or "https://www.kqed.org/events",
            "source":      "KQED",
            "is_free":     is_free,
        })
    return events


def fetch_city_arts():
    try:
        req = urllib.request.Request("https://cityarts.net/events", headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  City Arts error: {e}"); return []
    card_pat  = re.compile(
        r'<a\s+href="(https://(?:www\.)?cityarts\.net/event/[^"]+)"[^>]*>(.*?)</a>',
        re.DOTALL | re.IGNORECASE
    )
    title_pat = re.compile(r'<h3[^>]*>([^<]+)</h3>', re.IGNORECASE)
    date_pat  = re.compile(r'<p[^>]*>((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+[A-Za-z]+\s+\d+)</p>', re.IGNORECASE)
    img_pat   = re.compile(r'<img[^>]+src="([^"]+)"', re.IGNORECASE)
    now    = datetime.now(timezone.utc)
    events, seen = [], set()
    for m in card_pat.finditer(html):
        url = m.group(1)
        if url in seen: continue
        seen.add(url)
        block   = m.group(2)
        title_m = title_pat.search(block)
        date_m  = date_pat.search(block)
        img_m   = img_pat.search(block)
        if not title_m: continue
        title    = title_m.group(1).strip()
        img      = img_m.group(1).strip() if img_m else ""
        date_str, date_raw = "TBD", ""
        if date_m:
            raw_date = date_m.group(1).strip()
            for year in (now.year, now.year + 1):
                try:
                    dt = datetime.strptime(f"{raw_date} {year}", "%a, %b %d %Y")
                    if dt >= (now - timedelta(days=1)).replace(tzinfo=None):
                        date_str = dt.strftime("%a %b %-d")
                        date_raw = dt.isoformat()
                        break
                except ValueError:
                    continue
        if not date_raw: continue
        events.append({
            "id":          f"cityarts-{abs(hash(title + date_raw))}",
            "title":       title,
            "type":        "talks",
            "venue":       "City Arts & Lectures",
            "city":        "SF",
            "date":        date_str,
            "date_raw":    date_raw,
            "time":        "",
            "description": "",
            "url":         url,
            "image":       img,
            "source":      "City Arts",
            "is_free":     False,
        })
    return events


def fetch_creative_mornings():
    try:
        req = urllib.request.Request("https://creativemornings.com/cities/sf", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  CreativeMornings error: {e}"); return []
    card_pat  = re.compile(
        r'<a\s+href="(/talks/[^"]+)"[^>]*>(.*?)</a>',
        re.DOTALL | re.IGNORECASE
    )
    title_pat = re.compile(r'<h3[^>]*>([^<]+)</h3>', re.IGNORECASE)
    date_pat  = re.compile(
        r'((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+[A-Za-z]+\s+\d+)\s*•\s*([\d:]+\s+[AP]M)',
        re.IGNORECASE
    )
    now    = datetime.now(timezone.utc)
    events, seen = [], set()
    for m in card_pat.finditer(html):
        path = m.group(1)
        if path in seen: continue
        seen.add(path)
        block   = m.group(2)
        title_m = title_pat.search(block)
        date_m  = date_pat.search(block)
        if not title_m or not date_m: continue
        title    = title_m.group(1).strip()
        raw_date = date_m.group(1).strip()
        raw_time = date_m.group(2).strip()
        date_str, date_raw = "TBD", ""
        for year in (now.year, now.year + 1):
            try:
                dt = datetime.strptime(f"{raw_date} {year}", "%a, %b %d %Y")
                if dt >= (now - timedelta(days=1)).replace(tzinfo=None):
                    date_str = dt.strftime("%a %b %-d")
                    date_raw = dt.isoformat()
                    break
            except ValueError:
                continue
        if not date_raw: continue
        events.append({
            "id":          f"cm-sf-{abs(hash(title + date_raw))}",
            "title":       title,
            "type":        "talks",
            "venue":       "CreativeMornings SF",
            "city":        "SF",
            "date":        date_str,
            "date_raw":    date_raw,
            "time":        raw_time,
            "description": "Free monthly breakfast lecture series for the creative community.",
            "url":         f"https://creativemornings.com{path}",
            "source":      "CreativeMornings",
            "is_free":     True,
        })
    return events


def fetch_sfpl():
    try:
        req = urllib.request.Request("https://sfpl.org/events/calendar", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  SFPL error: {e}"); return []
    idx = html.find("sfplEvents")
    if idx == -1:
        print("  SFPL: sfplEvents not found"); return []
    start = next((html.find(c, idx) for c in "{[" if html.find(c, idx) != -1), -1)
    if start == -1:
        return []
    try:
        data, _ = json.JSONDecoder().raw_decode(html[start:])
    except Exception as e:
        print(f"  SFPL: JSON error: {e}"); return []
    raw_events = data.get("events", data) if isinstance(data, dict) else data
    if not isinstance(raw_events, list):
        return []
    FAMILY_AUDIENCES = {"children", "family", "all ages", "youth", "teen", "teens", "kids"}
    now_ts = datetime.now(timezone.utc).timestamp()
    two_weeks = now_ts + 14 * 24 * 3600
    events = []
    for raw in raw_events:
        title    = (raw.get("title") or "").strip()
        start_iso = raw.get("start", "")
        audience  = (raw.get("audience") or "").lower()
        location  = raw.get("location") or "SF Public Library"
        url       = raw.get("url", "")
        if url and not url.startswith("http"):
            url = "https://sfpl.org" + url
        if not title or not start_iso:
            continue
        try:
            dt       = datetime.fromisoformat(start_iso.replace("Z", "+00:00")).astimezone(PACIFIC)
            ts       = dt.timestamp()
            date_str = dt.strftime("%a %b %-d")
            time_str = dt.strftime("%-I:%M %p")
            date_raw = dt.isoformat()
        except Exception:
            continue
        if ts < now_ts or ts > two_weeks:
            continue
        kid_friendly = any(a in audience for a in FAMILY_AUDIENCES)
        events.append({
            "id":           f"sfpl-{abs(hash(title + start_iso))}",
            "title":        title,
            "type":         "family" if kid_friendly else "talks",
            "venue":        location,
            "city":         "SF",
            "date":         date_str,
            "date_raw":     date_raw,
            "time":         time_str,
            "description":  "",
            "url":          url or "https://sfpl.org/events",
            "source":       "SFPL",
            "is_free":      True,
            "kid_friendly": kid_friendly,
        })
    return events


def fetch_funcheap_kids():
    try:
        req = urllib.request.Request(
            "https://sf.funcheap.com/category/event/event-types/kids-families/",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  Funcheap Kids error: {e}"); return []
    ld_pat    = re.compile(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
    now_ts    = datetime.now(timezone.utc).timestamp()
    two_weeks = now_ts + 14 * 24 * 3600
    events, seen = [], set()
    for m in ld_pat.finditer(html):
        try:
            data = json.loads(m.group(1))
        except Exception:
            continue
        if isinstance(data, list):
            continue
        if data.get("@type") != "Event":
            continue
        title     = (data.get("name") or "").strip()
        start_iso = data.get("startDate", "")
        location  = (data.get("location") or {}).get("name", "")
        url       = data.get("url", "")
        price     = (data.get("offers") or {}).get("price", None)
        image     = data.get("image", "")
        if not title or title in seen:
            continue
        seen.add(title)
        try:
            dt       = datetime.fromisoformat(start_iso).astimezone(PACIFIC)
            ts       = dt.timestamp()
            date_str = dt.strftime("%a %b %-d")
            time_str = dt.strftime("%-I:%M %p")
            date_raw = dt.isoformat()
        except Exception:
            continue
        if ts < now_ts or ts > two_weeks:
            continue
        events.append({
            "id":           f"funcheap-{abs(hash(title + start_iso))}",
            "title":        title,
            "type":         "family",
            "venue":        location or "SF",
            "city":         "SF",
            "date":         date_str,
            "date_raw":     date_raw,
            "time":         time_str if "12:00 AM" not in time_str else "",
            "description":  "",
            "url":          url or "https://sf.funcheap.com/category/event/event-types/kids-families/",
            "image":        image,
            "source":       "Funcheap",
            "is_free":      price in (0, "0", None),
            "kid_friendly": True,
        })
    return events


def fetch_faight():
    if not EVENTBRITE_TOKEN:
        print("  Skipping The Faight (no Eventbrite token)"); return []
    url = "https://www.eventbriteapi.com/v3/organizers/75467307963/events/?status=live"
    try:
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {EVENTBRITE_TOKEN}"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
    except Exception as e:
        print(f"  The Faight error: {e}"); return []
    events = data.get("events", [])
    print(f"  The Faight: {len(events)} events")
    result = []
    for raw in events:
        start = raw.get("start", {}).get("local", "")
        date_str, time_str, date_raw = "TBD", "", ""
        try:
            dt       = datetime.fromisoformat(start)
            date_str = dt.strftime("%a %b %-d")
            time_str = dt.strftime("%-I:%M %p")
            date_raw = dt.isoformat()
        except Exception:
            pass
        result.append({
            "id":          f"faight-{raw.get('id')}",
            "title":       raw.get("name", {}).get("text", "Untitled"),
            "type":        "music",
            "venue":       "The Faight",
            "city":        "SF",
            "date":        date_str,
            "date_raw":    date_raw,
            "time":        time_str,
            "description": (raw.get("description", {}).get("text") or "")[:200].strip(),
            "url":         raw.get("url", ""),
            "source":      "Eventbrite",
            "is_free":     raw.get("is_free", False),
        })
    return result


def main():
    now = datetime.now(timezone.utc)
    all_events = []

    print("Fetching iCal feeds...")
    for feed in ICAL_FEEDS:
        raws = fetch_ical(feed)
        all_events += [ical_to_event(r, feed["name"]) for r in raws]
        print(f"  {feed['name']}: {len(raws)} events")

    print("Fetching Grizzly Peak Cyclists...")
    gpc = fetch_gpc_rides()
    all_events += gpc
    print(f"  {len(gpc)} rides")

    for cid in STRAVA_CLUB_IDS:
        print(f"Fetching Strava club {cid}...")
        s = fetch_strava_club(cid)
        all_events += s
        print(f"  {len(s)} rides")

    print("Fetching Eventbrite (by venue)...")
    eb = fetch_eventbrite()
    all_events += eb
    print(f"  {len(eb)} total music events")

    print("Fetching Ticketmaster (by venue)...")
    tm = fetch_ticketmaster()
    all_events += tm
    print(f"  {len(tm)} total music events")

    print("Fetching CreativeMornings SF...")
    cm = fetch_creative_mornings()
    all_events += cm
    print(f"  {len(cm)} events")

    print("Fetching KQED events...")
    kqed = fetch_kqed()
    all_events += kqed
    print(f"  {len(kqed)} events")

    print("Fetching City Arts & Lectures...")
    ca = fetch_city_arts()
    all_events += ca
    print(f"  {len(ca)} events")

    print("Fetching The Faight...")
    faight = fetch_faight()
    all_events += faight
    print(f"  {len(faight)} events")

    print("Fetching SF Public Library...")
    sfpl = fetch_sfpl()
    all_events += sfpl
    print(f"  {len(sfpl)} events")

    print("Fetching Funcheap Kids & Families...")
    fk = fetch_funcheap_kids()
    all_events += fk
    print(f"  {len(fk)} events")

    # Tag kid_friendly on all events via keyword detection
    KID_KEYWORDS = [
        "all ages", "family", "families", "kids", "children", "youth",
        "baby", "babies", "toddler", "storytime", "story time",
        "playgroup", "playground", "parent", "stroller",
    ]
    for ev in all_events:
        if ev.get("kid_friendly"):
            continue
        text = f"{ev.get('title','')} {ev.get('description','')}".lower()
        ev["kid_friendly"] = any(kw in text for kw in KID_KEYWORDS)

    all_events.sort(key=lambda e: e.get("date_raw") or "9999")
    output = {"updated_at": now.isoformat(), "count": len(all_events), "events": all_events}
    with open("events.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved {len(all_events)} events to events.json.")

if __name__ == "__main__":
    main()

"""
Bay Area Events Scraper — pulls from iCal feeds, Grizzly Peak Cyclists,
Strava clubs, and Eventbrite. Saves to events.json.
"""
import os, json, re, urllib.request, urllib.parse
from datetime import datetime, timezone

EVENTBRITE_TOKEN = os.environ.get("EVENTBRITE_TOKEN", "")

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
]

EVENTBRITE_SEARCHES = [
    {"q": "live music concert", "location": "San Francisco, CA"},
    {"q": "live music concert", "location": "Oakland, CA"},
]

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
    all_events = {}
    for search in EVENTBRITE_SEARCHES:
        params = {"q": search["q"], "location.address": search["location"],
                  "location.within": "10mi", "categories": "103", "expand": "venue", "page_size": 50}
        url = "https://www.eventbriteapi.com/v3/events/search/?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {EVENTBRITE_TOKEN}"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())
        except Exception as e:
            print(f"  Eventbrite error: {e}"); continue
        for raw in data.get("events", []):
            eid = raw.get("id")
            if eid in all_events: continue
            venue    = raw.get("venue") or {}
            city_str = venue.get("address", {}).get("city", "")
            city     = "Oakland" if "oakland" in city_str.lower() else "SF"
            start    = raw.get("start", {}).get("local", "")
            try:
                dt = datetime.fromisoformat(start)
                date_str, time_str, date_raw = dt.strftime("%a %b %-d"), dt.strftime("%-I:%M %p"), dt.isoformat()
            except Exception:
                date_str, time_str, date_raw = start[:10], "", start
            vname = venue.get("name","").lower()
            tname = raw.get("name",{}).get("text","").lower()
            if MUSIC_VENUE_KEYWORDS and not any(k in vname or k in tname for k in MUSIC_VENUE_KEYWORDS):
                continue
            all_events[eid] = {
                "id": f"eb-{eid}", "title": raw.get("name",{}).get("text","Untitled"),
                "type": "music", "venue": venue.get("name","Unknown"), "city": city,
                "date": date_str, "date_raw": date_raw, "time": time_str,
                "description": (raw.get("description",{}).get("text") or "")[:200].strip(),
                "url": raw.get("url",""), "source": "Eventbrite", "is_free": raw.get("is_free",False),
            }
    return list(all_events.values())

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

    print("Fetching Eventbrite...")
    eb = fetch_eventbrite()
    all_events += eb
    print(f"  {len(eb)} events")

    all_events.sort(key=lambda e: e.get("date_raw") or "9999")
    output = {"updated_at": now.isoformat(), "count": len(all_events), "events": all_events}
    with open("events.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved {len(all_events)} events to events.json.")

if __name__ == "__main__":
    main()

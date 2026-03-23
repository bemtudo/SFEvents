"""
Bay Area Events Scraper — pulls from iCal feeds, Grizzly Peak Cyclists,
Strava clubs, and Eventbrite. Saves to events.json.
"""
import os, json, re, urllib.request, urllib.parse
from datetime import datetime, timezone

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
    venues = [
        ("The Fillmore",         "San Francisco", "SF"),
        ("The Warfield",         "San Francisco", "SF"),
        ("Great American Music Hall", "San Francisco", "SF"),
        ("Fox Theater",          "Oakland",       "Oakland"),
        ("Greek Theatre",        "Berkeley",      "Oakland"),
        ("UC Theatre",           "Berkeley",      "Oakland"),
        ("Yoshi's",              "Oakland",       "Oakland"),
        ("SFJAZZ Center",        "San Francisco", "SF"),
        ("The Regency Ballroom", "San Francisco", "SF"),
        ("August Hall",          "San Francisco", "SF"),
        ("New Parish",           "Oakland",       "Oakland"),
    ]
    all_events = []
    for venue_name, city_query, city_label in venues:
        params = {
            "apikey":   TICKETMASTER_KEY,
            "keyword":  venue_name,
            "city":     city_query,
            "stateCode":"CA",
            "classificationName": "Music",
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
                "type":        "music",
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

    all_events.sort(key=lambda e: e.get("date_raw") or "9999")
    output = {"updated_at": now.isoformat(), "count": len(all_events), "events": all_events}
    with open("events.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved {len(all_events)} events to events.json.")

if __name__ == "__main__":
    main()

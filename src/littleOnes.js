// Curated, non-dated things to do with little ones. Dated events (library
// storytimes etc.) come from the scraper; this covers what has no feed.
// ages: which stages it suits. cost: "Free" | "$" | "$$".
// Keep descriptions free of prices/times that go stale — link to the source.

const maps = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

export const REGIONS = ["SF", "East Bay", "Peninsula", "North Bay"];

export const SPOTS = [
  // ── SF ──
  { name: "Early Connections playgroups", region: "SF", kind: "play", cost: "Free", ages: ["baby", "toddler"],
    desc: "City-run developmental playgroups for ages 0–3, in many neighborhoods and languages",
    url: "https://www.sf.gov/find-a-free-developmental-playgroup-for-ages-0-to-3" },
  { name: "Children's Council playgroups", region: "SF", kind: "play", cost: "Free", ages: ["baby", "toddler", "preschool"],
    desc: "Drop-in playgroups for 0–5 and caregivers; check their calendar",
    url: "https://www.childrenscouncil.org/" },
  { name: "SF Rec & Park pools", region: "SF", kind: "swim", cost: "$", ages: ["baby", "toddler", "preschool", "kids"],
    desc: "City pools — look for parent & child swim in the seasonal aquatics schedule",
    url: "https://sfrecpark.org/" },
  { name: "JFK Promenade, Golden Gate Park", region: "SF", kind: "outdoors", cost: "Free", ages: ["baby", "toddler", "preschool", "kids"],
    desc: "Car-free, flat and smooth — an easy stroller walk",
    url: maps("JFK Promenade Golden Gate Park San Francisco") },
  { name: "Crissy Field promenade", region: "SF", kind: "outdoors", cost: "Free", ages: ["baby", "toddler", "preschool", "kids"],
    desc: "Flat bayfront path with Golden Gate views; stroller friendly",
    url: maps("Crissy Field Promenade San Francisco") },
  { name: "Koret Children's Quarter", region: "SF", kind: "play", cost: "Free", ages: ["toddler", "preschool", "kids"],
    desc: "Big Golden Gate Park playground with a little-kid area",
    url: maps("Koret Children's Quarter San Francisco") },
  { name: "Yerba Buena Gardens", region: "SF", kind: "outdoors", cost: "Free", ages: ["baby", "toddler", "preschool"],
    desc: "Downtown lawns and a children's garden — good for a blanket and tummy time",
    url: maps("Yerba Buena Gardens San Francisco") },

  // ── East Bay ──
  { name: "Lake Merritt loop", region: "East Bay", kind: "outdoors", cost: "Free", ages: ["baby", "toddler", "preschool", "kids"],
    desc: "Flat ~3 mile loop around the lake; classic stroller walk",
    url: maps("Lake Merritt Oakland") },
  { name: "Habitot pop-ups", region: "East Bay", kind: "play", cost: "Free", ages: ["baby", "toddler", "preschool"],
    desc: "Berkeley children's museum, now running free pop-up play events",
    url: "https://habitot.org/" },
  { name: "UC Berkeley parent/infant swim", region: "East Bay", kind: "swim", cost: "$$", ages: ["baby", "toddler"],
    desc: "Parent-in-the-water classes from 6 months, mostly summer sessions",
    url: "https://recwell.berkeley.edu/youth-recreation/year-round-programs/youth-swim-programs/parent-infant-tiny-tot-lessons" },
  { name: "Children's Fairyland", region: "East Bay", kind: "play", cost: "$", ages: ["toddler", "preschool", "kids"],
    desc: "Storybook park by Lake Merritt made for little kids",
    url: "https://fairyland.org/" },

  // ── Peninsula ──
  { name: "FIT4MOM stroller fitness", region: "Peninsula", kind: "movement", cost: "$", ages: ["baby", "toddler"],
    desc: "Outdoor stroller workouts in South Bay parks; first class is free",
    url: "https://sunnyvale.fit4mom.com/" },

  // ── North Bay ──
  { name: "Bay Area Discovery Museum", region: "North Bay", kind: "play", cost: "$", ages: ["baby", "toddler", "preschool", "kids"],
    desc: "Sausalito museum built for under-8s; babies under 1 get in free",
    url: "https://bayareadiscoverymuseum.org/visit" },
];

export const GROUPS = [
  { label: "Golden Gate Mothers Group", desc: "Large SF parents community, events and playgroups", url: "https://www.ggmg.org/" },
  { label: "SF Dads Group", desc: "Meetups for Bay Area dads", url: "https://www.meetup.com/SanFranciscoDadsGroup/" },
  { label: "Recess Collective", desc: "New-parent groups and gatherings", url: "https://recesscollective.org/" },
  { label: "SF Parents Outside", desc: "Hikes, beach days and picnics with kids", url: "https://www.facebook.com/groups/447304308758958/" },
  { label: "SF Parent Groups", desc: "Directory of neighborhood parent lists across the city", url: "https://sfparentgroups.com/" },
  { label: "Berkeley Parents Network", desc: "East Bay advice and recommendations archive", url: "https://www.berkeleyparentsnetwork.org/" },
];

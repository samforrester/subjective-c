const place = (name, neighborhood, category, description, tags, detail, icon = "⌖") => ({
  name, status: category, owner: neighborhood, progress: 86, due: detail, description, tags, icon
});
const signal = (text, tag) => ({ actor: "SF signal", text, time: "Live context", tag });

export default {
  novelty: 0.78,
  devtools: true,
  inspectorOpen: false,
  context: { experience: "returning", device: "auto", attention: "focused", input: "auto", motion: "auto", contrast: "auto" },
  adaptation: {
    storage: "session",
    defaultIntent: "discover",
    intents: [
      { id: "discover", label: "Open to anything", description: "A broad city mix until your searches and choices reveal a stronger direction.", interpretation: "dream-fold", keywords: ["surprise", "anything", "explore", "random", "first time", "best", "weekend"], prompts: ["Surprise me"] },
      { id: "outdoors", label: "Outside mode", description: "Terrain, weather, effort, and daylight move ahead of everything else.", interpretation: "golden-gate", keywords: ["hike", "trail", "outside", "outdoors", "nature", "sunset", "views", "walk", "park", "run", "bike"], prompts: ["I need to get outside"] },
      { id: "marina-social", label: "Marina social", description: "Group energy, walking distance, and an easy next stop become the organizing logic.", interpretation: "ferry-tide", keywords: ["marina", "drinks", "bar", "friends", "group", "happy hour", "cocktail", "social", "sports"], prompts: ["Drinks with friends"] },
      { id: "nightlife", label: "After dark", description: "Music, set times, and momentum replace the daytime city guide.", interpretation: "mission-neon", keywords: ["club", "clubbing", "dance", "dj", "music", "late", "nightlife", "party", "techno", "house"], prompts: ["I want to dance"] },
      { id: "north-beach", label: "North Beach date", description: "The city slows down around atmosphere, Italian food, and what comes after dinner.", interpretation: "sutro-fog", keywords: ["italian", "pasta", "pizza", "date", "romantic", "north beach", "dinner", "wine", "anniversary"], prompts: ["Italian date night"] },
      { id: "family", label: "Family day", description: "Short transfers, reliable landmarks, and flexible pacing take priority.", interpretation: "exploratorium-lab", keywords: ["parents", "kids", "family", "accessible", "museum", "easy", "visiting", "tour", "day trip"], prompts: ["Show my parents around"] }
    ]
  },
  data: {
    hero: { eyebrow: "One city / one URL", title: "Which San Francisco do you need?", description: "Search naturally. This page will change its hierarchy, language, recommendations, and interface around what matters to you.", placeholder: "Try “a quiet sunset hike” or “somewhere to dance”…" },
    metrics: [{ label: "Neighborhoods in range", value: "12", delta: "Citywide" }, { label: "Open directions", value: "1 tap", delta: "Stable action" }, { label: "Your current signal", value: "Broad", delta: "Still learning" }, { label: "Canonical URLs", value: "1", delta: "Always" }],
    items: [
      place("Lands End", "Outer Richmond", "Outside", "Cliffside paths, cypress, and a Pacific horizon that changes the scale of the day.", ["Trail", "Sunset", "Ocean"], "2.8 mi", "△"),
      place("North Beach after dinner", "North Beach", "Night walk", "Espresso, old neon, and a route that works better without an itinerary.", ["Italian", "Walk", "Late"], "3 stops", "◇"),
      place("Tunnel Tops", "Presidio", "Open space", "A forgiving first move with bridge views and enough room for plans to change.", ["Views", "Easy", "Group"], "All afternoon", "⌁"),
      place("The Interval", "Fort Mason", "Cocktails", "A waterfront room for curious drinks and conversations that can run long.", ["Cocktails", "Design", "Waterfront"], "Pier 2", "≈")
    ],
    activity: [signal("is keeping the whole city in play while it learns from this session", "Discover")],
    experiences: {
      outdoors: {
        hero: { eyebrow: "Outside mode / western edge", title: "Find the edge of the city.", description: "Trail conditions, effort, wind, and remaining daylight now organize the page.", placeholder: "How far, how hard, and what kind of view?" },
        metrics: [{ label: "Daylight left", value: "3h 42m", delta: "Plan the return" }, { label: "Marine layer", value: "West", delta: "Moving inland" }, { label: "Best effort", value: "Moderate", delta: "Your signal" }, { label: "Transit home", value: "29 min", delta: "From Lands End" }],
        items: [place("Lands End Coastal Trail", "Outer Richmond", "Moderate", "Ocean exposure, ruins, and enough elevation to feel earned without losing the afternoon.", ["Trail", "Ocean", "Sunset"], "3.4 mi", "△"), place("Batteries to Bluffs", "Presidio", "Steep", "A compressed descent through coastal scrub with the bridge appearing between turns.", ["Steps", "Bridge", "Wind"], "2.2 mi", "≋"), place("Mount Sutro loop", "Inner Sunset", "Shaded", "Eucalyptus, fog, and a trail system that makes the middle of the city disappear.", ["Forest", "Run", "Quiet"], "4.1 mi", "♢"), place("Angel Island perimeter", "Bay crossing", "Long", "A ferry turns the approach into part of the hike; skyline views arrive from the outside in.", ["Ferry", "History", "Full day"], "5.9 mi", "≈")],
        activity: [signal("moved terrain and daylight ahead of popularity", "Outside")]
      },
      "marina-social": {
        hero: { eyebrow: "Marina / group signal", title: "Start together. Keep moving.", description: "The interface now optimizes for group energy, short walks, and an obvious second stop.", placeholder: "Casual, cocktails, sports, or a bigger night?" },
        metrics: [{ label: "Friends", value: "4–8", delta: "Group-friendly" }, { label: "Walking radius", value: "0.7 mi", delta: "No car needed" }, { label: "Energy", value: "Building", delta: "Peaks after 9" }, { label: "Next stop", value: "6 min", delta: "On foot" }],
        items: [place("Balboa Cafe", "Cow Hollow", "Classic", "A confident first stop when the group needs somewhere everyone immediately understands.", ["Cocktails", "Group", "Classic"], "First round", "●"), place("The Interval", "Fort Mason", "Curious", "Conversation-forward cocktails beside the water, with room for the night to choose direction.", ["Design", "Cocktails", "Waterfront"], "12 min walk", "≈"), place("Horseshoe Tavern", "Marina", "Casual", "Low-friction and useful when nobody wants to overthink the first drink.", ["Dive", "Pool", "Casual"], "5 min walk", "◆"), place("White Rabbit", "Marina", "Late", "The handoff from drinks to a louder room without leaving the neighborhood.", ["Music", "Late", "Group"], "Second stop", "◇")],
        activity: [signal("compressed the city into one walkable social circuit", "Marina")]
      },
      nightlife: {
        hero: { eyebrow: "After dark / live frequency", title: "Follow the sound, not the list.", description: "Set times, music, and momentum now outrank neighborhood guides and daytime popularity.", placeholder: "What do you want to hear tonight?" },
        metrics: [{ label: "Energy peak", value: "12:40", delta: "Tonight" }, { label: "Doors", value: "10 PM", delta: "Arrive later" }, { label: "Current frequency", value: "House", delta: "Session signal" }, { label: "Last move", value: "2:00", delta: "Plan transit" }],
        items: [place("Public Works", "Mission", "Warehouse", "A flexible room where the crowd and programming matter more than polish.", ["Dance", "Electronic", "Late"], "11 PM onward", "24"), place("Great Northern", "Design District", "High energy", "Large-format sound and light for a night that has already committed.", ["House", "DJ", "Production"], "Main event", "✦"), place("Madrone Art Bar", "Divisadero", "Eclectic", "A smaller, stranger dance floor that can flip genres without losing the room.", ["Disco", "Art", "Dancing"], "Warm-up", "◎"), place("Audio", "SoMa", "Focused", "A club built around the system: direct, dark, and about the person behind the decks.", ["Sound", "House", "Club"], "Late set", "◉")],
        activity: [signal("re-ranked the city by music and start time", "After dark")]
      },
      "north-beach": {
        hero: { eyebrow: "North Beach / evening edition", title: "Dinner should begin the story.", description: "Atmosphere, pacing, and what happens after the table now shape every recommendation.", placeholder: "Pasta, pizza, wine, or somewhere intimate?" },
        metrics: [{ label: "Table mood", value: "Intimate", delta: "Lower volume" }, { label: "Walk after", value: "18 min", delta: "Columbus loop" }, { label: "Second chapter", value: "Espresso", delta: "Or amaro" }, { label: "Pace", value: "Unhurried", delta: "Your signal" }],
        items: [place("Sotto Mare", "North Beach", "Seafood", "A bright, bustling room for cioppino and a date that does not need to be overly formal.", ["Italian", "Seafood", "Classic"], "Dinner", "≈"), place("Tony’s Pizza Napoletana", "North Beach", "Lively", "The energetic choice when sharing and neighborhood theater are part of the point.", ["Pizza", "Bustling", "Iconic"], "Share a table", "○"), place("Original Joe’s", "North Beach", "Old school", "Red booths, generous plates, and the feeling that the room already knows the script.", ["Italian-American", "Cocktails", "Classic"], "Long dinner", "◇"), place("Specs’ Twelve Adler", "North Beach", "After", "A dim, artifact-filled final stop that makes the night feel found rather than planned.", ["Dive", "Conversation", "Late"], "After dinner", "✶")],
        activity: [signal("slowed the page down around atmosphere and sequence", "Date night")]
      },
      family: {
        hero: { eyebrow: "Family day / low-friction route", title: "A city day that can change its mind.", description: "Reliable landmarks, short transfers, seating, and flexible timing now come first.", placeholder: "Kids, parents, accessibility, or limited time?" },
        metrics: [{ label: "Transfers", value: "2", delta: "Kept simple" }, { label: "Indoor backup", value: "Ready", delta: "Fog or rain" }, { label: "Longest walk", value: "14 min", delta: "Mostly level" }, { label: "Flex stops", value: "3", delta: "Skip anytime" }],
        items: [place("Exploratorium", "Embarcadero", "Hands-on", "A dependable anchor where different ages can move at their own speed.", ["Museum", "Indoor", "Kids"], "2–4 hours", "∿"), place("Presidio Tunnel Tops", "Presidio", "Flexible", "Views, play space, food, and exits in every direction if energy changes.", ["Park", "Views", "Easy"], "90 minutes", "⌁"), place("California Academy of Sciences", "Golden Gate Park", "All weather", "A full-day answer with enough variety to survive competing interests.", ["Science", "Indoor", "Family"], "Half day", "◎"), place("Ferry Building circuit", "Embarcadero", "Easy", "A level waterfront route with food choices and constant permission to stop.", ["Food", "Waterfront", "Accessible"], "1.2 mi", "≈")],
        activity: [signal("put flexibility and reliable logistics ahead of novelty", "Family")]
      }
    }
  }
};

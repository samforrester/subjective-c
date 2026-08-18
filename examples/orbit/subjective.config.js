export default {
  novelty: 0.78,
  devtools: true,
  inspectorOpen: true,
  context: {
    experience: "returning",
    device: "auto",
    attention: "focused",
    input: "auto",
    motion: "auto",
    contrast: "auto"
  },
  data: {
    metrics: [
      { label: "Active projects", value: "12", delta: "+3 this week" },
      { label: "Completion rate", value: "68%", delta: "+8.4%" },
      { label: "Needs attention", value: "3", delta: "-1 today" },
      { label: "Team velocity", value: "1.7×", delta: "+0.2×" }
    ],
    items: [
      {
        name: "Open-source alpha",
        status: "In progress",
        owner: "Dylan Young",
        progress: 72,
        due: "This week",
        description: "Ship the first usable compiler, runtime, CLI, docs, and example application.",
        tags: ["Launch", "OSS", "Core"]
      },
      {
        name: "Intent manifest schema",
        status: "Review",
        owner: "Alex Chen",
        progress: 88,
        due: "Tomorrow",
        description: "Define the stable intermediate representation between English and interface composition.",
        tags: ["Schema", "Compiler"]
      },
      {
        name: "Novice interpretation study",
        status: "Planned",
        owner: "Maya Singh",
        progress: 20,
        due: "Next week",
        description: "Test whether contextual guidance helps without making the product feel patronizing.",
        tags: ["Research", "UX"]
      },
      {
        name: "Stable primary actions",
        status: "Done",
        owner: "Jordan Lee",
        progress: 100,
        due: "Completed",
        description: "Keep semantics, labels, and high-frequency actions familiar across interpretations.",
        tags: ["Runtime", "Safety"]
      },
      {
        name: "Provider adapter RFC",
        status: "Blocked",
        owner: "Riley Park",
        progress: 18,
        due: "Friday",
        description: "Define a provider-neutral contract for remote language-model compilers.",
        tags: ["RFC", "Providers"]
      },
      {
        name: "Launch documentation",
        status: "In progress",
        owner: "Dylan Young",
        progress: 54,
        due: "Aug 28",
        description: "Explain the philosophy, spec, APIs, safety model, and contribution workflow.",
        tags: ["Docs", "Community"]
      }
    ],
    activity: [
      { actor: "Maya", text: "moved novice interpretation study into planning", time: "8 minutes ago", tag: "Research" },
      { actor: "Jordan", text: "completed stable primary actions", time: "34 minutes ago", tag: "Runtime" },
      { actor: "Alex", text: "updated the intent manifest schema", time: "2 hours ago", tag: "Schema" },
      { actor: "Dylan", text: "generated a new command-center interpretation", time: "Yesterday", tag: "Variant" }
    ]
  }
};

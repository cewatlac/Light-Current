import fs from "node:fs";
import { FILES } from "./config.js";
import { escapeAttr, escapeHtml, stripLeadingCode } from "./lib.js";

const STRATEGIES = [
  {
    id: "cctv",
    match: /\b(cctv|camera|vms|nvr|lens|fov|video|surveillance|onvif)\b/i,
    visualType: "system-architecture",
    labels: ["Camera", "PoE Switch", "NVR / VMS", "Monitor"],
    description: "Video signal path from camera capture through network, recording, and monitoring."
  },
  {
    id: "access-control",
    match: /\b(access control|reader|credential|maglock|strike|rex|door contact|osdp|wiegand|anti-passback|door)\b/i,
    visualType: "wiring-diagram",
    labels: ["Reader", "Controller", "Lock / REX", "Door Status"],
    description: "Door hardware and controller relationship for access-control decisions."
  },
  {
    id: "fire-alarm",
    match: /\b(fire|facp|detector|sounder|strobe|nac|loop isolator|cause-and-effect|sprinkler|voice evacuation)\b/i,
    visualType: "loop-diagram",
    labels: ["FACP", "Loop / NAC", "Devices", "Outputs"],
    description: "Fire alarm control, detection, notification, and interface flow."
  },
  {
    id: "bms",
    match: /\b(bms|bas|ibms|bacnet|modbus|ddc|lcp|ahu|hmi|actuator|trend|meter|sequence|point)\b/i,
    visualType: "control-loop",
    labels: ["Sensor", "DDC / Controller", "Actuator", "HMI / Trend"],
    description: "Closed-loop building-control path from field sensing to dashboard feedback."
  },
  {
    id: "networking",
    match: /\b(network|switch|router|vlan|dhcp|dns|nat|firewall|poe|lan|wan|ip address|subnet|gateway|server|storage)\b/i,
    visualType: "topology-diagram",
    labels: ["Router", "Firewall", "Switch", "Segments"],
    description: "Network segmentation and traffic path between services and field devices."
  },
  {
    id: "structured-cabling",
    match: /\b(cable|fiber|odf|patch panel|rack|telecom room|outlet|splice|pigtail|patch cord|cat6|utp|horizontal cabling|backbone)\b/i,
    visualType: "path-diagram",
    labels: ["TR / Rack", "Patch Panel", "Cable Path", "Outlet / Device"],
    description: "Physical cabling route from rack equipment to field outlet or device."
  },
  {
    id: "audio-pa",
    match: /\b(pa |public address|sound|speaker|amplifier|microphone|dsp|voice alarm|100v|spl|audio)\b/i,
    visualType: "signal-flow",
    labels: ["Source", "DSP / Mixer", "Amplifier", "Speaker Zones"],
    description: "Audio signal chain from source processing to amplified speaker zones."
  },
  {
    id: "matv-iptv-av",
    match: /\b(matv|smatv|iptv|headend|multiswitch|splitter|tap|rf|dish|antenna|stb|digital signage|av over ip|hdbaset)\b/i,
    visualType: "distribution-diagram",
    labels: ["Source", "Headend", "Distribution", "Outlet / TV"],
    description: "Media distribution from antenna, dish, or server through the building network."
  },
  {
    id: "healthcare-hospitality",
    match: /\b(nurse call|code blue|grms|guest room|master clock|queue|patient|corridor lamp|slave clock)\b/i,
    visualType: "workflow-diagram",
    labels: ["Station", "Controller", "Display", "Escalation"],
    description: "Room, patient, or service request flow from field station to response point."
  },
  {
    id: "parking-iot-smart",
    match: /\b(parking|iot|mqtt|gateway|lpr|anpr|barrier|ev charging|smart building|rtls|ble|sensor network)\b/i,
    visualType: "integration-flow",
    labels: ["Sensor", "Gateway", "Platform", "Action"],
    description: "Smart-building device data flow from field sensing to platform action."
  },
  {
    id: "electrical-foundation",
    match: /\b(charge|current|voltage|resistance|power|energy|grounding|earthing|bonding|shielding|relay|transistor|rectifier|waveform|signal|noise|bandwidth|snr|attenuation)\b/i,
    visualType: "concept-diagram",
    labels: ["Source", "Quantity", "Load / Field", "Measurement"],
    description: "Electrical concept relationship between source, quantity, effect, and measurement."
  },
  {
    id: "project-delivery",
    match: /\b(commissioning|handover|shop drawing|boq|specification|fat|sat|inspection|method statement|risk|rfi|approval|o&m|training|report|checklist|deliverable|maintenance|warranty)\b/i,
    visualType: "process-flow",
    labels: ["Prepare", "Review", "Test", "Handover"],
    description: "Project-delivery workflow from preparation through evidence and handover."
  }
];

const DEFAULT_STRATEGY = {
  id: "concept-map",
  visualType: "concept-map",
  labels: ["Parent", "Topic", "Related", "Use"],
  description: "Topic relationship map connecting parent context, the current concept, and practical use."
};

export function strategyForTopic(topic) {
  const text = `${topic.title} ${topic.full_path.join(" ")} ${topic.keywords?.join(" ") ?? ""}`;
  return STRATEGIES.find((strategy) => strategy.match.test(text)) ?? DEFAULT_STRATEGY;
}

export function requiredVisualCount(topic) {
  if (topic.importance_type === "major") return 3;
  if (topic.importance_type === "medium") return 2;
  return 1;
}

export function visualRoles(topic) {
  if (topic.importance_type === "major") return ["hero", "architecture", "practical"];
  if (topic.importance_type === "medium") return ["concept", "application"];
  return ["compact"];
}

export function visualDescriptionForRole(topic, strategy, role) {
  const title = stripLeadingCode(topic.title);
  const roleText = {
    hero: "overview",
    architecture: "architecture or concept path",
    practical: "practical example",
    concept: "core concept",
    application: "field application",
    compact: "compact concept"
  }[role] ?? "concept";
  return `${title} ${roleText}: ${strategy.description}`;
}

export function makeVisualPlanEntry(topic, existing = {}) {
  const strategy = strategyForTopic(topic);
  const required = requiredVisualCount(topic);
  const roles = visualRoles(topic);
  const visuals = roles.map((role, index) => {
    const description = visualDescriptionForRole(topic, strategy, role);
    return {
      visual_id: `${topic.id}-${role}`,
      role,
      visual_type: role === "practical" || role === "application" ? "process-diagram" : strategy.visualType,
      visual_description: description,
      source_type: role === "practical" ? "generated-diagram" : "local-svg",
      asset_path: `inline-svg://${topic.slug}/${role}`,
      alt_text: `${stripLeadingCode(topic.title)} ${role} diagram showing ${strategy.labels.join(" to ")}.`,
      caption: `${stripLeadingCode(topic.title)} visual: ${description}`,
      attribution: "",
      review_notes: []
    };
  });

  return {
    page_id: topic.id,
    page_title: topic.title,
    page_url: topic.url,
    topic_category: topic.category,
    importance_type: topic.importance_type,
    required_visual_count: required,
    existing_visual_count: existing.meaningful_visuals ?? 0,
    missing_visual_count: Math.max(0, required - (existing.meaningful_visuals ?? 0)),
    selected_visual_strategy: strategy.id,
    source_type: "local-svg",
    visual_type: strategy.visualType,
    visual_description: strategy.description,
    asset_path: `inline-svg://${topic.slug}`,
    alt_text: `${stripLeadingCode(topic.title)} educational diagram.`,
    caption: `${stripLeadingCode(topic.title)} diagram connected to ${topic.full_path.slice(0, -1).join(" / ") || "the course"}.`,
    attribution: "",
    review_notes: existing.review_notes ?? [],
    manual_review_flag: Boolean(existing.manual_review_flag),
    visuals
  };
}

export function loadVisualPlan() {
  if (!fs.existsSync(FILES.visualPlan)) return null;
  const plan = JSON.parse(fs.readFileSync(FILES.visualPlan, "utf8"));
  return new Map(plan.pages.map((entry) => [entry.page_id, entry]));
}

function svgNode(x, y, w, h, label, className = "visual-node") {
  return `<g class="${className}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"></rect>
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text>
  </g>`;
}

function svgArrow(x1, y1, x2, y2) {
  return `<path class="visual-arrow" d="M${x1} ${y1} L${x2} ${y2}" marker-end="url(#arrow)"></path>`;
}

export function educationalFigure(topic, visual, options = {}) {
  const labels = options.labels?.length ? options.labels : strategyForTopic(topic).labels;
  const title = stripLeadingCode(topic.title);
  const safeId = escapeAttr(visual.visual_id);
  const markerId = `arrow-${visual.visual_id.replace(/[^a-z0-9-]/gi, "-")}`;
  const topLabel = visual.role === "practical" || visual.role === "application" ? "Field Use" : visual.role === "compact" ? "Concept" : "Architecture";
  const svg = `<svg class="technical-svg" role="img" aria-label="${escapeAttr(visual.alt_text)}" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg">
    <title>${escapeHtml(visual.alt_text)}</title>
    <defs>
      <marker id="${markerId}" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
        <path d="M0,0 L10,4 L0,8 Z"></path>
      </marker>
    </defs>
    <text class="visual-title" x="28" y="34">${escapeHtml(title)}</text>
    <text class="visual-subtitle" x="28" y="58">${escapeHtml(topLabel)} · ${escapeHtml(visual.visual_type)}</text>
    ${svgNode(34, 112, 130, 64, labels[0] ?? "Input", "visual-node node-a")}
    ${svgArrow(170, 144, 224, 144).replace("url(#arrow)", `url(#${markerId})`)}
    ${svgNode(230, 96, 150, 96, labels[1] ?? title, "visual-node node-b")}
    ${svgArrow(386, 144, 444, 144).replace("url(#arrow)", `url(#${markerId})`)}
    ${svgNode(450, 112, 128, 64, labels[2] ?? "Output", "visual-node node-c")}
    ${svgArrow(584, 144, 634, 144).replace("url(#arrow)", `url(#${markerId})`)}
    ${svgNode(638, 112, 64, 64, labels[3] ?? "Use", "visual-node node-d")}
    <path class="visual-loop" d="M520 210 C430 260 250 258 142 210"></path>
    <text class="visual-note" x="360" y="248" text-anchor="middle">design → installation → testing → handover</text>
  </svg>`;

  return `<figure class="educational-visual ${escapeAttr(visual.visual_type)}" id="${safeId}" data-educational-visual="true" data-visual-id="${safeId}" data-visual-source="${escapeAttr(visual.source_type)}" data-visual-purpose="${escapeAttr(visual.visual_description)}">
    ${svg}
    <figcaption>${escapeHtml(visual.caption)}</figcaption>
  </figure>`;
}

export function visualLibrary() {
  return {
    generated_at: new Date().toISOString(),
    strategy_count: STRATEGIES.length + 1,
    strategies: [...STRATEGIES, DEFAULT_STRATEGY].map((strategy) => ({
      id: strategy.id,
      visual_type: strategy.visualType,
      labels: strategy.labels,
      description: strategy.description,
      source_type: "local-svg"
    }))
  };
}

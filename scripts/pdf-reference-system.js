import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { DIRS, ROOT_DIR, ensureDir, readJson, writeJson } from "./config.js";
import { hashText, normalizeSpaces, stripLeadingCode } from "./lib.js";

export const PDF_REFERENCE = {
  title_ar: "المرجع في أنظمة التيار الخفيف",
  title_en: "Low Current Systems for Electrical Power Engineers",
  author_ar: "أ. د. محمود جيلاني",
  year: "2020",
  label_ar: "المرجع في أنظمة التيار الخفيف، أ. د. محمود جيلاني، 2020",
  label_en: "Low Current Systems for Electrical Power Engineers, Prof. Mahmoud Gilany, 2020"
};

export const PDF_PATH = process.env.PDF_REFERENCE_PATH
  ? path.resolve(process.env.PDF_REFERENCE_PATH)
  : path.join(DIRS.contentManual, "low-current-reference-2020.pdf");

export const PDF_PAGE_CACHE = path.join(DIRS.contentGenerated, "pdf-page-cache.private.json");

export const PDF_FILES = {
  outline: path.join(DIRS.data, "pdf-outline.json"),
  knowledgeMap: path.join(DIRS.data, "pdf-knowledge-map.json"),
  topicMapping: path.join(DIRS.data, "pdf-topic-mapping.json"),
  extractedConcepts: path.join(DIRS.data, "pdf-extracted-concepts.json"),
  coverageIndex: path.join(DIRS.data, "pdf-coverage-index.json")
};

export const REPORT_FILES = {
  outline: path.join(DIRS.reports, "pdf-outline-report.md"),
  mapping: path.join(DIRS.reports, "pdf-topic-mapping-report.md"),
  coverage: path.join(DIRS.reports, "pdf-coverage-report.md"),
  integration: path.join(DIRS.reports, "pdf-integration-report.md"),
  manualReview: path.join(DIRS.reports, "pdf-manual-review-report.md")
};

export const GROUPS = [
  {
    id: "group-00-workflow",
    order: 0,
    chapter: "Introduction and project workflow",
    headerTests: [/المقدمة/, /أعمال التيار الخفيف بالمشروعات الكبرى/],
    terms: ["low current", "ELV", "project workflow", "preliminary design", "conceptual design", "tender", "BOQ", "load estimation", "coordination", "rooms"],
    topicTerms: ["project workflow", "preliminary design", "conceptual design", "tender documentation", "BOQ", "specifications", "load estimation", "ELV rooms", "coordination"],
    externalReferences: ["Project specifications", "Authority and client requirements"],
    design_ar: "ابدأ المشروع بتحديد scope لكل نظام، غرفه، متطلبات التغذية والـ UPS، ومسؤوليات التنسيق مع المعماري والميكانيكا والكهرباء.",
    design_en: "Start by defining each system scope, rooms, power and UPS needs, and coordination responsibilities with architecture, mechanical, and electrical teams.",
    site_ar: "في الموقع، اربط كل ملاحظة بمكان واضح: room، rack، riser، drawing revision، وسبب التأثير على نظام آخر.",
    site_en: "On site, tie each note to a clear room, rack, riser, drawing revision, and the affected adjacent system.",
    test_ar: "التسليم الجيد يجمع expected result، actual evidence، reference drawing، واسم المسؤول عن المراجعة.",
    test_en: "Good handover records expected result, actual evidence, reference drawing, and responsible reviewer.",
    mistakes: ["Using early estimates as final load values without checking selected equipment datasheets.", "Coordinating rooms late after architecture and MEP layouts are frozen."],
    visualIdeas: ["ELV project workflow lane diagram", "room and riser coordination matrix", "load-estimation evidence card"]
  },
  {
    id: "group-01-network-cabling",
    order: 1,
    chapter: "Network Data and Structured Cabling",
    headerTests: [/Data Network/i, /NETWORK HARDWARE/i],
    terms: ["Network Data", "LAN", "WAN", "traffic", "data socket", "structured cabling", "UTP", "STP", "fiber optic", "patch panel", "patch cord", "cable organizer", "rack", "PDU", "switch", "router", "modem", "server", "scalability", "UPS"],
    topicTerms: ["Network Data", "LAN", "WAN", "Data Cable", "Structured Cabling", "Copper Cable", "Fiber Optic", "Data Socket", "Patch Panel", "Patch Cord", "Cable Organizer", "Rack", "PDU", "Switch", "Router", "Modem", "Server", "Network Design"],
    externalReferences: ["TIA structured cabling standards", "ISO/IEC 11801", "BICSI TDMM"],
    design_ar: "صمم الشبكة كمنظومة قابلة للتوسع: عدد outlets، حجم patch panels، rack space، switch ports، PoE/UPS، ومسار copper/fiber.",
    design_en: "Design the network as an expandable system: outlets, patch panels, rack space, switch ports, PoE/UPS, and copper/fiber pathways.",
    site_ar: "تحقق من labels، مسار الكابل، bend radius، طول copper channel، ترتيب patch cords، وتهوية الراك قبل الاختبار.",
    site_en: "Check labels, cable route, bend radius, copper channel length, patch-cord dressing, and rack ventilation before testing.",
    test_ar: "اختبر wiremap/length/loss للنحاس وOTDR أو loss budget للفايبر، ثم اربط النتيجة برقم outlet أو fiber core.",
    test_en: "Test copper wiremap/length/loss and fiber OTDR or loss budget, then tie each result to outlet or fiber-core ID.",
    mistakes: ["Sizing switches and patch panels for the current outlet count only, with no spare capacity.", "Treating fire alarm as a normal data-network subsystem instead of life-safety infrastructure."],
    visualIdeas: ["rack elevation with patch panel, switch, PDU, and cable organizers", "LAN-to-WAN topology", "copper vs fiber pathway comparison"]
  },
  {
    id: "group-02-bms",
    order: 2,
    chapter: "BMS / BAS / IBMS",
    headerTests: [/BMS System/i, /BMS/i, /إدارة المباني/],
    terms: ["BMS", "BAS", "IBMS", "DDC", "sensor", "actuator", "controller", "LCP", "HMI", "workstation", "server", "software", "BACnet", "Modbus", "LonWorks", "TCP/IP", "AI", "AO", "DI", "DO", "point", "HVAC", "AHU", "data center"],
    topicTerms: ["BMS", "BAS", "IBMS", "DDC", "Sensors", "Actuators", "BMS points", "AI", "AO", "DI", "DO", "BACnet", "Modbus", "LonWorks", "AHU", "HVAC control", "BMS integration", "Data center BMS"],
    externalReferences: ["ASHRAE building automation guidance", "BACnet official documentation", "Modbus Application Protocol"],
    design_ar: "ابدأ BMS من point list واضح: نوع النقطة AI/AO/DI/DO، range، مكان sensor/actuator، sequence، alarms، trends، والـ protocol.",
    design_en: "Start BMS from a clear point list: AI/AO/DI/DO type, range, sensor/actuator location, sequence, alarms, trends, and protocol.",
    site_ar: "راجع wiring داخل LCP، اتجاه actuator، مكان sensor، addressing، shielding، وتطابق graphic مع الجهاز الحقيقي.",
    site_en: "Check LCP wiring, actuator direction, sensor placement, addressing, shielding, and graphic-to-field matching.",
    test_ar: "اختبر calibration، manual command، auto sequence، alarm limits، trend logging، وفشل الاتصال ثم recovery.",
    test_en: "Test calibration, manual command, automatic sequence, alarm limits, trend logging, communication failure, and recovery.",
    mistakes: ["Counting points without defining ranges, units, and command authority.", "Commissioning graphics before proving field wiring and sequence behavior."],
    visualIdeas: ["BMS old vs modern architecture", "AI/AO/DI/DO point schedule visual", "AHU control loop with sensor, DDC, actuator, and feedback"]
  },
  {
    id: "group-03-telephone-voip",
    order: 3,
    chapter: "Telephone / VoIP / IP Telephone",
    headerTests: [/TELEPHONE/i, /VOIP/i, /PABX/i],
    terms: ["telephone", "traditional telephone", "RJ11", "TB", "TJB", "IDF", "SDF", "MDF", "PABX", "VoIP", "IP Telephone", "IP-PBX", "SIP", "gateway", "IP-Enable"],
    topicTerms: ["Telephone", "RJ11", "TB", "TJB", "IDF", "SDF", "MDF", "PABX", "VoIP", "IP Telephone", "IP-PBX", "SIP", "Gateway"],
    externalReferences: ["Vendor IP-PBX manuals", "SIP trunk provider requirements"],
    design_ar: "حدد هل النظام traditional، IP، أو hybrid؛ ثم اربط ذلك بالكابلات، MDF/IDF، numbering plan، gateways، والـ power/network needs.",
    design_en: "Decide whether the system is traditional, IP, or hybrid, then align cabling, MDF/IDF, numbering plan, gateways, and power/network needs.",
    site_ar: "راجع termination في MDF/IDF، labels، نوع outlet، VLAN للصوت، QoS، وPoE للـ IP phones.",
    site_en: "Check MDF/IDF terminations, labels, outlet type, voice VLAN, QoS, and PoE for IP phones.",
    test_ar: "اختبر internal calls، external calls، transfer، emergency routing، caller ID، recording أو billing إن وجدت.",
    test_en: "Test internal calls, external calls, transfer, emergency routing, caller ID, and recording or billing when required.",
    mistakes: ["Mixing analog and IP endpoint assumptions in the same outlet schedule.", "Ignoring voice VLAN/QoS and then blaming the handset for poor call quality."],
    visualIdeas: ["traditional MDF to extensions", "IP-PBX voice VLAN topology", "hybrid gateway flow"]
  },
  {
    id: "group-04-matv-iptv",
    order: 4,
    chapter: "MATV / SMATV / IPTV",
    headerTests: [/MATV/i, /SMATV/i, /IPTV/i],
    terms: ["MATV", "SMATV", "IPTV", "RF", "IF", "antenna", "headend", "tap", "splitter", "amplifier", "LNB", "multiswitch", "separator", "loss", "gain", "dB", "VoD", "STB"],
    topicTerms: ["MATV", "SMATV", "IPTV", "RF", "IF", "Antenna", "Headend", "Tap", "Splitter", "Amplifier", "LNB", "Multiswitch", "Separator", "RF loss", "VoD", "STB"],
    externalReferences: ["Vendor headend manuals", "Coaxial distribution loss tables"],
    design_ar: "صمم المسار حسب level budget: مصدر الإشارة، headend، amplifier gain، splitter/tap loss، cable loss، ومستوى الإشارة عند outlet.",
    design_en: "Design the path around the level budget: source, headend, amplifier gain, splitter/tap loss, cable loss, and outlet signal level.",
    site_ar: "افحص connector quality، اتجاه tap/splitter، power للـ active devices، grounding، وترتيب coax داخل الراك.",
    site_en: "Inspect connector quality, tap/splitter direction, power for active devices, grounding, and coax dressing inside the rack.",
    test_ar: "سجل RF/IF level، quality، channel scan، picture/audio result، أو multicast stability في IPTV.",
    test_en: "Record RF/IF level, quality, channel scan, picture/audio result, or IPTV multicast stability.",
    mistakes: ["Adding splitters without recalculating downstream loss.", "Treating IPTV as RF distribution instead of network capacity, multicast, and endpoint configuration."],
    visualIdeas: ["RF headend distribution tree", "tap/splitter loss calculator", "IPTV multicast path with STB"]
  },
  {
    id: "group-05-access-control",
    order: 5,
    chapter: "Access Control",
    headerTests: [/Access Control/i, /Card Reader/i, /Biometric/i],
    terms: ["Access Control", "card reader", "biometric", "keypad", "face recognition", "magnetic lock", "electric lock", "REX", "door controller", "server", "serial", "IP controller", "door contact"],
    topicTerms: ["Access Control", "Card Reader", "Biometric", "Keypad", "Face Recognition", "Magnetic Lock", "Electric Lock", "REX", "Door Controller", "Door Contact", "Access Control Server", "Access Topology"],
    externalReferences: ["SIA OSDP guidance", "Door hardware and life-safety requirements"],
    design_ar: "ابدأ من door schedule: reader type، lock type، REX، door contact، fire release، access levels، والـ fail-safe/fail-secure decision.",
    design_en: "Start from the door schedule: reader type, lock type, REX, door contact, fire release, access levels, and fail-safe/fail-secure decision.",
    site_ar: "راجع اتجاه الباب، alignment للقفل، cable cores، polarity، location للـ REX، labels، وربط fire alarm release.",
    site_en: "Check door swing, lock alignment, cable cores, polarity, REX location, labels, and fire-alarm release interface.",
    test_ar: "اختبر valid/denied card، REX، forced/held open، fire release، battery backup، event log، وtime schedule.",
    test_en: "Test valid/denied cards, REX, forced/held-open, fire release, battery backup, event log, and time schedule.",
    mistakes: ["Designing the reader without coordinating lock power and egress/fire release.", "Testing access granted only, while ignoring denied access and alarm states."],
    visualIdeas: ["door control wiring diagram", "serial vs IP controller topology", "fire-release cause/effect path"]
  },
  {
    id: "group-06-nurse-call",
    order: 6,
    chapter: "Nurse Call",
    headerTests: [/NURSE CALL/i, /Nurse Station/i, /Patient Station/i],
    terms: ["Nurse Call", "Nurse Station", "Patient Station", "IP nurse call", "management unit", "traditional nurse call", "bathroom pull cord", "corridor lamp"],
    topicTerms: ["Nurse Call", "Nurse Station", "Patient Station", "IP Nurse Call", "Management Unit", "Traditional Nurse Call"],
    externalReferences: ["Healthcare facility design requirements", "Vendor nurse-call manuals"],
    design_ar: "اربط كل room وbed بمحطة المريض، corridor indication، nurse station، escalation rules، integration، والـ power/network backup.",
    design_en: "Map each room and bed to patient station, corridor indication, nurse station, escalation rules, integration, and backed-up power/network.",
    site_ar: "تأكد من location عند السرير والحمام، visibility للمبة الممر، labels، cable/network، ومطابقة room numbers.",
    site_en: "Verify bed and bathroom station locations, corridor-lamp visibility, labels, cable/network, and room-number mapping.",
    test_ar: "اختبر call، cancel، assistance، emergency، escalation، display، reports، وفشل الشبكة أو التغذية.",
    test_en: "Test call, cancel, assistance, emergency, escalation, display, reports, and network or power failure.",
    mistakes: ["Mapping room numbers late, causing nurse-station displays to disagree with architecture.", "Testing only the call button without cancellation and escalation behavior."],
    visualIdeas: ["room-to-nurse-station workflow", "traditional vs IP nurse-call topology", "escalation timeline"]
  },
  {
    id: "group-07-cctv",
    order: 7,
    chapter: "CCTV",
    headerTests: [/CCTV/i, /DVR/i, /NVR/i, /Field of View/i],
    terms: ["CCTV", "analog CCTV", "IP CCTV", "camera", "DVR", "NVR", "VMS", "storage", "compression", "VCA", "sensor size", "lens", "focal length", "FOV", "S/N", "resolution", "TVL", "megapixel", "zoom", "BLC", "AGC", "HLC", "sensitivity", "PoE", "dome", "bullet", "PTZ"],
    topicTerms: ["CCTV", "Analog CCTV", "IP CCTV", "Camera", "DVR", "NVR", "VMS", "Storage Calculation", "Compression", "VCA", "Sensor Size", "Lens", "Focal Length", "FOV", "S/N", "Resolution", "TVL", "Megapixel", "Zoom", "BLC", "AGC", "HLC", "Sensitivity", "PoE", "Dome", "Bullet", "PTZ"],
    externalReferences: ["ONVIF specifications", "Vendor camera and VMS manuals"],
    design_ar: "صمم CCTV من هدف المشهد: identification/detection، FOV، lens، resolution، lighting، bitrate، storage retention، network، وVMS users.",
    design_en: "Design CCTV from the scene objective: identification/detection, FOV, lens, resolution, lighting, bitrate, retention storage, network, and VMS users.",
    site_ar: "راجع mounting، aiming، focus، cable/PoE، weather rating، reflections، night mode، وتنظيف العدسة.",
    site_en: "Check mounting, aiming, focus, cable/PoE, weather rating, reflections, night mode, and lens cleaning access.",
    test_ar: "اختبر live view، playback، export، day/night، motion/VCA، time sync، user permissions، وstorage estimate.",
    test_en: "Test live view, playback, export, day/night, motion/VCA, time sync, user permissions, and storage estimate.",
    mistakes: ["Choosing megapixels without checking FOV and pixel density at the target.", "Calculating storage without bitrate, frame rate, codec, retention, and motion assumptions."],
    visualIdeas: ["FOV visualizer", "IP CCTV topology", "storage calculator", "analog vs IP comparison"]
  },
  {
    id: "group-08-fire-alarm",
    order: 8,
    chapter: "Fire Alarm",
    headerTests: [/FIRE ALARM/i, /FACP/i, /Call Point/i],
    terms: ["Fire Alarm", "detector", "manual call point", "sounder", "flasher", "FACP", "door holder", "monitor module", "control module", "isolation module", "conventional", "addressable", "intelligent", "wireless", "zone", "notification zone", "cause and effect", "battery", "beam", "heat", "flame", "gas", "duct"],
    topicTerms: ["Fire Alarm", "Detector", "Manual Call Point", "MCP", "Sounder", "Flasher", "FACP", "Door Holder", "Monitor Module", "Control Module", "Isolation Module", "Conventional", "Addressable", "Intelligent", "Wireless", "Fire Alarm Zones", "Notification Zones", "Detector Layout", "Cause and Effect", "Battery"],
    externalReferences: ["NFPA 72", "EN 54", "Local civil-defense requirements"],
    design_ar: "ابدأ من الكود والغرض: detector type/spacing، zones، loop loading، NAC loading، battery، cause-and-effect، وinterfaces مع أنظمة أخرى.",
    design_en: "Start from code and purpose: detector type/spacing, zones, loop loading, NAC loading, battery, cause-and-effect, and interfaces with other systems.",
    site_ar: "راجع address labels، cable rating، polarity، isolators، module wiring، detector location، وموانع false alarm.",
    site_en: "Check address labels, cable rating, polarity, isolators, module wiring, detector location, and false-alarm risks.",
    test_ar: "اختبر alarm، fault، supervisory، notification، cause/effect، battery، reset/disable، والتوثيق الموقع.",
    test_en: "Test alarm, fault, supervisory, notification, cause/effect, battery, reset/disable, and site evidence.",
    mistakes: ["Selecting detector type without considering environment and false-alarm sources.", "Treating zones and notification zones as the same design decision."],
    visualIdeas: ["addressable loop diagram", "cause-and-effect matrix", "detector selection decision tree"]
  },
  {
    id: "group-09-pa-acoustics",
    order: 9,
    chapter: "Sound / PA / Acoustics",
    headerTests: [/Sound/i, /Public Address/i, /AMPLIFIER/i],
    terms: ["sound", "frequency", "speed of sound", "intensity", "dB", "pitch", "microphone", "amplifier", "clipping", "loudspeaker", "speaker wiring", "100V", "crossover", "horn", "mixer", "matrix", "attenuator", "SPL", "noise", "reflection", "feedback", "echo", "reverberation", "resonance", "diffusion", "absorption"],
    topicTerms: ["Sound Basics", "Frequency", "Speed of Sound", "Intensity", "dB", "Pitch", "Microphone", "Amplifier", "Clipping", "Loudspeaker", "Speaker Wiring", "100V", "Crossover", "Horn", "Mixer", "Matrix", "Attenuator", "PA Design", "SPL", "Noise", "Reflection", "Feedback", "Echo", "Reverberation", "Resonance", "Diffusion", "Absorption"],
    externalReferences: ["IEC loudspeaker and amplifier manuals", "Acoustics and SPL measurement references"],
    design_ar: "صمم PA من zone وSPL/STI target: noise level، speaker type/tap، spacing، amplifier load، priorities، وemergency override.",
    design_en: "Design PA from zone and SPL/STI targets: noise level, speaker type/tap, spacing, amplifier load, priorities, and emergency override.",
    site_ar: "راجع speaker tap، polarity، line routing، amplifier channels، labels، feedback risk، ومكان microphone.",
    site_en: "Check speaker tap, polarity, line routing, amplifier channels, labels, feedback risk, and microphone location.",
    test_ar: "اختبر SPL/STI، zone selection، priority override، fault monitoring، clipping، feedback، وbackup operation.",
    test_en: "Test SPL/STI, zone selection, priority override, fault monitoring, clipping, feedback, and backup operation.",
    mistakes: ["Selecting amplifier power without summing speaker taps and spare margin.", "Ignoring room acoustics, causing feedback or poor intelligibility despite enough wattage."],
    visualIdeas: ["100V speaker zone layout", "amplifier load calculator", "reflection/echo waveform diagram"]
  },
  {
    id: "group-10-standards-handover",
    order: 10,
    chapter: "Codes, standards, testing, commissioning, and handover",
    headerTests: [/CODES/i, /STANDARDS/i, /Commissioning/i, /اختبار/],
    terms: ["codes", "standards", "testing", "commissioning", "handover", "documentation", "BOQ", "specifications", "riser diagrams", "layouts", "rack layouts", "load estimation", "tender"],
    topicTerms: ["Codes", "Standards", "Testing", "Commissioning", "Handover", "Documentation", "BOQ", "Specifications", "Riser Diagram", "Layouts", "Rack Layout", "Load Estimation", "Tender"],
    externalReferences: ["Applicable local codes", "Approved project specifications"],
    design_ar: "كل standard أو specification يجب أن يتحول إلى acceptance criteria قابلة للاختبار وليست مجرد اسم في المستند.",
    design_en: "Every standard or specification must become testable acceptance criteria, not just a named reference.",
    site_ar: "التنفيذ المقبول يعتمد على approved revision، material submittal، site condition، ومسار واضح للـ NCR أو punch item.",
    site_en: "Accepted work depends on approved revision, material submittal, site condition, and a clear NCR or punch-item path.",
    test_ar: "اجعل كل test sheet يربط النظام، المكان، الجهاز، النتيجة، الصورة أو القراءة، والتوقيع.",
    test_en: "Each test sheet should connect system, location, asset, result, photo or reading, and signature.",
    mistakes: ["Writing generic pass/fail without evidence.", "Using specifications without mapping clauses to drawings, BOQ, and test records."],
    visualIdeas: ["handover evidence chain", "documentation package map", "commissioning decision checklist"]
  }
];

const TERM_ALIASES = [
  ["Network Data", ["data network", "network data", "شبكة البيانات"]],
  ["Structured Cabling", ["structured cabling", "structure cabling", "cabling system"]],
  ["Copper Cable", ["utp", "stp", "ethernet cable", "cat6", "copper"]],
  ["Fiber Optic", ["fiber optic", "fibre", "fiber"]],
  ["Patch Panel", ["patch panel", "pp"]],
  ["Patch Cord", ["patch cord"]],
  ["Cable Organizer", ["cable organizer"]],
  ["Data Socket", ["data socket", "node", "outlet"]],
  ["Rack", ["rack"]],
  ["PDU", ["pdu"]],
  ["Switch", ["switch"]],
  ["Router", ["router"]],
  ["Server", ["server"]],
  ["BMS", ["bms", "building management"]],
  ["DDC", ["ddc"]],
  ["Sensor", ["sensor", "sensors"]],
  ["Actuator", ["actuator", "actuators"]],
  ["BACnet", ["bacnet"]],
  ["Modbus", ["modbus"]],
  ["Telephone", ["telephone", "phone"]],
  ["VoIP", ["voip"]],
  ["PABX", ["pabx", "pbx"]],
  ["MATV", ["matv"]],
  ["SMATV", ["smatv"]],
  ["IPTV", ["iptv"]],
  ["Access Control", ["access control"]],
  ["Card Reader", ["card reader"]],
  ["Magnetic Lock", ["magnetic lock", "maglock"]],
  ["Electric Lock", ["electric lock"]],
  ["REX", ["rex"]],
  ["Door Controller", ["door controller"]],
  ["Nurse Call", ["nurse call"]],
  ["CCTV", ["cctv"]],
  ["DVR", ["dvr"]],
  ["NVR", ["nvr"]],
  ["VMS", ["vms"]],
  ["Storage Calculation", ["storage", "retention"]],
  ["FOV", ["fov", "field of view"]],
  ["Focal Length", ["focal length"]],
  ["Fire Alarm", ["fire alarm"]],
  ["Detector", ["detector", "detectors"]],
  ["FACP", ["facp", "fire alarm control panel"]],
  ["Sounder", ["sounder"]],
  ["Flasher", ["flasher"]],
  ["Manual Call Point", ["manual call point", "mcp"]],
  ["Sound Basics", ["sound basics"]],
  ["Amplifier", ["amplifier", "amp"]],
  ["Loudspeaker", ["loudspeaker", "speaker"]],
  ["100V", ["100v"]],
  ["dB", ["db", "decibel"]],
  ["BOQ", ["boq"]],
  ["Specifications", ["specification", "specifications"]],
  ["Commissioning", ["commissioning"]],
  ["Handover", ["handover"]]
];

export function markdownTable(rows, headers) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  return [head, sep, ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)].join("\n");
}

export function rel(file) {
  return path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
}

export function pythonPath() {
  const candidates = [
    process.env.PDF_PYTHON,
    path.join(process.env.USERPROFILE ?? "", ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
    "python"
  ].filter(Boolean);
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["-c", "import sys; print(sys.version)"], { encoding: "utf8" });
    if (probe.status === 0) return candidate;
  }
  throw new Error("No usable Python executable found for PDF extraction. Set PDF_PYTHON to a Python with pypdf installed.");
}

export function extractPagesFromPdf() {
  if (!fs.existsSync(PDF_PATH)) throw new Error(`PDF not found: ${PDF_PATH}`);
  const py = pythonPath();
  const code = String.raw`
import json, sys
from pypdf import PdfReader
pdf_path = sys.argv[1]
reader = PdfReader(pdf_path)
pages = []
for index, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    pages.append({
        "page_number": index + 1,
        "text": text,
        "text_length": len(text),
        "text_hash": __import__("hashlib").sha1(text.encode("utf-8")).hexdigest()[:16]
    })
payload = {
    "page_count": len(reader.pages),
    "metadata": {str(k): str(v) for k, v in (reader.metadata or {}).items()},
    "pages": pages
}
json.dump(payload, sys.stdout, ensure_ascii=False)
`;
  const result = spawnSync(py, ["-c", code, PDF_PATH], {
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" }
  });
  if (result.status !== 0) {
    throw new Error(`PDF extraction failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

export function loadOrExtractPdfPages() {
  if (fs.existsSync(PDF_PAGE_CACHE)) return readJson(PDF_PAGE_CACHE);
  const payload = extractPagesFromPdf();
  ensureDir(path.dirname(PDF_PAGE_CACHE));
  fs.writeFileSync(PDF_PAGE_CACHE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export function cleanText(value) {
  return normalizeSpaces(String(value ?? "").normalize("NFKC").replace(/\u00a0/g, " "));
}

export function pageText(page) {
  return cleanText(page.text);
}

export function groupForPage(page) {
  const text = pageText(page);
  if (page.page_number < 18) return null;
  const header = text.slice(0, 260);
  for (const group of GROUPS) {
    if (group.headerTests.some((test) => test.test(header) || test.test(text.slice(0, 900)))) return group;
  }
  return null;
}

export function inferGroupRanges(pages) {
  if (pages.length >= 360) {
    const fixed = [
      ["group-00-workflow", 18, 22],
      ["group-01-network-cabling", 23, 56],
      ["group-02-bms", 57, 70],
      ["group-03-telephone-voip", 71, 96],
      ["group-04-matv-iptv", 97, 142],
      ["group-05-access-control", 143, 159],
      ["group-06-nurse-call", 160, 170],
      ["group-07-cctv", 171, 211],
      ["group-08-fire-alarm", 212, 274],
      ["group-09-pa-acoustics", 275, pages.length]
    ];
    return fixed.map(([id, start_page, end_page]) => ({
      ...GROUPS.find((group) => group.id === id),
      start_page,
      end_page
    }));
  }

  const starts = [];
  let active = null;
  for (const page of pages) {
    const group = groupForPage(page);
    if (group && group.id !== active?.id) {
      starts.push({ group, start_page: page.page_number });
      active = group;
    }
  }
  const byGroup = [];
  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index];
    const next = starts[index + 1];
    byGroup.push({
      ...current.group,
      start_page: current.start_page,
      end_page: next ? next.start_page - 1 : pages[pages.length - 1].page_number
    });
  }
  return byGroup.filter((entry, index, array) => array.findIndex((item) => item.id === entry.id) === index);
}

export function parseTocSections(pages, groupRanges) {
  const tocText = pages.filter((page) => page.page_number >= 8 && page.page_number <= 17).map((page) => page.text).join("\n");
  const lines = tocText.split(/\r?\n/).map(cleanText).filter(Boolean);
  const sections = [];
  let currentGroup = groupRanges.find((group) => group.order === 0) ?? groupRanges[0];
  const chapterMatchers = GROUPS.map((group) => ({
    group,
    pattern: new RegExp(group.chapter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(/\s+/).slice(0, 2).join(".*"), "i")
  }));

  for (const line of lines) {
    for (const { group } of chapterMatchers) {
      if (group.terms.some((term) => line.toLowerCase().includes(term.toLowerCase())) || group.headerTests.some((test) => test.test(line))) {
        currentGroup = groupRanges.find((item) => item.id === group.id) ?? currentGroup;
      }
    }
    const match = line.match(/^(.{4,160}?)\.{5,}\s*(\d{1,3})$/);
    if (!match || !currentGroup) continue;
    const title = cleanText(match[1]).replace(/^[•\-\s]+/, "");
    if (!title || /Table of Contents|الفهرس|المرجع/.test(title)) continue;
    const printed = Number(match[2]);
    const pdfPage = currentGroup.start_page + Math.max(0, printed - 1);
    sections.push({
      id: `pdf-section-${String(sections.length + 1).padStart(4, "0")}`,
      group_id: currentGroup.id,
      group: currentGroup.chapter,
      title,
      printed_page: printed,
      start_page: Math.min(pdfPage, currentGroup.end_page),
      end_page: Math.min(pdfPage, currentGroup.end_page),
      source: "table-of-contents"
    });
  }

  const grouped = new Map();
  for (const section of sections) {
    const list = grouped.get(section.group_id) ?? [];
    list.push(section);
    grouped.set(section.group_id, list);
  }
  for (const group of groupRanges) {
    const list = (grouped.get(group.id) ?? []).sort((a, b) => a.start_page - b.start_page);
    for (let i = 0; i < list.length; i += 1) {
      list[i].end_page = i < list.length - 1 ? Math.max(list[i].start_page, list[i + 1].start_page - 1) : group.end_page;
    }
  }

  const parsed = [...grouped.values()].flat().sort((a, b) => a.start_page - b.start_page);
  if (parsed.length >= 30) return parsed;

  return groupRanges.flatMap((group) => fallbackSectionsForGroup(group));
}

export function fallbackSectionsForGroup(group) {
  const sections = [];
  let page = group.start_page;
  let index = 1;
  while (page <= group.end_page) {
    const end = Math.min(group.end_page, page + 3);
    sections.push({
      id: `pdf-section-${group.order}-${String(index).padStart(2, "0")}`,
      group_id: group.id,
      group: group.chapter,
      title: `${group.chapter} pages ${page}-${end}`,
      printed_page: null,
      start_page: page,
      end_page: end,
      source: "fallback-page-range"
    });
    page = end + 1;
    index += 1;
  }
  return sections;
}

export function detectTerms(text, terms) {
  const lower = text.toLowerCase();
  const found = [];
  for (const term of terms) {
    if (lower.includes(term.toLowerCase())) found.push(term);
  }
  return [...new Set(found)];
}

export function detectStandards(text, group) {
  const standards = [];
  const patterns = ["NFPA 72", "EN 54", "TIA", "ISO", "BICSI", "ASHRAE", "BACnet", "Modbus", "ONVIF", "OSDP", "IEC 62386", "SIP"];
  for (const pattern of patterns) {
    if (new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) standards.push(pattern);
  }
  return [...new Set([...standards, ...group.externalReferences])];
}

export function detectFormulas(text, group) {
  const formulas = [];
  const unitPattern = /\b(?:dB|W|kW|V|A|Hz|MHz|GHz|m|mm|Mbps|Gbps|lux|SPL|Wh|TB)\b/g;
  if (unitPattern.test(text)) formulas.push("Use the section units and selected equipment data when calculating levels, loads, capacity, or coverage.");
  if (/storage|bitrate|retention|DVR|NVR/i.test(text)) formulas.push("CCTV storage depends on bitrate, channel count, retention time, codec, frame rate, and recording mode.");
  if (/loss|gain|splitter|tap|RF|IF|dB/i.test(text)) formulas.push("MATV/SMATV level design balances source level, amplifier gain, splitter/tap loss, cable loss, and outlet target level.");
  if (/UPS|load|KW|power|PoE/i.test(text)) formulas.push("ELV load estimation must use selected device datasheets, quantities, diversity, UPS duration, and spare capacity.");
  if (/FOV|focal|lens|Field of View/i.test(text)) formulas.push("Camera coverage depends on sensor size, focal length, distance, mounting height, and required target detail.");
  return [...new Set(formulas)];
}

export function sectionText(pages, section) {
  return pages
    .filter((page) => page.page_number >= section.start_page && page.page_number <= section.end_page)
    .map((page) => pageText(page))
    .join(" ");
}

export function buildSectionConcept(section, pages, group) {
  const text = sectionText(pages, section);
  const components = detectTerms(text, [...group.terms, ...group.topicTerms]).slice(0, 24);
  const hasExample = /مثال|نموذج|example|تطبيقي/i.test(text);
  const hasWarning = /تذكر|لاحظ|لا يصح|مهم|خطأ|مشكلة|تحذير|يجب/i.test(text);
  const formulas = detectFormulas(text, group);
  const status = components.length || formulas.length || hasExample || hasWarning ? "candidate-for-integration" : "manual-review-needed";
  const seed = `${section.title} ${components.join(" ")} ${group.chapter}`;
  return {
    id: section.id,
    group_id: group.id,
    group: group.chapter,
    section_title: section.title,
    page_range: [section.start_page, section.end_page],
    source_text_hash: hashText(seed),
    system_names: detectTerms(text, group.terms).slice(0, 12),
    component_names: components,
    formulas_or_calculations: formulas,
    design_rules: [group.design_en],
    design_rules_ar: [group.design_ar],
    installation_checks: [group.site_en],
    installation_checks_ar: [group.site_ar],
    testing_checks: [group.test_en],
    testing_checks_ar: [group.test_ar],
    warnings_or_mistakes: hasWarning ? group.mistakes : group.mistakes.slice(0, 1),
    practical_examples: hasExample ? [`Use this section as a rewritten practical scenario for ${group.chapter}.`] : [],
    standards_or_references: detectStandards(text, group),
    diagram_or_visual_ideas: group.visualIdeas,
    integration_status: status,
    manual_review_status: status === "manual-review-needed" ? "needs-review-no-strong-keyword" : "ready-for-mapping",
    copyright_note: "Public pages must use this as source guidance only; do not copy the PDF text verbatim."
  };
}

export function normalizeKey(value) {
  return stripLeadingCode(String(value ?? ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .toLowerCase()
    .trim();
}

export function topicSearchText(topic) {
  return normalizeKey([
    topic.title,
    stripLeadingCode(topic.title),
    topic.full_path.join(" "),
    topic.aliases?.join(" "),
    topic.acronyms?.join(" "),
    topic.keywords?.join(" ")
  ].join(" "));
}

export function candidateQueriesForConcept(concept, group) {
  const querySet = new Set([...group.topicTerms, ...concept.component_names, ...concept.system_names]);
  for (const [canonical, aliases] of TERM_ALIASES) {
    const haystack = normalizeKey(`${concept.section_title} ${concept.component_names.join(" ")} ${concept.system_names.join(" ")}`);
    if (aliases.some((alias) => haystack.includes(normalizeKey(alias)))) querySet.add(canonical);
  }
  return [...querySet].filter(Boolean);
}

export function scoreTopic(topic, query, group) {
  const text = topicSearchText(topic);
  const q = normalizeKey(query);
  if (!q) return 0;
  let score = 0;
  if (text === q) score += 60;
  if (text.includes(q)) score += 28;
  for (const part of q.split(/\s+/).filter((item) => item.length >= 2)) {
    if (text.includes(part)) score += 4;
  }
  if (topic.importance_type === "major") score += 8;
  if (topic.importance_type === "medium") score += 4;
  if (group.terms.some((term) => topicSearchText(topic).includes(normalizeKey(term)))) score += 4;
  return score;
}

export function bestTopicMatches(topics, concept, group, max = 4) {
  const scores = new Map();
  for (const query of candidateQueriesForConcept(concept, group)) {
    for (const topic of topics) {
      const score = scoreTopic(topic, query, group);
      if (score > 18) scores.set(topic.id, Math.max(scores.get(topic.id) ?? 0, score));
    }
  }
  return [...scores.entries()]
    .map(([topic_id, score]) => {
      const topic = topics.find((item) => item.id === topic_id);
      return { topic_id, score, title: topic.title, url: topic.url, full_path: topic.full_path };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

import { stripLeadingCode } from "./lib.js";

const DEFAULT_REFERENCE_ITEMS = [
  "Approved project drawings and schedules",
  "Project specifications and material submittals",
  "Vendor installation, configuration, and commissioning manuals",
  "Applicable local codes, authority requirements, and standards"
];

function topicText(topic) {
  const cleanTitle = stripLeadingCode(topic.title);
  return {
    title: topic.title,
    cleanTitle,
    path: topic.full_path.join(" / "),
    parent: topic.full_path.length > 1 ? stripLeadingCode(topic.full_path[topic.full_path.length - 2]) : "the course",
    category: topic.category || topic.unit || "this course area"
  };
}

function fill(value, data) {
  if (Array.isArray(value)) return value.map((item) => fill(item, data));
  if (typeof value !== "string") return value;
  return value
    .replaceAll("{title}", data.title)
    .replaceAll("{cleanTitle}", data.cleanTitle)
    .replaceAll("{path}", data.path)
    .replaceAll("{parent}", data.parent)
    .replaceAll("{category}", data.category);
}

function createRule(config) {
  return {
    ...config,
    build(topic) {
      const data = topicText(topic);
      return {
        profile_id: config.id,
        profile_name: config.name,
        domain: fill(config.domain, data),
        visual: { id: config.id, ...config.visual },
        hero_ar: fill(config.hero_ar, data),
        hero_en: fill(config.hero_en, data),
        definition_ar: fill(config.definition_ar, data),
        definition_en: fill(config.definition_en, data),
        why_ar: fill(config.why_ar, data),
        why_en: fill(config.why_en, data),
        appears_ar: fill(config.appears_ar, data),
        appears_en: fill(config.appears_en, data),
        examples: fill(config.examples, data),
        architecture_ar: fill(config.architecture_ar, data),
        architecture_en: fill(config.architecture_en, data),
        flow_ar: fill(config.flow_ar, data),
        flow_en: fill(config.flow_en, data),
        design_ar: fill(config.design_ar, data),
        design_en: fill(config.design_en, data),
        site_ar: fill(config.site_ar, data),
        site_en: fill(config.site_en, data),
        test_ar: fill(config.test_ar, data),
        test_en: fill(config.test_en, data),
        mistakes: fill(config.mistakes, data),
        troubleshoot_ar: fill(config.troubleshoot_ar, data),
        troubleshoot_en: fill(config.troubleshoot_en, data),
        scenario: fill(config.scenario, data),
        reference_intro_ar: fill(config.reference_intro_ar, data),
        reference_intro_en: fill(config.reference_intro_en, data),
        reference_items: fill(config.reference_items || DEFAULT_REFERENCE_ITEMS, data),
        quiz_correct: fill(config.quiz_correct, data)
      };
    }
  };
}

const RULES = [
  createRule({
    id: "bacnet",
    name: "BACnet building automation protocol",
    match: /\bbacnet\b/i,
    domain: "an open building automation communication protocol",
    visual: {
      visualType: "protocol-topology",
      labels: ["BMS Server", "BACnet/IP or MS/TP", "Controller / Device", "Objects, Alarms, Trends"],
      description: "BACnet communication from supervisory software through the network to controllers and exposed objects."
    },
    hero_ar: "{cleanTitle} هو بروتوكول تواصل في أنظمة BMS/BAS يربط السيرفرات والـ controllers والـ field devices عن طريق BACnet objects مثل: Analog Input, Binary Output, Trend Log.",
    hero_en: "{cleanTitle} is a building automation protocol used to expose controller data as BACnet objects so BMS software, gateways, and field controllers can exchange values, alarms, schedules, and trends.",
    definition_ar: "{cleanTitle} ليس كابل أو جهاز منفرد؛ هو طريقة منظمة لتسمية وقراءة وكتابة نقاط التحكم داخل BMS. أهم ما تراجعه هو device instance، object list، network type، ومن له حق الكتابة على كل point.",
    definition_en: "{cleanTitle} is not a single cable or device. It is a protocol model for naming, reading, and commanding BMS points through device instances, object lists, services, alarms, schedules, and trends.",
    why_ar: "أي خطأ في BACnet device ID أو object naming أو priority array قد يجعل النقطة ظاهرة في الرسومات لكنها لا تعمل أو لا تظهر صح على الـ head-end.",
    why_en: "A wrong device instance, object name, network setting, or priority-array command can make a point look correct on drawings but fail at the BMS workstation.",
    appears_ar: "يظهر في BMS architecture، point schedule، BACnet device list، integration gateway schedule، cause-and-effect للتكييف، وcommissioning trend reports.",
    appears_en: "You meet it in BMS architecture diagrams, point schedules, BACnet device lists, gateway schedules, AHU/control sequences, trend logs, and integration test sheets.",
    examples: [
      "Check that each controller has a unique BACnet device instance before connecting it to the BMS network.",
      "Match Analog Input, Binary Input, Analog Output, and Binary Output objects with the point schedule and naming convention.",
      "For BACnet/IP, verify IP subnet, BBMD or foreign-device settings when devices cross routed networks.",
      "During commissioning, prove read, write, alarm, schedule, and trend behavior from the BMS workstation."
    ],
    architecture_ar: "الـ architecture الصحيحة تبدأ من BMS workstation أو server، ثم BACnet/IP network أو BACnet MS/TP trunk، ثم controllers، ثم objects المعروضة لكل equipment.",
    architecture_en: "A correct BACnet architecture starts with the BMS workstation or server, then the BACnet/IP network or MS/TP trunk, then controllers, then the objects exposed by each equipment item.",
    flow_ar: "الـ flow عادة يكون read/write service من الـ BMS إلى controller object. القراءة تجلب value وstatus، والكتابة تمر عبر priority array ولا يجب أن تكسر sequence of operation.",
    flow_en: "The normal flow is a read/write service between the BMS and a controller object. Reads return value and status; writes pass through the priority array and must respect the sequence of operation.",
    design_ar: "في التصميم، وثق network number، device instance range، object naming convention، required objects، alarm classes، trend requirements، ومنطقة الـ VLAN أو IP subnet.",
    design_en: "In design, document network numbers, device-instance ranges, object naming, required objects, alarm classes, trend requirements, and the VLAN or IP subnet used by BMS.",
    site_ar: "في الموقع، راجع termination على MS/TP، polarity، shield grounding، IP settings، labeling، وأن كل controller مطابق للـ approved point schedule.",
    site_en: "On site, check MS/TP termination, polarity, shield grounding, IP settings, labels, and that each controller matches the approved point schedule.",
    test_ar: "اختبر discovery، قراءة القيم، أوامر start/stop وsetpoint، alarm acknowledgement، trend logging، وفشل الاتصال ثم عودة الاتصال.",
    test_en: "Test discovery, live reads, start/stop and setpoint commands, alarm acknowledgement, trend logging, communication loss, and recovery.",
    mistakes: [
      "Duplicating BACnet device instances on the same network.",
      "Treating every visible object as safe to command without checking priority and sequence logic.",
      "Ignoring BBMD, routing, or VLAN rules when BACnet/IP crosses subnets."
    ],
    troubleshoot_ar: "لو نقطة BACnet لا تظهر، ابدأ من IP أو MS/TP wiring، ثم device instance، ثم object list، ثم firewall/VLAN، ثم صلاحيات الـ BMS وpriority array.",
    troubleshoot_en: "If a BACnet point is missing, start with IP or MS/TP wiring, then device instance, object list, firewall/VLAN rules, BMS permissions, and the priority array.",
    scenario: {
      design: ["BACnet design focus", "Reserve unique device-instance ranges, define object naming, confirm BACnet/IP or MS/TP topology, and include alarm/trend requirements in the point schedule."],
      site: ["BACnet site focus", "Check controller labels, MS/TP polarity and termination, IP settings, network numbers, and gateway wiring before software discovery."],
      test: ["BACnet testing focus", "Prove discovery, read values, commands, alarms, schedules, trends, and recovery after communication loss."]
    },
    reference_intro_ar: "لـ BACnet، لا تعتمد على الاسم فقط. راجع point schedule، device list، BMS network architecture، sequence of operation، وvendor controller manual.",
    reference_intro_en: "For BACnet, use the point schedule, device list, BMS network architecture, sequence of operation, and controller vendor manual.",
    reference_items: [
      "BACnet device instance schedule",
      "BACnet object list and point schedule",
      "BMS network architecture and VLAN/IP plan",
      "Sequence of operation and alarm/trend requirements",
      "Controller vendor BACnet integration manual"
    ],
    quiz_correct: "A BACnet object or device setting that the BMS must discover, read, command, alarm, or trend."
  }),
  createRule({
    id: "modbus",
    name: "Modbus integration protocol",
    match: /\bmodbus\b/i,
    domain: "a register-based integration protocol",
    visual: {
      visualType: "register-map",
      labels: ["Client / Master", "TCP or RS-485", "Server / Slave", "Registers"],
      description: "Modbus polling from a client or master to a device register map."
    },
    hero_ar: "{cleanTitle} هو بروتوكول integration يعتمد على register map. يستخدم كثيرا مع meters، UPS، chillers، generators، وgateways لقراءة قيم أو كتابة commands محددة.",
    hero_en: "{cleanTitle} is a register-based integration protocol used with meters, UPS units, chillers, generators, gateways, and controllers to read values or write limited commands.",
    definition_ar: "الفكرة الأساسية في Modbus هي أن كل قيمة لها address وdata type وscale. بدون register map صحيح، القراءة قد تظهر رقم خاطئ حتى لو الاتصال يعمل.",
    definition_en: "The key idea in Modbus is that every value has an address, data type, byte order, and scaling rule. Without the correct register map, communication may work while the value is wrong.",
    why_ar: "الأخطاء الشائعة تكون في slave ID، baud rate، parity، register offset، endian format، أو multiplier مثل قراءة kW كـ W.",
    why_en: "Typical errors are slave ID, baud rate, parity, register offset, endian format, or scaling, such as reading kW as W.",
    appears_ar: "يظهر في Modbus register map، meter schedules، gateway I/O list، BMS integration schedule، testing sheets، وenergy monitoring reports.",
    appears_en: "You meet it in register maps, meter schedules, gateway I/O lists, BMS integration schedules, test sheets, and energy-monitoring reports.",
    examples: [
      "Confirm whether the device uses Modbus TCP or Modbus RTU before selecting cable, switch port, or converter.",
      "Check slave ID, function code, register address, data type, byte order, and scaling for every value.",
      "For RS-485, verify polarity, termination, biasing, trunk length, and device count.",
      "During testing, compare a live reading with the local device display or calibrated meter."
    ],
    architecture_ar: "الـ architecture تكون client/master يرسل poll إلى server/slave، ثم الجهاز يرد بقيمة register. في RTU يجب احترام bus topology، وفي TCP يجب ضبط IP وport 502.",
    architecture_en: "The architecture is a client or master polling a server or slave, then the device returns register values. RTU needs a bus topology; TCP uses IP addressing and port 502.",
    flow_ar: "الـ flow ليس event-based غالبا؛ هو polling. لذلك poll rate مهم حتى لا يضغط على bus أو يعطي data قديمة.",
    flow_en: "The flow is usually polling, not event-based. Poll rate matters because aggressive polling can overload the bus and slow polling can make data stale.",
    design_ar: "في التصميم، اطلب register map مبكر، وحدد protocol type، converter/gateway، scan rate، required values، units، scaling، وwrite permissions.",
    design_en: "In design, request the register map early and define protocol type, converter/gateway, scan rate, required values, units, scaling, and write permissions.",
    site_ar: "في الموقع، تحقق من RS-485 polarity وtermination أو TCP IP settings، ثم طابق كل slave ID مع label والجهاز الحقيقي.",
    site_en: "On site, verify RS-485 polarity and termination or TCP/IP settings, then match each slave ID with the real device label.",
    test_ar: "اختبر read registers، scaling، communication loss، timeout، exception responses، وأي write command مسموح فقط بعد موافقة sequence/control logic.",
    test_en: "Test register reads, scaling, communication loss, timeouts, exception responses, and any permitted write command only after control logic approval.",
    mistakes: [
      "Using the wrong register offset, especially 40001-style documentation versus zero-based addresses.",
      "Forgetting data type, byte order, or scaling.",
      "Writing to registers that should be read-only or not approved for remote command."
    ],
    troubleshoot_ar: "لو القراءة غلط، افصل بين مشكلتين: communication online أولا، ثم صحة address/data type/scale ثانيا. لا تعتبر online status دليلا أن القيمة صحيحة.",
    troubleshoot_en: "If the reading is wrong, separate communication status from data correctness. Online status does not prove address, data type, or scaling are correct.",
    scenario: {
      design: ["Modbus design focus", "Collect the register map, confirm TCP or RTU, define scan rate and scaling, and decide which registers are read-only or commandable."],
      site: ["Modbus site focus", "Check slave IDs, RS-485 polarity/termination or IP settings, gateway labels, and device addresses against the integration schedule."],
      test: ["Modbus testing focus", "Compare live register values with the local device display and record units, scale, timeout behavior, and exception responses."]
    },
    reference_intro_ar: "لـ Modbus، أهم مرجع هو register map الصادر من المورد مع integration schedule المعتمد.",
    reference_intro_en: "For Modbus, the main reference is the vendor register map together with the approved integration schedule.",
    reference_items: [
      "Vendor Modbus register map",
      "Integration schedule and point list",
      "RS-485 wiring or TCP/IP network diagram",
      "Gateway configuration backup",
      "Commissioning readings compared with local display"
    ],
    quiz_correct: "A register address, data type, unit, and scaling rule that the integration client must poll correctly."
  }),
  createRule({
    id: "poe",
    name: "Power over Ethernet",
    match: /\bpoe|power over ethernet\b/i,
    domain: "network power delivery over copper cabling",
    visual: {
      visualType: "power-budget",
      labels: ["PoE Switch / Injector", "Copper Link", "Powered Device", "Power Budget"],
      description: "Power and data delivery from PSE to powered device with cable-loss and budget checks."
    },
    hero_ar: "{cleanTitle} يعني نقل data وDC power على نفس Ethernet cable لتغذية devices مثل cameras، access points، readers، intercoms، وIoT sensors.",
    hero_en: "{cleanTitle} delivers Ethernet data and DC power on the same copper cable to devices such as cameras, wireless access points, readers, intercoms, and sensors.",
    definition_ar: "في PoE يوجد PSE مثل switch أو injector، وPD مثل camera أو AP. التصميم لا يكتفي بعدد ports؛ يجب حساب per-port class، total budget، cable loss، وUPS runtime.",
    definition_en: "PoE has a PSE, such as a switch or injector, and a PD, such as a camera or access point. Design must check per-port class, total power budget, cable loss, and UPS runtime.",
    why_ar: "لو power budget غير كاف، الأجهزة قد تعمل أثناء الاختبار ثم تفصل عند تشغيل IR أو heater أو PTZ أو peak load.",
    why_en: "If the power budget is weak, devices may pass a basic test but fail when IR, heaters, PTZ motors, or peak loads turn on.",
    appears_ar: "يظهر في network switch schedule، CCTV/AP/reader load list، rack power calculation، UPS sizing، cable schedule، وcommissioning PoE load test.",
    appears_en: "You meet it in switch schedules, CCTV/AP/reader load lists, rack power calculations, UPS sizing, cable schedules, and PoE load-test reports.",
    examples: [
      "Check the device maximum wattage, not only typical consumption.",
      "Confirm the PoE standard/class supported by both switch port and powered device.",
      "Add total switch power budget and UPS runtime, especially for cameras with IR or heaters.",
      "Verify copper cable category, length, bundle heat rise, and patching quality."
    ],
    architecture_ar: "الـ architecture يبدأ من PoE switch أو injector، يمر عبر patch panel وcopper link، ثم PD. أي patch أو cable رديء يزيد voltage drop وقد يسبب reboot.",
    architecture_en: "The architecture starts at the PoE switch or injector, passes through patch panels and copper links, then reaches the powered device. Poor patching or cable quality increases voltage drop and can cause reboots.",
    flow_ar: "الـ flow يجمع data packets مع DC power negotiation. الجهاز يطلب class أو power level، والـ switch يسمح أو يرفض حسب budget والسياسة.",
    flow_en: "The flow combines data packets with DC power negotiation. The device requests a class or power level, and the switch grants or limits it based on budget and policy.",
    design_ar: "في التصميم، احسب max load لكل device، reserve لكل switch، UPS autonomy، cable length، وspare capacity للتوسعات.",
    design_en: "In design, calculate maximum load per device, switch reserve, UPS autonomy, cable length, and spare capacity for expansion.",
    site_ar: "في الموقع، راجع label لكل port، patching، cable test، distance، وأن الـ device موصل على port يدعم الـ class المطلوب.",
    site_en: "On site, check port labels, patching, cable test results, distance, and that the device is on a port supporting the required class.",
    test_ar: "اختبر power draw، link speed، reboot under load، IR/night mode، alarm load، وUPS runtime عند فصل mains.",
    test_en: "Test power draw, link speed, reboot under load, IR/night mode, alarm load, and UPS runtime during mains failure.",
    mistakes: [
      "Counting ports but forgetting the shared switch power budget.",
      "Using typical wattage instead of maximum wattage.",
      "Ignoring distance, patch panels, poor termination, or cable-bundle heat."
    ],
    troubleshoot_ar: "لو device يعيد تشغيل نفسه، راجع switch budget، negotiated class، cable length، patching، firmware logs، وحالة load مثل IR أو heater.",
    troubleshoot_en: "If a device reboots, check switch budget, negotiated class, cable length, patching, logs, and peak loads such as IR or heaters.",
    scenario: {
      design: ["PoE design focus", "Calculate maximum device wattage, switch power budget, UPS runtime, cable length, and spare capacity."],
      site: ["PoE site focus", "Check patching, cable certification, port class support, labels, and actual negotiated power."],
      test: ["PoE testing focus", "Record power draw at normal and peak load, link speed, reboot behavior, and UPS-backed runtime."]
    },
    reference_intro_ar: "لـ PoE، راجع datasheet للـ powered device، switch power budget، cable test، وUPS calculation.",
    reference_intro_en: "For PoE, use the powered-device datasheet, switch power budget, cable test results, and UPS calculation.",
    reference_items: [
      "Powered-device maximum wattage datasheet",
      "PoE switch budget and per-port class table",
      "Cable certification results",
      "UPS autonomy calculation",
      "Commissioning PoE load test"
    ],
    quiz_correct: "The maximum device load, supported PoE class, cable path, and available switch power budget."
  }),
  createRule({
    id: "vlan",
    name: "Network segmentation and VLAN design",
    match: /\bvlan|802\.1q|segmentation|inter-vlan\b/i,
    domain: "Layer 2 network segmentation",
    visual: {
      visualType: "segmentation-diagram",
      labels: ["Core / Firewall", "Tagged Trunk", "Access Switch", "System VLANs"],
      description: "VLAN separation between ELV systems, management services, and routed access rules."
    },
    hero_ar: "{cleanTitle} يستخدم لعزل traffic بين أنظمة مثل CCTV وBMS وAccess Control وGuest Wi-Fi مع التحكم في من يسمح له بالوصول لمن.",
    hero_en: "{cleanTitle} separates network traffic between systems such as CCTV, BMS, access control, servers, management, and guest networks while controlling who may reach whom.",
    definition_ar: "VLAN ليس اسم فقط؛ هو رقم، subnet، gateway، trunk/access ports، وfirewall rules. أي خطأ في tagging أو gateway قد يعزل الجهاز أو يفتح وصول غير مطلوب.",
    definition_en: "A VLAN is not only a name. It includes VLAN ID, subnet, gateway, trunk/access ports, and firewall rules. Wrong tagging or routing can isolate devices or expose systems.",
    why_ar: "العزل الصحيح يقلل broadcast، يسهل troubleshooting، ويمنع خلط security systems مع شبكات عامة أو غير مصرح بها.",
    why_en: "Correct segmentation reduces broadcast noise, improves troubleshooting, and prevents security systems from mixing with public or unauthorized networks.",
    appears_ar: "يظهر في network architecture، VLAN matrix، switch port schedule، firewall rules، IP plan، cybersecurity review، وcommissioning isolation test.",
    appears_en: "You meet it in network architecture, VLAN matrices, switch-port schedules, firewall rules, IP plans, cybersecurity reviews, and isolation tests.",
    examples: [
      "Put CCTV cameras, NVR/VMS servers, access-control controllers, BMS controllers, and management interfaces in controlled segments.",
      "Define which VLANs may talk to servers, DNS/NTP, head-end software, and vendor remote-support paths.",
      "Check trunk allowed VLANs and access-port VLAN assignment before blaming device configuration.",
      "Test inter-VLAN rules from a real endpoint, not only from the firewall console."
    ],
    architecture_ar: "الـ architecture يربط switch access ports للأجهزة، trunks بين switches، gateway/firewall للـ routing، وACL rules للتحكم في traffic.",
    architecture_en: "The architecture links access ports for devices, trunks between switches, gateways or firewalls for routing, and ACL rules for traffic control.",
    flow_ar: "الـ flow داخل نفس VLAN يبقى Layer 2 غالبا، أما بين VLANs فيمر عبر gateway/firewall حيث تطبق security rules وlogging.",
    flow_en: "Traffic inside one VLAN usually stays Layer 2; traffic between VLANs passes through a gateway or firewall where security rules and logging apply.",
    design_ar: "في التصميم، وثق VLAN ID، name، subnet، gateway، DHCP/static policy، trunk list، allowed services، وowner لكل rule.",
    design_en: "In design, document VLAN ID, name, subnet, gateway, DHCP/static policy, trunk list, allowed services, and owner for each rule.",
    site_ar: "في الموقع، طابق switch port مع device label، access/trunk mode، allowed VLANs، IP/subnet، وdefault gateway.",
    site_en: "On site, match switch port to device label, access/trunk mode, allowed VLANs, IP/subnet, and default gateway.",
    test_ar: "اختبر ping/port access المسموح، منع الوصول غير المسموح، DNS/NTP، server reachability، وlogging للأحداث المهمة.",
    test_en: "Test allowed ping/ports, blocked paths, DNS/NTP, server reachability, and logging for important events.",
    mistakes: [
      "Leaving ELV devices on the default VLAN.",
      "Allowing all VLANs on every trunk without reason.",
      "Testing only connectivity and forgetting denied traffic."
    ],
    troubleshoot_ar: "لو جهاز لا يصل للسيرفر، راجع port VLAN، trunk allowed list، IP/subnet، gateway، firewall rule، ثم server service نفسه.",
    troubleshoot_en: "If a device cannot reach a server, check port VLAN, trunk allowed list, IP/subnet, gateway, firewall rule, then the server service.",
    scenario: {
      design: ["VLAN design focus", "Define VLAN IDs, subnets, gateways, trunk rules, allowed services, and the firewall matrix before IP addressing devices."],
      site: ["VLAN site focus", "Check switch-port mode, tagging, allowed VLANs, patching, endpoint IP settings, and gateway reachability."],
      test: ["VLAN testing focus", "Prove allowed traffic works and blocked traffic is actually blocked, then record evidence from real endpoints."]
    },
    reference_intro_ar: "لـ VLAN، أهم المراجع هي IP plan، VLAN matrix، firewall rules، وswitch port schedule.",
    reference_intro_en: "For VLAN work, use the IP plan, VLAN matrix, firewall rules, and switch-port schedule.",
    reference_items: [
      "VLAN and IP addressing plan",
      "Switch-port and trunk schedule",
      "Firewall or ACL rule matrix",
      "Cybersecurity segmentation review",
      "Isolation and reachability test report"
    ],
    quiz_correct: "The VLAN ID, subnet, gateway, switch-port mode, and permitted traffic rules for the device or system."
  }),
  createRule({
    id: "cctv",
    name: "CCTV and video surveillance",
    match: /\b(cctv|camera|vms|nvr|lens|fov|video|surveillance|onvif|ptz|recording|playback)\b/i,
    domain: "video surveillance capture, recording, and monitoring",
    visual: {
      visualType: "video-system-architecture",
      labels: ["Camera", "PoE / Network", "NVR / VMS", "Monitor / Archive"],
      description: "Video path from camera capture through network transport, recording, monitoring, and evidence export."
    },
    hero_ar: "{cleanTitle} جزء من منظومة surveillance تربط camera field of view، الشبكة، التسجيل، المراقبة، وexport evidence.",
    hero_en: "{cleanTitle} belongs to the surveillance chain that connects field of view, camera settings, network transport, recording, monitoring, and evidence export.",
    definition_ar: "افهم {cleanTitle} من خلال الصورة المطلوبة: ماذا يجب أن يرى النظام، بأي جودة، لمدة تسجيل كم، ومن له صلاحية المشاهدة أو التصدير.",
    definition_en: "Understand {cleanTitle} through the required image: what must be seen, at what quality, for how long, and who may view or export evidence.",
    why_ar: "خطأ صغير في FOV أو bitrate أو storage أو time sync قد يجعل التسجيل موجودا لكنه غير مفيد عند حادث حقيقي.",
    why_en: "A small error in field of view, bitrate, storage, or time sync can make video exist but fail as usable evidence.",
    appears_ar: "يظهر في camera schedule، layout، FOV drawings، network/storage calculation، VMS configuration، وcommissioning playback/export tests.",
    appears_en: "You meet it in camera schedules, layouts, FOV drawings, network and storage calculations, VMS configuration, and playback/export tests.",
    examples: [
      "Match lens, mounting height, view angle, and WDR/IR requirements to the scene.",
      "Check bitrate, resolution, frame rate, retention days, and storage redundancy.",
      "Confirm ONVIF/VMS compatibility before procurement.",
      "During commissioning, prove live view, recording, playback, export, time sync, and user permissions."
    ],
    architecture_ar: "الـ architecture يبدأ من camera، ثم PoE/network switch، ثم NVR/VMS/storage، ثم monitoring clients وarchive/export.",
    architecture_en: "The architecture starts at the camera, then PoE/network switches, then NVR/VMS/storage, then monitoring clients and archive/export tools.",
    flow_ar: "الـ flow هو video stream مع control/metadata. PTZ وanalytics وevents تحتاج latency وpermissions مختلفة عن مشاهدة live فقط.",
    flow_en: "The flow is video stream plus control and metadata. PTZ, analytics, and events need different latency and permissions from simple live viewing.",
    design_ar: "في التصميم، حدد هدف المشاهدة، coverage، lens، resolution، retention، network bandwidth، storage، cybersecurity، وintegration requirements.",
    design_en: "In design, define viewing objective, coverage, lens, resolution, retention, bandwidth, storage, cybersecurity, and integration requirements.",
    site_ar: "في الموقع، راجع mounting, aiming, focus, cable test, PoE budget, weather rating, labeling, and cleaning access.",
    site_en: "On site, check mounting, aiming, focus, cable test, PoE budget, weather rating, labeling, and cleaning access.",
    test_ar: "اختبر day/night، IR reflection، WDR، motion/analytics، recording، playback، export، watermark/time، وpermissions.",
    test_en: "Test day/night performance, IR reflection, WDR, motion/analytics, recording, playback, export, watermark/time, and permissions.",
    mistakes: [
      "Designing by camera count instead of required scene detail.",
      "Forgetting bitrate, retention, and storage sizing.",
      "Commissioning live view only without playback and export evidence."
    ],
    troubleshoot_ar: "لو الصورة ضعيفة، افصل بين lens/FOV، lighting، focus، bitrate، network loss، storage load، وVMS display settings.",
    troubleshoot_en: "If image quality is poor, separate lens/FOV, lighting, focus, bitrate, network loss, storage load, and VMS display settings.",
    scenario: {
      design: ["CCTV design focus", "Define scene objective, FOV, resolution, retention, network bandwidth, storage, and cybersecurity permissions."],
      site: ["CCTV site focus", "Aim and focus cameras, verify PoE and cable tests, check labels, weather protection, and lighting conditions."],
      test: ["CCTV testing focus", "Record live view, playback, export, day/night, time sync, analytics, and user-permission evidence."]
    },
    reference_intro_ar: "لـ CCTV، استخدم camera schedule، FOV drawings، storage calculation، VMS configuration، وtest records.",
    reference_intro_en: "For CCTV, use the camera schedule, FOV drawings, storage calculation, VMS configuration, and test records.",
    quiz_correct: "The required scene detail, camera settings, network path, recording retention, and evidence export behavior."
  }),
  createRule({
    id: "access-control",
    name: "Access control and door security",
    match: /\b(access control|reader|credential|maglock|magnetic lock|strike|rex|door contact|osdp|wiegand|anti-passback|turnstile|door)\b/i,
    domain: "controlled door access and monitoring",
    visual: {
      visualType: "door-control-wiring",
      labels: ["Reader", "Door Controller", "Lock / REX", "Door Status / Alarm"],
      description: "Door decision path from credential input to controller logic, lock output, and status feedback."
    },
    hero_ar: "{cleanTitle} يرتبط بقرار فتح الباب: reader أو credential يدخل الطلب، controller يطبق rules، ثم lock يعمل مع REX وdoor contact وalarm monitoring.",
    hero_en: "{cleanTitle} is part of the door decision chain: a reader or credential requests access, the controller applies rules, then the lock, REX, door contact, and alarms report the result.",
    definition_ar: "لا تقرأ {cleanTitle} كقطعة منفصلة. الباب نظام صغير فيه safety, security, power, wiring, software permissions, and fail-safe/fail-secure behavior.",
    definition_en: "Do not treat {cleanTitle} as an isolated part. A door is a small system combining safety, security, power, wiring, permissions, and fail-safe or fail-secure behavior.",
    why_ar: "خطأ في lock type أو fire interface أو REX قد يمنع الخروج الآمن أو يفتح بابا بدون صلاحية.",
    why_en: "A wrong lock type, fire interface, or REX setup can block safe egress or unlock a door without authorization.",
    appears_ar: "يظهر في door schedule، riser، controller I/O list، cable schedule، access levels، fire alarm interface، وSAT door test.",
    appears_en: "You meet it in door schedules, risers, controller I/O lists, cable schedules, access levels, fire-alarm interfaces, and SAT door tests.",
    examples: [
      "Check fail-safe/fail-secure behavior against life-safety requirements.",
      "Match reader protocol such as OSDP or Wiegand with the controller.",
      "Confirm lock power, door contact, REX, emergency release, and fire-alarm release wiring.",
      "During testing, prove valid access, denied access, forced door, door held open, and fire release."
    ],
    architecture_ar: "الـ architecture يشمل reader، controller، lock power، door contact، REX، emergency release، fire interface، وmanagement software.",
    architecture_en: "The architecture includes reader, controller, lock power, door contact, REX, emergency release, fire interface, and management software.",
    flow_ar: "الـ flow يبدأ credential، ثم decision في controller/software، ثم lock output، ثم feedback من door contact وevents.",
    flow_en: "The flow starts with the credential, then the controller or software decision, then lock output, then feedback from door contact and events.",
    design_ar: "في التصميم، وثق door mode، hardware type، cable cores، power, battery backup، access levels، fire release، وegress path.",
    design_en: "In design, document door mode, hardware type, cable cores, power, battery backup, access levels, fire release, and egress path.",
    site_ar: "في الموقع، راجع alignment، lock voltage، polarity، reader wiring، enclosure tamper، labels، وfire/egress interfaces.",
    site_en: "On site, check alignment, lock voltage, polarity, reader wiring, enclosure tamper, labels, and fire/egress interfaces.",
    test_ar: "اختبر valid/invalid credential، REX، forced/held open، fire release، battery backup، event logging، وanti-passback إن وجد.",
    test_en: "Test valid and invalid credentials, REX, forced/held-open alarms, fire release, battery backup, event logging, and anti-passback when used.",
    mistakes: [
      "Selecting lock behavior without coordinating life safety.",
      "Testing only card unlock and missing forced-door or fire-release behavior.",
      "Mixing OSDP/Wiegand wiring or shielding requirements."
    ],
    troubleshoot_ar: "لو الباب لا يفتح أو يفتح عشوائيا، افحص credential، controller output، lock power، REX، contact state، fire input، وsoftware schedule.",
    troubleshoot_en: "If a door will not unlock or unlocks unexpectedly, check credential, controller output, lock power, REX, contact state, fire input, and software schedule.",
    scenario: {
      design: ["Access design focus", "Coordinate door schedule, lock behavior, egress, fire release, reader protocol, power backup, and access levels."],
      site: ["Access site focus", "Verify reader wiring, lock alignment, power polarity, door contact state, REX location, labels, and enclosure tamper."],
      test: ["Access testing focus", "Prove valid/denied access, REX, forced/held-open alarms, fire release, battery backup, and event logs."]
    },
    reference_intro_ar: "لـ Access Control، راجع door schedule، hardware set، wiring details، access levels، وlife-safety approvals.",
    reference_intro_en: "For access control, use the door schedule, hardware set, wiring details, access levels, and life-safety approvals.",
    quiz_correct: "The reader, controller, lock, REX, door contact, fire release, power backup, and access rule for the door."
  }),
  createRule({
    id: "fire-alarm",
    name: "Fire alarm and life safety",
    match: /\b(fire|facp|detector|smoke|heat|sounder|strobe|nac|loop isolator|cause-and-effect|sprinkler|voice evacuation|evacuation)\b/i,
    domain: "life-safety detection, notification, and control",
    visual: {
      visualType: "life-safety-loop",
      labels: ["FACP", "Addressable Loop / NAC", "Devices", "Cause & Effect"],
      description: "Life-safety control path from panel to detection, notification, interfaces, and cause-and-effect actions."
    },
    hero_ar: "{cleanTitle} جزء من life-safety system. يجب فهمه من panel، loops، devices، notification، interfaces، وcause-and-effect وليس من اسم الجهاز فقط.",
    hero_en: "{cleanTitle} belongs to a life-safety system and must be understood through the panel, loops, devices, notification circuits, interfaces, and cause-and-effect matrix.",
    definition_ar: "في fire alarm، الأولوية هي reliable detection، إنذار واضح، control interfaces صحيحة، وتوافق كامل مع code والسلطة المختصة.",
    definition_en: "In fire alarm work, the priority is reliable detection, clear notification, correct control interfaces, and full compliance with code and authority requirements.",
    why_ar: "أي خطأ في zoning أو loop loading أو cause-and-effect قد يؤخر إنذار أو يشغل equipment بطريقة غير آمنة.",
    why_en: "A mistake in zoning, loop loading, or cause-and-effect can delay alarm response or operate equipment unsafely.",
    appears_ar: "يظهر في fire alarm layout، riser، cause-and-effect matrix، device schedule، battery calculation، voltage drop، وintegrated systems test.",
    appears_en: "You meet it in layouts, risers, cause-and-effect matrices, device schedules, battery calculations, voltage drop, and integrated systems testing.",
    examples: [
      "Match detector type and spacing to the room risk and code.",
      "Check loop isolators, address labels, sounder/strobe coverage, and interface modules.",
      "Coordinate elevators, HVAC shutdown, access-door release, smoke control, and BMS monitoring.",
      "During testing, prove alarm, fault, disablement, supervisory signals, and cause-and-effect actions."
    ],
    architecture_ar: "الـ architecture تبدأ من FACP، ثم addressable loops وNACs، ثم detectors/modules/sounders، ثم interfaces مع HVAC, access, elevator, BMS.",
    architecture_en: "The architecture starts with the FACP, then addressable loops and NACs, then detectors, modules, sounders/strobes, and interfaces with HVAC, access, elevators, and BMS.",
    flow_ar: "الـ flow في alarm event يبدأ detection، ثم panel logic، ثم notification/control outputs، ثم monitoring والتوثيق.",
    flow_en: "The event flow starts with detection, then panel logic, then notification and control outputs, then monitoring and documentation.",
    design_ar: "في التصميم، راجع code spacing، zoning، loop capacity، isolator placement، battery/voltage drop، interfaces، وcause-and-effect.",
    design_en: "In design, check code spacing, zoning, loop capacity, isolator placement, battery and voltage drop, interfaces, and cause-and-effect.",
    site_ar: "في الموقع، تحقق من address labels، device location، cable fire rating، loop continuity، polarity، end-of-line where used، وinterface wiring.",
    site_en: "On site, verify address labels, device locations, fire-rated cable, loop continuity, polarity, end-of-line devices where used, and interface wiring.",
    test_ar: "اختبر alarm/fault/supervisory، sound level، visual coverage، cause-and-effect، battery، communication، وreset/disable procedures.",
    test_en: "Test alarm, fault, supervisory, sound level, visual coverage, cause-and-effect, battery, communication, and reset/disable procedures.",
    mistakes: [
      "Treating fire alarm as a normal ELV system without authority/code control.",
      "Testing devices without proving cause-and-effect outputs.",
      "Changing addresses or zones without updating as-built records."
    ],
    troubleshoot_ar: "لو ظهر fault، افحص loop status، address duplication، wiring continuity، isolator state، power/battery، ثم device أو module configuration.",
    troubleshoot_en: "If a fault appears, check loop status, duplicate addresses, wiring continuity, isolator state, power/battery, then device or module configuration.",
    scenario: {
      design: ["Fire alarm design focus", "Coordinate code spacing, zoning, loop loading, battery/voltage drop, interfaces, and cause-and-effect matrix."],
      site: ["Fire alarm site focus", "Check address labels, cable fire rating, device placement, loop continuity, polarity, and interface wiring."],
      test: ["Fire alarm testing focus", "Prove alarm, fault, supervisory, notification, cause-and-effect, battery, and reset behavior with signed evidence."]
    },
    reference_intro_ar: "لـ Fire Alarm، ارجع للكود، approved drawings، cause-and-effect matrix، battery/voltage calculations، وتعليمات المورد.",
    reference_intro_en: "For fire alarm work, use codes, approved drawings, cause-and-effect matrix, battery/voltage calculations, and vendor manuals.",
    quiz_correct: "The panel logic, device address, loop/NAC capacity, code requirement, and cause-and-effect action."
  }),
  createRule({
    id: "bms",
    name: "BMS/BAS control systems",
    match: /\b(bms|bas|ibms|ddc|lcp|ahu|hmi|actuator|trend|meter|sequence|point|sensor output|control signal)\b/i,
    domain: "building automation sensing, control, and monitoring",
    visual: {
      visualType: "control-loop",
      labels: ["Sensor / Point", "DDC Controller", "Actuator / Equipment", "HMI / Trend"],
      description: "Closed-loop building automation path from field sensing to controller logic, action, and supervisory feedback."
    },
    hero_ar: "{cleanTitle} جزء من BMS/BAS حيث تتحول field values إلى control decisions ثم commands وtrends وalarms.",
    hero_en: "{cleanTitle} belongs to BMS/BAS control where field values become controller decisions, commands, alarms, schedules, and trends.",
    definition_ar: "اقرأ {cleanTitle} من خلال point type، sequence of operation، controller I/O، protocol، وexpected value أو action.",
    definition_en: "Read {cleanTitle} through point type, sequence of operation, controller I/O, protocol, and the expected value or action.",
    why_ar: "الخطأ في point mapping أو scaling أو sequence قد يشغل equipment خطأ أو يخفي alarm مهم.",
    why_en: "Wrong point mapping, scaling, or sequence logic can operate equipment incorrectly or hide an important alarm.",
    appears_ar: "يظهر في BMS point schedule، control schematic، sequence of operation، controller panel drawing، graphics، trends، وcommissioning sheets.",
    appears_en: "You meet it in BMS point schedules, control schematics, sequences of operation, controller panel drawings, graphics, trends, and commissioning sheets.",
    examples: [
      "Match each field sensor or actuator to controller I/O type and range.",
      "Check scaling, units, alarm limits, trend intervals, and graphic naming.",
      "Coordinate BMS interfaces with fire alarm, chillers, meters, VFDs, and access control.",
      "During testing, prove automatic logic, manual override, alarm, trend, and failure mode."
    ],
    architecture_ar: "الـ architecture يشمل field device، DDC/controller، network/protocol، supervisory workstation، graphics، trends، وreports.",
    architecture_en: "The architecture includes field device, DDC/controller, network/protocol, supervisory workstation, graphics, trends, and reports.",
    flow_ar: "الـ flow يبدأ sensor value، ثم controller logic، ثم actuator command، ثم feedback/trend على HMI.",
    flow_en: "The flow starts with sensor value, then controller logic, then actuator command, then feedback and trend at the HMI.",
    design_ar: "في التصميم، وثق point list، I/O type، range، units، alarm limits، trend interval، graphics، وsequence requirements.",
    design_en: "In design, document point list, I/O type, range, units, alarm limits, trend interval, graphics, and sequence requirements.",
    site_ar: "في الموقع، راجع termination، polarity، shielding، panel labels، sensor location، actuator direction، وcontroller addressing.",
    site_en: "On site, check termination, polarity, shielding, panel labels, sensor location, actuator direction, and controller addressing.",
    test_ar: "اختبر calibration، manual override، automatic sequence، alarm limits، trend logging، communication loss، وhandover graphics.",
    test_en: "Test calibration, manual override, automatic sequence, alarm limits, trend logging, communication loss, and handover graphics.",
    mistakes: [
      "Mapping the wrong physical point to a graphic or trend.",
      "Forgetting scaling and units.",
      "Commissioning graphics without proving the actual field device."
    ],
    troubleshoot_ar: "لو reading غير منطقية، افحص sensor range، wiring، controller input type، scaling، units، graphic binding، وcalibration.",
    troubleshoot_en: "If a reading is unrealistic, check sensor range, wiring, controller input type, scaling, units, graphic binding, and calibration.",
    scenario: {
      design: ["BMS design focus", "Define point list, I/O type, range, sequence, alarm limits, trends, graphics, and protocol integration."],
      site: ["BMS site focus", "Verify field wiring, panel labels, sensor placement, actuator direction, controller addressing, and shielding."],
      test: ["BMS testing focus", "Prove calibrated value, automatic sequence, manual command, alarm, trend, failure mode, and graphic feedback."]
    },
    reference_intro_ar: "لـ BMS، راجع point schedule، sequence of operation، controller drawings، protocol settings، وtrend reports.",
    reference_intro_en: "For BMS, use the point schedule, sequence of operation, controller drawings, protocol settings, and trend reports.",
    quiz_correct: "The field point, controller logic, command output, feedback value, alarm, and trend behavior."
  }),
  createRule({
    id: "networking",
    name: "ELV networking and IP services",
    match: /\b(network|switch|router|dhcp|dns|nat|firewall|lan|wan|ip address|subnet|gateway|server|storage|ntp|snmp|tcp|udp|port)\b/i,
    domain: "network connectivity and services",
    visual: {
      visualType: "network-topology",
      labels: ["Endpoint", "Access Switch", "Core / Firewall", "Services"],
      description: "Network path from ELV endpoint to switching, routing, and shared services."
    },
    hero_ar: "{cleanTitle} يرتبط بتوصيل ELV devices بالشبكة والخدمات مثل addressing، routing، security، monitoring، وtime synchronization.",
    hero_en: "{cleanTitle} connects ELV devices to network services such as addressing, routing, security, monitoring, storage, and time synchronization.",
    definition_ar: "اقرأ {cleanTitle} من خلال endpoint، switch port، IP/subnet/gateway، service port، security rule، وmonitoring requirement.",
    definition_en: "Read {cleanTitle} through endpoint, switch port, IP/subnet/gateway, service port, security rule, and monitoring requirement.",
    why_ar: "أخطاء الشبكة قد تظهر كعطل في camera أو controller مع أن السبب الحقيقي IP، VLAN، firewall، DNS، أو NTP.",
    why_en: "Network mistakes can look like camera or controller faults while the real cause is IP, VLAN, firewall, DNS, or NTP.",
    appears_ar: "يظهر في network architecture، IP plan، switch schedule، rack layout، firewall matrix، server/storage design، وcommissioning reachability tests.",
    appears_en: "You meet it in network architecture, IP plans, switch schedules, rack layouts, firewall matrices, server/storage design, and reachability tests.",
    examples: [
      "Confirm IP address, subnet mask, gateway, DNS, NTP, and service ports.",
      "Match switch port speed, PoE, VLAN, and trunk/access settings.",
      "Coordinate firewall rules before integrating VMS, BMS, access, and servers.",
      "Use logs and packet-path checks before replacing hardware."
    ],
    architecture_ar: "الـ architecture يربط endpoint بالـ access switch، ثم core/firewall، ثم services مثل server، storage، NTP، DNS، وmanagement.",
    architecture_en: "The architecture links endpoint to access switch, then core/firewall, then services such as server, storage, NTP, DNS, and management.",
    flow_ar: "الـ flow يعتمد على source/destination IP، protocol/port، VLAN، routing، وfirewall policy.",
    flow_en: "The flow depends on source and destination IP, protocol/port, VLAN, routing, and firewall policy.",
    design_ar: "في التصميم، وثق addressing، VLANs، bandwidth، latency، services، security، redundancy، monitoring، وrack/power requirements.",
    design_en: "In design, document addressing, VLANs, bandwidth, latency, services, security, redundancy, monitoring, and rack/power requirements.",
    site_ar: "في الموقع، راجع patching، port labels، link speed، PoE، IP settings، gateway، time sync، وbasic reachability.",
    site_en: "On site, check patching, port labels, link speed, PoE, IP settings, gateway, time sync, and basic reachability.",
    test_ar: "اختبر ping/port access، blocked traffic، bandwidth where needed، NTP، failover، logs، وsystem application connectivity.",
    test_en: "Test ping and port access, blocked traffic, bandwidth where needed, NTP, failover, logs, and application connectivity.",
    mistakes: [
      "Changing IP settings without updating the IP plan.",
      "Testing ping only and ignoring application ports.",
      "Mixing management and system traffic without segmentation."
    ],
    troubleshoot_ar: "لو الاتصال فشل، اتبع path: device IP، switch port، VLAN، gateway، firewall، server port، ثم application/service.",
    troubleshoot_en: "If communication fails, follow the path: device IP, switch port, VLAN, gateway, firewall, server port, then application/service.",
    scenario: {
      design: ["Network design focus", "Define IP plan, VLANs, bandwidth, services, firewall rules, monitoring, redundancy, and rack/power requirements."],
      site: ["Network site focus", "Check patching, switch port, link speed, PoE, VLAN, gateway, DNS/NTP, and labels."],
      test: ["Network testing focus", "Prove allowed services, blocked paths, time sync, logs, failover, and application connectivity."]
    },
    reference_intro_ar: "للشبكات، استخدم IP plan، VLAN/firewall matrix، switch schedule، وapplication port requirements.",
    reference_intro_en: "For networking, use the IP plan, VLAN/firewall matrix, switch schedule, and application port requirements.",
    quiz_correct: "The endpoint IP settings, switch/VLAN path, allowed ports, time services, and server reachability."
  }),
  createRule({
    id: "structured-cabling",
    name: "Structured cabling and physical pathways",
    match: /\b(cable|fiber|odf|patch panel|rack|telecom room|outlet|splice|pigtail|patch cord|cat6|cat6a|utp|horizontal cabling|backbone|containment|tray|conduit)\b/i,
    domain: "physical cabling infrastructure",
    visual: {
      visualType: "cable-path",
      labels: ["Rack / TR", "Patch Panel / ODF", "Cable Path", "Outlet / Device"],
      description: "Physical cabling path from rack termination through containment to outlet or device."
    },
    hero_ar: "{cleanTitle} مرتبط بالبنية الفيزيائية التي تحمل data أو signal أو power بين racks وfield devices.",
    hero_en: "{cleanTitle} belongs to the physical infrastructure that carries data, signal, or power between racks and field devices.",
    definition_ar: "قيمته تظهر في route، length، category، fire rating، bend radius، separation، termination، labeling، وtest certification.",
    definition_en: "Its quality depends on route, length, category, fire rating, bend radius, separation, termination, labeling, and test certification.",
    why_ar: "كابل سيئ أو label خاطئ يسبب أعطال تبدو software/network لكنها في الأصل termination أو route أو length.",
    why_en: "A bad cable or wrong label creates faults that look like software or network problems while the root cause is termination, route, or length.",
    appears_ar: "يظهر في cable schedule، containment layouts، rack elevations، patching records، test reports، وas-built drawings.",
    appears_en: "You meet it in cable schedules, containment layouts, rack elevations, patching records, test reports, and as-built drawings.",
    examples: [
      "Check cable category or fiber type against bandwidth and distance.",
      "Keep bend radius, pulling tension, separation, and fire rating within specification.",
      "Label both ends and record patching changes.",
      "Submit copper or fiber test results before handover."
    ],
    architecture_ar: "الـ architecture تبدأ من rack أو TR، ثم patch panel/ODF، ثم pathway، ثم outlet أو field device.",
    architecture_en: "The architecture starts at the rack or TR, then patch panel/ODF, then pathway, then outlet or field device.",
    flow_ar: "الـ flow هنا physical path: أي ضعف في termination أو attenuation أو polarity ينعكس على network أو signal.",
    flow_en: "The flow is the physical path: termination, attenuation, and polarity problems appear as network or signal faults.",
    design_ar: "في التصميم، حدد cable type، route، maximum length، spare capacity، separation، fire rating، labels، وtesting standard.",
    design_en: "In design, define cable type, route, maximum length, spare capacity, separation, fire rating, labels, and testing standard.",
    site_ar: "في الموقع، راجع route، support، bend radius، gland/termination، labeling، dressing، وprotection من damage.",
    site_en: "On site, check route, supports, bend radius, glands/termination, labels, dressing, and protection from damage.",
    test_ar: "اختبر continuity، wiremap، length، loss/attenuation، polarity، OTDR or certification حسب نوع الكابل.",
    test_en: "Test continuity, wiremap, length, loss/attenuation, polarity, OTDR or certification depending on cable type.",
    mistakes: [
      "Installing before finalizing containment and separation.",
      "Accepting cables without certification reports.",
      "Changing patching without updating labels and records."
    ],
    troubleshoot_ar: "لو device offline، ابدأ من patching، link light، cable test، termination، polarity، length، ثم active equipment.",
    troubleshoot_en: "If a device is offline, start with patching, link light, cable test, termination, polarity, length, then active equipment.",
    scenario: {
      design: ["Cabling design focus", "Define cable type, route, length, containment, separation, labeling, spare capacity, and test standard."],
      site: ["Cabling site focus", "Check installed route, support, bend radius, termination, labels, dressing, and protection."],
      test: ["Cabling testing focus", "Submit continuity, wiremap, length, loss, polarity, OTDR, or certification results as required."]
    },
    reference_intro_ar: "للكابلات، راجع cable schedule، route drawings، datasheets، وtest certification.",
    reference_intro_en: "For cabling, use the cable schedule, route drawings, datasheets, and test certification.",
    quiz_correct: "The cable type, route, length, termination, label, and required test result."
  }),
  createRule({
    id: "audio-pa",
    name: "Public address and audio systems",
    match: /\b(pa |public address|sound|speaker|amplifier|microphone|dsp|voice alarm|100v|spl|audio|mixer)\b/i,
    domain: "audio signal processing and speaker distribution",
    visual: {
      visualType: "audio-signal-flow",
      labels: ["Source / Mic", "DSP / Matrix", "Amplifier", "Speaker Zones"],
      description: "Audio path from source through processing and amplification to speaker zones."
    },
    hero_ar: "{cleanTitle} جزء من audio path يبدأ من source أو microphone، ثم processing/amplification، ثم speaker zones أو voice alarm outputs.",
    hero_en: "{cleanTitle} belongs to the audio path from source or microphone through processing and amplification to speaker zones or voice-alarm outputs.",
    definition_ar: "افهمه من خلال signal level، zone، power، impedance/100V line، SPL، intelligibility، وpriority مثل emergency paging.",
    definition_en: "Understand it through signal level, zone, power, impedance or 100V line, SPL, intelligibility, and priority such as emergency paging.",
    why_ar: "الصوت قد يعمل لكن يكون غير مفهوم بسبب SPL، reverberation، zoning، أو priority configuration.",
    why_en: "Audio may work yet be unusable because of SPL, reverberation, zoning, or priority configuration.",
    appears_ar: "يظهر في speaker layout، amplifier schedule، zone matrix، cable schedule، SPL/STI test، وvoice evacuation cause-and-effect.",
    appears_en: "You meet it in speaker layouts, amplifier schedules, zone matrices, cable schedules, SPL/STI tests, and voice-evacuation cause-and-effect.",
    examples: [
      "Match speaker tap wattage and amplifier capacity with spare headroom.",
      "Coordinate zones with building areas and emergency priorities.",
      "Check microphone, DSP, amplifier, speaker line, and end-of-line monitoring.",
      "During testing, record SPL, intelligibility, zone selection, and priority override."
    ],
    architecture_ar: "الـ architecture تبدأ من source/mic، ثم DSP/matrix، ثم amplifier، ثم speaker circuits/zones.",
    architecture_en: "The architecture starts with source or microphone, then DSP/matrix, then amplifier, then speaker circuits or zones.",
    flow_ar: "الـ flow هو audio signal ثم amplified power. في emergency systems، priority override أهم من تشغيل موسيقى عادية.",
    flow_en: "The flow is audio signal followed by amplified power. In emergency systems, priority override matters more than normal music playback.",
    design_ar: "في التصميم، حدد zones، SPL target، intelligibility، amplifier loading، cable loss، priority، وbackup power.",
    design_en: "In design, define zones, SPL target, intelligibility, amplifier loading, cable loss, priority, and backup power.",
    site_ar: "في الموقع، راجع speaker tap setting، polarity، line isolation، cable route، amplifier rack، وlabels.",
    site_en: "On site, check speaker tap settings, polarity, line isolation, cable route, amplifier rack, and labels.",
    test_ar: "اختبر zone paging، background music، emergency priority، SPL/STI، fault monitoring، وbattery/backup operation.",
    test_en: "Test zone paging, background music, emergency priority, SPL/STI, fault monitoring, and backup operation.",
    mistakes: [
      "Sizing amplifiers without speaker tap totals and headroom.",
      "Testing sound presence without intelligibility.",
      "Ignoring priority and emergency override logic."
    ],
    troubleshoot_ar: "لو zone صوته ضعيف أو مشوش، افحص tap setting، polarity، amplifier channel، cable loss، DSP gain، وspeaker placement.",
    troubleshoot_en: "If a zone is weak or distorted, check tap setting, polarity, amplifier channel, cable loss, DSP gain, and speaker placement.",
    scenario: {
      design: ["Audio design focus", "Define zones, SPL/STI targets, speaker taps, amplifier capacity, priorities, and backup power."],
      site: ["Audio site focus", "Check speaker taps, polarity, line routing, amplifier channels, labels, and rack wiring."],
      test: ["Audio testing focus", "Record SPL/STI, zone selection, priority override, fault monitoring, and backup operation."]
    },
    reference_intro_ar: "للـ PA/Audio، راجع speaker layout، amplifier schedule، zone matrix، وSPL/STI test.",
    reference_intro_en: "For PA/audio, use the speaker layout, amplifier schedule, zone matrix, and SPL/STI test.",
    quiz_correct: "The audio source, zone, amplifier load, speaker circuit, priority, and intelligibility result."
  }),
  createRule({
    id: "media-av",
    name: "MATV, IPTV, RF, and AV distribution",
    match: /\b(matv|smatv|iptv|headend|multiswitch|splitter|tap|rf|dish|antenna|stb|digital signage|av over ip|hdbaset|display)\b/i,
    domain: "media signal distribution",
    visual: {
      visualType: "distribution-diagram",
      labels: ["Source", "Headend / Encoder", "Distribution", "Outlet / Display"],
      description: "Media distribution from source through headend or network to outlets and displays."
    },
    hero_ar: "{cleanTitle} يرتبط بتوزيع media أو RF/TV/AV signal من source إلى headend ثم outlets أو displays.",
    hero_en: "{cleanTitle} distributes media, RF, TV, or AV signals from source through headend or network to outlets and displays.",
    definition_ar: "اقرأه من خلال signal level، bandwidth، modulation/encoding، distribution loss، outlet level، وuser experience.",
    definition_en: "Read it through signal level, bandwidth, modulation or encoding, distribution loss, outlet level, and user experience.",
    why_ar: "ضعف level أو bandwidth أو multicast settings قد يظهر كصورة متقطعة أو قنوات مفقودة.",
    why_en: "Weak level, bandwidth, or multicast settings can appear as pixelation, missing channels, or unstable displays.",
    appears_ar: "يظهر في headend diagram، RF level calculation، IPTV multicast design، outlet schedule، display schedule، وcommissioning channel scan.",
    appears_en: "You meet it in headend diagrams, RF level calculations, IPTV multicast design, outlet schedules, display schedules, and channel-scan tests.",
    examples: [
      "Check source quality before troubleshooting downstream distribution.",
      "Calculate splitter/tap losses and final outlet levels.",
      "For IPTV, confirm multicast, IGMP, VLAN, and bandwidth settings.",
      "During testing, prove channel list, picture quality, audio, and control."
    ],
    architecture_ar: "الـ architecture تبدأ من antenna/dish/source/server، ثم headend/encoder، ثم distribution، ثم outlet أو display.",
    architecture_en: "The architecture starts with antenna, dish, source, or server, then headend/encoder, then distribution, then outlet or display.",
    flow_ar: "الـ flow قد يكون RF level أو IP stream أو AV signal. كل نوع له loss وlatency وcompatibility مختلفة.",
    flow_en: "The flow may be RF level, IP stream, or AV signal. Each type has different loss, latency, and compatibility rules.",
    design_ar: "في التصميم، حدد source، headend، levels، bandwidth، multicast، cable type، outlet count، وcontrol method.",
    design_en: "In design, define source, headend, levels, bandwidth, multicast, cable type, outlet count, and control method.",
    site_ar: "في الموقع، راجع alignment، connectors، splitter/tap values، patching، labeling، display mounting، وnetwork ports.",
    site_en: "On site, check alignment, connectors, splitter/tap values, patching, labels, display mounting, and network ports.",
    test_ar: "اختبر level، MER/BER where relevant، channel scan، picture/audio، latency، control، وmulticast stability.",
    test_en: "Test level, MER/BER where relevant, channel scan, picture/audio, latency, control, and multicast stability.",
    mistakes: [
      "Troubleshooting outlets before proving source/headend quality.",
      "Ignoring splitter and cable losses.",
      "Deploying IPTV without IGMP and VLAN coordination."
    ],
    troubleshoot_ar: "لو الصورة تقطع، افحص source، headend output، distribution loss، connector quality، network multicast، ثم endpoint settings.",
    troubleshoot_en: "If the picture breaks up, check source, headend output, distribution loss, connector quality, multicast network, then endpoint settings.",
    scenario: {
      design: ["Media design focus", "Define source, headend, distribution type, levels, bandwidth, multicast, outlets, and controls."],
      site: ["Media site focus", "Check connectors, taps/splitters, patching, display mounting, labels, and network ports."],
      test: ["Media testing focus", "Record levels, channel scan, picture/audio quality, multicast stability, latency, and controls."]
    },
    reference_intro_ar: "لـ MATV/IPTV/AV، راجع headend design، RF/IP calculations، outlet schedule، وcommissioning channel tests.",
    reference_intro_en: "For MATV/IPTV/AV, use the headend design, RF/IP calculations, outlet schedule, and channel tests.",
    quiz_correct: "The source quality, distribution path, signal level or bandwidth, endpoint configuration, and test result."
  }),
  createRule({
    id: "healthcare-hospitality",
    name: "Healthcare and hospitality workflow systems",
    match: /\b(nurse call|code blue|grms|guest room|master clock|queue|patient|corridor lamp|slave clock|bedhead|panic)\b/i,
    domain: "room, patient, guest, or service workflow",
    visual: {
      visualType: "workflow-diagram",
      labels: ["Room / Station", "Controller", "Display / Staff", "Escalation"],
      description: "Request or event workflow from room station through controller to display, staff response, and escalation."
    },
    hero_ar: "{cleanTitle} يدير event أو request من غرفة أو مريض أو ضيف إلى staff response أو automation action.",
    hero_en: "{cleanTitle} manages an event or request from a room, patient, or guest to staff response, display, escalation, or automation action.",
    definition_ar: "افهمه كworkflow: من يضغط أو يرسل الحدث، أين يظهر، من يستجيب، كيف يتم التصعيد، وكيف يسجل النظام evidence.",
    definition_en: "Understand it as a workflow: who initiates the event, where it appears, who responds, how escalation works, and how evidence is recorded.",
    why_ar: "الخطأ لا يكون تقنيا فقط؛ قد يؤثر على response time، guest experience، أو patient safety.",
    why_en: "The risk is not only technical; it can affect response time, guest experience, or patient safety.",
    appears_ar: "يظهر في room schedule، station layout، controller diagram، display locations، integration matrix، وfunctional test records.",
    appears_en: "You meet it in room schedules, station layouts, controller diagrams, display locations, integration matrices, and functional test records.",
    examples: [
      "Trace a call or request from button/station to display and escalation.",
      "Coordinate power, network, room numbers, and staff workflows.",
      "Check integrations with BMS, access, paging, clocks, or mobile notification where required.",
      "During testing, prove normal request, escalation, cancellation, fault, and reporting."
    ],
    architecture_ar: "الـ architecture يبدأ من station أو sensor، ثم controller/server، ثم display أو staff client، ثم escalation أو reports.",
    architecture_en: "The architecture starts at station or sensor, then controller/server, then display or staff client, then escalation or reports.",
    flow_ar: "الـ flow هو event workflow بزمن استجابة وacknowledgement وليس مجرد signal يصل أو لا يصل.",
    flow_en: "The flow is an event workflow with response time and acknowledgement, not only a signal that arrives or fails.",
    design_ar: "في التصميم، حدد room numbering، event types، priorities، displays، escalation، integration، reports، وbackup power.",
    design_en: "In design, define room numbering, event types, priorities, displays, escalation, integration, reports, and backup power.",
    site_ar: "في الموقع، راجع station location، labels، network/power، controller mapping، display visibility، وstaff acceptance.",
    site_en: "On site, check station location, labels, network/power, controller mapping, display visibility, and staff acceptance.",
    test_ar: "اختبر event، acknowledgement، cancellation، escalation، fault، report، وintegration مع systems أخرى.",
    test_en: "Test event, acknowledgement, cancellation, escalation, fault, report, and integration with other systems.",
    mistakes: [
      "Testing hardware only and ignoring staff workflow.",
      "Mismatching room numbers between drawings and software.",
      "Missing escalation and reporting requirements."
    ],
    troubleshoot_ar: "لو event لا يصل، افحص station power/network، room mapping، controller logs، display assignment، escalation rules، وserver time.",
    troubleshoot_en: "If an event does not arrive, check station power/network, room mapping, controller logs, display assignment, escalation rules, and server time.",
    scenario: {
      design: ["Workflow design focus", "Define room mapping, event priorities, displays, escalation rules, integrations, reports, and backup power."],
      site: ["Workflow site focus", "Check station location, labels, power/network, controller mapping, display visibility, and user acceptance."],
      test: ["Workflow testing focus", "Prove request, acknowledgement, cancellation, escalation, fault, reporting, and integrated notifications."]
    },
    reference_intro_ar: "لهذه الأنظمة، راجع room schedule، workflow matrix، integration list، وfunctional test sheets.",
    reference_intro_en: "For these systems, use the room schedule, workflow matrix, integration list, and functional test sheets.",
    quiz_correct: "The initiating station, mapped room, controller rule, display/escalation path, and response evidence."
  }),
  createRule({
    id: "smart-iot",
    name: "Smart building, parking, IoT, and gateways",
    match: /\b(parking|iot|mqtt|gateway|lpr|anpr|barrier|ev charging|smart building|rtls|ble|sensor network|platform|cloud)\b/i,
    domain: "connected devices, gateways, and platform actions",
    visual: {
      visualType: "integration-flow",
      labels: ["Sensor / Device", "Gateway", "Platform", "Action / Report"],
      description: "Smart-building data path from field device through gateway and platform to action, alert, or report."
    },
    hero_ar: "{cleanTitle} يربط field devices أو sensors مع gateway/platform لتحويل data إلى action أو report أو automation.",
    hero_en: "{cleanTitle} connects field devices or sensors to a gateway or platform so data can become an action, alert, report, or automation rule.",
    definition_ar: "اقرأه من خلال device، connectivity، gateway protocol، platform data model، security، وuse case.",
    definition_en: "Read it through device, connectivity, gateway protocol, platform data model, security, and use case.",
    why_ar: "هذه الأنظمة تفشل غالبا بسبب integration أو cybersecurity أو data mapping وليس بسبب الجهاز وحده.",
    why_en: "These systems often fail because of integration, cybersecurity, or data mapping rather than the field device alone.",
    appears_ar: "يظهر في device schedule، gateway architecture، API/MQTT topics، platform dashboards، cybersecurity review، وuse-case test reports.",
    appears_en: "You meet it in device schedules, gateway architecture, API/MQTT topics, platform dashboards, cybersecurity reviews, and use-case test reports.",
    examples: [
      "Define what data is collected, how often, and who consumes it.",
      "Check gateway protocol, topic/API naming, credentials, and network rules.",
      "Coordinate privacy and cybersecurity before enabling remote access or cloud paths.",
      "During testing, prove data accuracy, delay, alerts, action, and report output."
    ],
    architecture_ar: "الـ architecture تبدأ من device/sensor، ثم connectivity، ثم gateway، ثم platform/dashboard، ثم action أو report.",
    architecture_en: "The architecture starts with device/sensor, then connectivity, then gateway, then platform/dashboard, then action or report.",
    flow_ar: "الـ flow هو data event أو telemetry، وقد يحتاج buffering وretry وtime sync إذا انقطع الاتصال.",
    flow_en: "The flow is data event or telemetry, and may need buffering, retry, and time sync if communication drops.",
    design_ar: "في التصميم، حدد use case، data fields، protocol، latency، security، API، retention، وownership.",
    design_en: "In design, define use case, data fields, protocol, latency, security, API, retention, and ownership.",
    site_ar: "في الموقع، راجع device placement، power، signal coverage، gateway mapping، credentials، وnetwork access.",
    site_en: "On site, check device placement, power, signal coverage, gateway mapping, credentials, and network access.",
    test_ar: "اختبر data accuracy، delay، disconnect/reconnect، alert، action، dashboard، report، وpermissions.",
    test_en: "Test data accuracy, delay, disconnect/reconnect, alert, action, dashboard, report, and permissions.",
    mistakes: [
      "Installing devices before defining the data model and owner.",
      "Opening remote access without cybersecurity review.",
      "Testing dashboards without checking data accuracy at the source."
    ],
    troubleshoot_ar: "لو dashboard لا يعرض data، افحص device power، signal، gateway logs، protocol credentials، network rules، وplatform mapping.",
    troubleshoot_en: "If the dashboard has no data, check device power, signal, gateway logs, protocol credentials, network rules, and platform mapping.",
    scenario: {
      design: ["Smart system design focus", "Define use case, data model, gateway protocol, cybersecurity, API, latency, retention, and ownership."],
      site: ["Smart system site focus", "Check device placement, power, coverage, gateway mapping, credentials, and network rules."],
      test: ["Smart system testing focus", "Prove data accuracy, delay, reconnect behavior, alerts, actions, reports, and permissions."]
    },
    reference_intro_ar: "للـ smart/IoT systems، راجع use case، API/protocol documents، cybersecurity approval، وdashboard acceptance criteria.",
    reference_intro_en: "For smart/IoT systems, use the use case, API/protocol documents, cybersecurity approval, and dashboard acceptance criteria.",
    quiz_correct: "The device data, gateway mapping, platform rule, security permission, and action or report output."
  }),
  createRule({
    id: "electrical-foundation",
    name: "Electrical foundations and electronics",
    match: /\b(charge|current|voltage|resistance|conductance|power|energy|grounding|earthing|bonding|shielding|relay|transistor|rectifier|waveform|signal|noise|bandwidth|snr|attenuation|frequency|phase|rms|capacitance|inductance|ohm)\b/i,
    domain: "electrical principle used by ELV systems",
    visual: {
      visualType: "concept-diagram",
      labels: ["Source", "Electrical Quantity", "Load / Circuit", "Measurement"],
      description: "Electrical concept relationship between source, measured quantity, circuit effect, and practical measurement."
    },
    hero_ar: "{cleanTitle} مفهوم أساسي يشرح كيف تتحرك الطاقة أو الإشارة أو القياس داخل ELV circuits وdevices.",
    hero_en: "{cleanTitle} is a foundation concept for understanding how energy, signals, and measurements behave inside ELV circuits and devices.",
    definition_ar: "افهم {cleanTitle} من خلال symbol، unit، formula، physical meaning، وأين يظهر في القياس أو troubleshooting.",
    definition_en: "Understand {cleanTitle} through symbol, unit, formula, physical meaning, and where it appears in measurement or troubleshooting.",
    why_ar: "من غير أساسيات الكهرباء، يصبح تفسير faults مثل voltage drop، noise، grounding، أو signal loss مجرد تخمين.",
    why_en: "Without electrical foundations, faults such as voltage drop, noise, grounding issues, or signal loss become guesswork.",
    appears_ar: "يظهر في calculations، datasheets، test instruments، cable limits، grounding details، power supplies، وelectronics troubleshooting.",
    appears_en: "You meet it in calculations, datasheets, test instruments, cable limits, grounding details, power supplies, and electronics troubleshooting.",
    examples: [
      "Connect each formula to its units before using numbers.",
      "Compare measured values with expected range and tolerance.",
      "Check polarity, grounding, shielding, and load before replacing devices.",
      "Use the concept to explain what the instrument is actually measuring."
    ],
    architecture_ar: "هنا الـ architecture هي source، path، load، measurement point. نفس الفكرة تظهر في power supplies، sensors، signal cables، وpanels.",
    architecture_en: "The practical architecture is source, path, load, and measurement point. The same idea appears in power supplies, sensors, signal cables, and panels.",
    flow_ar: "الـ flow قد يكون charge/current أو signal energy. الاتجاه والreference point مهمان لفهم القياس.",
    flow_en: "The flow may be charge/current or signal energy. Direction and reference point matter for understanding the measurement.",
    design_ar: "في التصميم، راجع units، ratings، tolerances، cable loss، safety margins، grounding، وmanufacturer limits.",
    design_en: "In design, check units, ratings, tolerances, cable loss, safety margins, grounding, and manufacturer limits.",
    site_ar: "في الموقع، استخدم meter مناسب، قارن reading مع expected range، وتأكد من polarity/reference قبل الحكم.",
    site_en: "On site, use the right meter, compare reading with expected range, and confirm polarity/reference before judging.",
    test_ar: "اختبر reading، unit، tolerance، load condition، polarity، grounding continuity، وأثر fault على النظام.",
    test_en: "Test reading, unit, tolerance, load condition, polarity, grounding continuity, and the fault effect on the system.",
    mistakes: [
      "Using a formula without checking units and assumptions.",
      "Measuring at the wrong reference point.",
      "Replacing equipment before proving supply, load, and cable path."
    ],
    troubleshoot_ar: "لو القياس غريب، راجع instrument range، reference point، polarity، load، cable continuity، grounding، ثم device behavior.",
    troubleshoot_en: "If a measurement looks wrong, check instrument range, reference point, polarity, load, cable continuity, grounding, then device behavior.",
    scenario: {
      design: ["Electrical concept design focus", "Define symbols, units, ratings, tolerances, cable loss, grounding, and safe operating limits."],
      site: ["Electrical concept site focus", "Measure with the right range and reference, confirm polarity, load, cable path, and grounding continuity."],
      test: ["Electrical concept testing focus", "Record value, unit, condition, tolerance, instrument, and what the result proves about the system."]
    },
    reference_intro_ar: "للمفاهيم الكهربائية، راجع formula، units، datasheets، instrument manual، وapproved design calculation.",
    reference_intro_en: "For electrical concepts, use formulas, units, datasheets, instrument manuals, and approved design calculations.",
    quiz_correct: "The symbol, unit, formula assumption, measurement point, and expected practical range."
  }),
  createRule({
    id: "project-delivery",
    name: "Project delivery, QA, testing, and handover",
    match: /\b(commissioning|handover|shop drawing|boq|specification|fat|sat|inspection|method statement|risk|rfi|approval|o&m|training|report|checklist|deliverable|maintenance|warranty|qa|hse|material submittal)\b/i,
    domain: "project delivery document or workflow",
    visual: {
      visualType: "process-flow",
      labels: ["Prepare", "Review / Approve", "Execute / Test", "Handover Evidence"],
      description: "Project-delivery workflow from preparation through review, execution, evidence, and handover."
    },
    hero_ar: "{cleanTitle} ليس مجرد ملف؛ هو خطوة تحكم جودة تربط scope، approval، execution، evidence، وhandover.",
    hero_en: "{cleanTitle} is not just a document. It is a quality-control step connecting scope, approval, execution, evidence, and handover.",
    definition_ar: "اقرأه من خلال الهدف، من يراجعه، متى يستخدم، ما evidence المطلوب، وكيف يثبت أن العمل مطابق.",
    definition_en: "Read it through purpose, reviewer, timing, required evidence, and how it proves that work is compliant.",
    why_ar: "ضعف المستندات يجعل العمل صعب الاعتماد حتى لو التنفيذ جيد، ويصعب troubleshooting أو handover لاحقا.",
    why_en: "Weak documentation makes good work hard to approve and makes later troubleshooting or handover difficult.",
    appears_ar: "يظهر في submittals، approvals، inspection requests، test sheets، method statements، O&M manuals، training، وcloseout records.",
    appears_en: "You meet it in submittals, approvals, inspection requests, test sheets, method statements, O&M manuals, training, and closeout records.",
    examples: [
      "Link each deliverable to a drawing, specification clause, system, and responsible party.",
      "Do not start site work that requires approval before the approval is issued.",
      "Record clear evidence: readings, screenshots, photos, serial numbers, and signed sheets.",
      "Keep revisions aligned between design, site, testing, and as-built records."
    ],
    architecture_ar: "الـ process يبدأ preparation، ثم review/approval، ثم execution أو test، ثم evidence وhandover.",
    architecture_en: "The process starts with preparation, then review/approval, then execution or testing, then evidence and handover.",
    flow_ar: "الـ flow هنا approval/evidence. كل خطوة يجب أن تترك trace واضح لمن راجع وماذا تم اعتماده.",
    flow_en: "The flow is approval and evidence. Each step should leave a clear trace of who reviewed it and what was accepted.",
    design_ar: "في التصميم، حدد scope، references، acceptance criteria، required attachments، responsibilities، وrevision control.",
    design_en: "In design, define scope, references, acceptance criteria, required attachments, responsibilities, and revision control.",
    site_ar: "في الموقع، استخدم النسخة المعتمدة فقط، سجل deviations، اربط photos/readings بالمكان والجهاز، واحفظ signatures.",
    site_en: "On site, use only approved revisions, record deviations, tie photos/readings to location and asset, and keep signatures.",
    test_ar: "في testing، اكتب expected result قبل الاختبار، ثم actual result، evidence، status، punch items، وapproval.",
    test_en: "In testing, write expected result before the test, then actual result, evidence, status, punch items, and approval.",
    mistakes: [
      "Submitting generic documents not tied to the real system and site conditions.",
      "Collecting test evidence without asset/location references.",
      "Letting revisions drift between drawings, site work, and handover files."
    ],
    troubleshoot_ar: "لو deliverable مرفوض، راجع missing references، wrong revision، unclear evidence، absent acceptance criteria، أو mismatch مع site condition.",
    troubleshoot_en: "If a deliverable is rejected, check missing references, wrong revision, unclear evidence, absent acceptance criteria, or mismatch with site condition.",
    scenario: {
      design: ["Delivery design focus", "Define scope, reference documents, acceptance criteria, attachments, responsible reviewer, and revision control."],
      site: ["Delivery site focus", "Use approved revisions, record deviations, tie evidence to asset/location, and keep signatures traceable."],
      test: ["Delivery testing focus", "Write expected result, actual result, evidence, status, punch item, and approval in the same record."]
    },
    reference_intro_ar: "للتسليم والاختبارات، راجع specification clause، approved drawings، ITP، method statement، وtest forms.",
    reference_intro_en: "For delivery and testing, use the specification clause, approved drawings, ITP, method statement, and test forms.",
    quiz_correct: "The approved reference, acceptance criteria, responsible reviewer, execution evidence, and final status."
  }),
  createRule({
    id: "default",
    name: "ELV concept in course context",
    match: /.*/i,
    domain: "an ELV course topic that needs project context",
    visual: {
      visualType: "concept-map",
      labels: ["Requirement", "Topic", "System Link", "Evidence"],
      description: "Course concept map linking requirement, topic meaning, system use, and evidence."
    },
    hero_ar: "{cleanTitle} موضوع في {category}. اقرأه كجزء من قرار تصميم أو تنفيذ أو اختبار، وليس كعنوان منفصل فقط.",
    hero_en: "{cleanTitle} belongs to {category}. Read it as part of a design, installation, testing, or handover decision, not as a standalone title.",
    definition_ar: "المعنى العملي لـ {cleanTitle} يتحدد من الوظيفة المطلوبة، النظام المرتبط، المستند الذي يظهر فيه، والنتيجة التي يجب إثباتها.",
    definition_en: "The practical meaning of {cleanTitle} comes from the required function, related system, document where it appears, and result that must be proven.",
    why_ar: "الفهم الصحيح يساعدك تختار الرسم أو الجهاز أو الاختبار المناسب، ويمنع خلط المصطلحات المتشابهة.",
    why_en: "Correct understanding helps you choose the right drawing, device, or test, and prevents confusion between similar terms.",
    appears_ar: "يظهر غالبا في الرسومات، المواصفات، الجداول، submittals، checklists، أو test records حسب نوع النظام.",
    appears_en: "You usually meet it in drawings, specifications, schedules, submittals, checklists, or test records depending on the system.",
    examples: [
      "Identify the system or document where the term is used before applying it.",
      "Compare it with nearby course topics to avoid choosing the wrong item.",
      "Tie the term to an expected site action, value, device, drawing, or evidence record.",
      "Ask what would be checked during inspection or commissioning."
    ],
    architecture_ar: "ابن الصورة من requirement، ثم {cleanTitle}، ثم component أو document، ثم evidence المطلوب عند التسليم.",
    architecture_en: "Build the picture from requirement, then {cleanTitle}, then component or document, then the evidence required at handover.",
    flow_ar: "الـ flow هنا هو فهم ثم تطبيق ثم تحقق: تعريف، مكان الاستخدام، قرار، ثم evidence.",
    flow_en: "The flow is understand, apply, then verify: definition, use location, decision, then evidence.",
    design_ar: "في التصميم، اربط {cleanTitle} بالscope، drawing، specification، interface، وacceptance criteria.",
    design_en: "In design, connect {cleanTitle} to scope, drawing, specification, interface, and acceptance criteria.",
    site_ar: "في الموقع، راجع location، label، cable/device/document reference، وأي coordination مع أنظمة قريبة.",
    site_en: "On site, check location, label, cable/device/document reference, and coordination with nearby systems.",
    test_ar: "في الاختبار، حدد expected result، نفذ check مناسب، وسجل evidence يمكن الرجوع له.",
    test_en: "During testing, define expected result, perform the right check, and record evidence that can be traced later.",
    mistakes: [
      "Using the term without knowing the related system or document.",
      "Copying a symbol or label without checking the approved project context.",
      "Skipping evidence, making handover and troubleshooting weaker."
    ],
    troubleshoot_ar: "لو ظهر لبس، ارجع إلى requirement، الرسم، المواصفة، الجهاز أو المستند المرتبط، ثم نتيجة الاختبار المطلوبة.",
    troubleshoot_en: "If there is confusion, return to the requirement, drawing, specification, related device or document, and required test result.",
    scenario: {
      design: ["Design focus", "Confirm the function, drawing reference, specification clause, interface, and acceptance criteria."],
      site: ["Site focus", "Check the installed location, label, device or document reference, and coordination with nearby systems."],
      test: ["Testing focus", "Define the expected result, perform the right check, and record traceable evidence."]
    },
    reference_intro_ar: "راجع مستندات المشروع المعتمدة والمورد قبل تحويل {cleanTitle} إلى قرار تنفيذ أو اختبار.",
    reference_intro_en: "Use approved project and vendor documents before turning {cleanTitle} into an installation or testing decision.",
    quiz_correct: "The related system, document reference, expected result, and evidence needed for the topic."
  })
];

export function contentProfileForTopic(topic) {
  const text = `${topic.title} ${topic.full_path.join(" ")} ${topic.keywords?.join(" ") ?? ""}`;
  return RULES.find((rule) => rule.match.test(text)) ?? RULES[RULES.length - 1];
}

export function lessonForTopic(topic) {
  return contentProfileForTopic(topic).build(topic);
}

export function visualStrategyForTopic(topic) {
  return lessonForTopic(topic).visual;
}

export function scenarioForTopic(topic) {
  return lessonForTopic(topic).scenario;
}

export function referencesForTopic(topic) {
  const lesson = lessonForTopic(topic);
  return {
    intro_ar: lesson.reference_intro_ar,
    intro_en: lesson.reference_intro_en,
    items: lesson.reference_items
  };
}

export function quizForTopic(topic, count) {
  const lesson = lessonForTopic(topic);
  const title = stripLeadingCode(topic.title);
  const labels = lesson.visual.labels;
  const questions = [
    {
      type: "choice",
      q_ar: `ما أفضل وصف عملي لـ ${title}؟`,
      q_en: `What is the best practical description of ${title}?`,
      choices_ar: [
        lesson.quiz_correct,
        "اسم عام لا يحتاج مراجعة رسومات أو مواصفات",
        "عنصر ديكور في الصفحة فقط",
        "قيمة عشوائية يمكن استخدامها بدون سياق"
      ],
      choices_en: [
        lesson.quiz_correct,
        "A generic name that does not need drawings or specifications",
        "Only a decorative page element",
        "A random value that can be used without context"
      ],
      answer: 0,
      feedback_ar: lesson.definition_ar,
      feedback_en: lesson.definition_en
    },
    {
      type: "choice",
      q_ar: `ما أول شيء تراجعه عند استخدام ${title} في التصميم؟`,
      q_en: `What should be checked first when using ${title} in design?`,
      choices_ar: [
        "الوظيفة المطلوبة والمستند المعتمد والـ acceptance criteria",
        "لون الكارت في الصفحة",
        "أقرب عنوان في الفهرس فقط",
        "أي رقم من الذاكرة"
      ],
      choices_en: [
        "Required function, approved reference, and acceptance criteria",
        "The color of the page card",
        "Only the nearest heading in the tree",
        "Any remembered number"
      ],
      answer: 0,
      feedback_ar: lesson.design_ar,
      feedback_en: lesson.design_en
    },
    {
      type: "choice",
      q_ar: `أي دليل اختبار يناسب ${title}؟`,
      q_en: `Which commissioning evidence fits ${title}?`,
      choices_ar: [
        "قراءة أو screenshot أو test sheet يثبت النتيجة المطلوبة",
        "رابط بحث خارجي بدون نتيجة",
        "صورة غير مرتبطة بالنظام",
        "كلمة تم فقط بدون قياس أو تحقق"
      ],
      choices_en: [
        "A reading, screenshot, or test sheet proving the required result",
        "An external search link with no result",
        "An image unrelated to the system",
        "The word done without measurement or verification"
      ],
      answer: 0,
      feedback_ar: lesson.test_ar,
      feedback_en: lesson.test_en
    },
    {
      type: "choice",
      q_ar: `أي ترتيب يوضح المسار الفني لـ ${title}؟`,
      q_en: `Which order best represents the technical path for ${title}?`,
      choices_ar: [
        labels.join(" -> "),
        labels.slice().reverse().join(" -> "),
        "Handover -> Random -> Color -> Logo",
        "Title -> Title -> Title -> Title"
      ],
      choices_en: [
        labels.join(" -> "),
        labels.slice().reverse().join(" -> "),
        "Handover -> Random -> Color -> Logo",
        "Title -> Title -> Title -> Title"
      ],
      answer: 0,
      feedback_ar: lesson.flow_ar,
      feedback_en: lesson.flow_en
    },
    {
      type: "choice",
      q_ar: `ما الخطأ الأخطر عند التعامل مع ${title}؟`,
      q_en: `What is the riskiest mistake when working with ${title}?`,
      choices_ar: [
        lesson.mistakes[0],
        "توثيق الاختبار بالصور والقراءات",
        "مراجعة المواصفات قبل التنفيذ",
        "مطابقة الموقع مع الرسومات المعتمدة"
      ],
      choices_en: [
        lesson.mistakes[0],
        "Documenting tests with photos and readings",
        "Reviewing specifications before installation",
        "Matching site work with approved drawings"
      ],
      answer: 0,
      feedback_ar: lesson.troubleshoot_ar,
      feedback_en: lesson.troubleshoot_en
    },
    {
      type: "choice",
      q_ar: `عند وجود عطل مرتبط بـ ${title}، ما أفضل أسلوب؟`,
      q_en: `When a fault is related to ${title}, what is the best approach?`,
      choices_ar: [
        "اتبع المسار من المصدر إلى الجهاز أو المستند ثم قارن بالنتيجة المتوقعة",
        "استبدل الجهاز مباشرة بدون قياس",
        "احذف الاختبار من نموذج التسليم",
        "غيّر الإعدادات بدون تسجيل"
      ],
      choices_en: [
        "Follow the path from source to device or document, then compare with the expected result",
        "Replace the device immediately without measurement",
        "Remove the test from the handover form",
        "Change settings without recording them"
      ],
      answer: 0,
      feedback_ar: lesson.troubleshoot_ar,
      feedback_en: lesson.troubleshoot_en
    },
    {
      type: "choice",
      q_ar: `أي مرجع يجب استخدامه مع ${title}؟`,
      q_en: `Which reference should be used with ${title}?`,
      choices_ar: [
        lesson.reference_items[0],
        "نتيجة بحث فيديو غير موثقة",
        "لون الصفحة",
        "ذاكرة شخصية فقط"
      ],
      choices_en: [
        lesson.reference_items[0],
        "An undocumented video search result",
        "The page color",
        "Memory only"
      ],
      answer: 0,
      feedback_ar: lesson.reference_intro_ar,
      feedback_en: lesson.reference_intro_en
    },
    {
      type: "choice",
      q_ar: `لماذا نستخدم visual في صفحة ${title}؟`,
      q_en: `Why does the ${title} page use a visual?`,
      choices_ar: [
        "لإظهار مسار النظام أو القرار أو الاختبار بشكل يمكن مراجعته",
        "لملء مساحة فارغة فقط",
        "لاستبدال الاختبار العملي",
        "لإخفاء نقص المحتوى"
      ],
      choices_en: [
        "To show the system, decision, or test path in a reviewable way",
        "Only to fill empty space",
        "To replace practical testing",
        "To hide missing content"
      ],
      answer: 0,
      feedback_ar: lesson.architecture_ar,
      feedback_en: lesson.architecture_en
    }
  ];

  return questions.slice(0, count);
}

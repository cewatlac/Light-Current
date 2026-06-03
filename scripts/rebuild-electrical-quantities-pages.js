import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIRS, ROOT_DIR, writeText } from "./config.js";
import { escapeHtml, loadTopics, pageFilePath, stripLeadingCode, visibleText } from "./lib.js";

const BASE_PATH = ["A. Foundations", "A1. Electrical Basics", "Basic electrical quantities"];

const references = {
  si: {
    label: "NIST: SI base and derived units",
    url: "https://www.nist.gov/pml/owm/metric-si/si-units"
  },
  charge: {
    label: "OpenStax University Physics Volume 2: Electric Charge",
    url: "https://openstax.org/books/university-physics-volume-2/pages/5-1-electric-charge"
  },
  current: {
    label: "OpenStax University Physics Volume 2: Electrical Current",
    url: "https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current"
  },
  resistance: {
    label: "OpenStax University Physics Volume 2: Resistivity and Resistance",
    url: "https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance"
  },
  ohm: {
    label: "OpenStax University Physics Volume 2: Ohm's Law",
    url: "https://openstax.org/books/university-physics-volume-2/pages/10-2-ohms-law"
  },
  power: {
    label: "OpenStax University Physics Volume 2: Electrical Power and Energy",
    url: "https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-power-and-energy"
  },
  ac: {
    label: "OpenStax University Physics Volume 2: AC Sources",
    url: "https://openstax.org/books/university-physics-volume-2/pages/15-1-ac-sources"
  },
  wai: {
    label: "W3C WAI: Informative image accessibility",
    url: "https://www.w3.org/WAI/tutorials/images/informative/"
  }
};

const lessons = [
  {
    title: "Electric charge",
    arTitle: "الشحنة الكهربائية",
    token: "Q",
    unit: "coulomb (C)",
    interaction: "charge",
    heroAr: "الشحنة الكهربائية هي الخاصية التي تجعل electron وproton يتجاذبان أو يتنافران. هي البداية المنطقية لفهم current وvoltage وESD وgrounding داخل أنظمة Light Current.",
    heroEn: "Electric charge is the property that makes electrons and protons attract or repel. It is the starting point for current, voltage, ESD, and grounding in Light Current systems.",
    definitionAr: "الشحنة ليست جسما جديدا داخل السلك؛ هي خاصية في الجسيمات. proton يحمل شحنة موجبة، electron يحمل شحنة سالبة، والجسم neutral عندما يتساوى مجموع الشحنات الموجبة والسالبة فتكون net charge تقريبا صفر.",
    definitionEn: "Charge is not a separate object inside a cable; it is a property of particles. A proton is positive, an electron is negative, and a neutral object has balanced positive and negative charge so the net charge is approximately zero.",
    whyAr: "بدون مفهوم charge لن يكون معنى التيار واضحا، لأن current هو معدل انتقال charge. كما أن تراكم charge يفسر ESD الذي قد يتلف لوحة تحكم أو مدخل حساس.",
    whyEn: "Without charge, current has no clear meaning because current is the rate of charge flow. Stored charge also explains ESD that can damage a control board or sensor input.",
    whereAr: "تظهر في ESD protection، grounding، shielding، capacitors، sensor electronics، وسلوك الإشارة داخل copper cables.",
    whereEn: "It appears in ESD protection, grounding, shielding, capacitors, sensor electronics, and signal behavior in copper cables.",
    formulas: [
      {
        formula: "q = n × e",
        ideaAr: "نستخدمها عندما نريد ربط عدد الإلكترونات أو البروتونات بمقدار charge الكلي.",
        ideaEn: "Use this when the number of electrons or protons must be converted into total charge.",
        symbols: [
          ["q", "الشحنة الكلية بوحدة C", "total charge in C"],
          ["n", "عدد الشحنات الأساسية بدون وحدة", "number of elementary charges"],
          ["e", "elementary charge = 1.602176634 × 10^-19 C", "elementary charge = 1.602176634 × 10^-19 C"]
        ],
        exampleAr: "إذا انتقل 10^12 electron فمقدار الشحنة |q| = 10^12 × 1.602×10^-19 = 1.602×10^-7 C. الإشارة السالبة تظهر إذا كنا نحسب شحنة الإلكترونات نفسها.",
        exampleEn: "If 10^12 electrons move, |q| = 10^12 × 1.602×10^-19 = 1.602×10^-7 C. The negative sign appears when the electron charge itself is being counted."
      },
      {
        formula: "F = k × |q1 q2| / r²",
        ideaAr: "Coulomb force يوضح أن قوة التجاذب أو التنافر تزيد مع مقدار الشحنات وتقل بشدة عند زيادة المسافة.",
        ideaEn: "Coulomb force shows that attraction or repulsion grows with charge magnitude and falls quickly as distance increases.",
        symbols: [
          ["F", "القوة بوحدة newton (N)", "force in newtons (N)"],
          ["k", "ثابت Coulomb تقريبا 8.99×10^9 N·m²/C²", "Coulomb constant about 8.99×10^9 N·m²/C²"],
          ["r", "المسافة بالمتر m", "distance in meters"]
        ],
        exampleAr: "إذا ضاعفت المسافة بين شحنتين وبقيت الشحنات كما هي، تصبح القوة ربع قيمتها تقريبا.",
        exampleEn: "If distance between two charges is doubled while charges stay the same, the force becomes about one quarter."
      }
    ],
    mistakesAr: ["اعتبار neutral كأنه لا يحتوي شحنات؛ الصحيح أنه يحتوي شحنات متوازنة.", "نسيان إشارة electron السالبة في الحسابات.", "استخدام قانون Coulomb مع distance بالسنتمتر بدل المتر."],
    mistakesEn: ["Treating neutral as no charge; it actually means balanced charge.", "Forgetting the negative sign of electron charge.", "Using Coulomb law with distance in centimeters instead of meters."],
    measurementAr: "غالبا لا تقيس charge مباشرة بالـ multimeter. ترى أثرها في voltage، current، ESD event، أو discharge path. عند التعامل مع boards استخدم ESD strap وراجع grounding point.",
    measurementEn: "A multimeter usually does not measure charge directly. You observe its effect through voltage, current, ESD events, or discharge paths. For boards, use ESD protection and verify the grounding point.",
    troubleshootingAr: "لو مدخل sensor يعلق أو controller يعيد التشغيل بعد لمس الباب أو الكابل، افحص ESD path، continuity للأرضي، shielding، وفصل low-level signal عن مصادر التفريغ.",
    troubleshootingEn: "If a sensor input freezes or a controller resets after touching a door or cable, check the ESD path, grounding continuity, shielding, and separation from discharge sources.",
    practicalAr: "في لوحة access control قد تنتقل static charge من جسم المستخدم إلى reader. وجود earthing وESD protection صحيح يقلل تلف reader أو reset غير مبرر للcontroller.",
    practicalEn: "In an access control panel, static charge can move from a user to the reader. Proper earthing and ESD protection reduce reader damage and unexplained controller resets.",
    visualWords: ["proton +", "electron -", "neutral balance", "ESD path"],
    refs: ["charge", "current", "si", "wai"]
  },
  {
    title: "Current",
    arTitle: "التيار الكهربائي",
    token: "I",
    unit: "ampere (A)",
    interaction: "current",
    heroAr: "التيار هو معدل مرور charge خلال مقطع من موصل أو load. في Light Current لا يهم الاسم فقط؛ يهم المسار المغلق، اتجاه القياس، وسعة مصدر التغذية.",
    heroEn: "Current is the rate at which charge passes through a conductor or load. In Light Current, the closed path, measurement direction, and power-supply capacity matter.",
    definitionAr: "Current يعني كمية charge التي تعبر نقطة خلال زمن محدد. conventional current يرسم من الموجب إلى السالب، بينما حركة electrons في النحاس تكون غالبا بالعكس.",
    definitionEn: "Current is the amount of charge crossing a point during a time interval. Conventional current is drawn from positive to negative, while electron motion in copper is usually opposite.",
    whyAr: "كل device يحتاج current مناسب. زيادة الحمل قد تسقط power supply أو تفصل fuse، ونقص التيار قد يجعل lock أو camera أو relay يعمل بشكل غير ثابت.",
    whyEn: "Every device needs suitable current. Too much load can drop a power supply or open a fuse; too little current can make a lock, camera, or relay unstable.",
    whereAr: "تظهر في تغذية cameras، locks، readers، relay coils، fire alarm loops، BMS actuators، وPoE devices.",
    whereEn: "It appears in camera supplies, locks, readers, relay coils, fire alarm loops, BMS actuators, and PoE devices.",
    formulas: [
      {
        formula: "I = ΔQ / Δt",
        ideaAr: "الفكرة: التيار ليس كمية charge فقط، بل كمية charge لكل ثانية.",
        ideaEn: "The idea: current is not only amount of charge; it is charge per second.",
        symbols: [["I", "التيار بالأمبير A", "current in amperes A"], ["ΔQ", "الشحنة المنتقلة بالكولوم C", "transferred charge in coulombs C"], ["Δt", "الزمن بالثانية s", "time in seconds s"]],
        exampleAr: "إذا مر 6 C خلال 2 s، فإن I = 6/2 = 3 A. هذا تيار كبير بالنسبة لكثير من دوائر ELV الصغيرة.",
        exampleEn: "If 6 C passes in 2 s, I = 6/2 = 3 A. This is high for many small ELV circuits."
      }
    ],
    mistakesAr: ["قياس current على التوازي مثل voltage فيحترق fuse داخل multimeter.", "نسيان أن open circuit يعني لا يوجد مسار كامل للتيار.", "جمع currents لكل الأجهزة بدون هامش أمان للمصدر."],
    mistakesEn: ["Measuring current in parallel like voltage and blowing the meter fuse.", "Forgetting that an open circuit has no complete current path.", "Adding device currents without a safety margin for the supply."],
    measurementAr: "لقياس current ضع ammeter على التوالي مع الحمل، واختر AC أو DC والمدى المناسب. لا تنقل probe من voltage إلى current بدون تغيير المنفذ والوضع.",
    measurementEn: "Measure current with the ammeter in series with the load, using the correct AC/DC mode and range. Do not move from voltage to current without changing the probe port and mode.",
    troubleshootingAr: "إذا لم يعمل magnetic lock، قس voltage عند الحمل ثم current على التوالي. وجود voltage بلا current قد يعني open coil أو مسار مقطوع.",
    troubleshootingEn: "If a magnetic lock does not work, measure voltage at the load and current in series. Voltage with no current can mean an open coil or broken path.",
    practicalAr: "Power supply بقدرة 12 V / 5 A لا يكفي إذا كان مجموع locks وreaders والإنذارات يتجاوز التيار مع هامش تشغيل.",
    practicalEn: "A 12 V / 5 A power supply is not enough if locks, readers, and alarms exceed that current after margin.",
    visualWords: ["closed loop", "charge per second", "ammeter in series", "device load"],
    refs: ["current", "ohm", "si", "wai"]
  },
  {
    title: "Voltage",
    arTitle: "الجهد الكهربائي",
    token: "V",
    unit: "volt (V)",
    interaction: "voltage",
    heroAr: "الجهد هو فرق الطاقة لكل charge بين نقطتين. لا تقل جهد عند نقطة وحدها؛ دائما اسأل: بين أي نقطتين؟ وما reference المستخدم؟",
    heroEn: "Voltage is energy difference per charge between two points. Do not say voltage at one isolated point; always ask between which two points and which reference.",
    definitionAr: "Voltage أو potential difference يوضح مقدار الطاقة التي يمكن أن تكتسبها أو تفقدها charge عند انتقالها بين نقطتين.",
    definitionEn: "Voltage, or potential difference, describes how much energy a charge can gain or lose when moving between two points.",
    whyAr: "معظم أعطال ELV تظهر كهبوط voltage عند الحمل، reference خاطئ، polarity معكوسة، أو قراءة صحيحة عند power supply وخاطئة عند device.",
    whyEn: "Many ELV faults appear as voltage drop at the load, wrong reference, reversed polarity, or a correct reading at the supply but wrong reading at the device.",
    whereAr: "تظهر في 12 VDC و24 VDC و48 VDC PoE، إشارات analog، battery backup، ومداخل controllers.",
    whereEn: "It appears in 12 VDC, 24 VDC, 48 VDC PoE, analog signals, battery backup, and controller inputs.",
    formulas: [
      {
        formula: "V = W / Q",
        ideaAr: "الفكرة: الجهد يساوي الطاقة المنقولة لكل كولوم من charge.",
        ideaEn: "The idea: voltage is energy transferred per coulomb of charge.",
        symbols: [["V", "فرق الجهد بالفولت V", "voltage in volts V"], ["W", "الشغل أو الطاقة بالجول J", "work or energy in joules J"], ["Q", "الشحنة بالكولوم C", "charge in coulombs C"]],
        exampleAr: "إذا احتاجت 2 C إلى 24 J للانتقال بين نقطتين، فإن V = 24/2 = 12 V.",
        exampleEn: "If 2 C needs 24 J to move between two points, V = 24/2 = 12 V."
      }
    ],
    mistakesAr: ["قياس voltage بدون تحديد reference.", "اعتبار 0 V هو earth دائما؛ قد يكون فقط مرجع الدائرة.", "إهمال voltage drop عبر كابل طويل."],
    mistakesEn: ["Measuring voltage without defining the reference.", "Assuming 0 V is always earth; it may only be circuit reference.", "Ignoring voltage drop over a long cable."],
    measurementAr: "يقاس voltage على التوازي بين نقطتين. في DC راقب polarity، وفي AC راقب RMS وقيمة التردد ونوع الإشارة.",
    measurementEn: "Voltage is measured in parallel between two points. In DC, watch polarity; in AC, watch RMS, frequency, and waveform type.",
    troubleshootingAr: "إذا camera تفصل ليلا مع IR، قس voltage عند الكاميرا وليس عند power supply فقط. الحمل الليلي قد يزيد drop في الكابل.",
    troubleshootingEn: "If a camera disconnects at night with IR on, measure voltage at the camera, not only at the supply. Night load can increase cable drop.",
    practicalAr: "نظام 24 VDC قد يبدو سليما عند اللوحة، لكن عند actuator بعيد تصبح القراءة 19 V بسبب طول الكابل والتيار.",
    practicalEn: "A 24 VDC system may look fine at the panel, but a distant actuator can see 19 V because of cable length and current.",
    visualWords: ["point A", "point B", "reference 0 V", "parallel meter"],
    refs: ["current", "ohm", "si", "wai"]
  },
  {
    title: "Resistance",
    arTitle: "المقاومة الكهربائية",
    token: "R",
    unit: "ohm (Ω)",
    interaction: "resistance",
    heroAr: "المقاومة هي معارضة مسار ما لمرور current. في ELV تظهر في الكابلات، coils، contacts، terminations، وأي load يستهلك طاقة.",
    heroEn: "Resistance is opposition to current flow. In ELV, it appears in cables, coils, contacts, terminations, and any load consuming energy.",
    definitionAr: "Resistance تربط بين voltage وcurrent: عند نفس الجهد، مقاومة أكبر تعني current أقل. ليست دائما قطعة منفصلة؛ قد تكون خاصية كابل أو ملف أو تلامس ضعيف.",
    definitionEn: "Resistance relates voltage and current: at the same voltage, higher resistance means lower current. It is not always a separate part; it can be a cable, coil, or weak contact property.",
    whyAr: "مقاومة زائدة في joint أو cable تسبب voltage drop وسخونة وأعطال متقطعة. مقاومة قليلة جدا قد تعني short circuit.",
    whyEn: "Extra resistance in a joint or cable causes voltage drop, heating, and intermittent faults. Very low resistance may indicate a short circuit.",
    whereAr: "تظهر في door lock coils، fire alarm loops، speaker lines، cable runs، contact resistance، وEOL resistors.",
    whereEn: "It appears in door lock coils, fire alarm loops, speaker lines, cable runs, contact resistance, and EOL resistors.",
    formulas: [
      {
        formula: "R = V / I",
        ideaAr: "من Ohm's law: المقاومة هي مقدار الجهد المطلوب لكل أمبير يمر في المسار.",
        ideaEn: "From Ohm's law: resistance is the voltage required per ampere through the path.",
        symbols: [["R", "المقاومة بالأوم Ω", "resistance in ohms Ω"], ["V", "فرق الجهد بالفولت V", "voltage in volts V"], ["I", "التيار بالأمبير A", "current in amperes A"]],
        exampleAr: "حمل يعمل على 12 V ويسحب 0.5 A له مقاومة تقريبية R = 12/0.5 = 24 Ω.",
        exampleEn: "A load operating at 12 V and drawing 0.5 A has approximate resistance R = 12/0.5 = 24 Ω."
      }
    ],
    mistakesAr: ["قياس resistance والدائرة ما زالت عليها power.", "تجاهل مقاومة الكابل في المسافات الطويلة.", "اعتبار كل قراءة منخفضة short بدون فصل الأحمال أولا."],
    mistakesEn: ["Measuring resistance while the circuit is still powered.", "Ignoring cable resistance over long runs.", "Calling every low reading a short before isolating loads."],
    measurementAr: "افصل التغذية قبل قياس Ω. في loop راجع قيمة EOL المتوقعة وقارنها مع drawings وmanufacturer manual.",
    measurementEn: "Disconnect power before measuring Ω. In loops, check expected EOL value against drawings and manufacturer manuals.",
    troubleshootingAr: "إذا قراءة loop أعلى من المتوقع، افحص joint، terminal، طول الكابل، وتآكل contact. إذا أقل جدا، افصل الفروع لتحديد short.",
    troubleshootingEn: "If a loop reads higher than expected, inspect joints, terminals, cable length, and contact corrosion. If very low, isolate branches to locate a short.",
    practicalAr: "مقاومة كابل طويلة في قفل باب يمكن أن تخفض voltage تحت الحد المطلوب عند لحظة التشغيل.",
    practicalEn: "Resistance of a long cable to a door lock can drop voltage below the required limit at activation.",
    visualWords: ["voltage", "current", "ohm", "cable drop"],
    refs: ["resistance", "ohm", "si", "wai"]
  },
  {
    title: "Conductance",
    arTitle: "الموصلية الكهربائية",
    token: "G",
    unit: "siemens (S)",
    interaction: "conductance",
    heroAr: "Conductance هي عكس resistance: تقيس سهولة مرور current في مسار. تساعدك تفكر بسرعة: هل المسار مفتوح وسهل أم مقيد وضعيف؟",
    heroEn: "Conductance is the inverse of resistance: it measures how easily current flows through a path. It helps you judge whether a path is open and easy or restricted.",
    definitionAr: "كلما زادت conductance قلّت المقاومة وزاد التيار لنفس الجهد. الوحدة هي siemens، وهي ampere لكل volt.",
    definitionEn: "Higher conductance means lower resistance and more current for the same voltage. The unit is siemens, equal to ampere per volt.",
    whyAr: "مفهوم conductance مفيد في sensors، leakage، wet contacts، insulation faults، وفهم لماذا short path يمرر current كبير.",
    whyEn: "Conductance is useful for sensors, leakage, wet contacts, insulation faults, and understanding why a short path passes high current.",
    whereAr: "تظهر في testing لعزل الكابلات، moisture leakage، grounding paths، وinput circuits ذات مقاومة دخل محددة.",
    whereEn: "It appears in cable insulation testing, moisture leakage, grounding paths, and input circuits with defined input resistance.",
    formulas: [
      {
        formula: "G = 1 / R",
        ideaAr: "الفكرة: بدلا من السؤال عن مقدار المعارضة، نسأل عن مقدار سهولة المرور.",
        ideaEn: "The idea: instead of asking how much opposition exists, ask how easy the path is.",
        symbols: [["G", "الموصلية بوحدة siemens S", "conductance in siemens S"], ["R", "المقاومة بالأوم Ω", "resistance in ohms Ω"], ["S", "siemens = A/V", "siemens = A/V"]],
        exampleAr: "إذا كان R = 20 Ω، فإن G = 1/20 = 0.05 S. إذا أصبحت R = 2 Ω تصبح G = 0.5 S، أي مسار أسهل بكثير.",
        exampleEn: "If R = 20 Ω, G = 1/20 = 0.05 S. If R becomes 2 Ω, G becomes 0.5 S, a much easier path."
      }
    ],
    mistakesAr: ["خلط conductance مع conductivity؛ الأولى لمسار محدد، والثانية خاصية مادة.", "نسيان أن conductance العالية قد تكون عطل leakage.", "استخدام S بينما القراءة المطلوبة في manual بالأوم."],
    mistakesEn: ["Confusing conductance with conductivity; one is for a path, the other for a material.", "Forgetting that high conductance may indicate leakage.", "Using S when the manual expects ohms."],
    measurementAr: "معظم الفنيين يقيسون R ثم يحسبون G عند الحاجة. عند insulation test، زيادة conductance تعني غالبا leakage أو moisture.",
    measurementEn: "Technicians usually measure R and calculate G if needed. In insulation testing, increased conductance often means leakage or moisture.",
    troubleshootingAr: "إذا input يعطي alarm مع عدم وجود event، ابحث عن leakage conductance بين cores أو إلى الأرضي بسبب رطوبة أو تلف عزل.",
    troubleshootingEn: "If an input alarms without a real event, look for leakage conductance between cores or to ground due to moisture or insulation damage.",
    practicalAr: "في fire alarm loop، ماء داخل junction box قد يخلق conductance إضافية تجعل اللوحة ترى حالة غير طبيعية.",
    practicalEn: "In a fire alarm loop, water inside a junction box can create extra conductance and make the panel see an abnormal condition.",
    visualWords: ["easy path", "hard path", "leakage", "siemens"],
    refs: ["resistance", "ohm", "si", "wai"]
  },
  {
    title: "Power",
    arTitle: "القدرة الكهربائية",
    token: "P",
    unit: "watt (W)",
    interaction: "power",
    heroAr: "Power هي معدل استهلاك أو نقل energy. في ELV تحدد حجم power supply وPoE switch وUPS والحرارة والهامش.",
    heroEn: "Power is the rate of energy transfer or consumption. In ELV, it sizes power supplies, PoE switches, UPS capacity, heat, and margin.",
    definitionAr: "القدرة توضح كم energy في كل ثانية. device بقدرة أعلى يحتاج current أعلى عند نفس voltage أو voltage أعلى عند نفس current.",
    definitionEn: "Power tells how much energy is used each second. A higher-power device needs more current at the same voltage or more voltage at the same current.",
    whyAr: "اختيار power supply بدون حساب power يؤدي إلى reboot للأجهزة أو drop عند الحمل الكامل. وفي PoE يجب مقارنة device class مع budget.",
    whyEn: "Choosing a supply without power calculation causes device resets or drops at full load. In PoE, device class must be compared with budget.",
    whereAr: "تظهر في cameras with IR، access locks، amplifiers، PoE APs، controllers، UPS، وbattery chargers.",
    whereEn: "It appears in cameras with IR, access locks, amplifiers, PoE APs, controllers, UPS, and battery chargers.",
    formulas: [
      {
        formula: "P = V × I",
        ideaAr: "في دوائر DC البسيطة، القدرة تساوي الجهد مضروبا في التيار.",
        ideaEn: "In simple DC circuits, power equals voltage multiplied by current.",
        symbols: [["P", "القدرة بالواط W", "power in watts W"], ["V", "الجهد بالفولت V", "voltage in volts V"], ["I", "التيار بالأمبير A", "current in amperes A"]],
        exampleAr: "كاميرا 12 V تسحب 0.75 A تحتاج P = 12×0.75 = 9 W. مع 8 كاميرات يصبح الحمل 72 W قبل هامش الأمان.",
        exampleEn: "A 12 V camera drawing 0.75 A needs P = 12×0.75 = 9 W. Eight cameras need 72 W before safety margin."
      }
    ],
    mistakesAr: ["خلط W مع Wh؛ الأول معدل استهلاك والثاني كمية energy.", "نسيان inrush أو IR load في الكاميرات.", "عدم ترك margin في power supply أو PoE budget."],
    mistakesEn: ["Confusing W with Wh; one is rate, the other is energy amount.", "Forgetting inrush or IR load in cameras.", "Leaving no margin in supply or PoE budget."],
    measurementAr: "يمكن حساب power من voltage وcurrent المقاسين. في AC يجب معرفة power factor إذا كان الحمل غير مقاوم بسيط.",
    measurementEn: "Power can be calculated from measured voltage and current. In AC, power factor matters when the load is not purely resistive.",
    troubleshootingAr: "إذا switch PoE يعيد تشغيل cameras عند الليل، راجع total PoE budget وIR power وليس network فقط.",
    troubleshootingEn: "If a PoE switch reboots cameras at night, check total PoE budget and IR power, not only the network.",
    practicalAr: "PA amplifier أو PoE switch لا يختار بعدد المخارج فقط؛ يختار حسب watts المطلوبة وحسب هامش التشغيل.",
    practicalEn: "A PA amplifier or PoE switch is not selected only by port count; it is selected by required watts and operating margin.",
    visualWords: ["voltage", "current", "watts", "PoE budget"],
    refs: ["power", "ohm", "si", "wai"]
  },
  {
    title: "Energy",
    arTitle: "الطاقة الكهربائية",
    token: "E",
    unit: "joule (J), watt-hour (Wh)",
    interaction: "energy",
    heroAr: "Energy هي كمية القدرة المتراكمة خلال الزمن. هي اللغة العملية للبطاريات وUPS وruntime وليس مجرد رقم لحظي.",
    heroEn: "Energy is power accumulated over time. It is the practical language of batteries, UPS sizing, and runtime, not just an instant value.",
    definitionAr: "إذا كان power هو معدل الاستهلاك، فإن energy هي ما تم استهلاكه أو تخزينه خلال مدة. لذلك Wh مناسبة للبطاريات وJ مناسبة للحساب الفيزيائي.",
    definitionEn: "If power is consumption rate, energy is what has been consumed or stored over time. Wh suits batteries, while J suits physics calculations.",
    whyAr: "UPS لا يختار من watt فقط. يجب معرفة الحمل والزمن المطلوب والكفاءة وعمق تفريغ البطارية.",
    whyEn: "A UPS is not selected by watts alone. Load, required time, efficiency, and battery depth of discharge must be considered.",
    whereAr: "تظهر في battery backup، UPS، fire alarm standby، emergency sound، access control backup، وsolar/charger sizing.",
    whereEn: "It appears in battery backup, UPS, fire alarm standby, emergency sound, access control backup, and solar/charger sizing.",
    formulas: [
      {
        formula: "E = P × t",
        ideaAr: "الطاقة تزيد عندما يزيد الحمل أو يزيد زمن التشغيل.",
        ideaEn: "Energy increases when load increases or runtime increases.",
        symbols: [["E", "الطاقة بوحدة Wh أو J", "energy in Wh or J"], ["P", "القدرة بالواط W", "power in watts W"], ["t", "الزمن بالساعة h أو الثانية s حسب الوحدة", "time in hours h or seconds s depending on unit"]],
        exampleAr: "حمل 60 W يعمل 4 h يحتاج E = 60×4 = 240 Wh قبل حساب كفاءة UPS والهامش.",
        exampleEn: "A 60 W load running for 4 h needs E = 60×4 = 240 Wh before UPS efficiency and margin."
      }
    ],
    mistakesAr: ["خلط Ah مع Wh بدون ضرب في voltage.", "نسيان efficiency وaging وtemperature في البطاريات.", "اعتبار runtime ثابت مع أي حمل."],
    mistakesEn: ["Confusing Ah with Wh without multiplying by voltage.", "Forgetting efficiency, aging, and temperature in batteries.", "Assuming runtime is constant for any load."],
    measurementAr: "للتحقق العملي سجل load power، battery voltage، battery capacity، وزمن الاختبار. لا تعتمد على اسم البطارية فقط.",
    measurementEn: "For practical verification, record load power, battery voltage, battery capacity, and test duration. Do not rely only on battery label.",
    troubleshootingAr: "إذا UPS يفصل مبكرا، قارن actual load مع battery Wh، افحص charging voltage، وعمر البطارية.",
    troubleshootingEn: "If a UPS shuts down early, compare actual load with battery Wh, then check charging voltage and battery age.",
    practicalAr: "لو access control panel يحتاج standby 4 ساعات، احسب مجموع loads ثم Wh المطلوبة ثم أضف margin وكفاءة charger.",
    practicalEn: "If an access control panel needs 4 hours standby, sum loads, calculate required Wh, then add margin and charger efficiency.",
    visualWords: ["watts", "time", "battery Wh", "runtime"],
    refs: ["power", "si", "wai"]
  },
  {
    title: "Frequency",
    arTitle: "التردد",
    token: "f",
    unit: "hertz (Hz)",
    interaction: "frequency",
    heroAr: "Frequency هو عدد الدورات في الثانية. في ELV يظهر في AC، signals، sampling، noise، وcommunication timing.",
    heroEn: "Frequency is the number of cycles per second. In ELV, it appears in AC, signals, sampling, noise, and communication timing.",
    definitionAr: "إذا تكررت waveform أو event بشكل دوري، فالتردد يخبرك كم مرة يحدث ذلك خلال ثانية واحدة.",
    definitionEn: "If a waveform or event repeats periodically, frequency tells how many times it happens in one second.",
    whyAr: "قراءة frequency تساعد في تمييز 50 Hz hum، ripple، interference، ومشاكل timing في بعض الإشارات.",
    whyEn: "Frequency helps identify 50 Hz hum, ripple, interference, and timing issues in some signals.",
    whereAr: "تظهر في mains interference، audio systems، network clocks، PWM، sensors، وoscilloscope checks.",
    whereEn: "It appears in mains interference, audio systems, network clocks, PWM, sensors, and oscilloscope checks.",
    formulas: [
      {
        formula: "f = 1 / T",
        ideaAr: "كلما كان زمن الدورة أقصر، زاد عدد الدورات في الثانية.",
        ideaEn: "The shorter the cycle time, the more cycles occur per second.",
        symbols: [["f", "التردد بوحدة Hz", "frequency in Hz"], ["T", "زمن دورة واحدة بالثانية s", "period of one cycle in seconds s"], ["Hz", "دورة واحدة في الثانية", "one cycle per second"]],
        exampleAr: "إذا كان T = 20 ms = 0.02 s، فإن f = 1/0.02 = 50 Hz.",
        exampleEn: "If T = 20 ms = 0.02 s, f = 1/0.02 = 50 Hz."
      }
    ],
    mistakesAr: ["استخدام ms في المعادلة بدون تحويل إلى s.", "قراءة noise كتردد signal حقيقي دون تحقق.", "خلط frequency مع data rate في كل الحالات."],
    mistakesEn: ["Using ms in the formula without converting to seconds.", "Reading noise as true signal frequency without verification.", "Treating frequency and data rate as always identical."],
    measurementAr: "استخدم oscilloscope أو multimeter frequency mode حسب نوع الإشارة. اضبط probe وtrigger حتى ترى دورة واضحة.",
    measurementEn: "Use an oscilloscope or multimeter frequency mode depending on the signal. Set probe and trigger so one cycle is clear.",
    troubleshootingAr: "ظهور 50 Hz على audio أو sensor cable قد يشير إلى coupling من power cable أو grounding issue.",
    troubleshootingEn: "A 50 Hz component on audio or sensor cable can indicate coupling from a power cable or a grounding issue.",
    practicalAr: "في PA system، hum عند 50 Hz أو 100 Hz يساعدك تميز بين grounding problem وpower supply ripple.",
    practicalEn: "In a PA system, 50 Hz or 100 Hz hum helps distinguish grounding problems from power-supply ripple.",
    visualWords: ["one second", "cycles", "50 Hz", "waveform"],
    refs: ["ac", "si", "wai"]
  },
  {
    title: "Period",
    arTitle: "زمن الدورة",
    token: "T",
    unit: "second (s)",
    interaction: "period",
    heroAr: "Period هو زمن دورة واحدة من waveform. هو الوجه الآخر للتردد، ويفيدك عندما تقيس timing على oscilloscope.",
    heroEn: "Period is the time for one waveform cycle. It is the other side of frequency and is useful when measuring timing on an oscilloscope.",
    definitionAr: "الدورة هي تكرار كامل للشكل الموجي من نقطة إلى النقطة المكافئة التالية. Period هو زمن هذا التكرار.",
    definitionEn: "A cycle is one complete repeat of the waveform from a point to the next equivalent point. Period is the time of that repeat.",
    whyAr: "بعض المشاكل لا تظهر كقيمة frequency فقط؛ تحتاج معرفة pulse width أو cycle time أو delay.",
    whyEn: "Some issues do not appear as frequency alone; pulse width, cycle time, or delay may be needed.",
    whereAr: "تظهر في AC waveform، PWM، sensor pulses، door contact debounce، وcommunication timing.",
    whereEn: "It appears in AC waveforms, PWM, sensor pulses, door contact debounce, and communication timing.",
    formulas: [
      {
        formula: "T = 1 / f",
        ideaAr: "كلما زاد التردد قل زمن الدورة الواحدة.",
        ideaEn: "As frequency increases, the time of one cycle decreases.",
        symbols: [["T", "period بالثانية s", "period in seconds s"], ["f", "frequency بالهرتز Hz", "frequency in hertz Hz"], ["ms", "millisecond = 0.001 s", "millisecond = 0.001 s"]],
        exampleAr: "عند f = 50 Hz، فإن T = 1/50 = 0.02 s = 20 ms.",
        exampleEn: "At f = 50 Hz, T = 1/50 = 0.02 s = 20 ms."
      }
    ],
    mistakesAr: ["خلط half-cycle مع full period.", "نسيان تحويل seconds إلى milliseconds.", "اختيار نقطتين غير متكافئتين على waveform."],
    mistakesEn: ["Confusing half-cycle with full period.", "Forgetting to convert seconds to milliseconds.", "Choosing two non-equivalent points on the waveform."],
    measurementAr: "على oscilloscope قس من peak إلى peak مشابه أو zero crossing بنفس الاتجاه. لا تقيس بين crossing صاعد وهابط إذا كنت تريد period كامل.",
    measurementEn: "On an oscilloscope, measure from a peak to the next similar peak or from a zero crossing to the next crossing with the same direction.",
    troubleshootingAr: "إذا pulse من sensor غير ثابت، راقب period وتذبذبه قبل الحكم على controller input.",
    troubleshootingEn: "If a sensor pulse is unstable, observe the period and its jitter before blaming the controller input.",
    practicalAr: "في tachometer أو flow pulse، period الطويل يعني سرعة أقل أو flow أقل حتى لو شكل النبضة سليم.",
    practicalEn: "In a tachometer or flow pulse, a longer period means lower speed or lower flow even if the pulse shape is clean.",
    visualWords: ["cycle start", "cycle end", "T seconds", "scope cursor"],
    refs: ["ac", "si", "wai"]
  },
  {
    title: "Phase",
    arTitle: "زاوية الطور",
    token: "φ",
    unit: "degree (°), radian (rad)",
    interaction: "phase",
    heroAr: "Phase تصف موضع waveform بالنسبة لمرجع أو waveform أخرى. مهمة في AC، audio، synchronization، وتشخيص الإشارات المتأخرة.",
    heroEn: "Phase describes where a waveform sits relative to a reference or another waveform. It matters in AC, audio, synchronization, and delayed signals.",
    definitionAr: "إذا كان لدينا موجتان بنفس frequency، فإن phase توضح هل هما متطابقتان، متأخرتان، متقدمتان، أو متعاكستان.",
    definitionEn: "If two waves have the same frequency, phase tells whether they are aligned, delayed, advanced, or opposite.",
    whyAr: "phase الخاطئ قد يسبب إلغاء في الصوت، قراءة power غير صحيحة في AC، أو عدم تزامن بين إشارتين.",
    whyEn: "Wrong phase can cause audio cancellation, incorrect AC power reading, or loss of synchronization between signals.",
    whereAr: "تظهر في PA speakers، AC circuits، oscillator signals، differential signals، وtiming بين channels.",
    whereEn: "It appears in PA speakers, AC circuits, oscillator signals, differential signals, and timing between channels.",
    formulas: [
      {
        formula: "Δt = (φ / 360°) × T",
        ideaAr: "تحويل phase angle إلى time shift يساعدك تربط زاوية الموجة بقراءة oscilloscope.",
        ideaEn: "Converting phase angle to time shift helps connect waveform angle to oscilloscope timing.",
        symbols: [["Δt", "فرق الزمن بالثانية أو ms", "time shift in seconds or ms"], ["φ", "زاوية الطور بالدرجات", "phase angle in degrees"], ["T", "زمن الدورة", "period"]],
        exampleAr: "عند 50 Hz يكون T = 20 ms. فرق 90° يساوي 90/360 × 20 = 5 ms.",
        exampleEn: "At 50 Hz, T = 20 ms. A 90° shift equals 90/360 × 20 = 5 ms."
      }
    ],
    mistakesAr: ["خلط polarity العكسي مع phase shift في كل الحالات.", "مقارنة موجتين بترددين مختلفين كأن phase ثابتة.", "نسيان reference channel عند القياس."],
    mistakesEn: ["Treating reversed polarity and phase shift as always identical.", "Comparing waves of different frequency as if phase stayed fixed.", "Forgetting the reference channel during measurement."],
    measurementAr: "استخدم oscilloscope بقناتين وحدد reference. قس time shift ثم حوله إلى degrees حسب period.",
    measurementEn: "Use a two-channel oscilloscope and define the reference. Measure time shift, then convert it to degrees using the period.",
    troubleshootingAr: "إذا zone صوت تلغي bass مع zone أخرى، افحص speaker polarity وphase alignment قبل تغيير amplifier.",
    troubleshootingEn: "If one audio zone cancels bass with another, check speaker polarity and phase alignment before replacing the amplifier.",
    practicalAr: "في distributed audio، عكس polarity لسماعة واحدة قد يجعل جزءا من الصوت يختفي في منطقة التداخل.",
    practicalEn: "In distributed audio, reversing one speaker polarity can make part of the sound disappear in the overlap area.",
    visualWords: ["reference wave", "shifted wave", "90 degrees", "time delay"],
    refs: ["ac", "si", "wai"]
  },
  {
    title: "RMS value",
    arTitle: "القيمة الفعالة RMS",
    token: "RMS",
    unit: "same unit as waveform",
    interaction: "rms",
    heroAr: "RMS هي القيمة الفعالة لموجة AC: قيمة DC التي تعطي نفس تأثير التسخين في load مقاوم.",
    heroEn: "RMS is the effective value of an AC waveform: the DC value that gives the same heating effect in a resistive load.",
    definitionAr: "لا تستخدم average لموجة AC عندما تريد تأثير القدرة. RMS مناسب لأن القدرة تعتمد على مربع القيمة اللحظية.",
    definitionEn: "Do not use average for an AC waveform when power effect is needed. RMS is useful because power depends on the square of instantaneous value.",
    whyAr: "معظم قراءات AC على multimeter تعرض RMS. فهمها يمنع الخلط بين 230 V RMS و325 V peak.",
    whyEn: "Most AC multimeter readings display RMS. Understanding it prevents confusing 230 V RMS with 325 V peak.",
    whereAr: "تظهر في AC supplies، audio levels، ripple measurement، UPS outputs، وmultimeter readings.",
    whereEn: "It appears in AC supplies, audio levels, ripple measurement, UPS outputs, and multimeter readings.",
    formulas: [
      {
        formula: "V_RMS = V_peak / √2",
        ideaAr: "هذه العلاقة صحيحة لموجة sine نقية فقط. لا تطبقها عشوائيا على waveform مشوهة.",
        ideaEn: "This relation is valid for a pure sine wave only. Do not apply it blindly to distorted waveforms.",
        symbols: [["V_RMS", "القيمة الفعالة بالفولت", "effective voltage"], ["V_peak", "أكبر قيمة لحظية للموجة", "maximum instantaneous value"], ["√2", "ثابت تقريبي 1.414", "constant about 1.414"]],
        exampleAr: "إذا كان V_peak = 325 V لموجة sine، فإن V_RMS = 325/1.414 ≈ 230 V.",
        exampleEn: "If V_peak = 325 V for a sine wave, V_RMS = 325/1.414 ≈ 230 V."
      }
    ],
    mistakesAr: ["استخدام RMS formula مع square wave أو waveform مشوهة.", "خلط RMS مع peak.", "نسيان أن unit تبقى فولت أو أمبير حسب الموجة."],
    mistakesEn: ["Using the sine RMS formula for square or distorted waves.", "Confusing RMS with peak.", "Forgetting the unit remains volt or ampere depending on the waveform."],
    measurementAr: "استخدم true-RMS meter إذا كانت waveform غير sine. اقرأ bandwidth والمواصفات قبل الاعتماد على الرقم.",
    measurementEn: "Use a true-RMS meter if the waveform is not sinusoidal. Check bandwidth and specifications before trusting the number.",
    troubleshootingAr: "إذا UPS output غير sine وبعض الأجهزة تسخن، قارن RMS وwaveform shape وليس voltage reading فقط.",
    troubleshootingEn: "If a UPS output is not sine and devices heat up, compare RMS and waveform shape, not only voltage reading.",
    practicalAr: "قراءة 230 V AC في meter تعني غالبا RMS. القمة اللحظية لموجة sine حول 325 V، وهذا مهم للعزل والحماية.",
    practicalEn: "A 230 V AC meter reading usually means RMS. The sine peak is about 325 V, which matters for insulation and protection.",
    visualWords: ["sine peak", "RMS line", "same heating", "true-RMS meter"],
    refs: ["ac", "power", "si", "wai"]
  },
  {
    title: "Peak value",
    arTitle: "القيمة العظمى Peak",
    token: "Vpeak / Ipeak",
    unit: "same unit as waveform",
    interaction: "peak",
    heroAr: "Peak value هي أكبر قيمة لحظية تصل لها waveform. مهمة للحماية والعزل وclipping وليس فقط للقراءة العادية.",
    heroEn: "Peak value is the maximum instantaneous value a waveform reaches. It matters for protection, insulation, and clipping, not only normal reading.",
    definitionAr: "القيمة peak قد تكون موجبة أو سالبة حسب الاتجاه. في sine متماثلة نتكلم غالبا عن مقدار peak من zero إلى القمة.",
    definitionEn: "Peak value can be positive or negative depending on direction. For a symmetrical sine, peak usually means magnitude from zero to the crest.",
    whyAr: "Components قد تتحمل RMS لكن تفشل عند peak أو transient. لذلك peak مهم في surge وaudio clipping وADC input limits.",
    whyEn: "Components may tolerate RMS but fail at peak or transient values. Peak matters in surge, audio clipping, and ADC input limits.",
    whereAr: "تظهر في AC waveform، audio signals، sensor ranges، transient protection، وoscilloscope readings.",
    whereEn: "It appears in AC waveforms, audio signals, sensor ranges, transient protection, and oscilloscope readings.",
    formulas: [
      {
        formula: "V_peak = V_RMS × √2",
        ideaAr: "لموجة sine نقية، peak أكبر من RMS بمقدار √2.",
        ideaEn: "For a pure sine wave, peak is RMS multiplied by √2.",
        symbols: [["V_peak", "القيمة العظمى بالفولت", "peak voltage"], ["V_RMS", "القيمة الفعالة", "RMS voltage"], ["V_pp", "peak-to-peak = 2 × peak لموجة متماثلة", "peak-to-peak = 2 × peak for a symmetrical wave"]],
        exampleAr: "230 V RMS لموجة sine تعطي V_peak ≈ 325 V و V_pp ≈ 650 V.",
        exampleEn: "230 V RMS for a sine wave gives V_peak ≈ 325 V and V_pp ≈ 650 V."
      }
    ],
    mistakesAr: ["اعتبار peak-to-peak يساوي peak.", "تطبيق √2 على non-sine waveform.", "إهمال transient peaks عند اختيار protection."],
    mistakesEn: ["Treating peak-to-peak as the same as peak.", "Applying √2 to a non-sine waveform.", "Ignoring transient peaks when selecting protection."],
    measurementAr: "oscilloscope أفضل لرؤية peak وclipping. اضبط vertical scale وprobe attenuation حتى لا تقص الموجة في الجهاز.",
    measurementEn: "An oscilloscope is best for peak and clipping. Set vertical scale and probe attenuation so the instrument does not clip the waveform.",
    troubleshootingAr: "إذا audio amplifier يشوه الصوت، قارن peak signal مع headroom للمدخل أو المخرج.",
    troubleshootingEn: "If an audio amplifier distorts, compare signal peak with input or output headroom.",
    practicalAr: "في analog input 0-10 V، peak أعلى من 10 V قد يشبع ADC حتى لو average يبدو مقبولا.",
    practicalEn: "In a 0-10 V analog input, a peak above 10 V can saturate the ADC even if the average looks acceptable.",
    visualWords: ["zero line", "positive peak", "negative peak", "clipping limit"],
    refs: ["ac", "si", "wai"]
  },
  {
    title: "Average value",
    arTitle: "القيمة المتوسطة",
    token: "Vavg / Iavg",
    unit: "same unit as waveform",
    interaction: "average",
    heroAr: "Average value هي متوسط القيم خلال interval محدد. معناها يتغير حسب هل الموجة كاملة، نصف موجة، أو rectified.",
    heroEn: "Average value is the mean over a defined interval. Its meaning changes depending on whether the waveform is full-cycle, half-cycle, or rectified.",
    definitionAr: "متوسط sine كاملة يساوي صفر لأن الجزء الموجب يلغي السالب. لكن متوسط rectified sine ليس صفرا.",
    definitionEn: "The average of a full sine is zero because the positive half cancels the negative half. A rectified sine average is not zero.",
    whyAr: "استخدام average بدل RMS في AC يؤدي لقراءات مضللة للقدرة. لكنه مفيد في DC with ripple وrectifier outputs.",
    whyEn: "Using average instead of RMS in AC gives misleading power readings. It is useful for DC with ripple and rectifier outputs.",
    whereAr: "تظهر في rectifier outputs، filtered DC، sensor smoothing، audio level detection، وdata logging.",
    whereEn: "It appears in rectifier outputs, filtered DC, sensor smoothing, audio level detection, and data logging.",
    formulas: [
      {
        formula: "V_avg = (1 / T) ∫ v(t) dt",
        ideaAr: "الفكرة: نجمع القيم اللحظية خلال interval ثم نقسم على زمن هذا interval.",
        ideaEn: "The idea: sum instantaneous values over an interval, then divide by the interval time.",
        symbols: [["V_avg", "القيمة المتوسطة", "average value"], ["v(t)", "القيمة اللحظية عند الزمن t", "instantaneous value at time t"], ["T", "زمن interval المختار", "selected interval time"]],
        exampleAr: "لموجة sine كاملة average = 0. لموجة rectified بpeak = 10 V، average ≈ 2×10/π = 6.37 V.",
        exampleEn: "For a full sine, average = 0. For a rectified sine with 10 V peak, average ≈ 2×10/π = 6.37 V."
      }
    ],
    mistakesAr: ["عدم تحديد interval الذي نحسب عليه average.", "استخدام average مكان RMS لحساب heating.", "نسيان تأثير rectifier أو filter."],
    mistakesEn: ["Not defining the interval used for average.", "Using average instead of RMS for heating calculation.", "Forgetting the effect of rectifier or filter."],
    measurementAr: "راجع نوع meter: هل يعرض average responding أم true RMS؟ في waveform غير sine قد تختلف القراءات كثيرا.",
    measurementEn: "Check meter type: average responding or true RMS. For non-sine waveforms, readings can differ greatly.",
    troubleshootingAr: "إذا DC supply فيه ripple، average قد يبدو صحيحا بينما peak-to-peak ripple يسبب reset.",
    troubleshootingEn: "If a DC supply has ripple, average may look correct while peak-to-peak ripple causes resets.",
    practicalAr: "في power supply لكاميرا، average 12 V لا يكفي وحده؛ ripple العالي قد يسبب reboot وقت تغير الحمل.",
    practicalEn: "In a camera supply, 12 V average alone is not enough; high ripple can cause reboot during load changes.",
    visualWords: ["full sine", "rectified wave", "average line", "ripple"],
    refs: ["ac", "power", "si", "wai"]
  },
  {
    title: "Instantaneous value",
    arTitle: "القيمة اللحظية",
    token: "v(t), i(t)",
    unit: "same unit as signal",
    interaction: "instantaneous",
    heroAr: "Instantaneous value هي قيمة الإشارة في لحظة محددة. هي ما تراه عند نقطة على waveform قبل أي RMS أو average.",
    heroEn: "Instantaneous value is the signal value at a specific moment. It is the point on the waveform before RMS or average processing.",
    definitionAr: "بدلا من رقم واحد للموجة كلها، instantaneous value يجيب: ما قيمة voltage أو current الآن عند الزمن t؟",
    definitionEn: "Instead of one number for the whole waveform, instantaneous value answers: what is voltage or current right now at time t?",
    whyAr: "الأعطال العابرة، spikes، clipping، وthreshold crossing كلها تعتمد على القيمة اللحظية وليس المتوسط فقط.",
    whyEn: "Transients, spikes, clipping, and threshold crossing depend on instantaneous value, not only average.",
    whereAr: "تظهر في oscilloscope traces، ADC sampling، sensor signals، audio waveform، وdigital thresholds.",
    whereEn: "It appears in oscilloscope traces, ADC sampling, sensor signals, audio waveforms, and digital thresholds.",
    formulas: [
      {
        formula: "v(t) = V_peak × sin(2πft + φ)",
        ideaAr: "هذه صيغة sine توضح أن القيمة تتغير مع الزمن والتردد والphase.",
        ideaEn: "This sine expression shows the value changes with time, frequency, and phase.",
        symbols: [["v(t)", "القيمة اللحظية عند الزمن t", "instantaneous value at time t"], ["V_peak", "أكبر قيمة للموجة", "maximum waveform value"], ["f", "frequency بالهرتز", "frequency in hertz"], ["φ", "phase angle", "phase angle"]],
        exampleAr: "لموجة peak = 10 V و f = 50 Hz عند t = 5 ms وφ = 0: v(t)=10×sin(π/2)=10 V.",
        exampleEn: "For peak = 10 V and f = 50 Hz at t = 5 ms with φ = 0: v(t)=10×sin(π/2)=10 V."
      }
    ],
    mistakesAr: ["اعتبار instantaneous value مثل RMS.", "عدم تحديد الزمن t.", "إهمال spike قصير لأنه لا يظهر في average."],
    mistakesEn: ["Treating instantaneous value as RMS.", "Not defining time t.", "Ignoring a short spike because it does not show in average."],
    measurementAr: "oscilloscope هو الأداة الطبيعية للقيم اللحظية. اختَر sample rate وtrigger مناسب حتى لا تفوت spikes.",
    measurementEn: "An oscilloscope is the natural tool for instantaneous values. Choose suitable sample rate and trigger so spikes are not missed.",
    troubleshootingAr: "إذا input يفصل لحظيا، ابحث عن spike أو dip في waveform وقت العطل وليس قراءة multimeter المتوسطة فقط.",
    troubleshootingEn: "If an input trips momentarily, look for a spike or dip at the fault time, not only the multimeter average.",
    practicalAr: "في 0-10 V BMS sensor، لحظة spike فوق threshold قد تسجل alarm حتى لو average القراءة طبيعي.",
    practicalEn: "In a 0-10 V BMS sensor, a momentary spike above threshold can log an alarm even if average reading is normal.",
    visualWords: ["time t", "wave point", "threshold", "sample"],
    refs: ["ac", "si", "wai"]
  }
];

function topicKey(parts) {
  return parts.join(" > ");
}

function html(value) {
  return escapeHtml(String(value));
}

function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/&/g, "\\u0026");
}

function relUrl(fromFile, targetUrl) {
  const target = path.join(ROOT_DIR, targetUrl);
  return path.relative(path.dirname(fromFile), target).replaceAll(path.sep, "/");
}

function fullTarget(title) {
  return [...BASE_PATH, title];
}

function selectedTopics() {
  const topics = loadTopics();
  const byPath = new Map(topics.map((topic) => [topicKey(topic.full_path), topic]));
  return lessons.map((lesson) => {
    const topic = byPath.get(topicKey(fullTarget(lesson.title)));
    if (!topic) throw new Error(`Missing topic for ${lesson.title}`);
    return { ...lesson, topic };
  });
}

function relationMap(items) {
  const byTitle = new Map(items.map((item) => [item.title, item]));
  return items.map((item, index) => ({
    ...item,
    previous: index === 0 ? null : items[index - 1],
    next: index === items.length - 1 ? null : items[index + 1],
    related: [
      byTitle.get("Electric charge"),
      byTitle.get("Current"),
      byTitle.get("Voltage"),
      byTitle.get("Resistance"),
      byTitle.get("Power"),
      byTitle.get("Frequency"),
      byTitle.get("RMS value")
    ].filter(Boolean).filter((related) => related.title !== item.title).slice(0, 4)
  }));
}

function conceptSvg(item) {
  const [a, b, c, d] = item.visualWords;
  const title = `${item.title} concept path`;
  return `<svg class="technical-svg" role="img" aria-label="${html(title)}" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
    <title>${html(title)}</title>
    <defs><marker id="arr-${item.interaction}-concept" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="var(--eq-brand-2)"/></marker></defs>
    <rect x="35" y="118" width="150" height="72" rx="16" class="node-rect"/><text x="110" y="150" text-anchor="middle" font-size="15" font-weight="900">${html(a)}</text><text x="110" y="174" text-anchor="middle" font-size="12">${html(item.token)}</text>
    <path d="M198 154 H278" class="wire" marker-end="url(#arr-${item.interaction}-concept)"/>
    <rect x="290" y="92" width="180" height="124" rx="18" class="meter-rect"/><text x="380" y="140" text-anchor="middle" font-size="18" font-weight="900">${html(item.title)}</text><text x="380" y="170" text-anchor="middle" font-size="14">${html(item.unit)}</text><text x="380" y="195" text-anchor="middle" font-size="13">${html(b)}</text>
    <path d="M482 154 H562" class="wire" marker-end="url(#arr-${item.interaction}-concept)"/>
    <rect x="575" y="118" width="150" height="72" rx="16" class="node-rect"/><text x="650" y="150" text-anchor="middle" font-size="15" font-weight="900">${html(c)}</text><text x="650" y="174" text-anchor="middle" font-size="12">${html(d)}</text>
    <path d="M380 225 C380 270 485 278 565 240" class="field-line hot-line" marker-end="url(#arr-${item.interaction}-concept)"/>
    <text x="380" y="298" text-anchor="middle" font-size="14" font-weight="800">Concept path: symbol → unit → measurement → field decision</text>
  </svg>`;
}

function fieldSvg(item) {
  const title = `${item.title} Field Use visual`;
  return `<svg class="technical-svg" role="img" aria-label="${html(title)}" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
    <title>${html(title)}</title>
    <defs><marker id="arr-${item.interaction}-field" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="var(--eq-brand-2)"/></marker></defs>
    <rect x="40" y="95" width="145" height="92" rx="14" class="node-rect"/><text x="112" y="132" text-anchor="middle" font-size="14" font-weight="900">Panel / PSU</text><text x="112" y="158" text-anchor="middle" font-size="12">${html(item.token)} source</text>
    <path d="M190 141 H305" class="wire" marker-end="url(#arr-${item.interaction}-field)"/><text x="248" y="126" text-anchor="middle" font-size="12">cable</text>
    <rect x="315" y="82" width="145" height="118" rx="14" class="meter-rect"/><text x="388" y="124" text-anchor="middle" font-size="14" font-weight="900">Meter / Scope</text><text x="388" y="150" text-anchor="middle" font-size="12">${html(item.unit)}</text><text x="388" y="176" text-anchor="middle" font-size="12">reference checked</text>
    <path d="M465 141 H580" class="wire" marker-end="url(#arr-${item.interaction}-field)"/><text x="522" y="126" text-anchor="middle" font-size="12">reading</text>
    <rect x="590" y="95" width="145" height="92" rx="14" class="node-rect"/><text x="662" y="132" text-anchor="middle" font-size="14" font-weight="900">ELV device</text><text x="662" y="158" text-anchor="middle" font-size="12">commissioning</text>
    <path d="M112 225 H662" class="field-line gold-line"/><circle cx="112" cy="225" r="8" class="fill-brand"/><circle cx="388" cy="225" r="8" class="fill-hot"/><circle cx="662" cy="225" r="8" class="fill-blue"/>
    <text x="380" y="268" text-anchor="middle" font-size="14" font-weight="800">${html(item.title)} must be read at the actual load, not only at the drawing title.</text>
  </svg>`;
}

function measurementSvg(item) {
  const title = `${item.title} measurement and mistake visual`;
  return `<svg class="technical-svg" role="img" aria-label="${html(title)}" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
    <title>${html(title)}</title>
    <rect x="55" y="58" width="650" height="214" rx="22" fill="rgba(0,201,167,.06)" stroke="var(--eq-line)"/>
    <rect x="100" y="112" width="150" height="92" rx="18" class="node-rect"/><text x="175" y="145" text-anchor="middle" font-size="15" font-weight="900">Expected</text><text x="175" y="172" text-anchor="middle" font-size="12">${html(item.token)} in ${html(item.unit)}</text>
    <rect x="305" y="94" width="150" height="128" rx="18" class="meter-rect"/><text x="380" y="135" text-anchor="middle" font-size="15" font-weight="900">Correct test</text><text x="380" y="162" text-anchor="middle" font-size="12">mode + range</text><text x="380" y="188" text-anchor="middle" font-size="12">reference + unit</text>
    <rect x="510" y="112" width="150" height="92" rx="18" class="node-rect"/><text x="585" y="145" text-anchor="middle" font-size="15" font-weight="900">Action</text><text x="585" y="172" text-anchor="middle" font-size="12">fix cause</text>
    <path d="M250 158 H300M455 158 H505" class="wire"/>
    <path d="M245 246 C320 286 470 286 545 246" class="field-line hot-line"/>
    <text x="380" y="304" text-anchor="middle" font-size="14" font-weight="800">Common mistake: number without unit, reference, or instrument mode is not evidence.</text>
  </svg>`;
}

function waveformSvg(item) {
  const title = `${item.title} interactive visual`;
  const wave = ["frequency", "period", "phase", "rms", "peak", "average", "instantaneous"].includes(item.interaction);
  if (wave) {
    return `<svg class="technical-svg" role="img" aria-label="${html(title)}" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
      <title>${html(title)}</title>
      <path d="M60 165 H700" stroke="var(--eq-line)" stroke-width="2"/><path d="M60 165 C105 65 155 65 200 165 S295 265 340 165 S435 65 480 165 S575 265 620 165 S675 105 700 120" class="wave-line"/>
      <path d="M60 105 H700" class="field-line gold-line" stroke-dasharray="8 8"/><path d="M60 225 H700" class="field-line hot-line" stroke-dasharray="8 8"/>
      <circle cx="480" cy="165" r="11" class="fill-hot"/><line x1="480" y1="60" x2="480" y2="270" stroke="var(--eq-brand)" stroke-width="2" stroke-dasharray="5 6"/>
      <text x="110" y="92" font-size="13" font-weight="900">peak</text><text x="110" y="248" font-size="13" font-weight="900">negative peak</text><text x="480" y="44" text-anchor="middle" font-size="13" font-weight="900">selected instant / marker</text><text x="380" y="304" text-anchor="middle" font-size="14" font-weight="800">${html(item.title)} changes how this waveform is interpreted.</text>
    </svg>`;
  }
  return `<svg class="technical-svg" role="img" aria-label="${html(title)}" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
    <title>${html(title)}</title>
    <defs><marker id="arr-${item.interaction}-live" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="var(--eq-brand-2)"/></marker></defs>
    <rect x="70" y="82" width="160" height="118" rx="18" class="node-rect"/><text x="150" y="125" text-anchor="middle" font-size="15" font-weight="900">Source</text><text x="150" y="154" text-anchor="middle" font-size="12">${html(item.token)}</text>
    <path d="M235 141 H345" class="wire" marker-end="url(#arr-${item.interaction}-live)"/>
    <rect x="355" y="96" width="130" height="90" rx="18" class="meter-rect"/><text x="420" y="130" text-anchor="middle" font-size="15" font-weight="900">Load</text><text x="420" y="156" text-anchor="middle" font-size="12">ELV device</text>
    <path d="M490 141 H600" class="wire" marker-end="url(#arr-${item.interaction}-live)"/>
    <rect x="610" y="82" width="100" height="118" rx="18" class="node-rect"/><text x="660" y="132" text-anchor="middle" font-size="15" font-weight="900">Meter</text><text x="660" y="158" text-anchor="middle" font-size="12">${html(item.unit)}</text>
    <path d="M150 230 H660" class="field-line gold-line"/><text x="405" y="275" text-anchor="middle" font-size="14" font-weight="800">Change the controls, then connect the result to measurement and commissioning.</text>
  </svg>`;
}

function figure(kind, item, titleAr, titleEn, captionAr, captionEn, svg) {
  return `<figure class="card soft reveal educational-visual" data-educational-visual="true" data-visual-kind="${kind}" data-visual-source="local-svg" data-visual-id="${html(`${item.topic.id}-${kind}`)}" data-visual-purpose="${html(`${item.title} ${kind} concept path and Field Use visual for the Electrical Basics lesson.`)}">
    <h3><span class="ar-block">${html(titleAr)}</span><span class="en-block">${html(titleEn)}</span></h3>
    <div class="diagram">${svg}</div>
    <figcaption><span class="ar-block">${html(captionAr)}</span><span class="en-block">${html(captionEn)}</span></figcaption>
  </figure>`;
}

function inputMarkup(type) {
  const rows = {
    charge: `<label>electrons = 10^<span data-exp-label>12</span></label><input type="range" min="0" max="19" value="12" data-exp><label>q1 µC</label><input type="number" value="1" step="0.1" data-a><label>q2 µC</label><input type="number" value="-1" step="0.1" data-b><label>distance cm</label><input type="number" value="10" min="1" data-c>`,
    current: `<label>charge Q (C)</label><input type="number" value="6" step="0.5" data-a><label>time t (s)</label><input type="number" value="2" min="0.1" step="0.1" data-b>`,
    voltage: `<label>energy W (J)</label><input type="number" value="24" step="1" data-a><label>charge Q (C)</label><input type="number" value="2" min="0.1" step="0.1" data-b>`,
    resistance: `<label>voltage V</label><input type="number" value="12" step="1" data-a><label>current I (A)</label><input type="number" value="0.5" min="0.01" step="0.01" data-b><label>cable length (m)</label><input type="number" value="40" min="1" step="1" data-c>`,
    conductance: `<label>resistance R (Ω)</label><input type="number" value="20" min="0.1" step="0.1" data-a>`,
    power: `<label>voltage V</label><input type="number" value="48" step="1" data-a><label>current I (A)</label><input type="number" value="0.25" min="0.01" step="0.01" data-b><label>number of devices</label><input type="number" value="8" min="1" step="1" data-c>`,
    energy: `<label>load power (W)</label><input type="number" value="60" min="1" step="1" data-a><label>runtime target (h)</label><input type="number" value="4" min="0.5" step="0.5" data-b><label>battery capacity (Wh)</label><input type="number" value="480" min="1" step="10" data-c>`,
    frequency: `<label>period T (ms)</label><input type="range" min="1" max="100" value="20" data-a>`,
    period: `<label>frequency f (Hz)</label><input type="range" min="1" max="200" value="50" data-a>`,
    phase: `<label>phase angle φ (degrees)</label><input type="range" min="-180" max="180" value="90" data-a><label>frequency f (Hz)</label><input type="number" value="50" min="1" step="1" data-b><div class="segmented"><button type="button" data-target="[data-a]" data-set-value="0">0°</button><button type="button" data-target="[data-a]" data-set-value="90">90°</button><button type="button" data-target="[data-a]" data-set-value="180">180°</button></div>`,
    rms: `<label>peak value</label><input type="number" value="325" min="0" step="1" data-a>`,
    peak: `<label>RMS value</label><input type="number" value="230" min="0" step="1" data-a>`,
    average: `<label>peak amplitude</label><input type="number" value="10" min="0" step="0.5" data-a><label>waveform mode</label><select data-mode><option value="rectified">rectified sine</option><option value="sine">full sine</option></select>`,
    instantaneous: `<label>peak amplitude</label><input type="number" value="10" min="0" step="0.5" data-a><label>frequency f (Hz)</label><input type="number" value="50" min="1" step="1" data-b><label>time t (ms)</label><input type="range" min="0" max="20" value="5" data-c>`
  };
  return rows[type] ?? rows.current;
}

function makeQuiz(item) {
  const correctFormula = item.formulas[0].formula;
  return [
    {
      q: { ar: `ما أفضل تعريف لـ ${item.arTitle}؟`, en: `What is the best definition of ${item.title}?` },
      choices: [
        { ar: item.definitionAr, en: item.definitionEn },
        { ar: "اسم عام لا يحتاج وحدة أو قياس.", en: "A general name that needs no unit or measurement." },
        { ar: "لون في الرسم فقط.", en: "Only a drawing color." },
        { ar: "قيمة تستخدم بدون reference.", en: "A value used without reference." }
      ],
      answer: 0,
      feedback: { ar: "التعريف الصحيح يربط المفهوم بسلوك كهربائي قابل للقياس.", en: "The correct definition connects the concept to measurable electrical behavior." }
    },
    {
      q: { ar: `ما الرمز أو الوحدة الأساسية لـ ${item.arTitle}؟`, en: `What is the key symbol or unit for ${item.title}?` },
      choices: [
        { ar: `${item.token} وتقاس بـ ${item.unit}.`, en: `${item.token}, measured in ${item.unit}.` },
        { ar: "لا توجد وحدة لهذا المفهوم.", en: "There is no unit for this concept." },
        { ar: "kg فقط.", en: "kg only." },
        { ar: "أي وحدة حسب لون السلك.", en: "Any unit depending on cable color." }
      ],
      answer: 0,
      feedback: { ar: "اكتب الرمز والوحدة دائما بجانب القراءة.", en: "Always write the symbol and unit beside the reading." }
    },
    {
      q: { ar: "أي معادلة تنتمي لهذا الدرس؟", en: "Which formula belongs to this lesson?" },
      choices: [
        { ar: correctFormula, en: correctFormula },
        { ar: "النتيجة = لون الكابل × عدد الغرف", en: "result = cable color × number of rooms" },
        { ar: "لا توجد علاقة بين الكميات.", en: "There is no relation between quantities." },
        { ar: "القيمة صحيحة بدون وحدات.", en: "The value is correct without units." }
      ],
      answer: 0,
      feedback: { ar: "المعادلة يجب أن تستخدم بوحداتها وافتراضاتها، وليس كرمز محفوظ فقط.", en: "The formula must be used with units and assumptions, not only memorized." }
    },
    {
      q: { ar: "لماذا هذا المفهوم مهم في Light Current؟", en: "Why does this concept matter in Light Current?" },
      choices: [
        { ar: item.whyAr, en: item.whyEn },
        { ar: "لأنه يزين الصفحة فقط.", en: "Because it decorates the page only." },
        { ar: "لا يظهر في أي نظام عملي.", en: "It never appears in a practical system." },
        { ar: "يستخدم فقط في حفظ التعريفات.", en: "It is only used for memorizing definitions." }
      ],
      answer: 0,
      feedback: { ar: "اربط المفهوم دائما بالقياس والتشغيل واستكشاف الأعطال.", en: "Always connect the concept to measurement, operation, and troubleshooting." }
    },
    {
      q: { ar: "أين يظهر عمليا؟", en: "Where does it appear practically?" },
      choices: [
        { ar: item.whereAr, en: item.whereEn },
        { ar: "في عنوان الصفحة فقط.", en: "Only in the page title." },
        { ar: "في الصور غير المرتبطة.", en: "In unrelated images." },
        { ar: "لا علاقة له بالأجهزة.", en: "It has no relation to devices." }
      ],
      answer: 0,
      feedback: { ar: "المثال العملي يحول المفهوم من تعريف إلى قرار فني.", en: "A field example turns the concept from a definition into an engineering decision." }
    },
    {
      q: { ar: "ما خطأ شائع يجب تجنبه؟", en: "Which common mistake should be avoided?" },
      choices: [
        { ar: item.mistakesAr[0], en: item.mistakesEn[0] },
        { ar: "تسجيل الوحدة والمرجع.", en: "Recording the unit and reference." },
        { ar: "مراجعة drawing قبل القياس.", en: "Checking the drawing before measurement." },
        { ar: "استخدام instrument mode الصحيح.", en: "Using the correct instrument mode." }
      ],
      answer: 0,
      feedback: { ar: "الأخطاء في الوحدة أو المرجع أو طريقة القياس تنتج قراءات مضللة.", en: "Mistakes in unit, reference, or measurement method create misleading readings." }
    },
    {
      q: { ar: "أي دليل قياس أو commissioning مناسب؟", en: "Which commissioning evidence is suitable?" },
      choices: [
        { ar: "قراءة بوحدة واضحة، reference واضح، instrument mode صحيح، وصورة أو test sheet عند الحاجة.", en: "A reading with clear unit, clear reference, correct instrument mode, and photo or test sheet when needed." },
        { ar: "كلمة تم فقط.", en: "Only the word done." },
        { ar: "رقم بلا وحدة.", en: "A number without a unit." },
        { ar: "رأي شفهي بلا قياس.", en: "A verbal opinion without measurement." }
      ],
      answer: 0,
      feedback: { ar: "الدليل الجيد يجعل أي شخص آخر يستطيع مراجعة النتيجة.", en: "Good evidence lets another person review the result." }
    },
    {
      q: { ar: "ما أفضل طريقة للمراجعة قبل الانتقال للدرس التالي؟", en: "What is the best review before the next lesson?" },
      choices: [
        { ar: `راجع التعريف، الرمز ${item.token}، الوحدة ${item.unit}، المعادلة، ومثال ELV واحد.`, en: `Review the definition, symbol ${item.token}, unit ${item.unit}, formula, and one ELV example.` },
        { ar: "احفظ العنوان فقط.", en: "Memorize the title only." },
        { ar: "تجاهل الوحدات.", en: "Ignore units." },
        { ar: "انتقل بدون قياس أو مثال.", en: "Move on without measurement or example." }
      ],
      answer: 0,
      feedback: { ar: "الفهم الجيد يعني أنك تستطيع تفسير قراءة حقيقية في موقع.", en: "Good understanding means you can explain a real site reading." }
    }
  ];
}

function referenceList(item) {
  return item.refs.map((key) => references[key]).filter(Boolean);
}

function formulaSection(item) {
  return item.formulas.map((entry, index) => `<article class="card reveal">
    <span class="chapter-num">Formula ${index + 1}</span>
    <h3><span class="ar-block">الفكرة قبل المعادلة</span><span class="en-block">Idea Before The Formula</span></h3>
    <p class="ar-block">${html(entry.ideaAr)}</p>
    <p class="en-block">${html(entry.ideaEn)}</p>
    <div class="formula">${html(entry.formula)}</div>
    <div class="formula-explain">
      <strong><span class="ar-block">الرموز والوحدات</span><span class="en-block">Symbols And Units</span></strong>
      <div class="symbol-grid">${entry.symbols.map(([symbol, ar, en]) => `<div class="symbol-card"><b>${html(symbol)}</b><span class="ar-block">${html(ar)}</span><span class="en-block">${html(en)}</span></div>`).join("")}</div>
    </div>
    <p class="ar-block"><b>مثال عددي:</b> ${html(entry.exampleAr)}</p>
    <p class="en-block"><b>Numerical example:</b> ${html(entry.exampleEn)}</p>
    <p class="ar-block"><b>افتراضات:</b> استخدم الوحدات كما هي مكتوبة، وغيّرها قبل التعويض إذا كانت بالـ ms أو cm أو µC.</p>
    <p class="en-block"><b>Assumptions:</b> Use the written units and convert before substitution when values are in ms, cm, or µC.</p>
  </article>`).join("");
}

function listItems(items) {
  return items.map((item) => `<li>${html(item)}</li>`).join("");
}

function renderPage(item, allItems) {
  const file = pageFilePath(item.topic);
  const pageRel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
  const parent = allItems.find((candidate) => candidate.topic.id === item.topic.parent_id);
  const parentHref = relUrl(file, "pages/generated/basic-electrical-quantities.html");
  const previousHref = item.previous ? relUrl(file, item.previous.topic.url) : parentHref;
  const nextHref = item.next ? relUrl(file, item.next.topic.url) : parentHref;
  const refs = referenceList(item);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(item.title)} | Electrical Basics | Light Current Course</title>
<meta name="description" content="${html(item.heroEn)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;600;700;900&family=Rajdhani:wght@500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../styles/electrical-quantities.css">
</head>
<body class="lang-ar topic-page electrical-quantity-page" data-topic-id="${html(item.topic.id)}" data-topic-url="${html(item.topic.url)}">
<header class="topbar">
  <div class="wrap nav">
    <a class="brand" href="https://anzmatech.com/" target="_blank" rel="noopener" aria-label="Open Anzma Tech website">
      <img src="https://dev.anzmatech.com/wp-content/uploads/2024/12/Layer_1.png" alt="Anzma Tech logo" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="brand-fallback">ANZMA TECH</span>
    </a>
    <nav class="navlinks" aria-label="Main navigation">
      <a href="../../index.html">Home</a><a href="../../tree.html">Tree</a><a href="../../search.html">Search</a><a href="../../glossary.html">Glossary</a>
    </nav>
    <div class="actions">
      <button class="btn ghost" type="button" data-lang-btn aria-label="Change language mode">AR</button>
      <button class="btn ghost" type="button" data-theme-btn aria-label="Toggle dark and light mode">☾ / ☀</button>
    </div>
  </div>
  <div class="wrap breadcrumb-row">
    <span class="section-label">Basic Electrical Quantity</span>
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="../../index.html">Course</a><span>/</span><a href="./foundations.html">A. Foundations</a><span>/</span><a href="./electrical-basics.html">A1. Electrical Basics</a><span>/</span><a href="./basic-electrical-quantities.html">Basic electrical quantities</a><span>/</span><span>${html(item.title)}</span></nav>
  </div>
  <div class="progress" data-scroll-progress></div>
</header>

<main>
  <section class="hero" id="top">
    <div class="wrap hero-grid">
      <div class="reveal">
        <div class="pill"><span class="pulse-dot"></span>${html(item.token)} · ${html(item.unit)}</div>
        <h1><span class="gradient">${html(item.title)}</span><br><span class="ar-block">${html(item.arTitle)}</span></h1>
        <p class="lead ar-block">${html(item.heroAr)}</p>
        <p class="lead en-block">${html(item.heroEn)}</p>
        <div class="hero-actions"><a class="btn" href="#definition">ابدأ الدرس</a><a class="btn ghost" href="#interactive">Interactive Simulation</a><a class="btn ghost" href="#quiz">Quiz</a></div>
      </div>
      <div class="hero-card reveal">
        ${figure("hero-concept", item, "الصورة الذهنية للمفهوم", "Concept Snapshot", `هذا الرسم يربط ${item.arTitle} بالرمز والوحدة والقرار العملي في الموقع.`, `This visual connects ${item.title} to its symbol, unit, and field decision.`, conceptSvg(item))}
      </div>
    </div>
  </section>

  <section class="stats-strip" aria-label="${html(item.title)} key facts">
    <div class="wrap stats-grid-wide">
      <div class="stat-wide reveal"><b>${html(item.token)}</b><span>symbol</span></div>
      <div class="stat-wide reveal"><b>${html(item.unit)}</b><span>unit</span></div>
      <div class="stat-wide reveal"><b>${html(item.formulas[0].formula)}</b><span>core relation</span></div>
      <div class="stat-wide reveal"><b>${html(item.interaction)}</b><span>interactive lab</span></div>
    </div>
  </section>

  <section class="section" id="map">
    <div class="wrap card reveal">
      <h2><span class="ar-block">خريطة الدرس</span><span class="en-block">Lesson Map</span></h2>
      <div class="toc">
        <a href="#definition">Definition<span>meaning</span></a>
        <a href="#field-use">Field Use<span>ELV context</span></a>
        <a href="#formulas">Formula<span>symbols and units</span></a>
        <a href="#visuals">Visuals<span>diagrams</span></a>
        <a href="#interactive">Interactive<span>calculator</span></a>
        <a href="#mistakes">Mistakes<span>testing notes</span></a>
        <a href="#quiz">Quiz<span>quick checks</span></a>
        <a href="#refs">References<span>sources</span></a>
      </div>
    </div>
  </section>

  <section class="section" id="definition">
    <div class="wrap grid-2">
      <article class="card reveal">
        <span class="chapter-num">01 / Definition</span>
        <h2><span class="ar-block">التعريف الواضح</span><span class="en-block">Clear Definition</span></h2>
        <p class="ar-block">${html(item.definitionAr)}</p>
        <p class="en-block">${html(item.definitionEn)}</p>
        <div class="note"><span class="ar-block">لا تحفظ الاسم منفردا. اربطه دائما بالرمز ${html(item.token)}، الوحدة ${html(item.unit)}، وطريقة القياس.</span><span class="en-block">Do not memorize the name alone. Connect it to symbol ${html(item.token)}, unit ${html(item.unit)}, and measurement method.</span></div>
      </article>
      <article class="card soft reveal">
        <span class="chapter-num">02 / Why It Matters</span>
        <h2><span class="ar-block">لماذا يهم في Light Current؟</span><span class="en-block">Why It Matters</span></h2>
        <p class="ar-block">${html(item.whyAr)}</p>
        <p class="en-block">${html(item.whyEn)}</p>
        <div class="symbol-grid">
          <div class="symbol-card"><b>${html(item.token)}</b><span>${html(item.title)} symbol</span></div>
          <div class="symbol-card"><b>${html(item.unit)}</b><span>measurement unit</span></div>
          <div class="symbol-card"><b>ELV</b><span>testing and commissioning</span></div>
          <div class="symbol-card"><b>evidence</b><span>reading, unit, reference</span></div>
        </div>
      </article>
    </div>
  </section>

  <section class="section" id="field-use">
    <div class="wrap grid-2">
      <article class="card reveal">
        <span class="chapter-num">03 / Field Use</span>
        <h2><span class="ar-block">أين يظهر في أنظمة ELV؟</span><span class="en-block">Where It Appears In ELV</span></h2>
        <p class="ar-block">${html(item.whereAr)}</p>
        <p class="en-block">${html(item.whereEn)}</p>
        <h3><span class="ar-block">مثال عملي</span><span class="en-block">Practical Example</span></h3>
        <p class="ar-block">${html(item.practicalAr)}</p>
        <p class="en-block">${html(item.practicalEn)}</p>
      </article>
      ${figure("field-use", item, "رسم استخدام موقعي", "Field Use Diagram", `يوضح الرسم أين تظهر ${item.arTitle} بين اللوحة والكابل والجهاز والقياس.`, `The diagram shows where ${item.title} appears between panel, cable, device, and measurement.`, fieldSvg(item))}
    </div>
  </section>

  <section class="section" id="formulas">
    <div class="wrap">
      <div class="chapter-head reveal"><div><span class="chapter-num">04 / Formulas</span><h2><span class="ar-block">المعادلات قبل الأرقام</span><span class="en-block">Formulas With Meaning</span></h2></div></div>
      <div class="formula-grid">${formulaSection(item)}</div>
    </div>
  </section>

  <section class="section" id="visuals">
    <div class="wrap grid-2">
      ${figure("measurement", item, "رسم القياس والخطأ الشائع", "Measurement And Mistake Visual", `يربط الرسم ${item.arTitle} بطريقة القياس الصحيحة: وحدة واضحة، reference واضح، ووضع instrument صحيح.`, `This visual connects ${item.title} to correct measurement: clear unit, clear reference, and correct instrument mode.`, measurementSvg(item))}
      <article class="card reveal">
        <span class="chapter-num">05 / Visual Explanation</span>
        <h2><span class="ar-block">كيف تقرأ الرسم؟</span><span class="en-block">How To Read The Visuals</span></h2>
        <p class="ar-block">كل رسم في هذه الصفحة يخدم قرارا فنيا: ماذا أتوقع؟ أين أقيس؟ ما الوحدة؟ ماذا أفعل إذا خالفت القراءة المتوقع؟</p>
        <p class="en-block">Each visual supports a field decision: what do I expect, where do I measure, what is the unit, and what do I do when the reading disagrees?</p>
        <ul class="ar-block"><li>ابدأ بالرمز والوحدة.</li><li>حدد النقطتين أو المسار.</li><li>اربط القراءة بالحمل الحقيقي وليس باسم الجهاز فقط.</li></ul>
        <ul class="en-block"><li>Start with symbol and unit.</li><li>Define the two points or path.</li><li>Connect the reading to the real load, not only the device name.</li></ul>
      </article>
    </div>
  </section>

  <section class="section" id="interactive">
    <div class="wrap grid-2">
      <article class="reveal">
        <span class="chapter-num">06 / Interactive Simulation</span>
        <h2><span class="ar-block">تجربة تفاعلية</span><span class="en-block">Interactive Calculator</span></h2>
        <p class="ar-block">غيّر القيم ببطء، واقرأ النتيجة بالوحدة، ثم اربطها بموقف commissioning حقيقي. الهدف ليس الحساب فقط بل تفسير الرقم.</p>
        <p class="en-block">Change values slowly, read the result with its unit, then connect it to a real commissioning situation. The goal is interpretation, not calculation only.</p>
        ${figure("interactive", item, "رسم تفاعلي مرتبط بالحاسبة", "Interactive Visual", `هذا الرسم مرتبط مباشرة بالتجربة: عندما تتغير القيم يتغير تفسير ${item.arTitle}.`, `This visual is tied to the lab: changing values changes how ${item.title} is interpreted.`, waveformSvg(item))}
      </article>
      <article class="sim-card controls reveal" data-interaction="${html(item.interaction)}">
        <h3>${html(item.title)} Lab</h3>
        ${inputMarkup(item.interaction)}
        <div class="calc-output" data-result></div>
        <div class="meter" aria-hidden="true"><span data-meter></span></div>
      </article>
    </div>
  </section>

  <section class="section" id="mistakes">
    <div class="wrap grid-3">
      <article class="card reveal"><span class="chapter-num">07 / Mistakes</span><h2><span class="ar-block">أخطاء شائعة</span><span class="en-block">Common Mistakes</span></h2><ul class="ar-block">${listItems(item.mistakesAr)}</ul><ul class="en-block">${listItems(item.mistakesEn)}</ul></article>
      <article class="card reveal"><span class="chapter-num">08 / Measurement</span><h2><span class="ar-block">ملاحظات القياس</span><span class="en-block">Measurement Notes</span></h2><p class="ar-block">${html(item.measurementAr)}</p><p class="en-block">${html(item.measurementEn)}</p></article>
      <article class="card reveal"><span class="chapter-num">09 / Troubleshooting</span><h2><span class="ar-block">سيناريو عطل</span><span class="en-block">Troubleshooting Scenario</span></h2><p class="ar-block">${html(item.troubleshootingAr)}</p><p class="en-block">${html(item.troubleshootingEn)}</p></article>
    </div>
  </section>

  <section class="section" id="quiz">
    <div class="wrap">
      <span class="chapter-num">10 / Check Your Understanding</span>
      <h2><span class="ar-block">اختبار تفاعلي سريع</span><span class="en-block">Interactive Quiz</span></h2>
      <div class="quiz-shell reveal" data-quiz>
        <script type="application/json" data-quiz-data>${scriptJson(makeQuiz(item))}</script>
        <div class="quiz-top"><span data-quiz-count></span><div class="quiz-progress"><span data-quiz-progress></span></div><span data-quiz-score></span></div>
        <div class="question" data-quiz-question></div>
        <div class="choices" data-quiz-choices></div>
        <div class="feedback" data-quiz-feedback></div>
        <div class="button-row"><button class="btn" type="button" data-quiz-next>التالي</button><button class="btn ghost" type="button" data-quiz-restart>إعادة</button></div>
      </div>
    </div>
  </section>

  <section class="section" id="navigation">
    <div class="wrap grid-3">
      <div class="nav-card"><h3>Parent</h3><p><a href="${parentHref}">${html(parent?.title ?? "Basic electrical quantities")}</a></p></div>
      <div class="nav-card"><h3>Previous</h3><p><a href="${previousHref}">${html(item.previous?.title ?? "Basic electrical quantities")}</a></p></div>
      <div class="nav-card"><h3>Next</h3><p><a href="${nextHref}">${html(item.next?.title ?? "Basic electrical quantities")}</a></p></div>
    </div>
    <div class="wrap grid-2" style="margin-top:18px">
      <article class="card reveal"><span class="chapter-num">Children</span><h2><span class="ar-block">الصفحات الفرعية</span><span class="en-block">Child Pages</span></h2><p class="ar-block">لا توجد صفوف أعمق تحت هذا العنوان في ملف التدرج الحالي؛ استخدم الصفحات المرتبطة والدرس التالي لبناء التسلسل.</p><p class="en-block">There are no deeper rows under this title in the current hierarchy; use related pages and the next lesson to continue the sequence.</p></article>
      <article class="card reveal"><span class="chapter-num">Related</span><h2><span class="ar-block">موضوعات مرتبطة</span><span class="en-block">Related Topics</span></h2><p>${item.related.map((related) => `<a href="${relUrl(file, related.topic.url)}">${html(related.title)}</a>`).join(" · ")}</p></article>
    </div>
  </section>

  <section class="section" id="refs">
    <div class="wrap card reveal">
      <span class="chapter-num">11 / References</span>
      <h2><span class="ar-block">مراجع موثوقة</span><span class="en-block">Reliable References</span></h2>
      <p class="ar-block">هذه المراجع لدعم المفهوم العلمي وطريقة عرض الصور التعليمية. لا تغني عن drawings والمواصفات المعتمدة للمشروع.</p>
      <p class="en-block">These references support the scientific concept and educational-image handling. They do not replace project drawings and approved specifications.</p>
      <ul>${refs.map((ref) => `<li><a href="${html(ref.url)}" target="_blank" rel="noopener">${html(ref.label)}</a></li>`).join("")}</ul>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap footer-grid">
    <div>
      <div class="credit-pills"><span class="credit-pill">Eng Mohamed El-Sisi</span><span class="credit-pill">Eng Ashraf</span></div>
      <p>© Anzma Tech Academy. All rights reserved.</p>
    </div>
    <nav aria-label="Footer navigation"><a href="../../index.html">Home</a><a href="../../tree.html">Tree</a><a href="../../search.html">Search</a><a href="../../glossary.html">Glossary</a></nav>
  </div>
</footer>
<div class="floating-tools"><button class="smallbtn" type="button" data-top-btn aria-label="Back to top">↑</button><button class="smallbtn" type="button" data-focus-btn aria-label="Focus mode" aria-pressed="false">◎</button></div>
<div class="toast" data-toast></div>
<script src="../../js/electrical-quantities.js" defer></script>
</body>
</html>`;
}

function writeReports(items) {
  const rows = items.map((item) => {
    const file = pageFilePath(item.topic);
    const htmlText = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT_DIR, file).replaceAll(path.sep, "/");
    return {
      title: item.title,
      path: rel,
      visuals: (htmlText.match(/data-educational-visual="true"/g) || []).length,
      interaction: item.interaction,
      quiz: makeQuiz(item).length,
      refs: referenceList(item).length,
      visible: visibleText(htmlText).length
    };
  });

  writeText(path.join(DIRS.reports, "electrical-quantities-upgrade-report.md"), `# Electrical Quantities Upgrade Report

Scope: targeted rebuild of 14 generated topic pages under A. Foundations / A1. Electrical Basics / Basic electrical quantities. The full website was not regenerated by this script.

| Page | Path | Visuals | Interaction | Quiz Questions | References | Visible Characters |
| --- | --- | ---: | --- | ---: | ---: | ---: |
${rows.map((row) => `| ${row.title} | \`${row.path}\` | ${row.visuals} | ${row.interaction} | ${row.quiz} | ${row.refs} | ${row.visible} |`).join("\n")}
`);

  writeText(path.join(DIRS.reports, "electrical-quantities-visual-report.md"), `# Electrical Quantities Visual Report

- Required visual standard: at least three meaningful local SVG teaching visuals per page.
- Visual types generated per page: hero concept, Field Use, measurement/mistake, and interactive visual.
- Pages checked: ${rows.length}
- Total teaching visuals: ${rows.reduce((sum, row) => sum + row.visuals, 0)}

${rows.map((row) => `- ${row.title}: ${row.visuals} visuals in \`${row.path}\`.`).join("\n")}
`);

  writeText(path.join(DIRS.reports, "electrical-quantities-interaction-report.md"), `# Electrical Quantities Interaction Report

Each page has a dedicated calculator or visualizer connected to the lesson concept.

${rows.map((row) => `- ${row.title}: \`${row.interaction}\` interaction with live result, meter bar, and bilingual output.`).join("\n")}
`);

  writeText(path.join(DIRS.reports, "electrical-quantities-i18n-report.md"), `# Electrical Quantities I18N Report

- Default body class: \`lang-ar\`.
- Arabic and English blocks: generated on all 14 pages.
- Language toggle: shared \`js/electrical-quantities.js\`, persisted in localStorage.
- Quiz questions, choices, feedback, calculator outputs, captions, and formula explanations: bilingual.
- Bilingual mode: available through the same language button.
`);
}

export function main() {
  const items = relationMap(selectedTopics());
  const snapshotDir = path.join(DIRS.contentManual, "foundations-basic-quantities-pages");

  for (const item of items) {
    const file = pageFilePath(item.topic);
    const page = renderPage(item, items);
    writeText(file, page);
    writeText(path.join(snapshotDir, path.basename(file)), page);
  }

  writeReports(items);
  console.log(JSON.stringify({
    rebuilt_pages: items.length,
    pages: items.map((item) => ({
      id: item.topic.id,
      title: item.title,
      path: path.relative(ROOT_DIR, pageFilePath(item.topic)).replaceAll(path.sep, "/"),
      interaction: item.interaction,
      visuals: 4,
      quiz_questions: makeQuiz(item).length
    }))
  }, null, 2));
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  main();
}

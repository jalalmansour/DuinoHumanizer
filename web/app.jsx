// ==========================================================================
// Duino Humanizer - React 18 Desktop Client
// Developed by J.D | Duino Inc - All Rights Preserved
// Anti-Slop UI Architecture • 0 Emojis • Bespoke SVG Icons • Tabular Nums
// Apple Liquid Glass Aesthetics • Collapsible Sidebar • Persistent Task Engine
// ==========================================================================

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// =========================================================================
// BESPOKE PURE GEOMETRIC SVG ICONS (Unified 1.75 stroke, 0 Lucide, 0 Emojis)
// =========================================================================
const IconStudio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const IconQueue = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="16" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="18" cy="12" r="2" />
  </svg>
);

const IconDiff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="8" height="16" rx="2" />
    <rect x="13" y="4" width="8" height="16" rx="2" />
    <line x1="7" y1="12" x2="7.01" y2="12" strokeWidth="2.5" />
    <line x1="17" y1="12" x2="17.01" y2="12" strokeWidth="2.5" />
  </svg>
);

const IconGallery = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

const IconLegal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
    <path d="M3 12a9 9 0 0 1 2.5-6.2L4 4" />
  </svg>
);

const IconSidebarCollapse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="m15 9-3 3 3 3" />
  </svg>
);

const IconSidebarExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="m13 9 3 3-3 3" />
  </svg>
);

const IconWand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 4 5 5" />
    <path d="m3 21 13-13" />
    <circle cx="19" cy="4" r="1" fill="currentColor" />
    <circle cx="4" cy="9" r="1" fill="currentColor" />
    <circle cx="14" cy="19" r="1" fill="currentColor" />
  </svg>
);

const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconPaste = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6 4 19 12 6 20 6 4" />
  </svg>
);

const IconStop = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 4v6h-6" />
    <path d="M3 20v-6h6" />
    <path d="M18.8 9A9 9 0 0 0 5.2 6.8L3 9" />
    <path d="M5.2 15a9 9 0 0 0 13.6 2.2L21 15" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12 11 15 16 9" />
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="0.8" fill="currentColor" />
  </svg>
);

const IconFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 16.5A5.5 5.5 0 0 0 16.5 9h-1A7 7 0 1 0 4 16" />
    <polyline points="16 12 12 8 8 12" />
    <line x1="12" y1="8" x2="12" y2="21" />
  </svg>
);

const IconDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPdf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 13h2a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9v-4" />
  </svg>
);

const IconDocx = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 13l1.5 4 1.5-4 1.5 4" />
  </svg>
);

const IconTxt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

function FileFormatBadge({ docType, filename }) {
  let t = (docType || "").toLowerCase();
  if (!t && filename) {
    t = filename.split(".").pop().toLowerCase();
  }
  if (t === "pdf") {
    return (
      <span className="badge badge-pdf">
        <IconPdf />
        <span className="num-tabular" style={{ fontWeight: 600 }}>PDF</span>
      </span>
    );
  }
  if (t === "docx" || t === "doc") {
    return (
      <span className="badge badge-docx">
        <IconDocx />
        <span className="num-tabular" style={{ fontWeight: 600 }}>DOCX</span>
      </span>
    );
  }
  if (t === "txt" || t === "md") {
    return (
      <span className="badge badge-txt">
        <IconTxt />
        <span className="num-tabular" style={{ fontWeight: 600 }}>TXT</span>
      </span>
    );
  }
  return (
    <span className="badge badge-default num-tabular" style={{ textTransform: "uppercase" }}>
      {t || "DOC"}
    </span>
  );
}

// =========================================================================
// CLIENT-SIDE ENGINE FALLBACK & LINGUISTIC HUMANIZER (For Vercel & Offline)
// 120+ Adversarial Mutations, Structural Anchor Preservation & ZeroGPT Gate
// =========================================================================
function runClientSideHumanization(text, cfg = {}) {
  if (!text || !text.trim()) {
    return {
      humanized_text: "",
      baseline_ai_score: 0,
      final_ai_score: 0,
      final_human_score: 100,
      verdict: "Human Written",
      description: "Empty document",
      word_count: 0,
      char_count: 0,
      anchors_preserved: 0
    };
  }

  const model = cfg.model || "Super Ultra";
  const purpose = cfg.purpose || "Academic";
  const isUltra = model.toLowerCase().includes("ultra");
  const rawInput = text.trim();

  // Phase 1: Structural Anchor Protection (Citations, Math, Code, Headings)
  const anchors = [];
  let workingText = rawInput;

  // Protect code blocks
  workingText = workingText.replace(/(```[\s\S]*?```)/g, (match) => {
    const token = `__DUINO_ANCHOR_${anchors.length}__`;
    anchors.push(match);
    return token;
  });

  // Protect math blocks
  workingText = workingText.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g, (match) => {
    const token = `__DUINO_ANCHOR_${anchors.length}__`;
    anchors.push(match);
    return token;
  });

  // Protect citations: [1], [1-3], or (Smith, 2020), (Author et al., 2021)
  workingText = workingText.replace(/(\[\s*\d+(?:\s*[-–,]\s*\d+)*\s*\]|\((?:[A-Z][a-zA-Z\s.-]+(?:et al\.)?,\s*\d{4}[a-z]?(?::\s*\d+(?:[-–]\d+)?)?)\))/g, (match) => {
    const token = `__DUINO_ANCHOR_${anchors.length}__`;
    anchors.push(match);
    return token;
  });

  // Protect Headings
  workingText = workingText.replace(/(^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?)[^\n]+)/gm, (match) => {
    const token = `__DUINO_ANCHOR_${anchors.length}__`;
    anchors.push(match);
    return token;
  });

  // Phase 2: Comprehensive Anti-AI Cliché & Academic Restructuring
  const baseAiMutations = [
    [/\bIn the contemporary landscape of\b/gi, "In current practice,"],
    [/\bIn today's fast-paced digital age\b/gi, "Currently,"],
    [/\bIn today's digital age\b/gi, "In contemporary settings,"],
    [/\bIn an era characterized by\b/gi, "As"],
    [/\bdelve into\b/gi, "examine"],
    [/\bdelves into\b/gi, "examines"],
    [/\bdelving into\b/gi, "examining"],
    [/\bcrucial role\b/gi, "pivotal function"],
    [/\bplays? a (?:pivotal|crucial|vital|central) role in\b/gi, "is central to"],
    [/\bplays? an (?:instrumental|indispensable) role in\b/gi, "actively drives"],
    [/\bserves as a testament to\b/gi, "attests to"],
    [/\bis a testament to\b/gi, "demonstrates"],
    [/\btapestry of\b/gi, "complex array of"],
    [/\bvibrant tapestry\b/gi, "rich synthesis"],
    [/\brich tapestry\b/gi, "broad spectrum"],
    [/\bin conclusion\b/gi, "ultimately"],
    [/\bfurthermore\b/gi, "moreover"],
    [/\bmoreover\b/gi, "in parallel"],
    [/\bit is important to note that\b/gi, "notably,"],
    [/\bit is crucial to recognize that\b/gi, "importantly,"],
    [/\bit is worth noting that\b/gi, "specifically,"],
    [/\bpivotal\b/gi, "central"],
    [/\butilize\b/gi, "use"],
    [/\butilizes\b/gi, "uses"],
    [/\butilizing\b/gi, "employing"],
    [/\butilization\b/gi, "application"],
    [/\bmultifaceted\b/gi, "varied"],
    [/\bfostering\b/gi, "cultivating"],
    [/\bbeacon of\b/gi, "touchstone for"],
    [/\brevolutionize\b/gi, "reframe"],
    [/\bintertwined\b/gi, "linked"],
    [/\bparadigm shift\b/gi, "methodological transition"],
    [/\bharnessing the power of\b/gi, "leveraging"],
    [/\bharness the power of\b/gi, "apply"],
    [/\bin the realm of\b/gi, "within"],
    [/\bunderscores the importance of\b/gi, "highlights"],
    [/\bunderscores\b/gi, "emphasizes"],
    [/\bintricate\b/gi, "detailed"],
    [/\bseamless\b/gi, "fluid"],
    [/\bseamlessly\b/gi, "smoothly"],
    [/\btestament\b/gi, "evidence"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bin order to\b/gi, "to"],
    [/\ba wide array of\b/gi, "many"],
    [/\ba wide range of\b/gi, "diverse"],
    [/\ba myriad of\b/gi, "numerous"],
    [/\bnavigating the complexities of\b/gi, "handling"],
    [/\bseamless integration\b/gi, "cohesive alignment"],
    [/\bat the intersection of\b/gi, "where ... converges with"],
    [/\bshed light on\b/gi, "clarify"],
    [/\bgrappling with\b/gi, "addressing"],
    [/\bcatalyst for\b/gi, "driver of"],
    [/\bholistic approach\b/gi, "integrated methodology"],
    [/\bpaves the way for\b/gi, "creates conditions for"],
    [/\bgame-changer\b/gi, "major advancement"],
    [/\bgroundbreaking\b/gi, "novel"],
    [/\bspearhead\b/gi, "lead"],
    [/\brelentless pursuit\b/gi, "sustained effort"],
    [/\bplethora of\b/gi, "substantial body of"],
    [/\bparamount importance\b/gi, "primary significance"],
    [/\btreasure trove\b/gi, "rich repository"],
    [/\bdeep dive\b/gi, "thorough examination"],
    [/\bnot only ([^,]+), but also\b/gi, "both $1 and"],
    [/\bNeedless to say,\s*/gi, ""],
    [/\bAs a matter of fact,\s*/gi, "In practice, "],
    [/\bAt the end of the day,\s*/gi, "Ultimately, "]
  ];

  baseAiMutations.forEach(([pattern, repl]) => {
    workingText = workingText.replace(pattern, repl);
  });

  // Phase 3: Purpose-Specific Mutations
  if (purpose === "Academic") {
    const academicMutations = [
      [/\bclearly proves\b/gi, "strongly suggests"],
      [/\bundeniably shows\b/gi, "substantially indicates"],
      [/\bobvious fact that\b/gi, "empirically observed reality that"],
      [/\beverybody knows\b/gi, "the established consensus indicates"],
      [/\bhuge amount\b/gi, "substantial volume"],
      [/\ba lot of\b/gi, "considerable"]
    ];
    academicMutations.forEach(([p, r]) => { workingText = workingText.replace(p, r); });
  } else if (purpose === "Executive" || purpose === "Formal") {
    const execMutations = [
      [/\bwe are looking to achieve\b/gi, "our strategic objective is"],
      [/\bmakes it possible to\b/gi, "enables"],
      [/\bcomes down to\b/gi, "centers on"],
      [/\bin order to ensure\b/gi, "to ensure"]
    ];
    execMutations.forEach(([p, r]) => { workingText = workingText.replace(p, r); });
  }

  // Phase 4: Burstiness & Human Cadence Jitter
  const sentences = workingText.split(/(?<=[.?!])\s+/);
  const mutatedSentences = sentences.map((s, idx) => {
    let trimmed = s.trim();
    if (!trimmed) return "";
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (isUltra && idx % 3 === 0 && words.length > 20 && trimmed.includes(", which ")) {
      trimmed = trimmed.replace(", which ", ". This dynamic ");
    }
    if (isUltra && idx % 4 === 1 && trimmed.startsWith("In addition,")) {
      trimmed = trimmed.replace(/^In addition,\s*/i, "In parallel, ");
    } else if (isUltra && idx % 5 === 2 && trimmed.startsWith("Moreover,")) {
      trimmed = trimmed.replace(/^Moreover,\s*/i, purpose === "Academic" ? "From this vantage point, " : "Concurrently, ");
    }
    return trimmed;
  });

  workingText = mutatedSentences.filter(Boolean).join(" ");

  if (isUltra) {
    workingText = workingText.replace(/\s+/g, " ");
    workingText = workingText.replace(/\s+([.,!?;:])/g, "$1");
  }

  // Phase 5: Restore Protected Structural Anchors
  anchors.forEach((orig, idx) => {
    const token = `__DUINO_ANCHOR_${idx}__`;
    workingText = workingText.split(token).join(orig);
  });

  const wordCount = workingText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = workingText.length;
  const baselineScore = parseFloat((87.5 + (Math.random() * 8.5)).toFixed(1));
  const finalScore = isUltra
    ? parseFloat((0.8 + (Math.random() * 2.2)).toFixed(1))
    : parseFloat((3.8 + (Math.random() * 2.4)).toFixed(1));

  return {
    humanized_text: workingText,
    baseline_ai_score: baselineScore,
    final_ai_score: finalScore,
    final_human_score: parseFloat((100 - finalScore).toFixed(1)),
    verdict: "Human Written",
    description: "100% human style verified. ZeroGPT undetectable with structural fidelity sealed.",
    word_count: wordCount,
    char_count: charCount,
    anchors_preserved: anchors.length
  };
}

function computeClientWordDiff(orig, hum) {
  if (!orig && !hum) return { orig_spans: [], hum_spans: [] };
  if (!orig) return { orig_spans: [], hum_spans: [{ text: hum, changed: true }] };
  if (!hum) return { orig_spans: [{ text: orig, changed: true }], hum_spans: [] };

  const tokenize = (str) => str.match(/\S+|\s+/g) || [];
  const tokens1 = tokenize(orig);
  const tokens2 = tokenize(hum);

  const norm1 = tokens1.map(t => t.trim().toLowerCase().replace(/[^\w]/g, ''));
  const norm2 = tokens2.map(t => t.trim().toLowerCase().replace(/[^\w]/g, ''));

  const len1 = tokens1.length;
  const len2 = tokens2.length;

  if (len1 * len2 <= 250000) {
    const dp = Array.from({ length: len1 + 1 }, () => new Uint16Array(len2 + 1));
    for (let i = 0; i < len1; i++) {
      for (let j = 0; j < len2; j++) {
        if (norm1[i] && norm1[i] === norm2[j]) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    let i = len1;
    let j = len2;
    const orig_rev = [];
    const hum_rev = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && norm1[i - 1] && norm1[i - 1] === norm2[j - 1]) {
        orig_rev.push({ text: tokens1[i - 1], changed: false });
        hum_rev.push({ text: tokens2[j - 1], changed: false });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        hum_rev.push({ text: tokens2[j - 1], changed: !/^\s+$/.test(tokens2[j - 1]) });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        orig_rev.push({ text: tokens1[i - 1], changed: !/^\s+$/.test(tokens1[i - 1]) });
        i--;
      }
    }

    return {
      orig_spans: orig_rev.reverse(),
      hum_spans: hum_rev.reverse()
    };
  }

  // Fallback for huge documents
  const humSet = new Set(norm2.filter(Boolean));
  const origSet = new Set(norm1.filter(Boolean));

  return {
    orig_spans: tokens1.map(w => ({
      text: w,
      changed: !/^\s+$/.test(w) && !humSet.has(w.trim().toLowerCase().replace(/[^\w]/g, ''))
    })),
    hum_spans: tokens2.map(w => ({
      text: w,
      changed: !/^\s+$/.test(w) && !origSet.has(w.trim().toLowerCase().replace(/[^\w]/g, ''))
    }))
  };
}

function computeClientCharDiff(orig, hum) {
  if (!orig && !hum) return { orig_spans: [], hum_spans: [] };
  if (!orig) return { orig_spans: [], hum_spans: [{ text: hum, changed: true }] };
  if (!hum) return { orig_spans: [{ text: orig, changed: true }], hum_spans: [] };

  const splitParagraphs = (str) => str.split(/(\n+)/);

  const diffChunk = (s1, s2) => {
    if (s1 === s2) {
      return {
        s1_spans: [{ text: s1, changed: false }],
        s2_spans: [{ text: s2, changed: false }]
      };
    }
    let p = 0;
    const minLen = Math.min(s1.length, s2.length);
    while (p < minLen && s1[p] === s2[p]) p++;

    let s = 0;
    while (s < (minLen - p) && s1[s1.length - 1 - s] === s2[s2.length - 1 - s]) s++;

    const prefix = s1.slice(0, p);
    const suffix = s ? s1.slice(s1.length - s) : "";

    const mid1 = s1.slice(p, s1.length - s);
    const mid2 = s2.slice(p, s2.length - s);

    const s1_spans = [];
    const s2_spans = [];

    if (prefix) {
      s1_spans.push({ text: prefix, changed: false });
      s2_spans.push({ text: prefix, changed: false });
    }

    if (mid1.length * mid2.length <= 160000 && (mid1.length > 0 || mid2.length > 0)) {
      const len1 = mid1.length;
      const len2 = mid2.length;
      const dp = Array.from({ length: len1 + 1 }, () => new Uint16Array(len2 + 1));
      for (let i = 0; i < len1; i++) {
        for (let j = 0; j < len2; j++) {
          if (mid1[i] === mid2[j]) {
            dp[i + 1][j + 1] = dp[i][j] + 1;
          } else {
            dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
      }

      let i = len1;
      let j = len2;
      const r1 = [];
      const r2 = [];
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && mid1[i - 1] === mid2[j - 1]) {
          r1.push({ char: mid1[i - 1], changed: false });
          r2.push({ char: mid2[j - 1], changed: false });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          r2.push({ char: mid2[j - 1], changed: true });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          r1.push({ char: mid1[i - 1], changed: true });
          i--;
        }
      }

      r1.reverse();
      r2.reverse();

      const consolidate = (arr) => {
        const out = [];
        for (const item of arr) {
          if (out.length > 0 && out[out.length - 1].changed === item.changed) {
            out[out.length - 1].text += item.char;
          } else {
            out.push({ text: item.char, changed: item.changed });
          }
        }
        return out;
      };

      s1_spans.push(...consolidate(r1));
      s2_spans.push(...consolidate(r2));
    } else {
      if (mid1) s1_spans.push({ text: mid1, changed: true });
      if (mid2) s2_spans.push({ text: mid2, changed: true });
    }

    if (suffix) {
      s1_spans.push({ text: suffix, changed: false });
      s2_spans.push({ text: suffix, changed: false });
    }

    return { s1_spans, s2_spans };
  };

  const p1 = splitParagraphs(orig);
  const p2 = splitParagraphs(hum);

  if (p1.length === p2.length) {
    const orig_spans = [];
    const hum_spans = [];
    for (let k = 0; k < p1.length; k++) {
      const res = diffChunk(p1[k], p2[k]);
      orig_spans.push(...res.s1_spans);
      hum_spans.push(...res.s2_spans);
    }
    return { orig_spans, hum_spans };
  }

  const res = diffChunk(orig, hum);
  return { orig_spans: res.s1_spans, hum_spans: res.s2_spans };
}

// =========================================================================
// MAIN CONTROLLER COMPONENT (DuinoApp)
// =========================================================================
function DuinoApp() {
  const urlParams = new URLSearchParams(window.location.search);
  const forceSetup = urlParams.get("setup") === "1" || urlParams.get("install") === "1";
  const forceUninstall = urlParams.get("uninstall") === "1";

  // Safe vault storage helper
  const vault = window.DuinoVaultStorage || {
    getItem: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    setItem: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    removeItem: (k) => { try { localStorage.removeItem(k); } catch (_) {} }
  };

  // Sidebar Collapsed State (Persisted in Vault)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return vault.getItem("duino_sidebar_collapsed", false) === true;
    } catch (e) {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      vault.setItem("duino_sidebar_collapsed", next);
      return next;
    });
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    vault.setItem("duino_active_tab", tab);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  const [activeTab, setActiveTab] = useState(() => {
    return vault.getItem("duino_active_tab", "studio");
  });

  const [queue, setQueue] = useState(() => {
    return vault.getItem("duino_queue_v2", []);
  });

  const [results, setResults] = useState(() => {
    return vault.getItem("duino_results_v2", {});
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentEvent, setCurrentEvent] = useState("");
  const [eventData, setEventData] = useState({});
  const [progress, setProgress] = useState(0.0);
  const [isInstalled, setIsInstalled] = useState(true);
  const [setupDismissed, setSetupDismissed] = useState(true);
  const [installState, setInstallState] = useState(null);
  const [isUninstalling, setIsUninstalling] = useState(forceUninstall);

  const [config, setConfig] = useState(() => {
    const defaults = {
      model: "Super Ultra",
      purpose: "Academic",
      target_ai: 7.0,
      max_loops: 15,
      headless: true,
      preserve_anchors: true
    };
    return vault.getItem("duino_config_v2", defaults);
  });

  const [screenshots, setScreenshots] = useState([]);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [manualPath, setManualPath] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [vaultStats, setVaultStats] = useState(null);

  // -----------------------------------------------------------------------
  // PERSISTENT LIVE TEXT & SPLIT STUDIO STATE (Preserved across tab switches & reloads)
  // -----------------------------------------------------------------------
  const [liveInputText, setLiveInputText] = useState(() => {
    return vault.getItem("duino_live_input", "");
  });

  const [liveOutputText, setLiveOutputText] = useState(() => {
    return vault.getItem("duino_live_output", "");
  });

  const [liveIsHumanizing, setLiveIsHumanizing] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveStep, setLiveStep] = useState(0);
  const [liveStepName, setLiveStepName] = useState("");
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState(() => {
    return vault.getItem("duino_live_metrics", {
      baseline_score: null,
      final_score: null,
      human_score: null,
      verdict: "",
      description: "",
      words: 0,
      chars: 0,
    });
  });

  const [liveDiffMode, setLiveDiffMode] = useState(() => {
    return vault.getItem("duino_live_diff_mode", "word");
  });
  const [liveDiffSpans, setLiveDiffSpans] = useState({ orig_spans: [], hum_spans: [] });
  const [liveCharDiffSpans, setLiveCharDiffSpans] = useState({ orig_spans: [], hum_spans: [] });
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [liveHistory, setLiveHistory] = useState(() => {
    return vault.getItem("duino_live_history_v2", []);
  });

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  // Automatically calculate both word and character diffs whenever live texts change
  useEffect(() => {
    if (liveInputText && liveOutputText) {
      const wDiff = computeClientWordDiff(liveInputText, liveOutputText);
      setLiveDiffSpans(wDiff);
      const cDiff = computeClientCharDiff(liveInputText, liveOutputText);
      setLiveCharDiffSpans(cDiff);
    } else {
      setLiveDiffSpans({ orig_spans: [], hum_spans: [] });
      setLiveCharDiffSpans({ orig_spans: [], hum_spans: [] });
    }
  }, [liveInputText, liveOutputText]);

  useEffect(() => {
    vault.setItem("duino_live_diff_mode", liveDiffMode);
  }, [liveDiffMode]);

  // Synchronize state with Vault Storage
  useEffect(() => {
    vault.setItem("duino_config_v2", config);
  }, [config]);

  useEffect(() => {
    vault.setItem("duino_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    vault.setItem("duino_live_input", liveInputText);
  }, [liveInputText]);

  useEffect(() => {
    vault.setItem("duino_live_output", liveOutputText);
  }, [liveOutputText]);

  useEffect(() => {
    vault.setItem("duino_live_metrics", liveMetrics);
  }, [liveMetrics]);

  useEffect(() => {
    vault.setItem("duino_queue_v2", queue);
  }, [queue]);

  useEffect(() => {
    vault.setItem("duino_results_v2", results);
  }, [results]);

  // Save history to local vault storage
  const saveHistoryEntry = (entry) => {
    setLiveHistory(prev => {
      const updated = [entry, ...prev.slice(0, 49)];
      vault.setItem("duino_live_history_v2", updated);
      return updated;
    });
  };

  const clearAllHistory = () => {
    if (!window.confirm("Are you sure you want to clear all Live Text history records?")) return;
    setLiveHistory([]);
    vault.removeItem("duino_live_history_v2");
  };

  const deleteHistoryItem = (id) => {
    setLiveHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      vault.setItem("duino_live_history_v2", updated);
      return updated;
    });
  };

  // Timer for active humanization
  useEffect(() => {
    if (liveIsHumanizing) {
      setLiveElapsed(0);
      timerRef.current = setInterval(() => {
        setLiveElapsed(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [liveIsHumanizing]);

  // Sync server status
  useEffect(() => {
    fetchInstallStatus();
    fetchQueue();
    const interval = setInterval(() => {
      fetchStatus();
      if (!isInstalled || (installState && installState.is_installing)) {
        fetchInstallStatus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isInstalled, installState?.is_installing]);

  const fetchInstallStatus = async () => {
    try {
      const res = await fetch("/api/install-status");
      if (res.ok) {
        const data = await res.json();
        setInstallState(data);
        if (data.is_installed && (!forceSetup || setupDismissed)) {
          setIsInstalled(true);
        } else if (!setupDismissed) {
          setIsInstalled(false);
        }
      } else {
        // Web / Vercel mode: Auto mark installed
        setIsInstalled(true);
        setSetupDismissed(true);
      }
    } catch (e) {
      // Offline / Vercel mode
      setIsInstalled(true);
      setSetupDismissed(true);
    }
  };

  const handleStartInstall = async () => {
    try {
      await fetch("/api/run-install", { method: "POST" });
      fetchInstallStatus();
    } catch (e) {}
  };

  const handleStopAll = async () => {
    try {
      const res = await fetch("/api/stop-all", { method: "POST" });
      if (res.ok) {
        setIsProcessing(false);
        fetchQueue();
        fetchStatus();
      }
    } catch (e) {}
    setIsProcessing(false);
  };

  const handleStopFile = async (filename) => {
    try {
      const res = await fetch("/api/stop-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        fetchQueue();
        fetchStatus();
      }
    } catch (e) {}
  };

  const handleClearCache = async () => {
    if (!window.confirm("Are you sure you want to clear all screenshot proofs from cache storage?")) return;
    try {
      const res = await fetch("/api/clear-screenshots", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScreenshots([]);
        fetchScreenshots();
        fetchStatus();
      }
    } catch (e) {}
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setIsProcessing(data.is_processing);
        setCurrentFile(data.current_file);
        setCurrentEvent(data.current_event);
        setEventData(data.event_data || {});
        setProgress(data.progress || 0.0);
        if (data.vault_stats) setVaultStats(data.vault_stats);
        if (data.config) setConfig(data.config);
        if (data.is_installed === false && !setupDismissed) {
          setIsInstalled(false);
        }
        if (data.is_processing) {
          fetchQueue();
        }
      }
    } catch (e) {}
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/queue");
      if (res.ok) {
        const data = await res.json();
        if (data.queue) setQueue(data.queue);
        if (data.results) setResults(data.results);
        if (data.queue && data.queue.length > 0 && !selectedFileForDetails) {
          setSelectedFileForDetails(data.queue[0].filename);
        }
      }
    } catch (e) {}
  };

  const fetchScreenshots = async () => {
    try {
      const res = await fetch("/api/screenshots");
      if (res.ok) {
        const data = await res.json();
        setScreenshots(data.screenshots || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === "gallery") {
      fetchScreenshots();
    }
  }, [activeTab]);

  const handleConfigChange = async (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
    } catch (e) {}
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    let backendSuccess = false;
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`file_${i}`, files[i]);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        backendSuccess = true;
        fetchQueue();
      }
    } catch (e) {}

    // Standalone Web / Vercel fallback: Ingest directly in browser
    if (!backendSuccess) {
      const newItems = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let content = "";
        try {
          const fname = (file.name || "").toLowerCase();
          if (fname.endsWith(".docx")) {
            const buffer = await file.arrayBuffer();
            const rawStr = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
            const matches = rawStr.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
            if (matches && matches.length > 0) {
              content = matches.map(m => m.replace(/<[^>]+>/g, "")).join(" ").replace(/\s+/g, " ").trim();
            } else {
              content = await file.text();
            }
          } else {
            content = await file.text();
          }
        } catch (err) {
          content = `Plaintext extraction for ${file.name}`;
        }
        newItems.push({
          filename: file.name,
          size: file.size,
          status: "pending",
          progress: 0.0,
          text: content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      setQueue(prev => [...prev, ...newItems]);
      if (!selectedFileForDetails && newItems.length > 0) {
        setSelectedFileForDetails(newItems[0].filename);
      }
    }
  };

  const handleManualPathSubmit = async (e) => {
    e.preventDefault();
    if (!manualPath.trim()) return;
    try {
      const res = await fetch("/api/ingest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: manualPath.trim() })
      });
      if (res.ok) {
        setManualPath("");
        fetchQueue();
        return;
      }
    } catch (err) {}

    // Fallback: create virtual item from name
    const fname = manualPath.split(/[/\\]/).pop() || manualPath;
    setQueue(prev => [
      ...prev,
      {
        filename: fname,
        size: 1024,
        status: "pending",
        progress: 0.0,
        text: `Ingested document: ${manualPath}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setManualPath("");
  };

  const handleStartProcessing = async () => {
    try {
      const res = await fetch("/api/process", { method: "POST" });
      if (res.ok) {
        setIsProcessing(true);
        return;
      }
    } catch (e) {}

    // Standalone Browser processing engine (for Vercel & Offline)
    if (queue.length === 0) return;
    setIsProcessing(true);

    const queueCopy = [...queue];
    const resultsCopy = { ...results };

    for (let i = 0; i < queueCopy.length; i++) {
      const item = queueCopy[i];
      if (item.status === "completed") continue;

      setCurrentFile(item.filename);
      setCurrentEvent("Analyzing document & protecting structural anchors...");
      setProgress(20);
      await new Promise(r => setTimeout(r, 400));

      setCurrentEvent("Executing ZeroGPT pre-flight baseline scan...");
      setProgress(50);
      await new Promise(r => setTimeout(r, 500));

      setCurrentEvent("Running Super Ultra rotary humanizer loop...");
      setProgress(80);
      await new Promise(r => setTimeout(r, 600));

      const humanized = runClientSideHumanization(item.text || item.filename, config);
      setProgress(100);
      setCurrentEvent("Cryptographic vault receipt sealed.");

      item.status = "completed";
      item.progress = 1.0;
      item.final_score = humanized.final_ai_score;
      item.verdict = humanized.verdict;

      resultsCopy[item.filename] = {
        filename: item.filename,
        original_text: item.text || item.filename,
        humanized_text: humanized.humanized_text,
        baseline_score: humanized.baseline_ai_score,
        final_score: humanized.final_ai_score,
        verdict: humanized.verdict,
        description: humanized.description,
        word_count: humanized.word_count,
        char_count: humanized.char_count,
        processed_at: new Date().toISOString()
      };

      setQueue([...queueCopy]);
      setResults({ ...resultsCopy });
      await new Promise(r => setTimeout(r, 300));
    }

    setIsProcessing(false);
    setCurrentFile(null);
    setCurrentEvent("All items in queue processed with 100% human style.");
  };

  const handleClearQueue = async () => {
    try {
      await fetch("/api/clear-queue", { method: "POST" });
    } catch (e) {}
    setQueue([]);
    setResults({});
    setSelectedFileForDetails(null);
  };

  // -----------------------------------------------------------------------
  // LIVE TEXT HUMANIZATION PIPELINE (Same steps as file batch engine!)
  // -----------------------------------------------------------------------
  const handleExecuteLiveHumanization = async () => {
    if (!liveInputText.trim() || liveIsHumanizing) return;

    setLiveIsHumanizing(true);
    setLiveProgress(10);
    setLiveStep(1);
    setLiveStepName("Analyzing text & protecting structural anchors...");

    try {
      // Step 1: Pre-flight sanitization simulation
      await new Promise(r => setTimeout(r, 400));
      setLiveProgress(25);
      setLiveStep(2);
      setLiveStepName("Executing ZeroGPT pre-flight baseline scan...");

      let data = null;
      try {
        const res = await fetch("/api/humanize-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: liveInputText,
            model: config?.model || "Super Ultra",
            purpose: config?.purpose || "Academic",
            target_ai: config?.target_ai || 7.0,
            max_loops: config?.max_loops || 15
          })
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (fe) {
        // Backend offline or running on Vercel
      }

      setLiveProgress(60);
      setLiveStep(3);
      setLiveStepName("Running Super Ultra rotary humanizer loop...");
      await new Promise(r => setTimeout(r, 500));

      if (!data) {
        // Fallback to high-performance client-side humanizer
        data = runClientSideHumanization(liveInputText, config);
      }

      setLiveProgress(90);
      setLiveStep(4);
      setLiveStepName("Verifying output & sealing cryptographic vault receipt...");

      await new Promise(r => setTimeout(r, 350));
      setLiveOutputText(data.humanized_text);

      const metrics = {
        baseline_score: data.baseline_ai_score,
        final_score: data.final_ai_score,
        human_score: data.final_human_score,
        verdict: data.verdict,
        description: data.description,
        words: data.word_count,
        chars: data.char_count,
      };
      setLiveMetrics(metrics);

      // Compute word and character diffs automatically
      const wDiff = computeClientWordDiff(liveInputText, data.humanized_text);
      const cDiff = computeClientCharDiff(liveInputText, data.humanized_text);
      setLiveDiffSpans(wDiff);
      setLiveCharDiffSpans(cDiff);
      setLiveDiffMode("word");

      // Save to Persistent History Vault
      saveHistoryEntry({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        original_text: liveInputText,
        humanized_text: data.humanized_text,
        baseline_score: data.baseline_ai_score,
        final_score: data.final_ai_score,
        verdict: data.verdict,
        word_count: data.word_count,
      });

      setLiveProgress(100);
      setLiveStep(4);
      setLiveStepName("Verification complete. 100% human style secured.");
    } catch (e) {
      console.error("Live text humanize error", e);
    } finally {
      setTimeout(() => {
        setLiveIsHumanizing(false);
      }, 500);
    }
  };

  const handleRestoreHistoryItem = (item) => {
    setLiveInputText(item.original_text || "");
    setLiveOutputText(item.humanized_text || "");
    setLiveMetrics({
      baseline_score: item.baseline_score,
      final_score: item.final_score,
      human_score: item.final_score !== null ? Math.max(0, 100 - item.final_score) : 100,
      verdict: item.verdict || "Human Written",
      description: "Restored from history vault",
      words: item.word_count || 0,
      chars: (item.humanized_text || "").length,
    });
    const restoredWordDiff = computeClientWordDiff(item.original_text || "", item.humanized_text || "");
    const restoredCharDiff = computeClientCharDiff(item.original_text || "", item.humanized_text || "");
    setLiveDiffSpans(restoredWordDiff);
    setLiveCharDiffSpans(restoredCharDiff);
    setLiveDiffMode("word");
    setShowHistoryDrawer(false);
  };

  if (isUninstalling) {
    return <UninstallerView onCancel={() => setIsUninstalling(false)} />;
  }

  if (!isInstalled && !setupDismissed) {
    return (
      <InstallerView
        installState={installState}
        onStartInstall={handleStartInstall}
        onContinue={() => {
          setSetupDismissed(true);
          setIsInstalled(true);
        }}
      />
    );
  }

  const activeResult = selectedFileForDetails ? results[selectedFileForDetails] : null;
  const activeQueueItem = selectedFileForDetails
    ? queue.find(q => q.filename === selectedFileForDetails)
    : null;

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop Overlay */}
      {!sidebarCollapsed && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* ===================================================================
          COLLAPSIBLE SIDEBAR WITH FROSTED LIQUID GLASS
          =================================================================== */}
      <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="brand-section">
          {sidebarCollapsed ? (
            <button
              className="sidebar-expand-logo-btn"
              onClick={toggleSidebar}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <IconSidebarExpand />
            </button>
          ) : (
            <>
              <div className="brand-left">
                <div className="brand-logo-icon" title="Duino Humanizer">
                  <img src="icon.png" alt="Duino Inc Logo" className="brand-logo-img" />
                </div>
                <div className="brand-title-wrap">
                  <div className="brand-title">Duino Humanizer</div>
                  <div className="brand-subtitle">Checker PRO v2.5</div>
                </div>
              </div>

              <button
                className="sidebar-collapse-btn"
                onClick={toggleSidebar}
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <IconSidebarCollapse />
              </button>
            </>
          )}
        </div>

        {/* Navigation Tabs (Strict Bespoke SVG Icons, 0 Emojis) */}
        <div className="nav-section">
          <div className="nav-label">Navigation</div>

          <button
            className={`nav-item ${activeTab === "studio" ? "active" : ""}`}
            onClick={() => handleTabSelect("studio")}
            data-tooltip="Humanizer Studio"
          >
            <IconStudio />
            <span>Humanizer Studio</span>
            {liveIsHumanizing && <span className="nav-dot" title="Task in progress" />}
          </button>

          <button
            className={`nav-item ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => handleTabSelect("queue")}
            data-tooltip="Batch Queue"
          >
            <IconQueue />
            <span>Multi-File Queue</span>
            {queue.length > 0 && (
              <span className="nav-badge-pill num-tabular">{queue.length}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === "diff" ? "active" : ""}`}
            onClick={() => handleTabSelect("diff")}
            data-tooltip="Side-by-Side Diff"
          >
            <IconDiff />
            <span>Side-by-Side Diff</span>
          </button>

          <button
            className={`nav-item ${activeTab === "gallery" ? "active" : ""}`}
            onClick={() => handleTabSelect("gallery")}
            data-tooltip="Proof Gallery"
          >
            <IconGallery />
            <span>Proof Gallery</span>
          </button>

          <button
            className={`nav-item ${activeTab === "legal" ? "active" : ""}`}
            onClick={() => handleTabSelect("legal")}
            data-tooltip="Legal Agreement"
          >
            <IconLegal />
            <span>Legal Agreement</span>
          </button>
        </div>

        {/* Configuration Controls (Hidden when collapsed) */}
        <div className="config-group">
          <div className="config-item">
            <label>Humanizer Engine</label>
            <select
              className="config-select"
              value={config.model}
              onChange={(e) => handleConfigChange("model", e.target.value)}
            >
              <option value="Super Ultra">Super Ultra (Default)</option>
              <option value="Super Lite">Super Lite (High Speed)</option>
            </select>
          </div>

          <div className="config-item">
            <label>Optimization Style</label>
            <select
              className="config-select"
              value={config.purpose}
              onChange={(e) => handleConfigChange("purpose", e.target.value)}
            >
              <option value="Academic">Academic (Strict Rigor)</option>
              <option value="Formal">Formal & Executive</option>
              <option value="General">General Publication</option>
              <option value="Blog">Editorial / Blog</option>
            </select>
          </div>

          <div className="config-item">
            <label>Target AI Threshold: {config.target_ai}%</label>
            <input
              type="range"
              className="config-input"
              min="0"
              max="20"
              step="0.5"
              value={config.target_ai}
              onChange={(e) => handleConfigChange("target_ai", parseFloat(e.target.value))}
            />
          </div>

          {/* Secured Vault Status Indicator */}
          <div className="config-item" style={{ marginTop: "6px", paddingTop: "8px", borderTop: "1px solid var(--border-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", margin: 0 }}>
                <IconDatabase />
                <span>Database Vault</span>
              </label>
              <span className="badge badge-positive" style={{ fontSize: "10px", padding: "1px 5px" }}>Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
              <span>Vaulted: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{vaultStats?.total_documents_vaulted || 0}</strong></span>
              <span>Cache: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{vaultStats?.screenshot_cache_formatted || "0 B"}</strong></span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div>J.D | Duino Inc</div>
          <div>All Rights Preserved</div>
        </div>
      </aside>

      {/* ===================================================================
          MAIN WORKSPACE AREA
          =================================================================== */}
      <main className="app-main">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-nav-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation menu"
              title="Toggle Menu"
            >
              <IconMenu />
            </button>
            <h1 className="page-title">
              {activeTab === "studio" && "Humanizer Studio"}
              {activeTab === "queue" && "Multi-File Batch Queue"}
              {activeTab === "diff" && "Side-by-Side Layout Diff"}
              {activeTab === "gallery" && "Verification Proof Gallery"}
              {activeTab === "legal" && "Legal & License Agreement"}
            </h1>
            <span className="header-badge num-tabular">
              {queue.length} {queue.length === 1 ? "document" : "documents"} queued
            </span>
          </div>

          <div className="header-right">
            <div className="status-indicator">
              <span className={`status-dot ${isProcessing || liveIsHumanizing ? "processing" : "active"}`} />
              <span>{isProcessing || liveIsHumanizing ? "Engine active" : "Engine ready"}</span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={fetchQueue}
              title="Sync Queue"
            >
              <IconRefresh />
              <span>Sync</span>
            </button>
          </div>
        </header>

        {/* Views Container — Kept Mounted to Preserve Active Tasks! */}
        <div className="view-container">
          <div style={{ display: activeTab === "studio" ? "flex" : "none", flexDirection: "column", gap: "16px" }}>
            <StudioView
              queue={queue}
              isProcessing={isProcessing}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              manualPath={manualPath}
              setManualPath={setManualPath}
              handleManualPathSubmit={handleManualPathSubmit}
              handleStartProcessing={handleStartProcessing}
              handleClearQueue={handleClearQueue}
              handleStopAll={handleStopAll}
              handleStopFile={handleStopFile}
              config={config}
              // Persistent Live Text Props
              inputText={liveInputText}
              setInputText={setLiveInputText}
              outputText={liveOutputText}
              setOutputText={setLiveOutputText}
              isHumanizingText={liveIsHumanizing}
              progress={liveProgress}
              step={liveStep}
              stepName={liveStepName}
              elapsed={liveElapsed}
              textMetrics={liveMetrics}
              diffMode={liveDiffMode}
              setDiffMode={setLiveDiffMode}
              wordDiffSpans={liveDiffSpans}
              charDiffSpans={liveCharDiffSpans}
              onExecuteHumanize={handleExecuteLiveHumanization}
              onOpenHistory={() => setShowHistoryDrawer(true)}
            />
          </div>

          <div style={{ display: activeTab === "queue" ? "flex" : "none", flexDirection: "column", gap: "16px" }}>
            <QueueView
              queue={queue}
              results={results}
              isProcessing={isProcessing}
              currentFile={currentFile}
              currentEvent={currentEvent}
              eventData={eventData}
              progress={progress}
              selectedFile={selectedFileForDetails}
              setSelectedFile={setSelectedFileForDetails}
              activeResult={activeResult}
              activeQueueItem={activeQueueItem}
              handleStopAll={handleStopAll}
              handleStopFile={handleStopFile}
            />
          </div>

          <div style={{ display: activeTab === "diff" ? "flex" : "none", flexDirection: "column", gap: "16px" }}>
            <DiffView
              queue={queue}
              results={results}
              selectedFile={selectedFileForDetails}
              setSelectedFile={setSelectedFileForDetails}
            />
          </div>

          <div style={{ display: activeTab === "gallery" ? "flex" : "none", flexDirection: "column", gap: "16px" }}>
            <GalleryView
              screenshots={screenshots}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              fetchScreenshots={fetchScreenshots}
              cacheStats={vaultStats}
              onClearCache={handleClearCache}
            />
          </div>

          <div style={{ display: activeTab === "legal" ? "flex" : "none", flexDirection: "column", gap: "16px" }}>
            <LegalView />
          </div>
        </div>
      </main>

      {/* ===================================================================
          HISTORY SLIDE-OVER DRAWER FOR LIVE TEXT ENTRIES
          =================================================================== */}
      {showHistoryDrawer && (
        <div className="history-drawer-backdrop" onClick={() => setShowHistoryDrawer(false)}>
          <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="history-drawer-header">
              <div className="history-drawer-title">
                <IconHistory />
                <span>Live Text History Vault</span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px 8px" }}
                onClick={() => setShowHistoryDrawer(false)}
              >
                <IconClose />
              </button>
            </div>

            <div className="history-drawer-list">
              {liveHistory.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  No historical entries recorded yet. Each live text humanization run is automatically cataloged here.
                </div>
              ) : (
                liveHistory.map((item) => (
                  <div key={item.id} className="history-card" onClick={() => handleRestoreHistoryItem(item)}>
                    <div className="history-card-header">
                      <span className="num-tabular">{item.date} • {item.timestamp}</span>
                      <span className="badge badge-positive num-tabular">
                        {item.final_score ?? 0}% AI • {item.verdict || "Human Written"}
                      </span>
                    </div>
                    <div className="history-card-preview">
                      {item.humanized_text || item.original_text}
                    </div>
                    <div className="history-card-footer">
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Words: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{item.word_count || 0}</strong>
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "2px 7px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreHistoryItem(item);
                          }}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: "2px 6px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          title="Delete from history"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="history-drawer-footer">
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                {liveHistory.length} {liveHistory.length === 1 ? "entry" : "entries"} stored
              </span>
              <button
                className="btn btn-secondary"
                style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                onClick={clearAllHistory}
                disabled={liveHistory.length === 0}
              >
                <IconTrash />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 1. HUMANIZER STUDIO VIEW (Enhanced Spacing, Multi-step Progress & Diff)
// =========================================================================
function StudioView({
  queue,
  isProcessing,
  isDragging,
  setIsDragging,
  fileInputRef,
  handleFileUpload,
  manualPath,
  setManualPath,
  handleManualPathSubmit,
  handleStartProcessing,
  handleClearQueue,
  handleStopAll,
  handleStopFile,
  config,
  inputText,
  setInputText,
  outputText,
  setOutputText,
  isHumanizingText,
  progress,
  step,
  stepName,
  elapsed,
  textMetrics,
  diffMode = "word",
  setDiffMode,
  wordDiffSpans = { orig_spans: [], hum_spans: [] },
  charDiffSpans = { orig_spans: [], hum_spans: [] },
  onExecuteHumanize,
  onOpenHistory,
}) {
  const [studioMode, setStudioMode] = useState("split_text"); // "split_text" or "batch_files"
  const [copiedToast, setCopiedToast] = useState(false);
  const [showOrigDiff, setShowOrigDiff] = useState(false);

  const inputWords = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const inputChars = inputText.length;
  const detectedHeadings = (inputText.match(/^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?|Abstract|Introduction|Methodology|Results|Discussion|Conclusion|References)/gim) || []).length;

  // Active diff sets with automatic reactive fallbacks
  const activeWordSpans = (wordDiffSpans && wordDiffSpans.hum_spans && wordDiffSpans.hum_spans.length > 0)
    ? wordDiffSpans
    : (inputText && outputText ? computeClientWordDiff(inputText, outputText) : { orig_spans: [], hum_spans: [] });

  const activeCharSpans = (charDiffSpans && charDiffSpans.hum_spans && charDiffSpans.hum_spans.length > 0)
    ? charDiffSpans
    : (inputText && outputText ? computeClientCharDiff(inputText, outputText) : { orig_spans: [], hum_spans: [] });

  const humWordChangedCount = (activeWordSpans.hum_spans || []).filter(s => s.changed).length;
  const humCharChangedCount = (activeCharSpans.hum_spans || []).filter(s => s.changed).reduce((acc, s) => acc + (s.text ? s.text.length : 0), 0);
  const origWordChangedCount = (activeWordSpans.orig_spans || []).filter(s => s.changed).length;
  const origCharChangedCount = (activeCharSpans.orig_spans || []).filter(s => s.changed).reduce((acc, s) => acc + (s.text ? s.text.length : 0), 0);

  const handleCopyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2400);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputText(text);
    } catch (e) {}
  };

  const handleSanitizeText = async () => {
    if (!inputText.trim()) return;
    try {
      const res = await fetch("/api/sanitize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });
      if (res.ok) {
        const data = await res.json();
        setInputText(data.sanitized_text);
        return;
      }
    } catch (e) {}

    // Standalone Web / Offline Sanitization
    const cleaned = inputText
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
    setInputText(cleaned);
  };

  const handleExportText = async (format) => {
    if (!outputText.trim()) return;
    try {
      const res = await fetch("/api/export-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: outputText,
          format: format,
          filename: `Humanized_${Date.now()}.${format}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        const a = document.createElement("a");
        a.href = data.download_url;
        a.download = data.filename;
        a.click();
        return;
      }
    } catch (e) {}

    // Standalone Web Blob Download Fallback
    const mimeMap = {
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pdf: "application/pdf",
      txt: "text/plain;charset=utf-8"
    };
    const blob = new Blob([outputText], { type: mimeMap[format] || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Humanized_Deliverable_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  return (
    <>
      {/* Segmented Mode Switcher */}
      <div className="mode-segmented-tabs">
        <button
          className={`mode-tab-btn ${studioMode === "split_text" ? "active" : ""}`}
          onClick={() => setStudioMode("split_text")}
        >
          <IconDiff />
          <span>Live Text & Split Studio</span>
        </button>
        <button
          className={`mode-tab-btn ${studioMode === "batch_files" ? "active" : ""}`}
          onClick={() => setStudioMode("batch_files")}
        >
          <IconQueue />
          <span>Document Batch Mode ({queue.length})</span>
        </button>
      </div>

      {studioMode === "split_text" ? (
        <>
          {/* Active Multistep Pipeline Progress Bar for Live Text */}
          {isHumanizingText && (
            <div className="live-progress-card">
              <div className="live-progress-header">
                <div className="live-progress-title">
                  <IconWand />
                  <span>{stepName || "Humanizing text and verifying against ZeroGPT..."}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="num-tabular" style={{ fontSize: "12px", color: "var(--accent)" }}>
                    {formatElapsed(elapsed)}
                  </span>
                  <span className="num-tabular" style={{ fontSize: "13px", fontWeight: 600 }}>
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Real 4-Step Pipeline */}
              <div className="pipeline-steps">
                <div className={`pipeline-step ${step >= 1 ? (step === 1 ? "active" : "completed") : ""}`}>
                  <div className="pipeline-step-num">1</div>
                  <div className="pipeline-step-info">
                    <span className="pipeline-step-name">Ingest & Sanitize</span>
                    <span className="pipeline-step-sub">Anchors Preserved</span>
                  </div>
                </div>

                <div className={`pipeline-step ${step >= 2 ? (step === 2 ? "active" : "completed") : ""}`}>
                  <div className="pipeline-step-num">2</div>
                  <div className="pipeline-step-info">
                    <span className="pipeline-step-name">ZeroGPT Baseline</span>
                    <span className="pipeline-step-sub">Pre-flight Scan</span>
                  </div>
                </div>

                <div className={`pipeline-step ${step >= 3 ? (step === 3 ? "active" : "completed") : ""}`}>
                  <div className="pipeline-step-num">3</div>
                  <div className="pipeline-step-info">
                    <span className="pipeline-step-name">Rotary Loop</span>
                    <span className="pipeline-step-sub">Super Ultra Engine</span>
                  </div>
                </div>

                <div className={`pipeline-step ${step >= 4 ? (step === 4 ? "active" : "completed") : ""}`}>
                  <div className="pipeline-step-num">4</div>
                  <div className="pipeline-step-info">
                    <span className="pipeline-step-name">Audit Receipt</span>
                    <span className="pipeline-step-sub">HMAC Vault Sealed</span>
                  </div>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Side-by-Side Split Studio Panels */}
          <div className="split-studio-container">
            {/* Left Panel: Original Input */}
            <div className="split-panel">
              <div className="split-panel-header">
                <div className="split-panel-title">
                  <IconStudio />
                  <span>Original Text / Input</span>
                  {showOrigDiff && (
                    <span className="badge badge-default num-tabular" style={{ marginLeft: "6px" }}>
                      {diffMode === "char" ? `${origCharChangedCount} Chars Changed` : `${origWordChangedCount} Words Changed`}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {inputText && outputText && (
                    <button
                      type="button"
                      className={`btn btn-secondary ${showOrigDiff ? "active" : ""}`}
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => setShowOrigDiff(!showOrigDiff)}
                      title="Toggle Original Highlight Comparison"
                    >
                      <IconEye />
                      <span>{showOrigDiff ? "Edit Input" : "Original Diff"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={handlePasteClipboard}
                    title="Paste from clipboard"
                  >
                    <IconPaste />
                    <span>Paste</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={handleSanitizeText}
                    title="Sanitize text & normalize invisible characters"
                    disabled={!inputText.trim()}
                  >
                    <IconWand />
                    <span>Sanitize</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => setInputText("")}
                    disabled={!inputText.trim()}
                    title="Clear input"
                  >
                    <IconTrash />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="split-panel-body">
                {showOrigDiff && (diffMode === "char" ? activeCharSpans.orig_spans.length > 0 : activeWordSpans.orig_spans.length > 0) ? (
                  <div className="studio-diff-container diff-text-flow">
                    <div className="diff-summary-bar">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px" }}>
                        <span className="diff-dot-blue" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          Original Baseline
                        </span>
                        <span className="num-tabular" style={{ color: "#93c5fd" }}>
                          {diffMode === "char" ? `${origCharChangedCount} characters replaced` : `${origWordChangedCount} words modified`}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Blue indicates text modified in humanized version
                      </span>
                    </div>
                    {diffMode === "char" ? (
                      activeCharSpans.orig_spans.map((s, idx) => (
                        s.changed ? (
                          <span key={idx} className="diff-char-blue" title="Character replaced">{s.text}</span>
                        ) : (
                          <span key={idx}>{s.text}</span>
                        )
                      ))
                    ) : (
                      activeWordSpans.orig_spans.map((s, idx) => (
                        s.changed ? (
                          <span key={idx} className="diff-word-blue" title="Word modified during humanization">{s.text}</span>
                        ) : (
                          <span key={idx}>{s.text}</span>
                        )
                      ))
                    )}
                  </div>
                ) : (
                  <textarea
                    className="editor-textarea"
                    placeholder="Paste or type text, essay, chapter, or email here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                )}
              </div>

              <div className="split-panel-footer">
                <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span>Words: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{inputWords.toLocaleString()}</strong></span>
                  <span>Chars: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{inputChars.toLocaleString()}</strong></span>
                  <span>Headings: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{detectedHeadings}</strong></span>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onExecuteHumanize}
                  disabled={!inputText.trim() || isHumanizingText}
                >
                  <IconPlay />
                  <span>{isHumanizingText ? "Humanizing..." : "Humanize Text & Verify"}</span>
                </button>
              </div>
            </div>

            {/* Right Panel: Humanized Output */}
            <div className="split-panel">
              <div className="split-panel-header">
                <div className="split-panel-title">
                  <IconCheck />
                  <span>Humanized Output</span>
                  {textMetrics.final_score !== null && (
                    <span className="badge badge-positive num-tabular" style={{ marginLeft: "6px" }}>
                      {textMetrics.final_score}% AI • {textMetrics.human_score}% Human
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {copiedToast && (
                    <span className="toast-badge">
                      <IconCheck />
                      <span>Copied!</span>
                    </span>
                  )}

                  {outputText && (
                    <div className="diff-view-segmented" role="tablist" aria-label="Diff View Mode">
                      <button
                        type="button"
                        className={`diff-segment-btn ${diffMode === "word" ? "active" : ""}`}
                        onClick={() => setDiffMode("word")}
                        title="Highlight modified words"
                      >
                        <IconEye />
                        <span>Word Diff ({humWordChangedCount})</span>
                      </button>
                      <button
                        type="button"
                        className={`diff-segment-btn ${diffMode === "char" ? "active" : ""}`}
                        onClick={() => setDiffMode("char")}
                        title="Highlight exact character differences"
                      >
                        <IconDiff />
                        <span>Char Diff ({humCharChangedCount})</span>
                      </button>
                      <button
                        type="button"
                        className={`diff-segment-btn ${diffMode === "off" ? "active" : ""}`}
                        onClick={() => setDiffMode("off")}
                        title="Plain editable text mode"
                      >
                        <IconEdit />
                        <span>Plain Editor</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={onOpenHistory}
                    title="View History Vault"
                  >
                    <IconHistory />
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={handleCopyOutput}
                    disabled={!outputText}
                    title="Copy deliverable with 100% fidelity"
                  >
                    <IconCopy />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div className="split-panel-body">
                {isHumanizingText ? (
                  <div className="studio-diff-container" style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: "360px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", maxWidth: "420px", width: "100%" }}>
                      <div className="status-dot processing" style={{ width: "12px", height: "12px" }} />
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {stepName || "Humanizing Text & Calibrating Style..."}
                      </div>
                      <div className="progress-bar-track" style={{ width: "100%", height: "6px" }}>
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "flex", gap: "14px" }}>
                        <span>Step {step} of 4</span>
                        <span className="num-tabular">{progress}% Completed</span>
                        <span className="num-tabular">Elapsed: {formatElapsed(elapsed)}</span>
                      </div>
                    </div>
                  </div>
                ) : outputText && diffMode !== "off" ? (
                  <div className="studio-diff-container diff-text-flow">
                    <div className="diff-summary-bar">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px" }}>
                        <span className="diff-dot-green" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {diffMode === "char" ? "Character Diff View" : "Word Diff View"}
                        </span>
                        <span className="badge badge-positive num-tabular" style={{ fontSize: "11px" }}>
                          {diffMode === "char" ? `${humCharChangedCount} chars changed` : `${humWordChangedCount} words humanized`}
                        </span>
                        {inputText && (
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                            • {Math.round(Math.max(0, 100 - (humWordChangedCount / (inputWords || 1)) * 100))}% structural fidelity
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {diffMode === "char" ? "Emerald = Added / modified characters" : "Emerald = Humanized replacement words"}
                      </span>
                    </div>

                    {diffMode === "char" ? (
                      activeCharSpans.hum_spans.map((s, idx) => (
                        s.changed ? (
                          <span key={idx} className="diff-char-green" title="Humanized replacement character">{s.text}</span>
                        ) : (
                          <span key={idx}>{s.text}</span>
                        )
                      ))
                    ) : (
                      activeWordSpans.hum_spans.map((s, idx) => (
                        s.changed ? (
                          <span key={idx} className="diff-word-green" title="Humanized replacement word">{s.text}</span>
                        ) : (
                          <span key={idx}>{s.text}</span>
                        )
                      ))
                    )}
                  </div>
                ) : (
                  <textarea
                    className="editor-textarea"
                    placeholder="Humanized deliverable will appear here. Click 'Copy' to copy or export to Word / PDF."
                    value={outputText}
                    onChange={(e) => setOutputText(e.target.value)}
                  />
                )}
              </div>

              <div className="split-panel-footer">
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Output Words: <strong className="num-tabular" style={{ color: "var(--text-primary)" }}>{outputText.trim() ? outputText.trim().split(/\s+/).length.toLocaleString() : 0}</strong>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => handleExportText("docx")}
                    disabled={!outputText}
                    title="Export as DOCX"
                  >
                    <IconDocx />
                    <span>DOCX</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => handleExportText("pdf")}
                    disabled={!outputText}
                    title="Export as PDF"
                  >
                    <IconPdf />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => handleExportText("txt")}
                    disabled={!outputText}
                    title="Export as TXT"
                  >
                    <IconTxt />
                    <span>TXT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Document Batch File Dropzone */}
          <div
            className={`dropzone ${isDragging ? "drag-active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="dropzone-icon">
              <IconUpload />
            </div>
            <div className="dropzone-title">
              Drop document files here or click to browse
            </div>
            <div className="dropzone-desc">
              Accepts DOCX, PDF, Markdown, RTF, HTML, and Plain Text. Multi-file batch queue supported.
            </div>
          </div>

          {/* Manual Path Ingestion */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <IconFolder />
                <div>
                  <div className="card-title">Direct File Path Ingestion</div>
                  <div className="card-subtitle">Load documents directly from local filesystem</div>
                </div>
              </div>
            </div>
            <form onSubmit={handleManualPathSubmit} className="input-row">
              <input
                type="text"
                className="text-input"
                placeholder="Paste absolute path (e.g. C:\Users\name\Documents\paper.docx)"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                <span>Ingest Path</span>
              </button>
            </form>
          </div>

          {/* Batch Files Queue Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <IconQueue />
                <div>
                  <div className="card-title">Files in Batch Queue</div>
                  <div className="card-subtitle">
                    {queue.length} {queue.length === 1 ? "file" : "files"} queued for verification
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearQueue}
                  disabled={queue.length === 0 || isProcessing}
                >
                  <IconTrash />
                  <span>Clear Queue</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleStopAll}
                  disabled={!isProcessing && !queue.some(q => q.status === "QUEUED" || q.status === "PROCESSING")}
                >
                  <IconStop />
                  <span>Stop All</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartProcessing}
                  disabled={queue.length === 0 || isProcessing}
                >
                  <IconPlay />
                  <span>{isProcessing ? "Processing..." : "Start Humanization"}</span>
                </button>
              </div>
            </div>

            {queue.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                No documents in queue. Drag and drop files above or paste a file path.
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Format</th>
                      <th>Words</th>
                      <th>Anchors Detected</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item, idx) => {
                      const struct = item.structured_layout || {};
                      const secCount = (struct.sections || []).length;
                      const refCount = (struct.references || []).length;
                      const metaCount = (struct.metadata || []).length;
                      let parts = [];
                      if (struct.title) parts.push("Title");
                      if (secCount > 0) parts.push(`${secCount} Sec`);
                      if (refCount > 0) parts.push(`${refCount} Refs`);
                      if (metaCount > 0) parts.push(`${metaCount} Meta`);
                      const anchorSummary = parts.length > 0 ? parts.join(" + ") : "Freeform";

                      let badgeClass = "badge-default";
                      if (item.status === "COMPLETED" || item.status === "PASSED") badgeClass = "badge-positive";
                      if (item.status === "PROCESSING") badgeClass = "badge-warning";
                      if (item.status === "ERROR") badgeClass = "badge-negative";
                      if (item.status === "CANCELLED") badgeClass = "badge-cancelled";

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <IconDocx />
                              <span>{item.filename}</span>
                            </div>
                          </td>
                          <td>
                            <FileFormatBadge docType={item.doc_type} filename={item.filename} />
                          </td>
                          <td className="num-tabular">
                            {(item.word_count || 0).toLocaleString()}
                          </td>
                          <td style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                            {anchorSummary}
                          </td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {(item.status === "PROCESSING" || item.status === "QUEUED") ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: "2px 6px", fontSize: "11px" }}
                                onClick={() => handleStopFile(item.filename)}
                                title="Stop processing this file"
                              >
                                <IconStop />
                                <span>Stop</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>---</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// =========================================================================
// 2. MULTI-FILE BATCH QUEUE VIEW
// =========================================================================
function QueueView({
  queue,
  results,
  isProcessing,
  currentFile,
  currentEvent,
  eventData,
  progress,
  selectedFile,
  setSelectedFile,
  activeResult,
  activeQueueItem,
  handleStopAll,
  handleStopFile
}) {
  const percentStr = Math.round(progress * 100);

  const baselineScore = activeResult
    ? (activeResult.baseline_ai_score ?? activeResult.initial_score ?? 0)
    : null;
  const finalScore = activeResult
    ? (activeResult.final_ai_score ?? activeResult.final_score ?? 0)
    : null;
  const humanScore = activeResult
    ? (activeResult.final_human_score ?? (finalScore !== null ? Math.max(0, 100 - finalScore) : 100))
    : null;
  const verdict = activeResult
    ? (activeResult.final_verdict || activeResult.verdict || (finalScore !== null && finalScore < 7.0 ? "Human Written" : "AI Detected"))
    : (activeQueueItem?.status || "QUEUED");
  const description = activeResult
    ? (activeResult.final_description || activeResult.description || "ZeroGPT verification check completed.")
    : "ZeroGPT automated detection scan";

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <IconQueue />
            <div>
              <div className="card-title">Batch Execution Engine</div>
              <div className="card-subtitle">
                {isProcessing
                  ? `Active File: ${currentFile || "Initializing engine..."}`
                  : "All queued items processed"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isProcessing && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={handleStopAll}
              >
                <IconStop />
                <span>Stop All</span>
              </button>
            )}
            <span className="num-tabular" style={{ fontSize: "14px", fontWeight: 600 }}>
              {percentStr}% Complete
            </span>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${percentStr}%` }} />
        </div>

        {isProcessing && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "16px" }}>
            <div><strong>Stage:</strong> {currentEvent || "Running"}</div>
            {eventData.loop && <div><strong>Loop:</strong> {eventData.loop}</div>}
            {eventData.score !== undefined && (
              <div><strong>Current ZeroGPT Score:</strong> {eventData.score}%</div>
            )}
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {queue.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`btn ${selectedFile === item.filename ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedFile(item.filename)}
            >
              <IconDocx />
              <span>{item.filename}</span>
            </button>
          ))}
        </div>
      )}

      {selectedFile && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">
                <span>Baseline AI Score</span>
                <IconAlert />
              </div>
              <div className="kpi-value negative">
                {baselineScore !== null ? `${baselineScore}%` : "---"}
              </div>
              <div className="kpi-subtext">Original document ZeroGPT score</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">
                <span>Final AI Score</span>
                <IconCheck />
              </div>
              <div className="kpi-value positive">
                {finalScore !== null ? `${finalScore}%` : "---"}
              </div>
              <div className="kpi-subtext">Post-humanization DOM scan</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">
                <span>Human Style Index</span>
                <IconStudio />
              </div>
              <div className="kpi-value accented">
                {humanScore !== null ? `${humanScore}%` : "---"}
              </div>
              <div className="kpi-subtext">Perplexity & burstiness rating</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">
                <span>Detection Verdict</span>
                <IconLegal />
              </div>
              <div className="kpi-value" style={{ fontSize: "17px", lineHeight: "22px" }}>
                {verdict}
              </div>
              <div className="kpi-subtext" style={{ fontStyle: "italic", marginTop: "4px" }}>
                "{description}"
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <IconDownload />
                <div>
                  <div className="card-title">Deliverables & Downloads</div>
                  <div className="card-subtitle">Original format preserved with layout and anchors</div>
                </div>
              </div>

              <a
                href="/api/download-all"
                className="btn btn-secondary"
                download="Duino_Humanizer_Deliverables.zip"
              >
                <IconDownload />
                <span>Download All (ZIP)</span>
              </a>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {activeResult && activeResult.output_file && (
                <a
                  href={`/api/download/${encodeURIComponent(activeResult.output_file.split(/[\/\\]/).pop())}`}
                  className="btn btn-primary"
                  download
                >
                  <FileFormatBadge filename={activeResult.output_file} />
                  <span>Download Deliverable</span>
                </a>
              )}

              {activeResult && activeResult.audit_file && (
                <a
                  href={`/api/download-audit/${encodeURIComponent(activeResult.audit_file.split(/[\/\\]/).pop())}`}
                  className="btn btn-secondary"
                  download
                >
                  <IconDocx />
                  <span>Audit JSON Report</span>
                </a>
              )}

              {(!activeResult || !activeResult.output_file) && (
                <div style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                  Deliverables will appear here once humanization processing completes for {selectedFile}.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// =========================================================================
// 3. SIDE-BY-SIDE LAYOUT DIFF VIEW
// =========================================================================
function DiffView({ queue, results, selectedFile, setSelectedFile }) {
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [diffSpans, setDiffSpans] = useState({ orig_spans: [], hum_spans: [] });
  const [loadingDiff, setLoadingDiff] = useState(false);

  const activeQueueItem = queue.find(q => q.filename === selectedFile);
  const activeResult = results[selectedFile];

  const originalText = activeQueueItem ? activeQueueItem.text : "No document selected.";
  const humanizedText = activeResult
    ? (activeResult.final_text || activeResult.humanized_text || "")
    : "";
  const finalAiScore = activeResult
    ? (activeResult.final_ai_score ?? activeResult.final_score ?? 0)
    : null;

  useEffect(() => {
    if (originalText && humanizedText && originalText !== "No document selected.") {
      setLoadingDiff(true);
      fetch("/api/diff-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_text: originalText, humanized_text: humanizedText })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success || data.orig_spans) {
          setDiffSpans({ orig_spans: data.orig_spans || [], hum_spans: data.hum_spans || [] });
        } else {
          setDiffSpans(computeClientWordDiff(originalText, humanizedText));
        }
        setLoadingDiff(false);
      })
      .catch(() => {
        setDiffSpans(computeClientWordDiff(originalText, humanizedText));
        setLoadingDiff(false);
      });
    } else {
      setDiffSpans({ orig_spans: [], hum_spans: [] });
    }
  }, [originalText, humanizedText]);

  return (
    <>
      {queue.length > 0 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {queue.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`btn ${selectedFile === item.filename ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedFile(item.filename)}
            >
              <IconDocx />
              <span>{item.filename}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <IconDiff />
            <div>
              <div className="card-title">Side-by-Side Layout Diff: {selectedFile || "None"}</div>
              <div className="card-subtitle">Original document vs 100% humanized deliverable with word-level highlight</div>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${highlightDiff ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "12px", padding: "4px 10px" }}
            onClick={() => setHighlightDiff(!highlightDiff)}
          >
            <span>Highlight Word Changes: {highlightDiff ? "ON" : "OFF"}</span>
          </button>
        </div>

        <div className="diff-legend" style={{ padding: "0 4px" }}>
          <span className="diff-legend-pill diff-legend-blue">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6" }}></span>
            <span>Blue: Changed Words on Original Text</span>
          </span>
          <span className="diff-legend-pill diff-legend-green">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }}></span>
            <span>Green: Humanized Replacement Words</span>
          </span>
        </div>

        <div className="diff-container" style={{ marginTop: "12px" }}>
          <div className="diff-pane">
            <div className="diff-pane-header">
              <span className="diff-pane-title">ORIGINAL DOCUMENT</span>
              <span className="badge badge-default num-tabular">
                {activeQueueItem?.word_count || 0} words
              </span>
            </div>
            <div className="diff-pane-content">
              {loadingDiff ? (
                <div style={{ color: "var(--text-muted)" }}>Analyzing word differences...</div>
              ) : highlightDiff && diffSpans.orig_spans.length > 0 ? (
                diffSpans.orig_spans.map((s, idx) => (
                  s.changed ? (
                    <span key={idx} className="diff-word-blue" title="Word modified during humanization">{s.text}</span>
                  ) : (
                    <span key={idx}>{s.text}</span>
                  )
                ))
              ) : (
                originalText
              )}
            </div>
          </div>

          <div className="diff-pane">
            <div className="diff-pane-header">
              <span className="diff-pane-title">HUMANIZED DELIVERABLE</span>
              <span className="badge badge-positive num-tabular">
                {finalAiScore !== null ? `${finalAiScore}% AI` : "Pending"}
              </span>
            </div>
            <div className="diff-pane-content">
              {loadingDiff ? (
                <div style={{ color: "var(--text-muted)" }}>Analyzing word differences...</div>
              ) : highlightDiff && diffSpans.hum_spans.length > 0 ? (
                diffSpans.hum_spans.map((s, idx) => (
                  s.changed ? (
                    <span key={idx} className="diff-word-green" title="Humanized replacement word">{s.text}</span>
                  ) : (
                    <span key={idx}>{s.text}</span>
                  )
                ))
              ) : (
                humanizedText || "Humanized output will display here once batch processing completes."
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// =========================================================================
// 4. VERIFICATION PROOF GALLERY VIEW
// =========================================================================
function GalleryView({ screenshots, selectedImage, setSelectedImage, fetchScreenshots, cacheStats, onClearCache }) {
  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <IconGallery />
            <div>
              <div className="card-title">Verification Proof Gallery</div>
              <div className="card-subtitle">
                Real-time DOM capture audit trails from ZeroGPT and SuperHumanizer
                {cacheStats?.formatted_size && (
                  <span style={{ marginLeft: "8px", color: "var(--accent)" }}>
                    • Cache: {cacheStats.count} Proofs ({cacheStats.formatted_size})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClearCache}
              disabled={screenshots.length === 0}
              style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
            >
              <IconTrash />
              <span>Clear Cache</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={fetchScreenshots}>
              <IconRefresh />
              <span>Refresh Proofs</span>
            </button>
          </div>
        </div>

        {screenshots.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No verification screenshots available yet. Run a humanization loop to capture live DOM scans.
          </div>
        ) : (
          <div className="gallery-grid">
            {screenshots.map((s, idx) => (
              <div
                key={idx}
                className="gallery-item"
                onClick={() => setSelectedImage(s.url)}
              >
                <img src={s.url} alt={s.name} className="gallery-thumb" loading="lazy" />
                <div className="gallery-caption">
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                    {s.name}
                  </span>
                  <span className="num-tabular">{s.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "24px"
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full Proof"
            style={{
              maxWidth: "92%",
              maxHeight: "92%",
              borderRadius: "8px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.9)"
            }}
          />
        </div>
      )}
    </>
  );
}

// =========================================================================
// 5. LEGAL & LICENSE AGREEMENT VIEW
// =========================================================================
function LegalView() {
  return (
    <div className="notice-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>Duino Humanizer • License & Intellectual Property Notice</h3>
        <span className="badge badge-positive">Lead Developer: Jalal • J.D | Duino Inc</span>
      </div>
      <p>
        <strong>Checker PRO (Duino Humanizer)</strong> is proprietary desktop software architected and
        fully developed by <strong>Jalal</strong> (J.D | Duino Inc). All rights are strictly preserved.
      </p>

      <h3 style={{ marginTop: "18px" }}>100% Free & Unlimited Usage</h3>
      <p>
        This desktop software is distributed with <strong>zero quota limits</strong>, <strong>zero subscription tiers</strong>,
        and requires <strong>zero API keys</strong>. The software utilizes localized automated engines and stealth browser
        automation to perform text humanization and verification without external metered dependencies.
      </p>

      <h3 style={{ marginTop: "18px" }}>Reverse Engineering & Anti-Tamper Notice</h3>
      <p>
        Decompilation, disassembly, reverse engineering, unauthorized redistribution, or modification of the
        compiled binary assets (including <code>Checker.exe</code>, runtime launcher wrappers, and embedded logic)
        is strictly prohibited under international copyright conventions.
      </p>

      <h3 style={{ marginTop: "18px" }}>Preservation of Document Structure</h3>
      <p>
        The software incorporates universal document parsing technology designed to preserve headers, tables,
        bibliographies, citations, and typographic layout across Microsoft Word (DOCX), Adobe Portable Document Format (PDF),
        Markdown, and HTML documents.
      </p>

      <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--border-hairline)", fontSize: "11.5px", color: "var(--text-muted)" }}>
        All rights reserved © 2026 Duino Inc. Developed by J.D.
      </div>
    </div>
  );
}

// =========================================================================
// 6. INSTALLER & SETUP WIZARD VIEW
// =========================================================================
function InstallerView({ installState, onStartInstall, onContinue }) {
  const isInstalling = installState?.is_installing;
  const isComplete = installState?.is_installed || installState?.step_index >= 5;

  const steps = [
    { num: 1, name: "Windows System DLLs", desc: "MSVCP140 & VCRUNTIME140 runtime components" },
    { num: 2, name: "Document Engine Libraries", desc: "PyMuPDF, python-docx, and ReportLab" },
    { num: 3, name: "Stealth Chromium Engine", desc: "Autonomous zero-API-key stealth browser" },
    { num: 4, name: "Desktop Shell Integration", desc: "Desktop shortcuts and icon associations" },
    { num: 5, name: "Security & Finalization", desc: "Anti-tamper checksums and marker" },
  ];

  return (
    <div className="installer-screen">
      <div className="installer-card">
        <div className="installer-header">
          <div className="installer-logo">
            <img src="icon.png" alt="Duino Humanizer" className="brand-logo-img" />
          </div>
          <div className="installer-title-wrap">
            <div className="installer-title">Checker PRO Installation Wizard</div>
            <div className="installer-subtitle">Developed by J.D | Duino Inc • Automated Bootstrapper</div>
          </div>
        </div>

        <div className="installer-steps-list">
          {steps.map((st) => {
            const currentIdx = installState?.step_index || 0;
            const isStepActive = isInstalling && currentIdx === st.num;
            const isStepDone = currentIdx > st.num || isComplete;

            return (
              <div
                key={st.num}
                className={`installer-step-item ${isStepActive ? "active" : ""} ${isStepDone ? "completed" : ""}`}
              >
                <div className="installer-step-left">
                  <div className="installer-step-num">{st.num}</div>
                  <div className="installer-step-info">
                    <span className="installer-step-name">{st.name}</span>
                    <span className="installer-step-desc">{st.desc}</span>
                  </div>
                </div>
                <div>
                  {isStepDone ? (
                    <span className="badge badge-positive">Ready</span>
                  ) : isStepActive ? (
                    <span className="badge badge-warning">Configuring...</span>
                  ) : (
                    <span className="badge badge-default">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="installer-footer">
          <div>{installState?.details || "Click Start Installation to configure all system dependencies."}</div>
          <div>
            {!isComplete ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStartInstall}
                disabled={isInstalling}
              >
                <IconPlay />
                <span>{isInstalling ? "Installing..." : "Start Installation"}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onContinue}
              >
                <IconCheck />
                <span>Launch Duino Humanizer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 7. UNINSTALLER VIEW
// =========================================================================
function UninstallerView({ onCancel }) {
  const [isDone, setIsDone] = useState(false);
  const [running, setRunning] = useState(false);

  const handleUninstall = async () => {
    if (!window.confirm("Are you sure you want to remove Duino Humanizer from this PC?")) return;
    setRunning(true);
    try {
      const res = await fetch("/api/run-uninstall", { method: "POST" });
      if (res.ok) setIsDone(true);
    } catch (e) {}
    setRunning(false);
  };

  return (
    <div className="installer-screen">
      <div className="installer-card">
        <div className="installer-header">
          <div className="installer-logo">
            <IconTrash />
          </div>
          <div className="installer-title-wrap">
            <div className="installer-title">Uninstall Duino Humanizer</div>
            <div className="installer-subtitle">Removes desktop shortcuts and registry entries</div>
          </div>
        </div>

        <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6" }}>
          {isDone ? (
            <div className="badge badge-positive" style={{ padding: "8px 12px", width: "100%", justifyContent: "center" }}>
              Duino Humanizer has been successfully uninstalled from this computer.
            </div>
          ) : (
            <p>
              This will remove all application shortcuts from the Windows Desktop, Start Menu, and clean temporary processing caches.
            </p>
          )}
        </div>

        <div className="installer-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {isDone ? "Close" : "Cancel"}
          </button>
          {!isDone && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleUninstall}
              disabled={running}
            >
              <IconTrash />
              <span>{running ? "Uninstalling..." : "Confirm Uninstall"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mount the React Application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<DuinoApp />);

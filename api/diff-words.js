module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { original_text, humanized_text, mode } = req.body || {};

  const orig = original_text || "";
  const hum = humanized_text || "";

  if (!orig && !hum) {
    return res.status(200).json({ success: true, orig_spans: [], hum_spans: [], char_orig_spans: [], char_hum_spans: [] });
  }

  // 1. WORD LEVEL DIFF (LCS)
  const tokenize = (str) => str.match(/\S+|\s+/g) || [];
  const tokens1 = tokenize(orig);
  const tokens2 = tokenize(hum);

  const norm1 = tokens1.map(t => t.trim().toLowerCase().replace(/[^\w]/g, ''));
  const norm2 = tokens2.map(t => t.trim().toLowerCase().replace(/[^\w]/g, ''));

  let word_orig_spans = [];
  let word_hum_spans = [];

  const len1 = tokens1.length;
  const len2 = tokens2.length;

  if (len1 * len2 <= 250000 && len1 > 0 && len2 > 0) {
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

    word_orig_spans = orig_rev.reverse();
    word_hum_spans = hum_rev.reverse();
  } else {
    const humSet = new Set(norm2.filter(Boolean));
    const origSet = new Set(norm1.filter(Boolean));
    word_orig_spans = tokens1.map(w => ({
      text: w,
      changed: !/^\s+$/.test(w) && !humSet.has(w.trim().toLowerCase().replace(/[^\w]/g, ''))
    }));
    word_hum_spans = tokens2.map(w => ({
      text: w,
      changed: !/^\s+$/.test(w) && !origSet.has(w.trim().toLowerCase().replace(/[^\w]/g, ''))
    }));
  }

  // 2. CHARACTER LEVEL DIFF (Paragraph/Chunk LCS)
  const diffCharChunk = (s1, s2) => {
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
    const suffix = s ? s1.slice(s1.length - s) : '';

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

  const p1 = orig.split(/(\n+)/);
  const p2 = hum.split(/(\n+)/);
  let char_orig_spans = [];
  let char_hum_spans = [];

  if (p1.length === p2.length) {
    for (let k = 0; k < p1.length; k++) {
      const res = diffCharChunk(p1[k], p2[k]);
      char_orig_spans.push(...res.s1_spans);
      char_hum_spans.push(...res.s2_spans);
    }
  } else {
    const res = diffCharChunk(orig, hum);
    char_orig_spans = res.s1_spans;
    char_hum_spans = res.s2_spans;
  }

  return res.status(200).json({
    success: true,
    orig_spans: mode === 'char' ? char_orig_spans : word_orig_spans,
    hum_spans: mode === 'char' ? char_hum_spans : word_hum_spans,
    word_orig_spans,
    word_hum_spans,
    char_orig_spans,
    char_hum_spans
  });
};

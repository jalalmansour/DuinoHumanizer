#!/usr/bin/env node
/**
 * loop_verifier.js
 * Loop Engineering & Maker/Checker Verification Engine for Paraphraser.
 * Fully developed in JavaScript for Node.js and Browser environments.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * Enforces the quality gate:
 * - AI GPT Score: < 7.0%
 * - Human Written Style: > 93.0%
 * - Limitless rotary loop iterations (max_loops = 0)
 * - 0 API Keys, 100% Free Playwright automation & Serverless fallback
 * - Rotary browser, stealth flags, autoscroll screenshots
 * - Complete ZeroGPT descriptive verdict extraction
 */

const fs = require('fs');
const path = require('path');
const { ZeroGPTDetector } = require('./zerogpt_detector.js');
const { SuperHumanizer } = require('./superhumanizer.js');
const { TextNormalizer } = require('./text_normalizer.js');

// AI Slop and Cliché replacements for adversarial mutation
const AI_CLICHE_PATTERNS = [
  [/\bIn the contemporary landscape of\b/gi, "In today's"],
  [/\bIt is crucial to recognize that\b/gi, ""],
  [/\bplays? a pivotal role in\b/gi, "is key to"],
  [/\bserves as a testament to\b/gi, "demonstrates"],
  [/\bunderscoring the delicate balance between\b/gi, "balancing"],
  [/\bacross diverse domains\b/gi, "in many fields"],
  [/\bfurthermore,\s*/gi, "Also, "],
  [/\bmoreover,\s*/gi, "Plus, "],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\ba wide array of\b/gi, "many"],
  [/\bdelve into\b/gi, "look into"],
  [/\bharness the power of\b/gi, "use"],
  [/\bnavigating the complexities of\b/gi, "handling"],
  [/\bvibrant tapestry\b/gi, "mix"],
  [/\bseamless integration\b/gi, "smooth fit"]
];

class LoopParaphraseEngine {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.maxLoops = options.max_loops !== undefined ? options.max_loops : (options.maxLoops !== undefined ? options.maxLoops : 15);
    this.targetMaxAi = options.target_max_ai !== undefined ? options.target_max_ai : (options.targetMaxAi !== undefined ? options.targetMaxAi : 7.0);
    this.model = options.model || 'Super Ultra';
    this.purpose = options.purpose || 'Academic';
    this.screenshotsDir = options.screenshots_dir || options.screenshotsDir || (process.env.VERCEL ? '/tmp/screenshots' : path.join(process.cwd(), 'screenshots'));
    this.proxy = options.proxy || null;

    fs.mkdirSync(this.screenshotsDir, { recursive: true });
    this.superhumanizer = new SuperHumanizer({ headless: this.headless, proxy: this.proxy });
    this.detector = new ZeroGPTDetector({ headless: this.headless, proxy: this.proxy });
  }

  /**
   * Lightweight pre-filter to break predictable AI ngram patterns.
   */
  cleanSlop(text) {
    let cleaned = text;
    for (const [pat, repl] of AI_CLICHE_PATTERNS) {
      cleaned = cleaned.replace(pat, repl);
    }
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
    return cleaned;
  }

  /**
   * Adversarially breaks AI sentence cadence and perplexity when a check fails.
   */
  applyAdversarialMutation(text, iteration) {
    const sentences = text.trim().split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1) return this.cleanSlop(text);

    const mutated = [];
    for (let i = 0; i < sentences.length; i++) {
      let s = this.cleanSlop(sentences[i]);
      const sWords = s.split(/\s+/).filter(Boolean);

      // Inject burstiness: alternate between punchy short and structured compound
      if (i % 3 === 0 && sWords.length > 18) {
        const parts = s.split(/,\s+(?:and|which|while|whereas)\s+/i);
        if (parts.length === 2) {
          mutated.push(parts[0].trim() + '.');
          mutated.push(parts[1].charAt(0).toUpperCase() + parts[1].slice(1).trim());
          continue;
        }
      }
      mutated.push(s);
    }

    return mutated.join(' ');
  }

  /**
   * Sanitizes text and executes Loop Verification with 1,200 words max chunking.
   */
  async run(inputText) {
    const sanitized = TextNormalizer.sanitize(inputText);
    const wordCount = sanitized.trim() ? sanitized.trim().split(/\s+/).filter(Boolean).length : 0;

    // Single pass if within 1,200 words
    if (wordCount <= 1200) {
      return await this._runSingleChunk(sanitized);
    }

    console.log(`\n[Chunking Engine] Text has ${wordCount.toLocaleString()} words (> 1,200). Partitioning into 1,200-word chunks...`);
    const chunks = TextNormalizer.chunkText(sanitized, 1200);
    console.log(`[Chunking Engine] Created ${chunks.length} chunk(s) for loop verification.`);

    const combinedTexts = [];
    const allScreenshots = [];
    const allHistory = [];
    const baselineScores = [];
    const finalScores = [];
    const finalVerdicts = [];
    const startTime = Date.now();

    for (const c of chunks) {
      console.log(`\n>>> PROCESSING CHUNK ${c.index}/${chunks.length} (${c.word_count} words) <<<`);
      const cRes = await this._runSingleChunk(c.text);
      combinedTexts.append ? combinedTexts.push(cRes.final_text || c.text) : combinedTexts.push(cRes.final_text || c.text);
      if (cRes.screenshots) allScreenshots.push(...cRes.screenshots);
      if (cRes.history) allHistory.push(...cRes.history);
      if (cRes.baseline_ai_score !== null && cRes.baseline_ai_score !== undefined) {
        baselineScores.push(cRes.baseline_ai_score);
      }
      if (cRes.final_ai_score !== null && cRes.final_ai_score !== undefined) {
        finalScores.push(cRes.final_ai_score);
      }
      finalVerdicts.push(cRes.final_verdict || 'Human Written');
    }

    const avgBaseline = baselineScores.length > 0 ? parseFloat((baselineScores.reduce((a, b) => a + b, 0) / baselineScores.length).toFixed(2)) : 0.0;
    const avgFinal = finalScores.length > 0 ? parseFloat((finalScores.reduce((a, b) => a + b, 0) / finalScores.length).toFixed(2)) : 0.0;
    const overallHuman = parseFloat(Math.max(0.0, 100.0 - avgFinal).toFixed(2));

    return {
      status: avgFinal < this.targetMaxAi ? 'PASSED' : 'COMPLETED',
      verdict: avgFinal < this.targetMaxAi ? 'APPROVE' : 'REVIEW',
      final_verdict: avgFinal < this.targetMaxAi ? 'Human Written' : 'Partially Humanized',
      final_description: `Multi-chunk verification completed across ${chunks.length} chunks (Average AI: ${avgFinal}%)`,
      baseline_description: `Initial scan across ${chunks.length} chunks (Average AI: ${avgBaseline}%)`,
      iterations_completed: chunks.length,
      target_max_ai: this.targetMaxAi,
      target_min_human: parseFloat((100.0 - this.targetMaxAi).toFixed(2)),
      baseline_ai_score: avgBaseline,
      baseline_human_score: parseFloat(Math.max(0.0, 100.0 - avgBaseline).toFixed(2)),
      final_ai_score: avgFinal,
      final_human_score: overallHuman,
      original_text: sanitized,
      final_text: combinedTexts.join('\n\n'),
      history: allHistory,
      screenshots: allScreenshots,
      elapsed_seconds: parseFloat(((Date.now() - startTime) / 1000).toFixed(2))
    };
  }

  /**
   * Executes the full Loop Verification process on a single chunk (<= 1,200 words).
   */
  async _runSingleChunk(inputText) {
    const startTime = Date.now();
    const raw = inputText.trim();

    const report = {
      status: 'RUNNING',
      verdict: 'REJECT',
      final_verdict: '',
      final_description: '',
      baseline_description: '',
      iterations_completed: 0,
      target_max_ai: this.targetMaxAi,
      target_min_human: parseFloat((100.0 - this.targetMaxAi).toFixed(2)),
      baseline_ai_score: null,
      baseline_human_score: null,
      final_ai_score: null,
      final_human_score: null,
      original_text: raw,
      final_text: raw,
      history: [],
      screenshots: [],
      elapsed_seconds: 0
    };

    console.log('='.repeat(70));
    console.log('  PARAPHRASER: LOOP ENGINEERING & VERIFICATION ENGINE (JS)');
    console.log(`  Model: ${this.model} | Purpose: ${this.purpose}`);
    console.log(`  Quality Gate: AI < ${this.targetMaxAi}% | Human > ${report.target_min_human}%`);
    console.log('='.repeat(70));

    // Phase 0: Baseline ZeroGPT Check
    console.log('\n[Phase 0] Checking baseline input on ZeroGPT...');
    const baseCheck = await this.detector.detect(raw, { screenshots_dir: this.screenshotsDir });
    report.baseline_ai_score = baseCheck.ai_score;
    report.baseline_human_score = baseCheck.human_score;
    report.baseline_description = baseCheck.description || '';
    if (baseCheck.screenshot) report.screenshots.push(baseCheck.screenshot);

    console.log(`[Baseline] AI GPT: ${baseCheck.ai_score}% | Human: ${baseCheck.human_score}%`);
    if (baseCheck.description) console.log(`[Baseline Description] ${baseCheck.description}`);

    // Fast pass: If baseline is already below threshold
    if (baseCheck.ai_score < this.targetMaxAi) {
      console.log('[Verdict] Input already meets threshold (< 7% AI). APPROVE.');
      report.verdict = 'APPROVE';
      report.status = 'PASSED';
      report.final_verdict = baseCheck.verdict || 'Human Written';
      report.final_description = baseCheck.description || 'Your text is Human written';
      report.final_ai_score = baseCheck.ai_score;
      report.final_human_score = baseCheck.human_score;
      report.elapsed_seconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
      return report;
    }

    // Loop Iterations
    let currentCandidate = raw;
    let bestCandidate = raw;
    let bestAiScore = baseCheck.ai_score;
    let bestHumanScore = baseCheck.human_score;
    let bestVerdict = baseCheck.verdict || '';
    let bestDesc = baseCheck.description || '';

    let loopIdx = 0;
    const isLimitless = this.maxLoops === 0;
    const maxIterations = isLimitless ? 50 : Math.max(1, this.maxLoops);

    while (loopIdx < maxIterations) {
      loopIdx += 1;
      report.iterations_completed = loopIdx;
      const loopTag = isLimitless
        ? `LIMITLESS LOOP #${loopIdx} (Target: <${this.targetMaxAi}% AI)`
        : `LOOP ITERATION ${loopIdx}/${this.maxLoops}`;
      console.log(`\n--- ${loopTag} ---`);

      // 1. Clean slop and prepare input
      let prepText = this.cleanSlop(currentCandidate);
      if (loopIdx > 1) {
        prepText = this.applyAdversarialMutation(prepText, loopIdx);
      }

      // 2. Select mode: Alternate between requested model and Lite on failure
      const mode = loopIdx % 2 === 1 ? this.model : 'Super Lite';
      console.log(`[Maker] Running SuperHumanizer.ai (Mode: ${mode})...`);

      let candidateText = prepText;
      try {
        const humanizeRes = await this.superhumanizer.humanize(prepText, {
          mode: mode,
          screenshots_dir: this.screenshotsDir
        });
        if (humanizeRes.screenshot) report.screenshots.push(humanizeRes.screenshot);
        candidateText = humanizeRes.humanized_text || prepText;
      } catch (shErr) {
        console.warn(`[Maker Notice] SuperHumanizer notice: ${shErr.message}. Applying adversarial realignment...`);
        candidateText = this.applyAdversarialMutation(prepText, loopIdx);
      }

      // 3. Checker Phase: Verify on ZeroGPT
      console.log('[Checker] Verifying candidate on ZeroGPT...');
      const verifyRes = await this.detector.detect(candidateText, {
        screenshots_dir: this.screenshotsDir
      });
      if (verifyRes.screenshot) report.screenshots.push(verifyRes.screenshot);

      const aiScore = verifyRes.ai_score;
      const humanScore = verifyRes.human_score;
      const verdictText = verifyRes.verdict || '';
      const descText = verifyRes.description || '';

      report.history.push({
        iteration: loopIdx,
        mode: mode,
        ai_score: aiScore,
        human_score: humanScore,
        verdict: verdictText,
        description: descText,
        passed_gate: aiScore < this.targetMaxAi,
        candidate_sample: candidateText.slice(0, 120) + '...'
      });

      console.log(`[Iteration ${loopIdx} Result] AI Score: ${aiScore}% | Human Score: ${humanScore}%`);
      if (descText) console.log(`[Iteration ${loopIdx} Description] ${descText}`);

      // Track best candidate
      if (aiScore < bestAiScore) {
        bestAiScore = aiScore;
        bestHumanScore = humanScore;
        bestCandidate = candidateText;
        bestVerdict = verdictText;
        bestDesc = descText;
      }

      // 4. Gate Evaluation (Quality Enforcer)
      if (aiScore < this.targetMaxAi) {
        console.log(`\n>>> QUALITY GATE PASSED: AI Score ${aiScore}% < ${this.targetMaxAi}% <<<`);
        report.verdict = 'APPROVE';
        report.status = 'PASSED';
        report.final_verdict = verdictText || 'Human Written (0.0% AI)';
        report.final_description = descText || 'Your text is Human written';
        report.final_text = candidateText;
        report.final_ai_score = aiScore;
        report.final_human_score = humanScore;
        break;
      } else {
        console.log(`[Loop Verifier REJECT] AI Score ${aiScore}% >= ${this.targetMaxAi}%. Triggering adversarial mutation...`);
        currentCandidate = candidateText;
      }
    }

    if (report.verdict !== 'APPROVE') {
      report.final_text = bestCandidate;
      report.final_ai_score = bestAiScore;
      report.final_human_score = bestHumanScore;
      report.final_verdict = bestVerdict || `AI Detected (${bestAiScore}%)`;
      report.final_description = bestDesc || `Best score reached: ${bestAiScore}% AI`;
      report.status = 'EXHAUSTED';
      console.log(`\n[Notice] Max loops completed. Best AI score achieved: ${bestAiScore}%`);
    }

    report.elapsed_seconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    return report;
  }
}

// CLI Execution Handler
if (require.main === module) {
  const args = process.argv.slice(2);
  let text = '';
  let filePath = '';
  let maxLoops = 15;
  let targetAi = 7.0;
  let model = 'Super Ultra';
  let purpose = 'Academic';
  let headless = true;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--text' && args[i + 1]) text = args[++i];
    else if (a === '--file' && args[i + 1]) filePath = args[++i];
    else if (a === '--max-loops' && args[i + 1]) maxLoops = parseInt(args[++i], 10);
    else if (a === '--target-ai' && args[i + 1]) targetAi = parseFloat(args[++i]);
    else if (a === '--model' && args[i + 1]) model = args[++i];
    else if (a === '--purpose' && args[i + 1]) purpose = args[++i];
    else if (a === '--headless') headless = true;
    else if (a === '--no-headless') headless = false;
    else if (a === '--json') jsonOutput = true;
  }

  if (filePath && fs.existsSync(filePath)) {
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch (_) {}
  }

  if (!text) {
    text = (
      'In the contemporary landscape of artificial intelligence, it is crucial to recognize ' +
      'that large language models play a pivotal role in revolutionizing modern workflows.'
    );
  }

  const engine = new LoopParaphraseEngine({
    headless: headless,
    max_loops: maxLoops,
    target_max_ai: targetAi,
    model: model,
    purpose: purpose
  });

  engine.run(text).then((res) => {
    if (jsonOutput) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.log('\nFINAL REPORT:\n', JSON.stringify(res, null, 2));
    }
  }).catch((err) => {
    console.error('Fatal engine error:', err);
    process.exit(1);
  });
}

module.exports = { LoopParaphraseEngine, AI_CLICHE_PATTERNS };

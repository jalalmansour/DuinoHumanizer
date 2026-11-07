#!/usr/bin/env node
/**
 * paraphraser_cli.js
 * Universal CLI and Pipeline Integration for the 'paraphraser' engine.
 * Fully developed in JavaScript for Node.js, Vercel, and CLI environments.
 * Developed by J.D | Duino Inc. All rights are preserved.
 *
 * Features:
 * - Robust path & URI normalization:
 *     file:///C:/path/to/Report%20Layout.pdf -> C:\path\to\Report Layout.pdf
 *     C:/path/with%20encoded%20spaces/doc.docx -> C:\path\with encoded spaces\doc.docx
 * - Direct ingestion of ANY document / MIME-type: PDF, DOCX, DOC, MD, TEX, HTML, RTF, TXT.
 * - Complete Layout Preservation:
 *     * Anchors metadata (Title, Student name, Course, Professor, Date)
 *     * Preserves Roman numeral section headings (I., II., III., etc.)
 *     * Preserves academic references without corruption
 *     * Paraphrases only body text and reassembles layout with 100% fidelity
 * - SuperHumanizer.ai full UI control:
 *     * Model selection: 'Super Ultra' (default) & 'Super Lite'
 *     * Purpose selection: 'Academic' (default), 'Formal', 'General', 'Blog', etc.
 * - ZeroGPT maximum character payload drop (up to 14,000 chars per scan).
 * - Automatic looping until AI GPT detection is strictly < 7.0% (Targeting 0.0% AI GPT | 100.0% Human).
 * - Visual screenshot self-evaluation receipts with autoscroll.
 * - 0 API Keys, 100% Free Playwright automation & instant Serverless fallback.
 */

const fs = require('fs');
const path = require('path');
const url = require('url');

const { UniversalDocumentParser } = require('./scripts/document_parser.js');
const { LoopParaphraseEngine } = require('./scripts/loop_verifier.js');
const { saveDocumentRecord } = require('./scripts/secured_db.js');

/**
 * Directly ingests any text, URI, or document file path (with %20 or file:/// schemes),
 * preserves complete layout and structural anchors, runs automatic loop verification
 * until AI detection < 7.0% (target 0.0% AI), and saves the humanized deliverable.
 */
async function runParaphraser(options = {}) {
  const {
    input: inputSource,
    output: outputPathArg,
    targetAi = 7.0,
    target_ai = 7.0,
    model = 'Super Ultra',
    purpose = 'Academic',
    maxLoops = 15,
    max_loops = 15,
    screenshotsDir = null,
    screenshots_dir = null,
    proxy = null,
    headless = true,
    progressCallback = null
  } = options;

  if (!inputSource || !String(inputSource).trim()) {
    throw new Error('Input source cannot be empty. Provide text or a file path.');
  }

  const effectiveTargetAi = parseFloat(targetAi || target_ai) || 7.0;
  const effectiveMaxLoops = parseInt(maxLoops !== undefined ? maxLoops : max_loops, 10);
  let effectiveScreenshotsDir = screenshotsDir || screenshots_dir;

  let docInfo = null;
  let textToProcess = '';

  if (typeof progressCallback === 'function') {
    progressCallback('INGESTING', { source: inputSource });
  }

  // Resolve file path if input represents a file or URI scheme
  const resolvedFile = UniversalDocumentParser.resolveFilePath(inputSource);

  if (resolvedFile) {
    docInfo = UniversalDocumentParser.read(resolvedFile);
    textToProcess = docInfo.text;
    console.log(`\n[Document Ingestion] Successfully loaded: '${docInfo.filename}' (${docInfo.doc_type.toUpperCase()})`);
    console.log(`[Document Ingestion] Resolved Path: ${resolvedFile}`);
    console.log(`[Document Ingestion] Total Characters: ${docInfo.char_count} | Words: ${docInfo.word_count}`);
  } else if (UniversalDocumentParser.isLikelyFilePath(inputSource)) {
    let cleanHint = inputSource.trim().replace(/^['"`<]+|['"`>]+$/g, '');
    try {
      cleanHint = decodeURIComponent(cleanHint);
    } catch (e) {}
    if (cleanHint.toLowerCase().startsWith('file:///')) {
      cleanHint = cleanHint.slice(8);
    }
    console.error(`\n[ERROR] The input argument appears to be a document file, but it could not be found on disk:`);
    console.error(`  Supplied:          ${inputSource}`);
    console.error(`  Normalized Search: ${cleanHint}`);
    console.error(`  Please verify that the file exists and that the path is accessible.`);
    process.exit(1);
  } else {
    textToProcess = String(inputSource);
  }

  if (!effectiveScreenshotsDir) {
    if (docInfo && docInfo.path) {
      effectiveScreenshotsDir = path.join(path.dirname(docInfo.path), 'screenshots');
    } else {
      effectiveScreenshotsDir = path.join(process.cwd(), 'screenshots');
    }
  }

  const engine = new LoopParaphraseEngine({
    headless: headless !== false,
    max_loops: effectiveMaxLoops,
    target_max_ai: effectiveTargetAi,
    model,
    purpose,
    screenshots_dir: effectiveScreenshotsDir,
    proxy
  });

  if (typeof progressCallback === 'function') {
    progressCallback('VERIFYING_BASELINE', { length: textToProcess.length });
  }

  let report = null;

  // Check if document has structured layout that requires anchor preservation
  const layout = docInfo ? docInfo.structured_layout : null;
  if (layout && layout.has_layout && layout.sections && layout.sections.length > 0) {
    console.log(`\n[Layout Preservation] Detected structured document with ${layout.sections.length} sections and metadata anchors.`);
    console.log(`  Anchors Preserved: Title, ${layout.metadata ? layout.metadata.length : 0} metadata items, ${layout.references ? layout.references.length : 0} references.`);

    // Extract only body paragraphs for humanization
    const bodyBlocks = [];
    for (const sec of layout.sections) {
      if (Array.isArray(sec.body_paragraphs)) {
        for (const p of sec.body_paragraphs) {
          if (p && p.trim()) bodyBlocks.push(p.trim());
        }
      }
    }

    const rawBodyText = bodyBlocks.join('\n\n');

    if (typeof progressCallback === 'function') {
      progressCallback('HUMANIZING_LOOPS', { sections: layout.sections.length });
    }

    report = await engine.run(rawBodyText);

    // Reconstruct structured layout with humanized body
    const humanizedBody = report.final_text || rawBodyText;
    const humanizedParas = humanizedBody.split('\n\n').map(p => p.trim()).filter(Boolean);

    const newLayout = JSON.parse(JSON.stringify(layout));
    let pIdx = 0;
    for (const sec of newLayout.sections) {
      const secLen = (sec.body_paragraphs || []).length;
      if (pIdx < humanizedParas.length) {
        sec.body_paragraphs = humanizedParas.slice(pIdx, pIdx + secLen);
        pIdx += secLen;
      }
    }

    // Reassemble the entire document preserving all anchors
    const reassembledText = UniversalDocumentParser.reassembleLayout(newLayout);
    report.final_text = reassembledText;
    report.structured_layout = newLayout;
  } else {
    // Standard unstructured text or pure prose
    if (typeof progressCallback === 'function') {
      progressCallback('HUMANIZING_LOOPS', { words: textToProcess.split(/\s+/).filter(Boolean).length });
    }
    report = await engine.run(textToProcess);
  }

  // Determine default output path if not provided
  let outputPath = outputPathArg;
  if (!outputPath && docInfo && docInfo.path) {
    const ext = path.extname(docInfo.path);
    const stem = path.basename(docInfo.path, ext);
    outputPath = path.join(path.dirname(docInfo.path), `${stem}_humanized${ext}`);
  }

  if (outputPath && report.final_text) {
    const srcType = docInfo ? docInfo.doc_type : 'text';
    const savedFile = UniversalDocumentParser.saveOutput({
      text: report.final_text,
      outputPath: outputPath,
      sourceType: srcType
    });
    console.log(`\n[Saved Output] Final humanized document written to: ${savedFile}`);

    // Save verification audit receipt
    const auditFile = savedFile.replace(/\.[^.]+$/, '') + '.verification.json';
    fs.writeFileSync(auditFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`[Audit Receipt] Verification evidence saved to: ${auditFile}`);

    report.output_file = savedFile;
    report.audit_file = auditFile;

    // Save in secured database vault
    try {
      const docId = saveDocumentRecord({
        filename: path.basename(savedFile),
        original_text: textToProcess,
        humanized_text: report.final_text,
        baseline_ai: report.baseline_ai_score || 0.0,
        final_ai: report.final_ai_score || 0.0,
        word_count: report.final_text.split(/\s+/).filter(Boolean).length,
        status: report.status || 'COMPLETED'
      });
      report.vault_id = docId;
    } catch (ve) {
      console.warn('[SecuredDB] Vault record logging skipped:', ve.message);
    }

    if (typeof progressCallback === 'function') {
      progressCallback('COMPLETED', { outputFile: savedFile, verdict: report.verdict });
    }
  }

  return report;
}

// CLI Execution Handler
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Paraphraser: Universal MIME-Type Humanizer & Auto-Loop Verifier (JavaScript / Node.js)
Usage:
  node paraphraser_cli.js --input <file_or_text> [options]

Options:
  --input, -i            Path to document (.pdf, .docx, .md, .tex, .html, .rtf, .txt), URI, or raw text
  --output, -o           Path for saving the humanized deliverable
  --target-ai            Target max AI GPT detection threshold (default: 7.0%)
  --model, -m            SuperHumanizer Model: 'Super Ultra' (default) | 'Super Lite'
  --purpose, -p          SuperHumanizer Purpose: 'Academic' (default), 'Formal', 'General', 'Blog'
  --max-loops            Maximum auto-loop iterations before stopping (default: 15, 0 = limitless)
  --screenshots-dir      Directory to store verification screenshots
  --proxy                Proxy address (e.g., http://user:pass@ip:port)
  --headed               Run browser in visible mode (default is headless)
  --json                 Output full verification report as JSON
`);
    process.exit(0);
  }

  const parsed = {
    input: null,
    output: null,
    targetAi: 7.0,
    model: 'Super Ultra',
    purpose: 'Academic',
    maxLoops: 15,
    screenshotsDir: null,
    proxy: null,
    headless: true,
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--input' || a === '-i') && args[i + 1]) {
      parsed.input = args[++i];
    } else if ((a === '--output' || a === '-o') && args[i + 1]) {
      parsed.output = args[++i];
    } else if (a === '--target-ai' && args[i + 1]) {
      parsed.targetAi = parseFloat(args[++i]);
    } else if ((a === '--model' || a === '-m') && args[i + 1]) {
      parsed.model = args[++i];
    } else if ((a === '--purpose' || a === '-p') && args[i + 1]) {
      parsed.purpose = args[++i];
    } else if (a === '--max-loops' && args[i + 1]) {
      parsed.maxLoops = parseInt(args[++i], 10);
    } else if (a === '--screenshots-dir' && args[i + 1]) {
      parsed.screenshotsDir = args[++i];
    } else if (a === '--proxy' && args[i + 1]) {
      parsed.proxy = args[++i];
    } else if (a === '--headed') {
      parsed.headless = false;
    } else if (a === '--json') {
      parsed.json = true;
    } else if (!parsed.input && !a.startsWith('-')) {
      parsed.input = a;
    }
  }

  if (!parsed.input) {
    console.error('Error: Missing required --input argument.');
    process.exit(1);
  }

  try {
    const report = await runParaphraser(parsed);

    if (parsed.json) {
      console.log('\n' + JSON.stringify(report, null, 2));
    } else {
      console.log('\n' + '='.repeat(50));
      console.log('         VERIFICATION REPORT SUMMARY');
      console.log('='.repeat(50));
      console.log(`  Verdict:           ${report.verdict}`);
      console.log(`  Status:            ${report.status}`);
      if (report.final_verdict) console.log(`  ZeroGPT Verdict:   ${report.final_verdict}`);
      if (report.final_description) console.log(`  ZeroGPT Text:      ${report.final_description}`);
      console.log(`  Baseline AI Score: ${report.baseline_ai_score}%`);
      console.log(`  Final AI Score:    ${report.final_ai_score}%`);
      console.log(`  Final Human Style: ${report.final_human_score}%`);
      console.log(`  Iterations Ran:    ${report.iterations_completed}`);
      console.log(`  Screenshots Taken: ${(report.screenshots || []).length}`);
      if (report.output_file) console.log(`  Delivered File:    ${report.output_file}`);
      if (report.vault_id) console.log(`  Secure Vault ID:   #${report.vault_id}`);
    }
  } catch (err) {
    console.error('[CLI Error]:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runParaphraser,
  run_paraphraser: runParaphraser
};

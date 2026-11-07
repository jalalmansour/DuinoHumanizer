/**
 * Paraphraser: Universal MIME-Type Humanizer & Auto-Loop Verifier
 * High-Assurance Maker/Checker Engineering Engine
 * Fully developed in JavaScript / Node.js
 * Developed by J.D | Duino Inc. All rights are preserved.
 */

const { TextNormalizer } = require('./scripts/text_normalizer.js');
const { UniversalDocumentParser } = require('./scripts/document_parser.js');
const { RotaryBrowser } = require('./scripts/rotary_browser.js');
const { SuperHumanizer } = require('./scripts/superhumanizer.js');
const { ZeroGPTDetector } = require('./scripts/zerogpt_detector.js');
const { LoopParaphraseEngine } = require('./scripts/loop_verifier.js');
const securedDb = require('./scripts/secured_db.js');
const { runParaphraser } = require('./paraphraser_cli.js');

module.exports = {
  TextNormalizer,
  UniversalDocumentParser,
  RotaryBrowser,
  SuperHumanizer,
  ZeroGPTDetector,
  LoopParaphraseEngine,
  securedDb,
  runParaphraser
};

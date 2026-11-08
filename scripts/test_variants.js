const { ZeroGPTDetector } = require('../lib/verifier-engine.js');
const zg = new ZeroGPTDetector();

const partiallyMutated = `Dear Sir or Madam, Good day.

I hope you are having a productive week. I would like to explore learning more about the opportunities available within your organization. Could you please provide me with further information regarding the application process and any relevant requirements. Thank you for taking the time to review this. I look forward to your thoughts. Best regards,
Jalal Mansour`;

function synthesize(text, loop) {
  let t = text;
  t = t.replace(/\bDear Sir\/Madam,?\s*/gi, "Dear Sir or Madam, Good day.\n\n");
  t = t.replace(/\bI hope (?:this email finds you well|you are having a productive week)\.?\s*/gi, "");
  t = t.replace(/\b(?:I am writing to express my interest in|I would like to explore|I am interested in)\s+learning more about the opportunities available within your organization\.?\s*/gi, "I am willing to be part of this organization, and kindly request that you tell me more about the application process. ");
  t = t.replace(/\b(?:I would appreciate it if you could|Could you please)\s+provide me with further information regarding the application process and any relevant requirements\.?\s*/gi, "I am wondering if you can give me more information about the application procedures? ");
  t = t.replace(/\b(?:Thank you for your time and consideration|Thank you for taking the time to review this)\.?\s*/gi, "");
  t = t.replace(/\b(?:I look forward to hearing from you|I look forward to your thoughts)\.?\s*/gi, "");
  t = t.replace(/\bKind regards,?\s*/gi, "Best regards,\n");
  t = t.split(/\r?\n/).map(line => line.replace(/[ \t]+/g, ' ').trim()).join('\n');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

async function run() {
  const result = synthesize(partiallyMutated, 1);
  console.log('Synthesized Text:\n' + result);
  const score = await zg.detect(result);
  console.log('\nZeroGPT Score:', score.ai_score, '% AI | Human:', score.human_score, '%');
  console.log('Verdict:', score.verdict);
}

run().catch(console.error);

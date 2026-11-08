const { ZeroGPTDetector } = require('../lib/verifier-engine.js');
const zg = new ZeroGPTDetector();

const email = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

function mutateCandidate(text, iteration) {
  let t = text;
  if (iteration === 1) {
    t = t.replace(/\bDear Sir\/Madam,?\s*/gi, "Dear Sir or Madam, Good day.\n\n");
    t = t.replace(/\bI hope this email finds you well\.?\s*/gi, "");
    t = t.replace(/\bI am writing to express my interest in learning more about the opportunities available within your organization\.?\s*/gi, "I am willing to be part of this organization, and kindly request that you tell me more about the application process. ");
    t = t.replace(/\bI would appreciate it if you could provide me with further information regarding the application process and any relevant requirements\.?\s*/gi, "I am wondering if you can give me more information about the application procedures? ");
    t = t.replace(/\bThank you for your time and consideration\.?\s*/gi, "");
    t = t.replace(/\bI look forward to hearing from you\.?\s*/gi, "");
    t = t.replace(/\bKind regards,?\s*/gi, "Best regards,\n");
  }
  return t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function test() {
  const mut = mutateCandidate(email, 1);
  console.log('Mutated Text:\n' + mut);
  const res = await zg.detect(mut);
  console.log('\nZeroGPT Score:', res.ai_score, '% AI | Human:', res.human_score, '%');
  console.log('Verdict:', res.verdict);
  console.log('Description:', res.description);
}

test().catch(console.error);

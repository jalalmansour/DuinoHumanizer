const { ZeroGPTDetector, SuperHumanizer, LoopParaphraseEngine } = require('../lib/verifier-engine.js');

const email = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

async function testEmail() {
  console.log('--- 1. Testing ZeroGPT baseline on user email ---');
  const zg = new ZeroGPTDetector();
  const zgRes = await zg.detect(email);
  console.log('ZeroGPT Baseline:', zgRes);

  console.log('\n--- 2. Testing SuperHumanizer on user email ---');
  const sh = new SuperHumanizer();
  try {
    const shRes = await sh.humanize(email, { mode: 'Super Ultra', tone: 'Formal' });
    console.log('SuperHumanizer Result:');
    console.log(shRes);
    if (shRes.humanized_text) {
      const zgCheck = await zg.detect(shRes.humanized_text);
      console.log('\nZeroGPT score on SuperHumanizer output:', zgCheck);
    }
  } catch (e) {
    console.error('SuperHumanizer error:', e.message);
  }

  console.log('\n--- 3. Testing LoopParaphraseEngine on user email ---');
  const engine = new LoopParaphraseEngine({ target_max_ai: 7.0, model: 'Super Ultra', purpose: 'Formal' });
  const result = await engine.run(email);
  console.log('\nLoopParaphraseEngine Result:');
  console.log('Baseline AI Score:', result.baseline_ai_score, '%');
  console.log('Final AI Score:', result.final_ai_score, '%');
  console.log('Final Human Score:', result.final_human_score, '%');
  console.log('Verdict:', result.final_verdict);
  console.log('Iterations:', result.iterations_completed);
  console.log('\nFinal Text:\n' + result.final_text);
}

testEmail().catch(console.error);

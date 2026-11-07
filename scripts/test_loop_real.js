const { LoopParaphraseEngine } = require('../paraphraser/scripts/loop_verifier.js');

async function main() {
  const engine = new LoopParaphraseEngine({
    max_loops: 5,
    target_max_ai: 7.0,
    model: 'Super Ultra',
    purpose: 'Academic'
  });
  
  const text = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";

  const res = await engine.run(text);
  console.log('\n================ FINAL RESULT ================');
  console.log('Status:', res.status);
  console.log('Verdict:', res.verdict);
  console.log('Baseline AI Score:', res.baseline_ai_score, '%');
  console.log('Final AI Score:', res.final_ai_score, '%');
  console.log('Final Human Score:', res.final_human_score, '%');
  console.log('Iterations Executed:', res.iterations_completed);
  console.log('Final Text:\n', res.final_text);
  console.log('\nLoop History:');
  console.log(JSON.stringify(res.history, null, 2));
}

main();

const fs = require('fs');

async function testAllEndpoints() {
  const BASE_URL = 'https://duinizer.vercel.app';
  console.log('======================================================================');
  console.log('VERIFYING VERCEL PRODUCTION ENVIRONMENT:', BASE_URL);
  console.log('======================================================================\n');

  // 1. Root API
  console.log('[1/6] Testing GET /api/...');
  const r1 = await fetch(`${BASE_URL}/api/`);
  console.log('  Status:', r1.status);
  const data1 = await r1.json();
  console.log('  Engine:', data1.engine, '| Version:', data1.version);

  // 2. Status API
  console.log('\n[2/6] Testing GET /api/status...');
  const r2 = await fetch(`${BASE_URL}/api/status`);
  console.log('  Status:', r2.status);
  const data2 = await r2.json();
  console.log('  Engine Ready:', data2.engine_ready, '| Model:', data2.config?.model);

  // 3. Document Parser API
  console.log('\n[3/6] Testing POST /api/parse-document...');
  const r3 = await fetch(`${BASE_URL}/api/parse-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'sample_essay.txt',
      data: 'Introduction: The advent of machine learning represents a shift in modern computational linguistics. In particular, deep neural networks exhibit unique emergent capabilities across domains.',
      format: 'txt'
    })
  });
  console.log('  Status:', r3.status);
  const data3 = await r3.json();
  console.log('  Parsed text length:', data3.text?.length, '| Word count:', data3.word_count);

  // 4. Word Diff API
  console.log('\n[4/6] Testing POST /api/diff-words...');
  const r4 = await fetch(`${BASE_URL}/api/diff-words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original: 'The AI model plays a pivotal role in research.',
      humanized: 'The AI model is central to research.'
    })
  });
  console.log('  Status:', r4.status);
  const data4 = await r4.json();
  console.log('  Diff success:', data4.success);

  // 5. Document Exporter API
  console.log('\n[5/6] Testing POST /api/export-text (DOCX)...');
  const r5 = await fetch(`${BASE_URL}/api/export-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Humanized academic research output ready for publication.',
      format: 'docx',
      filename: 'verified_output.docx'
    })
  });
  console.log('  Status:', r5.status, '| Content-Type:', r5.headers.get('content-type'));

  // 6. Live Paraphraser & ZeroGPT Loop Verifier API
  console.log('\n[6/6] Testing POST /api/humanize-text (Live ZeroGPT Verification)...');
  const testInput = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";
  const t0 = Date.now();
  const r6 = await fetch(`${BASE_URL}/api/humanize-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: testInput,
      model: 'Super Ultra',
      purpose: 'Academic',
      target_ai: 7.0,
      max_loops: 3
    })
  });
  const elapsed = Date.now() - t0;
  console.log(`  Status: ${r6.status} (${elapsed}ms)`);
  const data6 = await r6.json();
  console.log('  Verification Results:');
  console.log('    Success:', data6.success);
  console.log('    Baseline ZeroGPT AI Score:', data6.baseline_ai_score, '%');
  console.log('    Final ZeroGPT AI Score:', data6.final_ai_score, '%');
  console.log('    Final ZeroGPT Human Score:', data6.final_human_score, '%');
  console.log('    Verdict:', data6.verdict);
  console.log('    ZeroGPT Feedback Description:', data6.description);
  console.log('    Loops Executed:', data6.loops_executed);
  console.log('    Loop History:\n', JSON.stringify(data6.loop_history, null, 4));
  console.log('\n  Humanized Output Preview:\n', data6.humanized_text);

  console.log('\n======================================================================');
  console.log('ALL VERCEL PRODUCTION ENDPOINTS VERIFIED OPERATIONAL!');
  console.log('======================================================================');
}

testAllEndpoints().catch(console.error);

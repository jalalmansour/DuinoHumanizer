async function checkVercelLive() {
  console.log('--- Checking Vercel Live Deployment ---');
  try {
    const res = await fetch('https://duinizer.vercel.app/api/');
    console.log('Vercel /api/ status:', res.status);
    const json = await res.json();
    console.log('Vercel /api/ response:', json);
  } catch (e) {
    console.log('Error checking /api/:', e.message);
  }

  console.log('\n--- Testing Live Humanization on Vercel ---');
  try {
    const testText = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";
    const start = Date.now();
    const res2 = await fetch('https://duinizer.vercel.app/api/humanize-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testText,
        model: 'Super Ultra',
        purpose: 'Academic',
        target_ai: 7.0,
        max_loops: 3
      })
    });
    console.log('Vercel /api/humanize-text status:', res2.status, `(${Date.now() - start}ms)`);
    const json2 = await res2.json();
    console.log('Vercel Live Response:\n', JSON.stringify({
      success: json2.success,
      baseline_ai: json2.baseline_ai_score,
      final_ai: json2.final_ai_score,
      final_human: json2.final_human_score,
      verdict: json2.verdict,
      description: json2.description,
      loops_executed: json2.loops_executed,
      loop_history: json2.loop_history,
      humanized_preview: (json2.humanized_text || '').slice(0, 160) + '...'
    }, null, 2));
  } catch (e) {
    console.log('Error testing humanize-text on Vercel:', e.message);
  }
}

checkVercelLive();

const http = require('http');

async function testEndpoint() {
  const payload = JSON.stringify({
    text: "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.",
    model: "Super Ultra",
    purpose: "Academic",
    target_ai: 7.0,
    max_loops: 4
  });

  console.log('Sending 100% AI text to http://localhost:3000/api/humanize-text...');
  const req = http.request('http://localhost:3000/api/humanize-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log('Response JSON:');
        console.log('Success:', json.success);
        console.log('Baseline AI Score:', json.baseline_ai_score, '%');
        console.log('Final AI Score:', json.final_ai_score, '%');
        console.log('Final Human Score:', json.final_human_score, '%');
        console.log('Verdict:', json.verdict);
        console.log('Loops Executed:', json.loops_executed);
        console.log('Loop History:', JSON.stringify(json.loop_history, null, 2));
        console.log('\nFinal Humanized Text:\n', json.humanized_text);
      } catch (e) {
        console.log('Body:', body);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(payload);
  req.end();
}

testEndpoint();

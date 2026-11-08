const url = 'https://duinizer.vercel.app/api/humanize-text';
const text = "In today's fast-paced digital age, artificial intelligence plays a crucial role in modern society. Furthermore, it serves as a testament to the transformative power of technological innovation. It is important to note that researchers delve into deep learning architectures to foster synergistic paradigms across diverse domains.";

async function runTest() {
  console.log('Testing live Vercel endpoint:', url);
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      model: 'Super Ultra',
      purpose: 'Academic',
      target_ai: 7.0,
      max_loops: 3
    })
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Elapsed:', Date.now() - start, 'ms');
  console.log('Response JSON:');
  console.log(JSON.stringify(data, null, 2));
}

runTest().catch(console.error);

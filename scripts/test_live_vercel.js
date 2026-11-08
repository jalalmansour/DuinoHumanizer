const url = 'https://duinizer.vercel.app/api/humanize-text';
const email = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

async function runTest() {
  console.log('Testing live Vercel endpoint with user email:', url);
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: email,
      model: 'Super Ultra',
      purpose: 'Formal',
      target_ai: 7.0,
      max_loops: 5
    })
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Elapsed:', Date.now() - start, 'ms');
  console.log('Success:', data.success);
  console.log('Baseline AI Score:', data.baseline_ai_score, '%');
  console.log('Final AI Score:', data.final_ai_score, '%');
  console.log('Final Human Score:', data.final_human_score, '%');
  console.log('Verdict:', data.verdict);
  console.log('Loops:', data.loops_executed);
  console.log('Loop History:', JSON.stringify(data.loop_history, null, 2));
  console.log('\nFinal Output:\n' + data.humanized_text);
}

runTest().catch(console.error);

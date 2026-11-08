const email = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

async function main() {
  console.log('Sending request to http://localhost:3000/api/humanize-text ...');
  const res = await fetch('http://localhost:3000/api/humanize-text', {
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

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Success:', data.success);
  console.log('Final AI Score:', data.final_ai_score, '%');
  console.log('Final Human Score:', data.final_human_score, '%');
  console.log('Verdict:', data.verdict);
  console.log('Loops:', data.loops_executed);
  console.log('\nFinal Text:\n' + data.humanized_text);
}

main().catch(console.error);

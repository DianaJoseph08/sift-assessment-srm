async function test() {
  const key = "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";
  console.log("Testing Groq API key validity with llama-3.3-70b-versatile...");
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Respond with 'Key is valid' if this succeeds." }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Success! Model response:", data.choices?.[0]?.message?.content?.trim());
    } else {
      console.error("Groq API rejected the key. Status:", response.status);
      console.error("Details:", await response.text());
    }
  } catch (err) {
    console.error("Network error testing Groq:", err.message);
  }
}
test();

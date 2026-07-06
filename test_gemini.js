async function test() {
  const key = "AQ.Ab8RN6IB0R62zQ5wTGlyrA1jzXUnCBx2ueLkj8V124uShc-X-Q";
  console.log("Testing third Gemini API key validity...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello! Respond with 'Key is valid' if this request succeeds." }] }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Success! Model response:", data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
    } else {
      console.error("Gemini API rejected the key. Status:", response.status);
      console.error("Details:", await response.text());
    }
  } catch (err) {
    console.error("Network error testing Gemini:", err.message);
  }
}
test();

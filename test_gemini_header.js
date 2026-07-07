async function test() {
  const key = "AQ.Ab8RN6JGc612WeZzFORzC5ZqczsKz9Wn3PnRkBQxmacr8jnlJg";
  console.log("Testing Gemini API key via custom headers (x-goog-api-key)...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello! Respond with 'Header Auth is valid' if this succeeds." }] }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Success! Model response:", data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
    } else {
      console.error("Gemini API rejected the key via header. Status:", response.status);
      console.error("Details:", await response.text());
    }
  } catch (err) {
    console.error("Network error testing Gemini:", err.message);
  }
}
test();

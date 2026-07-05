async function test() {
  console.log("Checking Ollama availability on http://localhost:11434...");
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    if (!res.ok) {
      console.error("Ollama responded with HTTP error:", res.status);
      return;
    }
    const data = await res.json();
    console.log("Ollama is running. Available models:", data.models?.map(m => m.name));
  } catch (err) {
    console.error("Ollama is not running or unreachable:", err.message);
  }
}
test();

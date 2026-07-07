async function test() {
  console.log("Checking if local Ollama server is running on port 11434...");
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    if (response.ok) {
      const data = await response.json();
      console.log("Ollama is RUNNING!");
      console.log("Downloaded models on your machine:");
      if (data.models && data.models.length > 0) {
        data.models.forEach(m => console.log(` - ${m.name}`));
      } else {
        console.log(" No models downloaded yet!");
      }
    } else {
      console.error("Ollama responded with status:", response.status);
    }
  } catch (err) {
    console.error("Ollama is NOT running on your laptop. Error:", err.message);
    console.log("Please open the Ollama application on your computer and try again.");
  }
}
test();

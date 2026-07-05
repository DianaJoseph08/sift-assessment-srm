async function test() {
  console.log("Checking if Express serves index.html on http://localhost:8787...");
  try {
    const res = await fetch("http://localhost:8787/");
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("HTML Sample:", text.substring(0, 200));
    
    console.log("\nChecking if Express serves assets/index-B7EqpWCt.js...");
    const assetRes = await fetch("http://localhost:8787/assets/index-B7EqpWCt.js");
    console.log("Asset Status:", assetRes.status);
    console.log("Asset Content Type:", assetRes.headers.get("content-type"));
  } catch (err) {
    console.error("Express check failed:", err.message);
  }
}
test();

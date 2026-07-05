import localtunnel from 'localtunnel';
import fs from 'fs';

async function start() {
  console.log("Starting localtunnel...");
  try {
    const tunnel = await localtunnel({ port: 5173, host: 'https://lt.sillydev.co' });
    console.log(`\n========================================`);
    console.log(`  TUNNEL URL: ${tunnel.url}`);
    console.log(`========================================\n`);
    
    fs.writeFileSync('../tunnel.txt', `Tunnel URL: ${tunnel.url}\n`);
    
    tunnel.on('close', () => {
      console.log("Tunnel closed.");
    });
  } catch (err) {
    console.error("Tunnel error:", err);
    fs.writeFileSync('../tunnel.txt', `Error: ${err.message}\n`);
  }
}

start();

import { spawn } from 'child_process';
import fs from 'fs';

async function start() {
  console.log("Spawning SSH tunnel...");
  fs.writeFileSync('../tunnel.txt', "Initializing SSH Tunnel...\n");
  
  const ssh = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-p', '443',
    '-R', '80:localhost:5173',
    'a.pinggy.io'
  ]);

  ssh.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`STDOUT: ${text}`);
    fs.appendFileSync('../tunnel.txt', `STDOUT: ${text}\n`);
  });

  ssh.stderr.on('data', (data) => {
    const text = data.toString();
    console.log(`STDERR: ${text}`);
    fs.appendFileSync('../tunnel.txt', `STDERR: ${text}\n`);
  });

  ssh.on('close', (code) => {
    console.log(`SSH closed with code ${code}`);
    fs.appendFileSync('../tunnel.txt', `SSH Closed with code ${code}\n`);
  });
}

start();

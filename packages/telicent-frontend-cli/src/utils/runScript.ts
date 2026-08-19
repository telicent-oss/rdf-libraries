import { spawn } from 'child_process';
import type { Command } from 'commander'; // Import Commander types if available
import path from 'path';
import { dirname } from './dirname.js';

interface RunScriptOptions {
}

/**
 * Runs a shell script as a child processes, ensuring the there is 
 * access to telicent-frontend-cli's  working directory (and environment) 
 * so the shell scripts in this repo can can source other files in this repo
 * 
 * Higher order function for config of command's action
 */
export const runScript = (scriptLoc:string, args:string[] = []) => 
  /**
   * Lower order function for command's action
   */
   (options: RunScriptOptions, _command: Command): void => {
     const scriptPath = path.join(dirname, scriptLoc);
    const proc = spawn('bash', [scriptPath, ...args], {
      cwd: process.cwd(), // current working directory should be the repo root
      stdio: 'inherit'
    });
    proc.on('close', (code) => process.exit(code || 0));
  }

import { execFile } from "child_process";
import { promisify } from "util";
import { getPreferenceValues } from "@raycast/api";
import { access, readFile, unlink } from "fs/promises";
import { spawn } from "child_process";

const execFileP = promisify(execFile);

interface GuardianPreferences {
  guardianPath: string;
  defaultTimeout: string;
  defaultBlur: string;
}

export interface GuardianStatus {
  running: boolean;
  pid?: number;
  installed: boolean;
  binaryPath?: string;
}

// Resolve the actual binary path, verifying it exists on disk.
export async function resolveBinary(): Promise<string | null> {
  const prefs = getPreferenceValues<GuardianPreferences>();

  // 1. Explicit user path
  if (prefs.guardianPath) {
    try {
      await access(prefs.guardianPath);
      return prefs.guardianPath;
    } catch {
      return null;
    }
  }

  // 2. Brew default (Apple Silicon)
  const brewPaths = [
    "/opt/homebrew/bin/guardian",
    "/usr/local/bin/guardian", // Intel Macs
  ];
  for (const p of brewPaths) {
    try {
      await access(p);
      return p;
    } catch {
      continue;
    }
  }

  // 3. $PATH lookup via which
  try {
    const { stdout } = await execFileP("/usr/bin/which", ["guardian"]);
    const resolved = stdout.trim();
    if (resolved) {
      try { await access(resolved); return resolved; } catch {}
    }
  } catch {}

  return null;
}

export function getBinaryPath(): string {
  // Synchronous fallback — prefer resolveBinary() for real checks
  const prefs = getPreferenceValues<GuardianPreferences>();
  if (prefs.guardianPath) return prefs.guardianPath;
  return "/opt/homebrew/bin/guardian";
}

export async function getGuardianStatus(): Promise<GuardianStatus> {
  const binaryPath = await resolveBinary();
  if (!binaryPath) {
    return { running: false, installed: false };
  }

  try {
    const pidStr = await readFile("/tmp/guardian.pid", "utf-8");
    const pid = parseInt(pidStr.trim(), 10);
    if (isNaN(pid)) return { running: false, installed: true, binaryPath };

    try {
      process.kill(pid, 0);
      return { running: true, pid, installed: true, binaryPath };
    } catch {
      await unlink("/tmp/guardian.pid").catch(() => {});
      return { running: false, installed: true, binaryPath };
    }
  } catch {
    return { running: false, installed: true, binaryPath };
  }
}

export async function installGuardian(): Promise<{ success: boolean; message: string }> {
  // Check if brew is available first
  try {
    await execFileP("/usr/bin/which", ["brew"]);
  } catch {
    return { success: false, message: "Homebrew not found. Install from brew.sh" };
  }

  // Add the tap and install
  try {
    await execFileP("/opt/homebrew/bin/brew", ["tap", "kilogramirisok/guardian"], { timeout: 30000 });
  } catch {
    // tap may already exist, that's fine
  }

  try {
    await execFileP("/opt/homebrew/bin/brew", ["install", "kilogramirisok/guardian/guardian"], { timeout: 120000 });
    return { success: true, message: "Guardian installed via Homebrew" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Try Intel path
    try {
      await execFileP("/usr/local/bin/brew", ["install", "kilogramirisok/guardian/guardian"], { timeout: 120000 });
      return { success: true, message: "Guardian installed via Homebrew (Intel)" };
    } catch (e2: unknown) {
      const msg2 = e2 instanceof Error ? e2.message : String(e2);
      return { success: false, message: `${msg}\n${msg2}` };
    }
  }
}

export async function spawnDetached(args: string[]): Promise<void> {
  const binaryPath = await resolveBinary();
  if (!binaryPath) throw new Error("Guardian binary not found");

  const child = spawn(binaryPath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

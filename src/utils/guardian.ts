import { execFile } from "child_process";
import { promisify } from "util";
import { getPreferenceValues, confirmAlert, Icon, showToast, Toast } from "@raycast/api";
import { access, readFile, unlink } from "fs/promises";
import { spawn } from "child_process";

const execFileP = promisify(execFile);

export interface GuardianPreferences {
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

  // 2. Common install paths
  const candidates = [
    "/opt/homebrew/bin/guardian", // Apple Silicon
    "/usr/local/bin/guardian", // Intel Macs
  ];
  for (const p of candidates) {
    try {
      await access(p);
      return p;
    } catch {
      continue;
    }
  }

  // 3. $PATH lookup
  try {
    const { stdout } = await execFileP("/usr/bin/which", ["guardian"]);
    const resolved = stdout.trim();
    if (resolved) {
      try {
        await access(resolved);
        return resolved;
      } catch {
        // fall through
      }
    }
  } catch {
    // fall through
  }

  return null;
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

// Find the brew binary dynamically (Apple Silicon or Intel)
async function findBrew(): Promise<string | null> {
  const candidates = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
  for (const p of candidates) {
    try {
      await access(p);
      return p;
    } catch {
      continue;
    }
  }
  try {
    const { stdout } = await execFileP("/usr/bin/which", ["brew"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function installGuardian(): Promise<{ success: boolean; message: string }> {
  const brew = await findBrew();
  if (!brew) {
    return { success: false, message: "Homebrew not found. Install from brew.sh" };
  }

  // Add tap (may already exist)
  try {
    await execFileP(brew, ["tap", "kilogramirisok/guardian"], { timeout: 30_000 });
  } catch {
    // tap may already exist
  }

  // Install
  try {
    await execFileP(brew, ["install", "kilogramirisok/guardian/guardian"], { timeout: 120_000 });
    return { success: true, message: "Guardian installed via Homebrew" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: msg.slice(0, 200) };
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

// Shared utility: ensure binary exists, prompt to install if missing.
// Returns true if binary is ready, false if user cancelled or install failed.
export async function ensureBinary(): Promise<boolean> {
  const binaryPath = await resolveBinary();
  if (binaryPath) return true;

  const confirmed = await confirmAlert({
    title: "Guardian CLI Not Found",
    message: "Install it now via Homebrew?",
    primaryButtonTitle: "Install",
    icon: Icon.Download,
  });
  if (!confirmed) return false;

  const toast = await showToast({ style: Toast.Style.Animated, title: "Installing Guardian..." });
  const result = await installGuardian();
  toast.style = result.success ? Toast.Style.Success : Toast.Style.Failure;
  toast.title = result.success ? "Installed" : "Install Failed";
  toast.message = result.message.slice(0, 80);
  return result.success;
}

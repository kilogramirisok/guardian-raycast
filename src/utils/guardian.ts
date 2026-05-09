import { execFile } from "child_process";
import { promisify } from "util";
import { getPreferenceValues } from "@raycast/api";

const execFileP = promisify(execFile);

interface GuardianPreferences {
  guardianPath: string;
  defaultTimeout: string;
  defaultBlur: string;
}

export interface GuardianStatus {
  running: boolean;
  pid?: number;
}

export function getBinaryPath(): string {
  const prefs = getPreferenceValues<GuardianPreferences>();
  if (prefs.guardianPath) return prefs.guardianPath;
  // Auto-detect: brew install path, then which
  return "/opt/homebrew/bin/guardian";
}

export async function getGuardianStatus(): Promise<GuardianStatus> {
  try {
    const fs = await import("fs/promises");
    const pidStr = await fs.readFile("/tmp/guardian.pid", "utf-8");
    const pid = parseInt(pidStr.trim(), 10);
    if (isNaN(pid)) return { running: false };

    // Check if process is alive: signal 0 = existence check
    try {
      process.kill(pid, 0);
      return { running: true, pid };
    } catch {
      // Stale PID file — clean it up
      await fs.unlink("/tmp/guardian.pid").catch(() => {});
      return { running: false };
    }
  } catch {
    return { running: false };
  }
}

export async function guardianLock(
  timeout?: string,
  blur?: string,
): Promise<{ stdout: string; stderr: string }> {
  const prefs = getPreferenceValues<GuardianPreferences>();
  const args = ["lock", "--timeout", timeout ?? prefs.defaultTimeout, "--blur", blur ?? prefs.defaultBlur];
  return execFileP(getBinaryPath(), args, { timeout: 5000 });
}

export async function guardianWrap(
  command: string[],
  blur?: string,
): Promise<{ stdout: string; stderr: string }> {
  const prefs = getPreferenceValues<GuardianPreferences>();
  const args = ["wrap", "--blur", blur ?? prefs.defaultBlur, "--", ...command];
  return execFileP(getBinaryPath(), args, { timeout: 5000 });
}

export async function findGuardianBinary(): Promise<string | null> {
  try {
    const { stdout } = await execFileP("/usr/bin/which", ["guardian"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

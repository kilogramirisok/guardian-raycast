import { showHUD, showToast, Toast } from "@raycast/api";
import { guardianLock, getGuardianStatus } from "./utils/guardian";

export default async function Command() {
  // Check if already running
  const status = await getGuardianStatus();
  if (status.running) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Already locked",
      message: `Guardian is already running (PID: ${status.pid})`,
    });
    return;
  }

  // Launch guardian lock (it will fork/block — we just fire it)
  // guardian runs in its own process. The CLI blocks in CFRunLoopRun()
  // so we can't await it. Instead, spawn detached and return immediately.
  const { spawn } = await import("child_process");
  const { getBinaryPath } = await import("./utils/guardian");
  const { getPreferenceValues } = await import("@raycast/api");

  interface Prefs {
    defaultTimeout: string;
    defaultBlur: string;
  }
  const prefs = getPreferenceValues<Prefs>();

  const child = spawn(getBinaryPath(), [
    "lock",
    "--timeout", prefs.defaultTimeout,
    "--blur", prefs.defaultBlur,
  ], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  // Small delay for the PID file to be written
  await new Promise((r) => setTimeout(r, 500));

  const newStatus = await getGuardianStatus();
  if (newStatus.running) {
    await showHUD(`🔒 Input locked (PID: ${newStatus.pid}) — ⌘⇧L to unlock`);
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to lock",
      message: "Guardian may need Accessibility permission",
    });
  }
}

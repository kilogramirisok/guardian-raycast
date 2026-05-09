import { showHUD, showToast, Toast } from "@raycast/api";
import { getGuardianStatus, ensureBinary, spawnDetached, GuardianPreferences } from "./utils/guardian";
import { getPreferenceValues } from "@raycast/api";

export default async function Command() {
  const ready = await ensureBinary();
  if (!ready) return;

  // Check if already running
  const status = await getGuardianStatus();
  if (status.running) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Already Locked",
      message: `Guardian is running (PID: ${status.pid})`,
    });
    return;
  }

  const prefs = getPreferenceValues<GuardianPreferences>();

  await spawnDetached([
    "lock",
    "--timeout", prefs.defaultTimeout,
    "--blur", prefs.defaultBlur,
  ]);

  // Wait for PID file
  await new Promise((r) => setTimeout(r, 500));

  const newStatus = await getGuardianStatus();
  if (newStatus.running) {
    await showHUD(`Input locked (PID: ${newStatus.pid}) — ⌘⇧L to unlock`);
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Lock",
      message: "Grant Accessibility permission in System Settings → Privacy & Security → Accessibility",
    });
  }
}

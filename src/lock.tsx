import { showHUD, showToast, Toast, confirmAlert, Alert, Icon } from "@raycast/api";
import { getGuardianStatus, resolveBinary, installGuardian, spawnDetached } from "./utils/guardian";
import { getPreferenceValues } from "@raycast/api";

interface Prefs {
  defaultTimeout: string;
  defaultBlur: string;
}

export default async function Command() {
  const binaryPath = await resolveBinary();

  if (!binaryPath) {
    const confirmed = await confirmAlert({
      title: "Guardian CLI not found",
      message: "Install it now via Homebrew?",
      primaryButtonTitle: "Install",
      icon: Icon.Download,
    });
    if (!confirmed) return;

    const toast = await showToast({ style: Toast.Style.Animated, title: "Installing Guardian..." });
    const result = await installGuardian();
    toast.style = result.success ? Toast.Style.Success : Toast.Style.Failure;
    toast.title = result.success ? "Installed!" : "Install failed";
    toast.message = result.message.slice(0, 80);
    if (!result.success) return;
  }

  // Check if already running
  const status = await getGuardianStatus();
  if (status.running) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Already locked",
      message: `Guardian is running (PID: ${status.pid})`,
    });
    return;
  }

  const prefs = getPreferenceValues<Prefs>();

  await spawnDetached([
    "lock",
    "--timeout", prefs.defaultTimeout,
    "--blur", prefs.defaultBlur,
  ]);

  // Wait for PID file
  await new Promise((r) => setTimeout(r, 500));

  const newStatus = await getGuardianStatus();
  if (newStatus.running) {
    await showHUD(`🔒 Input locked (PID: ${newStatus.pid}) — ⌘⇧L to unlock`);
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to lock",
      message: "Guardian may need Accessibility permission in System Settings → Privacy & Security → Accessibility",
    });
  }
}

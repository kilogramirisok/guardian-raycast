import { showToast, Toast, confirmAlert, Icon } from "@raycast/api";
import { installGuardian, resolveBinary } from "./utils/guardian";

export default async function Command() {
  // Check if already installed
  const existing = await resolveBinary();
  if (existing) {
    await showToast({
      style: Toast.Style.Success,
      title: "Guardian Is Already Installed",
      message: existing,
    });
    return;
  }

  // Confirm before installing
  const confirmed = await confirmAlert({
    title: "Install Guardian CLI",
    message: "This will install guardian via Homebrew",
    primaryButtonTitle: "Install",
    icon: Icon.Download,
  });

  if (!confirmed) return;

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Installing Guardian...",
    message: "brew install kilogramirisok/guardian/guardian",
  });

  const result = await installGuardian();

  if (result.success) {
    toast.style = Toast.Style.Success;
    toast.title = "Guardian Installed";
    toast.message = "Grant Accessibility permission on first run";
  } else {
    toast.style = Toast.Style.Failure;
    toast.title = "Installation Failed";
    toast.message = result.message.slice(0, 100);
  }
}

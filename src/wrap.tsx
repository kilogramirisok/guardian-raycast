import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  confirmAlert,
  getPreferenceValues,
} from "@raycast/api";
import { getGuardianStatus, resolveBinary, installGuardian, spawnDetached } from "./utils/guardian";
import { useState } from "react";

interface Prefs {
  defaultBlur: string;
}

export default function Command() {
  const [command, setCommand] = useState("");
  const [blur, setBlur] = useState("0");

  async function handleSubmit() {
    if (!command.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "No command provided" });
      return;
    }

    // Check binary exists
    const binaryPath = await resolveBinary();
    if (!binaryPath) {
      const confirmed = await confirmAlert({
        title: "Guardian CLI not found",
        message: "Install it now via Homebrew?",
        primaryButtonTitle: "Install",
        icon: Icon.Download,
      });
      if (!confirmed) return;
      const toast = await showToast({ style: Toast.Style.Animated, title: "Installing..." });
      const result = await installGuardian();
      toast.style = result.success ? Toast.Style.Success : Toast.Style.Failure;
      toast.title = result.success ? "Installed!" : "Failed";
      toast.message = result.message.slice(0, 80);
      if (!result.success) return;
    }

    // Check if already locked
    const status = await getGuardianStatus();
    if (status.running) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already locked",
        message: `PID: ${status.pid}`,
      });
      return;
    }

    const parts = command.trim().split(/\s+/);
    await spawnDetached(["wrap", "--blur", blur, "--", ...parts]);

    await new Promise((r) => setTimeout(r, 500));

    const newStatus = await getGuardianStatus();
    if (newStatus.running) {
      await showToast({
        style: Toast.Style.Success,
        title: "🚀 Running",
        message: `${command} — ⌘⇧L to unlock`,
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to launch",
        message: "Check Accessibility permission",
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run Locked" icon={Icon.Lock} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="command"
        title="Command"
        placeholder="claude --dangerously-skip-permissions"
        value={command}
        onChange={setCommand}
        info="The command to run while input is locked. Auto-unlocks when it exits."
      />
      <Form.Separator />
      <Form.TextField
        id="blur"
        title="Blur Level"
        placeholder="0"
        value={blur}
        onChange={setBlur}
        info="Screen overlay blur (0-10). 0 = transparent."
      />
    </Form>
  );
}

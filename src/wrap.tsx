import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  getPreferenceValues,
} from "@raycast/api";
import { spawn } from "child_process";
import { getBinaryPath, getGuardianStatus } from "./utils/guardian";
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

    const status = await getGuardianStatus();
    if (status.running) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already locked",
        message: `Guardian is running (PID: ${status.pid})`,
      });
      return;
    }

    const parts = command.trim().split(/\s+/);
    const child = spawn(getBinaryPath(), [
      "wrap",
      "--blur", blur,
      "--",
      ...parts,
    ], {
      detached: true,
      stdio: "ignore",
    });

    child.unref();

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
        message: "Check command and Accessibility permission",
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Run Locked"
            icon={Icon.Lock}
            onSubmit={handleSubmit}
          />
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
        info="Screen overlay blur (0-10). 0 = transparent overlay."
      />
    </Form>
  );
}

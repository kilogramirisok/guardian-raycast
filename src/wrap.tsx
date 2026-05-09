import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
} from "@raycast/api";
import { getGuardianStatus, ensureBinary, spawnDetached } from "./utils/guardian";
import { useState } from "react";

const BLUR_OPTIONS = [
  { value: "0", title: "No blur" },
  { value: "1", title: "Minimal" },
  { value: "3", title: "Light" },
  { value: "5", title: "Medium" },
  { value: "7", title: "Heavy" },
  { value: "10", title: "Maximum" },
];

export default function Command() {
  const [command, setCommand] = useState("");
  const [blur, setBlur] = useState("0");

  async function handleSubmit() {
    if (!command.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "No Command Provided" });
      return;
    }

    const ready = await ensureBinary();
    if (!ready) return;

    // Check if already locked
    const status = await getGuardianStatus();
    if (status.running) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already Locked",
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
        title: "Running",
        message: `${command} — ⌘⇧L to unlock`,
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Launch",
        message: "Grant Accessibility permission in System Settings",
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
      <Form.Dropdown
        id="blur"
        title="Blur Level"
        value={blur}
        onChange={setBlur}
        info="Screen overlay blur intensity while locked"
      >
        {BLUR_OPTIONS.map((opt) => (
          <Form.Dropdown.Item key={opt.value} value={opt.value} title={opt.title} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

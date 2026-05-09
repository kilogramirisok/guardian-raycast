import { MenuBarExtra, LaunchType, environment, Color, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getGuardianStatus, getBinaryPath } from "./utils/guardian";
import { execFile } from "child_process";
import { promisify } from "util";
import { getPreferenceValues } from "@raycast/api";

const execFileP = promisify(execFile);

interface GuardianPreferences {
  guardianPath: string;
  defaultTimeout: string;
  defaultBlur: string;
}

export default function Command() {
  const { data: status, isLoading, revalidate } = usePromise(getGuardianStatus);
  const prefs = getPreferenceValues<GuardianPreferences>();
  const isBackground = environment.launchType === LaunchType.Background;

  const isRunning = status?.running ?? false;
  const icon = isRunning ? { source: Icon.Lock, tintColor: Color.Red } : { source: Icon.Unlocked, tintColor: Color.Green };
  const tooltip = isRunning ? `Guardian is locking input (PID: ${status?.pid})` : "Guardian is not running";

  async function handleLock() {
    try {
      await execFileP(getBinaryPath(), [
        "lock",
        "--timeout", prefs.defaultTimeout,
        "--blur", prefs.defaultBlur,
      ], { timeout: 5000 });
    } catch (e: unknown) {
      // guardian lock blocks until unlock — if it errors, show it
      // If it succeeds, it blocks in CFRunLoopRun, so this promise won't resolve until unlocked
      // The execFileP will timeout at 5s, which is expected
      // Status will update via the interval poll
    }
    revalidate();
  }

  async function handleWrap(agent: string) {
    try {
      await execFileP(getBinaryPath(), [
        "wrap",
        "--blur", prefs.defaultBlur,
        "--",
        ...agent.split(" "),
      ], { timeout: 5000 });
    } catch {
      // Same as lock — expected to block
    }
    revalidate();
  }

  if (isBackground && !isRunning) {
    // Don't show menu bar item when not running in background
    return null;
  }

  return (
    <MenuBarExtra icon={icon} tooltip={tooltip} isLoading={isLoading}>
      <MenuBarExtra.Section title={isRunning ? "🔒 Locked" : "⚪ Unlocked"}>
        {isRunning && (
          <MenuBarExtra.Item
            title={`PID: ${status?.pid}`}
            icon={Icon.Tag}
          />
        )}
        <MenuBarExtra.Item
          title="Refresh Status"
          icon={Icon.ArrowClockwise}
          onAction={revalidate}
        />
      </MenuBarExtra.Section>

      {!isRunning && (
        <MenuBarExtra.Section title="Lock">
          <MenuBarExtra.Item
            title="Lock Input"
            icon={Icon.Lock}
            onAction={handleLock}
          />
          <MenuBarExtra.Item
            title="Lock Input (Blurred)"
            icon={Icon.EyeDisabled}
            onAction={async () => {
              try {
                await execFileP(getBinaryPath(), [
                  "lock",
                  "--timeout", prefs.defaultTimeout,
                  "--blur", "5",
                  "--screen-blur",
                ], { timeout: 5000 });
              } catch {}
              revalidate();
            }}
          />
        </MenuBarExtra.Section>
      )}

      {!isRunning && (
        <MenuBarExtra.Section title="Wrap Agent">
          <MenuBarExtra.Item
            title="Claude Code"
            icon={Icon.Code}
            onAction={() => handleWrap("claude")}
          />
          <MenuBarExtra.Item
            title="Claude Code (no permissions)"
            icon={Icon.Code}
            onAction={() => handleWrap("claude --dangerously-skip-permissions")}
          />
          <MenuBarExtra.Item
            title="Codex"
            icon={Icon.Hammer}
            onAction={() => handleWrap("codex")}
          />
          <MenuBarExtra.Item
            title="OpenCode"
            icon={Icon.Terminal}
            onAction={() => handleWrap("opencode")}
          />
        </MenuBarExtra.Section>
      )}

      {isRunning && (
        <MenuBarExtra.Section title="Info">
          <MenuBarExtra.Item
            title="Unlock: ⌘⇧L + Touch ID"
            icon={Icon.Key}
          />
        </MenuBarExtra.Section>
      )}
    </MenuBarExtra>
  );
}

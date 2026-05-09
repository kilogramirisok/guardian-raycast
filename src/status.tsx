import { MenuBarExtra, LaunchType, environment, Color, Icon, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getGuardianStatus, installGuardian, spawnDetached, GuardianPreferences } from "./utils/guardian";
import { getPreferenceValues } from "@raycast/api";

export default function Command() {
  const { data: status, isLoading, revalidate } = usePromise(getGuardianStatus);
  const prefs = getPreferenceValues<GuardianPreferences>();
  const isBackground = environment.launchType === LaunchType.Background;

  const isRunning = status?.running ?? false;
  const isInstalled = status?.installed ?? false;

  const icon = !isInstalled
    ? { source: Icon.ExclamationMark, tintColor: Color.Yellow }
    : isRunning
      ? { source: Icon.Lock, tintColor: Color.Red }
      : { source: Icon.Unlocked, tintColor: Color.Green };

  const tooltip = !isInstalled
    ? "Guardian CLI not installed"
    : isRunning
      ? `Guardian locking input (PID: ${status?.pid})`
      : "Guardian ready";

  // Hide menu bar in background when idle (no noise)
  if (isBackground && !isRunning) {
    return null;
  }

  async function handleLock(blur?: string) {
    if (!isInstalled) return;
    try {
      await spawnDetached([
        "lock",
        "--timeout", prefs.defaultTimeout,
        "--blur", blur ?? prefs.defaultBlur,
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await showToast({ style: Toast.Style.Failure, title: "Failed to lock", message: msg });
    }
    setTimeout(() => revalidate(), 500);
  }

  async function handleWrap(agent: string) {
    if (!isInstalled) return;
    try {
      await spawnDetached(["wrap", "--blur", prefs.defaultBlur, "--", ...agent.split(" ")]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await showToast({ style: Toast.Style.Failure, title: "Failed to wrap", message: msg });
    }
    setTimeout(() => revalidate(), 500);
  }

  async function handleInstall() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Installing Guardian..." });
    const result = await installGuardian();
    toast.style = result.success ? Toast.Style.Success : Toast.Style.Failure;
    toast.title = result.success ? "Installed" : "Install Failed";
    toast.message = result.message.slice(0, 80);
    revalidate();
  }

  return (
    <MenuBarExtra icon={icon} tooltip={tooltip} isLoading={isLoading}>
      {!isInstalled && (
        <MenuBarExtra.Section title="Not Installed">
          <MenuBarExtra.Item
            title="Install via Homebrew"
            icon={Icon.Download}
            onAction={handleInstall}
          />
          <MenuBarExtra.Item
            title="brew install kilogramirisok/guardian/guardian"
            icon={Icon.Terminal}
          />
        </MenuBarExtra.Section>
      )}

      {isInstalled && !isRunning && (
        <>
          <MenuBarExtra.Section title="Lock">
            <MenuBarExtra.Item
              title="Lock Input"
              icon={Icon.Lock}
              onAction={() => handleLock()}
            />
            <MenuBarExtra.Item
              title="Lock Input (Blurred)"
              icon={Icon.EyeDisabled}
              onAction={() => handleLock("5")}
            />
          </MenuBarExtra.Section>

          <MenuBarExtra.Section title="Wrap Agent">
            <MenuBarExtra.Item
              title="Claude Code"
              icon={Icon.Code}
              onAction={() => handleWrap("claude")}
            />
            <MenuBarExtra.Item
              title="Claude Code (Skip Permissions)"
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
        </>
      )}

      {isInstalled && isRunning && (
        <MenuBarExtra.Section title="Locked">
          <MenuBarExtra.Item
            title={`PID: ${status?.pid}`}
            icon={Icon.Tag}
          />
          <MenuBarExtra.Item
            title="Unlock: ⌘⇧L + Touch ID"
            icon={Icon.Key}
          />
        </MenuBarExtra.Section>
      )}

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Refresh"
          icon={Icon.ArrowClockwise}
          onAction={revalidate}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}

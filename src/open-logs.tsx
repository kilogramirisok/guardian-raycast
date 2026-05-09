import { showHUD } from "@raycast/api";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);

export default async function Command() {
  try {
    await execFileP("/usr/bin/open", ["-a", "Terminal"]);
    await execFileP("/usr/bin/osascript", [
      "-e",
      `tell application "Terminal"
        do script "tail -f /tmp/guardian.log 2>/dev/null || echo 'No guardian log found. Guardian outputs to its own terminal.'"
      end tell`,
    ]);
    await showHUD("Opened Terminal with guardian logs");
  } catch {
    await showHUD("Failed to open logs");
  }
}

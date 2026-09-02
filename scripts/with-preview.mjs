#!/usr/bin/env node
/**
 * Start vite preview, run a child command, then kill the preview tree.
 * Bounded: the process always exits. Do not use as a long-lived server.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PREVIEW_PORT || 8099);
const cmd = process.argv.slice(2);
if (!cmd.length) {
  console.error("usage: node scripts/with-preview.mjs <command>...");
  process.exit(2);
}

function waitForPort(p, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = net.connect({ port: p, host: "127.0.0.1" }, () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error(`preview did not bind :${p}`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

const logs = [];
const preview = spawn(
  "npx",
  ["vite", "dev", "--host", "127.0.0.1", `--port=${port}`, "--strictPort"],
  {
    cwd: root,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, VITE_AUTH_ENABLED: "false" },
  },
);
preview.stdout.on("data", (buf) => logs.push(String(buf)));
preview.stderr.on("data", (buf) => logs.push(String(buf)));
preview.on("exit", (code) => {
  if (!killed) console.error(`dev server exited early code=${code}\n${logs.join("")}`);
});

let killed = false;
function killPreview() {
  if (killed) return;
  killed = true;
  if (process.platform === "win32" && preview.pid) {
    spawn("taskkill", ["/PID", String(preview.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: true,
    });
  } else {
    preview.kill("SIGTERM");
  }
}

process.on("exit", killPreview);
process.on("SIGINT", () => {
  killPreview();
  process.exit(1);
});
process.on("SIGTERM", () => {
  killPreview();
  process.exit(1);
});

try {
  await waitForPort(port, 40000);
  await new Promise((r) => setTimeout(r, 800));
  const child = spawn(cmd[0], cmd.slice(1), {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });
  const code = await new Promise((resolve) => child.on("close", resolve));
  killPreview();
  process.exit(code ?? 1);
} catch (err) {
  console.error(String(err?.message || err));
  killPreview();
  process.exit(1);
}

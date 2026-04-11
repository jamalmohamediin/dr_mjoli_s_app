import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Add it to .env.local or your shell env.");
  process.exit(1);
}

const pollTimeoutSeconds = Number.parseInt(
  process.env.TELEGRAM_BOT_POLL_TIMEOUT_SECONDS || "45",
  10,
);

const allowedChatIds = new Set(
  (process.env.TELEGRAM_ALLOWED_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const apiBaseUrl = `https://api.telegram.org/bot${token}`;
let updateOffset = 0;

const defaultConfigPath = path.join(projectRoot, "playwright-telegram.targets.json");
const configuredConfigPath =
  process.env.PLAYWRIGHT_TELEGRAM_CONFIG_PATH?.trim() || defaultConfigPath;
const configFilePath = path.isAbsolute(configuredConfigPath)
  ? configuredConfigPath
  : path.resolve(projectRoot, configuredConfigPath);
const configFileDir = path.dirname(configFilePath);

const resolveWithBase = (baseDir, inputPath) =>
  path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath);

const buildFallbackConfig = () => ({
  defaultTarget: "local",
  targets: {
    local: {
      cwd: projectRoot,
      nodePath: process.execPath,
      playwrightCli: "node_modules/playwright/cli.js",
      runs: {
        smoke: [
          "test",
          "--project=chromium",
          "--workers=1",
          "tests/e2e/live-visible-walkthrough.spec.ts",
        ],
        visible: [
          "test",
          "--project=chromium-headed",
          "--workers=1",
          "tests/e2e/live-visible-walkthrough.spec.ts",
        ],
        debug: [
          "test",
          "--project=chromium-headed",
          "--debug",
          "--workers=1",
          "tests/e2e/live-visible-walkthrough.spec.ts",
        ],
        ui: ["test", "--ui"],
      },
    },
  },
});

const loadTargetsConfig = () => {
  if (!existsSync(configFilePath)) {
    console.warn(
      `Config file not found at ${configFilePath}. Using fallback local config tied to current project.`,
    );
    return buildFallbackConfig();
  }

  const raw = readFileSync(configFilePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid targets config format.");
  }

  const targetsInput = parsed.targets;
  if (!targetsInput || typeof targetsInput !== "object") {
    throw new Error("Config must contain a 'targets' object.");
  }

  const normalizedTargets = {};

  for (const [name, target] of Object.entries(targetsInput)) {
    if (!target || typeof target !== "object") {
      continue;
    }

    const cwdRaw = String(target.cwd || "").trim();
    const runs = target.runs && typeof target.runs === "object" ? target.runs : {};

    if (!cwdRaw || Object.keys(runs).length === 0) {
      continue;
    }

    const targetBaseDir = path.isAbsolute(cwdRaw) ? cwdRaw : resolveWithBase(configFileDir, cwdRaw);
    const nodePath = target.nodePath
      ? resolveWithBase(configFileDir, String(target.nodePath))
      : process.execPath;
    const playwrightCli = target.playwrightCli
      ? resolveWithBase(targetBaseDir, String(target.playwrightCli))
      : resolveWithBase(targetBaseDir, "node_modules/playwright/cli.js");

    const normalizedRuns = {};
    for (const [runAlias, runArgs] of Object.entries(runs)) {
      if (!Array.isArray(runArgs)) {
        continue;
      }
      normalizedRuns[runAlias.toLowerCase()] = runArgs.map((value) => String(value));
    }

    if (Object.keys(normalizedRuns).length === 0) {
      continue;
    }

    normalizedTargets[name] = {
      cwd: targetBaseDir,
      nodePath,
      playwrightCli,
      runs: normalizedRuns,
    };
  }

  const availableTargetNames = Object.keys(normalizedTargets);
  if (availableTargetNames.length === 0) {
    throw new Error("No valid targets found in config.");
  }

  const requestedDefault = String(parsed.defaultTarget || "").trim();
  const defaultTarget =
    requestedDefault && normalizedTargets[requestedDefault]
      ? requestedDefault
      : availableTargetNames[0];

  return {
    defaultTarget,
    targets: normalizedTargets,
  };
};

const targetsConfig = loadTargetsConfig();
const activeTargetByChatId = new Map();
let currentRun = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const telegramApi = async (method, payload) => {
  const response = await fetch(`${apiBaseUrl}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error (${method}): ${JSON.stringify(data)}`);
  }

  return data.result;
};

const sendMessage = async (chatId, text) => {
  const messageLimit = 3800;
  const chunks = [];

  for (let index = 0; index < text.length; index += messageLimit) {
    chunks.push(text.slice(index, index + messageLimit));
  }

  if (chunks.length === 0) {
    chunks.push("");
  }

  for (const chunk of chunks) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true,
    });
  }
};

const isChatAuthorized = (chatId) => {
  if (allowedChatIds.size === 0) {
    return false;
  }

  return allowedChatIds.has(String(chatId));
};

const getSelectedTargetName = (chatId) =>
  activeTargetByChatId.get(chatId) || targetsConfig.defaultTarget;

const getSelectedTarget = (chatId) => {
  const targetName = getSelectedTargetName(chatId);
  return {
    name: targetName,
    config: targetsConfig.targets[targetName],
  };
};

const getRunStatusText = () => {
  if (!currentRun) {
    return "Idle.";
  }

  const runtimeSeconds = Math.floor((Date.now() - currentRun.startedAt) / 1000);
  return `Running "${currentRun.alias}" on target "${currentRun.targetName}" for ${runtimeSeconds}s.`;
};

const listTargetsText = () => {
  const names = Object.keys(targetsConfig.targets);
  const lines = ["Available targets:"];
  for (const name of names) {
    const marker = name === targetsConfig.defaultTarget ? " (default)" : "";
    lines.push(`- ${name}${marker}`);
  }
  return lines.join("\n");
};

const listRunsText = (targetName, targetConfig) => {
  const aliases = Object.keys(targetConfig.runs).sort();
  return [`Runs for "${targetName}":`, ...aliases.map((alias) => `- ${alias}`)].join("\n");
};

const HELP_TEXT = [
  "Playwright Telegram Bot (Global Targets) Commands:",
  "/id - Show your Telegram chat id",
  "/status - Show current runner status",
  "/targets - List all configured targets",
  "/target <name> - Select active target for your chat",
  "/runs - List run aliases for selected target",
  "/run <alias> - Run a whitelisted alias on selected target",
  "/stop - Stop the current running test",
  "/help - Show this help",
].join("\n");

const formatRunResult = (alias, targetName, exitCode, outputTail) => {
  const header =
    exitCode === 0
      ? `Run "${alias}" on "${targetName}" finished successfully.`
      : `Run "${alias}" on "${targetName}" failed (exit ${exitCode}).`;
  const lines = outputTail.length > 0 ? outputTail.join("\n") : "No output captured.";
  return `${header}\n\nLast output lines:\n${lines}`;
};

const runPlaywright = async (chatId, aliasInput) => {
  if (currentRun) {
    await sendMessage(chatId, `Another run is active. ${getRunStatusText()}`);
    return;
  }

  const alias = aliasInput.toLowerCase();
  const { name: targetName, config: targetConfig } = getSelectedTarget(chatId);
  const commandArgs = targetConfig.runs[alias];

  if (!commandArgs) {
    await sendMessage(
      chatId,
      `Unknown run alias "${alias}" for target "${targetName}".\n${listRunsText(targetName, targetConfig)}`,
    );
    return;
  }

  if (!existsSync(targetConfig.nodePath)) {
    await sendMessage(chatId, `Node binary not found for target "${targetName}": ${targetConfig.nodePath}`);
    return;
  }

  if (!existsSync(targetConfig.playwrightCli)) {
    await sendMessage(
      chatId,
      `Playwright CLI not found for target "${targetName}": ${targetConfig.playwrightCli}`,
    );
    return;
  }

  await sendMessage(chatId, `Starting "${alias}" on target "${targetName}"...`);

  const outputTail = [];
  const keepLines = 60;

  const pushLine = (line) => {
    const normalized = line.trimEnd();
    if (!normalized) {
      return;
    }
    outputTail.push(normalized);
    while (outputTail.length > keepLines) {
      outputTail.shift();
    }
  };

  const child = spawn(
    targetConfig.nodePath,
    [targetConfig.playwrightCli, ...commandArgs],
    {
      cwd: targetConfig.cwd,
      windowsHide: true,
      env: process.env,
    },
  );

  currentRun = {
    alias,
    child,
    startedAt: Date.now(),
    targetName,
  };

  child.stdout.on("data", (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) {
      pushLine(line);
    }
  });

  child.stderr.on("data", (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) {
      pushLine(line);
    }
  });

  child.on("close", async (exitCode) => {
    currentRun = null;
    try {
      await sendMessage(chatId, formatRunResult(alias, targetName, exitCode ?? 1, outputTail));
    } catch (error) {
      console.error("Failed to send run result:", error);
    }
  });

  child.on("error", async (error) => {
    currentRun = null;
    try {
      await sendMessage(chatId, `Failed to start run "${alias}" on "${targetName}": ${error.message}`);
    } catch (sendError) {
      console.error("Failed to send process error:", sendError);
    }
  });
};

const stopCurrentRun = async (chatId) => {
  if (!currentRun) {
    await sendMessage(chatId, "No active run.");
    return;
  }

  const { child, alias, targetName } = currentRun;
  child.kill("SIGTERM");
  await sendMessage(chatId, `Stop requested for "${alias}" on "${targetName}".`);
};

const switchTarget = async (chatId, requestedTargetName) => {
  if (!targetsConfig.targets[requestedTargetName]) {
    await sendMessage(chatId, `Unknown target "${requestedTargetName}".\n${listTargetsText()}`);
    return;
  }

  activeTargetByChatId.set(chatId, requestedTargetName);
  const selected = targetsConfig.targets[requestedTargetName];
  await sendMessage(
    chatId,
    [`Target switched to "${requestedTargetName}".`, listRunsText(requestedTargetName, selected)].join("\n\n"),
  );
};

const handleAuthorizedMessage = async (chatId, text) => {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  if (lower === "/start" || lower === "/help") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  if (lower === "/id") {
    await sendMessage(chatId, `Your chat id is ${chatId}.`);
    return;
  }

  if (lower === "/status") {
    await sendMessage(chatId, getRunStatusText());
    return;
  }

  if (lower === "/targets") {
    await sendMessage(chatId, listTargetsText());
    return;
  }

  if (lower === "/runs") {
    const { name, config } = getSelectedTarget(chatId);
    await sendMessage(chatId, listRunsText(name, config));
    return;
  }

  if (lower === "/stop") {
    await stopCurrentRun(chatId);
    return;
  }

  if (lower.startsWith("/target ")) {
    const targetName = normalized.slice("/target ".length).trim();
    if (!targetName) {
      await sendMessage(chatId, `Usage: /target <name>\n\n${listTargetsText()}`);
      return;
    }
    await switchTarget(chatId, targetName);
    return;
  }

  if (lower.startsWith("/run ")) {
    const alias = normalized.slice("/run ".length).trim();
    if (!alias) {
      await sendMessage(chatId, "Usage: /run <alias>");
      return;
    }
    await runPlaywright(chatId, alias);
    return;
  }

  await sendMessage(chatId, 'Unknown command. Use "/help".');
};

const handleMessage = async (message) => {
  const chatId = message?.chat?.id;
  const text = message?.text;

  if (!chatId || !text) {
    return;
  }

  if (!isChatAuthorized(chatId)) {
    if (text.trim().toLowerCase() === "/id") {
      await sendMessage(
        chatId,
        [
          `Your chat id is ${chatId}.`,
          "Add this value to TELEGRAM_ALLOWED_CHAT_IDS in .env.local, then restart the bot.",
        ].join("\n"),
      );
      return;
    }

    await sendMessage(chatId, "Unauthorized chat. Send /id, then allow your chat id in TELEGRAM_ALLOWED_CHAT_IDS.");
    return;
  }

  await handleAuthorizedMessage(chatId, text);
};

const pollLoop = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const updates = await telegramApi("getUpdates", {
        timeout: pollTimeoutSeconds,
        offset: updateOffset,
        allowed_updates: ["message"],
      });

      for (const update of updates) {
        updateOffset = update.update_id + 1;
        await handleMessage(update.message);
      }
    } catch (error) {
      console.error("Polling error:", error.message);
      await sleep(3000);
    }
  }
};

console.log("Telegram Playwright bot started.");
console.log(`Targets config: ${configFilePath}`);
console.log(`Default target: ${targetsConfig.defaultTarget}`);
console.log(`Available targets: ${Object.keys(targetsConfig.targets).join(", ")}`);
console.log(
  allowedChatIds.size > 0
    ? `Allowed chat ids: ${Array.from(allowedChatIds).join(", ")}`
    : "No allowed chat ids configured. Only /id will be useful until TELEGRAM_ALLOWED_CHAT_IDS is set.",
);

await pollLoop();

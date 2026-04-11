# Playwright From Telegram (Global Targets)

This bot supports multiple Playwright projects from one Telegram bot process.

## 1) Configure Secrets

Create or update `.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ALLOWED_CHAT_IDS=your_numeric_chat_id
TELEGRAM_BOT_POLL_TIMEOUT_SECONDS=45
PLAYWRIGHT_TELEGRAM_CONFIG_PATH=
```

Notes:
- Keep the token in `.env.local`, never in source code.
- `TELEGRAM_ALLOWED_CHAT_IDS` accepts multiple comma-separated ids.
- `PLAYWRIGHT_TELEGRAM_CONFIG_PATH` is optional. If empty, the bot reads `playwright-telegram.targets.json` in this repo.

## 2) Define Global Targets

Use:
- [playwright-telegram.targets.json](d:\Naim Tech\Clients\Dr. Mjoli\App\playwright-telegram.targets.json) for active config in this repo
- [playwright-telegram.targets.example.json](d:\Naim Tech\Clients\Dr. Mjoli\App\playwright-telegram.targets.example.json) as reference

You can point `PLAYWRIGHT_TELEGRAM_CONFIG_PATH` to any absolute path so one bot can control targets across different apps on your machine.

## 3) Start Telegram Bridge

```bash
npm run bot:telegram:playwright
```

or:

```bash
npm run bot:telegram:playwright:global
```

Telegram commands:
- `/help`
- `/id`
- `/status`
- `/targets`
- `/target <name>`
- `/runs`
- `/run <alias>`
- `/stop`

## 4) Open Playwright UI Interface

Directly in terminal:

```bash
npm run test:e2e:ui
```

Or through Telegram:

1. `/target dr-mjoli-app`
2. `/run ui`

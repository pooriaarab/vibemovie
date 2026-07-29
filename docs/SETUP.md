# Setup

How to install vibemovie and wire up its MCP server on macOS, Windows, and Linux.

## What you need

- Node.js 18 or newer (`node --version` to check).
- An agentic coding CLI or Claude Desktop, if you want the MCP server.

vibemovie lets you turn a coding session into a short recap video.

## Install

You don't have to install anything. `npx` runs the latest published version:

```
npx vibemovie --help
```

To get a persistent `vibemovie` command, install it globally:

```
npm install -g vibemovie
```

## MCP setup

The MCP server lets an agent drive vibemovie through tool calls instead of a terminal.
The server starts with the `vibemovie mcp` subcommand.

### Claude Code (all platforms)

One command, no file editing:

```
# macOS and Linux
claude mcp add vibemovie -- npx -y vibemovie@latest mcp

# Windows
claude mcp add vibemovie -- cmd /c npx -y vibemovie@latest mcp
```

### Claude Desktop (editing the config file)

Open the config file, add the `vibemovie` block, then fully quit and reopen Claude.

**macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vibemovie": { "command": "npx", "args": ["-y", "vibemovie@latest", "mcp"] }
  }
}
```

**Linux** — `~/.config/Claude/claude_desktop_config.json`: same as macOS.

**Windows** — `%APPDATA%\Claude\claude_desktop_config.json` (paste that into the
Explorer address bar, open with Notepad):

```json
{
  "mcpServers": {
    "vibemovie": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "vibemovie@latest", "mcp"]
    }
  }
}
```

### Two things that break MCP on Windows

Most "MCP failed" or "not connected" reports on Windows come down to one of these.

1. **`"command": "npx"` on its own doesn't work.** Windows can't run `npx`
   directly, so the server never starts. Wrap it: `"command": "cmd"` with
   `"args": ["/c", "npx", ...]`. macOS and Linux don't need this.
2. **A stale cached version.** `npx` caches packages, so it can keep serving an
   old build. `vibemovie@latest` forces the current release.

## Check it works

```
vibemovie --version
```

If the MCP server won't connect, run `npx -y vibemovie@latest mcp` in a terminal on its own.
It should start and wait for input rather than exiting straight away.

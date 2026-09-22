import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string().max(16_000),
  name: z.string().max(64).optional(),
  tool_call_id: z.string().max(128).optional(),
  tool_calls: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      }),
    )
    .optional(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  distro: z.string().max(80),
  cwd: z.string().max(256),
  listing: z.string().max(4000),
});

const TOOLS = [
  {
    type: "function",
    function: {
      name: "open_app",
      description:
        "Open a GUI window on the already-running Kiln desktop. Use this whenever the user wants a desktop, GUI, files, browser, editor, software, calculator, settings, or terminal. Never run startx. Apps: welcome, files, editor, browser, software, settings, agent, terminal, calculator",
      parameters: {
        type: "object",
        properties: {
          app: {
            type: "string",
            enum: [
              "welcome",
              "files",
              "editor",
              "browser",
              "software",
              "settings",
              "agent",
              "terminal",
              "calculator",
            ],
          },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_file",
      description: "Open a file in the graphical text editor window.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Run a shell command for file/package work. Do not use this to start X11 or a desktop (startx, gnome-session, etc.). The GUI is already running.",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a text file from the virtual filesystem.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a text file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
];

export type AgentMessage = z.infer<typeof messageSchema>;

export const chatAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Agent is not available in this environment." };

    const system = `You are Kiln Agent on a graphical Linux desktop that is ALREADY RUNNING.
The user sees wallpaper, a top bar, a dock, and windows in this browser tab. This is the session — Wayland compositor "kiln", DISPLAY=:0, WAYLAND_DISPLAY=wayland-0.
NEVER run startx, xinit, Xorg, gnome-session, gdm, sddm, weston, sway, or check for a missing display. Those commands are no-ops; the desktop is live.
If the user asks to launch/open/start a GUI or desktop, call open_app with "welcome" or "files" and briefly confirm it is on screen.
Prefer GUI tools (open_app, open_file) over the shell. Use the shell only for files, git, packages, and scripts.
Distro: ${data.distro}
CWD: ${data.cwd}
Visible files:
${data.listing || "(empty)"}
Apps: welcome, files, editor, browser, software, settings, agent, terminal, calculator.
Keep replies short. Never invent file contents you have not read.`;

    const messages = [
      { role: "system", content: system },
      ...data.messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
        }
        if (m.role === "assistant" && m.tool_calls?.length) {
          return { role: "assistant", content: m.content || null, tool_calls: m.tool_calls };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 22_000);
    let res: Response;
    try {
      res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: ac.signal,
        body: JSON.stringify({
          model: "grok-4.5",
          messages,
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
    } catch {
      clearTimeout(timer);
      return {
        ok: false as const,
        error: "Agent timed out. The desktop is already on screen — use the dock.",
      };
    }
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false as const, error: `Agent error ${res.status}${errText ? `: ${errText.slice(0, 180)}` : ""}` };
    }

    const body = (await res.json()) as {
      choices?: {
        message?: {
          role?: string;
          content?: string | null;
          tool_calls?: AgentMessage["tool_calls"];
        };
      }[];
    };
    const msg = body.choices?.[0]?.message;
    return {
      ok: true as const,
      message: {
        role: "assistant" as const,
        content: msg?.content ?? "",
        tool_calls: msg?.tool_calls,
      },
    };
  });

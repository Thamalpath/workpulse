import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "";
const MODEL = process.env.MODEL;

function toId(value: string | number): string {
  return String(value);
}

function truncate(str: string | null | undefined, max = 200): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

async function buildTeamContext(): Promise<string> {
  const parts: string[] = [];

  // 1. Team roster
  const roster = (await query(
    `SELECT u.id, u.name, u.username,
            GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS roles
     FROM User u
     JOIN UserRole ur ON ur.userId = u.id
     JOIN Role r ON r.id = ur.roleId
     WHERE u.isActive = 1 AND r.\`key\` != 'admin'
     GROUP BY u.id, u.name, u.username
     ORDER BY u.name ASC`,
  )) as { id: number; name: string; username: string; roles: string }[];

  parts.push(
    `## Team Roster (${roster.length} members)\n` +
      roster.map((m) => `- ${m.name} (${m.username}) — ${m.roles}`).join("\n"),
  );

  // 2. Projects
  const projects = (await query(
    `SELECT p.id, p.name, p.isActive,
            (SELECT COUNT(*) FROM ProjectMember pm WHERE pm.projectId = p.id) AS memberCount
     FROM Project p
     ORDER BY p.name ASC`,
  )) as { id: number; name: string; isActive: number; memberCount: number }[];

  if (projects.length) {
    parts.push(
      `## Projects (${projects.length})\n` +
        projects
          .map(
            (p) =>
              `- ${p.name} [${p.isActive ? "active" : "inactive"}] — ${p.memberCount} members`,
          )
          .join("\n"),
    );
  }

  // 3. Recent reports (last 8 weeks)
  const reports = (await query(
    `SELECT wr.id, wr.status, u.name AS userName, p.name AS projectName,
            DATE_FORMAT(wr.weekStartDate, '%Y-%m-%d') AS weekStart,
            DATE_FORMAT(wr.weekEndDate, '%Y-%m-%d') AS weekEnd,
            wr.notes
     FROM WeeklyReport wr
     JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ORDER BY wr.weekStartDate DESC, wr.updatedAt DESC
     LIMIT 40`,
  )) as {
    id: number;
    status: string;
    userName: string;
    projectName: string | null;
    weekStart: string;
    weekEnd: string;
    notes: string | null;
  }[];

  if (reports.length) {
    parts.push(
      `## Recent Reports (${reports.length})\n` +
        reports
          .map(
            (r) =>
              `- [${r.status.toUpperCase()}] ${r.userName} | ${r.projectName ?? "No project"} | Week ${r.weekStart}–${r.weekEnd}${r.notes ? ` | ${truncate(r.notes, 100)}` : ""}`,
          )
          .join("\n"),
    );

    // Report stats
    const statusCounts = reports.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    parts.push(
      `### Report Status Summary (recent ${reports.length})\n` +
        Object.entries(statusCounts)
          .map(([s, c]) => `- ${s}: ${c}`)
          .join("\n"),
    );
  }

  // 4. Tasks from recent reports
  const tasks = (await query(
    `SELECT rt.taskName, rt.status, rt.priority, rt.plannedPercent, rt.actualPercent,
            rt.timePlanned, rt.timeSpent, rt.deliverable,
            u.name AS userName, DATE_FORMAT(wr.weekStartDate, '%Y-%m-%d') AS weekStart
     FROM ReportTask rt
     JOIN WeeklyReport wr ON wr.id = rt.reportId
     JOIN User u ON u.id = wr.userId
     ORDER BY wr.weekStartDate DESC, rt.id ASC
     LIMIT 30`,
  )) as {
    taskName: string;
    status: string;
    priority: string;
    plannedPercent: number;
    actualPercent: number;
    timePlanned: number | null;
    timeSpent: number | null;
    deliverable: string | null;
    userName: string;
    weekStart: string;
  }[];

  if (tasks.length) {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const notStarted = tasks.filter((t) => t.status === "not_started").length;

    parts.push(
      `## Tasks (${tasks.length} recent)\n` +
        `Status breakdown: ${completed} completed, ${inProgress} in-progress, ${blocked} blocked, ${notStarted} not-started\n` +
        tasks
          .map(
            (t) =>
              `- [${t.status}] ${t.taskName} (${t.priority}) — ${t.userName} (wk ${t.weekStart}) | ${t.actualPercent}% done${t.deliverable ? ` | deliverable: ${truncate(t.deliverable, 60)}` : ""}`,
          )
          .join("\n"),
    );

    // Hours summary
    const totalPlanned = tasks.reduce((s, t) => s + (t.timePlanned ?? 0), 0);
    const totalSpent = tasks.reduce((s, t) => s + (t.timeSpent ?? 0), 0);
    parts.push(
      `### Time Tracking\n- Total planned: ${totalPlanned}h\n- Total spent: ${totalSpent}h`,
    );
  }

  // 5. Blockers
  const blockers = (await query(
    `SELECT rb.description, rb.isKeyIssue, u.name AS userName,
            p.name AS projectName, DATE_FORMAT(wr.weekStartDate, '%Y-%m-%d') AS weekStart
     FROM ReportBlocker rb
     JOIN WeeklyReport wr ON wr.id = rb.reportId
     JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ORDER BY rb.isKeyIssue DESC, wr.weekStartDate DESC
     LIMIT 15`,
  )) as {
    description: string;
    isKeyIssue: number;
    userName: string;
    projectName: string | null;
    weekStart: string;
  }[];

  if (blockers.length) {
    const critical = blockers.filter((b) => b.isKeyIssue).length;
    parts.push(
      `## Active Blockers (${blockers.length}, ${critical} critical)\n` +
        blockers
          .map(
            (b) =>
              `- ${b.isKeyIssue ? "🔴 CRITICAL" : "🟡"} ${b.description} — reported by ${b.userName}${b.projectName ? ` (${b.projectName})` : ""} wk ${b.weekStart}`,
          )
          .join("\n"),
    );
  }

  // 6. Achievements
  const achievements = (await query(
    `SELECT ra.description, ra.isKeyAchievement, u.name AS userName,
            p.name AS projectName, DATE_FORMAT(wr.weekStartDate, '%Y-%m-%d') AS weekStart
     FROM ReportAchievement ra
     JOIN WeeklyReport wr ON wr.id = ra.reportId
     JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ORDER BY ra.isKeyAchievement DESC, wr.weekStartDate DESC
     LIMIT 15`,
  )) as {
    description: string;
    isKeyAchievement: number;
    userName: string;
    projectName: string | null;
    weekStart: string;
  }[];

  if (achievements.length) {
    parts.push(
      `## Key Achievements (${achievements.length})\n` +
        achievements
          .map(
            (a) =>
              `- ${a.isKeyAchievement ? "⭐ KEY WIN" : "✅"} ${a.description} — ${a.userName}${a.projectName ? ` (${a.projectName})` : ""} wk ${a.weekStart}`,
          )
          .join("\n"),
    );
  }

  // 7. Hours by category
  const hours = (await query(
    `SELECT rh.category, SUM(rh.hours) AS totalHours,
            COUNT(DISTINCT rh.reportId) AS reportCount
     FROM ReportHoursWorked rh
     JOIN WeeklyReport wr ON wr.id = rh.reportId
     GROUP BY rh.category
     ORDER BY totalHours DESC`,
  )) as { category: string; totalHours: number; reportCount: number }[];

  if (hours.length) {
    parts.push(
      `## Hours by Category\n` +
        hours
          .map(
            (h) =>
              `- ${h.category}: ${h.totalHours}h across ${h.reportCount} reports`,
          )
          .join("\n"),
    );
  }

  return parts.join("\n\n");
}

const SYSTEM_PROMPT = `You are WorkPulse AI, the intelligent assistant for WorkPulse — a weekly report and team management platform.

## Your Role
You help managers and team members understand their team's activity, progress, and blockers by analyzing the live data provided in the context below.

## What You Can Do
- **Answer questions about team activity**: "What did the design team work on last week?", "Who submitted their report?", "What blockers does Nirosha have?"
- **Generate team summaries**: Highlight completed work, recurring blockers, workload imbalances, and notable achievements.
- **Provide insights**: Identify patterns (e.g. tasks taking longer than planned, blockers recurring across weeks).
- **Guide users**: Explain how to use the WorkPulse app — how to create a report, approve submissions, manage projects, etc.

## WorkPulse App Structure
- **Dashboard** (/dashboard): Weekly team overview with KPI cards (submitted/approved/draft/not-started), roster view, and report list. Managers see team-wide data; members see their own.
- **Reports** (/reports): List of all reports. Create (/reports/create), detail (/reports/[id]) with full section view (Tasks, Next Week, Blockers, Achievements, Hours).
- **Projects** (/projects): Project management with member assignments and status.
- **Insights** (/insights): Analytics page with charts — tasks trend, member status, project workload, category time breakdown, recent activity feed.
- **Team Members** (/team-members): View team members and their profiles.
- **Users** (/users): Admin user management.
- **Roles & Permissions** (/roles, /permissions, /assign-permissions): RBAC system with granular permissions.

## Report Lifecycle
1. Member creates a draft report for the current week
2. Fills in sections: tasks (name, priority, status, %, hours), next week's planned tasks, blockers (with critical flag), achievements (with key win flag), hours worked by category
3. Submits → status changes to "submitted"
4. Manager reviews → approves (approved) or requests changes (needs_correction)
5. If changes requested → member edits and re-submits

## Report Statuses
- draft, submitted, approved, needs_correction

## Task Statuses
- not_started, in_progress, completed, blocked

## Guidelines
- Always use the actual data from the context to answer — don't make things up.
- If the context doesn't have enough information to answer, say so honestly.
- Be concise but helpful. Use bullet points for clarity.
- When summarizing, highlight both positives (completed work, wins) and concerns (blockers, overdue tasks).
- For workload analysis, note if any member has significantly more or fewer tasks than others.
- You can respond to general questions about the app, but prioritize questions about the team's actual data.
- Use the user's name when greeting them.

## Response Style
- Modern, clean and simple. Avoid long paragraphs.
- Open with a single short summary sentence when helpful.
- Prefer short bullet lists (4 items max) over dense walls of text.
- Use **bold** only for the most important words (names, statuses, numbers). Don't overuse it.
- Keep the tone concise, friendly and confident.
- Do not include markdown headings (###) — use plain bullet lists instead.`;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chat(
  messages: ChatMessage[],
  userId: string,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new ApiError(
      500,
      "AI service is not configured. Missing GROQ_API_KEY.",
    );
  }

  const context = await buildTeamContext();

  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Here is the current team data you should use to answer questions:\n\n${context}`,
    },
    ...messages,
  ];

  const res = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("Groq API error:", res.status, errBody);
    throw new ApiError(
      502,
      `AI service returned an error (${res.status}). Please try again later.`,
    );
  }

  const data = (await res.json()) as {
    choices?: {
      message?: { content?: string; reasoning?: string };
    }[];
  };

  const message = data.choices?.[0]?.message;
  const reply = message?.content?.trim() || message?.reasoning?.trim();
  if (!reply) {
    throw new ApiError(502, "AI service returned an empty response.");
  }

  return reply;
}

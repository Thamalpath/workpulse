import bcrypt from "bcryptjs";

import { insert, pool, query } from "./config/database.js";
import { SEED_PERMISSIONS, SEED_ROLES } from "./constants/permissions.js";

const SEED_PROJECTS = [
  {
    name: "Ceylon Traders Website",
    description: "Marketing site rebuild for Ceylon Traders",
  },
  {
    name: "Internal Dev Tools",
    description: "Internal dashboards and developer tooling",
  },
  {
    name: "AI Assistant R&D",
    description: "Exploratory work on the AI chat feature",
  },
];

const SEED_USERS: {
  name: string;
  email: string;
  username: string;
  roleKey: string;
}[] = [
  {
    name: "Nirosha Wickramasinghe",
    email: "nirosha@workpulse.dev",
    username: "nirosha",
    roleKey: "manager",
  },
  {
    name: "Kasun Perera",
    email: "kasun@workpulse.dev",
    username: "kaasun",
    roleKey: "team-member",
  },
  {
    name: "Dilani Rathnayake",
    email: "dilani@workpulse.dev",
    username: "dilani",
    roleKey: "team-member",
  },
  {
    name: "Chathura Jayasuriya",
    email: "chathura@workpulse.dev",
    username: "chathura",
    roleKey: "team-member",
  },
  {
    name: "Nadeeka Silva",
    email: "nadeeka@workpulse.dev",
    username: "nadeeka",
    roleKey: "team-member",
  },
];

const SEED_USER_PASSWORD = "123456";

type SeedPriority = "low" | "medium" | "high" | "critical";
type SeedTaskStatus = "not_started" | "in_progress" | "completed" | "blocked";

type SeedTask = {
  name: string;
  priority?: SeedPriority;
  plannedPercent?: number;
  actualPercent?: number;
  status?: SeedTaskStatus;
  timePlanned?: number;
  timeSpent?: number;
  deliverable?: string;
};

type SeedReport = {
  username: string;
  projectName: string;
  weekOffset: number;
  status: "draft" | "submitted" | "needs_correction" | "approved";
  notes?: string;
  tasks?: SeedTask[];
  nextWeekTasks?: {
    name: string;
    priority?: SeedPriority;
    status?: "not_started" | "in_progress" | "completed";
  }[];
  blockers?: { description: string; isKeyIssue?: boolean }[];
  achievements?: { description: string; isKeyAchievement?: boolean }[];
  hoursWorked?: { category: string; hours: number }[];
};

const SEED_PROJECT_MEMBERS: { projectName: string; usernames: string[] }[] = [
  {
    projectName: "Ceylon Traders Website",
    usernames: ["kaasun", "dilani", "chathura"],
  },
  {
    projectName: "Internal Dev Tools",
    usernames: ["dilani", "nadeeka"],
  },
  {
    projectName: "AI Assistant R&D",
    usernames: ["kaasun", "nadeeka", "chathura"],
  },
];

const SEED_REPORTS: SeedReport[] = [
  {
    username: "kaasun",
    projectName: "Ceylon Traders Website",
    weekOffset: 0,
    status: "submitted",
    notes: "Homepage work on track, hoping to wrap up QA early next week.",
    tasks: [
      {
        name: "Redesign homepage hero section",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 80,
        status: "in_progress",
        timePlanned: 12,
        timeSpent: 10,
        deliverable: "Hero section live on staging",
      },
      {
        name: "Product catalogue filtering",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 60,
        status: "in_progress",
        timePlanned: 16,
        timeSpent: 9,
        deliverable: "Working filters on staging",
      },
      {
        name: "Responsive mobile navigation",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 7,
        deliverable: "Responsive nav menu",
      },
    ],
    nextWeekTasks: [
      { name: "Final QA of homepage", priority: "high", status: "not_started" },
      { name: "Catalogue checkout flow", priority: "high", status: "not_started" },
    ],
    blockers: [
      { description: "Staging environment intermittently unavailable", isKeyIssue: true },
    ],
    achievements: [
      { description: "Delivered responsive navigation ahead of schedule", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 26 },
      { category: "Meetings", hours: 4 },
    ],
  },
  {
    username: "dilani",
    projectName: "Internal Dev Tools",
    weekOffset: 0,
    status: "draft",
    notes: "Draft in progress, will submit before Friday.",
    tasks: [
      {
        name: "Internal analytics dashboard layout",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 40,
        status: "in_progress",
        timePlanned: 10,
        timeSpent: 3,
      },
      {
        name: "Deployment pipeline setup",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 10,
        status: "not_started",
        timePlanned: 8,
        timeSpent: 0,
      },
    ],
    nextWeekTasks: [
      { name: "Charts for analytics dashboard", priority: "medium", status: "not_started" },
      { name: "CI deployment runbook", priority: "high", status: "not_started" },
    ],
    hoursWorked: [{ category: "Development", hours: 3 }],
  },
  {
    username: "nadeeka",
    projectName: "AI Assistant R&D",
    weekOffset: 0,
    status: "submitted",
    tasks: [
      {
        name: "Compare AI models for chat accuracy",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 90,
        status: "in_progress",
        timePlanned: 20,
        timeSpent: 18,
        deliverable: "Model benchmark report",
      },
      {
        name: "Prompt engineering for team summaries",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 70,
        status: "in_progress",
        timePlanned: 12,
        timeSpent: 8,
      },
    ],
    nextWeekTasks: [
      { name: "Finalize model choice for production", priority: "high", status: "not_started" },
    ],
    blockers: [
      { description: "Groq API rate limits during evaluation", isKeyIssue: true },
    ],
    achievements: [
      { description: "Reduced chat response latency by ~30% after model swap", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "R&D", hours: 20 },
      { category: "Meetings", hours: 6 },
    ],
  },
  {
    username: "chathura",
    projectName: "Ceylon Traders Website",
    weekOffset: 0,
    status: "needs_correction",
    notes: "Manager requested more detail on the content migration status.",
    tasks: [
      {
        name: "Contact form validation",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 6,
        timeSpent: 5,
        deliverable: "Validated contact form",
      },
      {
        name: "Content migration from legacy site",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 50,
        status: "in_progress",
        timePlanned: 14,
        timeSpent: 7,
      },
    ],
    nextWeekTasks: [
      { name: "Finish content migration", priority: "medium", status: "in_progress" },
    ],
    blockers: [
      { description: "Legacy CMS export incomplete", isKeyIssue: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 12 },
      { category: "QA", hours: 4 },
    ],
  },
  {
    username: "kaasun",
    projectName: "Ceylon Traders Website",
    weekOffset: 1,
    status: "approved",
    tasks: [
      {
        name: "Homepage wireframes",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 7,
        deliverable: "Approved wireframes",
      },
      {
        name: "Design system tokens",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 10,
        timeSpent: 9,
        deliverable: "Design tokens documented",
      },
      {
        name: "Navigation prototype",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 6,
        timeSpent: 6,
      },
    ],
    nextWeekTasks: [
      { name: "Redesign homepage hero section", priority: "high", status: "not_started" },
    ],
    achievements: [
      { description: "Design tokens handed off to the frontend team", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 22 },
      { category: "Design", hours: 4 },
    ],
  },
  {
    username: "dilani",
    projectName: "Internal Dev Tools",
    weekOffset: 1,
    status: "approved",
    tasks: [
      {
        name: "Internal tool inventory",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 12,
        timeSpent: 10,
        deliverable: "Tool inventory spreadsheet",
      },
      {
        name: "Backup automation for databases",
        priority: "critical",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 15,
        timeSpent: 12,
        deliverable: "Nightly automated backup job",
      },
    ],
    nextWeekTasks: [
      { name: "Analytics dashboard layout", priority: "medium", status: "not_started" },
    ],
    achievements: [
      { description: "Database backups now run automatically every night", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 21 },
      { category: "Ops", hours: 3 },
    ],
  },
  {
    username: "nadeeka",
    projectName: "AI Assistant R&D",
    weekOffset: 1,
    status: "approved",
    tasks: [
      {
        name: "Chat streaming spike",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 14,
        timeSpent: 12,
        deliverable: "Streaming spike write-up",
      },
      {
        name: "Latency benchmark harness",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 6,
        deliverable: "Benchmark harness in repo",
      },
    ],
    nextWeekTasks: [
      { name: "Prompt engineering for team summaries", priority: "medium", status: "not_started" },
    ],
    achievements: [
      { description: "Selected Groq as the inference provider", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "R&D", hours: 18 },
      { category: "Meetings", hours: 4 },
    ],
  },
  {
    username: "chathura",
    projectName: "Ceylon Traders Website",
    weekOffset: 1,
    status: "approved",
    tasks: [
      {
        name: "Product page templates",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 14,
        timeSpent: 13,
        deliverable: "Product page templates",
      },
      {
        name: "Image optimization",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 6,
      },
    ],
    nextWeekTasks: [
      { name: "Contact form validation", priority: "medium", status: "not_started" },
    ],
    achievements: [],
    hoursWorked: [{ category: "Development", hours: 19 }],
  },
  {
    username: "kaasun",
    projectName: "AI Assistant R&D",
    weekOffset: 2,
    status: "approved",
    tasks: [
      {
        name: "AI chat prototype wiring",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 16,
        timeSpent: 14,
        deliverable: "Working chat prototype in navbar",
      },
      {
        name: "Team context data extraction",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 10,
        timeSpent: 8,
      },
    ],
    nextWeekTasks: [
      { name: "Compare AI models for chat accuracy", priority: "high", status: "not_started" },
    ],
    achievements: [
      { description: "First functional AI chat prototype shipped to team", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 20 },
      { category: "R&D", hours: 2 },
    ],
  },
  {
    username: "dilani",
    projectName: "Internal Dev Tools",
    weekOffset: 2,
    status: "needs_correction",
    notes: "Reviewer asked to split the runbook task into smaller items.",
    tasks: [
      {
        name: "Developer onboarding guide",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 60,
        status: "in_progress",
        timePlanned: 10,
        timeSpent: 6,
      },
      {
        name: "Secrets management rollout",
        priority: "critical",
        plannedPercent: 100,
        actualPercent: 80,
        status: "in_progress",
        timePlanned: 12,
        timeSpent: 9,
        deliverable: "Secrets stored in vault",
      },
    ],
    nextWeekTasks: [
      { name: "Finish onboarding guide", priority: "medium", status: "in_progress" },
    ],
    blockers: [
      { description: "Waiting on security sign-off for vault", isKeyIssue: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 15 },
      { category: "Security", hours: 4 },
    ],
  },
  {
    username: "nadeeka",
    projectName: "AI Assistant R&D",
    weekOffset: 2,
    status: "submitted",
    tasks: [
      {
        name: "Evaluate tooling for chat history",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 55,
        status: "in_progress",
        timePlanned: 10,
        timeSpent: 6,
      },
      {
        name: "Security review checklist for chat",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 40,
        status: "in_progress",
        timePlanned: 8,
        timeSpent: 3,
      },
    ],
    nextWeekTasks: [
      { name: "Chat streaming spike", priority: "high", status: "not_started" },
    ],
    hoursWorked: [{ category: "R&D", hours: 9 }],
  },
  {
    username: "chathura",
    projectName: "Ceylon Traders Website",
    weekOffset: 2,
    status: "approved",
    tasks: [
      {
        name: "Set up staging environment",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 7,
        deliverable: "Staging env configured",
      },
      {
        name: "Marketing landing page",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 16,
        timeSpent: 14,
      },
    ],
    nextWeekTasks: [
      { name: "Product page templates", priority: "medium", status: "not_started" },
    ],
    achievements: [
      { description: "Landing page approved and staged", isKeyAchievement: true },
    ],
    hoursWorked: [{ category: "Development", hours: 21 }],
  },
  {
    username: "kaasun",
    projectName: "Ceylon Traders Website",
    weekOffset: 3,
    status: "approved",
    tasks: [
      {
        name: "Initial site structure",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 20,
        timeSpent: 18,
        deliverable: "Skeleton site",
      },
      {
        name: "Content style guide",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 6,
        timeSpent: 5,
      },
    ],
    nextWeekTasks: [
      { name: "Homepage wireframes", priority: "medium", status: "not_started" },
    ],
    hoursWorked: [{ category: "Development", hours: 23 }],
  },
  {
    username: "dilani",
    projectName: "Internal Dev Tools",
    weekOffset: 3,
    status: "approved",
    tasks: [
      {
        name: "Tool discovery interviews",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 12,
        timeSpent: 11,
      },
      {
        name: "Internal portal prototype",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 18,
        timeSpent: 16,
        deliverable: "Portal prototype",
      },
    ],
    nextWeekTasks: [
      { name: "Tool inventory", priority: "medium", status: "not_started" },
    ],
    achievements: [
      { description: "Internal portal prototype demoed to the team", isKeyAchievement: true },
    ],
    hoursWorked: [
      { category: "Development", hours: 24 },
      { category: "Meetings", hours: 3 },
    ],
  },
  {
    username: "nadeeka",
    projectName: "AI Assistant R&D",
    weekOffset: 3,
    status: "submitted",
    tasks: [
      {
        name: "R&D roadmap for chat",
        priority: "high",
        plannedPercent: 100,
        actualPercent: 70,
        status: "in_progress",
        timePlanned: 10,
        timeSpent: 7,
      },
      {
        name: "Data privacy review",
        priority: "critical",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 9,
        deliverable: "Privacy review notes",
      },
    ],
    nextWeekTasks: [
      { name: "Evaluate tooling for chat history", priority: "medium", status: "not_started" },
    ],
    achievements: [],
    hoursWorked: [
      { category: "R&D", hours: 14 },
      { category: "Compliance", hours: 3 },
    ],
  },
  {
    username: "chathura",
    projectName: "Ceylon Traders Website",
    weekOffset: 3,
    status: "submitted",
    tasks: [
      {
        name: "Gather requirements from marketing",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 100,
        status: "completed",
        timePlanned: 8,
        timeSpent: 8,
      },
      {
        name: "Brand asset audit",
        priority: "medium",
        plannedPercent: 100,
        actualPercent: 60,
        status: "in_progress",
        timePlanned: 10,
        timeSpent: 6,
      },
    ],
    nextWeekTasks: [
      { name: "Set up staging environment", priority: "medium", status: "not_started" },
    ],
    hoursWorked: [{ category: "Development", hours: 14 }],
  },
];

async function seed() {
  console.log("Seeding permissions...");
  const permissionIds: Record<string, string> = {};
  for (const perm of SEED_PERMISSIONS) {
    const existing = (await query(
      `SELECT id FROM Permission WHERE \`key\` = ? LIMIT 1`,
      [perm.key],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Permission SET name = ?, module = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
        [perm.name, perm.module, perm.description, existing[0].id],
      );
      permissionIds[perm.key] = String(existing[0].id);
    } else {
      const id = await insert(
        `INSERT INTO Permission (name, \`key\`, description, module) VALUES (?, ?, ?, ?)`,
        [perm.name, perm.key, perm.description, perm.module],
      );
      permissionIds[perm.key] = String(id);
    }
  }

  console.log("Seeding roles...");
  for (const role of SEED_ROLES) {
    const existing = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [role.key],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Role SET name = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
        [role.name, role.description, existing[0].id],
      );
    } else {
      const id = await insert(
        `INSERT INTO Role (name, \`key\`, description) VALUES (?, ?, ?)`,
        [role.name, role.key, role.description],
      );
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [id, permissionIds[key]!],
        );
      }
    }
  }

  console.log("Syncing role permissions...");
  for (const role of SEED_ROLES) {
    const roleRows = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [role.key],
    )) as { id: string | number }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      continue;
    }
    const countRows = (await query(
      `SELECT COUNT(*) AS count FROM RolePermission WHERE roleId = ?`,
      [roleId],
    )) as { count: number }[];
    const permissionCount = Number(countRows[0]?.count ?? 0);

    if (permissionCount !== role.permissionKeys.length) {
      await query(`DELETE FROM RolePermission WHERE roleId = ?`, [roleId]);
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [roleId, permissionIds[key]!],
        );
      }
    }
  }

  console.log("Seeding admin user...");
  const adminEmail = "admin@workpulse.com";
  const adminUsername = "admin";
  const adminPassword = "1234";

  const adminRoleRows = (await query(
    `SELECT id FROM Role WHERE \`key\` = 'admin' LIMIT 1`,
  )) as { id: string | number }[];
  const adminRoleId = adminRoleRows[0]?.id;

  const existingAdminRows = (await query(
    `SELECT id FROM User WHERE email = ? LIMIT 1`,
    [adminEmail],
  )) as { id: string | number }[];

  if (existingAdminRows[0]) {
    if (adminRoleId) {
      await query(`DELETE FROM UserRole WHERE userId = ?`, [
        existingAdminRows[0].id,
      ]);
      await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
        existingAdminRows[0].id,
        adminRoleId,
      ]);
    }
    console.log("Admin user already exists.");
  } else if (adminRoleId) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    const id = await insert(
      `INSERT INTO User (name, email, username, password, isActive)
       VALUES (?, ?, ?, ?, ?)`,
      ["Sampath Gunawardena", adminEmail, adminUsername, hashed, 1],
    );
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
      id,
      adminRoleId,
    ]);
    console.log("Admin user created.");
  }

  console.log("Seeding team users...");
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10);
  for (const user of SEED_USERS) {
    const roleRows = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [user.roleKey],
    )) as { id: string | number }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      console.warn(`Role "${user.roleKey}" not found for ${user.username}. Skipping.`);
      continue;
    }

    const existing = (await query(
      `SELECT id FROM User WHERE username = ? OR email = ? LIMIT 1`,
      [user.username, user.email],
    )) as { id: string | number }[];

    let userId: string | number;
    if (existing[0]) {
      userId = existing[0].id;
      await query(
        `UPDATE User SET name = ?, email = ?, username = ?, password = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
        [user.name, user.email, user.username, passwordHash, userId],
      );
    } else {
      userId = await insert(
        `INSERT INTO User (name, email, username, password, isActive)
         VALUES (?, ?, ?, ?, 1)`,
        [user.name, user.email, user.username, passwordHash],
      );
    }

    await query(`DELETE FROM UserRole WHERE userId = ?`, [userId]);
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
      userId,
      roleId,
    ]);
    console.log(`Seeded user ${user.username} (${user.roleKey}).`);
  }

  console.log("Seeding projects...");
  for (const proj of SEED_PROJECTS) {
    const existing = (await query(
      `SELECT id FROM Project WHERE name = ? LIMIT 1`,
      [proj.name],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Project SET name = ?, description = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
        [proj.name, proj.description, existing[0].id],
      );
    } else {
      await insert(
        `INSERT INTO Project (name, description, isActive) VALUES (?, ?, 1)`,
        [proj.name, proj.description],
      );
    }
  }

  console.log("Seeding project members...");
  for (const pm of SEED_PROJECT_MEMBERS) {
    const projectRows = (await query(
      `SELECT id FROM Project WHERE name = ? LIMIT 1`,
      [pm.projectName],
    )) as { id: string | number }[];
    const projectId = projectRows[0]?.id;
    if (!projectId) {
      continue;
    }
    for (const username of pm.usernames) {
      const userRows = (await query(
        `SELECT id FROM User WHERE username = ? LIMIT 1`,
        [username],
      )) as { id: string | number }[];
      const userId = userRows[0]?.id;
      if (!userId) {
        continue;
      }
      await query(
        `INSERT IGNORE INTO ProjectMember (projectId, userId) VALUES (?, ?)`,
        [projectId, userId],
      );
    }
  }

  console.log("Seeding weekly reports...");
  const now = new Date();
  const monday = startOfWeek(now);
  for (const report of SEED_REPORTS) {
    const userRows = (await query(
      `SELECT id FROM User WHERE username = ? LIMIT 1`,
      [report.username],
    )) as { id: string | number }[];
    const userId = userRows[0]?.id;
    if (!userId) {
      console.warn(`User "${report.username}" not found. Skipping report.`);
      continue;
    }

    let projectId: string | number | null = null;
    if (report.projectName) {
      const projectRows = (await query(
        `SELECT id FROM Project WHERE name = ? LIMIT 1`,
        [report.projectName],
      )) as { id: string | number }[];
      projectId = projectRows[0]?.id ?? null;
    }

    const weekStartDate = addDays(monday, -report.weekOffset * 7);
    const weekEndDate = addDays(weekStartDate, 6);
    const weekStartISO = toISODate(weekStartDate);
    const weekEndISO = toISODate(weekEndDate);
    const versionNumber =
      report.status === "approved" ? 2 : report.status === "submitted" || report.status === "needs_correction" ? 1 : 0;

    await query(
      `DELETE FROM WeeklyReport WHERE userId = ? AND weekStartDate = ?`,
      [userId, weekStartISO],
    );

    const reportId = await insert(
      `INSERT INTO WeeklyReport
         (userId, projectId, weekStartDate, weekEndDate, status, versionNumber, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        projectId,
        weekStartISO,
        weekEndISO,
        report.status,
        versionNumber,
        report.notes ?? null,
      ],
    );

    for (const [i, task] of (report.tasks ?? []).entries()) {
      await insert(
        `INSERT INTO ReportTask
           (reportId, taskName, priority, plannedPercent, actualPercent, status, timePlanned, timeSpent, deliverable, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportId,
          task.name,
          task.priority ?? "medium",
          task.plannedPercent ?? 0,
          task.actualPercent ?? 0,
          task.status ?? "not_started",
          task.timePlanned ?? null,
          task.timeSpent ?? null,
          task.deliverable ?? null,
          i,
        ],
      );
    }

    for (const [i, task] of (report.nextWeekTasks ?? []).entries()) {
      await insert(
        `INSERT INTO ReportNextWeekTask
           (reportId, taskName, priority, status, sortOrder)
         VALUES (?, ?, ?, ?, ?)`,
        [reportId, task.name, task.priority ?? "medium", task.status ?? "not_started", i],
      );
    }

    for (const blocker of report.blockers ?? []) {
      await insert(
        `INSERT INTO ReportBlocker (reportId, description, isKeyIssue) VALUES (?, ?, ?)`,
        [reportId, blocker.description, blocker.isKeyIssue ? 1 : 0],
      );
    }

    for (const achievement of report.achievements ?? []) {
      await insert(
        `INSERT INTO ReportAchievement (reportId, description, isKeyAchievement) VALUES (?, ?, ?)`,
        [reportId, achievement.description, achievement.isKeyAchievement ? 1 : 0],
      );
    }

    for (const hw of report.hoursWorked ?? []) {
      await insert(
        `INSERT INTO ReportHoursWorked (reportId, category, hours) VALUES (?, ?, ?)`,
        [reportId, hw.category, hw.hours],
      );
    }
  }

  console.log("Seeding complete.");
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => query(`SELECT 1`).then(() => pool.end()));

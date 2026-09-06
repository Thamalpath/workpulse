import { insert, query, withTransaction } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type ProjectRow = {
  id: string | number;
  name: string;
  description: string | null;
  isActive: boolean | number;
  createdAt: Date;
  memberCount: string | number;
  reportCount: string | number;
};

type MemberRow = {
  id: string | number;
  name: string;
  email: string;
  isActive: boolean | number;
};

function toId(value: string | number): string {
  return String(value);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function toCount(value: string | number): number {
  return Number(value);
}

function mapProject(row: ProjectRow) {
  return {
    id: toId(row.id),
    name: row.name,
    description: row.description,
    isActive: toBoolean(row.isActive),
    createdAt: row.createdAt,
    memberCount: toCount(row.memberCount),
    reportCount: toCount(row.reportCount),
  };
}

function mapMember(row: MemberRow) {
  return {
    id: toId(row.id),
    name: row.name,
    email: row.email,
    isActive: toBoolean(row.isActive),
  };
}

const PROJECT_COLUMNS = `
  p.id,
  p.name,
  p.description,
  p.isActive,
  p.createdAt,
  (SELECT COUNT(*) FROM ProjectMember pm WHERE pm.projectId = p.id) AS memberCount,
  (SELECT COUNT(*) FROM WeeklyReport wr WHERE wr.projectId = p.id) AS reportCount
`;

async function loadProject(id: string): Promise<ProjectRow | null> {
  const rows = (await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM Project p
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  )) as ProjectRow[];
  return rows[0] ?? null;
}

export async function listProjects() {
  const rows = (await query(
    `SELECT ${PROJECT_COLUMNS}
     FROM Project p
     ORDER BY p.isActive DESC, p.name ASC`
  )) as ProjectRow[];
  return rows.map(mapProject);
}

export async function getProjectById(id: string) {
  const project = await loadProject(id);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const memberRows = (await query(
    `SELECT u.id, u.name, u.email, u.isActive
     FROM ProjectMember pm
     JOIN User u ON u.id = pm.userId
     WHERE pm.projectId = ?
     ORDER BY u.name ASC`,
    [id]
  )) as MemberRow[];

  return {
    ...mapProject(project),
    members: memberRows.map(mapMember),
  };
}

export async function createProject(data: {
  name: string;
  description?: string;
}) {
  const id = toId(
    await insert(
      `INSERT INTO Project (name, description) VALUES (?, ?)`,
      [data.name, data.description ?? null]
    )
  );
  return getProjectById(id);
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const existing = await loadProject(id);
  if (!existing) {
    throw new ApiError(404, "Project not found.");
  }

  if (data.name !== undefined) {
    await query(`UPDATE Project SET name = ?, updatedAt = NOW() WHERE id = ?`, [data.name, id]);
  }
  if (data.description !== undefined) {
    await query(`UPDATE Project SET description = ?, updatedAt = NOW() WHERE id = ?`, [
      data.description ?? null,
      id,
    ]);
  }
  if (data.isActive !== undefined) {
    await query(`UPDATE Project SET isActive = ?, updatedAt = NOW() WHERE id = ?`, [
      data.isActive ? 1 : 0,
      id,
    ]);
  }

  return getProjectById(id);
}

export async function archiveProject(id: string) {
  const existing = await loadProject(id);
  if (!existing) {
    throw new ApiError(404, "Project not found.");
  }
  await query(`UPDATE Project SET isActive = 0, updatedAt = NOW() WHERE id = ?`, [id]);
}

export async function deleteProjectPermanently(id: string) {
  const existing = await loadProject(id);
  if (!existing) {
    throw new ApiError(404, "Project not found.");
  }
  if (toCount(existing.reportCount) > 0) {
    throw new ApiError(
      409,
      "This project has reports referencing it and cannot be permanently deleted. Archive it instead.",
    );
  }
  await query(`DELETE FROM Project WHERE id = ?`, [id]);
}

export async function setProjectMembers(id: string, userIds: string[]) {
  const existing = await loadProject(id);
  if (!existing) {
    throw new ApiError(404, "Project not found.");
  }

  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length > 0) {
    const placeholders = uniqueIds.map(() => "?").join(",");
    const found = (await query(
      `SELECT id FROM User WHERE id IN (${placeholders})`,
      uniqueIds
    )) as { id: string | number }[];
    if (found.length !== uniqueIds.length) {
      throw new ApiError(400, "One or more selected team members do not exist.");
    }

    const admins = (await query(
      `SELECT ur2.userId
       FROM UserRole ur2
       JOIN Role r2 ON r2.id = ur2.roleId
       WHERE r2.\`key\` = 'admin' AND ur2.userId IN (${placeholders})`,
      uniqueIds
    )) as { userId: string | number }[];
    if (admins.length > 0) {
      throw new ApiError(
        400,
        "Admin users cannot be assigned as project team members.",
      );
    }
  }

  await withTransaction(async (exec) => {
    await exec.run(`DELETE FROM ProjectMember WHERE projectId = ?`, [id]);
    for (const userId of uniqueIds) {
      await exec.run(
        `INSERT INTO ProjectMember (projectId, userId) VALUES (?, ?)`,
        [id, userId]
      );
    }
  });

  return getProjectById(id);
}
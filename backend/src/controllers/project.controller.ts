import type { Request, Response } from "express";

import {
  archiveProject,
  createProject,
  deleteProjectPermanently,
  getProjectById,
  listProjects,
  setProjectMembers,
  updateProject,
} from "../services/project.service.js";

export async function getProjects(_req: Request, res: Response) {
  const data = await listProjects();
  res.json({ success: true, data });
}

export async function getProject(req: Request, res: Response) {
  const data = await getProjectById(req.params.id as string);
  res.json({ success: true, data });
}

export async function postProject(req: Request, res: Response) {
  const { name, description } = req.body as {
    name: string;
    description?: string;
  };
  const data = await createProject({
    name,
    ...(description !== undefined ? { description } : {}),
  });
  res.status(201).json({ success: true, data });
}

export async function patchProject(req: Request, res: Response) {
  const id = req.params.id as string;
  const body = req.body as {
    name?: string;
    description?: string;
    isActive?: boolean;
  };
  const data = await updateProject(id, body);
  res.json({ success: true, data });
}

export async function removeProject(req: Request, res: Response) {
  await archiveProject(req.params.id as string);
  res.json({ success: true, message: "Project archived." });
}

export async function removeProjectPermanently(req: Request, res: Response) {
  await deleteProjectPermanently(req.params.id as string);
  res.json({ success: true, message: "Project deleted." });
}

export async function putProjectMembers(req: Request, res: Response) {
  const id = req.params.id as string;
  const { userIds } = req.body as { userIds: string[] };
  const data = await setProjectMembers(id, userIds);
  res.json({ success: true, data });
}
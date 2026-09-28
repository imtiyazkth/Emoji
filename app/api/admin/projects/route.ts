import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-auth";
import { readConfigFile, writeConfigFile } from "@/lib/github/config-store";
import { errorResponseBody, statusFor, newRequestId, AppError, ErrorCode } from "@/lib/utils/errors";

export const runtime = "nodejs";

interface Project {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  status: string;
  website: string;
  github: string;
  demo: string;
  docs: string;
  image: string;
  tags: string[];
  featured: boolean;
}

interface ProjectsFile {
  database_version: string;
  projects: Project[];
}

const FILE_NAME = "projects.json";

export async function GET(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const data = await readConfigFile<ProjectsFile>(FILE_NAME);
    return NextResponse.json({ success: true, requestId, projects: data.projects });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}

/** Add a new project, or update/reorder/hide an existing one by id. */
export async function PATCH(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => null);
    const id = body?.id;
    const patch = body?.patch ?? {};
    if (!id || typeof id !== "string") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "id is required", { status: 400 });
    }

    const updated = await writeConfigFile<ProjectsFile>(FILE_NAME, (current) => {
      const exists = current.projects.some((p) => p.id === id);
      if (!exists) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Project not found", { status: 404 });
      }
      return {
        ...current,
        projects: current.projects.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
      };
    });

    return NextResponse.json({ success: true, requestId, projects: updated.projects });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}

/** Create a new project record. */
export async function POST(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => null);
    if (!body?.id || !body?.name) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "id and name are required", { status: 400 });
    }
    const newProject: Project = {
      id: body.id,
      name: body.name,
      shortDescription: body.shortDescription ?? "",
      fullDescription: body.fullDescription ?? "",
      category: body.category ?? "",
      status: body.status ?? "Live",
      website: body.website ?? "",
      github: body.github ?? "",
      demo: body.demo ?? "",
      docs: body.docs ?? "",
      image: body.image ?? "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      featured: Boolean(body.featured),
    };

    const updated = await writeConfigFile<ProjectsFile>(FILE_NAME, (current) => {
      if (current.projects.some((p) => p.id === newProject.id)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "A project with this id already exists", { status: 409 });
      }
      return { ...current, projects: [...current.projects, newProject] };
    });

    return NextResponse.json({ success: true, requestId, projects: updated.projects });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}

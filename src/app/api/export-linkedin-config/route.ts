import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * POST /api/export-linkedin-config
 *
 * Body: { profile: Profile, targetDir?: string }
 *
 * Writes the four Python config files for Auto_job_applier_linkedIn into
 * targetDir (defaults to ~/Auto_job_applier_linkedIn). Returns the paths
 * written so the client can show them to the user.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.profile) {
    return NextResponse.json({ error: "Missing profile in body" }, { status: 400 });
  }

  // Write profile to a temp file
  const tmp = path.join(os.tmpdir(), `jobops-profile-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(body.profile), "utf8");

  // Resolve target directory
  const targetDir = body.targetDir
    ? path.resolve(body.targetDir)
    : path.join(os.homedir(), "Auto_job_applier_linkedIn");

  try {
    const script = path.resolve(process.cwd(), "scripts", "gen-linkedin-config.mjs");
    const result = execSync(`node "${script}" "${tmp}" "${targetDir}"`, { encoding: "utf8" });
    fs.unlinkSync(tmp);

    return NextResponse.json({
      ok: true,
      targetDir,
      output: result,
      files: ["config/secrets.py", "config/personals.py", "config/search.py", "config/questions.py", "config/settings.py"],
    });
  } catch (err: unknown) {
    fs.unlinkSync(tmp);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

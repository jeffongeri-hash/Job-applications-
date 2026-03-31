"use client";

import { useState, useEffect, useRef } from "react";
import { loadProfile, saveProfile, uid, buildResumeText, type Profile, type WorkExperience, type Education, type Skill } from "@/lib/profile-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User, Briefcase, GraduationCap, Wrench, FileText,
  Plus, Trash2, Save, Download, Upload, Link2,
  ChevronDown, ChevronUp, Calendar, MapPin, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
const SKILL_CATEGORIES = ["Frontend", "Backend", "DevOps", "Mobile", "Data", "Design", "Management", "Other"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const update = (updater: (p: Profile) => Profile) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return updater(structuredClone(prev));
    });
    setDirty(true);
  };

  const save = () => {
    if (!profile) return;
    saveProfile(profile);
    setDirty(false);
    toast.success("Profile saved");
  };

  const exportResume = () => {
    if (!profile) return;
    const text = buildResumeText(profile);
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resume exported as Markdown");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update((p) => ({
        ...p,
        resume: {
          name: file.name,
          uploadedAt: Date.now(),
          dataUrl: reader.result as string,
        },
      }));
      toast.success(`Resume "${file.name}" uploaded`);
    };
    reader.readAsDataURL(file);
  };

  if (!profile) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-zinc-800/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Your career profile used for AI tailoring and auto-applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportResume}>
            <Download className="h-3.5 w-3.5" /> Export .md
          </Button>
          {dirty && (
            <Button size="sm" onClick={save}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal"><User className="h-3.5 w-3.5" /> Personal</TabsTrigger>
          <TabsTrigger value="experience"><Briefcase className="h-3.5 w-3.5" /> Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="h-3.5 w-3.5" /> Education</TabsTrigger>
          <TabsTrigger value="skills"><Wrench className="h-3.5 w-3.5" /> Skills</TabsTrigger>
          <TabsTrigger value="resume"><FileText className="h-3.5 w-3.5" /> Resume</TabsTrigger>
        </TabsList>

        {/* ── PERSONAL ── */}
        <TabsContent value="personal">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name" value={profile.personal.fullName}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, fullName: v } }))}
                  placeholder="Jane Smith" />
                <Field label="Email" type="email" value={profile.personal.email}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, email: v } }))}
                  placeholder="jane@example.com" />
                <Field label="Phone" value={profile.personal.phone ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, phone: v } }))}
                  placeholder="+44 7700 000000" />
                <Field label="Location" value={profile.personal.location ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, location: v } }))}
                  placeholder="London, UK" icon={<MapPin className="h-3.5 w-3.5" />} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Field label="LinkedIn URL" value={profile.personal.linkedinUrl ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, linkedinUrl: v } }))}
                  placeholder="https://linkedin.com/in/…" icon={<Link2 className="h-3.5 w-3.5" />} />
                <Field label="GitHub URL" value={profile.personal.githubUrl ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, githubUrl: v } }))}
                  placeholder="https://github.com/…" icon={<Link2 className="h-3.5 w-3.5" />} />
                <Field label="Portfolio / website" value={profile.personal.portfolioUrl ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, portfolioUrl: v } }))}
                  placeholder="https://yoursite.com" />
                <Field label="Right to work" value={profile.personal.rightToWork ?? ""}
                  onChange={(v) => update((p) => ({ ...p, personal: { ...p.personal, rightToWork: v } }))}
                  placeholder="UK citizen / Requires sponsorship" />
              </div>

              <Separator />

              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Professional summary</label>
                <textarea
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
                  rows={5}
                  placeholder="A results-driven software engineer with 5+ years building…"
                  value={profile.personal.summary ?? ""}
                  onChange={(e) => update((p) => ({ ...p, personal: { ...p.personal, summary: e.target.value } }))}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Used by AI to tailor your headline and cover letters. Be specific about your strengths.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXPERIENCE ── */}
        <TabsContent value="experience">
          <div className="space-y-3">
            {profile.experience.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">No experience added yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Add your work history so AI can tailor your applications</p>
                </CardContent>
              </Card>
            )}

            {profile.experience.map((exp, i) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                onChange={(updated) =>
                  update((p) => ({
                    ...p,
                    experience: p.experience.map((e) => (e.id === exp.id ? updated : e)),
                  }))
                }
                onDelete={() =>
                  update((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== exp.id) }))
                }
              />
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                update((p) => ({
                  ...p,
                  experience: [
                    ...p.experience,
                    {
                      id: uid(),
                      company: "",
                      title: "",
                      location: "",
                      startDate: "",
                      current: false,
                      description: "",
                      technologies: "",
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add work experience
            </Button>
          </div>
        </TabsContent>

        {/* ── EDUCATION ── */}
        <TabsContent value="education">
          <div className="space-y-3">
            {profile.education.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">No education added yet</p>
                </CardContent>
              </Card>
            )}

            {profile.education.map((edu) => (
              <EducationCard
                key={edu.id}
                edu={edu}
                onChange={(updated) =>
                  update((p) => ({
                    ...p,
                    education: p.education.map((e) => (e.id === edu.id ? updated : e)),
                  }))
                }
                onDelete={() =>
                  update((p) => ({ ...p, education: p.education.filter((e) => e.id !== edu.id) }))
                }
              />
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                update((p) => ({
                  ...p,
                  education: [
                    ...p.education,
                    {
                      id: uid(),
                      institution: "",
                      degree: "",
                      field: "",
                      startDate: "",
                      current: false,
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add education
            </Button>
          </div>
        </TabsContent>

        {/* ── SKILLS ── */}
        <TabsContent value="skills">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  {profile.skills.length} skills · used for scoring and keyword matching
                </p>
                <Button
                  variant="outline" size="sm"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      skills: [
                        ...p.skills,
                        { id: uid(), name: "", level: "intermediate", category: "Backend" },
                      ],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add skill
                </Button>
              </div>

              {profile.skills.length === 0 && (
                <div className="py-8 text-center">
                  <Wrench className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">No skills added yet</p>
                </div>
              )}

              <div className="space-y-2">
                {profile.skills.map((skill) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    onChange={(updated) =>
                      update((p) => ({
                        ...p,
                        skills: p.skills.map((s) => (s.id === skill.id ? updated : s)),
                      }))
                    }
                    onDelete={() =>
                      update((p) => ({ ...p, skills: p.skills.filter((s) => s.id !== skill.id) }))
                    }
                  />
                ))}
              </div>

              {/* Quick-add chips */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Quick add common skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "GraphQL", "Next.js", "Kubernetes"].map((s) => {
                    const exists = profile.skills.some((sk) => sk.name.toLowerCase() === s.toLowerCase());
                    return (
                      <button
                        key={s}
                        disabled={exists}
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            skills: [...p.skills, { id: uid(), name: s, level: "intermediate", category: "Backend" }],
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-colors",
                          exists
                            ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
                        )}
                      >
                        {exists ? "✓ " : "+ "}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESUME ── */}
        <TabsContent value="resume">
          <div className="space-y-4">
            {/* Upload card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Resume File</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                {profile.resume ? (
                  <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{profile.resume.name}</p>
                        <p className="text-xs text-zinc-500">
                          Uploaded {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.resume.dataUrl && (
                        <a href={profile.resume.dataUrl} download={profile.resume.name}>
                          <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                        Replace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-zinc-700 py-10 text-center hover:border-zinc-600 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">Click to upload your resume</p>
                    <p className="text-xs text-zinc-600 mt-1">PDF, DOC, DOCX supported</p>
                  </button>
                )}
                <p className="text-xs text-zinc-500">
                  Your resume is stored locally. JobOps uses your RxResume profile for AI tailoring — keep both in sync via Settings → Reactive Resume.
                </p>
              </CardContent>
            </Card>

            {/* Preview as markdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Resume Preview (from profile)</CardTitle>
                  <Button variant="ghost" size="sm" onClick={exportResume}>
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-4 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap font-mono">
                  {buildResumeText(profile) || "Fill in your profile to generate a resume preview."}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating save */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 shadow-2xl">
          <p className="text-sm text-zinc-300">Unsaved changes</p>
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { setProfile(loadProfile()); setDirty(false); }}>Discard</Button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder, icon
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>}
        <Input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={cn(icon && "pl-8")}
        />
      </div>
    </div>
  );
}

function ExperienceCard({ exp, onChange, onDelete }: { exp: WorkExperience; onChange: (e: WorkExperience) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(!exp.company);
  const set = (k: keyof WorkExperience, v: unknown) => onChange({ ...exp, [k]: v });

  return (
    <Card>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/20 transition-colors rounded-t-xl"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-zinc-500" />
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-200">
              {exp.title || "New position"}{exp.company ? ` · ${exp.company}` : ""}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {exp.startDate || "Start"} – {exp.current ? "Present" : exp.endDate || "End"}
              {exp.location ? ` · ${exp.location}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </div>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4 border-t border-zinc-800">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Field label="Job title" value={exp.title} onChange={(v) => set("title", v)} placeholder="Software Engineer" />
            <Field label="Company" value={exp.company} onChange={(v) => set("company", v)} placeholder="Acme Corp" />
            <Field label="Location" value={exp.location ?? ""} onChange={(v) => set("location", v)} placeholder="London, UK / Remote" />
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox" checked={exp.current}
                  onChange={(e) => set("current", e.target.checked)}
                  className="rounded border-zinc-600 accent-zinc-300"
                />
                <span className="text-xs text-zinc-400">Current role</span>
              </label>
            </div>
            <Field label="Start date" type="month" value={exp.startDate} onChange={(v) => set("startDate", v)} />
            {!exp.current && (
              <Field label="End date" type="month" value={exp.endDate ?? ""} onChange={(v) => set("endDate", v)} />
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Description & achievements</label>
            <textarea
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
              rows={4}
              placeholder="• Led migration of monolith to microservices, reducing latency by 40%&#10;• Built CI/CD pipeline with GitHub Actions and Docker&#10;• Mentored 3 junior engineers"
              value={exp.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <Field
            label="Technologies used"
            value={exp.technologies ?? ""}
            onChange={(v) => set("technologies", v)}
            placeholder="TypeScript, React, Node.js, PostgreSQL, AWS"
          />
        </CardContent>
      )}
    </Card>
  );
}

function EducationCard({ edu, onChange, onDelete }: { edu: Education; onChange: (e: Education) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(!edu.institution);
  const set = (k: keyof Education, v: unknown) => onChange({ ...edu, [k]: v });

  return (
    <Card>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/20 transition-colors rounded-t-xl"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="h-4 w-4 text-zinc-500" />
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-200">
              {edu.degree || "New qualification"}{edu.field ? ` in ${edu.field}` : ""}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {edu.institution || "Institution"} · {edu.startDate || "—"} – {edu.current ? "Present" : edu.endDate || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </div>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4 border-t border-zinc-800">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Field label="Institution" value={edu.institution} onChange={(v) => set("institution", v)} placeholder="University of London" />
            <Field label="Degree" value={edu.degree} onChange={(v) => set("degree", v)} placeholder="BSc, MSc, PhD…" />
            <Field label="Field of study" value={edu.field} onChange={(v) => set("field", v)} placeholder="Computer Science" />
            <Field label="Grade / Classification" value={edu.grade ?? ""} onChange={(v) => set("grade", v)} placeholder="First Class / 3.8 GPA" />
            <Field label="Start date" type="month" value={edu.startDate} onChange={(v) => set("startDate", v)} />
            {!edu.current && (
              <Field label="End date" type="month" value={edu.endDate ?? ""} onChange={(v) => set("endDate", v)} />
            )}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={edu.current} onChange={(e) => set("current", e.target.checked)} className="rounded border-zinc-600 accent-zinc-300" />
                <span className="text-xs text-zinc-400">Currently studying</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Notes / thesis / projects</label>
            <textarea
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none"
              rows={2}
              value={edu.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Dissertation on distributed systems, awarded department prize…"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SkillRow({ skill, onChange, onDelete }: { skill: Skill; onChange: (s: Skill) => void; onDelete: () => void }) {
  const LEVEL_COLORS: Record<string, string> = {
    beginner: "text-zinc-400", intermediate: "text-blue-400",
    advanced: "text-yellow-400", expert: "text-emerald-400",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2 hover:border-zinc-700 group">
      <Input
        value={skill.name}
        onChange={(e) => onChange({ ...skill, name: e.target.value })}
        placeholder="Skill name"
        className="flex-1 h-7 text-xs"
      />
      <select
        value={skill.category}
        onChange={(e) => onChange({ ...skill, category: e.target.value })}
        className="h-7 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-300 px-2 focus:outline-none"
      >
        {SKILL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select
        value={skill.level}
        onChange={(e) => onChange({ ...skill, level: e.target.value as Skill["level"] })}
        className={cn("h-7 bg-zinc-800/50 border border-zinc-700 rounded text-xs px-2 focus:outline-none", LEVEL_COLORS[skill.level])}
      >
        {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
      </select>
      <button onClick={onDelete} className="p-1 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

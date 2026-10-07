#!/usr/bin/env python3
"""Build the findings site.

  python3 generate.py

Reads   facts.py, roles_data.py, linkedin_roles.json, ../template.html

Letters and resumes are assembled only from facts.py and the role fields in roles_data.py.
"""
import json
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Inches

import facts as F
from roles_data import ROLES

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
DOCS = SITE / "documents"
DOCS.mkdir(exist_ok=True)

LI = {i: r for i, r in enumerate(json.load(open(HERE / "linkedin_roles.json")))}

# ----------------------------------------------------------------------------- evidence paragraphs
ED_STATS = (
    "In the Emergency Department I independently evaluate and manage 15–25 patients per shift with acute, "
    "undifferentiated and life-threatening presentations, including three STEMIs (with STEMI activations), three "
    "NSTEMIs, CHF exacerbations, stroke alerts, seizures and aortic aneurysm. I order and interpret labs and "
    "imaging, work alongside attending physicians, nurses, pharmacists and consultants, and hold ACLS, BLS and ATLS "
    "certification."
)
PROCEDURES = (
    "I perform procedures independently, including sutures (ten or more), incision and drainage (six), epistaxis "
    "management (four), cast placement (three), open fracture management (two) and joint reductions."
)

EVIDENCE = {
    "ed": ED_STATS + " " + PROCEDURES,
    "urgent": (
        "In the Emergency Department I independently evaluate and manage 15–25 patients per shift with acute and "
        "undifferentiated complaints, and I perform procedures independently, including sutures (ten or more), "
        "incision and drainage (six), cast placement (three) and joint reductions. My family medicine, internal "
        "medicine and pediatrics rotations give me a wide base for the range of patients urgent care sees. I hold "
        "ACLS, BLS and ATLS certification."
    ),
    "primary": (
        "I trained in family medicine (Adel and Ankeny, Iowa), internal medicine (two rotations), primary care "
        "(Palos Heights, Illinois), pediatrics and women's health. In my current Emergency Department role I see "
        "15–25 patients per shift, including exacerbations of chronic disease such as CHF (five or more) and "
        "COPD (five or more), so I am used to a steady daily volume and to deciding what needs follow-up and what "
        "needs referral."
    ),
    "derm": (
        "My dermatology rotation in West Des Moines, Iowa gave me a foundation in clinical dermatology, and in the "
        "Emergency Department I perform procedures independently, including sutures (ten or more) and incision and "
        "drainage (six). I see 15–25 patients per shift, so I am comfortable with a fast clinic pace."
    ),
    "surg": (
        "I completed a surgery rotation in Minneapolis, and in the Emergency Department I perform procedures "
        "independently, including sutures (ten or more), incision and drainage (six), epistaxis management (four), "
        "open fracture management (two) and joint reductions. I hold ATLS certification (October 2025) and "
        "see 15–25 patients per shift."
    ),
    "gi": (
        "In the Emergency Department I manage GI and GU presentations, including urinary retention (three), "
        "obstipation (three) and intractable vomiting (two), alongside 15–25 patients per shift with acute and "
        "undifferentiated complaints. My internal medicine and surgery rotations and my procedural skills in the ED "
        "give me a base I can build on."
    ),
    "onc": (
        "My hematology/oncology rotation was at MD Anderson in Houston, and my research background includes a "
        "peer-reviewed publication on pharmacogenomics testing in sickle cell anemia (Pharmacogenomics, 2022). "
        "In the Emergency Department I manage 15–25 patients per shift with acute and undifferentiated "
        "presentations and work closely with consultants."
    ),
    "bh": (
        "I completed a behavioral and mental health rotation in Des Moines, Iowa, and in the Emergency Department "
        "I assess 15–25 patients per shift with acute and undifferentiated presentations, including assault "
        "victims, which has taught me to evaluate patients calmly under pressure."
    ),
    "exam": (
        "In the Emergency Department I perform focused assessments on 15–25 patients per shift, order and "
        "interpret labs and imaging, and document findings under time pressure. My research training in analyzing "
        "data and writing up results supports the accurate, evidence-based documentation this work requires."
    ),
    "locum": (
        "I completed 12 rotations across 8 specialties during my MSPAS training, which prepared me to step into "
        "new settings quickly. In my current Emergency Department role I independently evaluate and manage 15–25 "
        "patients per shift, and I hold ACLS, BLS and ATLS certification."
    ),
    "research": (
        "Before PA school I worked as a Clinical Research Associate, and I earned the CCRA credential in 2023. I "
        "completed four research assistant internships, including pharmacogenomics research in sickle cell "
        "anemia, MEG/EEG neuroscience research, and neuroimaging, and I am a co-author on two peer-reviewed "
        "publications (Pharmacogenomics, 2022; Mathematical Thinking and Learning, 2020). As a PA-C assessing "
        "15–25 patients per shift in an emergency department, I also bring a clinician's view of the patient "
        "safety and clinical judgment that trials depend on."
    ),
}
EVIDENCE["cra"] = EVIDENCE["research"] + " My CCRA credential has lapsed, and I plan to recertify."

# ----------------------------------------------------------------------------- letters
def letter(r):
    """Return {subject, greeting, paragraphs, signoff, text}."""
    title, org = r["title"], r["employer"]
    relocate = r.get("relocate", True)
    kind = r["kind"]

    if kind == "inquiry":
        subject = f"Inquiry: {title} – {org}"
        greeting = "Hello,"
        if r.get("letter_paras"):
            paras = list(r["letter_paras"])
            signoff = ["Thank you,", F.FULL_NAME, f"{F.PHONE} · {F.EMAIL}"]
            text = "\n\n".join([greeting] + paras + ["\n".join(signoff)])
            return dict(subject=subject, greeting=greeting, paragraphs=paras, signoff=signoff, text=text)
        paras = [
            f"I am a board-certified physician assistant (PA-C) working in the Emergency Department at UnityPoint "
            f"Health – Allen Hospital, where I have practiced since October 2025. I am writing about the "
            f"\"{title}\" listing at {org}. {r['hook']}",
            "A short summary of my background: MSPAS from Des Moines University (August 2025); I see 15–25 patients "
            "per shift in a high-volume emergency department; I perform sutures, incision and drainage, "
            "fracture management and joint reductions independently; and I hold ACLS, BLS and ATLS certification.",
            F.LICENSE_LINE + (" " + F.RELOCATE_LINE if relocate else ""),
            "Could you tell me what the next steps would be, and whether a start after January 2027 would work? My "
            "resume is attached.",
        ]
        if r.get("gap"):
            paras.insert(2, r["gap"])
        signoff = [f"Thank you,", F.FULL_NAME, f"{F.PHONE} · {F.EMAIL}"]
    else:
        subject = f"Application: {title} – {org}"
        greeting = "Dear Hiring Manager,"
        if kind == "research":
            opener = (
                f"I am a physician assistant (PA-C) with a clinical research background, working in the Emergency "
                f"Department at UnityPoint Health – Allen Hospital since October 2025, and I am writing to apply "
                f"for the {title} position at {org}."
            )
        else:
            opener = (
                f"I am a board-certified physician assistant (PA-C) working in the Emergency Department at "
                f"UnityPoint Health – Allen Hospital, where I have practiced since October 2025, and I am writing "
                f"to apply for the {title} position at {org}."
            )
        paras = [opener, EVIDENCE[r["track"]], r["hook"]]
        if r.get("gap"):
            paras.append(r["gap"])
        tail = F.LICENSE_LINE if kind != "research" else ""
        if kind != "research" and relocate:
            tail += " " + F.RELOCATE_LINE
        if kind == "research":
            tail = ("I hold an MSPAS from Des Moines University (August 2025) and a BS in neuroscience from "
                    "Indiana University. " + (F.RELOCATE_LINE if relocate else "")).strip()
        paras.append((tail + " I would welcome a conversation about timing.").strip())
        paras.append("Thank you for your consideration. My resume is attached.")
        signoff = ["Sincerely,", F.FULL_NAME, f"{F.PHONE} · {F.EMAIL}"]
        if kind == "pa":
            signoff.append(f"NPI {F.NPI}")
    text = "\n\n".join([greeting] + paras + ["\n".join(signoff)])
    return dict(subject=subject, greeting=greeting, paragraphs=paras, signoff=signoff, text=text)


# ----------------------------------------------------------------------------- resumes
BULLETS = dict(V=F.B_VOLUME, C=F.B_CARDIO, N=F.B_NEURO, P=F.B_PROC, G=F.B_GI, T=F.B_TEAM)
BULLET_ORDER = {
    "ed": "VCNPGT", "locum": "VCNPGT", "urgent": "VPNCGT", "primary": "VNGCTP", "derm": "VPTNCG",
    "surg": "VPCNGT", "gi": "VGPNCT", "onc": "VCNTPG", "bh": "VGNTCP", "exam": "VTNCGP",
    "research": "VT", "cra": "VT",
}
ROT_FIRST = {
    "ed": ["em", "surg", "fm", "im"], "urgent": ["em", "fm", "peds", "im", "pc"], "primary": ["fm", "im", "pc", "peds", "wh"],
    "derm": ["derm", "surg", "peds", "fm"], "surg": ["surg", "em", "peds"], "gi": ["im", "surg", "fm"],
    "onc": ["onc", "im", "surg"], "bh": ["bh", "im", "fm", "pc"], "exam": ["im", "fm", "pc", "em"],
    "locum": ["em", "fm", "im", "pc"], "research": ["onc", "derm", "im"], "cra": ["onc", "derm", "im"],
}
CLINICAL_S1 = "Board-certified Physician Assistant (PA-C) with active clinical experience in a high-volume emergency department."
SUMMARY = {
    "ed": ("Proven ability to independently evaluate and manage acute, critical, and undifferentiated presentations "
           "across emergency medicine, cardiology, neurology, trauma, orthopedics, and primary care. Proficient in "
           "emergency procedures including laceration repair, I&D, fracture management, and joint reduction. "
           "ACLS/BLS/ATLS certified."),
    "urgent": ("Proven ability to independently evaluate and manage acute and undifferentiated presentations, with "
               "procedural skills including laceration repair, I&D, fracture management, and joint reduction. "
               "Training across family medicine, internal medicine, pediatrics, and primary care. ACLS/BLS/ATLS certified."),
    "primary": ("Broad outpatient training across family medicine, internal medicine, primary care, pediatrics, and "
                "women's health, with ED management of chronic disease exacerbations including CHF and COPD. "
                "ACLS/BLS/ATLS certified."),
    "derm": ("Dermatology rotation (West Des Moines, IA) and independent procedural skills including laceration "
             "repair and I&D. Training across family medicine, pediatrics, and surgery. ACLS/BLS/ATLS certified."),
    "surg": ("Surgery rotation (Minneapolis, MN) and independent emergency procedures including laceration repair, "
             "I&D, epistaxis management, fracture management, and joint reduction. ATLS, ACLS and BLS certified."),
    "gi": ("Independent management of GI and GU presentations in the ED, with internal medicine and surgery training "
           "and emergency procedural skills. ACLS/BLS/ATLS certified."),
    "onc": ("Hematology/oncology rotation at MD Anderson (Houston, TX). Published clinical researcher with expertise in "
            "pharmacogenomics and neuroscience. ACLS/BLS/ATLS certified."),
    "bh": ("Behavioral and mental health rotation, with independent evaluation of acute and undifferentiated "
           "presentations in the ED. ACLS/BLS/ATLS certified."),
    "exam": ("Focused physical assessment and accurate documentation of findings, with training in analyzing data and "
             "writing up results. ACLS/BLS/ATLS certified."),
    "locum": ("12 rotations across 8 specialties during MSPAS training, supporting quick adaptation to new settings. "
              "Independent emergency procedures including laceration repair, I&D, fracture management, and joint "
              "reduction. ACLS/BLS/ATLS certified."),
}
RESEARCH_S1 = ("Physician Assistant (PA-C) with a clinical research background: Certified Clinical Research Associate "
               "(CCRA, earned 2023), four research assistant internships, and two peer-reviewed publications. Active "
               "clinical experience in a high-volume emergency department.")


def resume(r):
    track, kind = r["track"], r["kind"]
    research_first = track in ("research", "cra")
    if research_first:
        summary = RESEARCH_S1
        if track == "cra":
            summary += " CCRA recertification planned."
        summary += " Seeking the " + r["title"] + " position at " + r["employer"] + "."
    else:
        summary = CLINICAL_S1 + " " + SUMMARY[track] + " Seeking the " + r["title"] + " position at " + r["employer"] + "."

    bullets = [BULLETS[c] for c in BULLET_ORDER[track]]
    first = ROT_FIRST[track]
    rots = sorted(F.ROTATIONS, key=lambda kv: (first.index(kv[0]) if kv[0] in first else 99))
    if research_first:
        rots_block = ["12 rotations across 8 specialties during MSPAS training, including hematology/oncology "
                      "(MD Anderson, Houston, TX) and dermatology (West Des Moines, IA)."]
    else:
        rots_block = [t for _, t in rots]

    blocks = []  # generic blocks the page and docx writer both consume
    def sec(title): blocks.append(dict(t="sec", x=title))
    def entry(left, right, sub=None, sub2=None): blocks.append(dict(t="entry", left=left, right=right, sub=sub, sub2=sub2))
    def li(x): blocks.append(dict(t="li", x=x))
    def p(x): blocks.append(dict(t="p", x=x))

    sec("PROFESSIONAL SUMMARY"); p(summary)
    if research_first:
        sec("RESEARCH EXPERIENCE")
        for title, dates, org, text in F.RESEARCH:
            entry(title, dates, org); li(text)
        sec("PUBLICATIONS & PRESENTATIONS")
        for x in F.PUBLICATIONS: p(x)
        sec("CERTIFICATIONS & LICENSURE")
        for x in F.CERTS: li(x)
        sec("PROFESSIONAL EXPERIENCE")
        entry(F.JOB["title"], F.JOB["dates"], F.JOB["org"] + "  |  " + F.JOB["where"])
        for x in bullets: li(x)
        sec("EDUCATION")
        for t, d, o, w in F.EDUCATION: entry(t, d, o + "  |  " + w)
        sec("CLINICAL TRAINING"); p(rots_block[0])
    else:
        sec("PROFESSIONAL EXPERIENCE")
        entry(F.JOB["title"], F.JOB["dates"], F.JOB["org"] + "  |  " + F.JOB["where"])
        for x in bullets: li(x)
        sec("EDUCATION")
        for t, d, o, w in F.EDUCATION: entry(t, d, o + "  |  " + w)
        sec("CERTIFICATIONS & LICENSURE")
        for x in F.CERTS: li(x)
        sec("CLINICAL ROTATION EXPERIENCE")
        p("12 rotations completed across 8 specialties during MSPAS training:")
        for x in rots_block: li(x)
        sec("PUBLICATIONS & PRESENTATIONS")
        for x in F.PUBLICATIONS: p(x)
        if track in ("onc", "derm"):
            sec("RESEARCH EXPERIENCE")
            for title, dates, org, text in F.RESEARCH:
                entry(title, dates, org); li(text)
    sec("VOLUNTEER & COMMUNITY SERVICE"); li(F.VOLUNTEER)
    sec("PROFESSIONAL REFERENCES"); p("Available upon request.")

    header = dict(name=F.NAME.upper() + ", " + F.CREDS,
                  contact=f"{F.EMAIL}  |  {F.PHONE}  |  NPI: {F.NPI}  |  {F.WEBSITE}")
    # plain text
    out = [header["name"], header["contact"], ""]
    for b in blocks:
        if b["t"] == "sec": out += ["", b["x"]]
        elif b["t"] == "p": out.append(b["x"])
        elif b["t"] == "li": out.append("• " + b["x"])
        elif b["t"] == "entry":
            out.append(f"{b['left']} — {b['right']}")
            if b.get("sub"): out.append(b["sub"])
    return dict(header=header, blocks=blocks, text="\n".join(out).strip())


# ----------------------------------------------------------------------------- docx writers
def _font(doc, name="Calibri", size=11):
    st = doc.styles["Normal"]
    st.font.name = name
    st.font.size = Pt(size)
    st.paragraph_format.space_after = Pt(6)


def write_letter_docx(r, L, path):
    doc = Document()
    for s in doc.sections:
        s.left_margin = s.right_margin = Inches(1)
        s.top_margin = s.bottom_margin = Inches(1)
    _font(doc, size=11)
    if r["kind"] == "inquiry":
        pp = doc.add_paragraph(); pp.add_run("Subject: " + L["subject"]).bold = True
    doc.add_paragraph(L["greeting"])
    for t in L["paragraphs"]:
        doc.add_paragraph(t)
    for i, t in enumerate(L["signoff"]):
        pp = doc.add_paragraph(t)
        pp.paragraph_format.space_after = Pt(0 if i < len(L["signoff"]) - 1 else 6)
        if i == 1: pp.runs[0].bold = True
    doc.save(path)


def write_resume_docx(R, path):
    doc = Document()
    for s in doc.sections:
        s.left_margin = s.right_margin = Inches(0.8)
        s.top_margin = s.bottom_margin = Inches(0.7)
    _font(doc, size=10)
    h = doc.add_paragraph(); h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = h.add_run(R["header"]["name"]); run.bold = True; run.font.size = Pt(16)
    c = doc.add_paragraph(R["header"]["contact"]); c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for b in R["blocks"]:
        if b["t"] == "sec":
            pp = doc.add_paragraph(); pp.paragraph_format.space_before = Pt(8); pp.paragraph_format.space_after = Pt(2)
            rr = pp.add_run(b["x"]); rr.bold = True; rr.font.size = Pt(11)
        elif b["t"] == "p":
            doc.add_paragraph(b["x"])
        elif b["t"] == "li":
            pp = doc.add_paragraph(b["x"], style="List Bullet"); pp.paragraph_format.space_after = Pt(2)
        elif b["t"] == "entry":
            pp = doc.add_paragraph(); pp.paragraph_format.space_after = Pt(0)
            pp.add_run(b["left"]).bold = True
            pp.add_run("   " + b["right"])
            if b.get("sub"):
                q = doc.add_paragraph(b["sub"]); q.paragraph_format.space_after = Pt(2)
    doc.save(path)


# ----------------------------------------------------------------------------- build
def clean_desc(t):
    t = t.replace("\r", "")
    # LinkedIn text is hard-wrapped with whitespace-only lines inside sentences; real paragraph breaks are empty lines.
    t = re.sub(r"[ \t]*\n(?:[ \t]+\n)+[ \t]*(?![*•\-]\s|\*\*)", " ", t)
    t = re.sub(r"\*{3,}", "**", t)
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def build():
    out = []
    for r in ROLES:
        r = dict(r)
        d = r["desc"]
        if d.startswith("LI:"):
            li = LI[int(d[3:])]
            r["description"] = clean_desc(li["description"])
            r["url"] = li["url"]
            r["posted"] = li["posted"] or r.get("posted", "")
            r["descKind"] = "full"
        else:
            r["description"] = d
            r["descKind"] = "summary"
        fit = list(r["fit"])
        if r.get("annual") is not None and r["annual"] < 110000 and not any("$110k" in x[1] for x in fit):
            fit.append(("warn", f"Pay tops out around ${r['annual']//1000}k a year, below your $110k minimum."))
        L = letter(r)
        R = resume(r)
        write_letter_docx(r, L, DOCS / f"{r['id']}-cover-letter.docx")
        write_resume_docx(R, DOCS / f"{r['id']}-resume.docx")
        out.append(dict(
            id=r["id"], group=r["group"], kind=r["kind"], track=r["track"], title=r["title"], employer=r["employer"],
            location=r["location"], pay=r["pay"], posted=r.get("posted", ""), deadline=r.get("deadline", ""),
            url=r.get("url"), searchNote=r.get("search_note", ""), source=r["source"],
            description=r["description"], descKind=r["descKind"], fit=fit, letter=L, resume=R,
            docs=dict(letter=f"documents/{r['id']}-cover-letter.docx", resume=f"documents/{r['id']}-resume.docx"),
        ))
    return out


if __name__ == "__main__":
    data = build()
    payload = dict(
        generated="2026-10-07",
        applicant=dict(name=F.FULL_NAME, email=F.EMAIL, phone=F.PHONE),
        roles=data,
    )
    tpl = (SITE / "template.html").read_text()
    blob = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    assert "/*__DATA__*/null" in tpl
    page = tpl.replace("/*__DATA__*/null", blob)
    # artifact.html is the fragment published to claude.ai (the platform adds the document shell).
    (SITE / "artifact.html").write_text(page)
    # index.html is the same page with its own shell, for serving locally.
    cut = page.index("</style>") + len("</style>")
    shell = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n')
    (SITE / "index.html").write_text(shell + page[:cut] + "\n</head>\n<body>\n" + page[cut:] + "\n</body>\n</html>\n")
    print(f"{len(data)} roles, {len(data) * 2} documents, index.html {(SITE / 'index.html').stat().st_size // 1024} KB")

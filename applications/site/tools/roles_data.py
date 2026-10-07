"""Role definitions: 18 LinkedIn postings (full text from the job-ops database), 16 from the earlier
Indeed/ZipRecruiter search, and 16 from the earlier application packages.

Fields
  id        slug used in URLs and file names
  group     list section
  kind      pa | research | inquiry (recruiter/agency/military: letter becomes a short email)
  track     picks the evidence paragraph and the resume emphasis (see generate.py)
  desc      "LI:<n>" pulls the full posting text from linkedin_roles.json, otherwise a summary
  hook      one sentence about why this employer or role, taken from the posting or search result
  gap       optional candid sentence for a requirement the applicant does not yet meet
  relocate  False for remote or Southern California roles where the "moving to the Sacramento area" line does not apply
  fit       [(status, text)], status in ok / warn / gap / info
  annual    top of the pay range as a yearly figure, used for the "below your $110k minimum" check
"""

G_ED = "Emergency & urgent care"
G_SPEC = "Specialty clinics"
G_PRIM = "Primary care & outpatient"
G_EXAM = "Exams & virtual"
G_LOCUM = "Locum & agencies"
G_RES = "Clinical research"
G_OTHER = "Federal & military"

LIC = ("warn", "California PA license is not issued yet (expected January 2027). Ask whether a start date after "
               "issue is acceptable.")
IND = "Indeed (via connector search)"
ZR = "ZipRecruiter (via connector search)"
LI = "LinkedIn (job-ops run, full posting text)"
PKG = "Earlier application package"

ROLES = [
    # ------------------------------------------------------------------ LinkedIn, full postings
    dict(id="sutter-peds-ent", group=G_SPEC, kind="pa", track="surg", desc="LI:0",
         title="Nurse Practitioner or Physician Assistant, Pediatric ENT", employer="Sutter Health",
         location="Sacramento & Elk Grove, CA", pay="$168–231k/yr", annual=231000, posted="2026-10-06", source=LI,
         hook="Sutter Medical Group's new Pediatric ENT role, split between Sacramento and Elk Grove across inpatient "
              "and outpatient care, is the kind of procedural, family-facing work I want to build a career in.",
         gap="The posting asks for a year of ENT, allergy or audiology experience. I do not have that yet; what I bring "
             "is pediatric and surgical training, hands-on epistaxis management, and a willingness to be trained by "
             "your ENT physicians.",
         fit=[LIC, ("gap", "Posting requires 1+ year of prior experience in ENT, allergy or audiology. Your resume has "
                           "none; the letter says so directly."),
              ("ok", "Surgery, pediatrics and ED procedures (including 4 epistaxis cases) are the closest match you have."),
              ("ok", "Pay is well above your $110k minimum.")]),

    dict(id="army-pa-sacramento", group=G_OTHER, kind="inquiry", track="ed", desc="LI:1",
         title="Physician Assistant (U.S. Army)", employer="Army Healthcare (U.S. Army)",
         location="Sacramento, CA recruiting battalion", pay="Not listed", annual=None, posted="2026-10-06", source=LI,
         hook="I am interested in serving as an Army Physician Assistant and would like to understand the commissioning "
              "process.",
         letter_paras=[
             "I am a board-certified physician assistant (PA-C) working in the Emergency Department at UnityPoint "
             "Health – Allen Hospital since October 2025, with a Master of Science in Physician Assistant Studies from "
             "Des Moines University (August 2025).",
             "I am interested in serving as an Army Physician Assistant, and I would like to understand the "
             "commissioning process, the length of the service obligation, and current openings in the Sacramento area.",
             "In my current role I see 15–25 patients per shift in a high-volume emergency department, perform "
             "procedures independently, and hold ACLS, BLS and ATLS certification.",
             "Could we arrange a call? Please also tell me which documents you would need to confirm my eligibility.",
         ],
         fit=[("warn", "Military service, not a civilian job: it comes with a service commitment and a commissioning "
                       "process run through a recruiter."),
              ("warn", "Posting lists U.S. citizenship for Active Duty and permanent residency for Reserve. Confirm you "
                       "meet it."),
              ("info", "This one is written as a short email to the recruiter, not a cover letter.")]),

    dict(id="imagen-ir-pa", group=G_SPEC, kind="pa", track="surg", desc="LI:2",
         title="Interventional Radiology Physician Assistant / Nurse Practitioner (part-time, 2 days/week)",
         employer="Imagen Technologies", location="Inland Empire, CA (listed under Napa)", pay="Not listed",
         annual=None, posted="2026-10-05", source=LI, relocate=False,
         hook="A procedural practice that combines fluoroscopy-guided interventions with a broader IR case mix, working "
              "next to onsite radiologists, appeals to the part of my training that I enjoy most.",
         gap="I have not worked in interventional radiology; my procedural experience comes from the ED and my "
             "surgery rotation, and I would expect to be trained into the IR workflow.",
         fit=[LIC, ("gap", "Onsite in the Inland Empire (Southern California), a long way from Sacramento. Two days a "
                           "week, so it would need to be a second job or a move."),
              ("warn", "No interventional radiology experience on your resume."),
              ("ok", "Multiple positions are open.")]),

    dict(id="protouch-primary-carmichael", group=G_PRIM, kind="pa", track="primary", desc="LI:3",
         title="Physician Assistant, Primary Care / Internal Medicine", employer="Protouch Staffing",
         location="Carmichael, CA", pay="$75–95/hr", annual=197600, posted="2026-10-05", source=LI,
         hook="An established primary care and internal medicine practice serving a diverse adult and geriatric "
              "population, with a steady daily patient volume, is a good fit for how I am used to working.",
         gap="The posting says it wants an experienced PA with a minimum of 22 patients per day; I have about a year of "
             "full-time ED practice and see 15–25 patients per shift.",
         fit=[LIC, ("warn", "Requires current DEA registration. Ask whether it can follow the California license."),
              ("warn", "Wants an 'experienced' PA; you have about one year of practice."),
              ("ok", "Minimum 22 patients per day is in line with your 15–25 per ED shift."),
              ("info", "Travel between two sites 10–20 minutes apart, 1–2 days a week.")]),

    dict(id="kaiser-pa2-roseville", group=G_ED, kind="pa", track="ed", desc="LI:4",
         title="Physician Assistant II (Senior Physician Assistant)", employer="Kaiser Permanente",
         location="Roseville, CA", pay="$110–117/hr", annual=243360, posted="2026-10-04", source=LI,
         hook="The Senior Physician Assistant role at Kaiser Roseville spans the office, hospital, ED and "
              "perioperative settings, which matches the range of care I trained for.",
         gap="I know the posting asks for three years of PA experience in the last five. I have about a year of "
             "full-time emergency practice, so if a different level fits my experience better, I would welcome the "
             "chance to be considered for it.",
         fit=[LIC, ("gap", "Basic qualification: 3 years as a PA in the last 5. You have about 1 year, so this level is "
                           "unlikely. Ask whether a Physician Assistant I opening exists."),
              ("ok", "Setting (ED, hospital, office, first assist in the OR) matches your range."),
              ("ok", "Pay is far above your $110k minimum."),
              ("info", "May require evening or weekend hours and on-call.")]),

    dict(id="ucdavis-gi-pa", group=G_SPEC, kind="pa", track="gi", desc="LI:5",
         title="Gastroenterology Physician Assistant", employer="UC Davis Health",
         location="Sacramento, CA (Midtown ambulatory)", pay="$88–116/hr", annual=241280, posted="2026-10-05", source=LI,
         deadline="Apply by Oct 20, 2026, 11:59 p.m. PST",
         hook="Eight half-days of ambulatory GI care covering IBD, hepatology, motility and advanced endoscopy at UC Davis "
              "Health is a chance to join an academic specialty team.",
         gap="I have not worked in gastroenterology; I would bring ED experience managing GI emergencies and a strong "
             "interest in learning the specialty.",
         fit=[LIC, ("warn", "Deadline Oct 20, 2026 (11:59 p.m. PST). The same job is also posted under University of "
                            "California, Davis."),
              ("warn", "No GI-specific experience. The posting asks for care 'consistent with education and experience "
                       "in the specialty'."),
              ("ok", "Ambulatory, daytime and half-day blocks.")]),

    dict(id="loyal-source-examiner-rocklin", group=G_EXAM, kind="pa", track="exam", desc="LI:6",
         title="Examiner Physician Assistant (VA Compensation & Pension exams)", employer="Loyal Source Government Services",
         location="Rocklin, CA", pay="Not listed", annual=None, posted="2026-10-04", source=LI,
         hook="Performing focused physical assessments and writing objective, evidence-based opinions for Veterans' "
              "disability claims is careful, documentation-heavy work that I take seriously.",
         fit=[LIC, ("warn", "Not a treatment role: no prescribing, no treatment planning, no ongoing patient care. It "
                            "will not build your ED or procedural skills."),
              ("warn", "The listed education requirement mentions a nursing program. Confirm PAs are eligible before "
                       "applying."),
              ("info", "Pay not listed. Check it against your $110k minimum.")]),

    dict(id="pacific-skin-app-derm", group=G_SPEC, kind="pa", track="derm", desc="LI:8",
         title="Advanced Practice Provider, Dermatology", employer="Pacific Skin Institute",
         location="Sacramento, CA", pay="$95–211k/yr", annual=211000, posted="2026-10-06", source=LI,
         hook="A growing adult and pediatric medical and surgical dermatology practice with a four-month in-house "
              "training program, where prior dermatology experience is not required, is an ideal place for me to "
              "start in the specialty.",
         fit=[LIC, ("warn", "The posting body asks for a 'licensed Nurse Practitioner', though it also mentions PA/NP "
                            "teams. Ask whether PAs are considered."),
              ("ok", "Dermatology experience not required; 4-month training program. You have a dermatology rotation."),
              ("ok", "Wide pay range; the top is well above your minimum, so ask where a new PA lands.")]),

    dict(id="ucdavis-cardiology-acrc", group=G_RES, kind="research", track="research", desc="LI:9",
         title="Clinical Research Coordinator Assistant (Cardiology)", employer="UC Davis",
         location="Sacramento, CA", pay="$32–53/hr", annual=110240, posted="2026-10-06", source=LI,
         hook="Coordinating outpatient cardiovascular clinical trials, from recruitment and screening to enrollment, "
              "combines the research training I have with the cardiac patients I see in the ED.",
         fit=[("warn", "Coordinator-level: pay is well below a PA salary. Only makes sense as a fallback or side option."),
              ("ok", "Cardiology research. Your STEMI/NSTEMI/CHF ED experience is directly relevant."),
              ("info", "Requires dangerous-goods shipping certification every two years and the UC annual compliance "
                       "briefing (trained on the job).")]),

    dict(id="actalent-pulmonary-crc", group=G_RES, kind="research", track="research", desc="LI:10",
         title="Clinical Research Coordinator (Pulmonary)", employer="Actalent",
         location="Sacramento, CA", pay="$30–36/hr", annual=74880, posted="2026-10-06", source=LI,
         hook="A high-volume pulmonary research program running clinical trials and disease registries is a chance to "
              "use both my clinical and my research background.",
         fit=[("warn", "Coordinator-level pay, well below a PA salary."),
              ("ok", "Wants 1+ year of clinical research experience. You have your breast/oncology CRA role at IU Simon "
                     "(2022–2023), four research internships and two publications."),
              ("ok", "Pulmonary matches your COPD and respiratory ED experience.")]),

    dict(id="epic-care-med-onc-app", group=G_SPEC, kind="pa", track="onc", desc="LI:11",
         title="Medical Oncology, Advanced Practice Provider (NP or PA)", employer="Epic Care / The US Oncology Network",
         location="Pleasant Hill, CA", pay="$145–175k/yr", annual=175000, posted="2026-10-04", source=LI,
         hook="Epic Care's physician-led, multi-specialty group in the East Bay, with a medical oncology team that needs an "
              "advanced practice provider, is where I would like to use my MD Anderson rotation and my breast/oncology "
              "research experience.",
         fit=[LIC, ("warn", "Requires prescriptive authorization and an active DEA license. Both follow the California "
                            "license."),
              ("ok", "Oncology experience preferred but not required. You have a hematology/oncology rotation at MD Anderson "
                     "and a breast/oncology CRA role at IU Simon (2022–2023)."),
              ("ok", "Pay is above your minimum.")]),

    dict(id="alignment-care-anywhere-modesto", group=G_PRIM, kind="pa", track="primary", desc="LI:12",
         title="Advanced Practice Clinician, Care Anywhere (home visits, Stanislaus County)", employer="Alignment Health",
         location="Modesto, CA", pay="$130–195k/yr", annual=195498, posted="2026-10-06", source=LI,
         hook="Caring for seniors and the chronically ill and frail in their homes, as part of a team that includes "
              "nurses, health coaches and social workers, is work that matters to me.",
         fit=[LIC, ("ok", "Accepts an active NP or PA license. The RN license and furnishing number lines apply to NP only."),
              ("ok", "Prior experience: none required; 1 year of clinical or home care preferred. You have it."),
              ("warn", "Home visits across Stanislaus County: a lot of driving, about 1.5 hours from Sacramento."),
              ("ok", "Master's from a PA program is the stated education requirement.")]),

    dict(id="tvhc-adult-medicine", group=G_PRIM, kind="pa", track="primary", desc="LI:13",
         title="Nurse Practitioner / Physician Assistant, Adult Medicine", employer="Tiburcio Vasquez Health Center",
         location="Union City, CA", pay="$69–87/hr", annual=180960, posted="2026-10-05", source=LI,
         hook="Providing culturally sensitive, value-based adult care to a diverse, multilingual community at a "
              "Federally Qualified Health Center is the kind of mission I want to work in.",
         fit=[LIC, ("ok", "Outpatient adult medicine. Your family medicine, internal medicine and primary care rotations "
                          "apply."),
              ("ok", "Forgivable loan up to $50,000 after 18 months of employment and a 3-year commitment."),
              ("warn", "Union City is in the East Bay, about 2 hours from Sacramento.")]),

    dict(id="mrg-exams-modesto", group=G_EXAM, kind="pa", track="exam", desc="LI:14",
         title="Nurse Practitioner or Physician Assistant, Veteran Disability Assessments", employer="MRG Exams",
         location="Modesto, CA", pay="$66–75k/yr", annual=75000, posted="2026-10-05", source=LI,
         hook="Conducting focused in-person exams and completing accurate documentation for Veterans' disability "
              "claims is meaningful, detail-driven work.",
         fit=[LIC, ("gap", "Pay tops out at $75k, well below your $110k minimum."),
              ("warn", "Assessment role, not treatment. Will not build clinical skills.")]),

    dict(id="axis-annual-wellness-pleasanton", group=G_PRIM, kind="pa", track="primary", desc="LI:15",
         title="Annual Wellness Visit Provider", employer="Axis Community Health",
         location="Pleasanton, CA", pay="$75–122/hr", annual=253760, posted="2026-10-05", source=LI,
         hook="Axis Community Health's mission to provide quality, affordable care across all ages in the Tri-Valley "
              "area is one I would be glad to support.",
         gap="The posting asks for two years in a primary care setting. My primary care experience so far comes from "
             "my training rotations and about a year in the ED, so I would be a newer provider than you describe.",
         fit=[LIC, ("gap", "Requires 2+ years of experience in a primary care clinical setting. You have rotations only."),
              ("warn", "Requires current California license, DEA and board certification or eligibility with a set exam "
                       "date. The listing accepts MD, DO, PA or NP."),
              ("info", "Also asks for typing 35 wpm.")]),

    dict(id="medix-crc-walnut-creek", group=G_RES, kind="research", track="research", desc="LI:16",
         title="Clinical Research Coordinator (via Medix)", employer="Medix",
         location="Walnut Creek, CA", pay="Not listed", annual=None, posted="2026-10-05", source=LI,
         hook="Managing protocol-driven visits and end-to-end trial operations with principal investigators, sponsors "
              "and CROs is work I understand from the CRA side.",
         fit=[("warn", "Recruiter posting at coordinator level. Pay not listed; research roles pay below PA roles."),
              ("ok", "Bachelor's in a relevant field, or hands-on research experience, is required. You have a BS in "
                     "neuroscience and CRA work.")]),

    dict(id="sqrl-oncology-crc", group=G_RES, kind="research", track="research", desc="LI:17",
         title="Clinical Research Coordinator (Oncology)", employer="SQRL",
         location="Walnut Creek, CA (on site Mon–Fri)", pay="$37–48/hr", annual=99840, posted="2026-10-05", source=LI,
         hook="A fast-growing network of clinical research sites running oncology trials is a natural place to combine "
              "my breast/oncology CRA experience at IU Simon with my MD Anderson rotation.",
         fit=[("warn", "Coordinator-level pay, below a PA salary."),
              ("ok", "Benefits listed: 15 days PTO, 10 holidays, health/dental/vision, 4% 401(k) match."),
              ("ok", "Oncology matches your breast/oncology CRA role at IU Simon and your MD Anderson rotation.")]),

    dict(id="redbock-crc-pleasanton", group=G_RES, kind="research", track="research", desc="LI:18",
         title="Clinical Research Coordinator (part-time, 20–30 hrs/week)", employer="Redbock, an NES Fircroft company",
         location="Pleasanton, CA", pay="$40–45/hr", annual=None, posted="2026-10-06", source=LI,
         hook="A part-time coordinator role handling study visits, source documents and EDC data entry would let me "
              "keep clinical research skills sharp while I complete licensure.",
         fit=[("info", "Part-time (20–30 hrs/week). Could pair with a PA job."),
              ("ok", "Duties (visit scheduling, source documents, EDC entry, query resolution, adverse event follow-up) "
                     "match CRA training.")]),

    # ------------------------------------------------------------------ earlier connector search (Indeed / ZipRecruiter)
    dict(id="signify-in-home-traveler", group=G_PRIM, kind="pa", track="primary", desc=(
            "Search summary. Full posting not captured. In-home traveler NP/PA for the West Coast, California, "
            "$95.7–206.2k/yr, posted Oct 3. In-home visits with travel; not an ER role."),
         title="In-Home Traveler NP/PA, West Coast", employer="Signify Health", location="California (travel)",
         pay="$95.7–206.2k/yr", annual=206200, posted="2026-10-03", source=IND,
         url="https://to.indeed.com/aayz2sz9w886",
         hook="Signify's in-home visits bring care to patients where they live, and I would like to bring my family "
              "medicine and internal medicine training to that setting.",
         fit=[LIC, ("warn", "Travel across the West Coast. Check the schedule and how much is overnight."),
              ("info", "Pay range is wide ($95.7–206.2k); ask where a new PA starts.")]),

    dict(id="north-valley-mobile-wound-care", group=G_SPEC, kind="pa", track="surg", desc=(
            "Search summary. Full posting not captured. NP/PA, mobile wound care, part-time, Rancho Cordova. "
            "Listed at $240k+. Seen on ZipRecruiter two days before the search."),
         title="NP/PA, Mobile Wound Care (part-time)", employer="North Valley Specialty Group",
         location="Rancho Cordova, CA", pay="$240k+/yr", annual=240000, posted="2026-10-04", source=ZR,
         search_note="Search ZipRecruiter for 'North Valley Specialty Group wound care'.",
         hook="Mobile wound care is procedural, hands-on work, and I already perform incision and drainage, laceration "
              "repair and fracture management in the ED.",
         fit=[LIC, ("info", "Part-time. The $240k+ figure is likely a full-time equivalent; ask.")]),

    dict(id="sacramento-ent-stockton", group=G_SPEC, kind="pa", track="surg", desc=(
            "Search summary. Full posting not captured. PA for an ENT practice in Stockton, $120–145k/yr, posted "
            "Sept 17."),
         title="Physician Assistant (ENT)", employer="Sacramento ENT", location="Stockton, CA",
         pay="$120–145k/yr", annual=145000, posted="2026-09-17", source=IND,
         url="https://to.indeed.com/aa9czwkcbkcc",
         hook="An ENT practice is a procedural specialty where my ED epistaxis, laceration and I&D experience carries "
              "over directly.",
         gap="I have not worked in ENT; I would expect to be trained in the specialty.",
         fit=[LIC, ("warn", "No ENT experience on your resume."), ("ok", "Pay is above your minimum.")]),

    dict(id="community-behavioral-health-roseville", group=G_SPEC, kind="pa", track="bh", desc=(
            "Search summary. Full posting not captured. PA-C, behavioral health, Roseville (also Auburn), "
            "$135–180k/yr, posted Oct 1. Not an ER role."),
         title="PA-C (Behavioral Health)", employer="Community Behavioral Health", location="Roseville / Auburn, CA",
         pay="$135–180k/yr", annual=180000, posted="2026-10-01", source=IND,
         url="https://to.indeed.com/aavmcz9wkrtl",
         hook="A behavioral health practice in Roseville is a setting where the mental health rotation I completed "
              "would be put to use daily.",
         fit=[LIC, ("warn", "Behavioral health is a change from emergency medicine; you have one rotation."),
              ("ok", "Pay is well above your minimum."),
              ("info", "Also posted for Auburn: https://to.indeed.com/aalkm8g4vy4l")]),

    dict(id="panoramic-health-app-concord", group=G_PRIM, kind="pa", track="primary", desc=(
            "Search summary. Full posting not captured. Advanced Practice Provider, Concord, $72–82/hr, posted "
            "Sept 29."),
         title="Advanced Practice Provider", employer="Panoramic Health", location="Concord, CA",
         pay="$72–82/hr", annual=170560, posted="2026-09-29", source=IND,
         url="https://to.indeed.com/aabjf7j7ctxv",
         hook="I am looking for an outpatient advanced practice role where I can build lasting patient relationships "
              "after my ED training.",
         fit=[LIC, ("warn", "Posting details were not captured. Read the full listing for specialty and schedule."),
              ("warn", "Concord is in the East Bay, about 1.5 hours from Sacramento.")]),

    dict(id="perlman-urology-virtual", group=G_EXAM, kind="pa", track="gi", desc=(
            "Search summary. Full posting not captured. Virtual urology PA, part-time, $130–160k/yr, California, "
            "posted Oct 1."),
         title="Urology PA (virtual, part-time)", employer="Perlman Clinic", location="Remote (California)",
         pay="$130–160k/yr", annual=160000, posted="2026-10-01", source=IND, relocate=False,
         url="https://to.indeed.com/aa2j22kkgnv4",
         hook="A virtual urology role would let me use the GU presentations I manage in the ED, such as urinary "
              "retention, in a specialty setting.",
         gap="I have not practiced urology or telemedicine; I would be learning both.",
         fit=[LIC, ("warn", "No telemedicine or urology experience on your resume."),
              ("info", "Part-time. Could pair with a clinic job.")]),

    dict(id="one-medical-virtual", group=G_EXAM, kind="pa", track="primary", desc=(
            "Search summary. Full posting not captured. Virtual NP/PA, California license required, "
            "$59–65.50/hr, posted Sept 25."),
         title="Virtual NP/PA", employer="One Medical", location="Remote (California license)",
         pay="$59–65.50/hr", annual=136240, posted="2026-09-25", source=IND, relocate=False,
         url="https://to.indeed.com/aal987s74zph",
         hook="One Medical's virtual care model needs clinicians who can reach a sound assessment from the history "
              "and a focused exam, which is how I work with undifferentiated ED patients.",
         gap="I have not delivered care by telehealth yet.",
         fit=[("gap", "Needs an active California license, so you cannot start before it is issued (expected January 2027)."),
              ("warn", "No telehealth experience on your resume."),
              ("ok", "Hourly rate works out to about $123–136k/yr full-time.")]),

    dict(id="weatherby-locum-family-practice", group=G_LOCUM, kind="pa", track="locum", desc=(
            "Search summary. Full posting not captured. Locum PA, family practice, California, $70–90/hr, "
            "posted Sept 30."),
         title="Locum PA, Family Practice (California)", employer="Weatherby Healthcare", location="California",
         pay="$70–90/hr", annual=187200, posted="2026-09-30", source=IND,
         url="https://to.indeed.com/aadchy88mqqw",
         hook="Weatherby's California locum assignments in family practice would let me build outpatient experience "
              "across different clinics.",
         fit=[LIC, ("info", "Locum agencies need an issued license before placing you; ask when to apply.")]),

    dict(id="abbvie-cra1-derm", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Clinical Research Associate I, Southern California "
            "(Dermatology), Los Angeles, posted Oct 6. Pay not listed."),
         title="Clinical Research Associate I, Southern California (Dermatology)", employer="AbbVie",
         location="Los Angeles, CA", pay="Not listed", annual=None, posted="2026-10-06", source=IND, relocate=False,
         url="https://to.indeed.com/aaczlyzllgx7",
         hook="AbbVie's dermatology CRA I role fits my CRA experience and the clinical training from my dermatology "
              "rotation.",
         fit=[("warn", "CCRA is expired and recertification is in process; the letter says so. Finishing it first would "
                       "strengthen this application."),
              ("ok", "Entry-level CRA role: the most realistic CRA target found."),
              ("warn", "Los Angeles: far from Sacramento, with field travel.")]),

    dict(id="city-of-hope-cra1", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Clinical Research Associate I, Duarte, $34.50–43.22/hr, "
            "posted Oct 5. Institutional research role."),
         title="Clinical Research Associate I", employer="City of Hope", location="Duarte, CA",
         pay="$34.50–43.22/hr", annual=89900, posted="2026-10-05", source=IND, relocate=False,
         url="https://to.indeed.com/aa6vwwzysnsy",
         hook="City of Hope's research mission, with trials run inside the institution that treats the patients, "
              "appeals to my clinical and research training.",
         fit=[("warn", "Pay is below your $110k minimum."),
              ("warn", "Southern California (Duarte). Not near Sacramento."),
              ("warn", "CCRA is expired and recertification is in process; the letter says so.")]),

    dict(id="ucdavis-health-crc-zr", group=G_RES, kind="research", track="research", desc=(
            "Search summary. Full posting not captured. Clinical Research Coordinator, Sacramento, "
            "$72.7–116.9k/yr, posted the day of the search."),
         title="Clinical Research Coordinator", employer="UC Davis Health", location="Sacramento, CA",
         pay="$72.7–116.9k/yr", annual=116900, posted="2026-10-06", source=ZR,
         search_note="Search ZipRecruiter for 'UC Davis Health Clinical Research Coordinator'.",
         hook="UC Davis Health's research programs in Sacramento are a place where I would like to use my research "
              "training.",
         fit=[("ok", "Local, and the top of the range is above your $110k minimum."),
              ("info", "Different from the UC Davis cardiology ACRC posting above.")]),

    dict(id="retinal-consultants-crc", group=G_RES, kind="research", track="research", desc=(
            "Search summary. Full posting not captured. Clinical Research Coordinator, Sacramento, $62–89k/yr."),
         title="Clinical Research Coordinator", employer="Retinal Consultants Medical Group",
         location="Sacramento, CA", pay="$62–89k/yr", annual=89000, posted="", source=ZR,
         search_note="Search ZipRecruiter for 'Retinal Consultants Medical Group Clinical Research Coordinator'.",
         hook="A retinal research practice running clinical trials in Sacramento is a good fit for my research "
              "background.",
         fit=[("warn", "Pay is below your $110k minimum.")]),

    dict(id="apex-research-crc-fair-oaks", group=G_RES, kind="research", track="research", desc=(
            "Search summary. Full posting not captured. Clinical Research Coordinator, Fair Oaks, $56–70k/yr."),
         title="Clinical Research Coordinator", employer="APEX Research Group", location="Fair Oaks, CA",
         pay="$56–70k/yr", annual=70000, posted="", source=ZR,
         search_note="Search ZipRecruiter for 'APEX Research Group Clinical Research Coordinator'.",
         hook="APEX Research Group's trial work in Fair Oaks matches my research training.",
         fit=[("warn", "Pay is below your $110k minimum.")]),

    dict(id="thermo-fisher-fsp-cra", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. FSP CRA II / Senior CRA I, Oncology, US West, remote, "
            "$60–109.5k/yr. Needs monitoring experience."),
         title="FSP CRA II / Senior CRA I, Oncology (US West)", employer="Thermo Fisher Scientific",
         location="Remote (US West)", pay="$60–109.5k/yr", annual=109500, posted="", source=ZR, relocate=False,
         search_note="Search ZipRecruiter for 'Thermo Fisher FSP CRA Oncology'.",
         hook="Thermo Fisher's oncology FSP role would let me combine my breast/oncology CRA experience with the "
              "oncology exposure from my MD Anderson rotation.",
         gap="I understand the role expects monitoring experience, and I would welcome the chance to discuss how my "
             "breast/oncology CRA work at IU Simon (2022–2023) and clinical training compare.",
         fit=[("warn", "Needs monitoring experience. Your IU Simon CRA role (breast/oncology, 2022–2023) is on the "
                       "resume now; add what it covered, for example monitoring visits, so employers can see it."),
              ("ok", "Oncology matches your breast/oncology CRA role and MD Anderson rotation."),
              ("warn", "CCRA is expired and recertification is in process; the letter says so."),
              ("warn", "Top of the range is below your $110k minimum.")]),

    dict(id="c-clinical-sr-cra-cns", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Senior CRA, CNS, San Diego with remote option, "
            "$66–136k/yr. Senior role."),
         title="Senior CRA, CNS", employer="C-Clinical", location="San Diego, CA (remote option)",
         pay="$66–136k/yr", annual=136000, posted="", source=ZR, relocate=False,
         search_note="Search ZipRecruiter for 'C-Clinical Senior CRA CNS'.",
         hook="C-Clinical's CNS trials fit my neuroscience degree and the neurological emergencies I see in the ED.",
         gap="This is a senior role. My CRA experience is from 2022 to 2023 at the IU Simon Comprehensive Cancer Center, "
             "and I would welcome a conversation about how it compares with what you need.",
         fit=[("gap", "Senior-level role. Expect to need years of direct monitoring experience."),
              ("warn", "CCRA is expired and recertification is in process; the letter says so.")]),

    dict(id="stanford-neuromuscular-crc", group=G_RES, kind="research", track="research", desc=(
            "Search summary. Full posting not captured. Neuromuscular Clinical Research Coordinator Associate, "
            "Stanford, $59.6–94.7k/yr, posted Oct 5."),
         title="Neuromuscular Clinical Research Coordinator Associate", employer="Stanford",
         location="Stanford, CA", pay="$59.6–94.7k/yr", annual=94700, posted="2026-10-05", source=IND, relocate=False,
         url="https://to.indeed.com/aapxdttbflry",
         hook="Stanford's neuromuscular research program matches my neuroscience degree and my neurological ED "
              "experience.",
         fit=[("warn", "Pay is below your $110k minimum. Stanford is in the Bay Area.")]),

    # ------------------------------------------------------------------ earlier application packages
    dict(id="talent-solution-partners-er-sacramento", group=G_ED, kind="pa", track="ed", desc=(
            "Search summary. Full posting not captured. Physician Assistant, Emergency / Urgent Care, onsite "
            "evening shift, Sacramento, $165–180k/yr, full-time. Posted about 4 days before the search."),
         title="Physician Assistant, Emergency / Urgent Care (onsite evening shift)",
         employer="Talent Solution Partners", location="Sacramento, CA", pay="$165–180k/yr", annual=180000,
         posted="2026-10-02", source=PKG,
         search_note="Search ZipRecruiter for 'Talent Solution Partners physician assistant Sacramento'.",
         hook="An onsite evening-shift emergency and urgent care role in Sacramento is a direct continuation of the "
              "work I do now.",
         fit=[LIC, ("ok", "Direct specialty match."), ("ok", "Pay is well above your minimum."),
              ("info", "Evening shift, onsite, full-time.")]),

    dict(id="vituity-ed-sacramento", group=G_ED, kind="pa", track="ed", desc=(
            "Search summary. Full posting not captured. Advanced Provider (PA/NP), Emergency Department, "
            "Sacramento, $63–67/hr. The posting described a large tertiary ED: 54 beds, an 11-bed pediatric ED, "
            "8 fast-track beds, about 110,000 visits a year, STEMI and stroke center."),
         title="Advanced Provider (PA/NP), Emergency Department", employer="Vituity", location="Sacramento, CA",
         pay="$63–67/hr", annual=139360, posted="", source=PKG,
         search_note="Search Vituity's careers site for 'Advanced Provider Sacramento Emergency'.",
         hook="A 54-bed tertiary ED with a fast track, a separate pediatric ED and STEMI and stroke programs "
              "is the kind of department where I want to grow.",
         fit=[LIC, ("ok", "Strong specialty match. STEMI and stroke center fits your ED work."),
              ("warn", "A bigger, higher-volume ED than your current one. Lead with what you have done."),
              ("info", "Ask whether PALS is required for the pediatric ED.")]),

    dict(id="sutter-sacramento-ed", group=G_ED, kind="pa", track="ed", desc=(
            "Search summary. Full posting not captured. Physician Assistant, Emergency Medicine, Sutter Medical "
            "Center, Sacramento. The listing was dated April 29, 2026 and may be filled."),
         title="Physician Assistant, Emergency Medicine", employer="Sutter Medical Center, Sacramento",
         location="Sacramento, CA", pay="Not listed", annual=None, posted="2026-04-29", source=PKG,
         url="https://apcjobs-sutterhealth.icims.com/jobs/search",
         search_note="Search the Sutter APC careers site for 'Emergency Medicine Physician Assistant Sacramento'.",
         hook="Sutter Medical Center, Sacramento's emergency department is a direct match for the specialty I practice.",
         fit=[LIC, ("warn", "Listing was dated April 2026 and may be filled. Confirm it is open."),
              ("ok", "Strong specialty match.")]),

    dict(id="all-inclusive-urgent-care-carmichael", group=G_ED, kind="pa", track="urgent", desc=(
            "Search summary. Full posting not captured. Physician Assistant, Urgent Care, Carmichael, "
            "$150–180k/yr, full-time, on site. Seen on ZipRecruiter about 21 days before the search."),
         title="Physician Assistant, Urgent Care", employer="All Inclusive Medical Services Inc",
         location="Carmichael, CA", pay="$150–180k/yr", annual=180000, posted="2026-09-15", source=PKG,
         search_note="Search ZipRecruiter for 'All Inclusive Medical Services physician assistant urgent care'.",
         hook="Urgent care suits the pace and breadth of my ED experience.",
         fit=[LIC, ("ok", "Good fit: urgent care suits one year of ED."), ("ok", "Pay is well above your minimum."),
              ("info", "The employer also posts a separate skilled-nursing-facility role.")]),

    dict(id="gcs-group-pa-np-carmichael", group=G_ED, kind="pa", track="urgent", desc=(
            "Search summary. Full posting not captured. Physician Assistant / Nurse Practitioner, Carmichael, "
            "$135–165k/yr, full-time, posted Sept 21."),
         title="Physician Assistant (PA) / Nurse Practitioner (NP)", employer="GCS Group Inc.",
         location="Carmichael, CA", pay="$135–165k/yr", annual=165000, posted="2026-09-21", source=PKG,
         url="https://to.indeed.com/aamsgcqwrmnp",
         hook="GCS Group's Carmichael role appeared in urgent care results, which is the setting I am looking for.",
         fit=[LIC, ("warn", "Specialty not clear from the result. Read the full listing."),
              ("ok", "Pay is above your minimum.")]),

    dict(id="teamhealth-stockton-ed", group=G_ED, kind="pa", track="ed", desc=(
            "Search summary. Full posting not captured. TeamHealth Emergency Medicine Advanced Practice "
            "Clinician, Stockton, $100–105/hr, full-time, posted Sept 22. Related: St. Joseph's Medical Center "
            "Stockton ED roles via PracticeMatch."),
         title="Emergency Medicine Advanced Practice Clinician", employer="TeamHealth", location="Stockton, CA",
         pay="$100–105/hr", annual=218400, posted="2026-09-22", source=PKG,
         url="https://to.indeed.com/aactyldflf6y",
         hook="TeamHealth's emergency medicine group in Stockton is a strong match for the specialty I practice.",
         gap="I understand some TeamHealth roles ask for around two years of emergency experience; I have about a "
             "year of full-time ED practice and would welcome a conversation about how I could fit.",
         fit=[LIC, ("warn", "TeamHealth ED roles often ask for about two years of EM experience. Ask before applying."),
              ("ok", "Pay is far above your minimum.")]),

    dict(id="teamhealth-lodi-ed", group=G_ED, kind="pa", track="ed", desc=(
            "Search summary. Full posting not captured. TeamHealth Emergency Medicine Advanced Practice "
            "Clinician, Lodi, $100–105/hr, full-time, posted Aug 25. Related: Lodi Memorial Hospital PA/NP "
            "$146–191k/yr via PracticeMatch."),
         title="Emergency Medicine Advanced Practice Clinician", employer="TeamHealth", location="Lodi, CA",
         pay="$100–105/hr", annual=218400, posted="2026-08-25", source=PKG,
         url="https://to.indeed.com/aap2kb226nhk",
         hook="Lodi is closer to Sacramento than most Central Valley options, and TeamHealth's emergency medicine "
              "group is a strong match for my specialty.",
         gap="I understand some TeamHealth roles ask for around two years of emergency experience; I have about a "
             "year of full-time ED practice and would welcome a conversation about how I could fit.",
         fit=[LIC, ("warn", "Same experience question as the Stockton posting. Posted in August, so it may be filled."),
              ("ok", "Pay is far above your minimum.")]),

    dict(id="barton-em-locum-california", group=G_LOCUM, kind="inquiry", track="locum", desc=(
            "Search summary. Full posting not captured. Locum Tenens PA, Emergency Medicine, California: 10-hour "
            "ER shifts, low-acuity, assignments of about 20 to 65 days, one starting Oct 12, 2026. Pay not listed."),
         title="Locum Tenens PA, Emergency Medicine (California)", employer="Barton Associates",
         location="California", pay="Not listed", annual=None, posted="", source=PKG,
         url="https://www.bartonassociates.com/locum-tenens-jobs/emergency-medicine-physician-assistant-ca-222975b/",
         hook="I am looking for emergency medicine locum assignments in California once my license is issued.",
         fit=[LIC, ("warn", "The Oct 12 start is before your January 2027 license. Ask about later assignments."),
              ("ok", "Best locum match for your ED experience.")]),

    dict(id="locumjobsonline-family-practice-sacramento", group=G_LOCUM, kind="inquiry", track="locum", desc=(
            "Search summary. Full posting not captured. Locum PA, family practice, Sacramento County, "
            "$126–164k/yr, full-time. Seen on ZipRecruiter about 7 days before the search."),
         title="Physician Assistant, Family Practice (locum)", employer="LocumJobsOnline",
         location="Sacramento County, CA", pay="$126–164k/yr", annual=164000, posted="", source=PKG,
         search_note="Search ZipRecruiter for 'LocumJobsOnline physician assistant family practice Sacramento'.",
         hook="A family practice locum assignment in Sacramento County could be a good bridge while I settle in.",
         fit=[LIC, ("ok", "Local and full-time, though family practice rather than ER.")]),

    dict(id="atc-west-redding-trauma-locum", group=G_LOCUM, kind="inquiry", track="surg", desc=(
            "Search summary. Full posting not captured. Locum PA, trauma surgery, Redding, $140–145/hr, "
            "part-time, posted Aug 24."),
         title="Locum PA, Trauma Surgery", employer="ATC-West Healthcare", location="Redding, CA",
         pay="$140–145/hr", annual=None, posted="2026-08-24", source=PKG,
         url="https://to.indeed.com/aafvbzd2bhxr",
         hook="A trauma surgery assignment builds on my ED trauma care and my ATLS certification.",
         fit=[LIC, ("warn", "Redding is far from Sacramento (about 2.5 hours)."), ("ok", "Trauma surgery is a related field.")]),

    dict(id="aya-locums-pa", group=G_LOCUM, kind="inquiry", track="locum", desc=(
            "Search summary. Full posting not captured. Locum Physician Assistant, United States, up to $115/hr, "
            "posted Aug 28."),
         title="Locum Physician Assistant", employer="Aya Locums", location="United States (ask about California)",
         pay="Up to $115/hr", annual=239200, posted="2026-08-28", source=PKG,
         url="https://to.indeed.com/aa7cfzkmr8c6",
         hook="I would like to be matched with locum PA assignments in California once my license is issued.",
         fit=[LIC, ("info", "General agency posting. Use it to reach a recruiter who can match California assignments.")]),

    dict(id="medix-np-pa-citrus-heights", group=G_LOCUM, kind="inquiry", track="ed", desc=(
            "Search summary. Full posting not captured. Medix recruiter posting for a Nurse Practitioner or "
            "Physician Assistant in Citrus Heights, $175–183k/yr, full-time, posted Sept 21."),
         title="Nurse Practitioner or Physician Assistant (recruiter posting)", employer="Medix",
         location="Citrus Heights, CA", pay="$175–183k/yr", annual=183000, posted="2026-09-21", source=PKG,
         url="https://to.indeed.com/aadm8syjpwh8",
         hook="I would like to learn which specialty and employer this Citrus Heights role is for.",
         fit=[LIC, ("warn", "Specialty not stated in the result. Ask the recruiter.")]),

    dict(id="jordan-search-np-pa-sacramento", group=G_LOCUM, kind="inquiry", track="ed", desc=(
            "Search summary. Full posting not captured. Jordan Search Consultants recruiter posting for NPs and "
            "PAs across multiple specialties, Greater Sacramento, from $130k/yr, permanent, posted Sept 15."),
         title="NPs and PAs, multiple specialties (recruiter posting)", employer="Jordan Search Consultants",
         location="Greater Sacramento, CA", pay="From $130k/yr", annual=None, posted="2026-09-15", source=PKG,
         url="https://to.indeed.com/aavpvl4hg7zj",
         hook="I would like to learn which Greater Sacramento employers you represent for PAs.",
         fit=[LIC, ("info", "Recruiter: worth a short email to see which employers they represent.")]),

    dict(id="terumo-neuro-clinical-safety", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Specialist, Clinical Safety (US remote), Terumo Neuro, "
            "Aliso Viejo, $105,067–131,333/yr, posted July 10."),
         title="Specialist, Clinical Safety (US remote)", employer="Terumo Neuro", location="US remote (Aliso Viejo, CA)",
         pay="$105–131k/yr", annual=131333, posted="2026-07-10", source=PKG, relocate=False,
         url="https://to.indeed.com/aacwx9zlhpkj",
         hook="A clinical safety role fits a PA-C with ED experience in recognizing and describing adverse events, "
              "and my neuroscience degree and neurological ED experience are relevant to Terumo Neuro.",
         fit=[("warn", "Posted July 10: may be filled."),
              ("ok", "Best CRA-adjacent target: a PA-C clinical background fits safety review."),
              ("ok", "Remote, and the pay range is close to your minimum.")]),

    dict(id="actalent-sr-cra-remote", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Senior CRA II, remote, Oakland, $73–150k/yr. Seen on "
            "ZipRecruiter about 7 days before the search."),
         title="Senior CRA II (remote)", employer="Actalent", location="Oakland, CA (remote)",
         pay="$73–150k/yr", annual=150000, posted="", source=PKG, relocate=False,
         search_note="Search ZipRecruiter for 'Actalent Senior CRA II remote'.",
         hook="Actalent's remote CRA role would let me return to clinical research with a clinician's perspective.",
         gap="This is a senior role. My CRA experience is from 2022 to 2023 at the IU Simon Comprehensive Cancer Center, "
             "and I would welcome a conversation about how it compares with what you need.",
         fit=[("gap", "Stretch. Senior CRA roles expect several years of CRA experience; you have about one (2022–2023)."),
              ("warn", "CCRA is expired and recertification is in process; the letter says so.")]),

    dict(id="iqvia-sr-cra-sacramento", group=G_RES, kind="research", track="cra", desc=(
            "Search summary. Full posting not captured. Senior CRA, Early Clinical Development, Sacramento, "
            "$90,200–175,100/yr, posted June 30."),
         title="Senior CRA, Early Clinical Development", employer="IQVIA", location="Sacramento, CA",
         pay="$90.2–175.1k/yr", annual=175100, posted="2026-06-30", source=PKG,
         url="https://to.indeed.com/aarghymrs27c",
         hook="IQVIA's early clinical development work in Sacramento would pair my clinical training with research "
              "operations.",
         gap="This is a senior role. My CRA experience is from 2022 to 2023 at the IU Simon Comprehensive Cancer Center, "
             "and I would welcome a conversation about how it compares, or about a more junior opening.",
         fit=[("gap", "Stretch. IQVIA entry-level CRA roles usually want a trainee program or on-site monitoring."),
              ("warn", "Posted June 30, so it may be filled.")]),
]

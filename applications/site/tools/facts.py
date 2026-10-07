"""Verified facts about the applicant.

Every sentence in a generated cover letter or resume is built from this file. Sources:
  - resume: Jefney_Ongeri_ATS_Resume.docx (uploaded by the applicant)
  - stated: things the applicant said in the session (license timing, CRA history, CCRA status)
Nothing here is invented. Change a fact here and regenerate.
"""

NAME = "Jefney Ongeri"
CREDS = "MSPAS, PA-C"
FULL_NAME = f"{NAME}, {CREDS}"
EMAIL = "jeffongeri@gmail.com"
PHONE = "317-435-3165"
NPI = "116226551"
WEBSITE = "jeffongeri.com"

# --- experience bullets, verbatim from the resume (UnityPoint Health, Allen Hospital ED) ---
B_VOLUME = (
    "Independently evaluate and manage 15–25 patients per shift presenting with acute, undifferentiated, "
    "and life-threatening conditions; order and interpret labs, imaging, and diagnostics under high-acuity, "
    "time-sensitive conditions."
)
B_CARDIO = (
    "Managed high-acuity cardiovascular emergencies: STEMI (×3), NSTEMI (×3), CHF exacerbation (×5+), and "
    "aortic aneurysm including AAA (×2); initiated STEMI activations and coordinated with cardiology and "
    "surgery for rapid intervention."
)
B_NEURO = (
    "Managed neurological and respiratory emergencies: syncope (×10+), seizures (×5), COPD exacerbation (×5+), "
    "ischemic stroke, and pneumothorax (×2); initiated stroke alerts, RSI considerations, and evidence-based "
    "treatment protocols."
)
B_PROC = (
    "Independently performed procedures: sutures (×10+), incision & drainage (×6), epistaxis management (×4), "
    "fiberglass cast placement (×3), open fracture management (×2), nursemaid's elbow reduction (×1), anterior "
    "shoulder reduction (×1), digital disimpaction with enema (×1)."
)
B_GI = (
    "Managed GI, GU, and obstetric emergencies: urinary retention (×3), obstipation (×3), intractable vomiting "
    "(×2), first trimester bleeding (×2); evaluated assault victims (×2), corneal abrasions (×2), and pediatric "
    "orthopedic presentations."
)
B_TEAM = (
    "Collaborated with attending physicians, nursing staff, pharmacists, and subspecialty consultants to deliver "
    "safe, efficient, patient-centered emergency care consistent with ACLS/BLS protocols."
)

JOB = {
    "title": "Physician Assistant – PA-C",
    "dates": "October 2025 – Present",
    "org": "UnityPoint Health – Allen Hospital, Emergency Department",
    "where": "Waterloo, IA",
}

EDUCATION = [
    ("Master of Science in Physician Assistant Studies (MSPAS)", "August 2025",
     "Des Moines University – College of Health Sciences", "West Des Moines, IA"),
    ("Bachelor of Science – Neuroscience, Minor: Psychology", "May 2021",
     "Indiana University – College of Arts & Sciences", "Bloomington, IN"),
]

# Certifications. The resume says CCRA "2023 to present"; the applicant confirmed it is expired and that
# recertification is in process, so the generated documents say so.
CERTS = [
    "Advanced Cardiac Life Support (ACLS) – 2023 to present",
    "Basic Life Support (BLS) – 2023 to present",
    "Advanced Trauma Life Support (ATLS) – October 2025 to October 2029",
    "Certified Clinical Research Associate (CCRA) – earned 2023; expired, recertification in process",
    "California PA license – application in progress, expected January 2027",
]

# Rotations: (key, text). Order in the resume is the original order.
ROTATIONS = [
    ("em", "Emergency Medicine — Des Moines, IA"),
    ("fm", "Family Medicine — Adel, IA / Ankeny, IA"),
    ("im", "Internal Medicine (×2) — Palos Heights, IL / Des Moines, IA"),
    ("onc", "Hematology/Oncology (MD Anderson) — Houston, TX"),
    ("surg", "Surgery — Minneapolis, MN"),
    ("derm", "Dermatology — West Des Moines, IA"),
    ("peds", "Pediatrics — Indianola, IA"),
    ("pmr", "Pediatric Physical Medicine & Rehab — Johnston, IA"),
    ("wh", "Women's Health — Nevada, IA"),
    ("bh", "Behavioral & Mental Health — Des Moines, IA"),
    ("pc", "Primary Care — Palos Heights, IL"),
]

RESEARCH = [
    ("Research Assistant Intern – Emma Tillman, Ph.D.", "December 2021 – April 2022",
     "Clinical Pharmacology Research | Indianapolis, IN",
     "Investigated opportunity to incorporate pharmacogenomics testing for patients with sickle cell anemia; "
     "contributed to peer-reviewed publication in Pharmacogenomics (2022)."),
    ("Research Assistant Intern – Aina Puce, Ph.D.", "August 2020 – May 2021",
     "Lab of Social Neuroscience, Indiana University | Bloomington, IN",
     "Analyzed functional connectivity detection in resting-state MEG/EEG data; determined systolic cardiac phase "
     "influence on resting-state neurophysiological brain activity."),
    ("Research Assistant Intern – Mathew Kayser, M.D., Ph.D.", "July 2020 – August 2020",
     "American Physician Scientists Association | Philadelphia, PA",
     "Analyzed GAL4/UAS lines in Drosophila larvae to identify neuronal populations influencing sleep-wake "
     "circuits; presented findings at APSA South Regional Symposium, October 2020."),
    ("Research Assistant Intern – Sharlene Newman, Ph.D.", "August 2019 – May 2020",
     "Lab of Neuroimaging, Indiana University | Bloomington, IN",
     "Analyzed effects of block play on spatial intelligence and arithmetic cognition in preschool-aged children; "
     "contributed to peer-reviewed publication in Mathematical Thinking and Learning (2020)."),
]

PUBLICATIONS = [
    "Gallaway K., Sakon C., Ongeri J., et al. (2022). Opportunity for pharmacogenetics testing in patients with "
    "sickle cell anemia. Pharmacogenomics. https://doi.org/10.2217/pgs-2022-0115",
    "Newman S., Loughery E., Ecklund A., Smothers M., Ongeri J. (2020). Spatial training using game play in "
    "preschoolers improves computational skills. Mathematical Thinking and Learning. "
    "https://doi.org/10.1080/10986065.2021.1969866",
    "Ongeri J., Szuperak M., Kayser M. (2020). Identification of sleep-wake circuits in Drosophila larvae. "
    "Presented at APSA South Regional Symposium, October 2020.",
]

VOLUNTEER = "Boys Reaching for Opportunities in Science (BROS) – Volunteer, 2024"

# --- statements about licensure and location used in letters ---
LICENSE_LINE = (
    "My California PA license application is in process, with an expected issue date of January 2027."
)
RELOCATE_LINE = "I am planning to move to Sacramento or the greater Sacramento area."

# Prior CRA role, stated by the applicant. No duties were given, so the resume entry has no bullets.
CRA_JOB = {
    "title": "Clinical Research Associate – Breast/Oncology",
    "dates": "2022 – 2023",
    "org": "IU Simon Comprehensive Cancer Center",
}
CRA_SENTENCE = ("From 2022 to 2023 I worked as a breast/oncology Clinical Research Associate at the IU Simon "
                "Comprehensive Cancer Center")

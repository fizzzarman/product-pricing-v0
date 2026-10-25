# Lab Report Explainer — Product Plan (Bangladesh-first, international standards)

> **One-liner:** Patients receive their blood report with a simple **Bangla/English explanation**, colour-coded results, red-flag alerts and "questions to ask your doctor", branded by the lab or clinic they trust.

> ⚠️ **Disclaimer:** This plan is not legal or medical advice. Bangladesh's digital, data-protection and medical-device rules changed a lot in 2023–2025. Confirm every regulatory point with a Bangladeshi lawyer and the relevant regulators (DGDA, DGHS, BTRC/ICT Division) before launch. Clinical thresholds in this document are **examples** and must be set and approved by your clinical advisors.

---

## Table of Contents
1. [Problem](#1-problem)
2. [Solution](#2-solution)
3. [Target customers & users](#3-target-customers--users)
4. [Product features](#4-product-features)
5. [Bangladesh-specific features](#5-bangladesh-specific-features)
6. [User flows](#6-user-flows)
7. [Sample output (Bangla & English)](#7-sample-output-bangla--english)
8. [Technical architecture](#8-technical-architecture)
9. [Data model](#9-data-model)
10. [Clinical safety design](#10-clinical-safety-design)
11. [Regulation & compliance](#11-regulation--compliance)
12. [Security & privacy](#12-security--privacy)
13. [Business model & pricing](#13-business-model--pricing)
14. [Unit economics](#14-unit-economics)
15. [Go-to-market plan](#15-go-to-market-plan)
16. [Competition & moat](#16-competition--moat)
17. [Roadmap](#17-roadmap)
18. [Team & budget](#18-team--budget)
19. [Metrics (KPIs)](#19-metrics-kpis)
20. [Risks & mitigations](#20-risks--mitigations)
21. [Pitch for diagnostic centers](#21-pitch-for-diagnostic-centers)
22. [Next steps checklist](#22-next-steps-checklist)

---

## 1. Problem

### For patients
- Reports are printed in **English medical jargon** (SGPT, MCHC, HbA1c, eGFR, TSH).
- Many patients, especially elderly people and those outside Dhaka, **cannot understand** them.
- They **panic after Googling**, wait days for the next doctor visit, or ignore real warning signs.
- They often have to **pay again for a follow-up consultation** just to have the report explained.

### For doctors
- Consultations in Bangladesh are often **very short** and doctors see very high patient volumes.
- Doctors get many **repetitive calls and messages** ("Sir, is my report OK?").
- Patients arrive **without understanding** their results, which wastes consultation time.

### For diagnostic centers / labs
- Labs compete mainly on **price and speed**, and there are few ways to stand out.
- Their digital channel is limited to "download your PDF".
- Patients have **little loyalty** to any particular lab.

---

## 2. Solution

An AI-assisted service that turns a lab report into:

| Output | Description |
|---|---|
| 🧾 **Plain-language summary** | 3–5 lines covering the whole report in Bangla or English |
| 🟢🟡🔴 **Colour-coded results** | Each test compared with **the lab's own reference range** |
| 📖 **What this test means** | One simple line per test |
| ❓ **Questions to ask your doctor** | Personalised to the out-of-range results |
| 🚨 **Red-flag alerts** | Critical values tell the patient to contact a doctor today or go to emergency care |
| 📈 **Trends** | Compares the result with the patient's previous reports (HbA1c, creatinine, lipids, platelets) |
| 🏥 **Branding** | Lab/clinic logo, name and contact or booking button |

**What it does not do:** diagnose diseases, prescribe medicines, suggest doses, or replace the doctor.

---

## 3. Target customers & users

**B2B2C model:** the business pays and the patient uses it.

| Segment | Role | Why they buy |
|---|---|---|
| **Diagnostic centers** (Popular, Ibn Sina, Labaid, Praava, mid-size and district labs) | 🥇 Primary buyer | Differentiation, patient loyalty, fewer front-desk calls |
| **Private hospitals** (Evercare, Square, United and district private hospitals) | Buyer | Patient experience, fewer explanation calls to their own doctors |
| **Private chambers / clinics** | Buyer | Fewer repetitive calls, more professional image |
| **Corporate health check-up providers** | Buyer | Employees understand their annual check-up |
| **Patients / families** (later) | Direct user and buyer | Understanding results, tracking parents' health |
| **Bangladeshi diaspora** (later) | Buyer | Understanding reports of parents back home |

**First focus:** mid-size diagnostic centers in Dhaka, Chattogram, Sylhet, Rajshahi and Khulna. They move faster than big chains and have more to gain from standing out.

---

## 4. Product features

### 4.1 MVP (v1)
- [ ] Upload: lab-system PDF, scanned PDF, or phone photo of a printed report
- [ ] OCR + extraction of test name, value, unit and reference range
- [ ] Supported panels:
  - CBC (Hb, WBC, platelets, RBC, MCV, MCH, MCHC, ESR, differential)
  - Blood glucose (FBS, RBS, 2hABF), HbA1c
  - Lipid profile
  - Liver: SGPT (ALT), SGOT (AST), bilirubin, ALP
  - Kidney: serum creatinine, urea, eGFR, uric acid
  - Thyroid: TSH, FT4
  - Urine R/E
- [ ] Rules engine: normal, mildly out of range, significantly out of range, critical
- [ ] AI-generated explanation in **Bangla and English**
- [ ] "Questions to ask your doctor"
- [ ] Red-flag message for critical values
- [ ] Delivery via **WhatsApp**, SMS link and web page
- [ ] Downloadable branded PDF
- [ ] Lab admin dashboard: upload, view and send, usage stats
- [ ] Consent screen and privacy notice in Bangla and English

### 4.2 v2
- [ ] Direct integration with lab software (LIS) through automatic API/FHIR export
- [ ] Patient history and trend charts
- [ ] Doctor review mode, where a doctor approves before sending
- [ ] Dengue mode (see §5)
- [ ] More panels: Vitamin D, B12, iron studies, electrolytes, HBsAg, anti-HCV, CRP, dengue NS1/IgM/IgG, PSA, hormones
- [ ] "Book follow-up with doctor" button linking to the clinic's booking system
- [ ] Voice explanation in Bangla for low-literacy users

### 4.3 v3
- [ ] Patient app with a family health record
- [ ] Diaspora plan for children abroad who track their parents' reports
- [ ] Corporate check-up dashboards with aggregated, anonymised data
- [ ] Integration with hospital record systems
- [ ] Expansion to other South Asian languages and markets

---

## 5. Bangladesh-specific features

These make the product local and hard for global apps to copy.

### 5.1 Bangla first
- Natural, simple Bangla rather than literal translation.
- A reviewed glossary, for example "হিমোগ্লোবিন (রক্তের লাল কণিকার অক্সিজেন বহনকারী উপাদান)".
- Bangla numerals optional (১০.২ or 10.2).
- Optional Banglish output for younger users.

### 5.2 Dengue season mode (roughly July to November)
- Tracks **platelet count** and **hematocrit (HCT/PCV)** across serial CBCs.
- Shows the trend clearly: "Your platelets: 1,50,000 → 95,000 → 60,000".
- Shows the WHO-style dengue warning signs patients should watch for, such as severe abdominal pain, persistent vomiting, bleeding, lethargy, and a rising hematocrit with a rapid platelet drop. In those cases it tells the patient to **contact a doctor or hospital immediately**.
- Never says "you have dengue". It says "discuss these results with your doctor".

### 5.3 Thalassemia carrier hint
- Thalassemia trait is common in Bangladesh and is often mistaken for iron deficiency.
- When **MCV is low and RBC count is normal or high**, show a question to ask the doctor: "Should I be tested for thalassemia carrier status (hemoglobin electrophoresis)?"
- Optionally compute the Mentzer index (MCV ÷ RBC) internally as a **hint for the question only**, never as a diagnosis.
- This is especially relevant for **premarital and pregnancy check-ups**.

### 5.4 Diabetes focus
- Diabetes is very common in Bangladesh, so HbA1c and glucose trends are a core feature.
- Handles **mmol/L and mg/dL**, because Bangladeshi labs use both.
- Shows a fasting vs. random vs. post-meal context label.

### 5.5 Local delivery & payments
- **WhatsApp** first, with SMS links as a fallback. Imo and Messenger can be considered later.
- Payments via **bKash, Nagad**, cards and bank transfer for B2B invoicing.
- Works on low-end Android phones and slow 3G/4G connections, with lightweight pages.

---

## 6. User flows

### 6.1 Diagnostic center flow (main flow)
```
Lab finalises report in LIS
   ↓ (auto-export PDF / API, or staff uploads)
System extracts + interprets + generates explanation
   ↓
(Optional) Lab pathologist/doctor quick review
   ↓
Patient receives WhatsApp/SMS:
"আপনার রিপোর্ট প্রস্তুত। সহজ ভাষায় ব্যাখ্যা দেখতে ক্লিক করুন: <link>"
   ↓
Patient opens link → OTP verification → views explanation → downloads PDF / books doctor
```

### 6.2 Patient self-upload flow (later)
```
Patient opens app/web → consents → photographs report
   ↓
System checks image quality → extracts → asks patient to confirm values
   ↓
Explanation shown → saved to family health record (optional)
```

### 6.3 Critical value flow
```
Rules engine detects critical value
   ↓
Explanation is replaced by a clear urgent message (no AI free text)
   ↓
Lab/clinic dashboard alert → staff calls patient (configurable)
```

---

## 7. Sample output (Bangla & English)

**Example input:** female, CBC with Hb 10.2 g/dL (lab range 12.0–15.5), MCV 72 fL (lab range 80–100), all other values within range.

### Bangla
> **আপনার রিপোর্টের সারসংক্ষেপ**
>
> আপনার রক্তের বেশিরভাগ পরীক্ষা স্বাভাবিক সীমার মধ্যে আছে। তবে দুইটি ফলাফল স্বাভাবিকের চেয়ে কিছুটা কম।
>
> 🟡 **হিমোগ্লোবিন: ১০.২ g/dL** (ল্যাবের স্বাভাবিক সীমা: ১২.০–১৫.৫)
> হিমোগ্লোবিন রক্তে অক্সিজেন বহন করে। এটি কম হলে ক্লান্তি, দুর্বলতা বা মাথা ঘোরা লাগতে পারে।
>
> 🟡 **MCV: ৭২ fL** (ল্যাবের স্বাভাবিক সীমা: ৮০–১০০)
> MCV দিয়ে লাল রক্তকণিকার আকার বোঝা যায়। এটি কম মানে কণিকাগুলো স্বাভাবিকের চেয়ে ছোট।
>
> **আপনার ডাক্তারকে যা জিজ্ঞেস করতে পারেন:**
> 1. আমার হিমোগ্লোবিন কম হওয়ার কারণ কী হতে পারে?
> 2. আমার কি আয়রনের পরীক্ষা (যেমন Serum Ferritin) করা দরকার?
> 3. আমার কি থ্যালাসেমিয়া বাহক পরীক্ষা (Hb Electrophoresis) করা উচিত?
> 4. কতদিন পর আবার পরীক্ষা করাতে হবে?
>
> ℹ️ *এই ব্যাখ্যাটি শুধুমাত্র বোঝার সুবিধার জন্য। এটি রোগ নির্ণয় বা চিকিৎসার পরামর্শ নয়। যেকোনো সিদ্ধান্তের আগে আপনার ডাক্তারের পরামর্শ নিন।*

### English
> **Your report summary**
>
> Most of your blood test results are within the normal range. Two results are slightly low.
>
> 🟡 **Hemoglobin: 10.2 g/dL** (lab normal range: 12.0–15.5)
> Hemoglobin carries oxygen in your blood. When it is low, you may feel tired, weak or dizzy.
>
> 🟡 **MCV: 72 fL** (lab normal range: 80–100)
> MCV shows the size of your red blood cells. A low value means the cells are smaller than usual.
>
> **Questions to ask your doctor:**
> 1. What could be causing my low hemoglobin?
> 2. Do I need iron tests (such as serum ferritin)?
> 3. Should I be tested for thalassemia carrier status (Hb electrophoresis)?
> 4. When should I repeat this test?
>
> ℹ️ *This explanation is for understanding only. It is not a diagnosis or medical advice. Please consult your doctor before making any decision.*

### Critical value example (fixed template, not AI-generated)
> 🔴 **জরুরি: আপনার রিপোর্টে একটি ফলাফল অত্যন্ত অস্বাভাবিক।**
> অনুগ্রহ করে **আজই** আপনার ডাক্তারের সাথে যোগাযোগ করুন অথবা নিকটস্থ হাসপাতালের জরুরি বিভাগে যান।
> ল্যাব হেল্পলাইন: <number>
>
> 🔴 **Urgent: one result in your report is very abnormal.**
> Please contact your doctor **today** or go to the nearest hospital emergency department.

---

## 8. Technical architecture

### 8.1 Core principle
> **The AI writes the words. Code decides the facts.**
> Whether a value is normal, abnormal or critical is always decided by **deterministic code** using the **lab's printed reference range** and clinic-approved thresholds. The language model only turns structured, already-decided facts into readable text.

### 8.2 Pipeline
```
┌─────────────────────┐
│ 1. Ingestion        │  PDF from LIS / scan / phone photo / API (HL7 / FHIR)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 2. Quality check    │  Blur, crop, rotation, resolution → ask to retake if poor
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 3. OCR + extraction │  Text PDF: direct parse. Image: OCR + table extraction,
│                     │  then a model returns strict JSON (test, value, unit, range)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 4. Normalisation    │  Test aliases → LOINC code ("SGPT" = "ALT")
│                     │  Units → UCUM, unit conversion (mmol/L ↔ mg/dL)
│                     │  Plausibility checks (Hb 102 g/dL? → flag, don't guess)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 5. Rules engine     │  Compare with lab range → status
│  (deterministic)    │  Critical thresholds (clinic-configurable)
│                     │  Pattern hints (dengue trend, low MCV + high RBC, etc.)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 6. Explanation      │  LLM with strict prompt and JSON input only
│    generator        │  + reviewed per-test text templates (Bangla/English)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 7. Safety filter    │  Blocks disease names stated as fact, drug names, doses,
│                     │  "you have…", "no need to see a doctor"; enforces disclaimer
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 8. Review (opt.)    │  Lab doctor approves in dashboard
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ 9. Delivery         │  WhatsApp Business API / SMS / web link (OTP) / PDF
└─────────────────────┘
```

### 8.3 Suggested tech stack
| Layer | Option |
|---|---|
| Front end (patient + dashboard) | Next.js (React) + Tailwind, a PWA for low-end phones |
| Backend API | Python FastAPI (good for ML/OCR) or Node.js/Next.js API routes |
| Database | PostgreSQL (encrypted at rest) |
| File storage | S3-compatible object storage with encryption and auto-expiry |
| OCR | Google Document AI / Azure AI Document Intelligence / AWS Textract, or Tesseract/PaddleOCR self-hosted |
| LLM | A capable LLM API with **zero data retention** and no training on your data, or a self-hosted open model for strict data locality |
| Messaging | WhatsApp Business Platform (via Meta or a local BSP), local SMS gateway |
| Payments | bKash / Nagad merchant APIs, SSLCommerz for cards |
| Hosting | Local Bangladeshi data center or a cloud region that satisfies the data-localisation rules (see §11) |
| Monitoring | Sentry, uptime monitoring, audit logs |

### 8.4 Rules engine example
```python
def classify(value, low, high, crit_low=None, crit_high=None, mild_margin=0.10):
    """Return a status using the LAB'S reference range. No AI involved."""
    if crit_low is not None and value <= crit_low:
        return "critical_low"
    if crit_high is not None and value >= crit_high:
        return "critical_high"
    if low <= value <= high:
        return "normal"
    span = high - low
    if value < low:
        return "mild_low" if value >= low - span * mild_margin else "low"
    return "mild_high" if value <= high + span * mild_margin else "high"
```

### 8.5 LLM prompt guardrails (summary)
- Input is **structured JSON only**, never the raw report.
- Instructions:
  - Explain only the tests given. Do not add new facts.
  - Use the status given. Never re-judge normal/abnormal.
  - No diagnosis, no medicine names, no doses, no treatment plans.
  - Always encourage discussing the results with a doctor.
  - Grade 6 reading level, short sentences, Bangla or English as requested.
- Output: strict JSON (`summary`, `per_test[]`, `questions[]`), validated against a schema.
- Fallback: if validation fails, use the reviewed static templates.

---

## 9. Data model

```text
Organization      (id, name, type[lab|clinic|hospital], logo, branding, settings, plan)
User              (id, org_id, role[admin|staff|doctor], name, phone, email)
Patient           (id, org_id, name, phone, dob/age, sex, language_pref, consent_id)
Consent           (id, patient_id, version, channel, granted_at, revoked_at)
Report            (id, org_id, patient_id, source[pdf|photo|api], collected_at,
                   file_uri, ocr_confidence, status[processing|review|sent|failed])
ResultItem        (id, report_id, raw_name, loinc_code, value, unit, ucum_unit,
                   ref_low, ref_high, ref_text, status, flags[])
Explanation       (id, report_id, language, summary, per_test_json, questions_json,
                   model_version, template_version, safety_passed, reviewed_by, reviewed_at)
Delivery          (id, report_id, channel[whatsapp|sms|web], sent_at, opened_at)
CriticalAlert     (id, report_id, result_item_id, notified_staff_at, acknowledged_by)
TestCatalog       (loinc_code, aliases[], name_en, name_bn, description_en,
                   description_bn, default_unit, critical_low, critical_high)
AuditLog          (id, actor, action, entity, entity_id, timestamp, ip)
```

---

## 10. Clinical safety design

### 10.1 Safety rules
1. **Lab's reference range wins.** Never replace it with a "generic" range from the AI.
2. **Critical values use fixed templates.** No AI free text.
3. **No diagnosis.** Use "may be linked to… discuss with your doctor", never "you have…".
4. **No medicines or doses.** Lifestyle notes only, and only general ones from reviewed text.
5. **Unreadable means say so.** Low OCR confidence or impossible values lead to "please confirm with your lab".
6. **Always point back to the doctor.**
7. **Every explanation is logged** with model version, template version and reviewer.

### 10.2 Example critical-value thresholds
⚠️ These are **examples only**, based on commonly used lab critical lists. Your pathologist advisors must set and approve the real values, and each lab can configure its own.

| Test | Critical low (example) | Critical high (example) |
|---|---|---|
| Hemoglobin | < 7 g/dL | > 20 g/dL |
| Platelets | < 20,000 /µL | > 1,000,000 /µL |
| WBC | < 2,000 /µL | > 30,000 /µL |
| Glucose | < 2.8 mmol/L (≈ 50 mg/dL) | > 25 mmol/L (≈ 450 mg/dL) |
| Potassium | < 2.8 mmol/L | > 6.2 mmol/L |
| Sodium | < 120 mmol/L | > 160 mmol/L |
| Creatinine | — | Lab/clinician-defined (e.g., sudden large rise) |

### 10.3 Clinical governance
- **Clinical advisory board:** at least 1 internal medicine specialist and 1 pathologist. Later add an endocrinologist and a pediatrician.
- Advisors **review and sign off** every per-test template in Bangla and English.
- **Monthly review** of a random sample of explanations, plus all complaints.
- **Incident process** for wrong or harmful outputs: report, investigate, fix, document.
- **Pediatric and pregnancy reports** are excluded from the MVP or always need doctor review, because reference ranges differ.

---

## 11. Regulation & compliance

### 11.1 Bangladesh
> ⚠️ Verify the current status with a lawyer. Several laws were issued as **ordinances** in 2025 and may be revised by a future parliament.

| Area | Regulator / law | What it means for you |
|---|---|---|
| **Personal data protection** | Bangladesh's personal data protection law (Personal Data Protection Ordinance, 2025) and its rules | Health data is **sensitive data**: explicit consent, purpose limitation, data subject rights (access, correction, deletion), breach notification, and possible **data localisation** requirements. Check the final text and rules. |
| **Cyber security** | Cyber Security Ordinance, 2025 (replaced the Cyber Security Act 2023) | Protect against unauthorised access. Data breaches and misuse carry legal risk. |
| **Medical devices** | **DGDA**, under the Drugs and Cosmetics Act 2023 | If the software **diagnoses or recommends treatment**, it may be treated as a medical device. Stay in the **educational / doctor-in-the-loop** zone, and get a written opinion. |
| **Clinics & labs** | **DGHS**, private clinics and laboratories regulation | Work only with **licensed** labs and clinics. They remain responsible for the report itself. |
| **Doctors** | **BMDC** | Doctors who review or advise must be BMDC-registered. |
| **Telemedicine / digital health** | DGHS digital health and telemedicine guidelines | Follow them if you add doctor chat or consultation. |
| **Company & tax** | RJSC, NBR (VAT/TIN), trade license; BASIS membership helpful | Register a company, issue VAT-compliant invoices to B2B clients, and check ICT/software tax incentives. |
| **Messaging** | BTRC (SMS), Meta's WhatsApp Business policies | Use approved message templates and opt-in. No marketing without consent. |

### 11.2 International standards (credibility + future expansion)
| Standard / framework | Relevance | When |
|---|---|---|
| **GDPR** (EU) | Gold standard for privacy. Health data is a special category. | Design to it now |
| **HIPAA** (US) | Health privacy and security rules, BAAs with vendors | If entering the US or serving US clients |
| **ISO/IEC 27001** | Information security management system | Year 1–2 (big chains will ask) |
| **ISO/IEC 27701** | Privacy extension to 27001 | Year 2 |
| **IMDRF SaMD framework** | International definition and risk levels of software as a medical device | Use now to self-classify |
| **US FDA guidance on clinical decision support software** | When software is or isn't a device | If entering the US |
| **EU MDR + EU AI Act** | Medical device rules, AI high-risk obligations | If entering the EU |
| **ISO 14971** | Medical device risk management | Adopt practices now; mandatory if regulated |
| **IEC 62304** | Medical device software lifecycle | If regulated |
| **ISO 13485** | Medical device quality management | If regulated |
| **HL7 FHIR** (`DiagnosticReport`, `Observation`) | Interoperability with LIS/HIS | v2 |
| **LOINC** | Standard lab test codes | MVP (internal mapping) |
| **UCUM** | Standard units | MVP |
| **WCAG 2.1 AA** | Accessibility | MVP |
| **WHO: Ethics & governance of AI for health (2021)** and **guidance on large multi-modal models (2024)** | Ethical principles: transparency, human oversight, safety | Cite in policy and pitches |

### 11.3 Regulatory positioning statement (use in terms of service and pitches)
> "LabExplain (working name) provides **educational, plain-language explanations** of laboratory results issued by licensed laboratories. It does **not** diagnose, treat or recommend medication. All results remain the responsibility of the issuing laboratory and the patient's treating physician."

---

## 12. Security & privacy

### 12.1 Technical controls
- TLS 1.2+ in transit, AES-256 at rest, encrypted backups
- OTP verification before showing a report, and expiring links (for example, 7–30 days)
- Role-based access control, with staff seeing only their own organisation's data
- Full **audit logs** (who viewed, sent or edited what, and when)
- **Data minimisation:** store only what is needed, strip identifiers before sending data to the LLM where possible
- **Retention policy:** for example, auto-delete files after 90 days unless the patient opts into a health record
- LLM/OCR vendors with **zero data retention** and no training on your data, under signed data processing agreements
- Regular vulnerability scans, an annual penetration test, and a dependency update policy
- An incident response plan with a breach-notification procedure

### 12.2 Patient rights
- Clear Bangla/English consent screen
- Right to view, download and **delete** their data
- Right to opt out of trend tracking or storage
- Contact point for privacy questions (a Data Protection Officer once you're large enough)

### 12.3 Documents to prepare
- [ ] Privacy policy (Bangla + English)
- [ ] Terms of service with the medical disclaimer
- [ ] Data processing agreement with each lab or clinic
- [ ] Consent text versions
- [ ] Information security policy
- [ ] Incident response plan
- [ ] Clinical safety case / risk register (ISO 14971 style)

---

## 13. Business model & pricing

> Prices are **indicative**. Validate them with real customers. 1 USD ≈ ৳120 (check the current rate).

### 13.1 Pricing table
| Plan | Customer | Price (indicative) | Includes |
|---|---|---|---|
| **Starter** | Small clinic / chamber | ৳2,000–3,000 / month | Up to ~300 reports, branding, WhatsApp/SMS link |
| **Growth** | Mid-size diagnostic center | ৳8–12 per report (minimum ৳10,000 / month) | Dashboard, Bangla/English, PDF, critical alerts |
| **Enterprise** | Large chain / hospital | ৳3–15 lakh / year + integration fee | LIS/FHIR integration, doctor review, SLA, custom branding, analytics |
| **Patient direct** (later) | Individuals | ৳30–100 / report or ৳199–499 / month family plan | Self-upload, history, trends |
| **Diaspora plan** (later) | Bangladeshis abroad | $3–5 / month | Parents' reports, trends, alerts |

### 13.2 Extra revenue options
- One-time **setup / integration fee** (৳20,000–2,00,000)
- **White-label** licensing to health-tech companies and insurers
- **Corporate health check-up** packages
- **Anonymised, aggregated public-health insights** (only with proper consent and legal review, never selling personal data)

---

## 14. Unit economics
Illustrative estimates only. Measure real costs during the pilot.

| Cost item per report | Estimate |
|---|---|
| OCR (1–2 pages) | ৳0.2–1.0 |
| LLM explanation (Bangla + English) | ৳0.5–3.0 |
| WhatsApp / SMS message | ৳0.5–2.0 |
| Hosting, storage, monitoring (allocated) | ৳0.3–1.0 |
| **Total variable cost** | **≈ ৳1.5–7 per report** |

**Example:** a mid-size diagnostic center doing **6,000 reports/month** at ৳10/report
- Revenue: **৳60,000 / month**
- Variable cost (≈ ৳4/report): ৳24,000
- **Gross margin ≈ 60%**, which improves with text-PDF parsing (no OCR), caching templates and bulk messaging rates

**Targets:**
- 10 mid-size labs → ≈ ৳6 lakh/month revenue
- 2–3 large chains → several million Taka per year

---

## 15. Go-to-market plan

### Phase 0: Validation (weeks 1–4)
- [ ] Interview 10 diagnostic center managers, 10 doctors and 20 patients
- [ ] Collect **50–100 real anonymised reports** from different labs (with permission)
- [ ] Recruit 1–2 **clinical advisors** (medicine + pathology)
- [ ] Get an initial legal opinion on DGDA and data protection positioning

### Phase 1: MVP & pilot (months 2–4)
- [ ] Build the MVP covering the panels in §4.1
- [ ] Pilot free with **1–2 mid-size labs** (one in Dhaka, one outside)
- [ ] Measure: open rate, satisfaction, calls to front desk, repeat visits, errors

### Phase 2: First revenue (months 4–8)
- [ ] Convert pilot labs to paid plans
- [ ] Publish a case study ("Front-desk calls down X%, patient satisfaction Y")
- [ ] Sign 5–10 paying labs or clinics
- [ ] Launch dengue mode before the monsoon season

### Phase 3: Scale (months 8–18)
- [ ] Approach the large chains with case studies
- [ ] LIS integrations with the common lab software vendors in Bangladesh
- [ ] Partner with doctor associations and medical colleges for credibility
- [ ] Launch patient-direct and diaspora plans
- [ ] Start the ISO 27001 process

### Sales channels
- Direct visits to diagnostic centers (the most effective channel in Bangladesh)
- Doctor referrals ("recommend this lab, my patients understand their reports")
- LinkedIn and Facebook groups for doctors and health-sector managers
- Medical conferences and CME events
- Partnerships with LIS software vendors, who can bundle the product

---

## 16. Competition & moat

### Competition
- **Generic AI chatbots:** patients paste reports into free chatbots. These have no lab range awareness, no Bangla quality control, no branding, and privacy concerns.
- **International lab-report apps:** English-first, not tuned to Bangladeshi labs, formats or pricing.
- **Lab portals:** show PDFs only, with no explanation.
- **Local health-tech apps** (telemedicine and health-record apps): may add this feature, so move fast and partner where possible.

### Moat
1. **Distribution through labs.** You're embedded in the report flow.
2. **A Bangla medical language layer** that is clinically reviewed.
3. **Parsers for Bangladeshi lab formats**, which improve with every lab onboarded.
4. **Local clinical features** (dengue, thalassemia, diabetes).
5. **Trust and compliance** (advisors, ISO, legal positioning).
6. **Longitudinal patient data** (with consent) that enables trends.

---

## 17. Roadmap

| Timeline | Milestone |
|---|---|
| Month 1 | Validation interviews, report samples, advisors, legal opinion |
| Month 2–3 | MVP: OCR, rules, Bangla/English explanations, WhatsApp delivery, dashboard |
| Month 4 | Pilot with 1–2 labs |
| Month 5–6 | Paid conversion, case study, dengue mode |
| Month 7–9 | 10 paying customers, LIS integration #1, doctor review mode |
| Month 10–12 | Large chain deal, trend charts, patient app beta |
| Year 2 | ISO 27001, diaspora plan, corporate check-ups, FHIR, other South Asian markets |

---

## 18. Team & budget

### Minimum team
| Role | Type |
|---|---|
| Founder / product & sales | Full time |
| Full-stack developer | Full time |
| ML/OCR engineer | Part time or full time |
| Clinical advisors (medicine + pathology) | Part time, paid per review or with equity |
| Bangla medical content writer / reviewer | Part time |
| Legal advisor | On retainer |

### Rough MVP budget (6 months, bootstrapped)
| Item | Estimate |
|---|---|
| Developer(s) | ৳6–15 lakh |
| Clinical advisors & content review | ৳1–3 lakh |
| Legal (company setup, policies, opinion) | ৳1–2 lakh |
| Cloud, OCR, LLM, messaging (pilot) | ৳0.5–1.5 lakh |
| Sales & marketing | ৳1–2 lakh |
| **Total** | **≈ ৳10–23 lakh** |

Possible funding: bootstrapping, the Startup Bangladesh fund, local angel networks, accelerators, and health innovation grants.

---

## 19. Metrics (KPIs)

| Category | Metric |
|---|---|
| Accuracy | Extraction accuracy (% of values correctly read), target > 99% on text PDFs |
| Safety | Safety filter catches, clinical incidents (target 0 serious), review findings |
| Engagement | Link open rate, time on page, PDF downloads, follow-up bookings |
| Patient value | Satisfaction score (CSAT), "I understood my report" % |
| Customer value | Reduction in front-desk/doctor calls, repeat-patient rate |
| Business | Paying customers, reports/month, MRR, churn, gross margin, CAC, payback period |

---

## 20. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OCR misreads a value | Wrong explanation | Plausibility checks, confidence thresholds, prefer text PDFs/API, "unable to read" fallback, patient confirmation step |
| AI makes up content | Patient harm, reputation | Structured input only, rules decide status, schema validation, safety filter, reviewed templates |
| Classified as a medical device | Legal delay | Educational positioning, no diagnosis or treatment, doctor-in-the-loop, written legal opinion, early contact with DGDA |
| Data breach | Legal and trust damage | Encryption, minimisation, access control, audits, pentests, incident plan |
| Doctor resistance | Slow adoption | Involve doctors as advisors, show fewer calls, add "endorsed by" and doctor review mode |
| Labs refuse to share data | No distribution | Start with mid-size labs, free pilot, data processing agreements, on-premise option for large chains |
| Large competitor copies it | Market pressure | Move fast, local depth, lab integrations, long-term contracts |
| Low patient digital literacy | Low usage | Simple UI, voice explanation, WhatsApp, printed QR code on the report |
| Price sensitivity | Low margins | Bundle into report price (৳10 inside a ৳1,500 test package), volume pricing |

---

## 21. Pitch for diagnostic centers

> **"Give every patient a report they can understand, in Bangla, with your brand."**
>
> - Your patients receive their report on WhatsApp with a **simple Bangla explanation**.
> - **Fewer calls** to your front desk and to referring doctors.
> - **Critical results flagged** so your team can call the patient quickly.
> - **Your logo and booking button** on every explanation, so patients come back to you.
> - Costs about **৳10 per report**, less than 1% of a typical test package.
> - Free 1-month pilot, no integration needed to start.

---

## 22. Next steps checklist

- [ ] Choose a product name and check domain and trademark (e.g., *LabSohoj*, *ReportBuzhun*, *Sohoj Report*)
- [ ] Interview 10 labs, 10 doctors and 20 patients
- [ ] Collect 50–100 anonymised sample reports from at least 5 different labs
- [ ] Recruit clinical advisors and sign advisor agreements
- [ ] Get a legal opinion (data protection, DGDA, terms of service)
- [ ] Build the test catalog (LOINC mapping, Bangla/English descriptions)
- [ ] Build the MVP pipeline (§8)
- [ ] Write and get approval for the per-test explanation templates
- [ ] Prepare the privacy policy, terms of service, consent and data processing agreement
- [ ] Sign the first pilot lab
- [ ] Measure, iterate, publish the case study
- [ ] Convert to paid and scale

---

*Document version 1.0. Living document: update it after the validation interviews and the pilot.*

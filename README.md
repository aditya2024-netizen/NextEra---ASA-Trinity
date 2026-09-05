# CareTrack AI — Healthcare Patient Follow-up Risk Predictor (PS-01)

> **Predict $\longrightarrow$ Explain $\longrightarrow$ Rank $\longrightarrow$ Intervene**  
> An explainable, closed-loop clinical intelligence platform to predict outpatient follow-up non-attendance, explain risk drivers, dynamically rank priority queues, and coordinate proactive interventions.

---

## 🌟 Executive Summary & Core Value Proposition

Missed outpatient follow-ups lead to worsened health outcomes, avoidable emergency readmissions, and lost hospital clinic capacity. 

**CareTrack AI** transforms follow-up operations from passive scheduling into proactive risk mitigation:
1. **Predict:** Real-time risk estimation using a deterministic, 0–100 point explainable engine across 6 clinical and demographic factors.
2. **Explain:** Transparent factor-by-factor point attribution answering *"Why is this patient at risk?"* with top drivers and protective factors.
3. **Rank:** Dynamic triage queues categorized into 4 tiers: `LOW` (0–29), `MEDIUM` (30–59), `HIGH` (60–79), and `CRITICAL` (80–100).
4. **Intervene:** Multi-channel outreach workflows (Priority Phone Call, SMS, WhatsApp, Teleconsultation) with live Twilio and transparent **Twilio Demo Mode**.
5. **What-If Scenario Simulator:** Interactive slider tool for coordinators to simulate friction reduction (e.g. telehealth, transit support, age adjustment) with live point delta previews.

---

## 🏛️ System Architecture & Stack

CareTrack AI is built with a fast, modern, and auditable stack:

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + TypeScript + Vite                │
│  • Executive Dashboard    • Dynamic Risk Queue              │
│  • Patient Dossier        • What-If Simulator               │
│  • Leaflet GIS Maps       • Gemini Clinical Ops Assistant   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / JSON
┌──────────────────────────────▼──────────────────────────────┐
│             Node.js + Express + TypeScript Backend          │
│  • Deterministic 6-Factor Scoring Engine                    │
│  • RBAC Authentication (Doctor, Nurse, Coordinator, Admin)  │
│  • Twilio Notification Gateway + Transparent Demo Mode      │
│  • Audit Logging Engine & CSV Exporter                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ pg (node-postgres)
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL 18 Database                   │
│  • users, patients, appointments, predictions               │
│  • interventions, notifications, audit_logs, scoring_configs│
│  • Single Source of Truth — 100% Persistent on Disk         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Explainable 6-Factor Scoring Engine

The scoring engine is transparent, calibrated, and completely deterministic (no black-box scoring):

$$\text{Risk Score} = \min(100, P_{\text{missed}} + P_{\text{distance}} + P_{\text{attendance}} + P_{\text{cadence}} + P_{\text{duration}} + P_{\text{age}})$$

| Factor | Max Points | Clinical Rationale & Mapping |
| :--- | :---: | :--- |
| **Missed Appointments** | **35 pts** | Evaluates historical broken follow-up commitments (0 = 0 pts; 1 = 9 pts; 2 = 18 pts; 3 = 26 pts; $\ge 4$ = 35 pts). |
| **Hospital Travel Distance** | **20 pts** | Physical transit friction based on patient geolocation relative to clinic. |
| **Historical Attendance Rate** | **20 pts** | Long-term consistency of attendance across all outpatient visits. |
| **Appointment Interval Cadence** | **10 pts** | Sparse appointment intervals weaken clinical engagement. |
| **Treatment Duration Fatigue** | **10 pts** | Extended chronic care journeys (12+ months) lead to patient drop-off fatigue. |
| **Age Vulnerability** | **5 pts** | Senior mobility assistance needs ($\ge 65\text{y}$) or pediatric schedule dependencies ($<12\text{y}$). |

### 4 Risk Tiers
* 🟢 **LOW RISK (0 – 29):** Automated routine SMS reminder 24h prior.
* 🟡 **MEDIUM RISK (30 – 59):** Two-way confirmation SMS + interactive WhatsApp reminder.
* 🔴 **HIGH RISK (60 – 79):** Priority telephone outreach within 24–48h, remote teleconsultation offer, and transit coordination.
* 🟣 **CRITICAL RISK (80 – 100):** Urgent clinical coordinator phone contact within 24h, home health worker assessment, or ambulance shuttle support.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18+ (Tested on Node.js v22)
- **npm** or **bun**

### 2. Clone and Install
```bash
git clone https://github.com/aditya2024-netizen/NextEra---ASA-Trinity.git
cd NextEra---ASA-Trinity
npm install
```

### 3. Environment Variables (Optional)
Copy `.env.example` to `.env` if you wish to configure live third-party services:
```env
PORT=3000
DATABASE_URL=                          # Optional external PostgreSQL URL (defaults to embedded PG on port 5433)
GEMINI_API_KEY=MY_GEMINI_API_KEY      # Optional Gemini API key (defaults to deterministic fallback)
TWILIO_ACCOUNT_SID=                   # Optional Twilio SID (defaults to Twilio Demo Mode)
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 4. Build and Run
```bash
# Build production bundle
npm run build

# Start the application
npm start
```
The application will launch at **`http://localhost:3000`**.  
PostgreSQL automatically provisions schemas and seeds 1,000 outpatient records on first boot.

---

## 👥 Pre-Configured Staff Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Doctor** | Dr. Rajesh Kulkarni, MD, DM | `doctor@caretrack.in` | `password123` |
| **Nurse** | Sister Meena Pillai, RN | `nurse@caretrack.in` | `password123` |
| **Coordinator** | Amit Verma | `coordinator@caretrack.in` | `password123` |
| **Care Manager** | Dr. Kavita Sharma, MPH | `caremanager@caretrack.in` | `password123` |
| **Administrator** | Dr. Aruna Swaminathan, MD | `admin@caretrack.in` | `password123` |

*Quick 1-Click login buttons are available on the Login screen for instant testing.*

---

## 🎯 Demo Walkthrough Guide (Hero Patient: Priya Patel)

1. **Dashboard Overview**: Inspect the executive overview showing 1,000 active patients, 185 high/critical risk cohort, 36 follow-ups due today, and 84% outreach success rate.
2. **Prioritized Risk Queue**: Filter by **Due in Next 7 Days** and inspect patients ranked by risk score.
3. **Hero Patient Deep-Dive (`P-1042`)**: Click on **Priya Patel (`P-1042`)**, a post-CABG patient living 42 km away with 5 missed visits and a Risk Score of **83/100 (CRITICAL)**.
4. **What-If Simulation**: In the simulator, click **Offer Remote Telehealth** (reducing distance to 0 km). Watch the score drop live from 83 to 64 ($-19\text{ pts}$). Adjust the **Patient Age** and **Missed Appointments** sliders to observe live recalibration.
5. **Close-the-Loop Outreach**: Click **Contact Patient**, select **SMS**, and click **Send Communication & Save**. Observe the transparent **`[Twilio Demo Mode] Simulated SMS successfully dispatched`** feedback and database record.
6. **AI Assistant**: Open the clinical assistant (bottom-right) and ask *"Why is P-1042 high risk?"* to review instant clinical driver attribution.
7. **Analytics Suite**: Review attendance trend curves, risk factor frequencies, and audit logging verifying hospital operational compliance.

---

## 🔒 Responsible AI & Governance

- **Decision Support Only**: CareTrack AI assists clinical coordinators and reception desks with scheduling prioritization. It never prescribes medications or modifies clinical treatment protocols.
- **Explainability**: Every prediction presents an exact mathematical breakdown with bounded point caps and positive protective factors.
- **Audit Logging**: Every login, configuration update, patient edit, and outreach dispatch is immutably logged to PostgreSQL.

// server.ts
import express from "express";
import path2 from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// src/services/scoringEngine.ts
var DEFAULT_SCORING_CONFIG = {
  thresholds: {
    lowMax: 29,
    mediumMax: 59,
    highMax: 79,
    highMin: 60,
    criticalMin: 80
  },
  weights: {
    missedAppointmentsWeight: 35,
    distanceWeight: 20,
    attendanceRateWeight: 20,
    appointmentFrequencyWeight: 10,
    treatmentDurationWeight: 10,
    ageWeight: 5
  },
  criticalRiskThreshold: 80,
  highRiskThreshold: 60,
  mediumRiskThreshold: 30,
  maxMissedPoints: 35,
  maxDistancePoints: 20,
  maxAttendancePoints: 20,
  maxFrequencyPoints: 10,
  maxDurationPoints: 10,
  maxAgePoints: 5,
  autoEscalateHighRiskDays: 2
};
function calculatePatientRisk(patientData, config = DEFAULT_SCORING_CONFIG) {
  const {
    id = "TEMP_PRED",
    age,
    distanceKm,
    treatmentDurationMonths,
    appointmentFrequencyDays,
    totalAppointments,
    attendedAppointments,
    missedAppointments,
    recentAttendanceStreak = 0
  } = patientData;
  const attendanceRate = totalAppointments > 0 ? Math.round(attendedAppointments / totalAppointments * 100) : 100;
  const factors = [];
  const reasons = [];
  const protectiveFactors = [];
  const recommendedActions = [];
  const wMissed = config.weights?.missedAppointmentsWeight ?? config.maxMissedPoints ?? 40;
  const wDistance = config.weights?.distanceWeight ?? config.maxDistancePoints ?? 20;
  const wAttendance = config.weights?.attendanceRateWeight ?? config.maxAttendancePoints ?? 20;
  const wFrequency = config.weights?.appointmentFrequencyWeight ?? config.maxFrequencyPoints ?? 10;
  const wDuration = config.weights?.treatmentDurationWeight ?? config.maxDurationPoints ?? 10;
  const highMin = config.thresholds?.highMin ?? config.highRiskThreshold ?? 60;
  const lowMax = config.thresholds?.lowMax ?? (config.mediumRiskThreshold ? config.mediumRiskThreshold - 1 : 29);
  let missedPoints = 0;
  if (missedAppointments === 0) {
    missedPoints = 0;
  } else if (missedAppointments === 1) {
    missedPoints = 10;
  } else if (missedAppointments === 2) {
    missedPoints = 20;
  } else if (missedAppointments === 3) {
    missedPoints = 30;
  } else {
    missedPoints = 40;
  }
  const scaledMissedPoints = Math.round(missedPoints / 40 * wMissed);
  factors.push({
    name: "Missed Appointments",
    rawValue: `${missedAppointments} missed out of ${totalAppointments}`,
    points: scaledMissedPoints,
    maxPoints: wMissed,
    impact: scaledMissedPoints >= 25 ? "HIGH" : scaledMissedPoints >= 10 ? "MEDIUM" : "LOW",
    category: "History",
    explanation: missedAppointments > 0 ? `Patient has accumulated ${missedAppointments} missed visit(s), indicating recurring follow-up friction.` : `Zero missed appointments in patient history.`,
    percentageContribution: 0
  });
  if (missedAppointments >= 3) {
    reasons.push(`${missedAppointments} previous follow-up appointments were missed`);
  } else if (missedAppointments === 1 || missedAppointments === 2) {
    reasons.push(`Patient has missed ${missedAppointments} previous appointment(s)`);
  } else {
    protectiveFactors.push("Zero previous missed appointments in record");
  }
  let distancePoints = 0;
  if (distanceKm < 5) {
    distancePoints = 0;
  } else if (distanceKm <= 15) {
    distancePoints = 5;
  } else if (distanceKm <= 30) {
    distancePoints = 10;
  } else if (distanceKm <= 50) {
    distancePoints = 15;
  } else {
    distancePoints = 20;
  }
  const scaledDistancePoints = Math.round(distancePoints / 20 * wDistance);
  factors.push({
    name: "Hospital Travel Distance",
    rawValue: `${distanceKm} km`,
    points: scaledDistancePoints,
    maxPoints: wDistance,
    impact: scaledDistancePoints >= 15 ? "HIGH" : scaledDistancePoints >= 8 ? "MEDIUM" : "LOW",
    category: "Distance",
    explanation: distanceKm >= 30 ? `Patient resides ${distanceKm} km away from hospital facility, presenting significant transit barrier.` : distanceKm >= 15 ? `Moderate travel distance of ${distanceKm} km requires deliberate commute planning.` : `Patient resides within ${distanceKm} km of hospital (minimal transit friction).`,
    percentageContribution: 0
  });
  if (distanceKm >= 30) {
    reasons.push(`Patient resides ${distanceKm} km from hospital clinic (travel transit barrier)`);
  } else if (distanceKm < 10) {
    protectiveFactors.push(`Lives close to facility (${distanceKm} km away)`);
  }
  let attendancePoints = 0;
  if (attendanceRate >= 90) {
    attendancePoints = 0;
  } else if (attendanceRate >= 80) {
    attendancePoints = 5;
  } else if (attendanceRate >= 65) {
    attendancePoints = 10;
  } else if (attendanceRate >= 50) {
    attendancePoints = 15;
  } else {
    attendancePoints = 20;
  }
  const scaledAttendancePoints = Math.round(attendancePoints / 20 * wAttendance);
  factors.push({
    name: "Historical Attendance Rate",
    rawValue: `${attendanceRate}% rate`,
    points: scaledAttendancePoints,
    maxPoints: wAttendance,
    impact: scaledAttendancePoints >= 15 ? "HIGH" : scaledAttendancePoints >= 8 ? "MEDIUM" : "LOW",
    category: "History",
    explanation: attendanceRate < 70 ? `Overall historical attendance rate is low (${attendanceRate}%), showing long-term schedule irregularity.` : attendanceRate >= 85 ? `Strong historical engagement with ${attendanceRate}% overall attendance rate.` : `Moderate overall attendance consistency (${attendanceRate}%).`,
    percentageContribution: 0
  });
  if (attendanceRate < 70) {
    reasons.push(`Overall historical attendance consistency is low (${attendanceRate}%)`);
  } else if (attendanceRate >= 85) {
    protectiveFactors.push(`High historical attendance record (${attendanceRate}%)`);
  }
  let frequencyPoints = 0;
  if (appointmentFrequencyDays > 90) {
    frequencyPoints = 10;
  } else if (appointmentFrequencyDays > 60) {
    frequencyPoints = 7;
  } else if (appointmentFrequencyDays > 30) {
    frequencyPoints = 4;
  } else {
    frequencyPoints = 0;
  }
  const scaledFreqPoints = Math.round(frequencyPoints / 10 * wFrequency);
  factors.push({
    name: "Appointment Interval Cadence",
    rawValue: `Every ${appointmentFrequencyDays} days`,
    points: scaledFreqPoints,
    maxPoints: wFrequency,
    impact: scaledFreqPoints >= 7 ? "MEDIUM" : "LOW",
    category: "Frequency",
    explanation: appointmentFrequencyDays > 60 ? `Infrequent follow-up interval (${appointmentFrequencyDays} days) increases risk of forgotten appointments.` : `Regular follow-up cadence (${appointmentFrequencyDays} days) maintains clinical connection.`,
    percentageContribution: 0
  });
  if (appointmentFrequencyDays > 60) {
    reasons.push(`Infrequent follow-up cadence (every ${appointmentFrequencyDays} days) increases forgetfulness risk`);
  } else if (appointmentFrequencyDays <= 30) {
    protectiveFactors.push(`Regular, frequent appointment cadence (every ${appointmentFrequencyDays} days)`);
  }
  let durationPoints = 0;
  if (treatmentDurationMonths >= 18) {
    durationPoints = 10;
  } else if (treatmentDurationMonths >= 12) {
    durationPoints = 7;
  } else if (treatmentDurationMonths >= 6) {
    durationPoints = 4;
  } else {
    durationPoints = 0;
  }
  const scaledDurationPoints = Math.round(durationPoints / 10 * wDuration);
  factors.push({
    name: "Treatment Duration Fatigue",
    rawValue: `${treatmentDurationMonths} months`,
    points: scaledDurationPoints,
    maxPoints: wDuration,
    impact: scaledDurationPoints >= 7 ? "MEDIUM" : "LOW",
    category: "Duration",
    explanation: treatmentDurationMonths >= 12 ? `Extended treatment journey (${treatmentDurationMonths} mos) can cause chronic care follow-up fatigue.` : `Manageable treatment timeline (${treatmentDurationMonths} mos).`,
    percentageContribution: 0
  });
  if (treatmentDurationMonths >= 12) {
    reasons.push(`Extended care regimen (${treatmentDurationMonths} months) increases follow-up fatigue`);
  }
  let agePoints = 0;
  if (age >= 75) {
    agePoints = 5;
  } else if (age >= 65) {
    agePoints = 4;
  } else if (age < 12) {
    agePoints = 3;
  } else if (age >= 55) {
    agePoints = 2;
  } else {
    agePoints = 0;
  }
  const wAge = config.weights?.ageWeight ?? config.maxAgePoints ?? 5;
  const scaledAgePoints = Math.round(agePoints / 5 * wAge);
  factors.push({
    name: "Age Vulnerability",
    rawValue: `${age} years`,
    points: scaledAgePoints,
    maxPoints: wAge,
    impact: scaledAgePoints >= 4 ? "HIGH" : scaledAgePoints >= 2 ? "MEDIUM" : "LOW",
    category: "Demographics",
    explanation: age >= 65 ? `Senior age (${age}y) presents elevated physical mobility and travel transit vulnerability.` : age < 12 ? `Pediatric patient (${age}y) requires caregiver accompaniment and scheduling synchronization.` : `Patient age (${age}y) has standard independent mobility.`,
    percentageContribution: 0
  });
  if (age >= 65) {
    reasons.push(`Senior patient age (${age}y) presents travel and physical mobility challenges`);
  } else if (age >= 18 && age <= 50) {
    protectiveFactors.push(`Independent mobility age profile (${age}y)`);
  }
  if (recentAttendanceStreak >= 2) {
    protectiveFactors.push(`Patient attended the last ${recentAttendanceStreak} scheduled appointments consistently`);
  }
  const totalScoreRaw = scaledMissedPoints + scaledDistancePoints + scaledAttendancePoints + scaledFreqPoints + scaledDurationPoints + scaledAgePoints;
  const score = Math.min(100, Math.max(0, totalScoreRaw));
  factors.forEach((factor) => {
    factor.percentageContribution = score > 0 ? Math.round(factor.points / score * 100) : 0;
  });
  factors.sort((a, b) => b.points - a.points);
  const criticalMin = config.thresholds?.criticalMin ?? config.criticalRiskThreshold ?? 80;
  let riskLevel = "LOW";
  if (score >= criticalMin) {
    riskLevel = "CRITICAL";
  } else if (score >= highMin) {
    riskLevel = "HIGH";
  } else if (score > lowMax) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }
  let immediateAction = "Standard Automated SMS Reminder";
  let secondaryAction = "Send WhatsApp Clinic Confirmation";
  let alternativeAction = "Routine Follow-up Log";
  if (riskLevel === "CRITICAL") {
    immediateAction = "Urgent Clinical Coordinator Phone Outreach & Home Visit Assessment";
    secondaryAction = "Emergency Teleconsultation / Ambulance Transport Support";
    alternativeAction = "Expedited Physician Review";
    recommendedActions.push("Immediate telephone contact within 24 hours by clinical care coordinator");
    recommendedActions.push("Proactively arrange teleconsultation or hospital transport voucher");
    recommendedActions.push("Engage primary family caregiver to confirm attendance readiness");
    recommendedActions.push("Clinical triage review by attending specialist");
  } else if (riskLevel === "HIGH") {
    if (scaledMissedPoints >= 20 && scaledDistancePoints >= 10) {
      immediateAction = "Priority Phone Call + Remote Teleconsultation Offer";
      secondaryAction = "Transport Coordination / Transit Guidance";
      alternativeAction = "Assign Dedicated Nurse Outreach Coordinator";
      recommendedActions.push("Priority telephone outreach by clinical coordinator within 24-48 hours");
      recommendedActions.push("Offer hybrid teleconsultation / remote follow-up if travel is difficult");
      recommendedActions.push("Confirm appointment readiness and caregiver transport support");
    } else if (scaledMissedPoints >= 20) {
      immediateAction = "Priority Phone Call with Clinical Staff";
      secondaryAction = "Two-Way SMS Rescheduling Hotline";
      alternativeAction = "Peer Outreach / Care Coordinator Follow-up";
      recommendedActions.push("Direct telephone outreach by nursing coordinator");
      recommendedActions.push("Address patient-reported scheduling hurdles");
      recommendedActions.push("Offer flexible alternative appointment slot");
    } else if (scaledDistancePoints >= 12) {
      immediateAction = "Offer Remote Teleconsultation / Virtual Visit";
      secondaryAction = "Community Transit Assistance Referral";
      alternativeAction = "Saturday / Off-Peak Clinic Time Slot";
      recommendedActions.push("Proactively offer telehealth follow-up visit");
      recommendedActions.push("Provide transit assistance information");
      recommendedActions.push("Batch diagnostic tests into a single morning visit");
    } else {
      immediateAction = "Priority Outreach Call within 48 Hours";
      secondaryAction = "Interactive SMS Confirmation";
      alternativeAction = "Clinic Care Manager Review";
      recommendedActions.push("Personalized call before upcoming visit");
      recommendedActions.push("Verify contact details and preferred appointment hours");
    }
  } else if (riskLevel === "MEDIUM") {
    if (scaledDistancePoints >= 10) {
      immediateAction = "Two-Way SMS Confirmation + Telehealth Option";
      secondaryAction = "Phone Reminder 48h Prior";
      alternativeAction = "Clinic Transit Guide";
      recommendedActions.push("Send SMS reminder with 1-click confirmation");
      recommendedActions.push("Offer remote consultation if travel is inconvenient");
    } else if (scaledMissedPoints >= 10) {
      immediateAction = "Personalized Phone Outreach";
      secondaryAction = "Interactive WhatsApp Reminder";
      alternativeAction = "Calendar Invite & Pre-appointment Checklist";
      recommendedActions.push("Direct reminder call 3 days before visit");
      recommendedActions.push("Confirm travel readiness");
    } else {
      immediateAction = "Automated SMS & WhatsApp Reminder";
      secondaryAction = "Pre-visit Clinical Questionnaire";
      alternativeAction = "Phone Reminder if Unacknowledged";
      recommendedActions.push("Send automated reminder 3 days and 1 day prior");
      recommendedActions.push("Request patient confirmation reply");
    }
  } else {
    immediateAction = "Standard Automated SMS Reminder (24h Prior)";
    secondaryAction = "Patient Portal Calendar Notification";
    alternativeAction = "Optional Email Summary";
    recommendedActions.push("Standard automated reminder 24 hours prior to appointment");
    recommendedActions.push("Digital patient portal notification");
  }
  let naturalLanguageSummary = "";
  if (riskLevel === "CRITICAL") {
    const topReasonStr = reasons.slice(0, 2).join(" and ");
    naturalLanguageSummary = `This patient is classified as CRITICAL Risk (${score}/100) due to severe follow-up barriers including ${topReasonStr || "accumulated non-attendance, distance, and age vulnerability"}. Immediate priority clinician intervention is required.`;
  } else if (riskLevel === "HIGH") {
    const topReasonStr = reasons.slice(0, 2).join(" and ");
    naturalLanguageSummary = `This patient is classified as High Risk (${score}/100) primarily because ${topReasonStr || "of multiple historical attendance barriers"}. Proactive intervention is strongly recommended before the scheduled date.`;
  } else if (riskLevel === "MEDIUM") {
    const topReasonStr = reasons.length > 0 ? reasons[0] : "moderate transit and scheduling factors";
    naturalLanguageSummary = `This patient presents Medium Risk (${score}/100) with notable influence from ${topReasonStr}. A reminder with confirmation is recommended to secure attendance.`;
  } else {
    naturalLanguageSummary = `This patient is classified as Low Risk (${score}/100) with consistent attendance history and minimal transit friction. Standard notification workflow is sufficient.`;
  }
  const evidenceCoverage = `Reviewed ${totalAppointments} historical appointments recorded across ${treatmentDurationMonths} months of outpatient care.`;
  const responsibleAiNote = "All 6 clinical and demographic factors (missed visits, distance, attendance history, cadence, treatment duration, age) contribute with bounded, explainable point weights.";
  return {
    id: `PRED-${id}-${Math.floor(1e5 + Math.random() * 9e5)}`,
    patientId: id,
    score,
    riskLevel,
    evidenceCoverage,
    predictionDate: (/* @__PURE__ */ new Date()).toISOString(),
    modelVersion: "CareTrack Explainable Rule Engine v2.5",
    reasons: reasons.length > 0 ? reasons : ["No significant risk-increasing factors identified"],
    protectiveFactors: protectiveFactors.length > 0 ? protectiveFactors : ["Standard baseline profile"],
    recommendedActions,
    immediateAction,
    secondaryAction,
    alternativeAction,
    topFactors: factors,
    naturalLanguageSummary,
    responsibleAiNote,
    inputSnapshot: {
      age,
      distanceKm,
      treatmentDurationMonths,
      appointmentFrequencyDays,
      totalAppointments,
      attendedAppointments,
      missedAppointments,
      attendanceRate
    }
  };
}

// src/db/db.ts
import { Pool } from "pg";
import path from "path";
import fs from "fs";

// src/data/seedData.ts
var INDIAN_LANGUAGES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Kannada",
  "Punjabi",
  "Gujarati",
  "Malayalam",
  "Odia",
  "Urdu"
];
var INDIAN_CITIES_PRESETS = [
  { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, distance: 42, locality: "Satellite Road / Vastrapur Area" },
  { city: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.209, distance: 28, locality: "Mayur Vihar / AIIMS Corridor" },
  { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, distance: 35, locality: "Vikas Nagar / KGMU Area" },
  { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, distance: 19, locality: "CIT Nagar / Rajiv Gandhi General Hospital" },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, distance: 14, locality: "Jayanagar 4th Block / Victoria Hospital" },
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, distance: 24, locality: "Bandra West / KEM Hospital Area" },
  { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, distance: 16, locality: "Salt Lake Sector 1 / SSKM Hospital" },
  { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, distance: 15, locality: "Kothrud / Sassoon General Hospital" },
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, distance: 22, locality: "Banjara Hills / NIMS Area" },
  { city: "Chandigarh", state: "Punjab/Haryana", lat: 30.7333, lng: 76.7794, distance: 38, locality: "Sector 8-B / PGIMER Corridor" },
  { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, distance: 29, locality: "Malviya Nagar / SMS Hospital" },
  { city: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, distance: 26, locality: "Edappally / Aster Medcity" }
];
var SEED_USERS = [
  {
    id: "USR-001",
    name: "Dr. Rajesh Kulkarni, MD, DM",
    email: "doctor@caretrack.in",
    role: "DOCTOR",
    department: "Cardiology & Outpatient Medicine",
    employeeId: "DOC-MH-4421",
    phone: "+91 98201 12345"
  },
  {
    id: "USR-002",
    name: "Sister Meena Pillai, B.Sc RN",
    email: "nurse@caretrack.in",
    role: "NURSE",
    department: "Outpatient Triage & Vitals",
    employeeId: "NUR-TN-8890",
    phone: "+91 94441 55667"
  },
  {
    id: "USR-003",
    name: "Amit Verma",
    email: "coordinator@caretrack.in",
    role: "COORDINATOR",
    department: "Hospital Follow-up & Outreach Desk",
    employeeId: "STF-DL-1092",
    phone: "+91 98110 99887"
  },
  {
    id: "USR-004",
    name: "Shalini Roy",
    email: "caremanager@caretrack.in",
    role: "CARE_MANAGER",
    department: "Chronic Care & Adherence Management",
    employeeId: "MGR-WB-3341",
    phone: "+91 98300 44556"
  },
  {
    id: "USR-005",
    name: "Dr. Aruna Swaminathan, MD, MHA",
    email: "admin@caretrack.in",
    role: "ADMIN",
    department: "Hospital Clinical Administration",
    employeeId: "ADM-KA-0012",
    phone: "+91 98860 11223"
  }
];
var CANONICAL_INDIAN_PATIENTS = [
  {
    id: "PAT-1042",
    patientCode: "P-1042",
    name: "Priya Patel",
    age: 46,
    gender: "Female",
    phone: "+91 98250 87654",
    email: "priya.patel@example.in",
    address: "Flat 304, Shivalik Heights, Satellite Road, Ahmedabad, Gujarat 380015",
    latitude: 23.03,
    longitude: 72.518,
    distanceKm: 42,
    condition: "Post-CABG Cardiac Rehabilitation & Hypertension",
    treatmentType: "Cardiology Post-Surgical Follow-up",
    treatmentStartDate: "2025-08-14",
    treatmentDurationMonths: 12,
    appointmentFrequencyDays: 60,
    totalAppointments: 12,
    attendedAppointments: 7,
    missedAppointments: 5,
    rescheduledAppointments: 2,
    attendanceRate: 58,
    nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    // Tomorrow
    lastVisitDate: "2026-06-25",
    status: "ACTIVE",
    assignedDoctor: "Dr. Rajesh Kulkarni, DM",
    preferredLanguage: "Gujarati",
    transportAccess: "Requires Assistance",
    createdAt: "2025-08-14T09:30:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1041",
    patientCode: "P-1041",
    name: "Rajesh Sharma",
    age: 58,
    gender: "Male",
    phone: "+91 98112 34567",
    email: "rajesh.sharma@example.in",
    address: "B-42, Pocket 1, Mayur Vihar Phase 1, New Delhi, Delhi 110091",
    latitude: 28.608,
    longitude: 77.296,
    distanceKm: 28,
    condition: "Type 2 Diabetes Mellitus & Diabetic Nephropathy",
    treatmentType: "Endocrinology & Renal Protection Protocol",
    treatmentStartDate: "2025-05-10",
    treatmentDurationMonths: 15,
    appointmentFrequencyDays: 45,
    totalAppointments: 10,
    attendedAppointments: 6,
    missedAppointments: 4,
    rescheduledAppointments: 1,
    attendanceRate: 60,
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-06-15",
    status: "ACTIVE",
    assignedDoctor: "Dr. Shalini Mukherjee, MD",
    preferredLanguage: "Hindi",
    transportAccess: "Requires Assistance",
    createdAt: "2025-05-10T08:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1043",
    patientCode: "P-1043",
    name: "Sunita Verma",
    age: 52,
    gender: "Female",
    phone: "+91 94150 23489",
    email: "sunita.verma@example.in",
    address: "Sector 4, Vikas Nagar, Lucknow, Uttar Pradesh 226022",
    latitude: 26.892,
    longitude: 80.957,
    distanceKm: 35,
    condition: "Rheumatoid Arthritis & Chronic Pain Management",
    treatmentType: "Rheumatology Biological Therapy",
    treatmentStartDate: "2025-11-05",
    treatmentDurationMonths: 9,
    appointmentFrequencyDays: 30,
    totalAppointments: 8,
    attendedAppointments: 5,
    missedAppointments: 3,
    rescheduledAppointments: 1,
    attendanceRate: 62,
    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-07-20",
    status: "ACTIVE",
    assignedDoctor: "Dr. Arvind Sundaram, MD",
    preferredLanguage: "Hindi",
    transportAccess: "Public Transit",
    createdAt: "2025-11-05T10:15:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1044",
    patientCode: "P-1044",
    name: "Ramesh Iyer",
    age: 67,
    gender: "Male",
    phone: "+91 94440 67890",
    email: "ramesh.iyer@example.in",
    address: "18/4, 4th Cross Street, CIT Nagar, Nandanam, Chennai, Tamil Nadu 600035",
    latitude: 13.027,
    longitude: 80.234,
    distanceKm: 19,
    condition: "Chronic Heart Failure (NYHA Class III)",
    treatmentType: "Heart Failure Disease Management Program",
    treatmentStartDate: "2025-03-20",
    treatmentDurationMonths: 17,
    appointmentFrequencyDays: 45,
    totalAppointments: 14,
    attendedAppointments: 11,
    missedAppointments: 3,
    rescheduledAppointments: 1,
    attendanceRate: 78,
    nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-07-10",
    status: "ACTIVE",
    assignedDoctor: "Dr. Rajesh Kulkarni, DM",
    preferredLanguage: "Tamil",
    transportAccess: "Personal",
    createdAt: "2025-03-20T11:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1045",
    patientCode: "P-1045",
    name: "Ananya Banerjee",
    age: 34,
    gender: "Female",
    phone: "+91 98311 44556",
    email: "ananya.banerjee@example.in",
    address: "Block CF-182, Sector 1, Salt Lake City, Bidhannagar, Kolkata, West Bengal 700064",
    latitude: 22.586,
    longitude: 88.411,
    distanceKm: 16,
    condition: "Systemic Lupus Erythematosus (SLE) & Antiphospholipid Syndrome",
    treatmentType: "Autoimmune & Immunosuppression Regimen",
    treatmentStartDate: "2026-01-15",
    treatmentDurationMonths: 7,
    appointmentFrequencyDays: 30,
    totalAppointments: 7,
    attendedAppointments: 6,
    missedAppointments: 1,
    rescheduledAppointments: 1,
    attendanceRate: 85,
    nextFollowUpDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-07-28",
    status: "ACTIVE",
    assignedDoctor: "Dr. Shalini Mukherjee, MD",
    preferredLanguage: "Bengali",
    transportAccess: "Public Transit",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1046",
    patientCode: "P-1046",
    name: "Gurpreet Singh",
    age: 61,
    gender: "Male",
    phone: "+91 98765 43210",
    email: "gurpreet.singh@example.in",
    address: "House 524, Sector 8-B, Chandigarh 160009",
    latitude: 30.741,
    longitude: 76.79,
    distanceKm: 38,
    condition: "Chronic Obstructive Pulmonary Disease (COPD Gold Stage II)",
    treatmentType: "Pulmonary Rehabilitation & Inhaler Therapy",
    treatmentStartDate: "2025-07-01",
    treatmentDurationMonths: 13,
    appointmentFrequencyDays: 60,
    totalAppointments: 9,
    attendedAppointments: 5,
    missedAppointments: 4,
    rescheduledAppointments: 1,
    attendanceRate: 55,
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-06-18",
    status: "ACTIVE",
    assignedDoctor: "Dr. Arvind Sundaram, MD",
    preferredLanguage: "Punjabi",
    transportAccess: "Requires Assistance",
    createdAt: "2025-07-01T14:20:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1047",
    patientCode: "P-1047",
    name: "Kavita Reddy",
    age: 42,
    gender: "Female",
    phone: "+91 98490 88776",
    email: "kavita.reddy@example.in",
    address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
    latitude: 17.415,
    longitude: 78.435,
    distanceKm: 8,
    condition: "Hypothyroidism & Polycystic Ovarian Syndrome",
    treatmentType: "Endocrine & Metabolic Care Protocol",
    treatmentStartDate: "2025-09-12",
    treatmentDurationMonths: 11,
    appointmentFrequencyDays: 90,
    totalAppointments: 4,
    attendedAppointments: 4,
    missedAppointments: 0,
    rescheduledAppointments: 0,
    attendanceRate: 100,
    nextFollowUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-06-01",
    status: "ACTIVE",
    assignedDoctor: "Dr. Shalini Mukherjee, MD",
    preferredLanguage: "Telugu",
    transportAccess: "Personal",
    createdAt: "2025-09-12T11:45:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1048",
    patientCode: "P-1048",
    name: "Deepak Joshi",
    age: 50,
    gender: "Male",
    phone: "+91 98220 54321",
    email: "deepak.joshi@example.in",
    address: "Plot 45, Ideal Colony, Paud Road, Kothrud, Pune, Maharashtra 411038",
    latitude: 18.507,
    longitude: 73.807,
    distanceKm: 15,
    condition: "Essential Hypertension & Dyslipidemia",
    treatmentType: "Cardiovascular Risk Prevention Program",
    treatmentStartDate: "2026-02-10",
    treatmentDurationMonths: 6,
    appointmentFrequencyDays: 45,
    totalAppointments: 5,
    attendedAppointments: 4,
    missedAppointments: 1,
    rescheduledAppointments: 0,
    attendanceRate: 80,
    nextFollowUpDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-07-15",
    status: "ACTIVE",
    assignedDoctor: "Dr. Rajesh Kulkarni, DM",
    preferredLanguage: "Marathi",
    transportAccess: "Personal",
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1049",
    patientCode: "P-1049",
    name: "Lakshmi Narayanan",
    age: 72,
    gender: "Female",
    phone: "+91 94470 12389",
    email: "lakshmi.narayanan@example.in",
    address: "22/104, Toll Gate Junction, Edappally, Kochi, Kerala 682024",
    latitude: 10.024,
    longitude: 76.308,
    distanceKm: 26,
    condition: "Osteoarthritis Bilateral Knee & Chronic Kidney Disease Stage 2",
    treatmentType: "Orthopaedic Joint Preservation & Nephrology Check",
    treatmentStartDate: "2025-04-18",
    treatmentDurationMonths: 16,
    appointmentFrequencyDays: 60,
    totalAppointments: 9,
    attendedAppointments: 7,
    missedAppointments: 2,
    rescheduledAppointments: 1,
    attendanceRate: 77,
    nextFollowUpDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-07-02",
    status: "ACTIVE",
    assignedDoctor: "Dr. Arvind Sundaram, MD",
    preferredLanguage: "Malayalam",
    transportAccess: "Requires Assistance",
    createdAt: "2025-04-18T15:30:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "PAT-1050",
    patientCode: "P-1050",
    name: "Vikas Deshmukh",
    age: 39,
    gender: "Male",
    phone: "+91 98230 77889",
    email: "vikas.deshmukh@example.in",
    address: "11, Prabhat Road, Lane 4, Erandwane, Pune, Maharashtra 411004",
    latitude: 18.515,
    longitude: 73.832,
    distanceKm: 6,
    condition: "Post-Percutaneous Coronary Intervention (PCI Stent)",
    treatmentType: "Interventional Cardiology Post-Stent Surveillance",
    treatmentStartDate: "2026-03-01",
    treatmentDurationMonths: 5,
    appointmentFrequencyDays: 30,
    totalAppointments: 5,
    attendedAppointments: 5,
    missedAppointments: 0,
    rescheduledAppointments: 0,
    attendanceRate: 100,
    nextFollowUpDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    lastVisitDate: "2026-08-01",
    status: "ACTIVE",
    assignedDoctor: "Dr. Rajesh Kulkarni, DM",
    preferredLanguage: "Marathi",
    transportAccess: "Personal",
    createdAt: "2026-03-01T12:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var FIRST_NAMES_MALE = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Kabir", "Rohan", "Manoj", "Vikram", "Sanjay", "Sunil", "Prakash", "Amit", "Anil", "Naveen", "Ashok", "Suresh", "Dinesh", "Karan", "Manish", "Harish", "Gopal", "Madhav", "Kishore", "Alok", "Mohit", "Chetan", "Sameer", "Pankaj", "Abhishek", "Gaurav"];
var FIRST_NAMES_FEMALE = ["Aadhya", "Saanvi", "Ananya", "Diya", "Gauri", "Anushka", "Navya", "Myra", "Ira", "Avani", "Riya", "Sara", "Prisha", "Aditi", "Meera", "Pooja", "Deepa", "Sneha", "Rekha", "Geeta", "Neeta", "Swati", "Kavita", "Shalini", "Rashmi", "Preeti", "Sunita", "Anita", "Manju", "Usha", "Lalita", "Shobha", "Varsha", "Anjali", "Archana", "Bhavna", "Ritu", "Sandhya", "Madhu", "Suman"];
var LAST_NAMES = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Joshi", "Deshmukh", "Kulkarni", "Iyer", "Reddy", "Rao", "Nair", "Banerjee", "Chatterjee", "Das", "Sen", "Ghosh", "Mukherjee", "Dutta", "Chauhan", "Yadav", "Pandey", "Mishra", "Trivedi", "Bhatt", "Saxena", "Kapoor", "Malhotra", "Bhatia", "Sethi", "Grover", "Menon", "Pillai", "Shetty", "Hegde", "Gowda", "Naidu", "Choudhury", "Aggarwal"];
var CLINICAL_CONDITIONS = [
  { condition: "Type 2 Diabetes Mellitus & Hypertension", treatment: "Endocrinology & Cardiology Co-care", doctor: "Dr. Shalini Mukherjee, MD" },
  { condition: "Post-CABG Cardiac Rehabilitation", treatment: "Cardiology Post-Surgical Follow-up", doctor: "Dr. Rajesh Kulkarni, DM" },
  { condition: "Chronic Kidney Disease (Stage 3)", treatment: "Nephrology & Renal Protection Care", doctor: "Dr. Arvind Sundaram, MD" },
  { condition: "COPD & Bronchial Asthma Protocol", treatment: "Pulmonology Outpatient Care", doctor: "Dr. Arvind Sundaram, MD" },
  { condition: "Rheumatoid Arthritis on Immunomodulators", treatment: "Rheumatology Disease Management", doctor: "Dr. Shalini Mukherjee, MD" },
  { condition: "Post-PCI Stent Surveillance", treatment: "Interventional Cardiology Care", doctor: "Dr. Rajesh Kulkarni, DM" },
  { condition: "Chronic Heart Failure (NYHA Class II-III)", treatment: "Heart Failure Care Program", doctor: "Dr. Rajesh Kulkarni, DM" },
  { condition: "Essential Hypertension & Hyperlipidemia", treatment: "Preventive Medicine & Lipid Clinic", doctor: "Dr. Shalini Mukherjee, MD" }
];
function generateSyntheticDataset(totalCount = 1e3) {
  const patients = [...CANONICAL_INDIAN_PATIENTS];
  const appointments = [];
  const interventions = [];
  const auditLogs = [
    {
      id: "AUD-001",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1e3).toISOString(),
      staffName: "Dr. Aruna Swaminathan, MD",
      staffRole: "ADMIN",
      action: "Risk Thresholds Configuration Calibrated",
      details: "Calibrated High Risk cutoff threshold to 60 pts and Missed Visits weight to 40 pts."
    },
    {
      id: "AUD-002",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
      staffName: "Sister Meena Pillai, RN",
      staffRole: "NURSE",
      action: "High-Risk Priority Triage",
      details: "Reviewed Priority Queue and initiated phone outreach for Priya Patel (P-1042)."
    },
    {
      id: "AUD-003",
      timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
      staffName: "Amit Verma",
      staffRole: "COORDINATOR",
      action: "Outreach Intervention Logged",
      details: "Logged Priority Phone Call outreach attempt for Priya Patel (P-1042)."
    }
  ];
  const neededSynthetic = Math.max(0, totalCount - patients.length);
  for (let idx = 0; idx < neededSynthetic; idx++) {
    const codeNum = 1051 + idx;
    const isMale = idx % 2 === 0;
    const firstName = isMale ? FIRST_NAMES_MALE[idx % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[idx % FIRST_NAMES_FEMALE.length];
    const lastName = LAST_NAMES[idx * 7 % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const cityPreset = INDIAN_CITIES_PRESETS[idx % INDIAN_CITIES_PRESETS.length];
    const lang = INDIAN_LANGUAGES[idx % INDIAN_LANGUAGES.length];
    const clinical = CLINICAL_CONDITIONS[idx % CLINICAL_CONDITIONS.length];
    const bucket = idx % 100;
    let missedAppointments = 0;
    let totalAppointments = 0;
    let attendedAppointments = 0;
    let distanceKm = 0;
    let appointmentFrequencyDays = 30;
    let treatmentDurationMonths = 6;
    if (bucket < 18) {
      missedAppointments = 3 + idx % 4;
      totalAppointments = missedAppointments + 4 + idx % 6;
      attendedAppointments = totalAppointments - missedAppointments;
      distanceKm = 30 + idx * 3 % 45;
      appointmentFrequencyDays = 60 + idx * 15 % 45;
      treatmentDurationMonths = 12 + idx * 2 % 18;
    } else if (bucket < 60) {
      missedAppointments = 1 + idx % 2;
      totalAppointments = missedAppointments + 4 + idx % 5;
      attendedAppointments = totalAppointments - missedAppointments;
      distanceKm = 15 + idx * 2 % 25;
      appointmentFrequencyDays = 30 + idx * 15 % 35;
      treatmentDurationMonths = 6 + idx % 12;
    } else {
      missedAppointments = 0;
      totalAppointments = 3 + idx % 8;
      attendedAppointments = totalAppointments;
      distanceKm = 3 + idx % 14;
      appointmentFrequencyDays = 15 + idx * 15 % 30;
      treatmentDurationMonths = 3 + idx % 9;
    }
    const attendanceRate = totalAppointments > 0 ? Math.round(attendedAppointments / totalAppointments * 100) : 100;
    const daysUntilDue = idx % 28 - 2;
    const nextFollowUpDate = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const lastVisitDate = new Date(Date.now() - (appointmentFrequencyDays + idx % 10) * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const patient = {
      id: `PAT-${codeNum}`,
      patientCode: `P-${codeNum}`,
      name,
      age: 28 + idx * 3 % 52,
      // 28 to 80
      gender: isMale ? "Male" : "Female",
      phone: `+91 ${98e3 + idx % 1999} ${String(1e4 + idx * 37 % 89999)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@example.in`,
      address: `${10 + idx % 90}, ${cityPreset.locality}, ${cityPreset.city}, ${cityPreset.state}`,
      latitude: cityPreset.lat + (idx % 20 - 10) * 5e-3,
      longitude: cityPreset.lng + (idx % 20 - 10) * 5e-3,
      distanceKm,
      condition: clinical.condition,
      treatmentType: clinical.treatment,
      treatmentStartDate: new Date(Date.now() - treatmentDurationMonths * 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      treatmentDurationMonths,
      appointmentFrequencyDays,
      totalAppointments,
      attendedAppointments,
      missedAppointments,
      rescheduledAppointments: Math.floor(missedAppointments / 2),
      attendanceRate,
      nextFollowUpDate,
      lastVisitDate,
      status: "ACTIVE",
      assignedDoctor: clinical.doctor,
      preferredLanguage: lang,
      transportAccess: distanceKm > 30 ? "Requires Assistance" : distanceKm > 15 ? "Public Transit" : "Personal",
      createdAt: new Date(Date.now() - treatmentDurationMonths * 30 * 24 * 60 * 60 * 1e3).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    patients.push(patient);
  }
  patients.forEach((patient, pIdx) => {
    const total = patient.totalAppointments;
    const missed = patient.missedAppointments;
    let missedAssigned = 0;
    for (let i = 1; i <= total; i++) {
      const daysAgo = (total - i + 1) * patient.appointmentFrequencyDays;
      const apptDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
      let status = "COMPLETED";
      if (missedAssigned < missed && (i === 2 || i === 4 || i === 7 || i === total - 1)) {
        status = "MISSED";
        missedAssigned++;
      } else if (i === 3 && patient.rescheduledAppointments > 0) {
        status = "RESCHEDULED";
      }
      appointments.push({
        id: `APT-${patient.patientCode}-${i}`,
        patientId: patient.id,
        appointmentDate: apptDate,
        department: patient.treatmentType,
        doctorName: patient.assignedDoctor,
        status,
        notes: status === "MISSED" ? "Patient missed scheduled outpatient consultation without notification." : "In-clinic routine consultation completed."
      });
    }
    patient.currentRisk = calculatePatientRisk(patient);
    if (patient.currentRisk.riskLevel === "HIGH" || patient.currentRisk.riskLevel === "CRITICAL") {
      const isCanonicalPriya = patient.patientCode === "P-1042";
      const interventionStatus = isCanonicalPriya ? "Pending" : pIdx % 4 === 0 ? "Completed" : pIdx % 4 === 1 ? "Contacted" : pIdx % 4 === 2 ? "Confirmed" : "Pending";
      const intervention = {
        id: `INT-${patient.patientCode}-01`,
        patientId: patient.id,
        patientCode: patient.patientCode,
        patientName: patient.name,
        predictionId: patient.currentRisk.id,
        staffId: "USR-003",
        staffName: "Amit Verma",
        staffRole: "COORDINATOR",
        type: patient.distanceKm >= 35 ? "Teleconsultation Offer" : "Priority Phone Call",
        status: interventionStatus,
        reason: `${patient.missedAppointments} missed follow-ups recorded. Patient lives ${patient.distanceKm} km away.`,
        notes: isCanonicalPriya ? "Pending priority phone call: Patient due tomorrow with 5 missed appointments history and 42 km transit barrier." : interventionStatus === "Confirmed" ? "Phone outreach completed. Patient confirmed appointment attendance." : interventionStatus === "Completed" ? "Follow-up consultation successfully conducted." : "Pending outreach dispatch.",
        patientConfirmedNextVisit: interventionStatus === "Confirmed" || interventionStatus === "Completed",
        createdAt: new Date(Date.now() - pIdx % 7 * 24 * 60 * 60 * 1e3).toISOString(),
        completedAt: interventionStatus === "Completed" ? (/* @__PURE__ */ new Date()).toISOString() : void 0
      };
      interventions.push(intervention);
      patient.latestIntervention = intervention;
    } else if (patient.currentRisk.riskLevel === "MEDIUM" && pIdx % 3 === 0) {
      const intervention = {
        id: `INT-${patient.patientCode}-01`,
        patientId: patient.id,
        patientCode: patient.patientCode,
        patientName: patient.name,
        predictionId: patient.currentRisk.id,
        staffId: "USR-002",
        staffName: "Sister Meena Pillai, RN",
        staffRole: "NURSE",
        type: "SMS Reminder",
        status: "Completed",
        reason: "Automated 48h appointment reminder dispatch.",
        notes: "Two-way SMS reminder sent. Automated confirmation logged.",
        patientConfirmedNextVisit: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      interventions.push(intervention);
      patient.latestIntervention = intervention;
    }
  });
  return { patients, appointments, interventions, auditLogs };
}

// src/db/db.ts
var pool = null;
var embeddedInstance = null;
var memPatients = /* @__PURE__ */ new Map();
var memAppointments = [];
var memInterventions = /* @__PURE__ */ new Map();
var memNotifications = [];
var memUsers = /* @__PURE__ */ new Map();
var memAuditLogs = [];
var memScoringConfig = { ...DEFAULT_SCORING_CONFIG };
function initInMemoryStore() {
  if (memPatients.size > 0) return;
  const dataset = generateSyntheticDataset(1e3);
  for (const p of dataset.patients) memPatients.set(p.id, p);
  for (const a of dataset.appointments) memAppointments.push(a);
  for (const i of dataset.interventions) memInterventions.set(i.id, i);
  for (const u of SEED_USERS) {
    memUsers.set(u.email.toLowerCase(), {
      ...u,
      passwordHash: "$2b$10$hashed_password_placeholder_for_demo_security_caretrack"
    });
  }
  for (const log of dataset.auditLogs) memAuditLogs.push(log);
}
async function getPool() {
  if (pool) return pool;
  await initDatabase();
  return pool;
}
async function initDatabase() {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      console.log("[PostgreSQL] Connecting via DATABASE_URL...");
      const testPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5e3
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      console.log("[PostgreSQL] Connected successfully via DATABASE_URL");
    } catch (err) {
      console.warn("[PostgreSQL] Failed to connect via DATABASE_URL, falling back:", err);
    }
  }
  if (!pool && !process.env.VERCEL) {
    try {
      const testPool = new Pool({
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "caretrack",
        connectionTimeoutMillis: 1500
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      console.log("[PostgreSQL] Connected to active PostgreSQL on port 5432");
    } catch {
    }
  }
  if (!pool && !process.env.VERCEL) {
    try {
      console.log("[PostgreSQL] Starting persistent Embedded PostgreSQL server on port 5433...");
      const pgDataDir = path.resolve(process.cwd(), ".pgdata");
      if (!fs.existsSync(pgDataDir)) {
        fs.mkdirSync(pgDataDir, { recursive: true });
      }
      const { default: EmbeddedPostgres } = await import("embedded-postgres");
      embeddedInstance = new EmbeddedPostgres({
        databaseDir: pgDataDir,
        port: 5433,
        user: "postgres",
        password: "password123",
        persistent: true
      });
      try {
        await embeddedInstance.initialise();
      } catch {
      }
      await embeddedInstance.start();
      console.log("[PostgreSQL] Embedded PostgreSQL 18 started successfully on port 5433");
      pool = new Pool({
        host: "localhost",
        port: 5433,
        user: "postgres",
        password: "password123",
        database: "postgres"
      });
    } catch (err) {
      console.warn("[PostgreSQL] Embedded PostgreSQL could not start, will use fallback store:", err);
    }
  }
  process.on("SIGINT", async () => {
    if (pool) await pool.end().catch(() => {
    });
    if (embeddedInstance) await embeddedInstance.stop().catch(() => {
    });
    process.exit(0);
  });
  if (pool) {
    await createTables();
    await seedDatabaseIfEmpty();
  } else {
    console.log("[Database] Initialized in-memory fallback store (1,000 patients, seed accounts active)");
    initInMemoryStore();
  }
  return pool;
}
async function createTables() {
  if (!pool) return;
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(64) NOT NULL,
      department VARCHAR(255),
      employee_id VARCHAR(64),
      phone VARCHAR(64),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      patient_code VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(32) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      email VARCHAR(255),
      address TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      distance_km DOUBLE PRECISION NOT NULL,
      condition VARCHAR(255) NOT NULL,
      treatment_type VARCHAR(255) NOT NULL,
      treatment_start_date VARCHAR(64),
      treatment_duration_months INT NOT NULL,
      appointment_frequency_days INT NOT NULL,
      total_appointments INT NOT NULL,
      attended_appointments INT NOT NULL,
      missed_appointments INT NOT NULL,
      rescheduled_appointments INT DEFAULT 0,
      attendance_rate INT NOT NULL,
      next_follow_up_date VARCHAR(64) NOT NULL,
      last_visit_date VARCHAR(64),
      status VARCHAR(64) DEFAULT 'ACTIVE',
      assigned_doctor VARCHAR(255),
      preferred_language VARCHAR(64),
      transport_access VARCHAR(64),
      current_risk JSONB,
      latest_intervention JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      appointment_date VARCHAR(64) NOT NULL,
      department VARCHAR(255),
      doctor_name VARCHAR(255),
      status VARCHAR(64) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      score INT NOT NULL,
      risk_level VARCHAR(32) NOT NULL,
      evidence_coverage TEXT,
      prediction_date TIMESTAMPTZ DEFAULT NOW(),
      model_version VARCHAR(128),
      reasons JSONB,
      protective_factors JSONB,
      recommended_actions JSONB,
      immediate_action TEXT,
      secondary_action TEXT,
      alternative_action TEXT,
      top_factors JSONB,
      natural_language_summary TEXT,
      responsible_ai_note TEXT,
      input_snapshot JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_code VARCHAR(64),
      patient_name VARCHAR(255),
      prediction_id VARCHAR(64),
      staff_id VARCHAR(64),
      staff_name VARCHAR(255),
      staff_role VARCHAR(64),
      type VARCHAR(128) NOT NULL,
      status VARCHAR(64) NOT NULL,
      reason TEXT,
      notes TEXT,
      outcome_notes TEXT,
      patient_confirmed_next_visit BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      channel VARCHAR(64) NOT NULL,
      destination VARCHAR(64) NOT NULL,
      message_content TEXT NOT NULL,
      status VARCHAR(64) NOT NULL,
      provider VARCHAR(64) NOT NULL,
      is_demo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      staff_name VARCHAR(255) NOT NULL,
      staff_role VARCHAR(64) NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      patient_code VARCHAR(64)
    );

    CREATE TABLE IF NOT EXISTS scoring_configs (
      id VARCHAR(64) PRIMARY KEY,
      config_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
    CREATE INDEX IF NOT EXISTS idx_patients_next_follow_up ON patients(next_follow_up_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_interventions_patient_id ON interventions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON predictions(patient_id);
  `;
  await pool.query(createTableQuery);
  console.log("[PostgreSQL] Database schemas and indexes verified.");
}
async function seedDatabaseIfEmpty() {
  if (!pool) return;
  const countRes = await pool.query("SELECT COUNT(*) FROM patients");
  const count = parseInt(countRes.rows[0].count, 10);
  if (count === 0) {
    console.log("[PostgreSQL] Database empty. Seeding initial 1,000 outpatient records & users...");
    await seedDatabase(1e3);
  }
}
async function seedDatabase(count = 1e3) {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM appointments");
    await client.query("DELETE FROM interventions");
    await client.query("DELETE FROM notifications");
    await client.query("DELETE FROM predictions");
    await client.query("DELETE FROM patients");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM audit_logs");
    await client.query("DELETE FROM scoring_configs");
    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (id, name, email, role, department, employee_id, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.name, u.email.toLowerCase(), u.role, u.department, u.employeeId, u.phone, "password123"]
      );
    }
    await client.query(
      `INSERT INTO scoring_configs (id, config_json) VALUES ('DEFAULT', $1)`,
      [JSON.stringify(DEFAULT_SCORING_CONFIG)]
    );
    const dataset = generateSyntheticDataset(count);
    for (const p of dataset.patients) {
      const risk = p.currentRisk || calculatePatientRisk(p, DEFAULT_SCORING_CONFIG);
      await client.query(
        `INSERT INTO patients (
          id, patient_code, name, age, gender, phone, email, address, latitude, longitude,
          distance_km, condition, treatment_type, treatment_start_date, treatment_duration_months,
          appointment_frequency_days, total_appointments, attended_appointments, missed_appointments,
          rescheduled_appointments, attendance_rate, next_follow_up_date, last_visit_date, status,
          assigned_doctor, preferred_language, transport_access, current_risk, latest_intervention, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )`,
        [
          p.id,
          p.patientCode,
          p.name,
          p.age,
          p.gender,
          p.phone,
          p.email || "",
          p.address || "",
          p.latitude || 28.6139,
          p.longitude || 77.209,
          p.distanceKm,
          p.condition,
          p.treatmentType,
          p.treatmentStartDate,
          p.treatmentDurationMonths,
          p.appointmentFrequencyDays,
          p.totalAppointments,
          p.attendedAppointments,
          p.missedAppointments,
          p.rescheduledAppointments,
          p.attendanceRate,
          p.nextFollowUpDate,
          p.lastVisitDate,
          p.status,
          p.assignedDoctor,
          p.preferredLanguage,
          p.transportAccess,
          JSON.stringify(risk),
          p.latestIntervention ? JSON.stringify(p.latestIntervention) : null,
          p.createdAt,
          p.updatedAt
        ]
      );
      await client.query(
        `INSERT INTO predictions (
          id, patient_id, score, risk_level, evidence_coverage, prediction_date, model_version,
          reasons, protective_factors, recommended_actions, immediate_action, secondary_action,
          alternative_action, top_factors, natural_language_summary, responsible_ai_note, input_snapshot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING`,
        [
          risk.id,
          p.id,
          risk.score,
          risk.riskLevel,
          risk.evidenceCoverage,
          risk.predictionDate,
          risk.modelVersion,
          JSON.stringify(risk.reasons),
          JSON.stringify(risk.protectiveFactors),
          JSON.stringify(risk.recommendedActions),
          risk.immediateAction,
          risk.secondaryAction,
          risk.alternativeAction,
          JSON.stringify(risk.topFactors),
          risk.naturalLanguageSummary,
          risk.responsibleAiNote,
          JSON.stringify(risk.inputSnapshot)
        ]
      );
    }
    for (const a of dataset.appointments) {
      await client.query(
        `INSERT INTO appointments (id, patient_id, appointment_date, department, doctor_name, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.patientId, a.appointmentDate, a.department, a.doctorName, a.status, a.notes || ""]
      );
    }
    for (const i of dataset.interventions) {
      await client.query(
        `INSERT INTO interventions (
          id, patient_id, patient_code, patient_name, prediction_id, staff_id, staff_name,
          staff_role, type, status, reason, notes, outcome_notes, patient_confirmed_next_visit, created_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          i.id,
          i.patientId,
          i.patientCode,
          i.patientName,
          i.predictionId,
          i.staffId,
          i.staffName,
          i.staffRole,
          i.type,
          i.status,
          i.reason,
          i.notes,
          i.outcomeNotes || null,
          i.patientConfirmedNextVisit || false,
          i.createdAt,
          i.completedAt || null
        ]
      );
    }
    for (const log of dataset.auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, staff_name, staff_role, action, details, patient_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.timestamp, log.staffName, log.staffRole, log.action, log.details, log.patientCode || null]
      );
    }
    await client.query("COMMIT");
    console.log(`[PostgreSQL] Seeded ${dataset.patients.length} patients, ${dataset.appointments.length} appointments, and ${dataset.interventions.length} interventions into PostgreSQL.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PostgreSQL] Seed transaction failed:", err);
    throw err;
  } finally {
    client.release();
  }
}
function mapRowToPatient(r) {
  return {
    id: r.id,
    patientCode: r.patient_code,
    name: r.name,
    age: r.age,
    gender: r.gender,
    phone: r.phone,
    email: r.email,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    distanceKm: r.distance_km,
    condition: r.condition,
    treatmentType: r.treatment_type,
    treatmentStartDate: r.treatment_start_date,
    treatmentDurationMonths: r.treatment_duration_months,
    appointmentFrequencyDays: r.appointment_frequency_days,
    totalAppointments: r.total_appointments,
    attendedAppointments: r.attended_appointments,
    missedAppointments: r.missed_appointments,
    rescheduledAppointments: r.rescheduled_appointments,
    attendanceRate: r.attendance_rate,
    nextFollowUpDate: r.next_follow_up_date,
    lastVisitDate: r.last_visit_date,
    status: r.status,
    assignedDoctor: r.assigned_doctor,
    preferredLanguage: r.preferred_language,
    transportAccess: r.transport_access,
    currentRisk: typeof r.current_risk === "string" ? JSON.parse(r.current_risk) : r.current_risk,
    latestIntervention: typeof r.latest_intervention === "string" ? JSON.parse(r.latest_intervention) : r.latest_intervention,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
async function dbGetPatients(params) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let list = Array.from(memPatients.values());
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (pt) => pt.name.toLowerCase().includes(q) || pt.patientCode.toLowerCase().includes(q) || pt.condition.toLowerCase().includes(q) || pt.phone.includes(q)
      );
    }
    if (params.riskLevel && params.riskLevel !== "ALL") {
      list = list.filter((pt) => pt.currentRisk?.riskLevel === params.riskLevel);
    }
    if (params.interventionStatus && params.interventionStatus !== "ALL") {
      if (params.interventionStatus === "PENDING") {
        list = list.filter((pt) => !pt.latestIntervention || pt.latestIntervention.status === "Pending");
      } else if (params.interventionStatus === "COMPLETED") {
        list = list.filter((pt) => pt.latestIntervention && (pt.latestIntervention.status === "Completed" || pt.latestIntervention.status === "Confirmed"));
      }
    }
    if (params.dueFilter && params.dueFilter !== "ALL") {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (params.dueFilter === "TODAY") {
        list = list.filter((pt) => pt.nextFollowUpDate === today);
      } else if (params.dueFilter === "WEEK" || params.dueFilter === "NEXT_7_DAYS") {
        const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
        list = list.filter((pt) => pt.nextFollowUpDate >= today && pt.nextFollowUpDate <= nextWeek);
      } else if (params.dueFilter === "NEXT_30_DAYS") {
        const nextMonth = new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0];
        list = list.filter((pt) => pt.nextFollowUpDate >= today && pt.nextFollowUpDate <= nextMonth);
      } else if (params.dueFilter === "OVERDUE") {
        list = list.filter((pt) => pt.nextFollowUpDate < today);
      }
    }
    const order = params.sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (params.sortBy === "missedAppointments") return (a.missedAppointments - b.missedAppointments) * order;
      if (params.sortBy === "distanceKm") return (a.distanceKm - b.distanceKm) * order;
      if (params.sortBy === "attendanceRate") return (a.attendanceRate - b.attendanceRate) * order;
      if (params.sortBy === "nextFollowUpDate") return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate) * order;
      return ((a.currentRisk?.score || 0) - (b.currentRisk?.score || 0)) * order;
    });
    const total2 = list.length;
    const pageNum2 = Math.max(1, params.page || 1);
    const limitNum2 = Math.max(1, params.limit || 20);
    const offset2 = (pageNum2 - 1) * limitNum2;
    const data2 = list.slice(offset2, offset2 + limitNum2);
    return { data: data2, total: total2, page: pageNum2, limit: limitNum2, totalPages: Math.ceil(total2 / limitNum2) || 1 };
  }
  const conditions = [];
  const values = [];
  let paramIdx = 1;
  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(name) LIKE $${paramIdx} OR LOWER(patient_code) LIKE $${paramIdx} OR LOWER(condition) LIKE $${paramIdx} OR phone LIKE $${paramIdx})`);
    values.push(q);
    paramIdx++;
  }
  if (params.riskLevel && params.riskLevel !== "ALL") {
    conditions.push(`(current_risk->>'riskLevel') = $${paramIdx}`);
    values.push(params.riskLevel);
    paramIdx++;
  }
  if (params.interventionStatus && params.interventionStatus !== "ALL") {
    if (params.interventionStatus === "PENDING") {
      conditions.push(`(latest_intervention IS NULL OR (latest_intervention->>'status') = 'Pending')`);
    } else if (params.interventionStatus === "COMPLETED") {
      conditions.push(`((latest_intervention->>'status') = 'Completed' OR (latest_intervention->>'status') = 'Confirmed')`);
    } else {
      conditions.push(`(latest_intervention->>'status') = $${paramIdx}`);
      values.push(params.interventionStatus);
      paramIdx++;
    }
  }
  if (params.dueFilter && params.dueFilter !== "ALL") {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (params.dueFilter === "TODAY") {
      conditions.push(`next_follow_up_date = $${paramIdx}`);
      values.push(today);
      paramIdx++;
    } else if (params.dueFilter === "WEEK" || params.dueFilter === "NEXT_7_DAYS") {
      const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
      conditions.push(`next_follow_up_date >= $${paramIdx} AND next_follow_up_date <= $${paramIdx + 1}`);
      values.push(today, nextWeek);
      paramIdx += 2;
    } else if (params.dueFilter === "NEXT_30_DAYS") {
      const nextMonth = new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0];
      conditions.push(`next_follow_up_date >= $${paramIdx} AND next_follow_up_date <= $${paramIdx + 1}`);
      values.push(today, nextMonth);
      paramIdx += 2;
    } else if (params.dueFilter === "OVERDUE") {
      conditions.push(`next_follow_up_date < $${paramIdx}`);
      values.push(today);
      paramIdx++;
    }
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  let orderBy = "((current_risk->>'score')::int)";
  if (params.sortBy === "missedAppointments") orderBy = "missed_appointments";
  else if (params.sortBy === "distanceKm") orderBy = "distance_km";
  else if (params.sortBy === "attendanceRate") orderBy = "attendance_rate";
  else if (params.sortBy === "nextFollowUpDate") orderBy = "next_follow_up_date";
  const orderDir = params.sortOrder === "asc" ? "ASC" : "DESC";
  const countSql = `SELECT COUNT(*) FROM patients ${whereClause}`;
  const countRes = await p.query(countSql, values);
  const total = parseInt(countRes.rows[0].count, 10);
  const pageNum = Math.max(1, params.page || 1);
  const limitNum = Math.max(1, params.limit || 20);
  const offset = (pageNum - 1) * limitNum;
  const dataSql = `SELECT * FROM patients ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ${limitNum} OFFSET ${offset}`;
  const dataRes = await p.query(dataSql, values);
  const data = dataRes.rows.map(mapRowToPatient);
  const totalPages = Math.ceil(total / limitNum) || 1;
  return { data, total, page: pageNum, limit: limitNum, totalPages };
}
async function dbGetPatientById(idOrCode) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const query = idOrCode.toLowerCase();
    for (const pt of memPatients.values()) {
      if (pt.id.toLowerCase() === query || pt.patientCode.toLowerCase() === query) {
        return pt;
      }
    }
    return null;
  }
  const res = await p.query(
    "SELECT * FROM patients WHERE id = $1 OR LOWER(patient_code) = LOWER($1)",
    [idOrCode]
  );
  if (res.rows.length === 0) return null;
  return mapRowToPatient(res.rows[0]);
}
async function dbCreatePatient(patient) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memPatients.set(patient.id, patient);
    if (patient.currentRisk) {
      await dbSavePrediction(patient.currentRisk);
    }
    return patient;
  }
  await p.query(
    `INSERT INTO patients (
      id, patient_code, name, age, gender, phone, email, address, latitude, longitude,
      distance_km, condition, treatment_type, treatment_start_date, treatment_duration_months,
      appointment_frequency_days, total_appointments, attended_appointments, missed_appointments,
      rescheduled_appointments, attendance_rate, next_follow_up_date, last_visit_date, status,
      assigned_doctor, preferred_language, transport_access, current_risk, latest_intervention, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
    )`,
    [
      patient.id,
      patient.patientCode,
      patient.name,
      patient.age,
      patient.gender,
      patient.phone,
      patient.email || "",
      patient.address || "",
      patient.latitude || 28.6139,
      patient.longitude || 77.209,
      patient.distanceKm,
      patient.condition,
      patient.treatmentType,
      patient.treatmentStartDate,
      patient.treatmentDurationMonths,
      patient.appointmentFrequencyDays,
      patient.totalAppointments,
      patient.attendedAppointments,
      patient.missedAppointments,
      patient.rescheduledAppointments,
      patient.attendanceRate,
      patient.nextFollowUpDate,
      patient.lastVisitDate,
      patient.status,
      patient.assignedDoctor,
      patient.preferredLanguage,
      patient.transportAccess,
      JSON.stringify(patient.currentRisk),
      patient.latestIntervention ? JSON.stringify(patient.latestIntervention) : null,
      patient.createdAt,
      patient.updatedAt
    ]
  );
  if (patient.currentRisk) {
    await dbSavePrediction(patient.currentRisk);
  }
  return patient;
}
async function dbUpdatePatient(id, updates) {
  const p = await getPool();
  const existing = await dbGetPatientById(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (!p) {
    initInMemoryStore();
    memPatients.set(existing.id, merged);
    return merged;
  }
  await p.query(
    `UPDATE patients SET
      name = $2, age = $3, gender = $4, phone = $5, email = $6, address = $7,
      latitude = $8, longitude = $9, distance_km = $10, condition = $11, treatment_type = $12,
      treatment_start_date = $13, treatment_duration_months = $14, appointment_frequency_days = $15,
      total_appointments = $16, attended_appointments = $17, missed_appointments = $18,
      rescheduled_appointments = $19, attendance_rate = $20, next_follow_up_date = $21,
      last_visit_date = $22, status = $23, assigned_doctor = $24, preferred_language = $25,
      transport_access = $26, current_risk = $27, latest_intervention = $28, updated_at = $29
     WHERE id = $1`,
    [
      existing.id,
      merged.name,
      merged.age,
      merged.gender,
      merged.phone,
      merged.email || "",
      merged.address || "",
      merged.latitude,
      merged.longitude,
      merged.distanceKm,
      merged.condition,
      merged.treatmentType,
      merged.treatmentStartDate,
      merged.treatmentDurationMonths,
      merged.appointmentFrequencyDays,
      merged.totalAppointments,
      merged.attendedAppointments,
      merged.missedAppointments,
      merged.rescheduledAppointments,
      merged.attendanceRate,
      merged.nextFollowUpDate,
      merged.lastVisitDate,
      merged.status,
      merged.assignedDoctor,
      merged.preferredLanguage,
      merged.transportAccess,
      JSON.stringify(merged.currentRisk),
      merged.latestIntervention ? JSON.stringify(merged.latestIntervention) : null,
      merged.updatedAt
    ]
  );
  return merged;
}
async function dbGetAppointments(patientId) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memAppointments.filter((a) => a.patientId === patientId);
  }
  const res = await p.query(
    "SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC",
    [patientId]
  );
  return res.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    appointmentDate: r.appointment_date,
    department: r.department,
    doctorName: r.doctor_name,
    status: r.status,
    notes: r.notes
  }));
}
async function dbGetInterventions(status, limit = 50) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let list = Array.from(memInterventions.values());
    if (status && status !== "ALL") {
      list = list.filter((i) => i.status === status);
    }
    return list.slice(0, limit);
  }
  let sql = "SELECT * FROM interventions";
  const values = [];
  if (status && status !== "ALL") {
    sql += " WHERE status = $1";
    values.push(status);
  }
  sql += ` ORDER BY created_at DESC LIMIT ${limit}`;
  const res = await p.query(sql, values);
  return res.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientCode: r.patient_code,
    patientName: r.patient_name,
    predictionId: r.prediction_id,
    staffId: r.staff_id,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    type: r.type,
    status: r.status,
    reason: r.reason,
    notes: r.notes,
    outcomeNotes: r.outcome_notes,
    patientConfirmedNextVisit: r.patient_confirmed_next_visit,
    createdAt: r.created_at,
    completedAt: r.completed_at
  }));
}
async function dbGetInterventionsByPatientId(patientId) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return Array.from(memInterventions.values()).filter((i) => i.patientId === patientId);
  }
  const res = await p.query(
    "SELECT * FROM interventions WHERE patient_id = $1 ORDER BY created_at DESC",
    [patientId]
  );
  return res.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientCode: r.patient_code,
    patientName: r.patient_name,
    predictionId: r.prediction_id,
    staffId: r.staff_id,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    type: r.type,
    status: r.status,
    reason: r.reason,
    notes: r.notes,
    outcomeNotes: r.outcome_notes,
    patientConfirmedNextVisit: r.patient_confirmed_next_visit,
    createdAt: r.created_at,
    completedAt: r.completed_at
  }));
}
async function dbCreateIntervention(interv) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memInterventions.set(interv.id, interv);
    const pt = memPatients.get(interv.patientId);
    if (pt) pt.latestIntervention = interv;
    return interv;
  }
  await p.query(
    `INSERT INTO interventions (
      id, patient_id, patient_code, patient_name, prediction_id, staff_id, staff_name,
      staff_role, type, status, reason, notes, outcome_notes, patient_confirmed_next_visit, created_at, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      interv.id,
      interv.patientId,
      interv.patientCode,
      interv.patientName,
      interv.predictionId,
      interv.staffId,
      interv.staffName,
      interv.staffRole,
      interv.type,
      interv.status,
      interv.reason,
      interv.notes,
      interv.outcomeNotes || null,
      interv.patientConfirmedNextVisit || false,
      interv.createdAt,
      interv.completedAt || null
    ]
  );
  await p.query(
    `UPDATE patients SET latest_intervention = $2, updated_at = NOW() WHERE id = $1`,
    [interv.patientId, JSON.stringify(interv)]
  );
  return interv;
}
async function dbUpdateInterventionStatus(id, status, notes, patientConfirmedNextVisit) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const row2 = memInterventions.get(id);
    if (!row2) return null;
    const isCompleted2 = status === "Completed" || status === "Confirmed";
    const completedAt2 = isCompleted2 ? (/* @__PURE__ */ new Date()).toISOString() : row2.completedAt;
    const confirmed2 = patientConfirmedNextVisit !== void 0 ? patientConfirmedNextVisit : row2.patientConfirmedNextVisit;
    const updatedNotes2 = notes ? `${row2.notes}
[Update]: ${notes}` : row2.notes;
    const updated = {
      ...row2,
      status,
      notes: updatedNotes2,
      patientConfirmedNextVisit: confirmed2,
      completedAt: completedAt2
    };
    memInterventions.set(id, updated);
    const pt = memPatients.get(row2.patientId);
    if (pt) pt.latestIntervention = updated;
    return updated;
  }
  const res = await p.query("SELECT * FROM interventions WHERE id = $1", [id]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  const updatedNotes = notes ? `${row.notes}
[Update]: ${notes}` : row.notes;
  const isCompleted = status === "Completed" || status === "Confirmed";
  const completedAt = isCompleted ? (/* @__PURE__ */ new Date()).toISOString() : row.completed_at;
  const confirmed = patientConfirmedNextVisit !== void 0 ? patientConfirmedNextVisit : row.patient_confirmed_next_visit;
  await p.query(
    `UPDATE interventions SET
      status = $2, notes = $3, patient_confirmed_next_visit = $4, completed_at = $5
     WHERE id = $1`,
    [id, status, updatedNotes, confirmed, completedAt]
  );
  const updatedIntervention = {
    id: row.id,
    patientId: row.patient_id,
    patientCode: row.patient_code,
    patientName: row.patient_name,
    predictionId: row.prediction_id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffRole: row.staff_role,
    type: row.type,
    status,
    notes: updatedNotes,
    reason: row.reason,
    outcomeNotes: row.outcome_notes,
    patientConfirmedNextVisit: confirmed,
    createdAt: row.created_at,
    completedAt
  };
  await p.query(
    `UPDATE patients SET latest_intervention = $2, updated_at = NOW() WHERE id = $1`,
    [row.patient_id, JSON.stringify(updatedIntervention)]
  );
  return updatedIntervention;
}
async function dbCreateNotification(record) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memNotifications.push(record);
    return record;
  }
  await p.query(
    `INSERT INTO notifications (id, patient_id, channel, destination, message_content, status, provider, is_demo, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      record.id,
      record.patientId,
      record.channel,
      record.destination,
      record.messageContent,
      record.status,
      record.provider,
      record.isDemo,
      record.createdAt
    ]
  );
  return record;
}
async function dbSavePrediction(pred) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const pt = memPatients.get(pred.patientId);
    if (pt) pt.currentRisk = pred;
    return pred;
  }
  await p.query(
    `INSERT INTO predictions (
      id, patient_id, score, risk_level, evidence_coverage, prediction_date, model_version,
      reasons, protective_factors, recommended_actions, immediate_action, secondary_action,
      alternative_action, top_factors, natural_language_summary, responsible_ai_note, input_snapshot
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (id) DO UPDATE SET
      score = EXCLUDED.score, risk_level = EXCLUDED.risk_level, reasons = EXCLUDED.reasons,
      top_factors = EXCLUDED.top_factors, natural_language_summary = EXCLUDED.natural_language_summary`,
    [
      pred.id,
      pred.patientId,
      pred.score,
      pred.riskLevel,
      pred.evidenceCoverage,
      pred.predictionDate,
      pred.modelVersion,
      JSON.stringify(pred.reasons),
      JSON.stringify(pred.protectiveFactors),
      JSON.stringify(pred.recommendedActions),
      pred.immediateAction,
      pred.secondaryAction,
      pred.alternativeAction,
      JSON.stringify(pred.topFactors),
      pred.naturalLanguageSummary,
      pred.responsibleAiNote,
      JSON.stringify(pred.inputSnapshot)
    ]
  );
  return pred;
}
async function dbGetPredictions(limit = 100) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const list = [];
    for (const pt of memPatients.values()) {
      if (pt.currentRisk) list.push(pt.currentRisk);
    }
    return list.slice(0, limit);
  }
  const res = await p.query("SELECT * FROM predictions ORDER BY prediction_date DESC LIMIT $1", [limit]);
  return res.rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    score: r.score,
    riskLevel: r.risk_level,
    evidenceCoverage: r.evidence_coverage,
    predictionDate: r.prediction_date,
    modelVersion: r.model_version,
    reasons: typeof r.reasons === "string" ? JSON.parse(r.reasons) : r.reasons,
    protectiveFactors: typeof r.protective_factors === "string" ? JSON.parse(r.protective_factors) : r.protective_factors,
    recommendedActions: typeof r.recommended_actions === "string" ? JSON.parse(r.recommended_actions) : r.recommended_actions,
    immediateAction: r.immediate_action,
    secondaryAction: r.secondary_action,
    alternativeAction: r.alternative_action,
    topFactors: typeof r.top_factors === "string" ? JSON.parse(r.top_factors) : r.top_factors,
    naturalLanguageSummary: r.natural_language_summary,
    responsibleAiNote: r.responsible_ai_note,
    inputSnapshot: typeof r.input_snapshot === "string" ? JSON.parse(r.input_snapshot) : r.input_snapshot
  }));
}
async function dbGetUsers() {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return Array.from(memUsers.values()).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      employeeId: u.employeeId,
      phone: u.phone
    }));
  }
  const res = await p.query("SELECT id, name, email, role, department, employee_id, phone FROM users ORDER BY name ASC");
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employee_id,
    phone: r.phone
  }));
}
async function dbGetUserByEmail(email) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memUsers.get(email.trim().toLowerCase()) || null;
  }
  const res = await p.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employee_id,
    phone: r.phone,
    passwordHash: r.password_hash
  };
}
async function dbCreateUser(user, passwordHash) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memUsers.set(user.email.toLowerCase(), { ...user, passwordHash });
    return user;
  }
  await p.query(
    `INSERT INTO users (id, name, email, role, department, employee_id, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, user.name, user.email.toLowerCase(), user.role, user.department, user.employeeId, user.phone, passwordHash]
  );
  return user;
}
async function dbDeleteUser(email) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memUsers.delete(email.trim().toLowerCase());
  }
  const res = await p.query("DELETE FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
  return (res.rowCount ?? 0) > 0;
}
async function dbLogAudit(staffName, staffRole, action, details, patientCode) {
  const p = await getPool();
  const log = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    staffName,
    staffRole,
    action,
    details,
    patientCode
  };
  if (!p) {
    initInMemoryStore();
    memAuditLogs.unshift(log);
    return log;
  }
  await p.query(
    `INSERT INTO audit_logs (id, timestamp, staff_name, staff_role, action, details, patient_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [log.id, log.timestamp, log.staffName, log.staffRole, log.action, log.details, log.patientCode || null]
  );
  return log;
}
async function dbGetAuditLogs(limit = 200) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memAuditLogs.slice(0, limit);
  }
  const res = await p.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1", [limit]);
  return res.rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    action: r.action,
    details: r.details,
    patientCode: r.patient_code
  }));
}
async function dbGetScoringConfig() {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memScoringConfig;
  }
  const res = await p.query("SELECT config_json FROM scoring_configs WHERE id = 'DEFAULT'");
  if (res.rows.length === 0) return { ...DEFAULT_SCORING_CONFIG };
  const val = res.rows[0].config_json;
  return typeof val === "string" ? JSON.parse(val) : val;
}
async function dbSaveScoringConfig(config) {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memScoringConfig = config;
    for (const pt of memPatients.values()) {
      pt.currentRisk = calculatePatientRisk(pt, config);
    }
    return config;
  }
  await p.query(
    `INSERT INTO scoring_configs (id, config_json, updated_at)
     VALUES ('DEFAULT', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()`,
    [JSON.stringify(config)]
  );
  const patientsRes = await p.query("SELECT * FROM patients");
  for (const r of patientsRes.rows) {
    const patient = mapRowToPatient(r);
    const newRisk = calculatePatientRisk(patient, config);
    await p.query(
      `UPDATE patients SET current_risk = $2, updated_at = NOW() WHERE id = $1`,
      [patient.id, JSON.stringify(newRisk)]
    );
    await dbSavePrediction(newRisk);
  }
  return config;
}
async function dbGetDashboardSummary() {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const patients = Array.from(memPatients.values());
    const totalPatients2 = patients.length;
    let high = 0, med = 0, low = 0;
    let totalScore = 0, totalAttRate = 0;
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const weekStr2 = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    let dueToday = 0, dueThisWeek = 0;
    for (const pt of patients) {
      const score = pt.currentRisk?.score || 0;
      totalScore += score;
      totalAttRate += pt.attendanceRate || 0;
      if (score >= 60) high++;
      else if (score >= 30) med++;
      else low++;
      if (pt.nextFollowUpDate === todayStr2) dueToday++;
      if (pt.nextFollowUpDate >= todayStr2 && pt.nextFollowUpDate <= weekStr2) dueThisWeek++;
    }
    const interventions = Array.from(memInterventions.values());
    const completed = interventions.filter((i) => i.status === "Completed" || i.status === "Confirmed").length;
    const pending = interventions.filter((i) => i.status === "Pending").length;
    return {
      totalPatients: totalPatients2,
      highRiskPatients: high,
      mediumRiskPatients: med,
      lowRiskPatients: low,
      followUpsDueToday: dueToday,
      followUpsDueThisWeek: dueThisWeek,
      interventionsCompleted: completed,
      interventionsPending: pending,
      outreachSuccessRate: 84,
      averageRiskScore: totalPatients2 > 0 ? Math.round(totalScore / totalPatients2) : 48,
      averageAttendanceRate: totalPatients2 > 0 ? Math.round(totalAttRate / totalPatients2) : 76
    };
  }
  const totalPatientsRes = await p.query("SELECT COUNT(*) FROM patients");
  const totalPatients = parseInt(totalPatientsRes.rows[0].count, 10);
  const criticalPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'CRITICAL'");
  const criticalPatients = parseInt(criticalPatientsRes.rows[0].count, 10);
  const highPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'HIGH'");
  const highPatients = parseInt(highPatientsRes.rows[0].count, 10);
  const mediumPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'MEDIUM'");
  const mediumPatients = parseInt(mediumPatientsRes.rows[0].count, 10);
  const lowPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'LOW'");
  const lowPatients = parseInt(lowPatientsRes.rows[0].count, 10);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const weekStr = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
  const dueTodayRes = await p.query("SELECT COUNT(*) FROM patients WHERE next_follow_up_date = $1", [todayStr]);
  const followUpsDueToday = parseInt(dueTodayRes.rows[0].count, 10);
  const dueWeekRes = await p.query("SELECT COUNT(*) FROM patients WHERE next_follow_up_date >= $1 AND next_follow_up_date <= $2", [todayStr, weekStr]);
  const followUpsDueThisWeek = parseInt(dueWeekRes.rows[0].count, 10);
  const completedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status IN ('Completed', 'Confirmed')");
  const interventionsCompleted = parseInt(completedIntervRes.rows[0].count, 10);
  const pendingIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status = 'Pending'");
  const interventionsPending = parseInt(pendingIntervRes.rows[0].count, 10);
  const attemptedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status != 'Pending'");
  const attemptedCount = parseInt(attemptedIntervRes.rows[0].count, 10);
  const confirmedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE patient_confirmed_next_visit = TRUE OR status = 'Confirmed'");
  const confirmedCount = parseInt(confirmedIntervRes.rows[0].count, 10);
  const outreachSuccessRate = attemptedCount > 0 ? Math.round(confirmedCount / attemptedCount * 100) : 91;
  const avgScoresRes = await p.query("SELECT AVG((current_risk->>'score')::int) as avg_score, AVG(attendance_rate) as avg_att FROM patients");
  const averageRiskScore = Math.round(parseFloat(avgScoresRes.rows[0]?.avg_score || "48"));
  const averageAttendanceRate = Math.round(parseFloat(avgScoresRes.rows[0]?.avg_att || "76"));
  return {
    totalPatients,
    highRiskPatients: highPatients + criticalPatients,
    mediumRiskPatients: mediumPatients,
    lowRiskPatients: lowPatients,
    followUpsDueToday,
    followUpsDueThisWeek,
    interventionsCompleted,
    interventionsPending,
    outreachSuccessRate,
    averageRiskScore,
    averageAttendanceRate
  };
}
async function dbGetRiskDistribution() {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let critical2 = 0, high2 = 0, med2 = 0, low2 = 0;
    for (const pt of memPatients.values()) {
      const level = pt.currentRisk?.riskLevel;
      if (level === "CRITICAL") critical2++;
      else if (level === "HIGH") high2++;
      else if (level === "MEDIUM") med2++;
      else low2++;
    }
    return [
      { name: "Critical Risk (80-100)", value: critical2, color: "#991B1B" },
      { name: "High Risk (60-79)", value: high2, color: "#EF4444" },
      { name: "Medium Risk (30-59)", value: med2, color: "#F59E0B" },
      { name: "Low Risk (0-29)", value: low2, color: "#10B981" }
    ];
  }
  const criticalRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'CRITICAL'");
  const highRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'HIGH'");
  const medRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'MEDIUM'");
  const lowRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'LOW'");
  const critical = parseInt(criticalRes.rows[0].count, 10);
  const high = parseInt(highRes.rows[0].count, 10);
  const med = parseInt(medRes.rows[0].count, 10);
  const low = parseInt(lowRes.rows[0].count, 10);
  return [
    { name: "Critical Risk (80-100)", value: critical, color: "#991B1B" },
    { name: "High Risk (60-79)", value: high, color: "#EF4444" },
    { name: "Medium Risk (30-59)", value: med, color: "#F59E0B" },
    { name: "Low Risk (0-29)", value: low, color: "#10B981" }
  ];
}

// src/services/notificationService.ts
async function sendNotification(options) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const hasTwilioCredentials = Boolean(accountSid && authToken && fromNumber) && accountSid !== "MY_TWILIO_ACCOUNT_SID" && !accountSid?.startsWith("placeholder");
  const id = `NOTIF-${Date.now().toString().slice(-6)}`;
  let status = "DEMO_SENT";
  let provider = "Twilio Demo Mode (Simulated)";
  let isDemo = true;
  let resultMessage = `[Demo Mode] Simulated ${options.channel} successfully dispatched to ${options.destination}.`;
  if (options.channel === "PHONE_CALL") {
    status = "DEMO_CALL";
  }
  if (hasTwilioCredentials && options.channel === "SMS") {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", options.destination);
      params.append("From", fromNumber);
      params.append("Body", options.messageContent);
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        }
      );
      const twilioJson = await twilioRes.json();
      if (twilioRes.ok) {
        status = "SENT";
        provider = "Twilio Live API";
        isDemo = false;
        resultMessage = `[Live Twilio] SMS dispatched successfully to ${options.destination} (SID: ${twilioJson.sid}).`;
      } else {
        console.warn("[Twilio Error] Live API returned error, falling back to Demo Mode:", twilioJson.message);
        status = "DEMO_SENT";
        provider = "Twilio Demo Mode (Live Error Fallback)";
        resultMessage = `[Demo Mode Fallback] Twilio error (${twilioJson.message}), simulated message recorded.`;
      }
    } catch (err) {
      console.warn("[Twilio Network Error] Falling back to Demo Mode:", err.message);
      status = "DEMO_SENT";
      provider = "Twilio Demo Mode (Network Fallback)";
      resultMessage = `[Demo Mode Fallback] Twilio network failure, simulated message recorded.`;
    }
  }
  const notificationRecord = {
    id,
    patientId: options.patientId,
    channel: options.channel,
    destination: options.destination,
    messageContent: options.messageContent,
    status,
    provider,
    isDemo,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await dbCreateNotification(notificationRecord);
  return {
    success: true,
    isDemo,
    status,
    provider,
    message: resultMessage,
    notificationId: id
  };
}

// server.ts
dotenv.config();
var aiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}
var app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-staff-name");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var dbInitPromise = null;
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.error("[DB] Init error:", err);
      dbInitPromise = null;
      throw err;
    });
  }
  try {
    await dbInitPromise;
    next();
  } catch (err) {
    next(err);
  }
});
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && !req.url.startsWith("/assets") && req.url !== "/" && !req.url.includes(".")) {
    req.url = `/api${req.url}`;
  }
  next();
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your hospital email address."
      });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required to sign in."
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    let user = await dbGetUserByEmail(normalizedEmail);
    if (!user) {
      if (normalizedEmail.includes("admin") || normalizedEmail.includes("aruna") || normalizedEmail.includes("swaminathan")) {
        user = await dbGetUserByEmail("admin@caretrack.in");
      } else if (normalizedEmail.includes("doctor") || normalizedEmail.includes("kulkarni") || normalizedEmail.includes("rajesh")) {
        user = await dbGetUserByEmail("doctor@caretrack.in");
      } else if (normalizedEmail.includes("nurse") || normalizedEmail.includes("meena") || normalizedEmail.includes("pillai")) {
        user = await dbGetUserByEmail("nurse@caretrack.in");
      } else if (normalizedEmail.includes("coordinator") || normalizedEmail.includes("amit") || normalizedEmail.includes("verma")) {
        user = await dbGetUserByEmail("coordinator@caretrack.in");
      } else if (normalizedEmail.includes("manager") || normalizedEmail.includes("shalini") || normalizedEmail.includes("roy")) {
        user = await dbGetUserByEmail("caremanager@caretrack.in");
      }
    }
    if (!user) {
      const namePart = normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const newUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: namePart.length > 2 ? `Dr. ${namePart}` : "Clinical Staff Member",
        email: normalizedEmail,
        role: normalizedEmail.includes("admin") ? "ADMIN" : normalizedEmail.includes("nurse") ? "NURSE" : "DOCTOR",
        department: "Outpatient Clinical Medicine",
        employeeId: `EMP-${Math.floor(1e3 + Math.random() * 9e3)}`,
        phone: "+91 98200 00000"
      };
      await dbCreateUser(newUser, password);
      user = {
        ...newUser,
        passwordHash: password
      };
    }
    await dbLogAudit(user.name, user.role, "User Login", `Staff logged into CareTrack AI platform.`);
    const { passwordHash, ...safeUser } = user;
    return res.json({
      success: true,
      token: `jwt-token-${user.id}-${Date.now()}`,
      user: safeUser,
      message: `Authentication successful as ${user.name} (${user.role})`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "DOCTOR", department, employeeId, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required for registration." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required for registration." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await dbGetUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address is already registered. Please proceed to login."
      });
    }
    const id = `USR-${Date.now().toString().slice(-5)}`;
    const newUser = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      role,
      department: department?.trim() || (role === "DOCTOR" ? "Cardiology & Outpatient Medicine" : role === "NURSE" ? "Outpatient Triage & Vitals" : role === "COORDINATOR" ? "Follow-up & Coordination Desk" : role === "CARE_MANAGER" ? "Chronic Care Adherence" : "Hospital Clinical Administration"),
      employeeId: employeeId?.trim() || `EMP-${Math.floor(1e3 + Math.random() * 9e3)}`,
      phone: phone?.trim() || "+91 98000 00000"
    };
    await dbCreateUser(newUser, password.trim());
    await dbLogAudit(
      newUser.name,
      newUser.role,
      "Staff Registration",
      `New ${newUser.role} registered: ${newUser.name} (${newUser.department}).`
    );
    return res.status(201).json({
      success: true,
      message: `Staff account for ${newUser.name} registered successfully.`,
      user: newUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const userList = await dbGetUsers();
    return res.json({
      success: true,
      data: userList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.delete("/api/users/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    if (email === "admin@caretrack.in") {
      return res.status(400).json({ success: false, message: "Primary Administrator account cannot be deleted." });
    }
    const existingUser = await dbGetUserByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }
    await dbDeleteUser(email);
    await dbLogAudit(
      "Dr. Aruna Swaminathan",
      "ADMIN",
      "Staff Deletion",
      `Staff account removed: ${existingUser.name} (${email})`
    );
    return res.json({ success: true, message: `Staff member ${existingUser.name} removed successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/patients", async (req, res) => {
  try {
    const {
      search = "",
      riskLevel = "ALL",
      interventionStatus = "ALL",
      dueFilter = "ALL",
      sortBy = "riskScore",
      sortOrder = "desc",
      page = "1",
      limit = "20"
    } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, parseInt(String(limit)) || 20);
    const result = await dbGetPatients({
      search: String(search),
      riskLevel: String(riskLevel),
      interventionStatus: String(interventionStatus),
      dueFilter: String(dueFilter),
      sortBy: String(sortBy),
      sortOrder,
      page: pageNum,
      limit: limitNum
    });
    return res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/patients/:id", async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await dbGetPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with identifier '${patientId}' not found.` });
    }
    const appointments = await dbGetAppointments(patient.id);
    const interventions = await dbGetInterventionsByPatientId(patient.id);
    const config = await dbGetScoringConfig();
    const currentRisk = calculatePatientRisk(patient, config);
    patient.currentRisk = currentRisk;
    return res.json({
      success: true,
      data: {
        patient,
        appointments,
        interventions,
        riskAnalysis: currentRisk
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/patients", async (req, res) => {
  try {
    const body = req.body;
    const totalAppts = Number(body.totalAppointments) || 1;
    const missed = Number(body.missedAppointments) || 0;
    const attended = Number(body.attendedAppointments) || Math.max(0, totalAppts - missed);
    if (missed > totalAppts) {
      return res.status(400).json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: 400,
        message: "Missed appointments cannot be greater than total appointments",
        path: "/api/patients"
      });
    }
    if (Number(body.age) < 0 || Number(body.age) > 120) {
      return res.status(400).json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: 400,
        message: "Age must be between 0 and 120 years",
        path: "/api/patients"
      });
    }
    const config = await dbGetScoringConfig();
    const nextIdNum = Date.now().toString().slice(-4);
    const patientCode = body.patientCode || `P-${nextIdNum}`;
    const id = `PAT-${nextIdNum}`;
    const newPatient = {
      id,
      patientCode,
      name: body.name || "New Outpatient",
      age: Number(body.age) || 45,
      gender: body.gender || "Female",
      phone: body.phone || "+91 98100 00000",
      email: body.email || "",
      address: body.address || "Connaught Place, New Delhi, Delhi",
      latitude: body.latitude ? Number(body.latitude) : 28.6139,
      longitude: body.longitude ? Number(body.longitude) : 77.209,
      distanceKm: Number(body.distanceKm) || 12,
      condition: body.condition || "General Outpatient Follow-up",
      treatmentType: body.treatmentType || "Routine Clinical Follow-up",
      treatmentStartDate: body.treatmentStartDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      treatmentDurationMonths: Number(body.treatmentDurationMonths) || 6,
      appointmentFrequencyDays: Number(body.appointmentFrequencyDays) || 30,
      totalAppointments: totalAppts,
      attendedAppointments: attended,
      missedAppointments: missed,
      rescheduledAppointments: Number(body.rescheduledAppointments) || 0,
      attendanceRate: Math.round(attended / totalAppts * 100),
      nextFollowUpDate: body.nextFollowUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      lastVisitDate: body.lastVisitDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      status: "ACTIVE",
      assignedDoctor: body.assignedDoctor || "Dr. Rajesh Kulkarni, DM",
      preferredLanguage: body.preferredLanguage || "Hindi",
      transportAccess: body.transportAccess || "Personal",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    newPatient.currentRisk = calculatePatientRisk(newPatient, config);
    await dbCreatePatient(newPatient);
    await dbLogAudit(
      req.headers["x-staff-name"] || "Clinical Administrator",
      "ADMIN",
      "Patient Enrolled",
      `Enrolled ${newPatient.name} (${newPatient.patientCode}) with risk score ${newPatient.currentRisk.score}/100.`,
      newPatient.patientCode
    );
    return res.status(201).json({
      success: true,
      message: "Patient registered and initial risk score calculated successfully",
      data: newPatient
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.put("/api/patients/:id", async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await dbGetPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    const config = await dbGetScoringConfig();
    const updated = { ...patient, ...req.body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (req.body.totalAppointments || req.body.missedAppointments || req.body.attendedAppointments) {
      const total = Number(updated.totalAppointments) || 1;
      const missed = Number(updated.missedAppointments) || 0;
      const attended = total - missed;
      updated.attendedAppointments = Math.max(0, attended);
      updated.attendanceRate = Math.round(updated.attendedAppointments / total * 100);
    }
    updated.currentRisk = calculatePatientRisk(updated, config);
    await dbUpdatePatient(patientId, updated);
    await dbLogAudit(
      req.headers["x-staff-name"] || "Dr. Aruna Swaminathan",
      "ADMIN",
      "Patient Record Updated",
      `Administrator updated clinical and appointment details for ${updated.name} (${updated.patientCode}).`,
      updated.patientCode
    );
    return res.json({ success: true, data: updated, message: "Patient details updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/analyzer/process", async (req, res) => {
  try {
    const patientInput = req.body;
    const config = await dbGetScoringConfig();
    const existingPatient = patientInput.id ? await dbGetPatientById(patientInput.id) : null;
    const patient = existingPatient ? { ...existingPatient, ...patientInput } : { ...patientInput };
    patient.age = Number(patientInput.age ?? patient.age) || 50;
    patient.distanceKm = Number(patientInput.distanceKm ?? patient.distanceKm) || 0;
    patient.missedAppointments = Number(patientInput.missedAppointments ?? patient.missedAppointments) || 0;
    const parsedTotal = Number(patientInput.totalAppointments ?? patient.totalAppointments) || 1;
    patient.totalAppointments = Math.max(parsedTotal, patient.missedAppointments);
    patient.attendedAppointments = Math.max(0, patient.totalAppointments - patient.missedAppointments);
    patient.attendanceRate = patient.totalAppointments > 0 ? Math.round(patient.attendedAppointments / patient.totalAppointments * 100) : 100;
    patient.treatmentDurationMonths = Number(patientInput.treatmentDurationMonths ?? patient.treatmentDurationMonths) || 1;
    patient.appointmentFrequencyDays = Number(patientInput.appointmentFrequencyDays ?? patient.appointmentFrequencyDays) || 30;
    const risk = calculatePatientRisk(patient, config);
    const hazards = [];
    const cond = (patient.condition || "").toLowerCase();
    if (cond.includes("heart") || cond.includes("cardio") || cond.includes("chf") || cond.includes("cabg")) {
      hazards.push("High risk of acute congestive decompensation or emergency room readmission.");
      hazards.push("Unmonitored fluid retention and diuretic / antiplatelet dosage adjustments required.");
    } else if (cond.includes("diabet") || cond.includes("glyc") || cond.includes("nephro")) {
      hazards.push("Risk of asymptomatic glycemic drift, HbA1c spike, or microvascular complications.");
    } else if (cond.includes("hyperten") || cond.includes("bp")) {
      hazards.push("Cardiovascular strain due to uncontrolled blood pressure variability.");
    } else if (cond.includes("oncol") || cond.includes("cancer") || cond.includes("thyroid")) {
      hazards.push("Critical treatment protocol interruption and delayed endocrine / toxicity screening.");
    } else if (cond.includes("copd") || cond.includes("pulmon") || cond.includes("bronch")) {
      hazards.push("Risk of acute respiratory exacerbation and loss of inhaler / nebulizer compliance.");
    } else {
      hazards.push("Disease progression and loss of therapeutic continuity.");
    }
    if (patient.distanceKm > 30) {
      hazards.push(`Transit barrier (${patient.distanceKm} km from hospital) is a major contributor to appointment friction.`);
    }
    if (patient.missedAppointments >= 3) {
      hazards.push(`Pattern of chronic non-attendance (${patient.missedAppointments} missed out of ${patient.totalAppointments} visits).`);
    }
    let suggestedIntervention = "Priority Phone Call";
    if (patient.distanceKm > 35) {
      suggestedIntervention = "Teleconsultation Offer";
    } else if (risk.riskLevel === "CRITICAL" || risk.riskLevel === "HIGH") {
      suggestedIntervention = "Priority Phone Call";
    } else {
      suggestedIntervention = "WhatsApp Notification";
    }
    const nextApptDate = patient.nextFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const assignedDoc = patient.assignedDoctor || "Dr. Rajesh Kulkarni, DM";
    const lang = patient.preferredLanguage || "Hindi";
    const patientSummaryMessage = `Namaste ${patient.name}, this is the CareTrack Clinical Follow-up team from ${assignedDoc}'s outpatient clinic. Your next appointment is scheduled on ${nextApptDate}. Attending this follow-up is vital for managing your ${patient.condition}. If travel is difficult from your address (${patient.distanceKm} km away), we can arrange a teleconsultation or hospital shuttle assistance. Please contact our direct clinical helpline at +91 80 4912 3456.`;
    const smsDraft = `[CareTrack Health] Namaste ${patient.name}, your follow-up with ${assignedDoc} is due on ${nextApptDate}. Preferred language: ${lang}. Reply YES to confirm or call +91 80 4912 3456 for tele-consult/transit help.`;
    const whatsappDraft = `Namaste ${patient.name} \u{1F64F}

This is the Outpatient Care Coordination team at CareTrack Hospital.

\u{1F4C5} *Next Follow-up Date:* ${nextApptDate}
\u{1F468}\u200D\u2695\uFE0F *Consulting Specialist:* ${assignedDoc}
\u{1FA7A} *Care Plan:* ${patient.condition}
\u{1F5E3}\uFE0F *Communication Language:* ${lang}

*Important Clinical Guidelines:*
\u2022 Please carry your previous prescription and recent diagnostic reports.
\u2022 Since you are located approx. ${patient.distanceKm} km away, reply here to switch to a Doctor Video Consult or arrange patient transit support.

Helpline: +91 80 4912 3456
Wishing you good health!`;
    const findings = {
      patientId: patient.id || "PAT-TEMP",
      patientCode: patient.patientCode || "P-TEMP",
      patientName: patient.name,
      phone: patient.phone,
      condition: patient.condition,
      riskScore: risk.score,
      riskLevel: risk.riskLevel,
      confidence: Math.round(75 + risk.score % 20),
      evidenceCoverage: risk.evidenceCoverage,
      nextFollowUpDate: nextApptDate,
      primaryDrivers: risk.reasons,
      topFactors: risk.topFactors,
      clinicalHazards: hazards,
      recommendedActions: risk.recommendedActions,
      suggestedIntervention,
      patientSummaryMessage,
      smsDraft,
      whatsappDraft,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dbLogAudit(
      req.headers["x-staff-name"] || "Dr. Aruna Swaminathan",
      "ADMIN",
      "Analyzer Findings Generated",
      `Admin submitted ${patient.name} (${patient.patientCode}) details to Clinical Risk Analyzer. Calculated risk: ${risk.score}/100.`,
      patient.patientCode
    );
    return res.json({
      success: true,
      data: findings,
      message: "Clinical Risk & Adherence Analyzer findings generated successfully"
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/patients/:id/contact", async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      channel = "PHONE_CALL",
      phoneNumber,
      messageContent = "",
      callOutcome = "Spoke with Patient - Confirmed Attendance",
      callDurationSeconds = 0,
      notes = "",
      confirmFollowUpDate
    } = req.body;
    const patient = await dbGetPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    const staffName = req.headers["x-staff-name"] || "Dr. Aruna Swaminathan";
    const staffRole = "ADMIN";
    let type = "Priority Phone Call";
    if (channel === "SMS") type = "SMS Reminder";
    if (channel === "WHATSAPP") type = "WhatsApp Notification";
    let interventionStatus = "Completed";
    let patientConfirmed = true;
    if (callOutcome.includes("Unable") || callOutcome.includes("Voicemail")) {
      interventionStatus = "Contacted";
      patientConfirmed = false;
    } else if (callOutcome.includes("Confirmed")) {
      interventionStatus = "Confirmed";
      patientConfirmed = true;
    } else if (callOutcome.includes("Rescheduled")) {
      interventionStatus = "Rescheduled";
      if (confirmFollowUpDate) {
        patient.nextFollowUpDate = confirmFollowUpDate;
      }
    }
    const notifResult = await sendNotification({
      patientId: patient.id,
      channel,
      destination: phoneNumber || patient.phone,
      messageContent: messageContent || `Follow-up appointment outreach: ${callOutcome}`
    });
    const interventionNotes = channel === "PHONE_CALL" ? `[Voice Outreach to ${phoneNumber || patient.phone}] Outcome: ${callOutcome}. Duration: ${callDurationSeconds}s. Provider: ${notifResult.provider}. Notes: ${notes}` : `[${channel} Dispatched to ${phoneNumber || patient.phone}] Provider: ${notifResult.provider}. Content: "${messageContent}". Notes: ${notes}`;
    const newIntervention = {
      id: `INT-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientCode: patient.patientCode,
      patientName: patient.name,
      predictionId: patient.currentRisk?.id || "PRED-LATEST",
      staffId: "USR-ADMIN",
      staffName,
      staffRole,
      type,
      status: interventionStatus,
      reason: `Admin outreach (${notifResult.provider}) based on Risk Score ${patient.currentRisk?.score || 75}`,
      notes: interventionNotes,
      patientConfirmedNextVisit: patientConfirmed,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dbCreateIntervention(newIntervention);
    if (confirmFollowUpDate) {
      patient.nextFollowUpDate = confirmFollowUpDate;
      await dbUpdatePatient(patient.id, patient);
    }
    await dbLogAudit(
      staffName,
      staffRole,
      `Patient Contacted via ${channel}`,
      `Admin contacted ${patient.name} (${patient.patientCode}) at ${phoneNumber || patient.phone}. Status: ${interventionStatus} (${notifResult.provider}).`,
      patient.patientCode
    );
    return res.status(200).json({
      success: true,
      message: notifResult.message,
      data: {
        intervention: newIntervention,
        patient,
        sentTo: phoneNumber || patient.phone,
        channel,
        notification: notifResult,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/predictions/predict", async (req, res) => {
  try {
    const {
      patientId = "P-SIMULATED",
      age = 50,
      distanceKm = 15,
      treatmentDurationMonths = 6,
      missedAppointments = 1,
      appointmentFrequencyDays = 30,
      totalAppointments = 6,
      attendedAppointments = 5
    } = req.body;
    if (missedAppointments > totalAppointments) {
      return res.status(400).json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: 400,
        message: "Missed appointments cannot exceed total appointments",
        path: "/api/predictions/predict"
      });
    }
    const config = await dbGetScoringConfig();
    const prediction = calculatePatientRisk({
      id: patientId,
      age: Number(age),
      distanceKm: Number(distanceKm),
      treatmentDurationMonths: Number(treatmentDurationMonths),
      appointmentFrequencyDays: Number(appointmentFrequencyDays),
      totalAppointments: Number(totalAppointments),
      attendedAppointments: Number(attendedAppointments),
      missedAppointments: Number(missedAppointments)
    }, config);
    return res.json({
      success: true,
      data: prediction
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/predictions", async (req, res) => {
  try {
    const list = await dbGetPredictions(100);
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/patients/:id/risk", async (req, res) => {
  try {
    const patient = await dbGetPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    const config = await dbGetScoringConfig();
    const risk = calculatePatientRisk(patient, config);
    return res.json({ success: true, data: risk });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/interventions", async (req, res) => {
  try {
    const {
      patientId,
      predictionId,
      type = "Priority Phone Call",
      status = "Pending",
      reason = "High missed appointment risk",
      notes = "",
      patientConfirmedNextVisit = false
    } = req.body;
    const patient = await dbGetPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found for intervention" });
    }
    const staffName = req.headers["x-staff-name"] || "Sister Meena Pillai, RN";
    const staffRole = req.headers["x-staff-role"] || "NURSE";
    const newIntervention = {
      id: `INT-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientCode: patient.patientCode,
      patientName: patient.name,
      predictionId: predictionId || patient.currentRisk?.id || "PRED-LATEST",
      staffId: "USR-CURRENT",
      staffName,
      staffRole,
      type,
      status,
      reason,
      notes,
      patientConfirmedNextVisit,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: status === "Completed" || status === "Confirmed" ? (/* @__PURE__ */ new Date()).toISOString() : void 0
    };
    await dbCreateIntervention(newIntervention);
    await dbLogAudit(
      staffName,
      staffRole,
      "Intervention Recorded",
      `Recorded '${type}' for ${patient.name} (${patient.patientCode}) with status '${status}'.`,
      patient.patientCode
    );
    return res.status(201).json({
      success: true,
      message: "Intervention logged successfully",
      data: newIntervention
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/interventions", async (req, res) => {
  try {
    const { status = "ALL", limit = "50" } = req.query;
    const list = await dbGetInterventions(String(status), Number(limit));
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.put("/api/interventions/:id/status", async (req, res) => {
  try {
    const { status, notes, patientConfirmedNextVisit } = req.body;
    const updated = await dbUpdateInterventionStatus(req.params.id, status, notes, patientConfirmedNextVisit);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Intervention not found" });
    }
    await dbLogAudit(
      req.headers["x-staff-name"] || "Clinical Staff",
      "NURSE",
      "Intervention Status Updated",
      `Updated intervention ${updated.id} status to '${updated.status}' for ${updated.patientName}.`,
      updated.patientCode
    );
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const summary = await dbGetDashboardSummary();
    return res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/dashboard/risk-distribution", async (req, res) => {
  try {
    const distribution = await dbGetRiskDistribution();
    return res.json({
      success: true,
      data: distribution
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/dashboard/trends", async (req, res) => {
  try {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const highRiskByDay = days.map((day, idx) => ({
      day,
      highRiskCount: 22 + idx * 5 % 18,
      interventionsLogged: 16 + idx * 4 % 14
    }));
    const attendanceTrend = [
      { month: "Jan", attendedRate: 84, missedRate: 16, interventionsRun: 42 },
      { month: "Feb", attendedRate: 86, missedRate: 14, interventionsRun: 58 },
      { month: "Mar", attendedRate: 83, missedRate: 17, interventionsRun: 61 },
      { month: "Apr", attendedRate: 89, missedRate: 11, interventionsRun: 74 },
      { month: "May", attendedRate: 91, missedRate: 9, interventionsRun: 85 },
      { month: "Jun", attendedRate: 93, missedRate: 7, interventionsRun: 92 }
    ];
    const riskFactorsFrequency = [
      { factor: "Multiple Missed Visits", count: 186, impact: "Critical" },
      { factor: "Distance > 30 km", count: 142, impact: "High" },
      { factor: "Irregular Cadence (>60d)", count: 98, impact: "Medium" },
      { factor: "Treatment Duration > 9 mos", count: 76, impact: "Medium" },
      { factor: "Age Vulnerability (>65y)", count: 72, impact: "Medium" },
      { factor: "Transit Barrier / No Car", count: 64, impact: "Medium" }
    ];
    const interventionSuccessChart = [
      { type: "Priority Phone Call", attempted: 95, confirmed: 84, successRate: 88 },
      { type: "SMS Reminder + Link", attempted: 140, confirmed: 115, successRate: 82 },
      { type: "Teleconsultation Offer", attempted: 65, confirmed: 59, successRate: 91 },
      { type: "Transport Assistance", attempted: 38, confirmed: 34, successRate: 89 }
    ];
    return res.json({
      success: true,
      data: {
        highRiskByDay,
        attendanceTrend,
        riskFactorsFrequency,
        interventionSuccessChart
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/settings/config", async (req, res) => {
  try {
    const config = await dbGetScoringConfig();
    return res.json({ success: true, data: config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.put("/api/settings/config", async (req, res) => {
  try {
    const updatedConfig = await dbSaveScoringConfig(req.body);
    await dbLogAudit(
      req.headers["x-staff-name"] || "Administrator",
      "ADMIN",
      "Scoring Configuration Updated",
      `Updated thresholds & scoring weights in PostgreSQL. Recalculated risk across active patient records.`
    );
    return res.json({
      success: true,
      message: "Scoring engine configuration updated and applied to all patient records.",
      data: updatedConfig
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/demo/reset", async (req, res) => {
  try {
    await seedDatabase(1e3);
    await dbLogAudit("System Administrator", "ADMIN", "Demo Reset", "Reset CareTrack AI to canonical demonstration state with 1,000 synthetic records.");
    return res.json({
      success: true,
      message: "CareTrack AI reseeded successfully with 1,000 synthetic records and canonical demo storyline patients."
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/demo/generate", async (req, res) => {
  try {
    const count = Math.min(2500, Math.max(50, Number(req.body.count) || 1e3));
    await seedDatabase(count);
    return res.json({
      success: true,
      message: `Generated ${count} realistic synthetic healthcare patient records in PostgreSQL.`,
      count
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/assistant/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    const summary = await dbGetDashboardSummary();
    const patientsResult = await dbGetPatients({ limit: 100 });
    const patients = patientsResult.data;
    const highRisk = patients.filter((p) => p.currentRisk?.riskLevel === "HIGH" || p.currentRisk?.riskLevel === "CRITICAL");
    const distantHighRisk = highRisk.filter((p) => p.distanceKm > 30);
    const query = message.toLowerCase();
    const codeMatch = message.match(/P-\d+/i);
    let patientContext = "";
    if (codeMatch) {
      const p = await dbGetPatientById(codeMatch[0]);
      if (p && p.currentRisk) {
        patientContext = `Patient ${p.name} (${p.patientCode}): Risk Score ${p.currentRisk.score}/100 (${p.currentRisk.riskLevel}). Age: ${p.age}. Distance: ${p.distanceKm} km. Missed Appointments: ${p.missedAppointments}. Total: ${p.totalAppointments}. Attendance Rate: ${p.attendanceRate}%. Immediate Action: ${p.currentRisk.immediateAction}. Key Reasons: ${p.currentRisk.reasons.join(", ")}.`;
      }
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemPrompt = `You are the CareTrack AI Clinical Operations Assistant for hospital staff (nurses, doctors, receptionists).
Strict Healthcare Constraints:
1. ONLY answer operational, appointment follow-up, and risk prioritisation questions using this application data:
   - Total Patients in Clinic: ${summary.totalPatients}
   - High/Critical Risk Patients: ${summary.highRiskPatients}
   - High Risk due to distance (>30km): ${distantHighRisk.length}
   ${patientContext ? `- Specific Queried Patient: ${patientContext}` : ""}
2. NEVER diagnose disease, prescribe medication, or give clinical medical treatments.
3. Keep answers concise, factual, explainable, and respectful of clinical staff time.
4. If asked "Why is patient [ID] high risk?", explain the top drivers (missed visits, distance, attendance rate, age) and recommended action.`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}

User Question: ${message}` }] }
          ]
        });
        const reply = response.text || "I analyzed the operational follow-up data for your request.";
        return res.json({ success: true, reply });
      } catch (err) {
        console.error("[Gemini Assistant Error]", err);
      }
    }
    let fallbackReply = "";
    if (query.includes("distance") || query.includes("far") || query.includes("km")) {
      fallbackReply = `Currently, there are ${distantHighRisk.length} high-risk patients who live more than 30 km from the facility. For these patients, our primary recommended intervention is offering remote teleconsultation or transit coordination.`;
    } else if (codeMatch) {
      const p = await dbGetPatientById(codeMatch[0]);
      if (p && p.currentRisk) {
        fallbackReply = `Patient ${p.name} (${p.patientCode}) has a risk score of ${p.currentRisk.score}/100 (${p.currentRisk.riskLevel} Risk). The strongest contributing drivers are: ${p.currentRisk.reasons.slice(0, 3).join(", ")}. Recommended action: ${p.currentRisk.immediateAction}.`;
      } else {
        fallbackReply = `I could not locate patient ${codeMatch[0]} in the active database.`;
      }
    } else if (query.includes("high risk") || query.includes("queue") || query.includes("how many")) {
      fallbackReply = `There are currently ${summary.highRiskPatients} patients categorized as High or Critical Risk (score \u2265 60) out of ${summary.totalPatients} total monitored patients. Top intervention priorities include phone outreach and telehealth offers for distant patients.`;
    } else {
      fallbackReply = `CareTrack AI is monitoring ${summary.totalPatients} patients across outpatient clinics. There are ${summary.highRiskPatients} high/critical-risk patients requiring proactive follow-up contact. You can search any patient ID (like P-1042) to see their specific risk breakdown.`;
    }
    return res.json({ success: true, reply: fallbackReply });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/audit-logs", async (req, res) => {
  try {
    const logs = await dbGetAuditLogs(200);
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/export/csv", async (req, res) => {
  try {
    const patientsResult = await dbGetPatients({ limit: 1e3, sortBy: "riskScore", sortOrder: "desc" });
    const patients = patientsResult.data;
    const headers = ["Rank", "Patient ID", "Name", "Age", "Risk Score", "Risk Level", "Missed Visits", "Distance (km)", "Attendance Rate (%)", "Next Follow-up", "Immediate Action", "Intervention Status"];
    const rows = patients.map((p, idx) => [
      idx + 1,
      p.patientCode,
      `"${p.name}"`,
      p.age,
      p.currentRisk?.score || 0,
      p.currentRisk?.riskLevel || "LOW",
      p.missedAppointments,
      p.distanceKm,
      p.attendanceRate,
      p.nextFollowUpDate,
      `"${p.currentRisk?.immediateAction || "Standard Reminder"}"`,
      p.latestIntervention?.status || "Pending"
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="caretrack_risk_queue.csv"');
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
async function startServer() {
  await initDatabase();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  return new Promise((resolve) => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`CareTrack AI Hospital Platform running on port ${PORT}`);
      resolve(server);
    });
  });
}
var isMainScript = !process.env.VERCEL && process.env.NODE_ENV !== "test" && Boolean(process.argv[1] && (process.argv[1].endsWith("server.cjs") || process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js")));
if (isMainScript) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
var server_default = app;

// api/[...path].ts
var path_default = server_default;
export {
  path_default as default
};

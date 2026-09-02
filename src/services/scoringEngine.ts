import { RiskPrediction, RiskFactorContribution, RiskLevel, ScoringConfiguration } from '../types';

export const DEFAULT_SCORING_CONFIG: ScoringConfiguration = {
  thresholds: {
    lowMax: 29,
    mediumMax: 59,
    highMax: 79,
    highMin: 60,
    criticalMin: 80,
  },
  weights: {
    missedAppointmentsWeight: 35,
    distanceWeight: 20,
    attendanceRateWeight: 20,
    appointmentFrequencyWeight: 10,
    treatmentDurationWeight: 10,
    ageWeight: 5,
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
  autoEscalateHighRiskDays: 2,
};

/**
 * Transparent, explainable scoring engine for follow-up risk prediction.
 * Designed according to healthcare explainability and responsible AI standards.
 */
export function calculatePatientRisk(
  patientData: {
    id?: string;
    patientCode?: string;
    age: number;
    distanceKm: number;
    treatmentDurationMonths: number;
    appointmentFrequencyDays: number;
    totalAppointments: number;
    attendedAppointments: number;
    missedAppointments: number;
    recentAttendanceStreak?: number;
  },
  config: ScoringConfiguration = DEFAULT_SCORING_CONFIG
): RiskPrediction {
  const {
    id = 'TEMP_PRED',
    age,
    distanceKm,
    treatmentDurationMonths,
    appointmentFrequencyDays,
    totalAppointments,
    attendedAppointments,
    missedAppointments,
    recentAttendanceStreak = 0,
  } = patientData;

  const attendanceRate = totalAppointments > 0 
    ? Math.round((attendedAppointments / totalAppointments) * 100) 
    : 100;

  const factors: RiskFactorContribution[] = [];
  const reasons: string[] = [];
  const protectiveFactors: string[] = [];
  const recommendedActions: string[] = [];

  // Extract weights & thresholds safely
  const wMissed = config.maxMissedPoints ?? config.weights?.missedAppointmentsWeight ?? 35;
  const wDistance = config.maxDistancePoints ?? config.weights?.distanceWeight ?? 20;
  const wAttendance = config.maxAttendancePoints ?? config.weights?.attendanceRateWeight ?? 20;
  const wFrequency = config.maxFrequencyPoints ?? config.weights?.appointmentFrequencyWeight ?? 10;
  const wDuration = config.maxDurationPoints ?? config.weights?.treatmentDurationWeight ?? 10;
  const wAge = config.maxAgePoints ?? config.weights?.ageWeight ?? 5;

  const highMin = config.thresholds?.highMin ?? config.highRiskThreshold ?? 60;
  const lowMax = config.thresholds?.lowMax ?? (config.mediumRiskThreshold ? config.mediumRiskThreshold - 1 : 29);

  // ==========================================
  // FACTOR 1: Missed Appointments (Max 35 pts)
  // Reflects prior broken follow-up commitments
  // ==========================================
  let missedPoints = Math.min(missedAppointments * 7, 35);

  const scaledMissedPoints = Math.round((missedPoints / 35) * wMissed);

  factors.push({
    name: 'Missed Appointments',
    rawValue: `${missedAppointments} missed out of ${totalAppointments}`,
    points: scaledMissedPoints,
    maxPoints: wMissed,
    impact: scaledMissedPoints >= 21 ? 'HIGH' : scaledMissedPoints >= 10 ? 'MEDIUM' : 'LOW',
    category: 'History',
    explanation: missedAppointments > 0 
      ? `Patient has accumulated ${missedAppointments} missed visit(s), indicating recurring follow-up friction.`
      : `Zero missed appointments in patient history.`,
    percentageContribution: 0,
  });

  if (missedAppointments >= 3) {
    reasons.push(`${missedAppointments} previous follow-up appointments were missed`);
  } else if (missedAppointments === 1 || missedAppointments === 2) {
    reasons.push(`Patient has missed ${missedAppointments} previous appointment(s)`);
  } else {
    protectiveFactors.push('Zero previous missed appointments in record');
  }

  // ==========================================
  // FACTOR 2: Distance from Hospital (Max 20 pts)
  // Measures logistical and geographic transit barrier
  // ==========================================
  let distancePoints = Math.min((distanceKm / 45) * 20, 20);

  const scaledDistancePoints = Math.round((distancePoints / 20) * wDistance);

  factors.push({
    name: 'Hospital Travel Distance',
    rawValue: `${distanceKm} km`,
    points: scaledDistancePoints,
    maxPoints: wDistance,
    impact: scaledDistancePoints >= 14 ? 'HIGH' : scaledDistancePoints >= 7 ? 'MEDIUM' : 'LOW',
    category: 'Distance',
    explanation: distanceKm >= 30 
      ? `Patient resides ${distanceKm} km away from hospital facility, presenting significant transit barrier.`
      : distanceKm >= 15 
      ? `Moderate travel distance of ${distanceKm} km requires deliberate commute planning.`
      : `Patient resides within ${distanceKm} km of hospital (minimal transit friction).`,
    percentageContribution: 0,
  });

  if (distanceKm >= 30) {
    reasons.push(`Patient resides ${distanceKm} km from hospital clinic (travel transit barrier)`);
  } else if (distanceKm < 10) {
    protectiveFactors.push(`Lives close to facility (${distanceKm} km away)`);
  }

  // ==========================================
  // FACTOR 3: Historical Attendance Consistency (Max 20 pts)
  // Evaluates longitudinal reliability while avoiding double-counting
  // ==========================================
  let attendancePoints = Math.min(((100 - attendanceRate) / 50) * 20, 20);

  const scaledAttendancePoints = Math.round((attendancePoints / 20) * wAttendance);

  factors.push({
    name: 'Historical Attendance Rate',
    rawValue: `${attendanceRate}% rate`,
    points: scaledAttendancePoints,
    maxPoints: wAttendance,
    impact: scaledAttendancePoints >= 14 ? 'HIGH' : scaledAttendancePoints >= 7 ? 'MEDIUM' : 'LOW',
    category: 'History',
    explanation: attendanceRate < 70 
      ? `Overall historical attendance rate is low (${attendanceRate}%), showing long-term schedule irregularity.`
      : attendanceRate >= 85
      ? `Strong historical engagement with ${attendanceRate}% overall attendance rate.`
      : `Moderate overall attendance consistency (${attendanceRate}%).`,
    percentageContribution: 0,
  });

  if (attendanceRate < 70) {
    reasons.push(`Overall historical attendance consistency is low (${attendanceRate}%)`);
  } else if (attendanceRate >= 85) {
    protectiveFactors.push(`High historical attendance record (${attendanceRate}%)`);
  }

  // ==========================================
  // FACTOR 4: Follow-up Appointment Frequency (Max 10 pts)
  // Long intervals cause recall decay and forgotten dates
  // ==========================================
  let frequencyPoints = Math.min((appointmentFrequencyDays / 90) * 10, 10);

  const scaledFreqPoints = Math.round((frequencyPoints / 10) * wFrequency);

  factors.push({
    name: 'Appointment Interval Cadence',
    rawValue: `Every ${appointmentFrequencyDays} days`,
    points: scaledFreqPoints,
    maxPoints: wFrequency,
    impact: scaledFreqPoints >= 7 ? 'MEDIUM' : 'LOW',
    category: 'Frequency',
    explanation: appointmentFrequencyDays > 60 
      ? `Infrequent follow-up interval (${appointmentFrequencyDays} days) increases risk of forgotten appointments.`
      : `Regular follow-up cadence (${appointmentFrequencyDays} days) maintains clinical connection.`,
    percentageContribution: 0,
  });

  if (appointmentFrequencyDays > 60) {
    reasons.push(`Infrequent follow-up cadence (every ${appointmentFrequencyDays} days) increases forgetfulness risk`);
  } else if (appointmentFrequencyDays <= 30) {
    protectiveFactors.push(`Regular, frequent appointment cadence (every ${appointmentFrequencyDays} days)`);
  }

  // ==========================================
  // FACTOR 5: Treatment Duration Fatigue (Max 10 pts)
  // Chronic care fatigue accumulates over prolonged multi-month regimens
  // ==========================================
  let durationPoints = Math.min((treatmentDurationMonths / 24) * 10, 10);

  const scaledDurationPoints = Math.round((durationPoints / 10) * wDuration);

  factors.push({
    name: 'Treatment Duration Fatigue',
    rawValue: `${treatmentDurationMonths} months`,
    points: scaledDurationPoints,
    maxPoints: wDuration,
    impact: scaledDurationPoints >= 7 ? 'MEDIUM' : 'LOW',
    category: 'Duration',
    explanation: treatmentDurationMonths >= 12 
      ? `Extended treatment journey (${treatmentDurationMonths} mos) can cause chronic care follow-up fatigue.`
      : `Manageable treatment timeline (${treatmentDurationMonths} mos).`,
    percentageContribution: 0,
  });

  if (treatmentDurationMonths >= 12) {
    reasons.push(`Extended care regimen (${treatmentDurationMonths} months) increases follow-up fatigue`);
  }

  // ==========================================
  // FACTOR 6: Age Vulnerability / Mobility (Max 5 pts)
  // Reflects senior transit vulnerability or pediatric dependency
  // ==========================================
  let agePoints = 0;
  if (age > 50) {
    agePoints = Math.min(((age - 50) / 50) * 5, 5);
  } else if (age < 18) {
    agePoints = Math.min(((18 - age) / 18) * 5, 5);
  }

  const scaledAgePoints = Math.round((agePoints / 5) * wAge);

  factors.push({
    name: 'Age Vulnerability',
    rawValue: `${age} years`,
    points: scaledAgePoints,
    maxPoints: wAge,
    impact: scaledAgePoints >= 4 ? 'HIGH' : scaledAgePoints >= 2 ? 'MEDIUM' : 'LOW',
    category: 'Demographics',
    explanation: age >= 65
      ? `Senior age (${age}y) presents elevated physical mobility and travel transit vulnerability.`
      : age < 12
      ? `Pediatric patient (${age}y) requires caregiver accompaniment and scheduling synchronization.`
      : `Patient age (${age}y) has standard independent mobility.`,
    percentageContribution: 0,
  });

  if (age >= 65) {
    reasons.push(`Senior patient age (${age}y) presents travel and physical mobility challenges`);
  } else if (age >= 18 && age <= 50) {
    protectiveFactors.push(`Independent mobility age profile (${age}y)`);
  }

  // Attendance streak protective factor
  if (recentAttendanceStreak >= 2) {
    protectiveFactors.push(`Patient attended the last ${recentAttendanceStreak} scheduled appointments consistently`);
  }

  // Calculate raw total score (capped at 0 - 100)
  const totalScoreRaw = scaledMissedPoints + scaledDistancePoints + scaledAttendancePoints + scaledFreqPoints + scaledDurationPoints + scaledAgePoints;
  const score = Math.min(100, Math.max(0, totalScoreRaw));

  // Determine percentage contribution for each factor
  factors.forEach(factor => {
    factor.percentageContribution = score > 0 ? Math.round((factor.points / score) * 100) : 0;
  });

  // Sort factors by point impact descending
  factors.sort((a, b) => b.points - a.points);

  // Categorize Risk Level
  const criticalMin = config.thresholds?.criticalMin ?? config.criticalRiskThreshold ?? 80;
  let riskLevel: RiskLevel = 'LOW';
  if (score >= criticalMin) {
    riskLevel = 'CRITICAL';
  } else if (score >= highMin) {
    riskLevel = 'HIGH';
  } else if (score > lowMax) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Recommended Intervention Actions Matrix
  let immediateAction = 'Standard Automated SMS Reminder';
  let secondaryAction = 'Send WhatsApp Clinic Confirmation';
  let alternativeAction = 'Routine Follow-up Log';

  if (riskLevel === 'CRITICAL') {
    immediateAction = 'Urgent Clinical Coordinator Phone Outreach & Home Visit Assessment';
    secondaryAction = 'Emergency Teleconsultation / Ambulance Transport Support';
    alternativeAction = 'Expedited Physician Review';
    recommendedActions.push('Immediate telephone contact within 24 hours by clinical care coordinator');
    recommendedActions.push('Proactively arrange teleconsultation or hospital transport voucher');
    recommendedActions.push('Engage primary family caregiver to confirm attendance readiness');
    recommendedActions.push('Clinical triage review by attending specialist');
  } else if (riskLevel === 'HIGH') {
    if (scaledMissedPoints >= 20 && scaledDistancePoints >= 10) {
      immediateAction = 'Priority Phone Call + Remote Teleconsultation Offer';
      secondaryAction = 'Transport Coordination / Transit Guidance';
      alternativeAction = 'Assign Dedicated Nurse Outreach Coordinator';
      recommendedActions.push('Priority telephone outreach by clinical coordinator within 24-48 hours');
      recommendedActions.push('Offer hybrid teleconsultation / remote follow-up if travel is difficult');
      recommendedActions.push('Confirm appointment readiness and caregiver transport support');
    } else if (scaledMissedPoints >= 20) {
      immediateAction = 'Priority Phone Call with Clinical Staff';
      secondaryAction = 'Two-Way SMS Rescheduling Hotline';
      alternativeAction = 'Peer Outreach / Care Coordinator Follow-up';
      recommendedActions.push('Direct telephone outreach by nursing coordinator');
      recommendedActions.push('Address patient-reported scheduling hurdles');
      recommendedActions.push('Offer flexible alternative appointment slot');
    } else if (scaledDistancePoints >= 12) {
      immediateAction = 'Offer Remote Teleconsultation / Virtual Visit';
      secondaryAction = 'Community Transit Assistance Referral';
      alternativeAction = 'Saturday / Off-Peak Clinic Time Slot';
      recommendedActions.push('Proactively offer telehealth follow-up visit');
      recommendedActions.push('Provide transit assistance information');
      recommendedActions.push('Batch diagnostic tests into a single morning visit');
    } else {
      immediateAction = 'Priority Outreach Call within 48 Hours';
      secondaryAction = 'Interactive SMS Confirmation';
      alternativeAction = 'Clinic Care Manager Review';
      recommendedActions.push('Personalized call before upcoming visit');
      recommendedActions.push('Verify contact details and preferred appointment hours');
    }
  } else if (riskLevel === 'MEDIUM') {
    if (scaledDistancePoints >= 10) {
      immediateAction = 'Two-Way SMS Confirmation + Telehealth Option';
      secondaryAction = 'Phone Reminder 48h Prior';
      alternativeAction = 'Clinic Transit Guide';
      recommendedActions.push('Send SMS reminder with 1-click confirmation');
      recommendedActions.push('Offer remote consultation if travel is inconvenient');
    } else if (scaledMissedPoints >= 10) {
      immediateAction = 'Personalized Phone Outreach';
      secondaryAction = 'Interactive WhatsApp Reminder';
      alternativeAction = 'Calendar Invite & Pre-appointment Checklist';
      recommendedActions.push('Direct reminder call 3 days before visit');
      recommendedActions.push('Confirm travel readiness');
    } else {
      immediateAction = 'Automated SMS & WhatsApp Reminder';
      secondaryAction = 'Pre-visit Clinical Questionnaire';
      alternativeAction = 'Phone Reminder if Unacknowledged';
      recommendedActions.push('Send automated reminder 3 days and 1 day prior');
      recommendedActions.push('Request patient confirmation reply');
    }
  } else {
    // LOW RISK
    immediateAction = 'Standard Automated SMS Reminder (24h Prior)';
    secondaryAction = 'Patient Portal Calendar Notification';
    alternativeAction = 'Optional Email Summary';
    recommendedActions.push('Standard automated reminder 24 hours prior to appointment');
    recommendedActions.push('Digital patient portal notification');
  }

  // Generate Natural Language Human-Readable Summary
  let naturalLanguageSummary = '';
  if (riskLevel === 'CRITICAL') {
    const topReasonStr = reasons.slice(0, 2).join(' and ');
    naturalLanguageSummary = `This patient is classified as CRITICAL Risk (${score}/100) due to severe follow-up barriers including ${topReasonStr || 'accumulated non-attendance, distance, and age vulnerability'}. Immediate priority clinician intervention is required.`;
  } else if (riskLevel === 'HIGH') {
    const topReasonStr = reasons.slice(0, 2).join(' and ');
    naturalLanguageSummary = `This patient is classified as High Risk (${score}/100) primarily because ${topReasonStr || 'of multiple historical attendance barriers'}. Proactive intervention is strongly recommended before the scheduled date.`;
  } else if (riskLevel === 'MEDIUM') {
    const topReasonStr = reasons.length > 0 ? reasons[0] : 'moderate transit and scheduling factors';
    naturalLanguageSummary = `This patient presents Medium Risk (${score}/100) with notable influence from ${topReasonStr}. A reminder with confirmation is recommended to secure attendance.`;
  } else {
    naturalLanguageSummary = `This patient is classified as Low Risk (${score}/100) with consistent attendance history and minimal transit friction. Standard notification workflow is sufficient.`;
  }

  const evidenceCoverage = `Reviewed ${totalAppointments} historical appointments recorded across ${treatmentDurationMonths} months of outpatient care.`;
  const responsibleAiNote = 'All 6 clinical and demographic factors (missed visits, distance, attendance history, cadence, treatment duration, age) contribute with bounded, explainable point weights.';
  const confidence = totalAppointments >= 6 ? 0.96 : totalAppointments >= 3 ? 0.91 : 0.85;

  return {
    id: `PRED-${id}-${Math.floor(100000 + Math.random() * 900000)}`,
    patientId: id,
    score,
    riskLevel,
    confidence,
    evidenceCoverage,
    predictionDate: new Date().toISOString(),
    modelVersion: 'CareTrack Explainable Rule Engine v2.5',
    reasons: reasons.length > 0 ? reasons : ['No significant risk-increasing factors identified'],
    protectiveFactors: protectiveFactors.length > 0 ? protectiveFactors : ['Standard baseline profile'],
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
      attendanceRate,
    },
  };
}

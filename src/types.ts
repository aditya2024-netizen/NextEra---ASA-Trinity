export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AppointmentStatus = 'COMPLETED' | 'MISSED' | 'RESCHEDULED' | 'SCHEDULED' | 'CANCELLED';

export type InterventionStatus = 
  | 'Pending'
  | 'Contacted'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Completed'
  | 'Escalated'
  | 'Unable to Reach';

export type InterventionType = 
  | 'Priority Phone Call'
  | 'SMS Reminder'
  | 'WhatsApp Notification'
  | 'Teleconsultation Offer'
  | 'Transport Assistance'
  | 'Community Health Worker Visit'
  | 'Clinic Schedule Adjustment';

export type UserRole = 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'COORDINATOR' 
  | 'CARE_MANAGER' 
  | 'ADMIN';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  employeeId?: string;
  phone?: string;
  avatar?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  employeeId?: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  department: string;
  doctorName: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface RiskFactorContribution {
  name: string;
  rawValue: string | number;
  points: number;
  maxPoints: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'PROTECTIVE';
  category: 'History' | 'Distance' | 'Frequency' | 'Duration' | 'Demographics';
  explanation: string;
  percentageContribution: number;
}

export interface RiskPrediction {
  id: string;
  patientId: string;
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  evidenceCoverage: string; // e.g. "Reviewed 12 historical appointments across 12 months"
  predictionDate: string;
  modelVersion: string; // e.g. "CareTrack Explainable Rule Engine v2.5"
  reasons: string[];
  protectiveFactors: string[];
  recommendedActions: string[];
  immediateAction: string;
  secondaryAction: string;
  alternativeAction: string;
  topFactors: RiskFactorContribution[];
  naturalLanguageSummary: string;
  responsibleAiNote: string;
  inputSnapshot: {
    age: number;
    distanceKm: number;
    treatmentDurationMonths: number;
    appointmentFrequencyDays: number;
    totalAppointments: number;
    attendedAppointments: number;
    missedAppointments: number;
    attendanceRate: number;
  };
}

export interface Patient {
  id: string;
  patientCode: string; // e.g. "P-1042"
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  condition: string;
  treatmentType: string;
  treatmentStartDate: string;
  treatmentDurationMonths: number;
  appointmentFrequencyDays: number;
  totalAppointments: number;
  attendedAppointments: number;
  missedAppointments: number;
  rescheduledAppointments: number;
  attendanceRate: number; // percentage (0 - 100)
  nextFollowUpDate: string;
  lastVisitDate: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'ON_HOLD';
  assignedDoctor: string;
  preferredLanguage: string;
  transportAccess: 'Personal' | 'Public Transit' | 'Requires Assistance' | 'None';
  currentRisk?: RiskPrediction;
  latestIntervention?: Intervention;
  createdAt: string;
  updatedAt: string;
}

export interface Intervention {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  predictionId: string;
  staffId: string;
  staffName: string;
  staffRole: UserRole;
  type: InterventionType;
  status: InterventionStatus;
  reason: string;
  notes: string;
  outcomeNotes?: string;
  scheduledOutreachDate?: string;
  createdAt: string;
  completedAt?: string;
  patientConfirmedNextVisit?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  staffName: string;
  staffRole: string;
  action: string;
  details: string;
  patientCode?: string;
}

export interface NotificationRecord {
  id: string;
  patientId: string;
  channel: 'PHONE_CALL' | 'SMS' | 'WHATSAPP';
  destination: string;
  messageContent: string;
  status: string;
  provider: string;
  isDemo: boolean;
  createdAt: string;
}

export interface ScoringConfiguration {
  thresholds: {
    lowMax: number; // 29
    mediumMax: number; // 59
    highMax?: number; // 79
    highMin?: number; // 60
    criticalMin: number; // 80
  };
  weights: {
    missedAppointmentsWeight: number; // 35
    distanceWeight: number; // 20
    attendanceRateWeight: number; // 20
    appointmentFrequencyWeight: number; // 10
    treatmentDurationWeight: number; // 10
    ageWeight: number; // 5
  };
  highRiskThreshold?: number;
  mediumRiskThreshold?: number;
  criticalRiskThreshold?: number;
  maxMissedPoints?: number;
  maxDistancePoints?: number;
  maxAttendancePoints?: number;
  maxFrequencyPoints?: number;
  maxDurationPoints?: number;
  maxAgePoints?: number;
  autoEscalateHighRiskDays?: number;
}

export interface AnalyzerFindings {
  patientId: string;
  patientCode: string;
  patientName: string;
  phone: string;
  condition: string;
  riskScore: number;
  riskLevel: RiskLevel;
  evidenceCoverage: string;
  nextFollowUpDate: string;
  primaryDrivers: string[];
  followUpBarriers?: string[];
  clinicalHazards?: string[];
  recommendedActions: string[];
  suggestedIntervention: InterventionType;
  patientSummaryMessage: string;
  smsDraft: string;
  whatsappDraft: string;
  confidence?: number;
  topFactors?: RiskFactorContribution[];
  timestamp: string;
}

export interface ContactPatientRequest {
  patientId: string;
  channel: 'PHONE_CALL' | 'SMS' | 'WHATSAPP';
  phoneNumber: string;
  messageContent?: string;
  callOutcome?: string;
  callDurationSeconds?: number;
  notes?: string;
  confirmFollowUpDate?: string;
}

export interface DashboardSummary {
  totalPatients: number;
  highRiskPatients: number;
  mediumRiskPatients: number;
  lowRiskPatients: number;
  followUpsDueToday: number;
  followUpsDueThisWeek: number;
  interventionsCompleted: number;
  interventionsPending: number;
  outreachSuccessRate: number; // e.g. 84%
  averageRiskScore: number;
  averageAttendanceRate: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

import { 
  Patient, 
  RiskPrediction, 
  Intervention, 
  DashboardSummary, 
  ScoringConfiguration, 
  StaffUser, 
  AuditLog 
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const api = {
  // Auth
  async login(email: string, password?: string): Promise<{ success: boolean; token: string; user: StaffUser; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async register(payload: {
    name: string;
    email: string;
    password?: string;
    role: string;
    department?: string;
    employeeId?: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: StaffUser; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getUsers(): Promise<{ success: boolean; data: StaffUser[] }> {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async deleteUser(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Patients
  async getPatients(params: {
    search?: string;
    riskLevel?: string;
    interventionStatus?: string;
    dueFilter?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Patient[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params.interventionStatus) query.set('interventionStatus', params.interventionStatus);
    if (params.dueFilter) query.set('dueFilter', params.dueFilter);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/patients?${query.toString()}`);
    return res.json();
  },

  async getPatientById(id: string): Promise<{
    success: boolean;
    data: {
      patient: Patient;
      appointments: any[];
      interventions: Intervention[];
      riskAnalysis: RiskPrediction;
    };
  }> {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    return res.json();
  },

  async createPatient(patientData: Partial<Patient>): Promise<{ success: boolean; data: Patient; message: string }> {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return res.json();
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<{ success: boolean; data: Patient }> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Predictions
  async predictRisk(input: {
    patientId?: string;
    age: number;
    distanceKm: number;
    treatmentDurationMonths: number;
    missedAppointments: number;
    appointmentFrequencyDays: number;
    totalAppointments: number;
    attendedAppointments: number;
  }): Promise<{ success: boolean; data: RiskPrediction }> {
    const res = await fetch(`${API_BASE}/predictions/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  },

  async getPredictionHistory(): Promise<{ success: boolean; data: RiskPrediction[] }> {
    const res = await fetch(`${API_BASE}/predictions`);
    return res.json();
  },

  // Analyzer
  async runAnalyzer(patientData: any): Promise<{ success: boolean; data: any; message: string }> {
    const res = await fetch(`${API_BASE}/analyzer/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return res.json();
  },

  // Contact Patient
  async contactPatient(payload: {
    patientId: string;
    channel: 'PHONE_CALL' | 'SMS' | 'WHATSAPP';
    phoneNumber: string;
    messageContent?: string;
    callOutcome?: string;
    callDurationSeconds?: number;
    notes?: string;
    confirmFollowUpDate?: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const res = await fetch(`${API_BASE}/patients/${payload.patientId}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Interventions
  async createIntervention(intervention: Partial<Intervention>): Promise<{ success: boolean; data: Intervention }> {
    const res = await fetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention),
    });
    return res.json();
  },

  async getInterventions(status: string = 'ALL'): Promise<{ success: boolean; data: Intervention[] }> {
    const res = await fetch(`${API_BASE}/interventions?status=${status}`);
    return res.json();
  },

  async updateInterventionStatus(
    id: string, 
    status: Intervention['status'], 
    notes?: string,
    patientConfirmedNextVisit?: boolean
  ): Promise<{ success: boolean; data: Intervention }> {
    const res = await fetch(`${API_BASE}/interventions/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, patientConfirmedNextVisit }),
    });
    return res.json();
  },

  // Dashboard
  async getDashboardSummary(): Promise<{ success: boolean; data: DashboardSummary }> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    return res.json();
  },

  async getRiskDistribution(): Promise<{ success: boolean; data: { name: string; value: number; color: string }[] }> {
    const res = await fetch(`${API_BASE}/dashboard/risk-distribution`);
    return res.json();
  },

  async getDashboardTrends(): Promise<{
    success: boolean;
    data: {
      highRiskByDay: { day: string; highRiskCount: number; interventionsLogged: number }[];
      attendanceTrend: { month: string; attendedRate: number; missedRate: number; interventionsRun: number }[];
      riskFactorsFrequency: { factor: string; count: number; impact: string }[];
      interventionSuccessChart: { type: string; attempted: number; confirmed: number; successRate: number }[];
    };
  }> {
    const res = await fetch(`${API_BASE}/dashboard/trends`);
    return res.json();
  },

  // Settings
  async getScoringConfig(): Promise<{ success: boolean; data: ScoringConfiguration }> {
    const res = await fetch(`${API_BASE}/settings/config`);
    return res.json();
  },

  async updateScoringConfig(config: ScoringConfiguration): Promise<{ success: boolean; data: ScoringConfiguration; message: string }> {
    const res = await fetch(`${API_BASE}/settings/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  // Demo Controls
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  },

  async generateDemoData(count: number): Promise<{ success: boolean; message: string; count: number }> {
    const res = await fetch(`${API_BASE}/demo/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    return res.json();
  },

  // AI Operations Assistant
  async askAssistant(message: string): Promise<{ success: boolean; reply: string }> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ success: boolean; data: AuditLog[] }> {
    const res = await fetch(`${API_BASE}/audit-logs`);
    return res.json();
  },
};

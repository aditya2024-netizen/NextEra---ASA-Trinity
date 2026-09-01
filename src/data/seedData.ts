import { Patient, Appointment, Intervention, StaffUser, AuditLog } from '../types';
import { calculatePatientRisk } from '../services/scoringEngine';

export const INDIAN_LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Marathi',
  'Bengali',
  'Kannada',
  'Punjabi',
  'Gujarati',
  'Malayalam',
  'Odia',
  'Urdu',
];

export const INDIAN_CITIES_PRESETS = [
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, distance: 42, locality: 'Satellite Road / Vastrapur Area' },
  { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, distance: 28, locality: 'Mayur Vihar / AIIMS Corridor' },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, distance: 35, locality: 'Vikas Nagar / KGMU Area' },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, distance: 19, locality: 'CIT Nagar / Rajiv Gandhi General Hospital' },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, distance: 14, locality: 'Jayanagar 4th Block / Victoria Hospital' },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, distance: 24, locality: 'Bandra West / KEM Hospital Area' },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, distance: 16, locality: 'Salt Lake Sector 1 / SSKM Hospital' },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, distance: 15, locality: 'Kothrud / Sassoon General Hospital' },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, distance: 22, locality: 'Banjara Hills / NIMS Area' },
  { city: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7333, lng: 76.7794, distance: 38, locality: 'Sector 8-B / PGIMER Corridor' },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, distance: 29, locality: 'Malviya Nagar / SMS Hospital' },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, distance: 26, locality: 'Edappally / Aster Medcity' },
];

export const SEED_USERS: StaffUser[] = [
  {
    id: 'USR-001',
    name: 'Dr. Rajesh Kulkarni, MD, DM',
    email: 'doctor@caretrack.in',
    role: 'DOCTOR',
    department: 'Cardiology & Outpatient Medicine',
    employeeId: 'DOC-MH-4421',
    phone: '+91 98201 12345',
  },
  {
    id: 'USR-002',
    name: 'Sister Meena Pillai, B.Sc RN',
    email: 'nurse@caretrack.in',
    role: 'NURSE',
    department: 'Outpatient Triage & Vitals',
    employeeId: 'NUR-TN-8890',
    phone: '+91 94441 55667',
  },
  {
    id: 'USR-003',
    name: 'Amit Verma',
    email: 'coordinator@caretrack.in',
    role: 'COORDINATOR',
    department: 'Hospital Follow-up & Outreach Desk',
    employeeId: 'STF-DL-1092',
    phone: '+91 98110 99887',
  },
  {
    id: 'USR-004',
    name: 'Shalini Roy',
    email: 'caremanager@caretrack.in',
    role: 'CARE_MANAGER',
    department: 'Chronic Care & Adherence Management',
    employeeId: 'MGR-WB-3341',
    phone: '+91 98300 44556',
  },
  {
    id: 'USR-005',
    name: 'Dr. Aruna Swaminathan, MD, MHA',
    email: 'admin@caretrack.in',
    role: 'ADMIN',
    department: 'Hospital Clinical Administration',
    employeeId: 'ADM-KA-0012',
    phone: '+91 98860 11223',
  },
];

// 10 Canonical Demonstration Patients (with P-1042 Priya Patel as the primary canonical benchmark)
export const CANONICAL_INDIAN_PATIENTS: Patient[] = [
  {
    id: 'PAT-1042',
    patientCode: 'P-1042',
    name: 'Priya Patel',
    age: 46,
    gender: 'Female',
    phone: '+91 98250 87654',
    email: 'priya.patel@example.in',
    address: 'Flat 304, Shivalik Heights, Satellite Road, Ahmedabad, Gujarat 380015',
    latitude: 23.0300,
    longitude: 72.5180,
    distanceKm: 42,
    condition: 'Post-CABG Cardiac Rehabilitation & Hypertension',
    treatmentType: 'Cardiology Post-Surgical Follow-up',
    treatmentStartDate: '2025-08-14',
    treatmentDurationMonths: 12,
    appointmentFrequencyDays: 60,
    totalAppointments: 12,
    attendedAppointments: 7,
    missedAppointments: 5,
    rescheduledAppointments: 2,
    attendanceRate: 58,
    nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    lastVisitDate: '2026-06-25',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Rajesh Kulkarni, DM',
    preferredLanguage: 'Gujarati',
    transportAccess: 'Requires Assistance',
    createdAt: '2025-08-14T09:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1041',
    patientCode: 'P-1041',
    name: 'Rajesh Sharma',
    age: 58,
    gender: 'Male',
    phone: '+91 98112 34567',
    email: 'rajesh.sharma@example.in',
    address: 'B-42, Pocket 1, Mayur Vihar Phase 1, New Delhi, Delhi 110091',
    latitude: 28.6080,
    longitude: 77.2960,
    distanceKm: 28,
    condition: 'Type 2 Diabetes Mellitus & Diabetic Nephropathy',
    treatmentType: 'Endocrinology & Renal Protection Protocol',
    treatmentStartDate: '2025-05-10',
    treatmentDurationMonths: 15,
    appointmentFrequencyDays: 45,
    totalAppointments: 10,
    attendedAppointments: 6,
    missedAppointments: 4,
    rescheduledAppointments: 1,
    attendanceRate: 60,
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-06-15',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Shalini Mukherjee, MD',
    preferredLanguage: 'Hindi',
    transportAccess: 'Requires Assistance',
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1043',
    patientCode: 'P-1043',
    name: 'Sunita Verma',
    age: 52,
    gender: 'Female',
    phone: '+91 94150 23489',
    email: 'sunita.verma@example.in',
    address: 'Sector 4, Vikas Nagar, Lucknow, Uttar Pradesh 226022',
    latitude: 26.8920,
    longitude: 80.9570,
    distanceKm: 35,
    condition: 'Rheumatoid Arthritis & Chronic Pain Management',
    treatmentType: 'Rheumatology Biological Therapy',
    treatmentStartDate: '2025-11-05',
    treatmentDurationMonths: 9,
    appointmentFrequencyDays: 30,
    totalAppointments: 8,
    attendedAppointments: 5,
    missedAppointments: 3,
    rescheduledAppointments: 1,
    attendanceRate: 62,
    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-07-20',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Arvind Sundaram, MD',
    preferredLanguage: 'Hindi',
    transportAccess: 'Public Transit',
    createdAt: '2025-11-05T10:15:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1044',
    patientCode: 'P-1044',
    name: 'Ramesh Iyer',
    age: 67,
    gender: 'Male',
    phone: '+91 94440 67890',
    email: 'ramesh.iyer@example.in',
    address: '18/4, 4th Cross Street, CIT Nagar, Nandanam, Chennai, Tamil Nadu 600035',
    latitude: 13.0270,
    longitude: 80.2340,
    distanceKm: 19,
    condition: 'Chronic Heart Failure (NYHA Class III)',
    treatmentType: 'Heart Failure Disease Management Program',
    treatmentStartDate: '2025-03-20',
    treatmentDurationMonths: 17,
    appointmentFrequencyDays: 45,
    totalAppointments: 14,
    attendedAppointments: 11,
    missedAppointments: 3,
    rescheduledAppointments: 1,
    attendanceRate: 78,
    nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-07-10',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Rajesh Kulkarni, DM',
    preferredLanguage: 'Tamil',
    transportAccess: 'Personal',
    createdAt: '2025-03-20T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1045',
    patientCode: 'P-1045',
    name: 'Ananya Banerjee',
    age: 34,
    gender: 'Female',
    phone: '+91 98311 44556',
    email: 'ananya.banerjee@example.in',
    address: 'Block CF-182, Sector 1, Salt Lake City, Bidhannagar, Kolkata, West Bengal 700064',
    latitude: 22.5860,
    longitude: 88.4110,
    distanceKm: 16,
    condition: 'Systemic Lupus Erythematosus (SLE) & Antiphospholipid Syndrome',
    treatmentType: 'Autoimmune & Immunosuppression Regimen',
    treatmentStartDate: '2026-01-15',
    treatmentDurationMonths: 7,
    appointmentFrequencyDays: 30,
    totalAppointments: 7,
    attendedAppointments: 6,
    missedAppointments: 1,
    rescheduledAppointments: 1,
    attendanceRate: 85,
    nextFollowUpDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-07-28',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Shalini Mukherjee, MD',
    preferredLanguage: 'Bengali',
    transportAccess: 'Public Transit',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1046',
    patientCode: 'P-1046',
    name: 'Gurpreet Singh',
    age: 61,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'gurpreet.singh@example.in',
    address: 'House 524, Sector 8-B, Chandigarh 160009',
    latitude: 30.7410,
    longitude: 76.7900,
    distanceKm: 38,
    condition: 'Chronic Obstructive Pulmonary Disease (COPD Gold Stage II)',
    treatmentType: 'Pulmonary Rehabilitation & Inhaler Therapy',
    treatmentStartDate: '2025-07-01',
    treatmentDurationMonths: 13,
    appointmentFrequencyDays: 60,
    totalAppointments: 9,
    attendedAppointments: 5,
    missedAppointments: 4,
    rescheduledAppointments: 1,
    attendanceRate: 55,
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-06-18',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Arvind Sundaram, MD',
    preferredLanguage: 'Punjabi',
    transportAccess: 'Requires Assistance',
    createdAt: '2025-07-01T14:20:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1047',
    patientCode: 'P-1047',
    name: 'Kavita Reddy',
    age: 42,
    gender: 'Female',
    phone: '+91 98490 88776',
    email: 'kavita.reddy@example.in',
    address: 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
    latitude: 17.4150,
    longitude: 78.4350,
    distanceKm: 8,
    condition: 'Hypothyroidism & Polycystic Ovarian Syndrome',
    treatmentType: 'Endocrine & Metabolic Care Protocol',
    treatmentStartDate: '2025-09-12',
    treatmentDurationMonths: 11,
    appointmentFrequencyDays: 90,
    totalAppointments: 4,
    attendedAppointments: 4,
    missedAppointments: 0,
    rescheduledAppointments: 0,
    attendanceRate: 100,
    nextFollowUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-06-01',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Shalini Mukherjee, MD',
    preferredLanguage: 'Telugu',
    transportAccess: 'Personal',
    createdAt: '2025-09-12T11:45:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1048',
    patientCode: 'P-1048',
    name: 'Deepak Joshi',
    age: 50,
    gender: 'Male',
    phone: '+91 98220 54321',
    email: 'deepak.joshi@example.in',
    address: 'Plot 45, Ideal Colony, Paud Road, Kothrud, Pune, Maharashtra 411038',
    latitude: 18.5070,
    longitude: 73.8070,
    distanceKm: 15,
    condition: 'Essential Hypertension & Dyslipidemia',
    treatmentType: 'Cardiovascular Risk Prevention Program',
    treatmentStartDate: '2026-02-10',
    treatmentDurationMonths: 6,
    appointmentFrequencyDays: 45,
    totalAppointments: 5,
    attendedAppointments: 4,
    missedAppointments: 1,
    rescheduledAppointments: 0,
    attendanceRate: 80,
    nextFollowUpDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-07-15',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Rajesh Kulkarni, DM',
    preferredLanguage: 'Marathi',
    transportAccess: 'Personal',
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1049',
    patientCode: 'P-1049',
    name: 'Lakshmi Narayanan',
    age: 72,
    gender: 'Female',
    phone: '+91 94470 12389',
    email: 'lakshmi.narayanan@example.in',
    address: '22/104, Toll Gate Junction, Edappally, Kochi, Kerala 682024',
    latitude: 10.0240,
    longitude: 76.3080,
    distanceKm: 26,
    condition: 'Osteoarthritis Bilateral Knee & Chronic Kidney Disease Stage 2',
    treatmentType: 'Orthopaedic Joint Preservation & Nephrology Check',
    treatmentStartDate: '2025-04-18',
    treatmentDurationMonths: 16,
    appointmentFrequencyDays: 60,
    totalAppointments: 9,
    attendedAppointments: 7,
    missedAppointments: 2,
    rescheduledAppointments: 1,
    attendanceRate: 77,
    nextFollowUpDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-07-02',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Arvind Sundaram, MD',
    preferredLanguage: 'Malayalam',
    transportAccess: 'Requires Assistance',
    createdAt: '2025-04-18T15:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAT-1050',
    patientCode: 'P-1050',
    name: 'Vikas Deshmukh',
    age: 39,
    gender: 'Male',
    phone: '+91 98230 77889',
    email: 'vikas.deshmukh@example.in',
    address: '11, Prabhat Road, Lane 4, Erandwane, Pune, Maharashtra 411004',
    latitude: 18.5150,
    longitude: 73.8320,
    distanceKm: 6,
    condition: 'Post-Percutaneous Coronary Intervention (PCI Stent)',
    treatmentType: 'Interventional Cardiology Post-Stent Surveillance',
    treatmentStartDate: '2026-03-01',
    treatmentDurationMonths: 5,
    appointmentFrequencyDays: 30,
    totalAppointments: 5,
    attendedAppointments: 5,
    missedAppointments: 0,
    rescheduledAppointments: 0,
    attendanceRate: 100,
    nextFollowUpDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastVisitDate: '2026-08-01',
    status: 'ACTIVE',
    assignedDoctor: 'Dr. Rajesh Kulkarni, DM',
    preferredLanguage: 'Marathi',
    transportAccess: 'Personal',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const FIRST_NAMES_MALE = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Kabir', 'Rohan', 'Manoj', 'Vikram', 'Sanjay', 'Sunil', 'Prakash', 'Amit', 'Anil', 'Naveen', 'Ashok', 'Suresh', 'Dinesh', 'Karan', 'Manish', 'Harish', 'Gopal', 'Madhav', 'Kishore', 'Alok', 'Mohit', 'Chetan', 'Sameer', 'Pankaj', 'Abhishek', 'Gaurav'];
const FIRST_NAMES_FEMALE = ['Aadhya', 'Saanvi', 'Ananya', 'Diya', 'Gauri', 'Anushka', 'Navya', 'Myra', 'Ira', 'Avani', 'Riya', 'Sara', 'Prisha', 'Aditi', 'Meera', 'Pooja', 'Deepa', 'Sneha', 'Rekha', 'Geeta', 'Neeta', 'Swati', 'Kavita', 'Shalini', 'Rashmi', 'Preeti', 'Sunita', 'Anita', 'Manju', 'Usha', 'Lalita', 'Shobha', 'Varsha', 'Anjali', 'Archana', 'Bhavna', 'Ritu', 'Sandhya', 'Madhu', 'Suman'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Deshmukh', 'Kulkarni', 'Iyer', 'Reddy', 'Rao', 'Nair', 'Banerjee', 'Chatterjee', 'Das', 'Sen', 'Ghosh', 'Mukherjee', 'Dutta', 'Chauhan', 'Yadav', 'Pandey', 'Mishra', 'Trivedi', 'Bhatt', 'Saxena', 'Kapoor', 'Malhotra', 'Bhatia', 'Sethi', 'Grover', 'Menon', 'Pillai', 'Shetty', 'Hegde', 'Gowda', 'Naidu', 'Choudhury', 'Aggarwal'];

const CLINICAL_CONDITIONS = [
  { condition: 'Type 2 Diabetes Mellitus & Hypertension', treatment: 'Endocrinology & Cardiology Co-care', doctor: 'Dr. Shalini Mukherjee, MD' },
  { condition: 'Post-CABG Cardiac Rehabilitation', treatment: 'Cardiology Post-Surgical Follow-up', doctor: 'Dr. Rajesh Kulkarni, DM' },
  { condition: 'Chronic Kidney Disease (Stage 3)', treatment: 'Nephrology & Renal Protection Care', doctor: 'Dr. Arvind Sundaram, MD' },
  { condition: 'COPD & Bronchial Asthma Protocol', treatment: 'Pulmonology Outpatient Care', doctor: 'Dr. Arvind Sundaram, MD' },
  { condition: 'Rheumatoid Arthritis on Immunomodulators', treatment: 'Rheumatology Disease Management', doctor: 'Dr. Shalini Mukherjee, MD' },
  { condition: 'Post-PCI Stent Surveillance', treatment: 'Interventional Cardiology Care', doctor: 'Dr. Rajesh Kulkarni, DM' },
  { condition: 'Chronic Heart Failure (NYHA Class II-III)', treatment: 'Heart Failure Care Program', doctor: 'Dr. Rajesh Kulkarni, DM' },
  { condition: 'Essential Hypertension & Hyperlipidemia', treatment: 'Preventive Medicine & Lipid Clinic', doctor: 'Dr. Shalini Mukherjee, MD' },
];

/**
 * Generate full synthetic cohort of exactly `totalCount` patients
 * 10 Canonical Patients + (totalCount - 10) Realistic Synthetic Patients = totalCount
 */
export function generateSyntheticDataset(totalCount: number = 1000) {
  const patients: Patient[] = [...CANONICAL_INDIAN_PATIENTS];
  const appointments: Appointment[] = [];
  const interventions: Intervention[] = [];
  const auditLogs: AuditLog[] = [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      staffName: 'Dr. Aruna Swaminathan, MD',
      staffRole: 'ADMIN',
      action: 'Risk Thresholds Configuration Calibrated',
      details: 'Calibrated High Risk cutoff threshold to 60 pts and Missed Visits weight to 40 pts.',
    },
    {
      id: 'AUD-002',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      staffName: 'Sister Meena Pillai, RN',
      staffRole: 'NURSE',
      action: 'High-Risk Priority Triage',
      details: 'Reviewed Priority Queue and initiated phone outreach for Priya Patel (P-1042).',
    },
    {
      id: 'AUD-003',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      staffName: 'Amit Verma',
      staffRole: 'COORDINATOR',
      action: 'Outreach Intervention Logged',
      details: 'Logged Priority Phone Call outreach attempt for Priya Patel (P-1042).',
    },
  ];

  const neededSynthetic = Math.max(0, totalCount - patients.length);

  for (let idx = 0; idx < neededSynthetic; idx++) {
    const codeNum = 1051 + idx;
    const isMale = idx % 2 === 0;
    const firstName = isMale 
      ? FIRST_NAMES_MALE[idx % FIRST_NAMES_MALE.length] 
      : FIRST_NAMES_FEMALE[idx % FIRST_NAMES_FEMALE.length];
    const lastName = LAST_NAMES[(idx * 7) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const cityPreset = INDIAN_CITIES_PRESETS[idx % INDIAN_CITIES_PRESETS.length];
    const lang = INDIAN_LANGUAGES[idx % INDIAN_LANGUAGES.length];
    const clinical = CLINICAL_CONDITIONS[idx % CLINICAL_CONDITIONS.length];

    // Stratify patient risk distribution: ~18% High, ~42% Medium, ~40% Low
    const bucket = idx % 100;
    let missedAppointments = 0;
    let totalAppointments = 0;
    let attendedAppointments = 0;
    let distanceKm = 0;
    let appointmentFrequencyDays = 30;
    let treatmentDurationMonths = 6;

    if (bucket < 18) {
      // High risk tier
      missedAppointments = 3 + (idx % 4); // 3 to 6 missed
      totalAppointments = missedAppointments + 4 + (idx % 6);
      attendedAppointments = totalAppointments - missedAppointments;
      distanceKm = 30 + ((idx * 3) % 45); // 30 to 75 km
      appointmentFrequencyDays = 60 + ((idx * 15) % 45); // 60 to 90 days
      treatmentDurationMonths = 12 + ((idx * 2) % 18); // 12 to 30 months
    } else if (bucket < 60) {
      // Medium risk tier
      missedAppointments = 1 + (idx % 2); // 1 to 2 missed
      totalAppointments = missedAppointments + 4 + (idx % 5);
      attendedAppointments = totalAppointments - missedAppointments;
      distanceKm = 15 + ((idx * 2) % 25); // 15 to 40 km
      appointmentFrequencyDays = 30 + ((idx * 15) % 35); // 30 to 60 days
      treatmentDurationMonths = 6 + (idx % 12); // 6 to 18 months
    } else {
      // Low risk tier
      missedAppointments = 0;
      totalAppointments = 3 + (idx % 8);
      attendedAppointments = totalAppointments;
      distanceKm = 3 + (idx % 14); // 3 to 17 km
      appointmentFrequencyDays = 15 + ((idx * 15) % 30); // 15 to 45 days
      treatmentDurationMonths = 3 + (idx % 9); // 3 to 12 months
    }

    const attendanceRate = totalAppointments > 0 
      ? Math.round((attendedAppointments / totalAppointments) * 100) 
      : 100;

    const daysUntilDue = (idx % 28) - 2; // Some overdue, some today, mostly upcoming next 1-25 days
    const nextFollowUpDate = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastVisitDate = new Date(Date.now() - (appointmentFrequencyDays + (idx % 10)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const patient: Patient = {
      id: `PAT-${codeNum}`,
      patientCode: `P-${codeNum}`,
      name,
      age: 28 + ((idx * 3) % 52), // 28 to 80
      gender: isMale ? 'Male' : 'Female',
      phone: `+91 ${98000 + (idx % 1999)} ${String(10000 + (idx * 37) % 89999)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@example.in`,
      address: `${10 + (idx % 90)}, ${cityPreset.locality}, ${cityPreset.city}, ${cityPreset.state}`,
      latitude: cityPreset.lat + ((idx % 20) - 10) * 0.005,
      longitude: cityPreset.lng + ((idx % 20) - 10) * 0.005,
      distanceKm,
      condition: clinical.condition,
      treatmentType: clinical.treatment,
      treatmentStartDate: new Date(Date.now() - treatmentDurationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      treatmentDurationMonths,
      appointmentFrequencyDays,
      totalAppointments,
      attendedAppointments,
      missedAppointments,
      rescheduledAppointments: Math.floor(missedAppointments / 2),
      attendanceRate,
      nextFollowUpDate,
      lastVisitDate,
      status: 'ACTIVE',
      assignedDoctor: clinical.doctor,
      preferredLanguage: lang,
      transportAccess: distanceKm > 30 ? 'Requires Assistance' : distanceKm > 15 ? 'Public Transit' : 'Personal',
      createdAt: new Date(Date.now() - treatmentDurationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    patients.push(patient);
  }

  // Generate historical appointment logs & compute risk predictions for all patients
  patients.forEach((patient, pIdx) => {
    const total = patient.totalAppointments;
    const missed = patient.missedAppointments;
    let missedAssigned = 0;

    for (let i = 1; i <= total; i++) {
      const daysAgo = (total - i + 1) * patient.appointmentFrequencyDays;
      const apptDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let status: 'COMPLETED' | 'MISSED' | 'RESCHEDULED' = 'COMPLETED';
      if (missedAssigned < missed && (i === 2 || i === 4 || i === 7 || i === total - 1)) {
        status = 'MISSED';
        missedAssigned++;
      } else if (i === 3 && patient.rescheduledAppointments > 0) {
        status = 'RESCHEDULED';
      }

      appointments.push({
        id: `APT-${patient.patientCode}-${i}`,
        patientId: patient.id,
        appointmentDate: apptDate,
        department: patient.treatmentType,
        doctorName: patient.assignedDoctor,
        status,
        notes: status === 'MISSED' 
          ? 'Patient missed scheduled outpatient consultation without notification.' 
          : 'In-clinic routine consultation completed.',
      });
    }

    // Attach calculated risk prediction
    patient.currentRisk = calculatePatientRisk(patient);

    // Populate realistic interventions for high, critical & selected medium risk cohorts
    if (patient.currentRisk.riskLevel === 'HIGH' || patient.currentRisk.riskLevel === 'CRITICAL') {
      const isCanonicalPriya = patient.patientCode === 'P-1042';
      const interventionStatus: Intervention['status'] = isCanonicalPriya 
        ? 'Pending' 
        : (pIdx % 4 === 0 ? 'Completed' : pIdx % 4 === 1 ? 'Contacted' : pIdx % 4 === 2 ? 'Confirmed' : 'Pending');

      const intervention: Intervention = {
        id: `INT-${patient.patientCode}-01`,
        patientId: patient.id,
        patientCode: patient.patientCode,
        patientName: patient.name,
        predictionId: patient.currentRisk.id,
        staffId: 'USR-003',
        staffName: 'Amit Verma',
        staffRole: 'COORDINATOR',
        type: patient.distanceKm >= 35 ? 'Teleconsultation Offer' : 'Priority Phone Call',
        status: interventionStatus,
        reason: `${patient.missedAppointments} missed follow-ups recorded. Patient lives ${patient.distanceKm} km away.`,
        notes: isCanonicalPriya
          ? 'Pending priority phone call: Patient due tomorrow with 5 missed appointments history and 42 km transit barrier.'
          : interventionStatus === 'Confirmed'
          ? 'Phone outreach completed. Patient confirmed appointment attendance.'
          : interventionStatus === 'Completed'
          ? 'Follow-up consultation successfully conducted.'
          : 'Pending outreach dispatch.',
        patientConfirmedNextVisit: interventionStatus === 'Confirmed' || interventionStatus === 'Completed',
        createdAt: new Date(Date.now() - (pIdx % 7) * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: interventionStatus === 'Completed' ? new Date().toISOString() : undefined,
      };

      interventions.push(intervention);
      patient.latestIntervention = intervention;
    } else if (patient.currentRisk.riskLevel === 'MEDIUM' && pIdx % 3 === 0) {
      const intervention: Intervention = {
        id: `INT-${patient.patientCode}-01`,
        patientId: patient.id,
        patientCode: patient.patientCode,
        patientName: patient.name,
        predictionId: patient.currentRisk.id,
        staffId: 'USR-002',
        staffName: 'Sister Meena Pillai, RN',
        staffRole: 'NURSE',
        type: 'SMS Reminder',
        status: 'Completed',
        reason: 'Automated 48h appointment reminder dispatch.',
        notes: 'Two-way SMS reminder sent. Automated confirmation logged.',
        patientConfirmedNextVisit: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      };
      interventions.push(intervention);
      patient.latestIntervention = intervention;
    }
  });

  return { patients, appointments, interventions, auditLogs };
}

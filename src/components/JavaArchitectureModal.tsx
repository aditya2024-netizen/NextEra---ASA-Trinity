import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Code, Copy, Check, FileCode, Server, Database, Shield, Cpu, Terminal } from 'lucide-react';

export const JavaArchitectureModal: React.FC = () => {
  const { isJavaModalOpen, setIsJavaModalOpen } = useApp();
  const [selectedFile, setSelectedFile] = useState<string>('RiskPredictionEngine.java');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isJavaModalOpen) return null;

  const javaFiles: Record<string, { category: string; description: string; code: string }> = {
    'RiskPredictionEngine.java': {
      category: 'AI & Prediction Engine',
      description: 'Java 21 Explainable weighted risk calculation engine with normalized 0-100 scoring and factor attribution.',
      code: `package com.healthcare.followup.ai;

import com.healthcare.followup.dto.PredictionRequest;
import com.healthcare.followup.dto.PredictionResponse;
import com.healthcare.followup.dto.RiskFactorDto;
import com.healthcare.followup.config.ScoringProperties;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RuleBasedRiskPredictionEngine implements RiskPredictionEngine {

    private final ScoringProperties scoringProperties;

    public RuleBasedRiskPredictionEngine(ScoringProperties scoringProperties) {
        this.scoringProperties = scoringProperties;
    }

    @Override
    public PredictionResponse calculateRisk(PredictionRequest req) {
        List<RiskFactorDto> factors = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        List<String> protectiveFactors = new ArrayList<>();
        List<String> actions = new ArrayList<>();

        int total = Math.max(1, req.totalAppointments());
        int missed = req.missedAppointments();
        int attended = Math.max(0, total - missed);
        int attendanceRate = (int) Math.round(((double) attended / total) * 100);

        // Factor 1: Missed Appointments (Max 40 pts)
        int missedPoints = switch (missed) {
            case 0 -> 0;
            case 1 -> 10;
            case 2 -> 20;
            case 3 -> 30;
            default -> 40;
        };
        factors.add(new RiskFactorDto("Missed Appointments", missed + " missed", missedPoints, 40, 
            missedPoints >= 25 ? "HIGH" : missedPoints >= 10 ? "MEDIUM" : "LOW"));
        if (missed >= 3) reasons.add(missed + " previous follow-up appointments were missed");
        else if (missed == 0) protectiveFactors.add("Zero previous missed appointments");

        // Factor 2: Distance from Hospital (Max 20 pts)
        int distPoints = req.distanceKm() < 5 ? 0 : req.distanceKm() <= 15 ? 5 : req.distanceKm() <= 30 ? 10 : req.distanceKm() <= 50 ? 15 : 20;
        factors.add(new RiskFactorDto("Hospital Distance", req.distanceKm() + " km", distPoints, 20, 
            distPoints >= 15 ? "HIGH" : "LOW"));
        if (req.distanceKm() >= 30) reasons.add("Patient lives " + req.distanceKm() + " km from hospital");
        else if (req.distanceKm() < 10) protectiveFactors.add("Lives in close proximity (<10 km)");

        // Factor 3: Historical Attendance Rate (Max 25 pts)
        int attPoints = attendanceRate >= 95 ? 0 : attendanceRate >= 80 ? 6 : attendanceRate >= 65 ? 14 : attendanceRate >= 50 ? 20 : 25;
        factors.add(new RiskFactorDto("Attendance History", attendanceRate + "%", attPoints, 25, 
            attPoints >= 18 ? "HIGH" : "LOW"));
        if (attendanceRate < 70) reasons.add("Historical attendance rate is low (" + attendanceRate + "%)");

        // Factor 4: Treatment Duration Fatigue (Max 10 pts)
        int durPoints = req.treatmentDurationMonths() > 18 ? 10 : req.treatmentDurationMonths() >= 9 ? 7 : req.treatmentDurationMonths() >= 4 ? 4 : 1;
        factors.add(new RiskFactorDto("Treatment Duration", req.treatmentDurationMonths() + " mos", durPoints, 10, "LOW"));

        // Factor 5: Appointment Cadence (Max 5 pts)
        int freqPoints = req.appointmentFrequencyDays() > 90 ? 5 : req.appointmentFrequencyDays() > 45 ? 3 : 0;
        factors.add(new RiskFactorDto("Follow-up Cadence", "Every " + req.appointmentFrequencyDays() + "d", freqPoints, 5, "LOW"));

        int totalScore = Math.min(100, Math.max(0, missedPoints + distPoints + attPoints + durPoints + freqPoints));
        String riskLevel = totalScore >= 60 ? "HIGH" : totalScore >= 30 ? "MEDIUM" : "LOW";

        String immediateAction = switch (riskLevel) {
            case "HIGH" -> (distPoints >= 15) ? "Offer Remote Teleconsultation / Virtual Visit" : "Priority Phone Call with Clinical Staff";
            case "MEDIUM" -> "Two-Way SMS Confirmation + Telehealth Option";
            default -> "Standard Automated SMS Reminder (24h Prior)";
        };
        actions.add(immediateAction);

        return new PredictionResponse(
            "PRED-" + System.currentTimeMillis(),
            req.patientId(),
            totalScore,
            riskLevel,
            0.87,
            reasons,
            protectiveFactors,
            actions,
            immediateAction,
            factors
        );
    }
}`
    },
    'Patient.java': {
      category: 'JPA Entities',
      description: 'Jakarta Persistence Entity mapped to MySQL with audit timestamps, indexes, and relationship cascades.',
      code: `package com.healthcare.followup.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients", indexes = {
    @Index(name = "idx_patient_code", columnList = "patient_code"),
    @Index(name = "idx_next_follow_up", columnList = "next_follow_up_date"),
    @Index(name = "idx_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_code", unique = true, nullable = false, length = 32)
    private String patientCode;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private Integer age;

    @Column(length = 16)
    private String gender;

    @Column(length = 32)
    private String phone;

    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    @Column(name = "treatment_type", length = 128)
    private String treatmentType;

    @Column(name = "treatment_start_date")
    private LocalDate treatmentStartDate;

    @Column(name = "treatment_duration_months")
    private Integer treatmentDurationMonths;

    @Column(name = "appointment_frequency_days")
    private Integer appointmentFrequencyDays;

    @Column(name = "total_appointments")
    private Integer totalAppointments;

    @Column(name = "attended_appointments")
    private Integer attendedAppointments;

    @Column(name = "missed_appointments")
    private Integer missedAppointments;

    @Column(name = "next_follow_up_date")
    private LocalDate nextFollowUpDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PatientStatus status;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RiskPrediction> predictions = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Intervention> interventions = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}`
    },
    'PredictionController.java': {
      category: 'REST Controllers',
      description: 'Spring Web REST API handling risk predictions, batch ranking, and explainability payloads.',
      code: `package com.healthcare.followup.controller;

import com.healthcare.followup.dto.PredictionRequest;
import com.healthcare.followup.dto.PredictionResponse;
import com.healthcare.followup.service.PredictionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predictRisk(@Valid @RequestBody PredictionRequest request) {
        PredictionResponse response = predictionService.generatePrediction(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patients/{patientId}/risk")
    public ResponseEntity<PredictionResponse> getPatientCurrentRisk(@PathVariable Long patientId) {
        return ResponseEntity.ok(predictionService.getLatestRiskForPatient(patientId));
    }
}`
    },
    'PredictionEngineTest.java': {
      category: 'JUnit 5 & Mockito Tests',
      description: 'Unit test suite validating 0 missed (LOW), 2 missed (MED), and 4 missed (HIGH) scenarios.',
      code: `package com.healthcare.followup.ai;

import com.healthcare.followup.config.ScoringProperties;
import com.healthcare.followup.dto.PredictionRequest;
import com.healthcare.followup.dto.PredictionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PredictionEngineTest {

    private RuleBasedRiskPredictionEngine engine;

    @BeforeEach
    void setUp() {
        ScoringProperties properties = new ScoringProperties();
        engine = new RuleBasedRiskPredictionEngine(properties);
    }

    @Test
    @DisplayName("Test 1: 0 missed visits, short distance, 100% attendance -> LOW RISK")
    void testLowRiskScenario() {
        PredictionRequest request = new PredictionRequest("P-1205", 48, 6.0, 16, 0, 90, 6, 6);
        PredictionResponse response = engine.calculateRisk(request);

        assertTrue(response.riskScore() <= 29, "Score should be in LOW risk range (0-29)");
        assertEquals("LOW", response.riskLevel());
        assertTrue(response.protectiveFactors().contains("Zero previous missed appointments"));
    }

    @Test
    @DisplayName("Test 2: 2 missed visits, 18 km distance, 78% attendance -> MEDIUM RISK")
    void testMediumRiskScenario() {
        PredictionRequest request = new PredictionRequest("P-1132", 39, 18.0, 7, 2, 30, 9, 7);
        PredictionResponse response = engine.calculateRisk(request);

        assertTrue(response.riskScore() >= 30 && response.riskScore() <= 59, "Score should be in MEDIUM range");
        assertEquals("MEDIUM", response.riskLevel());
    }

    @Test
    @DisplayName("Test 3: 4 missed visits, 47 km distance, 58% attendance -> HIGH RISK (Score ~88)")
    void testHighRiskScenario() {
        PredictionRequest request = new PredictionRequest("P-1042", 64, 47.0, 14, 4, 60, 12, 7);
        PredictionResponse response = engine.calculateRisk(request);

        assertTrue(response.riskScore() >= 60, "Score should be in HIGH risk range");
        assertEquals("HIGH", response.riskLevel());
        assertTrue(response.reasons().stream().anyMatch(r -> r.contains("4 previous follow-up appointments were missed")));
    }
}`
    },
    'docker-compose.yml': {
      category: 'Deployment & Docker',
      description: 'Multi-container orchestration for Spring Boot 3 backend, React frontend, and MySQL 8 database.',
      code: `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: caretrack-mysql
    environment:
      MYSQL_DATABASE: caretrack_db
      MYSQL_USER: caretrack_user
      MYSQL_PASSWORD: caretrack_password
      MYSQL_ROOT_PASSWORD: root_secure_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: caretrack-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/caretrack_db?useSSL=false&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: caretrack_user
      SPRING_DATASOURCE_PASSWORD: caretrack_password
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
    ports:
      - "8080:8080"
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: caretrack-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mysql_data:`
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(javaFiles[selectedFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-950 text-slate-100 rounded-2xl max-w-5xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400 font-mono font-bold">
              ☕
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Java 21 & Spring Boot 3 Architecture Inspector
                <span className="px-2 py-0.5 rounded bg-blue-900/80 text-blue-300 text-[10px] font-mono border border-blue-700">
                  Production-Ready Reference
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Enterprise package structure: com.healthcare.followup.* with JPA, Security, REST, AI scoring, and JUnit tests.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsJavaModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar File Tree + Code Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Selection Sidebar */}
          <div className="w-full md:w-72 bg-slate-900/90 border-r border-slate-800 p-3 space-y-1.5 overflow-y-auto text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2 mb-1">
              Backend Architecture Files
            </span>
            {Object.entries(javaFiles).map(([filename, meta]) => (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`w-full text-left px-3 py-2 rounded-lg font-mono transition-colors flex items-center gap-2 ${
                  selectedFile === filename
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{filename}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
            {/* File Meta Header */}
            <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-cyan-300 font-bold">{selectedFile}</span>
                <span className="text-slate-500 ml-2">({javaFiles[selectedFile].category})</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{javaFiles[selectedFile].description}</p>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-mono text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 leading-relaxed">
              <pre className="whitespace-pre">{javaFiles[selectedFile].code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

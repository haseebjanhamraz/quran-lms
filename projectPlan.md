Software Requirements Specification (Updated)
Online Class Recording & AI Evaluation Platform
Executive Summary
This system provides online classes, attendance tracking, recording management, transcript
generation, AI-powered post-class evaluation, and automated reporting. The platform does not
perform real-time monitoring. All analysis occurs after class completion.
Project Objectives
Provide a scalable online learning platform, generate AI-powered class evaluation reports, ensure
teaching quality, detect policy violations, and maintain complete class records.
System Scope
The platform supports scheduling, video classes, attendance, recording, transcript generation, AI
analysis, report generation, and administrative review.
User Roles
Admin, Teacher, Student, Compliance Reviewer.
High-Level Workflow
Class Starts ® Recording ® Google Drive Upload ® Audio Extraction ® Speech-to-Text ® AI
Analysis ® Report Generation ® Admin Review.
Functional Requirements
FR-01 Authentication & Authorization
FR-02 Course Management
FR-03 Student Enrollment
FR-04 Class Scheduling
FR-05 Live Video Classes via LiveKit
FR-06 Attendance Tracking
FR-07 Session Recording
FR-08 Google Drive Storage
FR-09 Transcript Generation
FR-10 AI Transcript Analysis
FR-11 Automated Report Generation
FR-12 PDF Export
FR-13 Admin Review Dashboard
Use Cases
UC-01 Login
UC-02 Create Course
UC-03 Schedule Class
UC-04 Start Class
UC-05 Join Class
UC-06 Record Class
UC-07 Upload Recording
UC-08 Generate Transcript
UC-09 Analyze Transcript
UC-10 Generate AI Report
UC-11 Review Reports
UC-12 Export PDF
Technology Stack
Frontend: Next.js 15
Backend: NestJS
Database: PostgreSQL + Prisma
Video Platform: LiveKit
Queue: Redis + BullMQ
Storage: Google Drive API
Speech-to-Text: Whisper / Google STT
AI Analysis: Gemini / OpenAI
Reverse Proxy: Nginx
Frontend Requirements
Role-based dashboards, responsive design, class scheduling interface, recording access, report
viewing, transcript viewer, PDF export, dark mode support.
Backend Modules
Authentication Module
User Management Module
Course Module
Enrollment Module
Class Scheduling Module
Attendance Module
Recording Module
Google Drive Module
Transcript Module
AI Analysis Module
Report Module
Notification Module
Database Design
User
Course
Enrollment
ClassSession
Attendance
Recording
TranscriptSegment
AIReport
Violation
Notification
AuditLog
Attendance Requirements
Track:
- Join Time
- Leave Time
- Total Attendance Duration
- Student Attendance Percentage
- Teacher Attendance Duration
Recording Requirements
Automatically record every class.
Store metadata.
Upload recordings to Google Drive.
Maintain recording statuses:
PROCESSING
UPLOADING
READY
FAILED
Google Drive Requirements
Create folders automatically.
Upload recordings.
Save file IDs and shareable URLs.
Retry failed uploads.
Remove local temporary files after success.
Speech-to-Text Pipeline
Extract audio using FFmpeg.
Convert audio to text.
Store transcript with timestamps.
Support large recordings.
Support multiple languages.
AI Analysis Requirements
Analyze transcript after class completion.
Detect:
- Phone numbers
- Email addresses
- WhatsApp numbers
- Social media sharing
- Off-topic discussion
- Inappropriate language
- Missing educational content
- Excessive non-academic discussion
Generate:
- Risk score
- Teaching quality score
- Topic relevance score
- Summary
- Recommendations
AI Report Structure
Class Information
Teacher Information
Attendance Summary
Class Duration
Transcript Summary
Main Topics Covered
Off-topic Analysis
Contact Sharing Detection
Compliance Findings
Teaching Quality Assessment
Student Engagement Assessment
Recommendations
Final Score
Google Drive Recording Link
Admin Dashboard
View Reports
Search Reports
Filter Reports
Review Violations
Download PDFs
Access Recordings
View Attendance Statistics
Teacher Dashboard
Upcoming Classes
Previous Classes
Recording History
Generated Reports
Attendance Statistics
Student Dashboard
Upcoming Classes
Join Classes
Attendance History
Recording Access
Security Requirements
JWT Authentication
RBAC Authorization
TLS Encryption
Rate Limiting
Audit Logging
Secure Secret Storage
Data Encryption at Rest
Performance Requirements
Support 1000+ concurrent users.
Dashboard load time under 2 seconds.
Report generation under 5 minutes after class completion.
Docker Architecture
Next.js Container
NestJS Container
PostgreSQL Container
Redis Container
LiveKit Container
Worker Container
Nginx Container
CI/CD Pipeline
GitHub Actions
Linting
Unit Tests
Integration Tests
Docker Build
Security Scan
Staging Deployment
Production Deployment
Monitoring & Logging
Prometheus
Grafana
Loki
Health Checks
Error Tracking
Deployment Strategy
Development Environment
Staging Environment
Production Environment
Automated migrations.
Automated backups.
SSL certificates.
Monitoring setup.
Testing Strategy
Unit Testing
Integration Testing
E2E Testing
Load Testing
Security Testing
User Acceptance Testing
Development Roadmap
Phase 1: Foundation & Authentication
Phase 2: Scheduling & Enrollment
Phase 3: LiveKit Integration
Phase 4: Recording & Google Drive
Phase 5: Attendance Tracking
Phase 6: Speech-to-Text Pipeline
Phase 7: AI Analysis Engine
Phase 8: Report Generation
Phase 9: Dashboard & Exports
Phase 10: Production Deployment
Acceptance Criteria
Admin can create classes.
Teachers can host classes.
Students can attend classes.
Recordings upload successfully.
Transcripts generate automatically.
AI reports generate after every class.
Reports are visible to admins.
PDF exports work.
System deploys successfully to production.
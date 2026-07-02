import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReportPDF(sessionId: string): Promise<Buffer> {
    this.logger.log(`Generating PDF report for session: ${sessionId}`);

    const report = await this.prisma.aIReport.findUnique({
      where: { sessionId },
      include: {
        violations: true,
        session: {
          include: {
            course: {
              include: {
                teacher: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('AI Evaluation Report not found for this session');
    }

    const { session } = report;
    const { course } = session;
    const { teacher } = course;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => {
          this.logger.error(`PDFKit generation error: ${err.message}`);
          reject(err);
        });

        // ── Header Style ──
        doc.fillColor('#0a2e2b')
           .rect(0, 0, doc.page.width, 100)
           .fill();

        doc.fillColor('#C9A84C')
           .font('Helvetica-Bold')
           .fontSize(22)
           .text('QURAN LMS COMPLIANCE PORTAL', 50, 30);

        doc.fillColor('#ffffff')
           .font('Helvetica')
           .fontSize(10)
           .text('AUTOMATED QUALITY ASSURANCE AUDIT SCORECARD', 50, 60);

        // ── Metadata Section ──
        doc.y = 130;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('1. Class Session Information', 50, doc.y);

        doc.strokeColor('#cbd5e1')
           .lineWidth(1)
           .moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        doc.y = 160;
        doc.fillColor('#0f172a')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('Course Title: ', 50, doc.y)
           .font('Helvetica')
           .text(course.title, 150, doc.y);

        doc.y = 180;
        doc.font('Helvetica-Bold')
           .text('Instructor: ', 50, doc.y)
           .font('Helvetica')
           .text(`${teacher.name} (${teacher.email})`, 150, doc.y);

        doc.y = 200;
        doc.font('Helvetica-Bold')
           .text('Session ID: ', 50, doc.y)
           .font('Helvetica')
           .text(sessionId, 150, doc.y);

        doc.y = 220;
        doc.font('Helvetica-Bold')
           .text('Session Date: ', 50, doc.y)
           .font('Helvetica')
           .text(new Date(session.scheduledAt).toLocaleString(), 150, doc.y);

        doc.y = 240;
        doc.font('Helvetica-Bold')
           .text('Duration: ', 50, doc.y)
           .font('Helvetica')
           .text(`${session.durationMinutes} minutes`, 150, doc.y);

        // ── Scores Section ──
        doc.y = 280;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('2. Evaluation Metrics', 50, doc.y);

        doc.strokeColor('#cbd5e1')
           .moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        doc.y = 310;
        // Draw risk score box
        const riskColor = report.riskScore >= 60 ? '#ef4444' : report.riskScore >= 20 ? '#f59e0b' : '#10b981';
        doc.fillColor('#f8fafc')
           .rect(50, doc.y, 150, 60)
           .fill();
        doc.strokeColor('#cbd5e1')
           .rect(50, doc.y, 150, 60)
           .stroke();
        doc.fillColor('#64748b')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text('COMPLIANCE RISK RATE', 65, doc.y + 12);
        doc.fillColor(riskColor)
           .fontSize(18)
           .text(`${report.riskScore.toFixed(0)}%`, 65, doc.y + 25);

        // Draw teaching quality box
        doc.fillColor('#f8fafc')
           .rect(215, doc.y, 150, 60)
           .fill();
        doc.strokeColor('#cbd5e1')
           .rect(215, doc.y, 150, 60)
           .stroke();
        doc.fillColor('#64748b')
           .fontSize(9)
           .text('TEACHING QUALITY', 230, doc.y + 12);
        doc.fillColor('#3b82f6')
           .fontSize(18)
           .text(`${report.teachingQualityScore.toFixed(1)} / 5.0`, 230, doc.y + 25);

        // Draw topic relevance box
        doc.fillColor('#f8fafc')
           .rect(380, doc.y, 170, 60)
           .fill();
        doc.strokeColor('#cbd5e1')
           .rect(380, doc.y, 170, 60)
           .stroke();
        doc.fillColor('#64748b')
           .fontSize(9)
           .text('TOPIC RELEVANCE RATE', 395, doc.y + 12);
        doc.fillColor('#6366f1')
           .fontSize(18)
           .text(`${report.topicRelevanceScore.toFixed(1)} / 5.0`, 395, doc.y + 25);

        // ── Summary Section ──
        doc.y = 400;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('3. Summary of Findings', 50, doc.y);

        doc.strokeColor('#cbd5e1')
           .moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        doc.y = 425;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('Class Summary:')
           .font('Helvetica')
           .fillColor('#0f172a')
           .text(report.summary, { width: 500, align: 'justify' });

        doc.y = doc.y + 15;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .text('Compliance Findings:')
           .font('Helvetica')
           .fillColor('#0f172a')
           .text(report.complianceFindings, { width: 500, align: 'justify' });

        // ── Violations Section ──
        doc.y = doc.y + 25;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('4. Compliance Policy Violations Log', 50, doc.y);

        doc.strokeColor('#cbd5e1')
           .moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        doc.y = doc.y + 20;
        if (report.violations.length === 0) {
          doc.fillColor('#10b981')
             .font('Helvetica-Bold')
             .fontSize(10)
             .text('No safety or policy infractions detected in this class session.', 50, doc.y);
        } else {
          for (const v of report.violations) {
            const vColor = v.severity === 'HIGH' ? '#ef4444' : v.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6';
            doc.fillColor(vColor)
               .font('Helvetica-Bold')
               .fontSize(10)
               .text(`[${v.severity} SEVERITY] ${v.type.replace(/_/g, ' ')}`, 50, doc.y);
            doc.fillColor('#475569')
               .font('Helvetica-Oblique')
               .fontSize(9)
               .text(`Evidence: ${v.evidence}`, 60, doc.y + 13, { width: 490 });
            doc.y = doc.y + 35;
          }
        }

        // ── Recommendations Section ──
        doc.y = Math.max(doc.y + 10, 580);
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('5. Quality Assessments & Recommendations', 50, doc.y);

        doc.strokeColor('#cbd5e1')
           .moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        doc.y = doc.y + 15;
        doc.fillColor('#334155')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('Recommendations:')
           .font('Helvetica')
           .fillColor('#0f172a')
           .text(report.recommendations, { width: 500, align: 'justify' });

        // ── Footer ──
        const bottomY = doc.page.height - 40;
        doc.strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .moveTo(50, bottomY - 10)
           .lineTo(550, bottomY - 10)
           .stroke();
        doc.fillColor('#94a3b8')
           .font('Helvetica')
           .fontSize(8)
           .text('Generated automatically by Quran LMS Quality Auditing Engine. Confidential Audit Document.', 50, bottomY, { align: 'center', width: 500 });

        doc.end();
      } catch (err: any) {
        this.logger.error(`Error in PDF write process: ${err.message}`);
        reject(err);
      }
    });
  }
}

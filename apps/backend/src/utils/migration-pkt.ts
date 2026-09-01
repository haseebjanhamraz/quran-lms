import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassSession, ClassSessionDocument, ClassStatus } from '../schemas';
import { formatPKTTime, getPKTDateParts, ISLAMABAD_TIMEZONE } from './islamabad-time';

/**
 * Migration script to ensure all existing sessions have:
 * - timezone: 'Asia/Karachi'
 * - scheduledTimePKT: 'HH:MM'
 */
async function runMigration() {
  console.log('🚀 Initializing Islamabad Timezone (PKT) Migration...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const classSessionModel = app.get<Model<ClassSessionDocument>>(getModelToken(ClassSession.name));

  const sessions = await classSessionModel.find({
    status: { $in: [ClassStatus.SCHEDULED, ClassStatus.ACTIVATED] },
  });

  console.log(`Found ${sessions.length} upcoming/active sessions to verify.`);

  let updatedCount = 0;
  for (const session of sessions) {
    const scheduledDate = new Date(session.scheduledAt);
    const pktTime = formatPKTTime(scheduledDate);
    const needsUpdate = !session.timezone || session.timezone !== ISLAMABAD_TIMEZONE || !session.scheduledTimePKT;

    if (needsUpdate) {
      await classSessionModel.findByIdAndUpdate(session._id, {
        $set: {
          timezone: ISLAMABAD_TIMEZONE,
          scheduledTimePKT: pktTime,
        },
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} sessions to native Islamabad timezone (PKT).`);
  await app.close();
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

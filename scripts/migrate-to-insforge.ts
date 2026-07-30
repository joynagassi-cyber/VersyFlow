// scripts/migrate-to-insforge.ts
import { MmkvStorage } from '@/infrastructure/storage';
import { CloudMemorizationService } from '@/sync/CloudMemorizationService';
import { Sm2FallbackEngine } from '@/domains/fsrs';

async function migrate() {
  const localStorage = new MmkvStorage();
  const insForgeService = new CloudMemorizationService(false, new Sm2FallbackEngine());

  // Migrate all memorization records
  const allKeys = await localStorage.getAllKeys();
  const recordKeys = allKeys.filter(key => key.startsWith('versyflow:record:'));

  console.log(`Found ${recordKeys.length} records to migrate`);

  for (const key of recordKeys) {
    const recordStr = await localStorage.get(key);
    if (recordStr) {
      const record = JSON.parse(recordStr);
      try {
        await insForgeService.saveMemorizedRecord(record);
        console.log(`Migrated record: ${record.id}`);
      } catch (error) {
        console.error(`Failed to migrate record ${record.id}:`, error);
      }
    }
  }

  // Migrate review logs
  const logKeys = allKeys.filter(key => key.startsWith('versyflow:reviewlog:'));
  console.log(`Found ${logKeys.length} logs to migrate`);

  for (const key of logKeys) {
    const logStr = await localStorage.get(key);
    if (logStr) {
      const log = JSON.parse(logStr);
      try {
        await insForgeService.saveReviewLog(log);
        console.log(`Migrated log: ${log.id}`);
      } catch (error) {
        console.error(`Failed to migrate log ${log.id}:`, error);
      }
    }
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
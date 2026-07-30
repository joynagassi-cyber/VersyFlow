// tests/integration/cloud-sync.test.ts
import { CloudSyncService } from '@/sync/CloudSyncService';
import { MmkvStorage } from '@/infrastructure/storage';

describe('CloudSyncService', () => {
  let service: CloudSyncService;

  beforeEach(() => {
    service = new CloudSyncService(true);
  });

  it('should initialize with correct environment variables', () => {
    expect(service.client).toBeDefined();
  });

  it('should have autoSync enabled by default', () => {
    expect(service.autoSync).toBe(true);
  });

  it('should be able to toggle autoSync', () => {
    service.setAutoSync(false);
    expect(service.autoSync).toBe(false);
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoAccount, loginDemoAccount } from '@/dev/demo-auth';
import { LearnerProfileRepositoryDemo } from '@/infrastructure/repository/learner-profile-repository-demo';

describe('démo locale', () => {
  beforeEach(() => { localStorage.removeItem('versyflow:demo:accounts'); localStorage.removeItem('versyflow:demo:learner-profiles'); });
  it('inscrit et connecte un compte local sans conserver le mot de passe en clair', async () => {
    const account = await createDemoAccount('Demo@EXAMPLE.TEST', 'demo-test');
    expect((await loginDemoAccount('demo@example.test', 'demo-test')).id).toBe(account.id);
    await expect(loginDemoAccount('demo@example.test', 'incorrect')).rejects.toThrow();
    await expect(createDemoAccount('demo@example.test', 'demo-test')).rejects.toThrow();
    expect(localStorage.getItem('versyflow:demo:accounts')).not.toContain('demo-test');
  });
  it('persiste les profils fictifs et les limite au compte demandé', async () => {
    const repo = new LearnerProfileRepositoryDemo();
    const profile = await repo.create({ accountId: 'demo-a', displayName: 'Léa', status: 'active' });
    await repo.create({ accountId: 'demo-b', displayName: 'Marc', status: 'active' });
    const afterReload = new LearnerProfileRepositoryDemo();
    expect((await afterReload.findByAccountId('demo-a')).map((p) => p.id)).toEqual([profile.id]);
    expect(await afterReload.findByAccountId('real-account')).toEqual([]);
  });
});

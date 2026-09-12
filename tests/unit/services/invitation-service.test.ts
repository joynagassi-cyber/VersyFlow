/**
 * Unit Tests — Family Invitation Service (Domain)
 * Tests token generation, validation, and lifecycle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyInvitationService } from '@/domains/family-invitation/service';
import { generateQRPayload, parseQRPayload, extractTokenFromQR, formatTokenDisplay } from '@/services/qr-generator';

describe('Family Invitation Service', () => {
  let mockRepo: any;
  let mockFamilyRepo: any;
  let service: FamilyInvitationService;

  beforeEach(() => {
    mockRepo = {
      invitations: new Map(),
      findById: vi.fn(async (id: string) => mockRepo.invitations.get(id) || null),
      findByToken: vi.fn(async (token: string) =>
        Array.from(mockRepo.invitations.values()).find((i: any) => i.token === token) || null
      ),
      create: vi.fn(async (inv: any) => {
        const id = `inv-${Date.now()}`;
        const newInv = { ...inv, id, expiresAt: inv.expiresAt || Date.now() + 604800000 };
        mockRepo.invitations.set(id, newInv);
        return newInv;
      }),
      markUsed: vi.fn(async (id: string) => {
        const inv = mockRepo.invitations.get(id);
        if (!inv) return false;
        inv.status = 'used';
        return true;
      }),
      revoke: vi.fn(async (id: string) => {
        const inv = mockRepo.invitations.get(id);
        if (!inv) return false;
        inv.status = 'revoked';
        return true;
      }),
      expirePastDue: vi.fn(async () => {
        let count = 0;
        const now = Date.now();
        for (const [id, inv] of mockRepo.invitations.entries()) {
          if (inv.status === 'active' && inv.expiresAt < now) {
            inv.status = 'expired';
            count++;
          }
        }
        return count;
      }),
    };

    mockFamilyRepo = {
      findById: vi.fn(async (id: string) => id ? { id, ownerId: 'user-1', name: 'Test' } : null),
    };

    service = new FamilyInvitationService(mockRepo, mockFamilyRepo);
  });

  it('should generate an invitation with valid token', async () => {
    const invitation = await service.create('family-1', 'user-1');

    expect(invitation).toBeDefined();
    expect(invitation.familyId).toBe('family-1');
    expect(invitation.createdBy).toBe('user-1');
    expect(invitation.token).toBeDefined();
    expect(invitation.token.length).toBeGreaterThan(10);
    expect(invitation.status).toBe('active');
    expect(invitation.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should validate a valid token', async () => {
    const invitation = await service.create('family-1', 'user-1');
    const result = await service.validate(invitation.token);

    expect(result).not.toBeNull();
    expect(result!.familyId).toBe('family-1');
    expect(result!.invitation.token).toBe(invitation.token);
  });

  it('should reject an invalid token', async () => {
    const result = await service.validate('invalid-token');
    expect(result).toBeNull();
  });

  it('should reject an expired token', async () => {
    const invitation = await service.create('family-1', 'user-1');
    // Manually expire
    mockRepo.invitations.get(invitation.id).expiresAt = Date.now() - 1000;

    const result = await service.validate(invitation.token);
    expect(result).toBeNull();
  });

  it('should reject an already-used token', async () => {
    const invitation = await service.create('family-1', 'user-1');
    await service.markUsed(invitation.id);

    const result = await service.validate(invitation.token);
    expect(result).toBeNull();
  });

  it('should mark invitation as used', async () => {
    const invitation = await service.create('family-1', 'user-1');
    const used = await service.markUsed(invitation.id);

    expect(used).toBe(true);
    expect(invitation.status).toBe('used');
  });

  it('should revoke an invitation', async () => {
    const invitation = await service.create('family-1', 'user-1');
    const revoked = await service.revoke(invitation.id);

    expect(revoked).toBe(true);
    expect(invitation.status).toBe('revoked');
  });

  it('should expire past-due invitations', async () => {
    await service.create('family-1', 'user-1');
    await service.create('family-2', 'user-1');

    // Expire one
    const inv1 = Array.from(mockRepo.invitations.values())[0] as unknown as { expiresAt: number };
    inv1.expiresAt = Date.now() - 1000;

    const expiredCount = await service.expirePastDue();
    expect(expiredCount).toBeGreaterThanOrEqual(1);
  });
});

describe('QR Code Utilities', () => {
  it('should generate a valid QR payload', () => {
    const payload = generateQRPayload({
      token: 'FAM-ABCD1234',
      familyId: 'family-1',
      createdAt: Date.now(),
    });

    const parsed = JSON.parse(payload);
    expect(parsed.type).toBe('family_invitation');
    expect(parsed.token).toBe('FAM-ABCD1234');
    expect(parsed.familyId).toBe('family-1');
  });

  it('should parse a valid QR payload', () => {
    const data = JSON.stringify({
      type: 'family_invitation',
      token: 'FAM-TEST',
      familyId: 'f1',
      createdAt: Date.now(),
    });

    const parsed = parseQRPayload(data);
    expect(parsed).not.toBeNull();
    expect(parsed!.token).toBe('FAM-TEST');
  });

  it('should return null for invalid payload', () => {
    expect(parseQRPayload('not-json')).toBeNull();
    expect(parseQRPayload(JSON.stringify({ type: 'invalid' }))).toBeNull();
  });

  it('should extract token from QR payload', () => {
    const data = JSON.stringify({
      type: 'family_invitation',
      token: 'FAM-EXTRACT',
      familyId: 'f1',
      createdAt: Date.now(),
    });

    expect(extractTokenFromQR(data)).toBe('FAM-EXTRACT');
  });

  it('should format token for display', () => {
    expect(formatTokenDisplay('FAM-ABCD1234')).toBe('FAM-ABCD-1234');
    expect(formatTokenDisplay('FAM-TEST')).toBe('FAM-TEST');
  });
});

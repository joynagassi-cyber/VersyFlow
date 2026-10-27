/**
 * QR Code Generator/Parser for Family Invitations
 * Generates payload and parses QR code data
 */

export interface QRPayload {
  type: 'family_invitation';
  token: string;
  familyId: string;
  createdAt: number;
}

/**
 * Generate a QR-safe payload from an invitation
 */
export function generateQRPayload(invitation: { token: string; familyId: string; createdAt: number }): string {
  const payload: QRPayload = {
    type: 'family_invitation',
    token: invitation.token,
    familyId: invitation.familyId,
    createdAt: invitation.createdAt,
  };
  return JSON.stringify(payload);
}

/**
 * Parse and validate a QR code payload
 */
export function parseQRPayload(data: string): QRPayload | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type !== 'family_invitation') return null;
    if (!parsed.token || !parsed.familyId) return null;
    return parsed as QRPayload;
  } catch {
    return null;
  }
}

/**
 * Extract just the token from a QR payload (for manual entry fallback)
 */
export function extractTokenFromQR(payload: string): string | null {
  const parsed = parseQRPayload(payload);
  return parsed?.token || null;
}

/**
 * Format token for display (FAM-XXXX-XXXX)
 */
export function formatTokenDisplay(token: string): string {
  if (token.startsWith('FAM-') && token.length >= 12) {
    const core = token.slice(4);
    return `FAM-${core.slice(0, 4)}-${core.slice(4)}`;
  }
  return token;
}

/** Local demo identities, isolated by demo-storage. Not a security boundary. */
const KEY = 'versyflow:demo:accounts';
interface DemoAccount { id: string; email: string; salt: string; passwordHash: string }
function read(): DemoAccount[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value as DemoAccount[] : []; }
  catch { return []; }
}
async function hash(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
}
export async function createDemoAccount(email: string, password: string): Promise<DemoAccount> {
  const accounts = read(); const normalized = email.trim().toLowerCase();
  if (accounts.some((account) => account.email === normalized)) throw new Error('Ce compte de démonstration existe déjà. Connectez-vous.');
  const salt = crypto.randomUUID();
  const account = { id: `demo-${crypto.randomUUID()}`, email: normalized, salt, passwordHash: await hash(password, salt) };
  localStorage.setItem(KEY, JSON.stringify([...accounts, account]));
  return account;
}
export async function loginDemoAccount(email: string, password: string): Promise<DemoAccount> {
  const account = read().find((entry) => entry.email === email.trim().toLowerCase());
  if (!account || await hash(password, account.salt) !== account.passwordHash) throw new Error('E-mail ou mot de passe de démonstration incorrect.');
  return account;
}

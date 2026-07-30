export interface UserProfile {
  userId: string;
  display_name?: string;
  default_translation?: string;
}

export class InsForgeAuthService {
  private token: string | null = null;
  private user: UserProfile | null = null;

  constructor() {
    // Version locale simplifiée - pas de dépendances externes requises
    // Pour tester sans configuration复杂ée
    const storedToken = localStorage.getItem('versyflow_token');
    if (storedToken) {
      this.token = storedToken;
      const storedUser = localStorage.getItem('versyflow_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
  }

  async signUp(email: string, password: string): Promise<string> {
    this.token = `simple_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.user = {
      userId: 'user_' + Date.now(),
      display_name: email.split('@')[0],
      default_translation: 'fr'
    };
    this.saveToStorage();
    return this.token;
  }

  async signIn(email: string, password: string): Promise<string> {
    this.token = `simple_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.user = {
      userId: 'user_' + Date.now(),
      display_name: email.split('@')[0],
      default_translation: 'fr'
    };
    this.saveToStorage();
    return this.token;
  }

  async signOut(): Promise<void> {
    this.token = null;
    this.user = null;
    localStorage.removeItem('versyflow_token');
    localStorage.removeItem('versyflow_user');
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.user;
  }

  async getUserEmail(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user ? (user.display_name + '@example.com') : null;
  }

  async updateUserProfile(userId: string, data: { display_name?: string, default_translation?: string }): Promise<void> {
    if (this.user) {
      this.user = { ...this.user, ...data };
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (this.token && this.user) {
      localStorage.setItem('versyflow_token', this.token);
      localStorage.setItem('versyflow_user', JSON.stringify(this.user));
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return this.token !== null;
  }
}
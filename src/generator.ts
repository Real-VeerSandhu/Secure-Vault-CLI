export interface PasswordPolicy {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export class PasswordGenerator {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private static readonly SIMILAR = 'il1Lo0O';

  static generate(policy: PasswordPolicy): string {
    let chars = '';
    
    if (policy.includeUppercase) chars += this.UPPERCASE;
    if (policy.includeLowercase) chars += this.LOWERCASE;
    if (policy.includeNumbers) chars += this.NUMBERS;
    if (policy.includeSymbols) chars += this.SYMBOLS;
    
    if (policy.excludeSimilar) {
      chars = chars.split('').filter(c => !this.SIMILAR.includes(c)).join('');
    }

    let password = '';
    for (let i = 0; i < policy.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  static calculateStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else feedback.push('Password too short');

    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 15;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 20;
    else feedback.push('Add symbols');

    if (password.length > 16) score += 10;

    return { score: Math.min(score, 100), feedback };
  }
}
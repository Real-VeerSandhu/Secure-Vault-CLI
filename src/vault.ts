import { CryptoManager } from './crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface VaultEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultData {
  entries: VaultEntry[];
  version: string;
}

export class Vault {
  private data: VaultData;
  private vaultPath: string;
  private isUnlocked: boolean = false;

  constructor(vaultPath: string = path.join(process.cwd(), 'vault.enc')) {
    this.vaultPath = vaultPath;
    this.data = { entries: [], version: '1.0.0' };
  }

  async unlock(masterPassword: string): Promise<boolean> {
    try {
      if (!fs.existsSync(this.vaultPath)) {
        this.isUnlocked = true;
        return true;
      }

      const encryptedData = fs.readFileSync(this.vaultPath, 'utf8');
      const decryptedData = CryptoManager.decrypt(encryptedData, masterPassword);
      this.data = JSON.parse(decryptedData);
      this.isUnlocked = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  async lock(masterPassword: string): Promise<void> {
    if (!this.isUnlocked) return;

    const jsonData = JSON.stringify(this.data);
    const encryptedData = CryptoManager.encrypt(jsonData, masterPassword);
    fs.writeFileSync(this.vaultPath, encryptedData);
    this.isUnlocked = false;
  }

  addEntry(entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>): VaultEntry {
    const now = new Date();
    const newEntry: VaultEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    this.data.entries.push(newEntry);
    return newEntry;
  }

  updateEntry(id: string, updates: Partial<VaultEntry>): VaultEntry | null {
    const index = this.data.entries.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.data.entries[index] = {
      ...this.data.entries[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.data.entries[index];
  }

  deleteEntry(id: string): boolean {
    const index = this.data.entries.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.data.entries.splice(index, 1);
    return true;
  }

  searchEntries(query: string): VaultEntry[] {
    const lowercaseQuery = query.toLowerCase();
    return this.data.entries.filter(entry =>
      entry.site.toLowerCase().includes(lowercaseQuery) ||
      entry.username.toLowerCase().includes(lowercaseQuery)
    );
  }

  getAllEntries(): VaultEntry[] {
    return [...this.data.entries];
  }

  auditPasswords(): { weak: VaultEntry[]; reused: VaultEntry[] } {
    const weak: VaultEntry[] = [];
    const reused: VaultEntry[] = [];
    const passwordCounts = new Map<string, VaultEntry[]>();

    for (const entry of this.data.entries) {
      // Check for weak passwords
      if (entry.password.length < 8) {
        weak.push(entry);
      }

      // Track password reuse
      if (!passwordCounts.has(entry.password)) {
        passwordCounts.set(entry.password, []);
      }
      passwordCounts.get(entry.password)!.push(entry);
    }

    // Find reused passwords
    for (const [password, entries] of passwordCounts) {
      if (entries.length > 1) {
        reused.push(...entries);
      }
    }

    return { weak, reused };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  get isLocked(): boolean {
    return !this.isUnlocked;
  }
}
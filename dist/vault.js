"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vault = void 0;
const crypto_1 = require("./crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Vault {
    constructor(vaultPath = path.join(process.cwd(), 'vault.enc')) {
        this.isUnlocked = false;
        this.vaultPath = vaultPath;
        this.data = { entries: [], version: '1.0.0' };
    }
    async unlock(masterPassword) {
        try {
            if (!fs.existsSync(this.vaultPath)) {
                this.isUnlocked = true;
                return true;
            }
            const encryptedData = fs.readFileSync(this.vaultPath, 'utf8');
            const decryptedData = crypto_1.CryptoManager.decrypt(encryptedData, masterPassword);
            this.data = JSON.parse(decryptedData);
            this.isUnlocked = true;
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async lock(masterPassword) {
        if (!this.isUnlocked)
            return;
        const jsonData = JSON.stringify(this.data);
        const encryptedData = crypto_1.CryptoManager.encrypt(jsonData, masterPassword);
        fs.writeFileSync(this.vaultPath, encryptedData);
        this.isUnlocked = false;
    }
    addEntry(entry) {
        const now = new Date();
        const newEntry = {
            ...entry,
            id: this.generateId(),
            createdAt: now,
            updatedAt: now
        };
        this.data.entries.push(newEntry);
        return newEntry;
    }
    updateEntry(id, updates) {
        const index = this.data.entries.findIndex(e => e.id === id);
        if (index === -1)
            return null;
        this.data.entries[index] = {
            ...this.data.entries[index],
            ...updates,
            updatedAt: new Date()
        };
        return this.data.entries[index];
    }
    deleteEntry(id) {
        const index = this.data.entries.findIndex(e => e.id === id);
        if (index === -1)
            return false;
        this.data.entries.splice(index, 1);
        return true;
    }
    searchEntries(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.data.entries.filter(entry => entry.site.toLowerCase().includes(lowercaseQuery) ||
            entry.username.toLowerCase().includes(lowercaseQuery));
    }
    getAllEntries() {
        return [...this.data.entries];
    }
    auditPasswords() {
        const weak = [];
        const reused = [];
        const passwordCounts = new Map();
        for (const entry of this.data.entries) {
            // Check for weak passwords
            if (entry.password.length < 8) {
                weak.push(entry);
            }
            // Track password reuse
            if (!passwordCounts.has(entry.password)) {
                passwordCounts.set(entry.password, []);
            }
            passwordCounts.get(entry.password).push(entry);
        }
        // Find reused passwords
        for (const [password, entries] of passwordCounts) {
            if (entries.length > 1) {
                reused.push(...entries);
            }
        }
        return { weak, reused };
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    get isLocked() {
        return !this.isUnlocked;
    }
}
exports.Vault = Vault;

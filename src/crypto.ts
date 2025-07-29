// src/crypto.ts
import * as CryptoJS from 'crypto-js';

export class CryptoManager {
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16;

  static deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS
    }).toString();
  }

  static encrypt(data: string, password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const key = this.deriveKey(password, salt.toString());
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
  }

  static decrypt(encryptedData: string, password: string): string {
    const [salt, iv, encrypted] = encryptedData.split(':');
    const key = this.deriveKey(password, salt);
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
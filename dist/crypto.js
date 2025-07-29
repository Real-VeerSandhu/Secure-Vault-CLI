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
exports.CryptoManager = void 0;
const CryptoJS = __importStar(require("crypto-js"));
class CryptoManager {
    static deriveKey(password, salt) {
        return CryptoJS.PBKDF2(password, salt, {
            keySize: this.KEY_SIZE / 32,
            iterations: this.ITERATIONS
        }).toString();
    }
    static encrypt(data, password) {
        const salt = CryptoJS.lib.WordArray.random(128 / 8);
        const key = this.deriveKey(password, salt.toString());
        const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.GCM,
            padding: CryptoJS.pad.NoPadding
        });
        return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
    }
    static decrypt(encryptedData, password) {
        const [salt, iv, encrypted] = encryptedData.split(':');
        const key = this.deriveKey(password, salt);
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.GCM,
            padding: CryptoJS.pad.NoPadding
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}
exports.CryptoManager = CryptoManager;
CryptoManager.ITERATIONS = 100000;
CryptoManager.KEY_SIZE = 256;
CryptoManager.IV_SIZE = 16;

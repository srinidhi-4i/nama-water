import CryptoJS from 'crypto-js';

// Encryption key and IV must match the React app exactly
const ENCRYPTION_KEY_STRING = '8080808080808080';
const ENCRYPTION_IV_STRING = '8080808080808080';
const USER_DATA_KEY = 'paw123'; // Only used for storing user data, not for login credentials

/**
 * Encrypts a raw string using AES encryption (for login credentials)
 * Matches React.js pattern: CommonService.Encrypt()
 * Uses key "8080808080808080", IV, CBC mode, and PKCS7 padding
 */
export function encryptString(text: string): string {
    try {
        const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY_STRING);
        const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV_STRING);

        const encrypted = CryptoJS.AES.encrypt(
            CryptoJS.enc.Utf8.parse(text),
            key,
            {
                keySize: 128 / 8,
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );

        return encrypted.toString();
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt string');
    }
}

/**
 * Decrypts a string encrypted with encryptString()
 * Matches React.js pattern: CommonService.Decrypt()
 */
export function decryptString(encryptedText: string): string {
    if (!encryptedText) return '';
    try {
        const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY_STRING);
        const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV_STRING);

        const decrypted = CryptoJS.AES.decrypt(
            encryptedText,
            key,
            {
                keySize: 128 / 8,
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
}

/**
 * Encrypts data using AES encryption (for storing objects in localStorage)
 * Matches the React.js pattern: CryptoJS.AES.encrypt(JSON.stringify(data), 'paw123')
 */
export function encryptData(data: any): string {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, USER_DATA_KEY);
        return encrypted.toString();
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts AES encrypted data
 * Matches the React.js pattern: JSON.parse(CryptoJS.AES.decrypt(encryptedData, 'paw123').toString(CryptoJS.enc.Utf8))
 */
export function decryptData<T = any>(encryptedData: string): T | null {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, USER_DATA_KEY);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!jsonString) {
            return null;
        }

        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

/**
 * Storage keys for encrypted data
 * Matches the React.js pattern
 */
export const STORAGE_KEYS = {
    BRANCH_USER_DATA: 'brUd/APtiypx/sw7lu83P7A==',
    AUTH_TOKEN: 'AU/@/#/TO/#/VA',
} as const;


import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key.slice(0, 32)), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function isEncrypted(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    // Format: iv(24 hex):tag(32 hex):encryptedData(hex)
    // We use * for the data part to handle potential empty results during intermediate decryption steps
    const regex = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]*$/i;
    return regex.test(text);
}

export function decrypt(encryptedText: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    if (!isEncrypted(encryptedText)) {
        // If it doesn't match our format, it's likely plain text
        return encryptedText;
    }

    const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key.slice(0, 32)), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
/**
 * Recursively decrypts a string until it is no longer in the encrypted format.
 * @param text The string to decrypt
 * @param maxDepth Maximum number of decryption attempts to prevent infinite loops
 */
export function fullyDecrypt(text: string, maxDepth: number = 10): string {
    let current = text;
    let depth = 0;

    while (isEncrypted(current) && depth < maxDepth) {
        try {
            const decrypted = decrypt(current);
            // If decryption didn't change anything, stop to avoid infinite loop
            if (decrypted === current) break;
            current = decrypted;
            depth++;
        } catch (e) {
            // If decryption fails, return the last successful result
            break;
        }
    }

    return current;
}

/**
 * Client-side encryption utilities for P2P Secure Chat
 * Note: This is a demonstration implementation. Production apps should use
 * proven libraries like libsignal-protocol-javascript for real E2E encryption.
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Generate a new encryption key
   */
  async generateKey() {
    return await crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Base64 helpers that never throw
   */
  safeAtob(input) {
    try { return atob(input); } catch { return ''; }
  }

  safeBtoa(input) {
    try { return btoa(input); } catch { return ''; }
  }

  /**
   * Encrypt text message
   */
  async encryptMessage(plaintext, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = this.generateIV();

    try {
      const encrypted = await crypto.subtle.encrypt({ name: this.algorithm, iv }, key, data);
      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        authTag: 'demo-auth-tag'
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt text message (tolerant to demo data)
   */
  async decryptMessage(encryptedData, key) {
    try {
      // If demo message has non-b64 IV, return placeholder without throwing
      if (!encryptedData?.encrypted || !encryptedData?.iv) {
        return '[encrypted text]';
      }

      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      if (!encrypted || !iv) {
        return '[encrypted text]';
      }

      const decrypted = await crypto.subtle.decrypt({ name: this.algorithm, iv }, key, encrypted);
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption error (tolerated in demo):', error?.message || error);
      return 'Failed to decrypt';
    }
  }

  /**
   * Encrypt file data
   */
  async encryptFile(fileData, key) {
    const iv = this.generateIV();
    try {
      const encrypted = await crypto.subtle.encrypt({ name: this.algorithm, iv }, key, fileData);
      return { encrypted, iv: this.arrayBufferToBase64(iv), authTag: 'demo-file-auth-tag' };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Generate key fingerprint for verification
   */
  async generateKeyFingerprint(key) {
    try {
      const exported = await crypto.subtle.exportKey('raw', key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', exported);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      console.error('Fingerprint generation error:', error);
      return 'demo-fingerprint';
    }
  }

  /**
   * Utility: Convert ArrayBuffer to Base64 (safe)
   */
  arrayBufferToBase64(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return this.safeBtoa(binary);
    } catch {
      return '';
    }
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer (safe)
   */
  base64ToArrayBuffer(base64) {
    try {
      const binaryString = this.safeAtob(base64);
      if (!binaryString) return null;
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes.buffer;
    } catch {
      return null;
    }
  }

  /**
   * Demo method: Simulate key exchange
   */
  async simulateKeyExchange(userId1, userId2) {
    const sharedKey = await this.generateKey();
    const fingerprint = await this.generateKeyFingerprint(sharedKey);
    return { key: sharedKey, fingerprint, algorithm: this.algorithm };
  }
}

export const encryptionService = new EncryptionService();

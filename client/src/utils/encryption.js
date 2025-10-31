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
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  }

  /**
   * Encrypt text message
   */
  async encryptMessage(plaintext, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = this.generateIV();

    try {
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        authTag: 'demo-auth-tag' // In real implementation, extract from AES-GCM result
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt text message
   */
  async decryptMessage(encryptedData, key) {
    try {
      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt file data
   */
  async encryptFile(fileData, key) {
    const iv = this.generateIV();

    try {
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        fileData
      );

      return {
        encrypted: encrypted,
        iv: this.arrayBufferToBase64(iv),
        authTag: 'demo-file-auth-tag'
      };
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
   * Utility: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Demo method: Simulate key exchange
   * In production, use Signal Protocol or similar
   */
  async simulateKeyExchange(userId1, userId2) {
    // For demo purposes, generate a shared key
    const sharedKey = await this.generateKey();
    const fingerprint = await this.generateKeyFingerprint(sharedKey);
    
    return {
      key: sharedKey,
      fingerprint: fingerprint,
      algorithm: this.algorithm
    };
  }
}

export const encryptionService = new EncryptionService();
/**
 * 加密工具
 */

import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_APP_CRYPTO_KEY || 'default-secret-key'

export function encrypt(data: any, key: string = SECRET_KEY): string {
  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data)
    return CryptoJS.AES.encrypt(dataStr, key).toString()
  } catch (error) {
    console.error('Encrypt failed:', error)
    throw error
  }
}

export function decrypt(ciphertext: string, key: string = SECRET_KEY): any {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    try {
      return JSON.parse(decryptedStr)
    } catch {
      return decryptedStr
    }
  } catch (error) {
    console.error('Decrypt failed:', error)
    throw error
  }
}

export function md5(data: string): string {
  return CryptoJS.MD5(data).toString()
}

export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString()
}

export function base64Encode(data: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data))
}

export function base64Decode(data: string): string {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(data))
}

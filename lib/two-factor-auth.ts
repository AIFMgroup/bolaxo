import crypto from 'crypto'

// TOTP (Time-based One-Time Password) implementation
// Compatible with Google Authenticator, Authy, etc.

const TOTP_DIGITS = 6
const TOTP_PERIOD = 30 // seconds
const TOTP_ALGORITHM = 'sha1'

/**
 * Generate a random secret for TOTP
 * Returns a base32-encoded string suitable for QR codes
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20)
  return base32Encode(buffer)
}

/**
 * Generate the provisioning URI for authenticator apps
 * This is what gets encoded in the QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'BOLAXO'
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`
}

/**
 * Verify a TOTP code
 * Allows for a window of ±1 period to account for clock skew
 */
export function verifyTOTP(secret: string, code: string): boolean {
  if (!code || code.length !== TOTP_DIGITS) {
    return false
  }

  const currentTime = Math.floor(Date.now() / 1000)
  
  // Check current period and ±1 period
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((currentTime + offset * TOTP_PERIOD) / TOTP_PERIOD)
    const expectedCode = generateTOTPCode(secret, counter)
    
    if (timingSafeEqual(code, expectedCode)) {
      return true
    }
  }
  
  return false
}

/**
 * Generate the current TOTP code (for testing)
 */
export function getCurrentTOTPCode(secret: string): string {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD)
  return generateTOTPCode(secret, counter)
}

/**
 * Generate backup codes for recovery
 * Returns array of 10 codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const buffer = crypto.randomBytes(5)
    const code = base32Encode(buffer).substring(0, 8).toUpperCase()
    // Format as XXXX-XXXX for readability
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`)
  }
  
  return codes
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => 
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  )
}

/**
 * Verify a backup code
 * Returns true if code is valid (and removes it from the list)
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): { valid: boolean; remainingCodes: string[] } {
  const normalizedCode = code.replace('-', '').toUpperCase()
  const hashedInput = crypto.createHash('sha256').update(normalizedCode).digest('hex')
  
  const index = hashedCodes.findIndex(hc => hc === hashedInput)
  
  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes }
  }
  
  // Remove the used code
  const remainingCodes = [...hashedCodes]
  remainingCodes.splice(index, 1)
  
  return { valid: true, remainingCodes }
}

// Internal: Generate TOTP code for a specific counter value
function generateTOTPCode(secret: string, counter: number): string {
  const secretBuffer = base32Decode(secret)
  
  // Counter to 8-byte buffer (big endian)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))
  
  // HMAC-SHA1
  const hmac = crypto.createHmac(TOTP_ALGORITHM, secretBuffer)
  hmac.update(counterBuffer)
  const hash = hmac.digest()
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const binary = 
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  
  // Generate 6-digit code
  const otp = binary % Math.pow(10, TOTP_DIGITS)
  return otp.toString().padStart(TOTP_DIGITS, '0')
}

// Base32 encoding/decoding (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Buffer): string {
  let result = ''
  let bits = 0
  let value = 0
  
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    
    while (bits >= 5) {
      bits -= 5
      result += BASE32_ALPHABET[(value >> bits) & 0x1f]
    }
  }
  
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  
  return result
}

function base32Decode(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/=+$/, '')
  const bytes: number[] = []
  let bits = 0
  let value = 0
  
  for (const char of cleanStr) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    
    value = (value << 5) | index
    bits += 5
    
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 0xff)
    }
  }
  
  return Buffer.from(bytes)
}

// Timing-safe comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  
  return crypto.timingSafeEqual(bufA, bufB)
}


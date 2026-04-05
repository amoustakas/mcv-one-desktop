# @mcv/identity/auth — Authentication Module

**Parent Package:** @mcv/identity  
**Tier:** 1 (Security Boundary)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `auth` module is the authentication backbone of the MCV ecosystem. It provides session management, multi-factor authentication, OAuth 2.0/OIDC provider integration, WebAuthn/Passkeys, magic links, and password authentication. Built on [better-auth](https://better-auth.com) with custom extensions for enterprise requirements.

**Every protected resource in MCV flows through this module. Security is non-negotiable.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Core session operations
export { createSession, getSession, refreshSession, revokeSession } from './session';
export { validateSession, validateSessionToken } from './session/validate';
export { getActiveSessions, revokeAllSessions } from './session/manage';

// Session middleware (for API routes)
export { requireAuth, optionalAuth } from './middleware/auth';
export { requireMfa } from './middleware/mfa';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION METHODS
// ═══════════════════════════════════════════════════════════════════════════════

// Password authentication
export { signInWithPassword, signUpWithPassword } from './methods/password';
export { hashPassword, verifyPassword, checkPasswordStrength } from './methods/password/utils';
export { checkBreachedPassword } from './methods/password/breach';

// Magic link (passwordless email)
export { sendMagicLink, verifyMagicLink } from './methods/magic-link';

// OAuth 2.0 providers
export { initiateOAuth, handleOAuthCallback } from './methods/oauth';
export { linkOAuthAccount, unlinkOAuthAccount } from './methods/oauth/linking';

// WebAuthn / Passkeys
export { 
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  listPasskeys,
  revokePasskey,
} from './methods/webauthn';

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-FACTOR AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  enrollMfa, 
  verifyMfaEnrollment,
  verifyMfaChallenge,
  disableMfa,
  getMfaStatus,
} from './mfa';

export { generateRecoveryCodes, verifyRecoveryCode } from './mfa/recovery';
export { sendOtpEmail, sendOtpSms, verifyOtp } from './mfa/otp';

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

export { requestPasswordReset, resetPassword } from './account/password-reset';
export { requestEmailVerification, verifyEmail } from './account/email-verification';
export { lockAccount, unlockAccount, getAccountLockStatus } from './account/lockout';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type { 
  Session,
  SessionToken,
  AuthUser,
  AuthConfig,
  MfaMethod,
  MfaStatus,
  OAuthProvider,
  OAuthConnection,
  Passkey,
  PasswordPolicy,
  LoginAttempt,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTH MODULE ARCHITECTURE                            │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            AUTHENTICATION LAYER                              │ │
│  │                                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │ Password │ │  OAuth   │ │  Magic   │ │ WebAuthn │ │   MFA    │          │ │
│  │  │          │ │  2.0     │ │  Link    │ │ Passkeys │ │  TOTP    │          │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │ │
│  │       │            │            │            │            │                 │ │
│  │       └────────────┴────────────┴────────────┴────────────┘                 │ │
│  │                                  │                                           │ │
│  │                         ┌────────▼────────┐                                  │ │
│  │                         │ Session Manager │                                  │ │
│  │                         │                 │                                  │ │
│  │                         │ • Create        │                                  │ │
│  │                         │ • Validate      │                                  │ │
│  │                         │ • Refresh       │                                  │ │
│  │                         │ • Revoke        │                                  │ │
│  │                         └────────┬────────┘                                  │ │
│  │                                  │                                           │ │
│  └──────────────────────────────────┼───────────────────────────────────────────┘ │
│                                     │                                             │
│  ┌──────────────────────────────────┼───────────────────────────────────────────┐ │
│  │                          STORAGE LAYER                                        │ │
│  │                                  │                                            │ │
│  │    ┌─────────────┐    ┌──────────▼──────────┐    ┌─────────────┐             │ │
│  │    │   Redis     │    │     PostgreSQL      │    │   Secrets   │             │ │
│  │    │   Cache     │    │                     │    │   Vault     │             │ │
│  │    │             │    │  • sessions         │    │             │             │ │
│  │    │ • Session   │    │  • users            │    │ • OAuth     │             │ │
│  │    │   tokens    │    │  • oauth_accounts   │    │   secrets   │             │ │
│  │    │ • Rate      │    │  • mfa_credentials  │    │ • Signing   │             │ │
│  │    │   limits    │    │  • passkeys         │    │   keys      │             │ │
│  │    │             │    │  • login_attempts   │    │             │             │ │
│  │    └─────────────┘    └─────────────────────┘    └─────────────┘             │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Session Management

### Session Structure

```typescript
interface Session {
  id: string;                      // UUID v4, primary key
  userId: string;                  // FK to users.id
  token: string;                   // Secure random token (32 bytes, base64url)
  
  // Token management
  accessToken: string;             // Short-lived JWT (15 min)
  refreshToken: string;            // Long-lived token (7 days)
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  
  // Session metadata
  ipAddress: string;               // Client IP (masked for privacy in logs)
  userAgent: string;               // Browser/client info
  deviceId?: string;               // Optional device fingerprint
  
  // Security flags
  mfaVerified: boolean;            // Has completed MFA challenge this session
  mfaVerifiedAt?: Date;
  impersonatorId?: string;         // If admin is impersonating this user
  
  // Venture context
  activeVentureId?: string;        // Currently active venture
  
  // Timestamps
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}
```

### Session Token Structure (JWT)

```typescript
interface AccessTokenPayload {
  // Standard claims
  sub: string;                     // User ID
  iat: number;                     // Issued at (Unix timestamp)
  exp: number;                     // Expires at (Unix timestamp)
  jti: string;                     // Unique token ID (for revocation)
  
  // Custom claims
  sid: string;                     // Session ID
  vid?: string;                    // Active venture ID
  roles: string[];                 // User roles in active venture
  permissions: string[];           // Flattened permissions
  mfa: boolean;                    // MFA verified this session
  imp?: string;                    // Impersonator user ID (if applicable)
}
```

### Session Configuration

```typescript
// config/auth.ts
export const sessionConfig = {
  // Token lifetimes
  accessToken: {
    expiresIn: 15 * 60,            // 15 minutes
    algorithm: 'HS256' as const,
  },
  refreshToken: {
    expiresIn: 7 * 24 * 60 * 60,   // 7 days
    rotateOnUse: true,             // Issue new refresh token on refresh
    reuseWindow: 60,               // Allow reuse within 60s (race condition handling)
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,     // 30 days absolute maximum
    inactivityTimeout: 24 * 60 * 60, // 24 hours of inactivity
    maxPerUser: 10,                // Maximum concurrent sessions per user
  },
  
  // Cookie settings
  cookies: {
    sessionToken: {
      name: '__mcv_session',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.COOKIE_DOMAIN, // .mcv.one for cross-subdomain
    },
    csrfToken: {
      name: '__mcv_csrf',
      httpOnly: false,             // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    },
  },
  
  // Security settings
  security: {
    requireSecureCookies: process.env.NODE_ENV === 'production',
    validateIpAddress: false,      // Disabled: breaks mobile networks
    validateUserAgent: true,       // Detect session hijacking
    csrfProtection: true,
  },
};
```

### Session Operations

```typescript
import { createSession, getSession, refreshSession, revokeSession } from '@mcv/identity';
import { db, schema } from '@mcv/kernel';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE SESSION (after successful authentication)
// ═══════════════════════════════════════════════════════════════════════════════

export async function createSession(options: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  mfaVerified?: boolean;
  ventureId?: string;
}): Promise<{ session: Session; tokens: TokenPair }> {
  const { userId, ipAddress, userAgent, deviceId, mfaVerified = false, ventureId } = options;
  
  // Check concurrent session limit
  const existingSessions = await db
    .select({ count: count() })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.userId, userId),
        gt(schema.sessions.expiresAt, new Date())
      )
    );
  
  if (existingSessions[0].count >= sessionConfig.session.maxPerUser) {
    // Revoke oldest session
    const oldest = await db
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .orderBy(asc(schema.sessions.createdAt))
      .limit(1);
    
    if (oldest[0]) {
      await revokeSession(oldest[0].id);
    }
  }
  
  // Generate tokens
  const sessionId = crypto.randomUUID();
  const sessionToken = generateSecureToken(32);
  const { accessToken, refreshToken } = await generateTokenPair({
    sessionId,
    userId,
    ventureId,
    mfaVerified,
  });
  
  // Store session
  const [session] = await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    token: await hashToken(sessionToken),
    accessToken: await hashToken(accessToken),
    refreshToken: await hashToken(refreshToken),
    accessTokenExpiresAt: new Date(Date.now() + sessionConfig.accessToken.expiresIn * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + sessionConfig.refreshToken.expiresIn * 1000),
    ipAddress: maskIpAddress(ipAddress),
    userAgent,
    deviceId,
    mfaVerified,
    mfaVerifiedAt: mfaVerified ? new Date() : null,
    activeVentureId: ventureId,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + sessionConfig.session.maxAge * 1000),
  }).returning();
  
  // Audit log
  await auditLog({
    action: 'auth.session.created',
    actorId: userId,
    resourceType: 'Session',
    resourceId: sessionId,
    metadata: { ipAddress: maskIpAddress(ipAddress), userAgent: truncate(userAgent, 200) },
  });
  
  return {
    session,
    tokens: { accessToken, refreshToken, sessionToken },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATE SESSION (called on every authenticated request)
// ═══════════════════════════════════════════════════════════════════════════════

export async function validateSession(
  accessToken: string,
  options: { requireMfa?: boolean; requireVenture?: boolean } = {}
): Promise<{ valid: true; session: Session; user: AuthUser } | { valid: false; reason: string }> {
  const { requireMfa = false, requireVenture = false } = options;
  
  try {
    // Verify JWT signature and expiration
    const payload = await verifyAccessToken(accessToken);
    
    // Check if token is revoked (JTI in blocklist)
    const isRevoked = await isTokenRevoked(payload.jti);
    if (isRevoked) {
      return { valid: false, reason: 'TOKEN_REVOKED' };
    }
    
    // Load session from database
    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.id, payload.sid),
    });
    
    if (!session) {
      return { valid: false, reason: 'SESSION_NOT_FOUND' };
    }
    
    // Check session expiration
    if (session.expiresAt < new Date()) {
      return { valid: false, reason: 'SESSION_EXPIRED' };
    }
    
    // Check inactivity timeout
    const inactivityCutoff = new Date(Date.now() - sessionConfig.session.inactivityTimeout * 1000);
    if (session.lastActivityAt < inactivityCutoff) {
      await revokeSession(session.id, 'INACTIVITY_TIMEOUT');
      return { valid: false, reason: 'SESSION_INACTIVE' };
    }
    
    // Check MFA requirement
    if (requireMfa && !session.mfaVerified) {
      return { valid: false, reason: 'MFA_REQUIRED' };
    }
    
    // Check venture requirement
    if (requireVenture && !session.activeVentureId) {
      return { valid: false, reason: 'VENTURE_REQUIRED' };
    }
    
    // Load user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.userId),
      with: {
        roles: true,
        preferences: true,
      },
    });
    
    if (!user || user.status !== 'active') {
      return { valid: false, reason: 'USER_INACTIVE' };
    }
    
    // Update last activity (debounced - only if > 1 min since last update)
    if (Date.now() - session.lastActivityAt.getTime() > 60000) {
      await db
        .update(schema.sessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(schema.sessions.id, session.id));
    }
    
    return { valid: true, session, user };
    
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }
    if (error instanceof TokenInvalidError) {
      return { valid: false, reason: 'TOKEN_INVALID' };
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFRESH SESSION (exchange refresh token for new token pair)
// ═══════════════════════════════════════════════════════════════════════════════

export async function refreshSession(
  refreshToken: string
): Promise<{ tokens: TokenPair } | { error: string }> {
  // Hash the provided refresh token for comparison
  const tokenHash = await hashToken(refreshToken);
  
  // Find session by refresh token
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.refreshToken, tokenHash),
  });
  
  if (!session) {
    return { error: 'INVALID_REFRESH_TOKEN' };
  }
  
  // Check refresh token expiration
  if (session.refreshTokenExpiresAt < new Date()) {
    await revokeSession(session.id, 'REFRESH_TOKEN_EXPIRED');
    return { error: 'REFRESH_TOKEN_EXPIRED' };
  }
  
  // Check session expiration
  if (session.expiresAt < new Date()) {
    return { error: 'SESSION_EXPIRED' };
  }
  
  // Generate new token pair
  const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
    sessionId: session.id,
    userId: session.userId,
    ventureId: session.activeVentureId,
    mfaVerified: session.mfaVerified,
  });
  
  // Update session with new tokens (rotate refresh token)
  await db
    .update(schema.sessions)
    .set({
      accessToken: await hashToken(accessToken),
      refreshToken: await hashToken(newRefreshToken),
      accessTokenExpiresAt: new Date(Date.now() + sessionConfig.accessToken.expiresIn * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + sessionConfig.refreshToken.expiresIn * 1000),
      lastActivityAt: new Date(),
    })
    .where(eq(schema.sessions.id, session.id));
  
  // Revoke old access token (add JTI to blocklist)
  // Note: Short TTL in blocklist matching token expiration
  await revokeAccessToken(session.accessToken);
  
  return {
    tokens: { accessToken, refreshToken: newRefreshToken },
  };
}
```

---

## Password Authentication

### Password Policy

```typescript
interface PasswordPolicy {
  minLength: number;               // Minimum characters
  maxLength: number;               // Maximum characters
  requireUppercase: boolean;       // At least one uppercase
  requireLowercase: boolean;       // At least one lowercase
  requireNumber: boolean;          // At least one digit
  requireSpecial: boolean;         // At least one special character
  specialCharacters: string;       // Allowed special characters
  preventReuse: number;            // Prevent reusing last N passwords
  maxAge: number;                  // Force reset after N days (0 = disabled)
  checkBreached: boolean;          // Check against HaveIBeenPwned
}

// Production password policy
export const passwordPolicy: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventReuse: 5,
  maxAge: 0,                       // Disabled - passkeys preferred
  checkBreached: true,
};
```

### Password Hashing

```typescript
import { hash, verify } from '@node-rs/argon2';

// Argon2id configuration (OWASP recommendations)
const ARGON2_CONFIG = {
  algorithm: 2,                    // Argon2id
  memoryCost: 65536,               // 64 MB
  timeCost: 3,                     // 3 iterations
  parallelism: 4,                  // 4 parallel threads
  hashLength: 32,                  // 32 byte output
  saltLength: 16,                  // 16 byte salt
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_CONFIG);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}

// Check password strength
export function checkPasswordStrength(password: string): {
  valid: boolean;
  score: number;          // 0-100
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  // Length checks
  if (password.length < passwordPolicy.minLength) {
    issues.push(`Must be at least ${passwordPolicy.minLength} characters`);
  } else {
    score += Math.min(30, password.length * 2);
  }
  
  if (password.length > passwordPolicy.maxLength) {
    issues.push(`Must be at most ${passwordPolicy.maxLength} characters`);
  }
  
  // Character class checks
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push('Must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    issues.push('Must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }
  
  if (passwordPolicy.requireNumber && !/\d/.test(password)) {
    issues.push('Must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 15;
  }
  
  if (passwordPolicy.requireSpecial) {
    const specialRegex = new RegExp(`[${escapeRegex(passwordPolicy.specialCharacters)}]`);
    if (!specialRegex.test(password)) {
      issues.push('Must contain at least one special character');
    } else {
      score += 25;
    }
  }
  
  // Common password check
  if (isCommonPassword(password)) {
    issues.push('This password is too common');
    score = Math.min(score, 20);
  }
  
  return {
    valid: issues.length === 0,
    score: Math.min(100, score),
    issues,
  };
}
```

### Breach Detection (HaveIBeenPwned)

```typescript
import { createHash } from 'crypto';

const HIBP_API = 'https://api.pwnedpasswords.com/range/';

export async function checkBreachedPassword(password: string): Promise<{
  breached: boolean;
  count: number;          // Times seen in breaches
}> {
  // SHA-1 hash the password
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  
  try {
    // k-Anonymity: Only send first 5 chars of hash
    const response = await fetch(`${HIBP_API}${prefix}`, {
      headers: {
        'User-Agent': 'MCV-Identity-Service',
        'Add-Padding': 'true',   // Prevent timing attacks
      },
    });
    
    if (!response.ok) {
      // Fail open - don't block registration if API is down
      console.error('[hibp] API error:', response.status);
      return { breached: false, count: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          breached: true,
          count: parseInt(countStr.trim(), 10),
        };
      }
    }
    
    return { breached: false, count: 0 };
    
  } catch (error) {
    console.error('[hibp] Check failed:', error);
    return { breached: false, count: 0 };
  }
}
```

---

## Multi-Factor Authentication

### MFA Methods

| Method | Security Level | UX Friction | Recovery | Recommended |
|--------|---------------|-------------|----------|-------------|
| **Passkey/WebAuthn** | ⭐⭐⭐⭐⭐ | ⭐ (biometric) | New device | ✅ Primary |
| **TOTP App** | ⭐⭐⭐⭐ | ⭐⭐⭐ | Recovery codes | ✅ Fallback |
| **Email OTP** | ⭐⭐⭐ | ⭐⭐ | Always available | Account recovery |
| **SMS OTP** | ⭐⭐ | ⭐⭐ | Phone number | ⚠️ Legacy only |
| **Recovery Codes** | ⭐⭐⭐ | ⭐⭐⭐⭐ | One-time use | Emergency only |

### TOTP Implementation

```typescript
import { TOTP } from 'otpauth';

const TOTP_CONFIG = {
  issuer: 'MCV',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
};

export async function enrollMfa(
  userId: string,
  method: 'totp' | 'sms' | 'email'
): Promise<{
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}> {
  if (method === 'totp') {
    // Generate secret
    const secret = generateBase32Secret(20);
    
    // Load user for issuer label
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    
    // Create TOTP instance
    const totp = new TOTP({
      ...TOTP_CONFIG,
      label: user.email,
      secret,
    });
    
    // Store pending enrollment (not yet verified)
    await db.insert(schema.mfaCredentials).values({
      userId,
      method: 'totp',
      secret: await encryptSecret(secret),
      verified: false,
      createdAt: new Date(),
    });
    
    // Generate QR code
    const qrCode = await generateQRCode(totp.toString());
    
    // Generate backup codes
    const backupCodes = await generateRecoveryCodes(userId);
    
    return {
      secret,
      qrCode,
      backupCodes,
    };
  }
  
  // ... SMS and email implementations
}

export async function verifyMfaChallenge(
  userId: string,
  method: 'totp' | 'sms' | 'email' | 'recovery',
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  // Rate limiting
  const attempts = await getMfaAttempts(userId);
  if (attempts >= 5) {
    return { valid: false, reason: 'TOO_MANY_ATTEMPTS' };
  }
  
  await incrementMfaAttempts(userId);
  
  if (method === 'totp') {
    const credential = await db.query.mfaCredentials.findFirst({
      where: and(
        eq(schema.mfaCredentials.userId, userId),
        eq(schema.mfaCredentials.method, 'totp'),
        eq(schema.mfaCredentials.verified, true)
      ),
    });
    
    if (!credential) {
      return { valid: false, reason: 'MFA_NOT_ENROLLED' };
    }
    
    const secret = await decryptSecret(credential.secret);
    const totp = new TOTP({ ...TOTP_CONFIG, secret });
    
    // Validate with 1-step tolerance (handles clock drift)
    const delta = totp.validate({ token: code, window: 1 });
    
    if (delta === null) {
      return { valid: false, reason: 'INVALID_CODE' };
    }
    
    // Check for code reuse (replay attack prevention)
    const lastUsed = await getLastUsedCode(userId, 'totp');
    if (lastUsed === code) {
      return { valid: false, reason: 'CODE_ALREADY_USED' };
    }
    
    await setLastUsedCode(userId, 'totp', code);
    await clearMfaAttempts(userId);
    
    return { valid: true };
  }
  
  if (method === 'recovery') {
    return verifyRecoveryCode(userId, code);
  }
  
  // ... other methods
}
```

### Recovery Codes

```typescript
export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  // Generate 10 recovery codes
  const codes: string[] = [];
  const hashedCodes: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    // Format: XXXX-XXXX-XXXX (12 alphanumeric chars)
    const code = generateRecoveryCode();
    codes.push(code);
    hashedCodes.push(await hashRecoveryCode(code));
  }
  
  // Store hashed codes
  await db
    .delete(schema.recoveryCodes)
    .where(eq(schema.recoveryCodes.userId, userId));
  
  await db.insert(schema.recoveryCodes).values(
    hashedCodes.map(hash => ({
      userId,
      codeHash: hash,
      used: false,
      createdAt: new Date(),
    }))
  );
  
  // Audit log
  await auditLog({
    action: 'auth.mfa.recovery_codes_generated',
    actorId: userId,
    resourceType: 'User',
    resourceId: userId,
  });
  
  return codes; // Only returned once, never stored in plain text
}

export async function verifyRecoveryCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; reason?: string; remainingCodes?: number }> {
  const codeHash = await hashRecoveryCode(code);
  
  const recoveryCode = await db.query.recoveryCodes.findFirst({
    where: and(
      eq(schema.recoveryCodes.userId, userId),
      eq(schema.recoveryCodes.codeHash, codeHash),
      eq(schema.recoveryCodes.used, false)
    ),
  });
  
  if (!recoveryCode) {
    return { valid: false, reason: 'INVALID_RECOVERY_CODE' };
  }
  
  // Mark as used (one-time use)
  await db
    .update(schema.recoveryCodes)
    .set({ used: true, usedAt: new Date() })
    .where(eq(schema.recoveryCodes.id, recoveryCode.id));
  
  // Count remaining
  const remaining = await db
    .select({ count: count() })
    .from(schema.recoveryCodes)
    .where(
      and(
        eq(schema.recoveryCodes.userId, userId),
        eq(schema.recoveryCodes.used, false)
      )
    );
  
  // Warn if low
  if (remaining[0].count <= 2) {
    await sendLowRecoveryCodesWarning(userId, remaining[0].count);
  }
  
  return { valid: true, remainingCodes: remaining[0].count };
}
```

---

## Rate Limiting

### Rate Limit Configuration

| Action | Window | Max Attempts | Lockout Duration | Scope |
|--------|--------|--------------|------------------|-------|
| Login (password) | 15 min | 5 | 15 min | IP + Email |
| Login (passkey) | 5 min | 10 | 5 min | IP |
| MFA verify | 5 min | 5 | 30 min | User |
| Password reset request | 1 hour | 3 | 1 hour | Email |
| Magic link request | 1 hour | 5 | 1 hour | Email |
| Account creation | 1 hour | 3 | 1 hour | IP |

### Implementation

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Rate limiters
export const rateLimiters = {
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:auth:login',
    analytics: true,
  }),
  
  mfa: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5 m'),
    prefix: 'rl:auth:mfa',
  }),
  
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:auth:reset',
  }),
  
  signUp: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:auth:signup',
  }),
};

export async function checkRateLimit(
  limiter: keyof typeof rateLimiters,
  identifier: string
): Promise<{ success: boolean; reset: number; remaining: number }> {
  const result = await rateLimiters[limiter].limit(identifier);
  
  if (!result.success) {
    await auditLog({
      action: 'auth.rate_limit.exceeded',
      metadata: { limiter, identifier: maskIdentifier(identifier) },
      severity: 'warning',
    });
  }
  
  return result;
}
```

---

## Database Schema

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Token hashes (never store plain tokens)
  token: varchar('token', { length: 64 }).notNull(),
  accessToken: varchar('access_token', { length: 64 }).notNull(),
  refreshToken: varchar('refresh_token', { length: 64 }).notNull(),
  
  // Expiration
  accessTokenExpiresAt: timestamp('access_token_expires_at').notNull(),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Client info
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
  userAgent: text('user_agent'),
  deviceId: varchar('device_id', { length: 64 }),
  
  // Security state
  mfaVerified: boolean('mfa_verified').default(false),
  mfaVerifiedAt: timestamp('mfa_verified_at'),
  impersonatorId: uuid('impersonator_id').references(() => users.id),
  
  // Venture context
  activeVentureId: uuid('active_venture_id').references(() => ventures.id),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// MFA CREDENTIALS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const mfaCredentials = pgTable('mfa_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  method: varchar('method', { length: 20 }).notNull(), // 'totp', 'sms', 'email'
  
  // Encrypted secret (for TOTP)
  secret: text('secret'),
  
  // Phone number (for SMS)
  phone: varchar('phone', { length: 20 }),
  
  // Verification status
  verified: boolean('verified').default(false).notNull(),
  verifiedAt: timestamp('verified_at'),
  
  // Last used
  lastUsedAt: timestamp('last_used_at'),
  lastUsedCode: varchar('last_used_code', { length: 10 }), // Replay prevention
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userMethodIdx: uniqueIndex('mfa_user_method_idx').on(table.userId, table.method),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PASSKEYS TABLE (WebAuthn)
// ═══════════════════════════════════════════════════════════════════════════════

export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // WebAuthn credential
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').default(0).notNull(),
  
  // Credential info
  deviceType: varchar('device_type', { length: 50 }), // 'platform', 'cross-platform'
  backedUp: boolean('backed_up').default(false),
  transports: jsonb('transports').$type<string[]>(), // ['usb', 'ble', 'nfc', 'internal']
  
  // User-friendly name
  name: varchar('name', { length: 100 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
}, (table) => ({
  userIdIdx: index('passkeys_user_id_idx').on(table.userId),
  credentialIdIdx: uniqueIndex('passkeys_credential_id_idx').on(table.credentialId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH ACCOUNTS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Provider info
  provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'github', etc.
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  
  // Tokens (encrypted)
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  
  // Scopes granted
  scope: text('scope'),
  
  // Provider profile data
  profile: jsonb('profile'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: uniqueIndex('oauth_user_provider_idx').on(table.userId, table.provider),
  providerAccountIdx: uniqueIndex('oauth_provider_account_idx').on(table.provider, table.providerAccountId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN ATTEMPTS TABLE (for security monitoring)
// ═══════════════════════════════════════════════════════════════════════════════

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Target
  email: varchar('email', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  
  // Client info
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  
  // Result
  success: boolean('success').notNull(),
  method: varchar('method', { length: 20 }).notNull(), // 'password', 'passkey', 'magic_link', 'oauth'
  failureReason: varchar('failure_reason', { length: 50 }),
  
  // Timestamps
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('login_attempts_email_idx').on(table.email),
  ipIdx: index('login_attempts_ip_idx').on(table.ipAddress),
  attemptedAtIdx: index('login_attempts_attempted_at_idx').on(table.attemptedAt),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY CODES TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const recoveryCodes = pgTable('recovery_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Hashed code (never store plain)
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  
  // Usage tracking
  used: boolean('used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('recovery_codes_user_id_idx').on(table.userId),
}));
```

---

## Audit Events

All authentication events are logged to the audit system with full context:

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `auth.session.created` | info | userId, ipAddress (masked), userAgent, deviceId |
| `auth.session.refreshed` | info | sessionId, userId |
| `auth.session.revoked` | info | sessionId, userId, reason |
| `auth.login.success` | info | userId, method, ipAddress, userAgent |
| `auth.login.failed` | warning | email, method, reason, ipAddress |
| `auth.logout` | info | userId, sessionId |
| `auth.mfa.enrolled` | info | userId, method |
| `auth.mfa.verified` | info | userId, method, sessionId |
| `auth.mfa.failed` | warning | userId, method, reason |
| `auth.mfa.recovery_codes_generated` | info | userId |
| `auth.mfa.recovery_code_used` | warning | userId, remainingCodes |
| `auth.passkey.registered` | info | userId, credentialId (truncated), deviceType |
| `auth.passkey.used` | info | userId, credentialId (truncated) |
| `auth.passkey.revoked` | info | userId, credentialId (truncated), revokedBy |
| `auth.password.changed` | info | userId, source (self/admin/reset) |
| `auth.password.reset_requested` | info | email, ipAddress |
| `auth.password.reset_completed` | info | userId |
| `auth.oauth.linked` | info | userId, provider |
| `auth.oauth.unlinked` | info | userId, provider |
| `auth.account.locked` | warning | userId, reason, duration |
| `auth.account.unlocked` | info | userId, unlockedBy |
| `auth.rate_limit.exceeded` | warning | identifier (masked), limiter |

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password | Invalid email or password |
| `AUTH_ACCOUNT_LOCKED` | 423 | Too many failed attempts | Account temporarily locked |
| `AUTH_ACCOUNT_DISABLED` | 403 | Account deactivated | Account has been disabled |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not verified | Please verify your email |
| `AUTH_MFA_REQUIRED` | 403 | MFA challenge needed | Additional verification required |
| `AUTH_MFA_INVALID` | 401 | Invalid MFA code | Invalid verification code |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired | Your session has expired |
| `AUTH_SESSION_INVALID` | 401 | Session not found | Please sign in again |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired | (Auto-refresh attempted) |
| `AUTH_TOKEN_INVALID` | 401 | Invalid token format | Please sign in again |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token expired | Please sign in again |
| `AUTH_PASSWORD_WEAK` | 400 | Password too weak | (Specific requirements shown) |
| `AUTH_PASSWORD_BREACHED` | 400 | Password in known breach | This password is not safe |
| `AUTH_RATE_LIMITED` | 429 | Too many requests | Please wait before trying again |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| better-auth | ^1.x | Authentication framework |
| @node-rs/argon2 | ^1.x | Password hashing (Argon2id) |
| @simplewebauthn/server | ^10.x | WebAuthn/Passkeys |
| otpauth | ^9.x | TOTP generation and verification |
| jose | ^5.x | JWT creation and verification |
| @upstash/ratelimit | ^1.x | Rate limiting |
| qrcode | ^1.x | QR code generation for TOTP |

---

## Environment Variables

```bash
# Session configuration
AUTH_SECRET=                      # 32+ byte secret for JWT signing
AUTH_URL=https://auth.mcv.one     # Auth service URL
COOKIE_DOMAIN=.mcv.one            # Cookie domain for cross-subdomain

# OAuth providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Redis (for rate limiting and session cache)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# WebAuthn
WEBAUTHN_RP_ID=mcv.one            # Relying party ID
WEBAUTHN_RP_NAME=MCV              # Relying party name
WEBAUTHN_ORIGIN=https://mcv.one   # Expected origin
```

---

## Security Checklist

- [ ] All passwords hashed with Argon2id (64MB memory cost)
- [ ] Breach detection enabled via HaveIBeenPwned
- [ ] Rate limiting on all authentication endpoints
- [ ] Session tokens are cryptographically random (32 bytes)
- [ ] Refresh token rotation on use
- [ ] JTI blocklist for token revocation
- [ ] CSRF protection on all state-changing operations
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] MFA recovery codes are one-time use
- [ ] WebAuthn counter validation (replay prevention)
- [ ] Login attempt logging for security monitoring
- [ ] IP masking in audit logs (privacy)
- [ ] Account lockout after failed attempts

---

*@mcv/identity/auth — Authentication Module*

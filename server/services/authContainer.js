/**
 * authContainer.js — wires the auth service and middleware to real infrastructure.
 */
import { env } from '../config/env.js';
import { decryptSecret, encryptSecret, generateSessionToken, hashPassword, verifyPassword } from '../utils/cryptoUtils.js';
import { verifyTotpCodeServer } from '../utils/totpServer.js';
import { userRepository } from '../repositories/userRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { createAuthService } from './authService.js';
import { createUserManagementService } from './userManagementService.js';
import { createAuthMiddleware } from '../middlewares/requireAuth.js';

let dummyHash;

export const authService = createAuthService({
  userRepo: userRepository,
  sessionRepo: sessionRepository,
  hashPassword,
  verifyPassword,
  decryptSecret,
  // Real scrypt hash so unknown usernames take as long to reject as wrong passwords.
  getDummyHash: async () => (dummyHash ??= await hashPassword(generateSessionToken())),
  sessionTtlHours: env.SESSION_TTL_HOURS,
});

export const userManagementService = createUserManagementService({
  userRepo: userRepository,
  sessionRepo: sessionRepository,
  hashPassword,
  encryptSecret,
  verifyTotpCode: verifyTotpCodeServer,
});

export const { requireAuth, requireSession, requireRole } = createAuthMiddleware(authService);

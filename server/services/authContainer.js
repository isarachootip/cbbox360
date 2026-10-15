/**
 * authContainer.js — wires the auth service and middleware to real infrastructure.
 */
import { env } from '../config/env.js';
import { decryptSecret, generateSessionToken, hashPassword, verifyPassword } from '../utils/cryptoUtils.js';
import { userRepository } from '../repositories/userRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { createAuthService } from './authService.js';
import { createAuthMiddleware } from '../middlewares/requireAuth.js';

let dummyHash;

export const authService = createAuthService({
  userRepo: userRepository,
  sessionRepo: sessionRepository,
  hashPassword,
  verifyPassword,
  decryptSecret,
  // Real argon2 hash so unknown usernames take as long to reject as wrong passwords.
  getDummyHash: async () => (dummyHash ??= await hashPassword(generateSessionToken())),
  sessionTtlHours: env.SESSION_TTL_HOURS,
});

export const { requireAuth, requireSession, requireRole } = createAuthMiddleware(authService);

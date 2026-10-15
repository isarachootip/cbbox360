import { describe, it, expect } from 'vitest';
import { industryProfileSeed } from './industryProfiles';
import { industryProfileSchema } from '../domain/industry/schemas';

describe('industryProfileSeed', () => {
  it('every seeded profile passes schema validation', () => {
    Object.entries(industryProfileSeed).forEach(([customerId, profiles]) => {
      profiles.forEach((p) => {
        const result = industryProfileSchema.safeParse(p);
        expect(result.success, `${customerId}:${p.kind}`).toBe(true);
      });
    });
  });
});

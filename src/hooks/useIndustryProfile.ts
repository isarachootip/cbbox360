import { useCallback, useEffect, useState } from 'react';
import {
  IndustryKind,
  IndustryProfile,
  MedicalAccess,
  RedactedHospitalProfile,
} from '../types/industryProfile';
import {
  IndustryProfileRepository,
  SaveProfileResult,
  createLocalIndustryProfileRepository,
} from '../services/industryProfileRepository';
import { createHttpIndustryProfileRepository } from '../services/httpIndustryProfileRepository';
import { industryProfileSeed } from '../data/industryProfiles';
import { isServerAuth } from '../config/authMode';

// Server mode: data + access control live on the API. Demo mode: browser storage with seed data.
const repository: IndustryProfileRepository = isServerAuth
  ? createHttpIndustryProfileRepository()
  : createLocalIndustryProfileRepository(window.localStorage, industryProfileSeed);

export interface UseIndustryProfileResult {
  kind: IndustryKind | null;
  profile: IndustryProfile | null;
  access: MedicalAccess;
  redacted: RedactedHospitalProfile | null;
  error: string | null;
  isLoading: boolean;
  save: (profile: IndustryProfile) => Promise<SaveProfileResult>;
}

export const useIndustryProfile = (
  customerId: string,
  kind: IndustryKind | null
): UseIndustryProfileResult => {
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [access, setAccess] = useState<MedicalAccess>('full');
  const [redacted, setRedacted] = useState<RedactedHospitalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!kind) {
      setProfile(null);
      setRedacted(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    repository
      .get(customerId, kind)
      .then((loaded) => {
        if (cancelled) return;
        setProfile(loaded.profile);
        setAccess(loaded.access);
        setRedacted(loaded.redacted);
        setError(loaded.error ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, kind]);

  const save = useCallback(
    async (next: IndustryProfile) => {
      const result = await repository.save(customerId, next);
      if (result.ok) setProfile(result.profile);
      return result;
    },
    [customerId]
  );

  return { kind, profile, access, redacted, error, isLoading, save };
};

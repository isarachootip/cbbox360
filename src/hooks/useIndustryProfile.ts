import { useCallback, useEffect, useState } from 'react';
import { IndustryKind, IndustryProfile } from '../types/industryProfile';
import {
  SaveProfileResult,
  createLocalIndustryProfileRepository,
} from '../services/industryProfileRepository';
import { industryProfileSeed } from '../data/industryProfiles';

// Phase 2A: browser storage. Phase 2B replaces this line with the HTTP repository.
const repository = createLocalIndustryProfileRepository(window.localStorage, industryProfileSeed);

export interface UseIndustryProfileResult {
  kind: IndustryKind | null;
  profile: IndustryProfile | null;
  isLoading: boolean;
  save: (profile: IndustryProfile) => Promise<SaveProfileResult>;
}

export const useIndustryProfile = (
  customerId: string,
  kind: IndustryKind | null
): UseIndustryProfileResult => {
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!kind) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    repository
      .get(customerId, kind)
      .then((loaded) => {
        if (!cancelled) setProfile(loaded);
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

  return { kind, profile, isLoading, save };
};

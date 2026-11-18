import { BusinessTemplateId } from '../../types';
import { IndustryKind, IndustryProfile } from '../../types/industryProfile';
import {
  INDUSTRY_VARIABLE_ADAPTERS,
  KIND_BY_TEMPLATE_MAP,
  VariableExtractOptions,
} from '../../../modules/industry-profiles/variableAdapters';

export const templateToIndustryKind = (templateId: BusinessTemplateId): IndustryKind | null =>
  KIND_BY_TEMPLATE_MAP[templateId] ?? null;

/**
 * Dispatches variable extraction through the pluggable module adapter map without switch/if branches.
 */
export const buildIndustryVariables = (
  profile: IndustryProfile | null,
  options: VariableExtractOptions = {}
): Record<string, string> => {
  if (!profile) return {};
  const adapter = INDUSTRY_VARIABLE_ADAPTERS[profile.kind] as
    | ((p: IndustryProfile, opts: VariableExtractOptions) => Record<string, string>)
    | undefined;
  return adapter ? adapter(profile, options) : {};
};

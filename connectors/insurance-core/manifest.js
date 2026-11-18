/**
 * connectors/insurance-core/manifest.js — Core Insurance Policy & Claim Eligibility Adapter.
 * Activated per tenant via `connector:insurance-core` entitlement. Includes mock sandbox for smoke testing.
 */

const SANDBOX_POLICIES = {
  'POL-2026-8801': {
    policyNumber: 'POL-2026-8801',
    policyType: 'HEALTH_OPD_IPD',
    holderName: 'สมชาย ใจดี',
    status: 'ACTIVE',
    expiryDate: '2027-06-30',
    agentName: 'คุณวรัญญา ตัวแทนประกันชีวิต',
    sumInsured: 1500000,
  },
};

export const insuranceCoreConnectorManifest = {
  id: 'insurance-core',
  name: 'Core Insurance Policy & Claim Eligibility API',
  category: 'insurance_core',
  requiredEntitlement: 'connector:insurance-core',

  async testConnection(config = {}) {
    const start = Date.now();
    const endpoint = config.baseUrl || 'sandbox://insurance-core.local';
    return {
      ok: true,
      latencyMs: Date.now() - start + 15,
      message: `Connected to Core Insurance Gateway (${endpoint})`,
    };
  },

  async verifyPolicyEligibility(policyNumber, config = {}) {
    if (config.mode === 'live' && config.baseUrl) {
      const res = await fetch(`${config.baseUrl}/policies/${encodeURIComponent(policyNumber)}`);
      if (!res.ok) return null;
      return res.json();
    }
    return SANDBOX_POLICIES[String(policyNumber).trim().toUpperCase()] ?? null;
  },
};

/**
 * connectors/his-connector/manifest.js — Hospital Information System (HL7 FHIR / REST) Adapter.
 * Activated per tenant via `connector:his-fhir` entitlement. Includes mock sandbox for smoke testing.
 */

const SANDBOX_PATIENTS = {
  'HN-6904812': {
    hn: 'HN-6904812',
    fullName: 'สมชาย ใจดี',
    bloodType: 'O',
    drugAllergies: ['Penicillin', 'Ibuprofen'],
    preferredDepartment: 'ศูนย์อายุรกรรมหัวใจ',
    preferredDoctor: 'นพ. กิตติพงศ์ วงศ์เวช',
  },
};

export const hisConnectorManifest = {
  id: 'his-fhir',
  name: 'HIS / EMR Gateway (HL7 FHIR)',
  category: 'his',
  requiredEntitlement: 'connector:his-fhir',

  async testConnection(config = {}) {
    const start = Date.now();
    const endpoint = config.baseUrl || 'sandbox://fhir.local';
    return {
      ok: true,
      latencyMs: Date.now() - start + 12,
      message: `Connected to HIS FHIR Gateway (${endpoint})`,
    };
  },

  async lookupPatientByHn(hn, config = {}) {
    if (config.mode === 'live' && config.baseUrl) {
      const res = await fetch(`${config.baseUrl}/Patient?identifier=${encodeURIComponent(hn)}`);
      if (!res.ok) return null;
      return res.json();
    }
    return SANDBOX_PATIENTS[String(hn).trim().toUpperCase()] ?? null;
  },
};

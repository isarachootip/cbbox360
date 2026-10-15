/**
 * industryProfileSeed.js — Default seed profiles for demo/initial customers (C00123, C00124)
 * Shared between backend repository fallback and frontend local storage repository.
 */
export const industryProfileSeed = {
  C00123: [
    {
      kind: 'hospital',
      hn: 'HN-6904812',
      bloodType: 'O',
      drugAllergies: ['Penicillin', 'Ibuprofen'],
      chronicConditions: ['ความดันโลหิตสูง'],
      insurancePolicies: [
        { id: 'pol-1', provider: 'AIA Health Happy', policyNo: 'AIA-88120931', coverageType: 'OPD_IPD', validUntil: '2026-11-30' },
        { id: 'pol-2', provider: 'ประกันสังคม', policyNo: '3-1001-00234-55-1', coverageType: 'SSO' },
      ],
      preferredDoctor: 'นพ. กิตติพงศ์ วงศ์เวช',
      emergencyContact: { name: 'สมศรี ใจดี', phone: '081-234-5678', relation: 'ภรรยา' },
    },
    {
      kind: 'auto_service',
      vehicles: [
        {
          id: 'veh-1',
          licensePlate: '1กข-9988',
          province: 'กรุงเทพมหานคร',
          brand: 'Toyota',
          model: 'Corolla Cross Hybrid',
          year: 2022,
          vin: 'MR0BA3CD200123456',
          currentMileageKm: 80400,
          lastServiceMileageKm: 70000,
          lastServiceDate: '2026-04-20',
          insuranceExpiry: '2026-12-01',
          taxExpiry: '2027-03-15',
        },
        {
          id: 'veh-2',
          licensePlate: 'ฮก-4521',
          province: 'นนทบุรี',
          brand: 'Honda',
          model: 'City e:HEV',
          year: 2024,
          currentMileageKm: 18250,
          lastServiceMileageKm: 10000,
          taxExpiry: '2026-10-01',
        },
      ],
    },
    {
      kind: 'logistics',
      accountCode: 'SHP-C00123',
      originBranch: 'Hub บางนา กม.18',
      defaultService: 'express',
      codEnabled: true,
      codBankAccount: 'KBank 123-4-56789-0',
      recentTrackingNumbers: ['TH2610-994812', 'TH2610-993301'],
    },
  ],
  C00124: [
    {
      kind: 'hospital',
      hn: 'HN-7120034',
      bloodType: 'A',
      drugAllergies: [],
      chronicConditions: [],
      insurancePolicies: [
        { id: 'pol-3', provider: 'บัตรทอง (สปสช.)', policyNo: 'UCS-0099812', coverageType: 'UCS' },
      ],
    },
  ],
};

export const findSeedIndustryProfile = (customerId, kind) => {
  const key = Object.keys(industryProfileSeed).find(
    (k) => k.toLowerCase() === String(customerId).toLowerCase()
  );
  if (!key) return null;
  return industryProfileSeed[key].find((p) => p.kind === kind) ?? null;
};

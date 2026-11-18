import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const walkSourceFiles = (dirPath: string): string[] => {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'migrations') continue;
      files.push(...walkSourceFiles(full));
    } else if (/\.(ts|tsx|js)$/.test(entry.name) && !entry.name.includes('.test.')) {
      files.push(full);
    }
  }
  return files;
};

describe('Phase 3 Architecture Boundaries & Zero Industry Coupling in Core', () => {
  it('ensures core/ contains ZERO industry names, legacy order codes, or imports from modules/connectors', () => {
    const coreFiles = walkSourceFiles(path.join(ROOT, 'core'));
    expect(coreFiles.length).toBeGreaterThan(15);

    const forbiddenPattern =
      /\b(hospital|auto_service|logistics|b2b_wholesale|ecommerce|doctor|nurse|SO-10482|TH2609-88412)\b|credit-sales|from\s+['"][^'"]*(modules|connectors)\//i;

    const violations: string[] = [];
    for (const file of coreFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (forbiddenPattern.test(line)) {
          const rel = path.relative(ROOT, file).replace(/\\/g, '/');
          violations.push(`${rel}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('ensures core services & Customer360 UI have zero industry if/switch branches or hard-coded B2B/Hospital widgets', () => {
    const profileSvc = fs.readFileSync(
      path.join(ROOT, 'server/services/industryProfileService.js'),
      'utf8'
    );
    expect(profileSvc).not.toMatch(/kind\s*[!=]==?\s*['"]hospital['"]/);

    const botEngine = fs.readFileSync(
      path.join(ROOT, 'server/services/botEngineService.js'),
      'utf8'
    );
    expect(botEngine).not.toContain('SO-10482');
    expect(botEngine).not.toContain('TH2609-88412');

    const promptBuilder = fs.readFileSync(
      path.join(ROOT, 'server/utils/promptBuilder.js'),
      'utf8'
    );
    expect(promptBuilder).not.toContain('SO-10482');
    expect(promptBuilder).not.toContain('TH2609-88412');

    const customer360 = fs.readFileSync(
      path.join(ROOT, 'src/pages/Customer360Page.tsx'),
      'utf8'
    );
    expect(customer360).not.toContain('AllergyAlertBanner');
    expect(customer360).not.toContain('CreditTaskConfirmModal');
    expect(customer360).toContain('ExtensionSlot');

    const rightRail = fs.readFileSync(
      path.join(ROOT, 'src/components/customer-360/CustomerRightSummaryColumn.tsx'),
      'utf8'
    );
    expect(rightRail).not.toContain('วงเงินเครดิต');
    expect(rightRail).toContain('ExtensionSlot');

    const industryVars = fs.readFileSync(
      path.join(ROOT, 'src/domain/industry/industryVariables.ts'),
      'utf8'
    );
    expect(industryVars).not.toMatch(/case\s+['"](hospital|auto_service|logistics|contact_center)['"]/);

    const industryTab = fs.readFileSync(
      path.join(ROOT, 'src/components/customer-360/industry/IndustryProfileTab.tsx'),
      'utf8'
    );
    expect(industryTab).not.toMatch(/case\s+['"](hospital|auto_service|logistics|contact_center)['"]/);
  });

  it('registers credit-sales module and external connectors under modules/ and connectors/', async () => {
    const creditManifestPath = path.join(ROOT, 'modules/credit-sales/manifest.js');
    const hisConnectorPath = path.join(ROOT, 'connectors/his-connector/manifest.js');
    const insConnectorPath = path.join(ROOT, 'connectors/insurance-core/manifest.js');

    expect(fs.existsSync(creditManifestPath)).toBe(true);
    expect(fs.existsSync(hisConnectorPath)).toBe(true);
    expect(fs.existsSync(insConnectorPath)).toBe(true);
  });
});

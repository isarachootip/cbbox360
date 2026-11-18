#!/usr/bin/env node
/**
 * scripts/cb360.js — CusBox360 Multi-Tenant & Industry Template CLI.
 * Commands:
 *   node scripts/cb360.js tenant create --template <name> --slug <slug> [--name "<title>"] [--domain <host>]
 *   node scripts/cb360.js template validate [name-or-path]
 *   node scripts/cb360.js template import <name-or-path> --tenant <slug>
 *   node scripts/cb360.js template export --tenant <slug> [--out <file.yaml>]
 */
import fs from 'fs';
import path from 'path';
import {
  loadBuiltInTemplate,
  loadTemplateFromFile,
  validateTemplateObject,
} from '../core/server/template-engine/templateValidator.js';
import { templateEngine } from '../core/server/template-engine/templateApplier.js';
import { exportTenantTemplateYaml } from '../core/server/template-engine/templateExporter.js';
import { tenantRepository } from '../core/server/tenancy/tenantRepository.js';

const parseFlags = (argv) => {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
};

export const runCli = async (argv = process.argv.slice(2)) => {
  const { positional, flags } = parseFlags(argv);
  const [group, action, target] = positional;

  if (group === 'tenant' && action === 'create') {
    const templateName = flags.template;
    const slug = flags.slug || target;
    if (!templateName || !slug) {
      throw new Error('Usage: tenant create --template <name> --slug <slug> [--name "<title>"] [--domain <host>]');
    }
    const result = await templateEngine.createTenantFromTemplate({
      slug,
      name: flags.name || slug,
      templateName,
      domain: flags.domain,
    });
    return { command: 'tenant:create', ...result };
  }

  if (group === 'template' && action === 'validate') {
    const templatesDir = path.resolve(process.cwd(), 'templates');
    const names = target
      ? [target]
      : fs
          .readdirSync(templatesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && fs.existsSync(path.join(templatesDir, d.name, 'template.yaml')))
          .map((d) => d.name);

    const report = [];
    for (const item of names) {
      const obj = fs.existsSync(item) ? loadTemplateFromFile(item) : loadBuiltInTemplate(item, templatesDir);
      const check = validateTemplateObject(obj);
      report.push({ target: item, ...check });
      if (!check.valid) {
        throw new Error(`Validation failed for ${item}: ${check.errors.join(', ')}`);
      }
    }
    return { command: 'template:validate', valid: true, report };
  }

  if (group === 'template' && action === 'import') {
    const tenantSlug = flags.tenant;
    if (!target || !tenantSlug) {
      throw new Error('Usage: template import <name-or-file> --tenant <slug>');
    }
    const tenant = await tenantRepository.findBySlug(tenantSlug);
    if (!tenant) throw new Error(`TENANT_NOT_FOUND: ${tenantSlug}`);
    const result = await templateEngine.importTemplateIntoTenant(tenant.id, target);
    return { command: 'template:import', ...result };
  }

  if (group === 'template' && action === 'export') {
    const tenantSlug = flags.tenant || 'default';
    const tenant = await tenantRepository.findBySlug(tenantSlug);
    if (!tenant) throw new Error(`TENANT_NOT_FOUND: ${tenantSlug}`);
    const yaml = await exportTenantTemplateYaml({ tenantId: tenant.id });
    if (flags.out) {
      fs.writeFileSync(path.resolve(process.cwd(), flags.out), yaml, 'utf8');
    }
    return { command: 'template:export', tenant: tenantSlug, yaml };
  }

  throw new Error(
    'Unknown command. Supported: "tenant create", "template validate", "template import", "template export"'
  );
};

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(process.cwd(), 'scripts/cb360.js');

if (isMainModule) {
  runCli()
    .then((out) => {
      if (out.command === 'template:export' && !process.argv.includes('--out')) {
        process.stdout.write(out.yaml);
      } else {
        console.log(JSON.stringify(out, null, 2));
      }
    })
    .catch((err) => {
      console.error(`❌ [cb360 CLI Error]: ${err.message}`);
      process.exit(1);
    });
}

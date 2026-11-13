import { describe, it, expect } from 'vitest';
import { initialUserAccounts } from './users';
import { agentOperatorAccounts } from './agentOperators';
import { OPERATOR_SEED_DEFINITIONS } from '../../shared/agentSkills.js';

describe('agentOperatorAccounts & initialUserAccounts', () => {
  it('provisions 3 telephone skill agents (Ext 101-103) and 2 LINE Chat & Shop skill agents', () => {
    const telAgents = initialUserAccounts.filter((u) => u.skills?.includes('telephone'));
    const chatAgents = initialUserAccounts.filter((u) => u.skills?.includes('line_chat_shop'));

    expect(telAgents).toHaveLength(3);
    expect(telAgents.map((u) => u.username)).toEqual(['tel_agent1', 'tel_agent2', 'tel_agent3']);
    expect(telAgents.map((u) => u.extension)).toEqual(['101', '102', '103']);
    expect(telAgents.every((u) => u.role === 'SF_2' && u.status === 'active' && u.password === '1234')).toBe(true);

    expect(chatAgents).toHaveLength(2);
    expect(chatAgents.map((u) => u.username)).toEqual(['chat_agent1', 'chat_agent2']);
    expect(chatAgents.every((u) => u.role === 'SF_1' && u.status === 'active' && u.password === '1234')).toBe(true);
  });

  it('keeps frontend operator accounts aligned with shared backend seed definitions', () => {
    expect(agentOperatorAccounts.map((u) => ({
      username: u.username,
      role: u.role,
      skills: u.skills ?? [],
      extension: u.extension ?? '',
    }))).toEqual(
      OPERATOR_SEED_DEFINITIONS.map((s: { username: string; role: string; skills: string[]; extension: string }) => ({
        username: s.username,
        role: s.role,
        skills: s.skills,
        extension: s.extension,
      }))
    );
  });
});

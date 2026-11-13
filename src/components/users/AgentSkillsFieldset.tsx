import React from 'react';
import { PhoneCall, MessageCircle } from 'lucide-react';
import { AgentSkill } from '../../types';
import { AGENT_SKILL_OPTIONS } from '../../data/agentOperators';

interface AgentSkillsFieldsetProps {
  skills: AgentSkill[];
  extension: string;
  onChange: (nextSkills: AgentSkill[], nextExtension: string) => void;
}

export const AgentSkillsFieldset: React.FC<AgentSkillsFieldsetProps> = ({
  skills,
  extension,
  onChange,
}) => {
  const toggleSkill = (skill: AgentSkill) => {
    const exists = skills.includes(skill);
    const nextSkills = exists ? skills.filter((s) => s !== skill) : [...skills, skill];
    onChange(nextSkills, extension);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-subtle p-3 space-y-2.5">
      <div className="font-semibold text-text-primary">
        ทักษะเจ้าหน้าที่ & คู่สายโทรศัพท์ (Agent Skills & 3CX Extension)
      </div>

      <div className="grid grid-cols-1 gap-2">
        {AGENT_SKILL_OPTIONS.map((opt) => {
          const checked = skills.includes(opt.key);
          const Icon = opt.key === 'telephone' ? PhoneCall : MessageCircle;
          return (
            <label
              key={opt.key}
              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors bg-white ${
                checked ? 'border-brand' : 'border-border hover:border-brand/50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSkill(opt.key)}
                className="mt-0.5 rounded border-border text-brand focus:ring-brand"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                  <Icon className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{opt.label}</span>
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">{opt.description}</div>
              </div>
            </label>
          );
        })}
      </div>

      <div>
        <label className="block text-text-secondary font-medium mb-1">
          เลขคู่สายภายใน 3CX (Extension)
        </label>
        <input
          type="text"
          maxLength={20}
          value={extension}
          onChange={(e) => onChange(skills, e.target.value)}
          placeholder="เช่น 101, 102 (เว้นว่างได้หากไม่ได้รับสายโทรศัพท์)"
          className="w-full px-3 py-1.5 bg-white border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
        />
      </div>
    </div>
  );
};

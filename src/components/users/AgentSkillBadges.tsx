import React from 'react';
import { PhoneCall, MessageCircle } from 'lucide-react';
import { AgentSkill } from '../../types';

interface AgentSkillBadgesProps {
  skills?: AgentSkill[];
  extension?: string;
}

const SKILL_DISPLAY: Record<
  AgentSkill,
  { label: string; textClass: string; dotClass: string; Icon: React.FC<{ className?: string }> }
> = {
  telephone: {
    label: 'Telephone',
    textClass: 'text-brand',
    dotClass: 'bg-brand',
    Icon: PhoneCall,
  },
  line_chat_shop: {
    label: 'LINE Chat & Shop',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
    Icon: MessageCircle,
  },
};

export const AgentSkillBadges: React.FC<AgentSkillBadgesProps> = ({ skills = [], extension = '' }) => {
  const cleanExt = extension.trim();
  if (skills.length === 0 && !cleanExt) {
    return <span className="text-text-secondary">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {skills.map((skill) => {
            const cfg = SKILL_DISPLAY[skill];
            if (!cfg) return null;
            const { Icon } = cfg;
            return (
              <span
                key={skill}
                className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.textClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                <Icon className="w-3 h-3 shrink-0" />
                <span>{cfg.label}</span>
              </span>
            );
          })}
        </div>
      )}
      {cleanExt && (
        <span className="font-mono text-[11px] font-semibold text-text-secondary">
          Ext. {cleanExt}
        </span>
      )}
    </div>
  );
};

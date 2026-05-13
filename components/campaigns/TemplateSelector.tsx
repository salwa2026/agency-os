'use client';

import { CAMPAIGN_TEMPLATES } from '@/lib/campaigns/templates';
import type { CampaignType } from '@/types/campaign';

interface TemplateSelectorProps {
  selected: CampaignType | null;
  onSelect: (type: CampaignType) => void;
}

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAMPAIGN_TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.type;
          return (
            <button
              key={tpl.type}
              onClick={() => onSelect(tpl.type as CampaignType)}
              className={`group text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-[#A3E635]/50 bg-[#A3E635]/8'
                  : 'border-[#2E2E2E] bg-[#1E1E1E] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{tpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#A3E635]' : 'text-zinc-200'}`}>
                      {tpl.name}
                    </p>
                    {isSelected && (
                      <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/15 border border-[#A3E635]/25 px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{tpl.description}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] text-zinc-600">
                      ⚡ {tpl.agentCount} agents
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      📅 ~{tpl.estimatedDays} days
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {tpl.phases.length} phases
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-[#A3E635]/15 space-y-1.5">
                  {tpl.phases.map((phase) => (
                    <div key={phase.phase} className="flex items-start gap-2">
                      <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                        P{phase.phase}
                      </span>
                      <div>
                        <p className="text-[10px] font-medium text-zinc-400">{phase.phaseName}</p>
                        <p className="text-[10px] text-zinc-600">
                          {phase.agents.map((a) => a.taskTitle).join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

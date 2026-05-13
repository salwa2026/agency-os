'use client';

import { useState } from 'react';
import { buildAgentCommand } from '@/lib/campaigns/commandBuilder';
import { getTemplate } from '@/lib/campaigns/templates';
import { AGENT_DEFINITIONS } from '@/lib/agents/systemPrompts';
import type { CampaignBrief, CampaignType } from '@/types/campaign';

interface CommandPreviewProps {
  campaignType: CampaignType;
  brief: CampaignBrief;
}

export default function CommandPreview({ campaignType, brief }: CommandPreviewProps) {
  const template = getTemplate(campaignType);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  if (!template) return null;

  const allAgents = template.phases.flatMap((phase) =>
    phase.agents.map((agent) => ({
      ...agent,
      phase: phase.phase,
      phaseName: phase.phaseName,
      agentDef: AGENT_DEFINITIONS[agent.agentType as keyof typeof AGENT_DEFINITIONS],
      command: buildAgentCommand(agent.commandTemplate, brief),
    })),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#A3E635]/15 bg-[#A3E635]/5 px-4 py-3">
        <p className="text-xs text-[#A3E635] font-medium">
          ⚡ {allAgents.length} agent commands auto-generated from your brief
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Review each command below. Agents will receive these as their task instructions.
        </p>
      </div>

      {template.phases.map((phase) => (
        <div key={phase.phase} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-2 py-0.5 rounded">
              Phase {phase.phase}
            </span>
            <span className="text-xs text-zinc-400 font-medium">{phase.phaseName}</span>
            {phase.agents[0]?.dependsOnPhase && (
              <span className="text-[10px] text-zinc-600">
                (runs after Phase {phase.agents[0].dependsOnPhase})
              </span>
            )}
          </div>

          {phase.agents.map((agent) => {
            const agentDef = AGENT_DEFINITIONS[agent.agentType as keyof typeof AGENT_DEFINITIONS];
            const command = buildAgentCommand(agent.commandTemplate, brief);
            const key = `${phase.phase}-${agent.agentType}`;
            const isExpanded = expandedAgent === key;

            return (
              <div
                key={key}
                className="rounded-xl border border-[#2E2E2E] bg-[#1E1E1E] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedAgent(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#252525] transition-colors"
                >
                  <span className="text-lg shrink-0">{agentDef?.emoji ?? '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{agent.taskTitle}</p>
                    <p className="text-xs text-zinc-500">{agentDef?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-600">
                      {command.length.toLocaleString()} chars
                    </span>
                    <span className={`text-zinc-500 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#2E2E2E]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0F0F0F]">
                      <span className="text-[10px] text-zinc-600 font-mono">COMMAND PREVIEW</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(command)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {command}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

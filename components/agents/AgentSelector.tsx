'use client';

import { useState } from 'react';
import { getAllAgents, AgentType, AgentDefinition } from '@/lib/agents/systemPrompts';

interface AgentSelectorProps {
  selectedAgent: AgentType | null;
  onSelect: (agentType: AgentType) => void;
}

export default function AgentSelector({ selectedAgent, onSelect }: AgentSelectorProps) {
  const [hoveredAgent, setHoveredAgent] = useState<AgentType | null>(null);
  const agents = getAllAgents();
  const previewAgent = hoveredAgent
    ? agents.find((a) => a.type === hoveredAgent)
    : selectedAgent
    ? agents.find((a) => a.type === selectedAgent)
    : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.type}
            agent={agent}
            isSelected={selectedAgent === agent.type}
            onClick={() => onSelect(agent.type as AgentType)}
            onMouseEnter={() => setHoveredAgent(agent.type as AgentType)}
            onMouseLeave={() => setHoveredAgent(null)}
          />
        ))}
      </div>

      {/* Capability preview panel */}
      {previewAgent && (
        <div className="rounded-lg border border-zinc-700/50 bg-[#1A1A1A] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{previewAgent.emoji}</span>
            <span className="text-sm font-medium text-zinc-200">{previewAgent.name}</span>
            {selectedAgent === previewAgent.type && (
              <span className="ml-auto text-xs text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded">Selected</span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{previewAgent.description}</p>
          <div className="space-y-1">
            <p className="text-xs text-zinc-600 uppercase tracking-wide">Capabilities</p>
            <ul className="space-y-0.5">
              {previewAgent.capabilities.slice(0, 5).map((cap) => (
                <li key={cap} className="text-xs text-zinc-400 flex items-start gap-1.5">
                  <span className="text-[#A3E635] mt-0.5 shrink-0">›</span>
                  {cap}
                </li>
              ))}
              {previewAgent.capabilities.length > 5 && (
                <li className="text-xs text-zinc-600">
                  +{previewAgent.capabilities.length - 5} more
                </li>
              )}
            </ul>
          </div>
          <p className="text-xs text-zinc-600 italic">Output: {previewAgent.outputFormat}</p>
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  agent: AgentDefinition;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all ${
        isSelected
          ? 'border-[#A3E635]/50 bg-[#A3E635]/10 text-[#A3E635]'
          : 'border-zinc-700/50 bg-[#1E1E1E] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      <span className="text-2xl">{agent.emoji}</span>
      <span className="text-xs font-medium leading-tight">{agent.name.replace(' Agent', '')}</span>
    </button>
  );
}

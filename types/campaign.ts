export type CampaignType =
  | 'product_launch'
  | 'brand_awareness'
  | 'lead_generation'
  | 'seo_content_drive'
  | 'social_media_campaign'
  | 'brand_refresh'
  | 'paid_ads_campaign'
  | 'custom';

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';

export interface CampaignBrief {
  companyName: string;
  industry: string;
  targetAudience: string;
  mainGoal: string;
  kpis: string[];
  budget: string;
  timeline: string;
  tone: string;
  uniqueSellingPoints: string[];
  competitors: string[];
  channels: string[];
  additionalContext?: string;
}

export interface CampaignAgentPhase {
  phase: number;
  phaseName: string;
  agents: Array<{
    agentType: string;
    taskTitle: string;
    commandTemplate: string;
    dependsOnPhase?: number;
  }>;
}

export interface CampaignTemplate {
  type: CampaignType;
  name: string;
  description: string;
  icon: string;
  estimatedDays: number;
  agentCount: number;
  phases: CampaignAgentPhase[];
  tags: string[];
}

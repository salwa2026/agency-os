import type { CampaignTemplate } from '@/types/campaign';

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    type: 'product_launch',
    name: 'Full Product Launch',
    description: 'End-to-end launch campaign from strategy through execution across all channels',
    icon: '🚀',
    estimatedDays: 21,
    agentCount: 7,
    tags: ['strategy', 'branding', 'copy', 'social', 'paid', 'seo', 'presentation'],
    phases: [
      {
        phase: 1,
        phaseName: 'Strategy & Positioning',
        agents: [
          {
            agentType: 'strategist',
            taskTitle: 'Go-to-Market Strategy',
            commandTemplate: 'gtm_strategy',
          },
          {
            agentType: 'branding',
            taskTitle: 'Brand Messaging Framework',
            commandTemplate: 'brand_messaging',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Creative & Content',
        agents: [
          {
            agentType: 'copywriter',
            taskTitle: 'Launch Copy & Messaging',
            commandTemplate: 'launch_copy',
            dependsOnPhase: 1,
          },
          {
            agentType: 'seo',
            taskTitle: 'SEO Launch Strategy',
            commandTemplate: 'seo_launch',
            dependsOnPhase: 1,
          },
        ],
      },
      {
        phase: 3,
        phaseName: 'Channel Execution',
        agents: [
          {
            agentType: 'social_media',
            taskTitle: 'Launch Social Media Campaign',
            commandTemplate: 'social_launch',
            dependsOnPhase: 2,
          },
          {
            agentType: 'paid_ads',
            taskTitle: 'Paid Acquisition Campaign',
            commandTemplate: 'paid_launch',
            dependsOnPhase: 2,
          },
        ],
      },
      {
        phase: 4,
        phaseName: 'Reporting & Pitch',
        agents: [
          {
            agentType: 'presentation',
            taskTitle: 'Launch Deck & Results Presentation',
            commandTemplate: 'launch_deck',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'brand_awareness',
    name: 'Brand Awareness Campaign',
    description: 'Build brand recognition and authority through content, social, and PR',
    icon: '📢',
    estimatedDays: 14,
    agentCount: 4,
    tags: ['branding', 'social', 'copy', 'seo'],
    phases: [
      {
        phase: 1,
        phaseName: 'Brand Foundation',
        agents: [
          {
            agentType: 'branding',
            taskTitle: 'Brand Identity & Voice Guidelines',
            commandTemplate: 'brand_identity',
          },
          {
            agentType: 'strategist',
            taskTitle: 'Awareness Campaign Strategy',
            commandTemplate: 'awareness_strategy',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Content Production',
        agents: [
          {
            agentType: 'copywriter',
            taskTitle: 'Thought Leadership Content Series',
            commandTemplate: 'thought_leadership',
            dependsOnPhase: 1,
          },
          {
            agentType: 'social_media',
            taskTitle: '90-Day Social Media Calendar',
            commandTemplate: 'social_calendar_90',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'lead_generation',
    name: 'Lead Generation Machine',
    description: 'Multi-channel lead gen funnel with paid ads, SEO content, and conversion copy',
    icon: '🎯',
    estimatedDays: 14,
    agentCount: 5,
    tags: ['paid_ads', 'seo', 'copy', 'strategy', 'data'],
    phases: [
      {
        phase: 1,
        phaseName: 'Funnel Strategy',
        agents: [
          {
            agentType: 'strategist',
            taskTitle: 'Lead Gen Funnel Strategy & ICP',
            commandTemplate: 'leadgen_strategy',
          },
          {
            agentType: 'data_analyst',
            taskTitle: 'Audience & Channel Analysis',
            commandTemplate: 'audience_analysis',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Content & Ads',
        agents: [
          {
            agentType: 'copywriter',
            taskTitle: 'Landing Pages & Lead Magnet Copy',
            commandTemplate: 'landing_page_copy',
            dependsOnPhase: 1,
          },
          {
            agentType: 'paid_ads',
            taskTitle: 'Lead Gen Ad Campaigns',
            commandTemplate: 'leadgen_ads',
            dependsOnPhase: 1,
          },
          {
            agentType: 'seo',
            taskTitle: 'High-Intent SEO Content Plan',
            commandTemplate: 'highintent_seo',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'seo_content_drive',
    name: 'SEO Content Drive',
    description: 'Systematic topical authority building with keyword research, content briefs, and blog production',
    icon: '🔍',
    estimatedDays: 30,
    agentCount: 3,
    tags: ['seo', 'copy', 'data'],
    phases: [
      {
        phase: 1,
        phaseName: 'Keyword Research & Strategy',
        agents: [
          {
            agentType: 'seo',
            taskTitle: 'Keyword Research & Content Cluster Map',
            commandTemplate: 'keyword_research',
          },
          {
            agentType: 'data_analyst',
            taskTitle: 'Competitor SEO Gap Analysis',
            commandTemplate: 'seo_gap_analysis',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Content Production',
        agents: [
          {
            agentType: 'copywriter',
            taskTitle: 'Pillar Page & Blog Content (10 articles)',
            commandTemplate: 'seo_content_batch',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'social_media_campaign',
    name: 'Social Media Campaign',
    description: 'Platform-optimized content calendar, influencer brief, and community strategy',
    icon: '📱',
    estimatedDays: 7,
    agentCount: 2,
    tags: ['social', 'copy'],
    phases: [
      {
        phase: 1,
        phaseName: 'Strategy & Calendar',
        agents: [
          {
            agentType: 'social_media',
            taskTitle: '30-Day Social Media Calendar',
            commandTemplate: 'social_calendar_30',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Copy & Creative',
        agents: [
          {
            agentType: 'copywriter',
            taskTitle: 'Social Media Copy Library',
            commandTemplate: 'social_copy_library',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'brand_refresh',
    name: 'Brand Refresh',
    description: 'Repositioning strategy, new messaging framework, updated visual direction, and rollout plan',
    icon: '✨',
    estimatedDays: 14,
    agentCount: 4,
    tags: ['branding', 'strategy', 'copy', 'presentation'],
    phases: [
      {
        phase: 1,
        phaseName: 'Audit & Strategy',
        agents: [
          {
            agentType: 'strategist',
            taskTitle: 'Brand Audit & Repositioning Strategy',
            commandTemplate: 'brand_audit',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'New Brand Identity',
        agents: [
          {
            agentType: 'branding',
            taskTitle: 'New Brand Identity Framework',
            commandTemplate: 'brand_refresh_identity',
            dependsOnPhase: 1,
          },
          {
            agentType: 'copywriter',
            taskTitle: 'Updated Website & Marketing Copy',
            commandTemplate: 'refresh_copy',
            dependsOnPhase: 1,
          },
        ],
      },
      {
        phase: 3,
        phaseName: 'Rollout',
        agents: [
          {
            agentType: 'presentation',
            taskTitle: 'Brand Refresh Rollout Deck',
            commandTemplate: 'brand_rollout_deck',
            dependsOnPhase: 2,
          },
        ],
      },
    ],
  },
  {
    type: 'paid_ads_campaign',
    name: 'Paid Ads Sprint',
    description: 'Full paid media campaign across Google, Meta, and LinkedIn with copy, targeting, and optimization plan',
    icon: '📊',
    estimatedDays: 5,
    agentCount: 3,
    tags: ['paid_ads', 'copy', 'data'],
    phases: [
      {
        phase: 1,
        phaseName: 'Campaign Architecture',
        agents: [
          {
            agentType: 'paid_ads',
            taskTitle: 'Multi-Platform Ad Campaign Setup',
            commandTemplate: 'paid_campaign_full',
          },
          {
            agentType: 'copywriter',
            taskTitle: 'Ad Copy Variations Library',
            commandTemplate: 'ad_copy_library',
          },
        ],
      },
      {
        phase: 2,
        phaseName: 'Measurement',
        agents: [
          {
            agentType: 'data_analyst',
            taskTitle: 'Campaign KPI Framework & Attribution Model',
            commandTemplate: 'paid_kpi_framework',
            dependsOnPhase: 1,
          },
        ],
      },
    ],
  },
];

export function getTemplate(type: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find((t) => t.type === type);
}

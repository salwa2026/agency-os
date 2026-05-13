import type { CampaignBrief } from '@/types/campaign';

function briefContext(brief: CampaignBrief): string {
  return `CAMPAIGN BRIEF:
Company: ${brief.companyName}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience}
Main Goal: ${brief.mainGoal}
KPIs: ${brief.kpis.join(', ')}
Budget: ${brief.budget}
Timeline: ${brief.timeline}
Brand Tone: ${brief.tone}
Unique Selling Points: ${brief.uniqueSellingPoints.join(', ')}
Competitors: ${brief.competitors.join(', ') || 'None specified'}
Channels: ${brief.channels.join(', ')}
${brief.additionalContext ? `Additional Context: ${brief.additionalContext}` : ''}`;
}

type CommandBuilder = (brief: CampaignBrief) => string;

const COMMAND_BUILDERS: Record<string, CommandBuilder> = {
  gtm_strategy: (brief) => `${briefContext(brief)}

TASK: Create a comprehensive Go-to-Market strategy for ${brief.companyName}.

Deliver:
1. Market sizing (TAM/SAM/SOM) with assumptions
2. Target segment prioritization (which audience segment to win first)
3. Positioning statement and key differentiation
4. Channel mix recommendation with budget allocation rationale
5. Launch sequence: pre-launch, launch day, post-launch (30/60/90 days)
6. Success metrics and review cadence
7. Risk assessment with mitigation strategies
8. 90-day action plan with week-by-week priorities

Be specific with numbers, timelines, and clear owners for each action item.`,

  brand_messaging: (brief) => `${briefContext(brief)}

TASK: Develop a complete Brand Messaging Framework for ${brief.companyName}.

Deliver:
1. Brand positioning statement (full format)
2. Core value proposition (1-2 sentences max)
3. Tagline options (5 variations with rationale)
4. Messaging pillars (3-4 themes that support the positioning)
5. Proof points for each pillar
6. Brand voice: 4 personality dimensions with Do/Don't examples
7. Elevator pitch variations (15 sec, 30 sec, 60 sec)
8. Audience-specific message variants (for each audience segment)
9. Competitive messaging map (how we differ from each competitor)
10. Message don'ts — what to NEVER say or claim`,

  launch_copy: (brief) => `${briefContext(brief)}

TASK: Write all copy for the ${brief.companyName} product/service launch.

Deliver:
1. Homepage copy (hero headline + subheadline + 3 variations, feature sections, social proof section, pricing CTA)
2. Email launch sequence (5 emails: teaser → announcement → feature deep-dive → social proof → last chance)
3. Product/service page copy
4. 3 landing page variants for A/B testing
5. Ad headline bank (30 headlines for paid channels)
6. Press release (standard format, 400-500 words)
7. CEO/Founder quote for launch announcements
8. All CTAs (10 variations, benefit-focused)

Format each as ready-to-paste copy blocks with character counts where applicable.`,

  seo_launch: (brief) => `${briefContext(brief)}

TASK: Build the SEO launch strategy for ${brief.companyName}.

Deliver:
1. 50 target keywords organized into: Primary (10), Secondary (20), Long-tail (20)
   Format as table: Keyword | Volume | KD | Intent | Priority
2. Content cluster map (hub pages + spoke articles for each cluster)
3. On-page SEO specs for 5 core pages (title tags, meta descriptions, H1s, schema markup)
4. Technical SEO launch checklist (20+ items)
5. Link acquisition strategy: 10 specific link opportunities with outreach approach
6. Launch-day SEO tasks (in priority order)
7. 90-day organic growth projection (conservative / realistic / optimistic)`,

  social_launch: (brief) => `${briefContext(brief)}

TASK: Create the launch social media campaign for ${brief.companyName}.

Deliver:
1. Launch day content for each platform: Instagram (3 posts + 5 Stories + 1 Reel script), LinkedIn (2 posts), X/Twitter (thread + 3 standalone tweets), TikTok (2 video scripts)
2. Pre-launch teaser content (1 week before): 5 posts per platform
3. Post-launch momentum content (2 weeks after launch): content calendar
4. Hashtag strategy per platform (primary, secondary, niche)
5. Community engagement scripts (responses to common comments/questions)
6. Influencer outreach brief (what to send to nano/micro influencers)
7. Paid social post booster recommendations (which organic posts to boost and why)`,

  paid_launch: (brief) => `${briefContext(brief)}

TASK: Build the complete paid acquisition campaign for the ${brief.companyName} launch.

Deliver:
1. Google Ads: Campaign structure, 3 ad groups, 10 headlines + 4 descriptions each, negative keyword list, bidding strategy
2. Meta Ads: 3 campaign objectives, audience targeting specs (cold, warm, retargeting), creative brief for 3 static + 1 video format, copy for each format
3. LinkedIn Ads (if B2B): 2 campaign types (Sponsored Content + InMail), targeting spec, ad copy
4. Budget allocation table: platform / daily budget / monthly / expected CPL / expected ROAS
5. Landing page recommendations for each ad type
6. A/B test plan: what to test first and how to evaluate
7. Week 1 optimization checklist`,

  launch_deck: (brief) => `${briefContext(brief)}

TASK: Build the complete launch presentation deck for ${brief.companyName}.

Deliver a 15-slide deck:
1. Title slide
2. Executive summary (the 3 things the audience must remember)
3. Market opportunity (problem + size)
4. Solution overview
5. Product/service deep dive
6. Target audience and ICP
7. Go-to-market strategy
8. Competitive landscape
9. Pricing and packaging
10. Launch timeline
11. Channel strategy
12. Budget and ROI projections
13. Team and execution plan
14. Success metrics
15. Call to action / next steps

For each slide: Key Message (1 sentence), Visual Direction, Speaker Notes, Supporting Data.`,

  brand_identity: (brief) => `${briefContext(brief)}

TASK: Create the complete brand identity system for ${brief.companyName}.

Deliver:
1. Brand essence statement (the single idea the brand owns)
2. Brand purpose, vision, and mission (distinct, not interchangeable)
3. Brand personality: 4 archetypes with behavioral description
4. Visual identity direction:
   - Color palette (primary + secondary + accent + neutrals) with psychological rationale
   - Typography system (display font + body font + why they work together)
   - Photography/imagery style (3 specific visual references described in detail)
   - Logo concept direction (3 distinct concepts described)
   - Do/Don't visual examples
5. Brand voice: 4 dimensions with writing before/after examples
6. Brand application examples: business card, social profile, email signature, pitch deck cover
7. Brand guidelines table of contents (what the full guidelines doc would include)`,

  awareness_strategy: (brief) => `${briefContext(brief)}

TASK: Build the brand awareness campaign strategy for ${brief.companyName}.

Deliver:
1. Awareness campaign objectives and KPIs (reach, impression share, share of voice, brand search volume targets)
2. Target audience persona (3 distinct personas with psychographic profiles)
3. Content strategy: themes, formats, frequency per channel
4. Earned media strategy (PR angles, journalist targets, story hooks)
5. Thought leadership plan (CEO/founder positioning, speaking opportunities, podcast targets)
6. Partnership and co-marketing opportunities (5 specific brands to approach)
7. 3-month campaign calendar
8. Budget allocation with expected reach per channel
9. Brand lift measurement approach`,

  thought_leadership: (brief) => `${briefContext(brief)}

TASK: Write a 10-piece thought leadership content series for ${brief.companyName}.

For each of the 10 pieces, provide:
- Title (optimized for sharing)
- Format (long-form article / LinkedIn post series / Twitter thread / video script)
- Target platform
- Core argument (1-sentence thesis)
- Full outline (H2s + key points under each)
- Opening hook paragraph
- Data/stats/examples to include
- CTA for each piece

Themes to cover: industry trends, contrarian takes, frameworks, case studies, predictions, how-tos, and founder stories. Ensure variety of format and angle across all 10 pieces.`,

  social_calendar_90: (brief) => `${briefContext(brief)}

TASK: Create a complete 90-day social media content calendar for ${brief.companyName}.

Deliver:
1. Content pillar framework (5-6 pillars with rationale and posting frequency)
2. Platform strategy for each channel (what type of content, tone, format, frequency)
3. Monthly themes (3 distinct themes — one per month)
4. Week-by-week calendar (Month 1 in full detail, Months 2-3 as content types + themes)
5. 30 specific post ideas with: platform, format, hook, caption draft, hashtags
6. Engagement strategy: optimal posting times, comment/DM response templates
7. Monthly KPIs to track
8. Content creation workflow and approval process`,

  leadgen_strategy: (brief) => `${briefContext(brief)}

TASK: Design the complete lead generation funnel strategy for ${brief.companyName}.

Deliver:
1. ICP (Ideal Customer Profile): firmographic, demographic, psychographic, behavioral signals
2. Buyer journey map: Awareness → Consideration → Decision touchpoints for each ICP
3. Lead magnet strategy: 5 lead magnet concepts with format, topic, and conversion estimate
4. Funnel architecture: top/middle/bottom of funnel content and offers
5. Lead scoring model: criteria and point values
6. Nurture sequence blueprint: trigger → email sequence → conversion point
7. Channel prioritization matrix: reach × intent × cost × fit
8. Monthly lead volume targets and CAC assumptions
9. Sales/marketing handoff criteria (MQL → SQL definition)`,

  audience_analysis: (brief) => `${briefContext(brief)}

TASK: Perform a comprehensive audience and channel analysis for ${brief.companyName}'s lead gen campaign.

Deliver:
1. Audience segment analysis (3-5 segments ranked by: size × accessibility × willingness to pay)
2. Platform-by-platform breakdown: estimated audience size, CPL benchmarks, competition level
3. Competitor analysis: where are they getting leads? What's working? What gaps exist?
4. Keyword intent map: 40 high-intent search terms segmented by funnel stage
5. Channel ROI model: projected leads × close rate × LTV for each channel
6. Recommended channel stack with rationale (primary, secondary, experimental)
7. Attribution model recommendation
8. Quick wins vs. long-term plays breakdown`,

  landing_page_copy: (brief) => `${briefContext(brief)}

TASK: Write high-conversion landing page and lead magnet copy for ${brief.companyName}.

Deliver:
1. Primary lead gen landing page (full copy):
   - Hero: 3 headline variations + subheadline + form copy + CTA
   - Problem section (agitation)
   - Solution section (with benefit bullets)
   - Social proof section (testimonial frameworks + stat placeholders)
   - How it works (3 steps)
   - FAQ (8 questions + answers)
   - Footer CTA
2. Lead magnet copy (for each of 3 lead magnet formats):
   - Cover page copy
   - Introduction
   - Section headings
3. Thank-you page copy
4. Email confirmation copy
5. Form field labels and placeholder text
6. All micro-copy (privacy note, button labels, error messages)`,

  leadgen_ads: (brief) => `${briefContext(brief)}

TASK: Build the full lead generation paid advertising campaign for ${brief.companyName}.

Deliver:
1. Google Search Ads:
   - 4 ad groups (by intent level: low → high)
   - 3 RSA variants per ad group (15 headlines + 4 descriptions each)
   - Negative keyword master list (50+ terms)
   - Bidding strategy: Target CPA with initial manual CPC recommendations

2. Meta Lead Ads:
   - 3 audience segments with targeting specs
   - 2 creative formats per segment (image + video brief)
   - Lead form questions (optimized for quality vs. volume)
   - Ad copy for each audience variant

3. LinkedIn (B2B focus):
   - 2 Sponsored Content campaigns
   - 1 Message Ad campaign
   - Targeting: job titles + seniority + industry + company size

4. Retargeting campaign: audiences, messaging, frequency caps

5. Weekly optimization checklist
6. Lead quality scoring from ad source`,

  highintent_seo: (brief) => `${briefContext(brief)}

TASK: Develop a high-intent SEO content plan for ${brief.companyName} to capture purchase-ready traffic.

Deliver:
1. High-intent keyword map (50 keywords): commercial and transactional intent only
   Table: Keyword | Volume | KD | CPC ($) | Content Format | URL
2. Comparison page strategy: 10 "[Brand] vs [Competitor]" page briefs
3. "Best [Category]" listicle briefs: 5 articles
4. Use-case pages: 5 pages targeting specific job-to-be-done searches
5. FAQ/People Also Ask content: 20 questions with optimized answers
6. Internal linking strategy connecting all high-intent pages
7. Schema markup recommendations for each page type
8. Content brief template for the copywriting team`,

  keyword_research: (brief) => `${briefContext(brief)}

TASK: Conduct comprehensive keyword research and build a content cluster map for ${brief.companyName}.

Deliver:
1. Keyword research report:
   - 100 keywords organized into 5-7 topic clusters
   - Table: Keyword | Monthly Volume | KD | Intent | Content Format | Cluster
2. Topic cluster map for each cluster:
   - 1 pillar page (broad topic, 3,000+ words)
   - 6-8 cluster pages (subtopics, 1,200-2,000 words)
   - Internal linking architecture
3. Quick-win opportunities (KD < 30, Volume > 500): top 20
4. SERP feature opportunities (featured snippets, PAA boxes): top 15
5. Competitor keyword gap: 20 keywords competitors rank for that ${brief.companyName} doesn't
6. Content production priority order with rationale
7. 6-month organic traffic projection`,

  seo_gap_analysis: (brief) => `${briefContext(brief)}

TASK: Conduct an SEO competitor gap analysis for ${brief.companyName}.

Deliver:
1. Competitor organic presence analysis (for each competitor in the brief):
   - Estimated organic traffic
   - Top performing pages
   - Keyword strategy patterns
   - Content cadence and formats
2. Keyword gaps: searches competitors capture that ${brief.companyName} misses
3. Backlink gap: link sources competitors have that we should target
4. Content gap: topic areas competitors cover well that we don't
5. SERP real estate analysis: features (snippets, PAA, maps) competitors own
6. Quick wins list: 20 specific keywords to target in the next 30 days
7. Differentiation opportunities: where competitors are weak and we can dominate
8. 6-month roadmap to close the top 3 gaps`,

  seo_content_batch: (brief) => `${briefContext(brief)}

TASK: Write 10 SEO-optimized articles for ${brief.companyName} as a complete content batch.

For each article, provide:
- Title (primary keyword + click-worthy)
- Meta description (155 chars, includes keyword)
- H1 (same as title or optimized variant)
- Full outline: H2s + H3s + key points under each heading
- Word count recommendation
- Internal linking suggestions (which existing pages to link to)
- External authority sources to cite
- Image/visual recommendations
- Schema markup type

Topics: Cover the full funnel — 3 awareness articles, 3 consideration articles, 2 comparison articles, 2 conversion articles. Make each title specific and compelling, not generic.`,

  social_calendar_30: (brief) => `${briefContext(brief)}

TASK: Create a complete 30-day social media content calendar for ${brief.companyName}.

Deliver:
1. Platform strategy overview (which platforms, why, what content type)
2. Content pillar framework (5 pillars, rationale, posting frequency each)
3. Complete 30-day calendar in table format:
   Date | Platform | Format | Pillar | Hook/Caption | Visual Direction | Hashtags | Best Time to Post
4. Week 1 fully written captions (all platforms, all posts)
5. Engagement scripts (how to respond to common comment types)
6. Story sequences (5 complete story sequences, 4-6 frames each)
7. One Reel/TikTok script (fully scripted, with visual direction)
8. Performance benchmarks to track by platform`,

  social_copy_library: (brief) => `${briefContext(brief)}

TASK: Build a reusable social media copy library for ${brief.companyName}.

Deliver:
1. 10 LinkedIn long-form post templates (business insights format)
2. 10 Instagram caption templates (per content pillar, 2 per pillar)
3. 15 tweet/X post templates (hooks, threads, standalone)
4. 5 TikTok/Reel script templates (trending formats adapted to brand)
5. 20 story frame sequences (4 frames each)
6. Caption modifier bank: 30 opening hooks, 20 CTAs, 15 engagement questions
7. Hashtag sets: 5 sets per platform (20-25 hashtags each, organized by reach)
8. Bio copy: 5 variations per platform
9. Link-in-bio copy (5 variants)
10. Comment/reply templates (10 for each: compliments, questions, complaints, collaboration requests)`,

  brand_audit: (brief) => `${briefContext(brief)}

TASK: Conduct a comprehensive brand audit and repositioning strategy for ${brief.companyName}.

Deliver:
1. Brand audit report:
   - Current positioning assessment (what the brand actually stands for vs. what it claims)
   - Visual identity consistency score and gaps
   - Voice and tone analysis across touchpoints
   - Competitive positioning map (2×2 matrix)
   - Customer perception analysis (based on context provided)
   - Brand equity assessment (strengths and liabilities)

2. Repositioning strategy:
   - Recommended new positioning (with rationale)
   - What to keep, what to change, what to retire
   - New target audience definition (if changing)
   - Differentiation strategy vs. current competitors
   - Messaging pivot plan (old message → new message for each segment)
   - Risk assessment of repositioning

3. Brand refresh roadmap (90-day phased plan)`,

  brand_refresh_identity: (brief) => `${briefContext(brief)}

TASK: Design the new brand identity framework for ${brief.companyName}'s refresh.

Deliver:
1. Refreshed brand essence (what stays, what evolves, why)
2. New visual identity direction:
   - Color system: primary palette evolution (what changes and why), new HEX codes + usage rules
   - Typography refresh: new type pairings with personality rationale
   - Logo evolution direction: 3 concept directions (evolutionary vs. revolutionary)
   - Updated photography/imagery style guide
   - Pattern/texture/icon system direction
3. New brand voice framework (all updated guidelines)
4. Before/after comparison: current vs. refreshed across 5 touchpoints
5. Brand refresh guidelines document outline
6. Internal launch announcement templates (for staff)
7. FAQ for clients/stakeholders ("why we refreshed")`,

  refresh_copy: (brief) => `${briefContext(brief)}

TASK: Rewrite all marketing copy for ${brief.companyName}'s brand refresh.

Deliver:
1. New website copy (complete rewrite):
   - Homepage (all sections)
   - About page (new brand story + team section)
   - Services/Products page
   - Contact page
2. New tagline bank (10 options with strategy rationale)
3. New company description variants (25 words / 50 words / 100 words)
4. New email signature copy
5. Social media bio updates (all platforms)
6. Pitch deck opening narrative
7. Sales deck value proposition slides
8. Customer-facing proposal cover copy`,

  brand_rollout_deck: (brief) => `${briefContext(brief)}

TASK: Build the brand refresh rollout presentation for ${brief.companyName}.

Deliver a 20-slide deck:
1. Why We Refreshed (the story)
2. Our New Positioning
3. Brand Essence
4. Visual Identity: Before & After
5. New Color System
6. New Typography
7. Photography & Imagery Direction
8. Logo Evolution
9. Brand Voice Examples
10. Website Before & After
11. Social Media Before & After
12. Email & Document Templates
13. Brand Don'ts
14. Rollout Timeline (Internal)
15. Rollout Timeline (External)
16. FAQs
17. Asset Delivery Schedule
18. Brand Governance (who approves what)
19. Measuring Brand Lift
20. Questions

For each slide: Key Message, Visual Direction, Speaker Notes.`,

  paid_campaign_full: (brief) => `${briefContext(brief)}

TASK: Build a complete multi-platform paid media campaign for ${brief.companyName}.

Deliver:

GOOGLE ADS:
- Search campaigns (3): branded, competitor, generic
- Campaign structure, ad groups (4 per campaign), keywords (20 per ad group)
- RSA copy: 15 headlines + 4 descriptions per ad group
- Display campaign: 5 banner concepts (described), copy variants
- Bidding strategy recommendation per campaign

META ADS (Facebook + Instagram):
- Campaign objectives: Awareness, Traffic, Conversions
- Cold audiences (3): interest-based targeting specs
- Warm audiences (2): engagement + website visitor retargeting
- Creative brief: 5 creative concepts described in detail
- Copy: primary text + headline + CTA for each audience/format

TIKTOK ADS:
- 2 campaign types: TopView and In-Feed
- Script for 2 short-form video ads (15 sec each, fully scripted)

BUDGET ALLOCATION TABLE (by platform, campaign, weekly/monthly)

PERFORMANCE TARGETS TABLE (by platform: impressions, clicks, CTR, CPM, CPC, conversions, ROAS)`,

  ad_copy_library: (brief) => `${briefContext(brief)}

TASK: Build a comprehensive ad copy library for ${brief.companyName}.

Deliver:
1. Google Ads copy bank:
   - 30 search headlines (varied angles: benefit, urgency, social proof, question, feature)
   - 10 descriptions
   - 10 responsive display ad headlines + 5 descriptions
   - 5 call-only ad scripts

2. Meta/Instagram copy bank:
   - 15 primary text variants (short 50 words, medium 125 words, long 200 words)
   - 15 headline variants (problem-focused, benefit-focused, curiosity)
   - 10 link description variants

3. LinkedIn copy bank:
   - 10 Sponsored Content intros
   - 5 Message Ad scripts
   - 5 InMail subject lines + body

4. Universal hooks bank:
   - 20 scroll-stopping opening lines (works across platforms)
   - 15 urgency/scarcity variants
   - 15 social proof copy blocks

5. A/B test matrix: which copy elements to test first and why`,

  paid_kpi_framework: (brief) => `${briefContext(brief)}

TASK: Build the campaign KPI framework and attribution model for ${brief.companyName}'s paid media.

Deliver:
1. Full KPI framework:
   Table: Metric | Definition | Target | Measurement Method | Review Cadence

   Cover: Reach & Awareness, Engagement, Traffic, Lead Generation, Conversion, Revenue

2. Attribution model recommendation:
   - Current vs. recommended model
   - Multi-touch attribution logic for ${brief.companyName}'s funnel
   - Implementation requirements (pixels, UTM structure, CRM integration)

3. UTM parameter structure (master taxonomy for all campaigns)

4. Dashboard design spec:
   - Daily view (what to check every day)
   - Weekly review template
   - Monthly board report format

5. Anomaly detection rules (when to escalate vs. optimize normally)

6. ROI calculation model:
   - CAC formula with all cost inputs
   - LTV assumptions and how to validate
   - Payback period calculation`,
};

export function buildAgentCommand(templateKey: string, brief: CampaignBrief): string {
  const builder = COMMAND_BUILDERS[templateKey];
  if (!builder) {
    return `${briefContext(brief)}\n\nTASK: Complete the requested marketing deliverable for ${brief.companyName} based on the campaign brief above. Be comprehensive, specific, and immediately actionable.`;
  }
  return builder(brief);
}

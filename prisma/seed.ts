import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed AI Agents
  const agents = [
    { type: 'social_media', name: 'Social Media Agent', emoji: '📱', description: 'Creates platform-native social content across all channels' },
    { type: 'paid_ads', name: 'Paid Ads Agent', emoji: '📊', description: 'Writes high-converting ad copy for Google, Meta, and LinkedIn' },
    { type: 'copywriter', name: 'Copywriter Agent', emoji: '✍️', description: 'Produces persuasive marketing copy and brand messaging' },
    { type: 'seo', name: 'SEO Agent', emoji: '🔍', description: 'Optimizes content for search engines and creates SEO strategies' },
    { type: 'data_analyst', name: 'Data Analyst Agent', emoji: '📈', description: 'Analyzes data, identifies trends, and produces insights reports' },
    { type: 'branding', name: 'Branding Agent', emoji: '🎨', description: 'Develops brand identity, guidelines, and visual direction' },
    { type: 'strategist', name: 'Strategist Agent', emoji: '🧭', description: 'Creates go-to-market strategies and campaign frameworks' },
    { type: 'presentation', name: 'Presentation Agent', emoji: '🖥️', description: 'Designs compelling slide decks and executive presentations' },
    { type: 'designer', name: 'Designer Agent', emoji: '🎭', description: 'Generates design briefs, mood boards, and creative direction' },
    { type: 'developer', name: 'Developer Agent', emoji: '💻', description: 'Writes and reviews code, technical documentation, and specs' },
    { type: 'excel', name: 'Excel Agent', emoji: '📋', description: 'Builds spreadsheet models, formulas, and data pipelines' },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { type: agent.type },
      create: agent,
      update: { name: agent.name, emoji: agent.emoji, description: agent.description },
    });
  }

  console.log(`✅ Seeded ${agents.length} AI agents`);
  console.log('✅ Database seeded successfully');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Set up your .env file (copy from .env.example)');
  console.log('  2. Run: npm run dev');
  console.log('  3. Run worker: npm run worker:dev');
  console.log('  4. Open: http://localhost:3000');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

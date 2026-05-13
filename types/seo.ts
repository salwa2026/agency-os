export type ContentType =
  | 'blog_post'
  | 'landing_page'
  | 'product_page'
  | 'pillar_page'
  | 'case_study'
  | 'comparison'
  | 'guide';

export type BriefPriority = 'low' | 'medium' | 'high';

export type ContentBriefStatus =
  | 'draft'
  | 'ready'
  | 'in_progress'
  | 'in_review'
  | 'published'
  | 'archived';

export interface OutlineSection {
  heading: string;
  type: 'h2' | 'h3';
  notes: string;
  wordCount?: number;
}

export interface GeneratedBrief {
  metaTitle: string;
  metaDescription: string;
  outline: OutlineSection[];
  targetAudience: string;
  searchIntent: string;
  keyTakeaways: string[];
  internalLinkOpportunities: string[];
  competitorReferences: string[];
  ctaSuggestion: string;
}

export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  targetUrl: string | null;
  searchVolume: number | null;
  difficulty: number | null;
  currentPosition: number | null;
  previousPosition: number | null;
  targetPosition: number;
  tags: string[];
  notes: string | null;
  tracked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentBrief {
  id: string;
  projectId: string;
  keywordId: string | null;
  targetKeyword: string;
  secondaryKeywords: string[];
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  outline: OutlineSection[] | null;
  wordCountTarget: number;
  contentType: ContentType;
  status: ContentBriefStatus;
  priority: BriefPriority;
  dueDate: string | null;
  publishedUrl: string | null;
  notes: string | null;
  aiGenerated: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  keyword?: Pick<Keyword, 'keyword'> | null;
  createdBy: { name: string | null; image: string | null };
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  blog_post: 'Blog Post',
  landing_page: 'Landing Page',
  product_page: 'Product Page',
  pillar_page: 'Pillar Page',
  case_study: 'Case Study',
  comparison: 'Comparison',
  guide: 'Guide',
};

export const BRIEF_STATUS_LABELS: Record<ContentBriefStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  in_progress: 'In Progress',
  in_review: 'In Review',
  published: 'Published',
  archived: 'Archived',
};

export const BRIEF_STATUS_COLORS: Record<ContentBriefStatus, string> = {
  draft: 'text-zinc-500 bg-zinc-800 border-zinc-700',
  ready: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_progress: 'text-[#A3E635] bg-[#A3E635]/10 border-[#A3E635]/20',
  in_review: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  archived: 'text-zinc-600 bg-zinc-800 border-zinc-700',
};

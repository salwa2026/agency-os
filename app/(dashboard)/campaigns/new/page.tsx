import { redirect } from 'next/navigation';
import CampaignBuilder from '@/components/campaigns/CampaignBuilder';

interface Props {
  searchParams: { projectId?: string; projectName?: string };
}

export const metadata = { title: 'New Campaign' };

export default function NewCampaignPage({ searchParams }: Props) {
  const { projectId, projectName } = searchParams;

  if (!projectId || !projectName) {
    redirect('/campaigns');
  }

  return (
    <CampaignBuilder
      projectId={projectId}
      projectName={decodeURIComponent(projectName)}
    />
  );
}

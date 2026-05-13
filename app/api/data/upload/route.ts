import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseCSV, parseXLSX, isSupported } from '@/lib/data/fileParser';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId are required' }, { status: 400 });
  }

  if (!isSupported(file.name)) {
    return NextResponse.json({ error: 'Only CSV and Excel (.xlsx/.xls) files are supported' }, { status: 400 });
  }

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Parse file
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  let parsed;

  if (ext === 'csv') {
    const text = await file.text();
    parsed = parseCSV(text);
  } else {
    const buffer = await file.arrayBuffer();
    parsed = await parseXLSX(buffer);
  }

  if (parsed.headers.length === 0) {
    return NextResponse.json({ error: 'File appears to be empty or could not be parsed' }, { status: 400 });
  }

  const MAX_ROWS = 5000;
  const rows = parsed.rows.slice(0, MAX_ROWS);
  const preview = rows.slice(0, 50);

  const dataFile = await prisma.dataFile.create({
    data: {
      projectId,
      uploadedById: session.user.id,
      name: file.name.replace(/\.[^.]+$/, ''),
      originalName: file.name,
      mimeType: file.type || 'text/csv',
      size: file.size,
      rowCount: rows.length,
      columnCount: parsed.columnCount,
      headers: parsed.headers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preview: preview as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fullData: rows as any,
    },
  });

  return NextResponse.json(dataFile, { status: 201 });
}

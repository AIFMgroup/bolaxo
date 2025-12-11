import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    const dataRoom = await prisma.dataRoom.upsert({
      where: { listingId },
      update: {},
      create: {
        listingId,
        createdBy: 'system',
      },
    });

    return NextResponse.json({ success: true, data: dataRoom });
  } catch (error) {
    console.error('DataRoom create error:', error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}

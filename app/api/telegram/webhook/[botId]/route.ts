import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;

    // Verify bot exists and is active
    const bot = await prisma.telegramBot.findFirst({
      where: {
        id: botId,
        isActive: true,
      },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const update = await req.json();

    // Handle the update based on your flow configuration
    // For now, we'll just log it
    console.log('Received Telegram update:', update);

    // Here you would typically:
    // 1. Parse the update
    // 2. Find matching flows
    // 3. Execute the flows
    // 4. Send responses

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 
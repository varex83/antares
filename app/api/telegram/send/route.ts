import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, chatId, message } = await req.json();

    if (!botId || !chatId || !message) {
      return NextResponse.json(
        { error: 'Bot ID, chat ID, and message are required' },
        { status: 400 }
      );
    }

    // Get the bot and verify ownership
    const bot = await prisma.telegramBot.findFirst({
      where: {
        id: botId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create message record
    const messageRecord = await prisma.telegramMessage.create({
      data: {
        chatId,
        message,
        botId,
      },
    });

    // Send message to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      await prisma.telegramMessage.update({
        where: { id: messageRecord.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Failed to send message to Telegram' },
        { status: 500 }
      );
    }

    // Update message status
    await prisma.telegramMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, messageId: messageRecord.id });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 
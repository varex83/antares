import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    const bot = await prisma.telegramBot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Get updates from Telegram to find the chat ID
    const response = await fetch(
      `https://api.telegram.org/bot${bot.token}/getUpdates`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to get updates from Telegram', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.ok || !data.result || data.result.length === 0) {
      return NextResponse.json(
        { 
          error: 'No messages found. Please send a message to your bot first.',
          instructions: `1. Open Telegram and search for your bot
2. Send any message to your bot
3. Try this request again to get your chat ID` 
        },
        { status: 404 }
      );
    }

    // Get the chat ID from the most recent message
    const chatId = data.result[0].message?.chat?.id;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Could not find chat ID in updates' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chatId,
      message: 'Add this chat ID to your .env file as TELEGRAM_CHAT_ID',
    });

  } catch (error) {
    console.error('Error setting up webhook:', error);
    return NextResponse.json(
      { error: 'Failed to set up webhook' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET endpoint to fetch blockchain configurations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { blockchainConfigs: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      configs: user.blockchainConfigs
    });
  } catch (error) {
    console.error('Error fetching blockchain configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain configurations' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new blockchain configuration
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, network, infuraApiKey, walletAddress } = await request.json();

    if (!name || !network || !infuraApiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const config = await prisma.blockchainConfig.create({
      data: {
        name,
        network,
        infuraApiKey,
        walletAddress,
        userId: user.id
      }
    });

    return NextResponse.json({
      config
    });
  } catch (error) {
    console.error('Error creating blockchain config:', error);
    return NextResponse.json(
      { error: 'Failed to create blockchain configuration' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a blockchain configuration
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { configId } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify ownership before deletion
    const config = await prisma.blockchainConfig.findFirst({
      where: {
        id: configId,
        userId: user.id
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.blockchainConfig.delete({
      where: { id: configId }
    });

    return NextResponse.json({
      status: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blockchain config:', error);
    return NextResponse.json(
      { error: 'Failed to delete blockchain configuration' },
      { status: 500 }
    );
  }
} 
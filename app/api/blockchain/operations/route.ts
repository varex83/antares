import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Web3 } from 'web3';

// Helper function to get Web3 instance
async function getWeb3Instance(configId: string) {
  const config = await prisma.blockchainConfig.findUnique({
    where: { id: configId }
  });

  if (!config) {
    throw new Error('Blockchain configuration not found');
  }

  const networkUrl = `https://${config.network}.infura.io/v3/${config.infuraApiKey}`;
  return new Web3(networkUrl);
}

// POST endpoint to check account balance
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { operation, configId, address, toAddress, amount } = await request.json();

    if (!configId || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has access to this configuration
    const config = await prisma.blockchainConfig.findFirst({
      where: {
        id: configId,
        user: {
          email: session.user.email
        }
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found or unauthorized' },
        { status: 404 }
      );
    }

    const web3 = await getWeb3Instance(configId);

    switch (operation) {
      case 'checkBalance': {
        if (!address) {
          return NextResponse.json(
            { error: 'Address is required for balance check' },
            { status: 400 }
          );
        }

        const balance = await web3.eth.getBalance(address);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');

        return NextResponse.json({
          address,
          balance: balanceInEth,
          unit: 'ETH'
        });
      }

      case 'transfer': {
        if (!config.walletAddress) {
          return NextResponse.json(
            { error: 'No wallet address configured for this network' },
            { status: 400 }
          );
        }

        if (!toAddress || !amount) {
          return NextResponse.json(
            { error: 'To address and amount are required for transfer' },
            { status: 400 }
          );
        }

        // Convert amount to Wei
        const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

        // Create transaction
        const transaction = {
          from: config.walletAddress,
          to: toAddress,
          value: amountInWei,
          gas: '21000', // Standard gas limit for ETH transfers
        };

        // Send transaction
        const receipt = await web3.eth.sendTransaction(transaction);

        return NextResponse.json({
          status: 'success',
          transactionHash: receipt.transactionHash,
          from: config.walletAddress,
          to: toAddress,
          amount,
          unit: 'ETH'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing blockchain operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform blockchain operation', details: (error as Error).message },
      { status: 500 }
    );
  }
} 
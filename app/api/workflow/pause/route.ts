import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Store paused workflows
export const pausedWorkflows = new Set<string>();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Add workflow to paused set
    pausedWorkflows.add(workflowId);

    return NextResponse.json({
      status: 'Workflow paused successfully',
    });
  } catch (error) {
    console.error('Error pausing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to pause workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export function isPaused(workflowId: string): boolean {
  return pausedWorkflows.has(workflowId);
} 
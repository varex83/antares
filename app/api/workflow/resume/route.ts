import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pausedWorkflows } from '../pause/route';

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

    // Remove workflow from paused set
    pausedWorkflows.delete(workflowId);

    return NextResponse.json({
      status: 'Workflow resumed successfully',
    });
  } catch (error) {
    console.error('Error resuming workflow:', error);
    return NextResponse.json(
      { error: 'Failed to resume workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
} 
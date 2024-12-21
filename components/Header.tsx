import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Play, Pause, Square } from 'lucide-react';
import { useReactFlow } from 'reactflow';

interface HeaderProps {
  onSave?: () => void;
}

export default function Header({ onSave }: HeaderProps) {
  const router = useRouter();
  const reactFlow = useReactFlow();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    try {
      setStatus('Starting workflow...');
      console.log('Starting workflow with nodes:', reactFlow.getNodes());
      console.log('and edges:', reactFlow.getEdges());
      
      const response = await fetch('/api/workflow/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: reactFlow.getNodes(),
          edges: reactFlow.getEdges(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start workflow');
      }

      const data = await response.json();
      console.log('Workflow started:', data);
      setWorkflowId(data.workflowId);
      setIsRunning(true);
      setIsPaused(false);

      // Update status based on results
      const hasTriggers = data.results.some((result: any) => 
        result.status.includes('Started listening')
      );

      if (hasTriggers) {
        setStatus('Waiting for triggers...');
      } else {
        setStatus('Running...');
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      setStatus(`Error: ${(error as Error).message}`);
    }
  }, [reactFlow]);

  const handlePause = useCallback(async () => {
    if (!workflowId) return;

    try {
      const response = await fetch('/api/workflow/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to pause workflow');
      }

      setIsPaused(true);
      setStatus('Paused');
    } catch (error) {
      console.error('Error pausing workflow:', error);
      setStatus(`Error: ${(error as Error).message}`);
    }
  }, [workflowId]);

  const handleResume = useCallback(async () => {
    if (!workflowId) return;

    try {
      const response = await fetch('/api/workflow/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resume workflow');
      }

      setIsPaused(false);
      setStatus('Running...');
    } catch (error) {
      console.error('Error resuming workflow:', error);
      setStatus(`Error: ${(error as Error).message}`);
    }
  }, [workflowId]);

  const handleStop = useCallback(async () => {
    if (!workflowId) return;

    try {
      const response = await fetch('/api/workflow/start', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop workflow');
      }

      setIsRunning(false);
      setIsPaused(false);
      setWorkflowId(null);
      setStatus(null);
    } catch (error) {
      console.error('Error stopping workflow:', error);
      setStatus(`Error: ${(error as Error).message}`);
    }
  }, [workflowId]);

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Flow Builder</h1>
        {status && (
          <div className={`px-3 py-1 rounded-full text-sm ${
            status.includes('Error')
              ? 'bg-red-100 text-red-800'
              : status.includes('Paused')
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {status}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </>
        )}
        <button
          onClick={() => router.push('/settings')}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 
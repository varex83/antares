import { useCallback, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';

interface NodeData {
  label: string;
  nodeType: string;
  model?: string;
  systemPrompt?: string;
  onUpdate?: (data: Partial<NodeData>) => void;
}

interface NodeProps {
  data: NodeData;
}

const AVAILABLE_MODELS = [
  'gpt-4',
  'gpt-4-turbo-preview',
  'gpt-3.5-turbo',
];

export function OpenAIChatNode({ data }: NodeProps) {
  const [model, setModel] = useState<string>(data.model || 'gpt-3.5-turbo');
  const [systemPrompt, setSystemPrompt] = useState<string>(data.systemPrompt || '');

  // Initialize model on mount
  useEffect(() => {
    if (!data.model) {
      data.onUpdate?.({ model: 'gpt-3.5-turbo' });
    }
  }, [data.model, data.onUpdate]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setModel(value);
    data.onUpdate?.({ model: value });
  }, [data.onUpdate]);

  const handleSystemPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSystemPrompt(value);
    data.onUpdate?.({ systemPrompt: value });
  }, [data.onUpdate]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="rounded-full w-3 h-3 bg-purple-500" />
          <div className="ml-2">
            <div className="text-lg font-bold">OpenAI Chat</div>
          </div>
        </div>
        <div className="mt-2">
          <select
            value={model}
            onChange={handleModelChange}
            className="w-full p-2 border rounded"
          >
            {AVAILABLE_MODELS.map((modelName) => (
              <option key={modelName} value={modelName}>
                {modelName}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <textarea
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="System prompt (optional)"
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 
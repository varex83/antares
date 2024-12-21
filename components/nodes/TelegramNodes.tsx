'use client';

import { useCallback, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';

interface TelegramBot {
  id: string;
  name: string;
  token: string;
}

interface NodeData {
  label: string;
  nodeType: string;
  selectedBot?: string;
  messagePattern?: string;
  message?: string;
  onUpdate?: (data: Partial<NodeData>) => void;
}

interface NodeProps {
  data: NodeData;
}

export function TelegramTriggerNode({ data }: NodeProps) {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>(data.selectedBot || '');
  const [messagePattern, setMessagePattern] = useState<string>(data.messagePattern || '');

  useEffect(() => {
    fetch('/api/telegram/bots')
      .then((res) => res.json())
      .then((data) => {
        if (data.bots) {
          setBots(data.bots);
        }
      })
      .catch(console.error);
  }, []);

  const handleBotChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBot(value);
    data.onUpdate?.({ selectedBot: value });
  }, [data.onUpdate]);

  const handlePatternChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessagePattern(value);
    data.onUpdate?.({ messagePattern: value });
  }, [data.onUpdate]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="rounded-full w-3 h-3 bg-green-500" />
          <div className="ml-2">
            <div className="text-lg font-bold">Telegram Trigger</div>
          </div>
        </div>
        <div className="mt-2">
          <select
            value={selectedBot}
            onChange={handleBotChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a bot</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <input
            type="text"
            value={messagePattern}
            onChange={handlePatternChange}
            placeholder="Message pattern"
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function TelegramSendNode({ data }: NodeProps) {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>(data.selectedBot || '');
  const [message, setMessage] = useState<string>(data.message || '');

  useEffect(() => {
    fetch('/api/telegram/bots')
      .then((res) => res.json())
      .then((data) => {
        if (data.bots) {
          setBots(data.bots);
        }
      })
      .catch(console.error);
  }, []);

  const handleBotChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBot(value);
    data.onUpdate?.({ selectedBot: value });
  }, [data.onUpdate]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    data.onUpdate?.({ message: value });
  }, [data.onUpdate]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="rounded-full w-3 h-3 bg-blue-500" />
          <div className="ml-2">
            <div className="text-lg font-bold">Telegram Send</div>
          </div>
        </div>
        <div className="mt-2">
          <select
            value={selectedBot}
            onChange={handleBotChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a bot</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <textarea
            value={message}
            onChange={handleMessageChange}
            placeholder="Message to send"
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
} 
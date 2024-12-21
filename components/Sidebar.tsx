import React from 'react';
import { Bot, Webhook, Clock, Database, ArrowRightLeft, MessageSquare, Send } from 'lucide-react';
import { BlockchainBalanceNode, BlockchainTransferNode } from './nodes/BlockchainNodes';

interface NodeData {
  label: string;
  nodeType: string;
  [key: string]: any;
}

const nodeTypes = {
  telegramTrigger: Bot,
  telegramWebhook: Webhook,
  telegramSendMessage: Send,
  openaiChat: MessageSquare,
  blockchainBalance: BlockchainBalanceNode,
  blockchainTransfer: BlockchainTransferNode,
};

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeData: NodeData) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeData', JSON.stringify({
      ...nodeData,
      nodeType,
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="h-full bg-white border-r border-gray-200 w-64 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">Nodes</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Telegram Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Telegram</h4>
            <div className="space-y-2">
              <div
                className="border border-gray-200 rounded p-2 bg-white cursor-move hover:bg-gray-50 transition-colors"
                onDragStart={(event) => onDragStart(event, 'telegramTrigger', {
                  label: 'Telegram Trigger',
                  nodeType: 'telegramTrigger',
                })}
                draggable
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span>Telegram Trigger</span>
                </div>
              </div>
              <div
                className="border border-gray-200 rounded p-2 bg-white cursor-move hover:bg-gray-50 transition-colors"
                onDragStart={(event) => onDragStart(event, 'telegramSendMessage', {
                  label: 'Send Message',
                  nodeType: 'telegramSendMessage',
                })}
                draggable
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </div>
              </div>
            </div>
          </div>

          {/* OpenAI Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">OpenAI</h4>
            <div className="space-y-2">
              <div
                className="border border-gray-200 rounded p-2 bg-white cursor-move hover:bg-gray-50 transition-colors"
                onDragStart={(event) => onDragStart(event, 'openaiChat', {
                  label: 'Chat',
                  nodeType: 'openaiChat',
                })}
                draggable
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Blockchain</h4>
            <div className="space-y-2">
              <div
                className="border border-gray-200 rounded p-2 bg-white cursor-move hover:bg-gray-50 transition-colors"
                onDragStart={(event) => onDragStart(event, 'blockchainBalance', {
                  label: 'Check Balance',
                  nodeType: 'blockchainBalance',
                })}
                draggable
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Check Balance</span>
                </div>
              </div>
              <div
                className="border border-gray-200 rounded p-2 bg-white cursor-move hover:bg-gray-50 transition-colors"
                onDragStart={(event) => onDragStart(event, 'blockchainTransfer', {
                  label: 'Transfer Tokens',
                  nodeType: 'blockchainTransfer',
                })}
                draggable
              >
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transfer Tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 
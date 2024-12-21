import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Webhook, Clock, Database, ArrowRightLeft } from 'lucide-react';

const iconMap = {
  openaiNode: Bot,
  webhookTrigger: Webhook,
  timerTrigger: Clock,
  blockchainTrigger: Database,
  transformNode: ArrowRightLeft,
};

const CustomNode = ({ data }: NodeProps) => {
  const Icon = iconMap[data.nodeType as keyof typeof iconMap] || Database;

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-3 !h-3"
      />
      
      <div className="flex items-center space-x-3">
        <div className="rounded-lg bg-indigo-50 p-2">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{data.label}</h3>
          <p className="text-xs text-gray-500">Click to configure</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
};

export default memo(CustomNode); 
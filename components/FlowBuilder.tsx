'use client';

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import { TelegramTriggerNode, TelegramSendNode } from './nodes/TelegramNodes';
import { OpenAIChatNode } from './nodes/OpenAINodes';
import Header from './Header';
import Sidebar from './Sidebar';
import { BlockchainBalanceNode, BlockchainTransferNode } from './nodes/BlockchainNodes';

interface NodeData {
  label: string;
  nodeType: string;
  selectedBot?: string;
  messagePattern?: string;
  message?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  onUpdate?: (data: Partial<NodeData>) => void;
}

const nodeTypes = {
  custom: CustomNode,
  telegramTrigger: TelegramTriggerNode,
  telegramSendMessage: TelegramSendNode,
  openaiChat: OpenAIChatNode,
  blockchainBalance: BlockchainBalanceNode,
  blockchainTransfer: BlockchainTransferNode,
};

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}

function FlowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeType = event.dataTransfer.getData('nodeType');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - 200,
        y: event.clientY - 100,
      };

      const newNode: Node<NodeData> = {
        id: `${type}_${nodes.length + 1}`,
        type,
        position,
        data: {
          label: `${nodeType} node`,
          nodeType,
          onUpdate: (data: Partial<NodeData>) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, ...data } }
                  : node
              )
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Map nodes to include onUpdate callback for existing nodes
  const nodesWithCallbacks = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onUpdate: (data: Partial<NodeData>) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, ...data } }
              : n
          )
        );
      },
    },
  }));

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodesWithCallbacks}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
} 
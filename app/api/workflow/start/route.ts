import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isPaused } from '../pause/route';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { Web3 } from 'web3';

// Store active bots and their listeners
const activeBots = new Map<string, TelegramBot>();

interface WorkflowMessage {
  originalText: string;
  pattern?: string;
  chatId: string;
  botInfo?: {
    id: string;
    name: string;
    token: string;
  };
  response?: string;
  context: Record<string, any>;
  nodeOutputs: Map<string, any>;
  currentInput?: any;
}

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: string;
    selectedBot?: string;
    message?: string;
    messagePattern?: string;
    model?: string;
    systemPrompt?: string;
    selectedConfig?: string;
    address?: string;
    toAddress?: string;
    amount?: string;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface NodeContext {
  message?: WorkflowMessage;
}

// Store active workflows
const activeWorkflows = new Map<string, { 
  nodes: Node[]; 
  edges: Edge[]; 
  context: NodeContext;
  messageHandlers: Map<string, (msg: TelegramBot.Message) => void>;
}>();

async function executeNode(
  node: Node, 
  context: NodeContext = {}, 
  isInitial = false,
  messageHandlers?: Map<string, (msg: TelegramBot.Message) => void>
) {
  console.log(`Executing node ${node.id} of type ${node.type}`, { context, isInitial, nodeData: node.data });

  if (context.message && !context.message.nodeOutputs) {
    context.message.nodeOutputs = new Map();
  }

  switch (node.type) {
    case 'telegramTrigger':
      if (!node.data.selectedBot) {
        throw new Error('No bot selected for Telegram trigger');
      }
      if (!node.data.messagePattern) {
        throw new Error('No message pattern specified for Telegram trigger');
      }

      const triggerBot = await prisma.telegramBot.findUnique({
        where: { id: node.data.selectedBot },
      });

      if (!triggerBot) {
        throw new Error('Selected bot not found');
      }

      console.log('Found trigger bot:', triggerBot.name);

      // If this is the initial execution, set up the bot and message handler
      if (isInitial && messageHandlers) {
        // Get or create bot instance
        let bot = activeBots.get(triggerBot.id);
        if (!bot) {
          bot = new TelegramBot(triggerBot.token, { polling: true });
          activeBots.set(triggerBot.id, bot);
        }

        // Create message handler for this trigger
        const messageHandler = async (msg: TelegramBot.Message) => {
          if (!msg.text) return;
          
          const pattern = node.data.messagePattern?.toLowerCase() || '';
          let matches = false;
          let extractedContent = msg.text;

          // Enhanced pattern matching
          if (pattern.includes('*')) {
            // Handle command with wildcard (e.g., "/ai *")
            const [command, ...rest] = pattern.split('*');
            if (msg.text.toLowerCase().startsWith(command.trim())) {
              matches = true;
              // Extract content after command
              extractedContent = msg.text.slice(command.trim().length).trim();
            }
          } else if (pattern.startsWith('/')) {
            // Exact command matching
            matches = msg.text.toLowerCase() === pattern.toLowerCase();
          } else if (pattern.includes('|')) {
            // Multiple patterns matching
            matches = pattern.split('|').some(p => 
              msg.text.toLowerCase().includes(p.trim().toLowerCase())
            );
          } else {
            // Default substring matching
            matches = msg.text.toLowerCase().includes(pattern.toLowerCase());
          }

          if (matches) {
            console.log('Message matches pattern:', pattern);
            console.log('Extracted content:', extractedContent);
            
            // Create workflow message with context
            const workflowMessage: WorkflowMessage = {
              originalText: extractedContent, // Use extracted content instead of full message
              pattern: pattern,
              chatId: msg.chat.id.toString(),
              botInfo: {
                id: triggerBot.id,
                name: triggerBot.name,
                token: triggerBot.token,
              },
              context: {
                from: msg.from,
                chat: msg.chat,
                date: msg.date,
                messageId: msg.message_id,
                fullMessage: msg.text, // Store full message in context
                command: pattern.split('*')[0].trim() // Store the command part
              },
              nodeOutputs: new Map(),
              currentInput: extractedContent // Use extracted content as input
            };

            // Store trigger output
            workflowMessage.nodeOutputs.set(node.id, {
              text: extractedContent,
              fullMessage: msg.text,
              pattern: pattern,
              matches: true,
              command: pattern.split('*')[0].trim()
            });

            // Find and execute connected nodes
            const workflow = Array.from(activeWorkflows.values()).find(w => 
              w.nodes.some(n => n.id === node.id)
            );

            if (workflow) {
              const nextNodes = workflow.edges
                .filter(edge => edge.source === node.id)
                .map(edge => workflow.nodes.find(n => n.id === edge.target))
                .filter((n): n is Node => n !== undefined);

              console.log('Found connected nodes:', nextNodes.length);

              for (const nextNode of nextNodes) {
                try {
                  await executeNode(nextNode, { message: workflowMessage });
                } catch (error) {
                  console.error('Error executing connected node:', error);
                }
              }
            }
          }
        };

        // Store the message handler
        messageHandlers.set(node.id, messageHandler);
        bot.on('message', messageHandler);

        return `Started listening for messages with pattern: ${node.data.messagePattern}`;
      }

      return null;

    case 'openaiChat':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      if (!context.message) {
        throw new Error('No message available for OpenAI chat');
      }

      // Get input from previous node or use original text
      const userMessage = context.message.currentInput?.text || context.message.originalText;

      // Ensure model is set
      const model = node.data.model || 'gpt-3.5-turbo';
      console.log('Using OpenAI model:', model);

      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        
        // Add system prompt with enhanced context
        const enhancedSystemPrompt = [
          node.data.systemPrompt || 'You are a helpful assistant.',
          'Format your responses appropriately for a chat context.',
          `User's message matched pattern: ${context.message.pattern}`,
          'Keep responses concise and relevant.',
        ].join('\n');

        messages.push({
          role: 'system' as const,
          content: enhancedSystemPrompt,
        });

        // Add context message if available
        if (Object.keys(context.message.context).length > 0) {
          messages.push({
            role: 'system' as const,
            content: `Context: ${JSON.stringify(context.message.context, null, 2)}`,
          });
        }

        // Add user message
        messages.push({
          role: 'user' as const,
          content: userMessage,
        });

        console.log('Sending chat completion request to OpenAI with messages:', messages);
        const completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response received from OpenAI');
        }

        console.log('Received response from OpenAI:', response);

        // Store node output
        context.message.nodeOutputs.set(node.id, {
          prompt: userMessage,
          response: response,
          model: model
        });

        // Update workflow message
        context.message.response = response;
        context.message.currentInput = response;

        // Find and execute connected nodes
        const workflow = Array.from(activeWorkflows.values()).find(w => 
          w.nodes.some(n => n.id === node.id)
        );

        if (workflow) {
          const nextNodes = workflow.edges
            .filter(edge => edge.source === node.id)
            .map(edge => workflow.nodes.find(n => n.id === edge.target))
            .filter((n): n is Node => n !== undefined);

          console.log('Found connected nodes for OpenAI:', nextNodes.length);

          for (const nextNode of nextNodes) {
            try {
              console.log('Executing next node after OpenAI:', nextNode.type);
              await executeNode(nextNode, context);
            } catch (error) {
              console.error('Error executing connected node:', error);
            }
          }
        }

        return `OpenAI response generated successfully`;
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error(`Failed to generate OpenAI response: ${(error as Error).message}`);
      }

    case 'telegramSendMessage':
      if (!node.data.selectedBot) {
        throw new Error('No bot selected for Telegram message');
      }
      if (!context.message?.chatId) {
        throw new Error('No chat ID available. Make sure this node is connected to a Telegram trigger');
      }

      const sendBot = await prisma.telegramBot.findUnique({
        where: { id: node.data.selectedBot },
      });

      if (!sendBot) {
        throw new Error('Selected bot not found');
      }

      try {
        // Get or create bot instance
        let bot = activeBots.get(sendBot.id);
        if (!bot) {
          bot = new TelegramBot(sendBot.token, { polling: true });
          activeBots.set(sendBot.id, bot);
        }

        // Prioritize message sources
        let messageToSend: string;
        
        console.log('Available message sources:', {
          customMessage: node.data.message,
          currentInput: context.message.currentInput,
          response: context.message.response
        });

        if (node.data.message) {
          // 1. Use custom message if set
          messageToSend = node.data.message;
        } else if (typeof context.message.currentInput === 'string') {
          // 2. Use direct string input (from OpenAI)
          messageToSend = context.message.currentInput;
        } else if (context.message.currentInput?.text) {
          // 3. Use text from input object
          messageToSend = context.message.currentInput.text;
        } else if (context.message.response) {
          // 4. Fallback to response field
          messageToSend = context.message.response;
        } else {
          throw new Error('No message to send. Either set a custom message or connect to a node that generates responses.');
        }

        console.log(`Sending message via bot ${sendBot.name} to chat ${context.message.chatId}:`, messageToSend);
        const result = await bot.sendMessage(context.message.chatId, messageToSend);
        console.log('Message sent:', result);

        // Store node output
        context.message.nodeOutputs.set(node.id, {
          message: messageToSend,
          botId: sendBot.id,
          messageId: result.message_id,
          timestamp: result.date
        });

        return `Message sent successfully via bot ${sendBot.name}`;
      } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw new Error(`Failed to send Telegram message: ${(error as Error).message}`);
      }

    case 'blockchainBalance': {
      if (!node.data.selectedConfig) {
        throw new Error('No blockchain configuration selected');
      }
      if (!node.data.address) {
        throw new Error('No address specified for balance check');
      }

      try {
        const response = await fetch('/api/blockchain/operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'checkBalance',
            configId: node.data.selectedConfig,
            address: node.data.address,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check balance');
        }

        const data = await response.json();
        
        // Store node output
        if (context.message) {
          context.message.nodeOutputs.set(node.id, {
            address: data.address,
            balance: data.balance,
            unit: data.unit
          });

          // Update current input for next node
          context.message.currentInput = `Balance of ${data.address}: ${data.balance} ${data.unit}`;
        }

        // Find and execute connected nodes
        const workflow = Array.from(activeWorkflows.values()).find(w => 
          w.nodes.some(n => n.id === node.id)
        );

        if (workflow) {
          const nextNodes = workflow.edges
            .filter(edge => edge.source === node.id)
            .map(edge => workflow.nodes.find(n => n.id === edge.target))
            .filter((n): n is Node => n !== undefined);

          for (const nextNode of nextNodes) {
            try {
              await executeNode(nextNode, context);
            } catch (error) {
              console.error('Error executing connected node:', error);
            }
          }
        }

        return `Checked balance successfully`;
      } catch (error) {
        console.error('Error checking balance:', error);
        throw new Error(`Failed to check balance: ${(error as Error).message}`);
      }
    }

    case 'blockchainTransfer': {
      if (!node.data.selectedConfig) {
        throw new Error('No blockchain configuration selected');
      }
      if (!node.data.toAddress) {
        throw new Error('No recipient address specified');
      }
      if (!node.data.amount) {
        throw new Error('No amount specified for transfer');
      }

      try {
        const response = await fetch('/api/blockchain/operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'transfer',
            configId: node.data.selectedConfig,
            toAddress: node.data.toAddress,
            amount: node.data.amount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to transfer tokens');
        }

        const data = await response.json();
        
        // Store node output
        if (context.message) {
          context.message.nodeOutputs.set(node.id, {
            transactionHash: data.transactionHash,
            from: data.from,
            to: data.to,
            amount: data.amount,
            unit: data.unit
          });

          // Update current input for next node
          context.message.currentInput = `Transferred ${data.amount} ${data.unit} from ${data.from} to ${data.to}. Transaction hash: ${data.transactionHash}`;
        }

        // Find and execute connected nodes
        const workflow = Array.from(activeWorkflows.values()).find(w => 
          w.nodes.some(n => n.id === node.id)
        );

        if (workflow) {
          const nextNodes = workflow.edges
            .filter(edge => edge.source === node.id)
            .map(edge => workflow.nodes.find(n => n.id === edge.target))
            .filter((n): n is Node => n !== undefined);

          for (const nextNode of nextNodes) {
            try {
              await executeNode(nextNode, context);
            } catch (error) {
              console.error('Error executing connected node:', error);
            }
          }
        }

        return `Transfer completed successfully`;
      } catch (error) {
        console.error('Error transferring tokens:', error);
        throw new Error(`Failed to transfer tokens: ${(error as Error).message}`);
      }
    }

    default:
      console.log(`Executing node ${node.id} of type: ${node.type}`);
      return `Executed ${node.type} node`;
  }
}

async function executeWorkflow(workflowId: string) {
  console.log('Executing workflow:', workflowId);
  const workflow = activeWorkflows.get(workflowId);
  if (!workflow) {
    console.log('Workflow not found:', workflowId);
    return;
  }

  // Check if workflow is paused
  if (isPaused(workflowId)) {
    console.log('Workflow is paused:', workflowId);
    // Continue checking pause state
    setTimeout(() => executeWorkflow(workflowId), 1000);
    return;
  }

  // No need to continuously poll - the bot library handles that for us
  // Just keep the workflow active
  setTimeout(() => executeWorkflow(workflowId), 1000);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { nodes, edges } = await request.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: 'Invalid workflow configuration' },
        { status: 400 }
      );
    }

    const workflowId = Math.random().toString(36).substring(7);
    const context: NodeContext = {};
    const messageHandlers = new Map<string, (msg: TelegramBot.Message) => void>();

    // Initialize the workflow
    const results: { nodeId: string; status: string }[] = [];
    const triggerNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );

    // Execute trigger nodes initially to set up the context
    for (const triggerNode of triggerNodes) {
      try {
        const status = await executeNode(triggerNode, context, true, messageHandlers);
        results.push({ nodeId: triggerNode.id, status });
      } catch (error) {
        results.push({
          nodeId: triggerNode.id,
          status: `Error: ${(error as Error).message}`,
        });
      }
    }

    // Store the workflow
    activeWorkflows.set(workflowId, { nodes, edges, context, messageHandlers });

    // Start the continuous execution
    executeWorkflow(workflowId);

    return NextResponse.json({
      status: 'Workflow started successfully',
      workflowId,
      results,
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Clean up message handlers and bot instances
    const workflow = activeWorkflows.get(workflowId);
    if (workflow) {
      for (const [nodeId, handler] of workflow.messageHandlers) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (node?.data.selectedBot) {
          const bot = activeBots.get(node.data.selectedBot);
          if (bot) {
            bot.removeListener('message', handler);
            // If no more handlers for this bot, stop polling and remove it
            if (!Array.from(activeWorkflows.values()).some(w => 
              w.workflowId !== workflowId && 
              w.nodes.some(n => n.data.selectedBot === node.data.selectedBot)
            )) {
              bot.stopPolling();
              activeBots.delete(node.data.selectedBot);
            }
          }
        }
      }
    }

    // Remove the workflow
    activeWorkflows.delete(workflowId);

    return NextResponse.json({
      status: 'Workflow stopped successfully',
    });
  } catch (error) {
    console.error('Error stopping workflow:', error);
    return NextResponse.json(
      { error: 'Failed to stop workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
} 
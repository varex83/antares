import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Web3 } from 'web3';
import { useSession } from 'next-auth/react';

interface BlockchainConfig {
  id: string;
  name: string;
  network: string;
  infuraApiKey: string;
  walletAddress?: string;
}

// Custom hook to fetch blockchain configurations
const useBlockchainConfigs = () => {
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<BlockchainConfig[]>([]);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/blockchain/configs');
        const data = await response.json();
        if (data.configs) {
          setConfigs(data.configs);
        }
      } catch (error) {
        console.error('Error fetching blockchain configs:', error);
      }
    };

    if (session?.user) {
      fetchConfigs();
    }
  }, [session]);

  return configs;
};

// Node for checking account balance
export function BlockchainBalanceNode({ data, id }: { data: any; id: string }) {
  const configs = useBlockchainConfigs();
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (data.selectedConfig) {
      setSelectedConfig(data.selectedConfig);
    }
    if (data.address) {
      setAddress(data.address);
    }
  }, [data]);

  const handleConfigChange = (configId: string) => {
    setSelectedConfig(configId);
    if (data.onUpdate) {
      data.onUpdate({ ...data, selectedConfig: configId });
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (data.onUpdate) {
      data.onUpdate({ ...data, address: newAddress });
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex flex-col">
        <div className="text-xs font-bold text-stone-700 mb-2">Check Balance</div>
        
        <select
          className="w-full p-2 border rounded mb-2"
          value={selectedConfig}
          onChange={(e) => handleConfigChange(e.target.value)}
        >
          <option value="">Select Network</option>
          {configs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name} ({config.network})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Enter wallet address"
          className="w-full p-2 border rounded"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
        />
      </div>

      <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />
    </div>
  );
}

// Node for transferring tokens
export function BlockchainTransferNode({ data, id }: { data: any; id: string }) {
  const configs = useBlockchainConfigs();
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    if (data.selectedConfig) {
      setSelectedConfig(data.selectedConfig);
    }
    if (data.toAddress) {
      setToAddress(data.toAddress);
    }
    if (data.amount) {
      setAmount(data.amount);
    }
  }, [data]);

  const handleConfigChange = (configId: string) => {
    setSelectedConfig(configId);
    if (data.onUpdate) {
      data.onUpdate({ ...data, selectedConfig: configId });
    }
  };

  const handleToAddressChange = (address: string) => {
    setToAddress(address);
    if (data.onUpdate) {
      data.onUpdate({ ...data, toAddress: address });
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (data.onUpdate) {
      data.onUpdate({ ...data, amount: value });
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex flex-col">
        <div className="text-xs font-bold text-stone-700 mb-2">Transfer Tokens</div>
        
        <select
          className="w-full p-2 border rounded mb-2"
          value={selectedConfig}
          onChange={(e) => handleConfigChange(e.target.value)}
        >
          <option value="">Select Network</option>
          {configs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name} ({config.network})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="To Address"
          className="w-full p-2 border rounded mb-2"
          value={toAddress}
          onChange={(e) => handleToAddressChange(e.target.value)}
        />

        <input
          type="text"
          placeholder="Amount (ETH)"
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
        />
      </div>

      <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />
    </div>
  );
} 
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash } from 'lucide-react';

interface BlockchainConfig {
  id: string;
  name: string;
  network: string;
  infuraApiKey: string;
  walletAddress?: string;
  isActive: boolean;
}

export default function BlockchainSettings() {
  const router = useRouter();
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<BlockchainConfig[]>([]);
  const [newConfig, setNewConfig] = useState({
    name: '',
    network: 'goerli',
    infuraApiKey: '',
    walletAddress: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, [session]);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/blockchain/configs');
      const data = await response.json();
      if (data.configs) {
        setConfigs(data.configs);
      }
    } catch (error) {
      setError('Failed to fetch blockchain configurations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/blockchain/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create configuration');
      }

      setSuccess('Configuration created successfully');
      setNewConfig({
        name: '',
        network: 'goerli',
        infuraApiKey: '',
        walletAddress: '',
      });
      fetchConfigs();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleDelete = async (configId: string) => {
    try {
      const response = await fetch('/api/blockchain/configs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete configuration');
      }

      setSuccess('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Blockchain Settings</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">
              {success}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Configuration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="network" className="block text-sm font-medium text-gray-700">
                  Network
                </label>
                <select
                  id="network"
                  value={newConfig.network}
                  onChange={(e) => setNewConfig({ ...newConfig, network: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="mainnet">Mainnet</option>
                  <option value="goerli">Goerli</option>
                  <option value="sepolia">Sepolia</option>
                </select>
              </div>

              <div>
                <label htmlFor="infuraApiKey" className="block text-sm font-medium text-gray-700">
                  Infura API Key
                </label>
                <input
                  type="text"
                  id="infuraApiKey"
                  value={newConfig.infuraApiKey}
                  onChange={(e) => setNewConfig({ ...newConfig, infuraApiKey: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                  Wallet Address (Optional)
                </label>
                <input
                  type="text"
                  id="walletAddress"
                  value={newConfig.walletAddress}
                  onChange={(e) => setNewConfig({ ...newConfig, walletAddress: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Configuration
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Configurations</h2>
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">Network: {config.network}</p>
                    {config.walletAddress && (
                      <p className="text-sm text-gray-500">
                        Wallet: {config.walletAddress.slice(0, 6)}...{config.walletAddress.slice(-4)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {configs.length === 0 && (
                <p className="text-sm text-gray-500">No configurations found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
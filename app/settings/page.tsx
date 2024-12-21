'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Database } from 'lucide-react';

export default function Settings() {
  const router = useRouter();

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
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Telegram Settings Card */}
            <div
              onClick={() => router.push('/settings/telegram')}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Bot className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Telegram Bots</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your Telegram bot configurations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Settings Card */}
            <div
              onClick={() => router.push('/settings/blockchain')}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Blockchain</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure blockchain networks and wallets
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
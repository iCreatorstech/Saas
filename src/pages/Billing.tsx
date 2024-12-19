import React from 'react';
import { CreditCard, Clock, Download } from 'lucide-react';

const Billing = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Billing</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Current Plan</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Professional</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">$49/month</p>
            </div>
            <button className="bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
              Upgrade Plan
            </button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Next billing date: January 1, 2024</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Payment Method</h2>
          <div className="flex items-center gap-4 mb-4">
            <CreditCard className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/24</p>
            </div>
          </div>
          <button className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
            Update payment method
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Billing History</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">December 2023</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Professional Plan</p>
              </div>
              <button className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Usage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Storage</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">75% used</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
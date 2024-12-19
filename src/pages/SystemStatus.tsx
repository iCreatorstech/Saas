import React from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const SystemStatus = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">System Status</h1>
      
      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Status</h2>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-500 font-medium">All Systems Operational</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">API</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">100% uptime</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">23ms latency</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Dashboard</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">100% uptime</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">45ms latency</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Database</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">99.9% uptime</p>
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">89ms latency</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Scheduled Maintenance</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Database Optimization</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled for December 31, 2023 at 02:00 UTC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
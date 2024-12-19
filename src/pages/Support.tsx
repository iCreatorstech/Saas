import React from 'react';
import { MessageSquare, Mail, Phone } from 'lucide-react';

const Support = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Support</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-6 w-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Chat</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get instant help from our support team through live chat.</p>
          <button className="w-full bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
            Start Chat
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-6 w-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Email Support</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Send us an email and we'll get back to you within 24 hours.</p>
          <button className="w-full bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
            Send Email
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-6 w-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Phone Support</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Call us directly for immediate assistance with urgent issues.</p>
          <button className="w-full bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
            Call Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;
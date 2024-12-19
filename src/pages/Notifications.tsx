import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Bell, Settings, Clock, Globe, X, Server, Smartphone, AlertTriangle } from 'lucide-react';

type ExpiringItem = {
  id: string;
  type: 'site' | 'hosting' | 'app';
  name: string;
  expiryDate: string;
}

type NotificationSetting = {
  id: string;
  enableEmailNotifications: boolean;
  notifyOneMonth: boolean;
  notifyTwoWeeks: boolean;
  notifyThreeDays: boolean;
  notifyOnExpiryDay: boolean;
}

const Notifications: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterDays, setFilterDays] = useState('30');
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [settings, setSettings] = useState<NotificationSetting | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchExpiringItems();
      fetchSettings();
    }
  }, [currentUser]);

  const filterItems = (items: ExpiringItem[]) => {
    return items.filter(item => {
      // Filter by type
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      // Filter by days
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return daysUntilExpiry <= parseInt(filterDays);
    }).sort((a, b) => {
      // Sort by expiration date (closest first)
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  };

  const fetchExpiringItems = async () => {
    if (!currentUser) return;
    setError(null);
    try {
      const now = new Date();
      const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

      const items: ExpiringItem[] = [];

      // Fetch expiring sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', threeMonthsFromNow.toISOString())
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      sitesSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'site', name: doc.data().name, expiryDate: doc.data().expirationDate });
      });

      // Fetch expiring hosting accounts
      const hostingQuery = query(
        collection(db, 'hostingAccounts'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', threeMonthsFromNow.toISOString())
      );
      const hostingSnapshot = await getDocs(hostingQuery);
      hostingSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'hosting', name: doc.data().provider, expiryDate: doc.data().expirationDate });
      });

      // Fetch expiring mobile apps
      const appsQuery = query(
        collection(db, 'mobileApps'),
        where('userId', '==', currentUser.uid),
        where('renewalDate', '<=', threeMonthsFromNow.toISOString())
      );
      const appsSnapshot = await getDocs(appsQuery);
      appsSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'app', name: doc.data().appName, expiryDate: doc.data().renewalDate });
      });

      setExpiringItems(items);
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      setError('Failed to fetch expiring items. Please try again later.');
    }
  };

  const fetchSettings = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'notificationSettings'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const settingsData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as NotificationSetting;
        setSettings(settingsData);
      } else {
        const defaultSettings: Omit<NotificationSetting, 'id'> = {
          enableEmailNotifications: true,
          notifyOneMonth: true,
          notifyTwoWeeks: true,
          notifyThreeDays: true,
          notifyOnExpiryDay: true,
        };
        const docRef = await addDoc(collection(db, 'notificationSettings'), { ...defaultSettings, userId: currentUser.uid });
        setSettings({ id: docRef.id, ...defaultSettings });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      setError('Failed to fetch notification settings. Please try again later.');
    }
  };

  const updateSettings = async () => {
    if (!currentUser || !settings) return;
    try {
      const settingsRef = doc(db, 'notificationSettings', settings.id);
      await updateDoc(settingsRef, settings);
      setIsSettingsModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification settings. Please try again later.');
    }
  };

  const handleSettingChange = (setting: keyof NotificationSetting) => {
    if (settings) {
      setSettings({ ...settings, [setting]: !settings[setting] });
    }
  };

  const getExpirationStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry <= 0) return 'Expired';
    if (daysUntilExpiry <= 3) return '3 days or less';
    if (daysUntilExpiry <= 14) return '2 weeks or less';
    return '1 month or less';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <Button onClick={() => setIsSettingsModalOpen(true)}>
          <Settings className="w-4 h-4 mr-2" /> 
          <span>Settings</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4" role="alert">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upcoming Expirations</h2>
          <div className="flex items-center gap-2">
            <select 
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="site">Sites</option>
              <option value="hosting">Hosting</option>
              <option value="app">Mobile Apps</option>
            </select>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
            >
              <option value="7">Next 7 Days</option>
              <option value="14">Next 14 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="90">Next 90 Days</option>
            </select>
          </div>
        </div>

        {filterItems(expiringItems).length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Expirations</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No upcoming expirations found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(expiringItems).map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${
                    item.type === 'site' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    item.type === 'hosting' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {item.type === 'site' && <Globe className="h-5 w-5" />}
                    {item.type === 'hosting' && <Server className="h-5 w-5" />}
                    {item.type === 'app' && <Smartphone className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        getExpirationStatus(item.expiryDate).includes('Expired')
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : getExpirationStatus(item.expiryDate).includes('3 days')
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {getExpirationStatus(item.expiryDate)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <time dateTime={item.expiryDate}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSettingsModalOpen && settings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full m-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notification Settings</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={() => handleSettingChange('enableEmailNotifications')}
                  className="mr-2"
                />
                Enable Email Notifications
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyOneMonth}
                  onChange={() => handleSettingChange('notifyOneMonth')}
                  className="mr-2"
                />
                Notify One Month Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyTwoWeeks}
                  onChange={() => handleSettingChange('notifyTwoWeeks')}
                  className="mr-2"
                />
                Notify Two Weeks Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyThreeDays}
                  onChange={() => handleSettingChange('notifyThreeDays')}
                  className="mr-2"
                />
                Notify Three Days Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyOnExpiryDay}
                  onChange={() => handleSettingChange('notifyOnExpiryDay')}
                  className="mr-2"
                />
                Notify on Expiry Day
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setIsSettingsModalOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={updateSettings}>Save Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
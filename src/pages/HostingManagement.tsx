import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Edit, Trash2, Loader, Server, Bell, ExternalLink } from 'lucide-react';

interface HostingAccount {
  id: string;
  provider: string;
  serverLoginUrl: string;
  hostType: 'shared' | 'reseller' | 'vps' | 'dedicated';
  username: string;
  email: string;
  passwordHint: string;
  expirationDate: string;
  status: 'suspended' | 'active' | 'reported' | 'expired' | 'other' | 'needs renewal';
}

interface HostingManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const HostingManagement: React.FC<HostingManagementProps> = ({ showAlert }) => {
  const [hostingAccounts, setHostingAccounts] = useState<HostingAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHostingAccount, setNewHostingAccount] = useState<HostingAccount>({
    id: '',
    provider: '',
    serverLoginUrl: '',
    hostType: 'shared',
    username: '',
    email: '',
    passwordHint: '',
    expirationDate: '',
    status: 'active'
  });
  const [editingHostingAccount, setEditingHostingAccount] = useState<HostingAccount | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const { currentUser } = useAuth();

  const getStatusBadgeClasses = (status: string) => {
    const baseClasses = "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'reported':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`;
      case 'expired':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
      case 'needs renewal':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchHostingAccounts();
    }
  }, [currentUser]);

  const fetchHostingAccounts = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'hostingAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const accountsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostingAccount));
      setHostingAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching hosting accounts:', error);
      showAlert('Failed to fetch hosting accounts. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleAddHostingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a hosting account.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const accountData = {
        ...newHostingAccount,
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'hostingAccounts'), accountData);
      showAlert('Hosting account added successfully', 'success');
      setIsModalOpen(false);
      setNewHostingAccount({
        id: '',
        provider: '',
        serverLoginUrl: '',
        hostType: 'shared',
        username: '',
        email: '',
        passwordHint: '',
        expirationDate: '',
        status: 'active'
      });
      fetchHostingAccounts();
    } catch (error) {
      console.error('Error adding hosting account:', error);
      showAlert('Failed to add hosting account. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditHostingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHostingAccount) return;
    setIsEditLoading(true);
    try {
      const accountRef = doc(db, 'hostingAccounts', editingHostingAccount.id);
      await updateDoc(accountRef, editingHostingAccount);
      showAlert('Hosting account updated successfully', 'success');
      setEditingHostingAccount(null);
      fetchHostingAccounts();
    } catch (error) {
      console.error('Error updating hosting account:', error);
      showAlert('Failed to update hosting account. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteHostingAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hosting account?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'hostingAccounts', id));
        showAlert('Hosting account deleted successfully', 'success');
        fetchHostingAccounts();
      } catch (error) {
        console.error('Error deleting hosting account:', error);
        showAlert('Failed to delete hosting account. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  const isExpiringSoon = (expirationDate: string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const differenceInDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return differenceInDays <= 30;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hosting Management</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Server className="w-4 h-4" />
          <span>Add New Hosting Account</span>
        </Button>
      </div>

      {/* Hosting Accounts List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
{isTableLoading ? (
  <tr>
    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
      <div className="flex justify-center items-center">
        <Loader className="animate-spin mr-2" />
        
      </div>
    </td>
  </tr>
) : hostingAccounts.length === 0 ? (
  <tr>
    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
      No hosting accounts found.
    </td>
  </tr>
) : (
              hostingAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Server className="w-4 h-4 mr-2 text-gray-400" />
                      {account.provider}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {account.hostType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className={isExpiringSoon(account.expirationDate) ? 'text-red-500 font-bold' : ''}>
                      {account.expirationDate}
                    </span>
                    {isExpiringSoon(account.expirationDate) && (
                      <Bell className="inline-block ml-2 text-red-500 animate-pulse" size={16} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={getStatusBadgeClasses(account.status)}>{account.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center space-x-2">
                      <a
                        href={account.serverLoginUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        onClick={() => setEditingHostingAccount(account)}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteHostingAccount(account.id)} 
                        variant="outline"
                        size="sm"
                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        isLoading={isDeleteLoading === account.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add/Edit Hosting Account Modal */}
      {(isModalOpen || editingHostingAccount) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full m-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingHostingAccount ? 'Edit Hosting Account' : 'Add New Hosting Account'}
            </h2>
            <form onSubmit={editingHostingAccount ? handleEditHostingAccount : handleAddHostingAccount}>
              <Input
                type="text"
                placeholder="Provider"
                value={editingHostingAccount ? editingHostingAccount.provider : newHostingAccount.provider}
                onChange={(e) => editingHostingAccount 
                  ? setEditingHostingAccount({ ...editingHostingAccount, provider: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, provider: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="url"
                placeholder="Server Login URL"
                value={editingHostingAccount ? editingHostingAccount.serverLoginUrl : newHostingAccount.serverLoginUrl}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, serverLoginUrl: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, serverLoginUrl: e.target.value })
                }
                className="mb-2"
                required
              />
              <select
                value={editingHostingAccount ? editingHostingAccount.hostType : newHostingAccount.hostType}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, hostType: e.target.value as any })
                  : setNewHostingAccount({ ...newHostingAccount, hostType: e.target.value as any })
                }
                className="mb-2 w-full p-2 border rounded bg-transparent text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-400"
                required
              >
                <option value="shared">Shared</option>
                <option value="reseller">Reseller</option>
                <option value="vps">VPS</option>
                <option value="dedicated">Dedicated</option>
              </select>
              <Input
                type="text"
                placeholder="Username"
                value={editingHostingAccount ? editingHostingAccount.username : newHostingAccount.username}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, username: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, username: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={editingHostingAccount ? editingHostingAccount.email : newHostingAccount.email}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, email: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, email: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="text"
                placeholder="Password Hint"
                value={editingHostingAccount ? editingHostingAccount.passwordHint : newHostingAccount.passwordHint}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, passwordHint: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, passwordHint: e.target.value })
                }
                className="mb-2"
              />
              <Input
                type="date"
                placeholder="Expiration Date"
                value={editingHostingAccount ? editingHostingAccount.expirationDate : newHostingAccount.expirationDate}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, expirationDate: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, expirationDate: e.target.value })
                }
                className="mb-2"
                required
              />
              <select
                value={editingHostingAccount ? editingHostingAccount.status : newHostingAccount.status}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, status: e.target.value as any })
                  : setNewHostingAccount({ ...newHostingAccount, status: e.target.value as any })
                }
                className="mb-2 w-full p-2 border rounded bg-transparent text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-400"
                required
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="reported">Reported for Abuse</option>
                <option value="expired">Expired</option>
                <option value="needs renewal">Needs Renewal</option>
                <option value="other">Other</option>
              </select>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingHostingAccount(null);
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingHostingAccount ? 'Update' : 'Add'} Hosting Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostingManagement;
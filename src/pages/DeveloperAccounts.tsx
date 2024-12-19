import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Loader, smartphone, 
  //Smartphone 
} from 'lucide-react';

interface DeveloperAccount {
  id: string;
  accountType: 'apple' | 'google';
  email: string;
  mobileNumber: string;
  expiryDate?: string;
  mobileAppsCount: number;
  DUNS?: string;
  companyName: string;
  dateCreated: string;
  status: string;
}

interface DeveloperAccountsProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DeveloperAccounts: React.FC<DeveloperAccountsProps> = ({ showAlert }) => {
  const [accounts, setAccounts] = useState<DeveloperAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Omit<DeveloperAccount, 'id' | 'mobileAppsCount'>>({
    accountType: 'apple',
    email: '',
    mobileNumber: '',
    expiryDate: '',
    DUNS: '',
    companyName: '',
    dateCreated: '',
    status: 'pending approval',
  });
  const [editingAccount, setEditingAccount] = useState<DeveloperAccount | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchDeveloperAccounts();
    }
  }, [currentUser]);

  const fetchDeveloperAccounts = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'developerAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const accountsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeveloperAccount));

      // Fetch mobile apps to count for each developer account
      const mobileAppsQuery = query(collection(db, 'mobileApps'), where('userId', '==', currentUser.uid));
      const mobileAppsSnapshot = await getDocs(mobileAppsQuery);
      const mobileApps = mobileAppsSnapshot.docs.map(doc => doc.data());

      // Update the mobileAppsCount for each developer account
      const updatedAccountsData = accountsData.map(account => {
        const appsCount = mobileApps.filter(app => 
          (account.accountType === 'apple' && app.iosDeveloperAccountId === account.id) ||
          (account.accountType === 'google' && app.googleDeveloperAccountId === account.id)
        ).length;
        return { ...account, mobileAppsCount: appsCount };
      });

      setAccounts(updatedAccountsData);
    } catch (error) {
      console.error('Error fetching developer accounts:', error);
      showAlert('Failed to fetch developer accounts. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a developer account.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const accountData = {
        ...newAccount,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        mobileAppsCount: 0,
      };
      await addDoc(collection(db, 'developerAccounts'), accountData);
      showAlert('Developer account added successfully', 'success');
      setIsModalOpen(false);
      setNewAccount({
        accountType: 'apple',
        email: '',
        mobileNumber: '',
        expiryDate: '',
        DUNS: '',
        companyName: '',
        dateCreated: '',
        status: 'pending approval',
      });
      fetchDeveloperAccounts();
    } catch (error) {
      console.error('Error adding developer account:', error);
      showAlert('Failed to add developer account. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setIsEditLoading(true);
    try {
      const accountRef = doc(db, 'developerAccounts', editingAccount.id);
      await updateDoc(accountRef, {
        ...editingAccount,
        lastModified: new Date().toISOString()
      });
      showAlert('Developer account updated successfully', 'success');
      setEditingAccount(null);
      fetchDeveloperAccounts();
    } catch (error) {
      console.error('Error updating developer account:', error);
      showAlert('Failed to update developer account. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this developer account?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'developerAccounts', id));
        showAlert('Developer account deleted successfully', 'success');
        fetchDeveloperAccounts();
      } catch (error) {
        console.error('Error deleting developer account:', error);
        showAlert('Failed to delete developer account. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Developer Accounts</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Developer Account</span>
        </Button>
      </div>

      {/* Developer Accounts List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mobile Apps</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isTableLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex justify-center items-center">
                    <Loader className="animate-spin mr-2" />
                    Loading developer accounts...
                  </div>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No developer accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      {account.accountType === 'apple'}
                      <span className="capitalize">{account.accountType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {account.mobileAppsCount} apps
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setEditingAccount(account)}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteAccount(account.id)} 
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

      {/* Add/Edit Developer Account Modal */}
      {(isModalOpen || editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-4 rounded-lg max-w-md w-full m-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingAccount ? 'Edit Developer Account' : 'Add New Developer Account'}
            </h2>
            <form onSubmit={editingAccount ? handleEditAccount : handleAddAccount} className="space-y-4">
              <select
                value={editingAccount ? editingAccount.accountType : newAccount.accountType}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, accountType: e.target.value as 'apple' | 'google' })
                  : setNewAccount({ ...newAccount, accountType: e.target.value as 'apple' | 'google' })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="apple">Apple</option>
                <option value="google">Google</option>
              </select>
              <Input
                type="email"
                placeholder="Email"
                value={editingAccount ? editingAccount.email : newAccount.email}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, email: e.target.value })
                  : setNewAccount({ ...newAccount, email: e.target.value })
                }
                required
              />
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={editingAccount ? editingAccount.mobileNumber : newAccount.mobileNumber}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, mobileNumber: e.target.value })
                  : setNewAccount({ ...newAccount, mobileNumber: e.target.value })
                }
                required
              />
              {(editingAccount?.accountType === 'apple' || newAccount.accountType === 'apple') && (
                <Input
                  type="date"
                  placeholder="Expiry Date"
                  value={editingAccount ? editingAccount.expiryDate : newAccount.expiryDate}
                  onChange={(e) => editingAccount
                    ? setEditingAccount({ ...editingAccount, expiryDate: e.target.value })
                    : setNewAccount({ ...newAccount, expiryDate: e.target.value })
                  }
                />
              )}
              <Input
                type="text"
                placeholder="DUNS"
                value={editingAccount ? editingAccount.DUNS : newAccount.DUNS}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, DUNS: e.target.value })
                  : setNewAccount({ ...newAccount, DUNS: e.target.value })
                }
              />
              <Input
                type="text"
                placeholder="Company Name"
                value={editingAccount ? editingAccount.companyName : newAccount.companyName}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, companyName: e.target.value })
                  : setNewAccount({ ...newAccount, companyName: e.target.value })
                }
                required
              />
              <Input
                type="date"
                placeholder="Date Created"
                value={editingAccount ? editingAccount.dateCreated : newAccount.dateCreated}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, dateCreated: e.target.value })
                  : setNewAccount({ ...newAccount, dateCreated: e.target.value })
                }
                required
              />
              <select
                value={editingAccount ? editingAccount.status : newAccount.status}
                onChange={(e) => editingAccount
                  ? setEditingAccount({ ...editingAccount, status: e.target.value })
                  : setNewAccount({ ...newAccount, status: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="pending approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs verification">Needs Verification</option>
              </select>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAccount(null);
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingAccount ? 'Update' : 'Add'} Developer Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperAccounts;
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Loader, ExternalLink, BarChart } from 'lucide-react';

interface MobileApp {
  id: string;
  appName: string;
  platform: 'iOS' | 'Android' | 'Both';
  clientId: string;
  clientName: string;
  appDomain: string;
  dateCreated: string;
  renewalDate: string;
  iosDeveloperAccountId?: string;
  googleDeveloperAccountId?: string;
  appleLiveUrl?: string;
  googleLiveUrl?: string;
  appCost: number;
  amountSpent: number;
  status: string;
  version: string;
}

interface Client {
  id: string;
  name: string;
}

interface DeveloperAccount {
  id: string;
  name: string;
  type: 'apple' | 'google';
}

interface MobileAppsProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MobileApps: React.FC<MobileAppsProps> = ({ showAlert }) => {
  const [mobileApps, setMobileApps] = useState<MobileApp[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [developerAccounts, setDeveloperAccounts] = useState<DeveloperAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState<Omit<MobileApp, 'id' | 'clientName'>>({
    appName: '',
    platform: 'Both',
    clientId: '',
    appDomain: '',
    dateCreated: '',
    renewalDate: '',
    iosDeveloperAccountId: '',
    googleDeveloperAccountId: '',
    appleLiveUrl: '',
    googleLiveUrl: '',
    appCost: 0,
    amountSpent: 0,
    status: '',
    version: '',
  });
  const [editingApp, setEditingApp] = useState<MobileApp | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [isAddingDeveloperAccount, setIsAddingDeveloperAccount] = useState(false);
  const [newDeveloperAccount, setNewDeveloperAccount] = useState({ name: '', type: 'apple' });
  const [versions, setVersions] = useState<string[]>(['1.0.0', '1.1.0', '2.0.0']);
  const [newVersion, setNewVersion] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchMobileApps();
      fetchClients();
      fetchDeveloperAccounts();
    }
  }, [currentUser]);

  const fetchMobileApps = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'mobileApps'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MobileApp));
      setMobileApps(appsData);
    } catch (error) {
      console.error('Error fetching mobile apps:', error);
      showAlert('Failed to fetch mobile apps. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Client));
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showAlert('Failed to fetch clients. Please try again later.', 'error');
    }
  };

  const fetchDeveloperAccounts = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'developerAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const accountsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().email, 
        type: doc.data().accountType 
      } as DeveloperAccount));
      setDeveloperAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching developer accounts:', error);
      showAlert('Failed to fetch developer accounts. Please try again later.', 'error');
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a mobile app.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const selectedClient = clients.find(client => client.id === newApp.clientId);
      if (!selectedClient) {
        throw new Error('Selected client not found');
      }
      const appData = {
        ...newApp,
        userId: currentUser.uid,
        clientName: selectedClient.name,
      };
      await addDoc(collection(db, 'mobileApps'), appData);

      // Add app domain to sites collection
      await addDoc(collection(db, 'sites'), {
        name: newApp.appName,
        url: newApp.appDomain,
        userId: currentUser.uid,
        type: 'Mobile App',
      });

      showAlert('Mobile app added successfully', 'success');
      setIsModalOpen(false);
      setNewApp({
        appName: '',
        platform: 'Both',
        clientId: '',
        appDomain: '',
        dateCreated: '',
        renewalDate: '',
        iosDeveloperAccountId: '',
        googleDeveloperAccountId: '',
        appleLiveUrl: '',
        googleLiveUrl: '',
        appCost: 0,
        amountSpent: 0,
        status: '',
        version: '',
      });
      fetchMobileApps();
    } catch (error) {
      console.error('Error adding mobile app:', error);
      showAlert('Failed to add mobile app. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setIsEditLoading(true);
    try {
      const selectedClient = clients.find(client => client.id === editingApp.clientId);
      if (!selectedClient) {
        throw new Error('Selected client not found');
      }
      const updatedApp = {
        ...editingApp,
        clientName: selectedClient.name,
      };
      const appRef = doc(db, 'mobileApps', editingApp.id);
      await updateDoc(appRef, updatedApp);
      showAlert('Mobile app updated successfully', 'success');
      setEditingApp(null);
      fetchMobileApps();
    } catch (error) {
      console.error('Error updating mobile app:', error);
      showAlert('Failed to update mobile app. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this mobile app?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'mobileApps', id));
        showAlert('Mobile app deleted successfully', 'success');
        fetchMobileApps();
      } catch (error) {
        console.error('Error deleting mobile app:', error);
        showAlert('Failed to delete mobile app. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value } = e.target;
    setter((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    if (!currentUser || !newClient.name) return;
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...newClient,
        userId: currentUser.uid,
      });
      const newClientWithId = { id: docRef.id, name: newClient.name };
      setClients([...clients, newClientWithId]);
      setNewClient({ name: '', email: '', phone: '' });
      setIsAddingClient(false);
      showAlert('Client added successfully', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showAlert('Failed to add client. Please try again later.', 'error');
    }
  };

  const handleAddDeveloperAccount = async () => {
    if (!currentUser || !newDeveloperAccount.name) return;
    try {
      const docRef = await addDoc(collection(db, 'developerAccounts'), {
        email: newDeveloperAccount.name,
        accountType: newDeveloperAccount.type,
        userId: currentUser.uid,
      });
      const newAccountWithId = { id: docRef.id, name: newDeveloperAccount.name, type: newDeveloperAccount.type };
      setDeveloperAccounts([...developerAccounts, newAccountWithId]);
      setNewDeveloperAccount({ name: '', type: 'apple' });
      setIsAddingDeveloperAccount(false);
      showAlert('Developer account added successfully', 'success');
    } catch (error) {
      console.error('Error adding developer account:', error);
      showAlert('Failed to add developer account. Please try again later.', 'error');
    }
  };

  const handleAddVersion = () => {
    if (newVersion && !versions.includes(newVersion)) {
      setVersions([...versions, newVersion]);
      setNewVersion('');
    }
  };

  const showIOSFields = (platform: string) => platform === 'iOS' || platform === 'Both';
  const showAndroidFields = (platform: string) => platform === 'Android' || platform === 'Both';

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mobile Apps Management</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          
          <span>Add New Mobile App</span>
        </Button>
      </div>

      {/* Mobile Apps List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">App Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isTableLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex justify-center items-center">
                    <Loader className="animate-spin mr-2" />
                    Loading mobile apps...
                  </div>
                </td>
              </tr>
            ) : mobileApps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No mobile apps found.
                </td>
              </tr>
            ) : (
              mobileApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      
                      {app.appName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.platform === 'iOS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      app.platform === 'Android' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {app.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{app.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === 'live' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      app.status === 'in development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      app.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      app.status === 'deprecated' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      v{app.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {app.appleLiveUrl && (
                        <a
                          href={app.appleLiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        onClick={() => setEditingApp(app)}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteApp(app.id)} 
                        variant="outline"
                        size="sm"
                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        isLoading={isDeleteLoading === app.id}
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

      {/* Add/Edit Mobile App Modal */}
      {(isModalOpen || editingApp) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center overflow-y-auto z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full m-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingApp ? 'Edit Mobile App' : 'Add New Mobile App'}
            </h2>
            <form onSubmit={editingApp ? handleEditApp : handleAddApp} className="space-y-4">
              <Input
                name="appName"
                placeholder="App Name"
                value={editingApp ? editingApp.appName : newApp.appName}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              <select
                name="platform"
                value={editingApp ? editingApp.platform : newApp.platform}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
                <option value="Both">Both</option>
              </select>
              <div className="flex items-center space-x-2">
                <select
                  name="clientId"
                  value={editingApp ? editingApp.clientId : newApp.clientId}
                  onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                  className="flex-grow p-2 border rounded"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <Button type="button" onClick={() => setIsAddingClient(true)}>Add Client</Button>
              </div>
              {isAddingClient && (
                <div className="space-y-2">
                  <Input
                    placeholder="Client Name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                  <Input
                    placeholder="Client Email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                  <Input
                    placeholder="Client Phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                  <Button type="button" onClick={handleAddClient}>Add Client</Button>
                </div>
              )}
              <Input
                name="appDomain"
                placeholder="App Domain"
                value={editingApp ? editingApp.appDomain : newApp.appDomain}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              <Input
                name="dateCreated"
                type="date"
                placeholder="Date Created"
                value={editingApp ? editingApp.dateCreated : newApp.dateCreated}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              <Input
                name="renewalDate"
                type="date"
                placeholder="Renewal Date"
                value={editingApp ? editingApp.renewalDate : newApp.renewalDate}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              {showIOSFields(editingApp ? editingApp.platform : newApp.platform) && (
                <>
                  <div className="flex items-center space-x-2">
                    <select
                      name="iosDeveloperAccountId"
                      value={editingApp ? editingApp.iosDeveloperAccountId : newApp.iosDeveloperAccountId}
                      onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                      className="flex-grow p-2 border rounded"
                    >
                      <option value="">Select iOS Developer Account</option>
                      {developerAccounts.filter(account => account.type === 'apple').map((account) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                    <Button type="button" onClick={() => setIsAddingDeveloperAccount(true)}>Add</Button>
                  </div>
                  <Input
                    name="appleLiveUrl"
                    placeholder="Apple Live URL"
                    value={editingApp ? editingApp.appleLiveUrl : newApp.appleLiveUrl}
                    onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                  />
                </>
              )}
              {showAndroidFields(editingApp ? editingApp.platform : newApp.platform) && (
                <>
                  <div className="flex items-center space-x-2">
                    <select
                      name="googleDeveloperAccountId"
                      value={editingApp ? editingApp.googleDeveloperAccountId : newApp.googleDeveloperAccountId}
                      onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                      className="flex-grow p-2 border rounded"
                    >
                      <option value="">Select Google Developer Account</option>
                      {developerAccounts.filter(account => account.type === 'google').map((account) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                    <Button type="button" onClick={() => setIsAddingDeveloperAccount(true)}>Add</Button>
                  </div>
                  <Input
                    name="googleLiveUrl"
                    placeholder="Google Live URL"
                    value={editingApp ? editingApp.googleLiveUrl : newApp.googleLiveUrl}
                    onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                  />
                </>
              )}
              {isAddingDeveloperAccount && (
                <div className="space-y-2">
                  <Input
                    placeholder="Developer Account Email"
                    value={newDeveloperAccount.name}
                    onChange={(e) => setNewDeveloperAccount({ ...newDeveloperAccount, name: e.target.value })}
                  />
                  <select
                    value={newDeveloperAccount.type}
                    onChange={(e) => setNewDeveloperAccount({ ...newDeveloperAccount, type: e.target.value as 'apple' | 'google' })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="apple">Apple</option>
                    <option value="google">Google</option>
                  </select>
                  <Button type="button" onClick={handleAddDeveloperAccount}>Add Developer Account</Button>
                </div>
              )}
              <Input
                name="appCost"
                type="number"
                placeholder="App Cost"
                value={editingApp ? editingApp.appCost : newApp.appCost}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              <Input
                name="amountSpent"
                type="number"
                placeholder="Amount Spent"
                value={editingApp ? editingApp.amountSpent : newApp.amountSpent}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                required
              />
              <select
                name="status"
                value={editingApp ? editingApp.status : newApp.status}
                onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Status</option>
                <option value="live">Live</option>
                <option value="in development">In Development</option>
                <option value="developer account issue">Developer Account Issue</option>
                <option value="maintenance">Maintenance</option>
                <option value="deprecated">Deprecated</option>
              </select>
              <div className="flex items-center space-x-2">
                <select
                  name="version"
                  value={editingApp ? editingApp.version : newApp.version}
                  onChange={(e) => handleInputChange(e, editingApp ? setEditingApp : setNewApp)}
                  className="flex-grow p-2 border rounded"
                  required
                >
                  <option value="">Select Version</option>
                  {versions.map((version) => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
                <Input
                  placeholder="New Version"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" onClick={handleAddVersion}>Add</Button>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingApp(null);
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingApp ? 'Update' : 'Add'} Mobile App
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileApps;
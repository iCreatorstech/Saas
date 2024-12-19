import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Loader, X } from 'lucide-react';
import { ClientTable } from '../components/ClientTable';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  selfOnboarded?: boolean;
  onboardedAt?: string;
  status?: 'pending_approval' | 'approved' | 'rejected';
}

interface ClientManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ showAlert }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchClients();
      const baseUrl = window.location.origin;
      setOnboardingLink(`${baseUrl}/onboard/${currentUser.uid}`);
    }
  }, [currentUser]);

  const fetchClients = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showAlert('Failed to fetch clients', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      setClients(clients.filter(client => client.id !== id));
      showAlert('Client deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting client:', error);
      showAlert('Failed to delete client. Please try again later.', 'error');
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a client.', 'error');
      return;
    }
    
    try {
      const emailQuery = query(
        collection(db, 'clients'), 
        where('userId', '==', currentUser.uid),
        where('email', '==', newClient.email.toLowerCase())
      );
      const phoneQuery = query(
        collection(db, 'clients'), 
        where('userId', '==', currentUser.uid),
        where('phone', '==', newClient.phone)
      );

      const [emailSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(phoneQuery)
      ]);

      if (!emailSnapshot.empty) {
        showAlert('A client with this email already exists.', 'error');
        return;
      }

      if (!phoneSnapshot.empty) {
        showAlert('A client with this phone number already exists.', 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      showAlert('Error checking for duplicate clients.', 'error');
      return;
    }

    setIsAddLoading(true);
    try {
      const clientData = {
        ...newClient,
        email: newClient.email.toLowerCase(),
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'clients'), clientData);
      showAlert('Client added successfully', 'success');
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', phone: '' });
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      showAlert('Failed to add client. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !currentUser) return;
    
    try {
      const emailQuery = query(
        collection(db, 'clients'),
        where('userId', '==', currentUser.uid),
        where('email', '==', editingClient.email.toLowerCase())
      );
      const phoneQuery = query(
        collection(db, 'clients'),
        where('userId', '==', currentUser.uid),
        where('phone', '==', editingClient.phone)
      );

      const [emailSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(phoneQuery)
      ]);

      const duplicateEmail = emailSnapshot.docs.some(doc => doc.id !== editingClient.id);
      if (duplicateEmail) {
        showAlert('Another client with this email already exists.', 'error');
        return;
      }

      const duplicatePhone = phoneSnapshot.docs.some(doc => doc.id !== editingClient.id);
      if (duplicatePhone) {
        showAlert('Another client with this phone number already exists.', 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      showAlert('Error checking for duplicate clients.', 'error');
      return;
    }

    setIsEditLoading(true);
    try {
      const clientRef = doc(db, 'clients', editingClient.id);
      await updateDoc(clientRef, {
        ...editingClient,
        email: editingClient.email.toLowerCase()
      });
      showAlert('Client updated successfully', 'success');
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      showAlert('Failed to update client. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleViewClient = async (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const handleSetEditingClient = async (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between">
        <h1 className="hidden md:block text-xl md:text-2xl font-bold md:mr-4">Client</h1>
        <div className="flex items-center justify-between w-full gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 dark:bg-transparent-700 px-4 py-2 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Onboarding Link:</span>
            <input
              type="text"
              value={onboardingLink}
              readOnly
              className="bg-transparent border-none text-xs md:text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(onboardingLink);
                showAlert('Link copied to clipboard!', 'success');
              }}
            >
              Copy
            </Button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 ml-auto">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-800 rounded"
        />
      </div>

      {/* Client Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-transparent-800">
        {isTableLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center p-8 text-sm text-gray-500 dark:text-gray-400">
            No clients found
          </div>
        ) : (
          <ClientTable
            clients={clients}
            searchTerm={searchTerm}
            onEdit={handleSetEditingClient}
            onView={handleViewClient}
            onDelete={handleDeleteClient}
          />
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {(isModalOpen || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }} />
          <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClient(null);
                }}
                className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={editingClient ? handleEditClient : handleAddClient} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={editingClient ? editingClient.name : newClient.name}
                  onChange={(e) => editingClient
                    ? setEditingClient({ ...editingClient, name: e.target.value })
                    : setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={editingClient ? editingClient.email : newClient.email}
                  onChange={(e) => editingClient
                    ? setEditingClient({ ...editingClient, email: e.target.value })
                    : setNewClient({ ...newClient, email: e.target.value })
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={editingClient ? editingClient.phone : newClient.phone}
                  onChange={(e) => editingClient
                    ? setEditingClient({ ...editingClient, phone: e.target.value })
                    : setNewClient({ ...newClient, phone: e.target.value })
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClient(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isAddLoading || isEditLoading}
                >
                  {editingClient ? 'Update' : 'Add'} Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details Modal */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => {
            setIsViewModalOpen(false);
            setSelectedClient(null);
          }} />
          <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                Client Details
              </h3>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedClient(null);
                }}
                className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{selectedClient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{selectedClient.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{selectedClient.phone}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedClient(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
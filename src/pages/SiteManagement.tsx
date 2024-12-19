import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash2, Loader, ExternalLink } from 'lucide-react';
import { Input } from '../components/ui/input';

interface Site {
  id: string;
  name: string;
  type: string;
  url: string;
  hostId: string;
  hostName: string;
  domainPurchasedFrom: string;
  expirationDate: string;
  nameChanged: boolean;
  oldDomainName?: string;
  oldDomainExpirationDate?: string;
  amountPaid: number;
  amountUsedForCreation: number;
}

interface Host {
  id: string;
  name: string;
}

interface SiteManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SiteManagement: React.FC<SiteManagementProps> = ({ showAlert }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSite, setNewSite] = useState<Omit<Site, 'id'>>({
    name: '',
    type: '',
    url: '',
    clientId: '',
    clientName: '',
    hostId: '',
    hostName: '',
    domainPurchasedFrom: '',
    expirationDate: '',
    nameChanged: false,
    amountPaid: 0,
    amountUsedForCreation: 0,
  });
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [siteTypes, setSiteTypes] = useState<string[]>(['Personal', 'Business', 'E-commerce', 'Blog']);
  const [newSiteType, setNewSiteType] = useState('');
  const [isAddingHost, setIsAddingHost] = useState(false);
  const [newHost, setNewHost] = useState({ name: '' });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchSites();
      fetchHosts();
      fetchClients();
    }
  }, [currentUser]);

  const fetchClients = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email
      }));
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showAlert('Failed to fetch clients', 'error');
    }
  };

  const fetchSites = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'sites'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const sitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
      showAlert('Failed to fetch sites. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchHosts = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'hostingAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const hostsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().provider || 'Unknown Provider', // Ensure 'provider' exists
      } as Host));
      setHosts(hostsData);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      showAlert('Failed to fetch hosts. Please try again later.', 'error');
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a site.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const selectedHost = hosts.find(host => host.id === newSite.hostId);
      if (!selectedHost) {
        throw new Error('Selected host not found');
      }
      const siteData = {
        ...newSite,
        userId: currentUser.uid,
        hostName: selectedHost.name,
      };
      await addDoc(collection(db, 'sites'), siteData);
      setIsModalOpen(false);
      showAlert('Site added successfully', 'success');
      setIsModalOpen(false);
      setNewSite({
        name: '',
        type: '',
        url: '',
        hostId: '',
        hostName: '',
        domainPurchasedFrom: '',
        expirationDate: '',
        nameChanged: false,
        amountPaid: 0,
        amountUsedForCreation: 0,
      });
      fetchSites();
    } catch (error) {
      console.error('Error adding site:', error);
      showAlert('Failed to add site. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    if (!currentUser) {
      showAlert('You must be logged in to update a site.', 'error');
      return;
    }

    setIsEditLoading(true);
    try {
      const selectedHost = hosts.find(host => host.id === editingSite.hostId);
      if (!selectedHost) {
        throw new Error('Selected host not found');
      }

      const updatedSite = {
        ...editingSite,
        hostName: selectedHost.name,
        userId: editingSite.userId || currentUser.uid, // Preserve original owner
        lastModifiedBy: currentUser.uid,
        lastModifiedAt: new Date().toISOString()
      };

      const siteRef = doc(db, 'sites', editingSite.id);
      await updateDoc(siteRef, updatedSite);
      setEditingSite(null);
      showAlert('Site updated successfully', 'success');
      setIsModalOpen(false);
      setEditingSite(null);
      fetchSites();
    } catch (error) {
      console.error('Error updating site:', error);
      if (error.code === 'permission-denied') {
        showAlert('You do not have permission to update this site.', 'error');
      } else {
        showAlert('Failed to update site. Please try again later.', 'error');
      }
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'sites', id));
        showAlert('Site deleted successfully', 'success');
        fetchSites();
      } catch (error) {
        console.error('Error deleting site:', error);
        showAlert('Failed to delete site. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  const handleAddSiteType = () => {
    if (newSiteType && !siteTypes.includes(newSiteType)) {
      setSiteTypes([...siteTypes, newSiteType]);
      setNewSiteType('');
    }
  };

  const handleAddHost = async () => {
    if (!currentUser || !newHost.name) return;
    try {
      const hostData = {
        provider: newHost.name,
        userId: currentUser.uid,
      };
      const docRef = await addDoc(collection(db, 'hostingAccounts'), hostData);
      const newHostWithId = { id: docRef.id, name: newHost.name };
      setHosts([...hosts, newHostWithId]);
      setNewHost({ name: '' });
      setIsAddingHost(false);
      showAlert('Host added successfully', 'success');
    } catch (error) {
      console.error('Error adding host:', error);
      showAlert('Failed to add host. Please try again later.', 'error');
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Site Management</h1>
        <Button onClick={() => { setIsModalOpen(true); setEditingSite(null); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New Site
        </Button>
      </div>
      
      {/* Site List */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-transparent-800">
  <div className="overflow-x-auto">
    <table className="w-full bg-transparent dark:bg-transparent-100">
      <thead className="bg-gray-100 dark:bg-gray-800">
        <tr>
          {[
            'Type',
            'Client',
            'URL',
            'Host',
            'Expiration',
            'Changed',
            'Actions',
          ].map((header) => (
            <th
              key={header}
              className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-gray-200 dark:border-gray-100"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
  {isTableLoading ? (
    <tr>
      <td
        colSpan={10}
        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
      >
        <div className="flex justify-center items-center">
          <Loader className="animate-spin mr-2 text-gray-500" aria-hidden="true" />
          <span className="sr-only"></span>
          
        </div>
      </td>
    </tr>
  ) : sites.length === 0 ? (
    <tr>
      <td
        colSpan={10}
        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
      >
        No sites found.
      </td>
    </tr>
  ) : (
    sites.map((site) => (
      <tr
        key={site.id}
        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 border-b border-gray-200 dark:border-gray-200"
      >
        <td className="px-6 py-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
          {site.type}
        </td>
        <td className="px-6 py-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
          {site.clientName || <span className="italic text-gray-400">N/A</span>}
        </td>
        <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            aria-label={`Visit ${site.url}`}
          >
            {site.url || <span className="italic text-gray-400">N/A</span>}
            <ExternalLink className="ml-1 w-4 h-4" />
          </a>
        </td>
        <td className="px-6 py-4 text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          {site.hostName || <span className="italic text-gray-400">N/A</span>}
        </td>
        <td className="px-6 py-4 text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          {site.expirationDate || <span className="italic text-gray-400">N/A</span>}
        </td>
        <td className="px-6 py-4 text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          {site.nameChanged ? 'Yes' : 'No'}
        </td>
        <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                setEditingSite(site);
                setIsModalOpen(true);
              }}
              className="btn-edit p-2 rounded-md"
              aria-label={`Edit ${site.type}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleDeleteSite(site.id)}
              variant="outline"
              isLoading={isDeleteLoading === site.id}
              className="btn-delete p-2 rounded-md transition-colors duration-200"
              aria-label={`Delete ${site.type}`}
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


      {/* Add/Edit Site Modal */}
      {(isModalOpen || editingSite) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">
              {editingSite ? 'Edit Site' : 'Add New Site'}
            </h2>
            <form onSubmit={editingSite ? handleEditSite : handleAddSite}>
              {/* Site Name */}
              <Input
                type="text"
                placeholder="Site Name"
                value={editingSite ? editingSite.name : newSite.name}
                onChange={(e) => editingSite 
                  ? setEditingSite({ ...editingSite, name: e.target.value })
                  : setNewSite({ ...newSite, name: e.target.value })
                }
                className="mb-4"
                required
              />

              {/* Site Type */}
              {/* Client Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client
                </label>
                <select
                  value={editingSite ? editingSite.clientId : newSite.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    if (editingSite) {
                      setEditingSite({
                        ...editingSite,
                        clientId: e.target.value,
                        clientName: selectedClient?.name || ''
                      });
                    } else {
                      setNewSite({
                        ...newSite,
                        clientId: e.target.value,
                        clientName: selectedClient?.name || ''
                      });
                    }
                  }}
                  className="w-full flex-grow p-2 border rounded bg-transparent text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-400 mr-2"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex mb-4">
  <select
    value={editingSite ? editingSite.type : newSite.type}
    onChange={(e) => editingSite
      ? setEditingSite({ ...editingSite, type: e.target.value })
      : setNewSite({ ...newSite, type: e.target.value })
    }
    className="flex-grow p-2 border rounded bg-transparent text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-400 mr-2"
    required
  >
    <option value="">Select Site Type</option>
    {siteTypes.map((type) => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>
  <Input
    type="text"
    placeholder="New Site Type"
    value={newSiteType}
    onChange={(e) => setNewSiteType(e.target.value)}
    className="flex-grow"
  />
  <Button type="button" onClick={handleAddSiteType} className="ml-2">
    Add
  </Button>
</div>


              {/* Site URL */}
              <Input
                type="url"
                placeholder="Site URL"
                value={editingSite ? editingSite.url : newSite.url}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, url: e.target.value })
                  : setNewSite({ ...newSite, url: e.target.value })
                }
                className="mb-4"
                required
              />

              {/* Host Selection */}
              <div className="flex mb-4">
                <select
                  value={editingSite ? editingSite.hostId : newSite.hostId}
                  onChange={(e) => editingSite
                    ? setEditingSite({ ...editingSite, hostId: e.target.value })
                    : setNewSite({ ...newSite, hostId: e.target.value })
                  }
                  className="flex-grow p-2 border rounded bg-transparent text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-400 mr-2"
                  required
                >
                  <option value="">Select Host</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id}>{host.name}</option>
                  ))}
                </select>
                <Button type="button" onClick={() => setIsAddingHost(true)} className="ml-2">
                  Add Host
                </Button>
              </div>

              {/* Add Host Section */}
              {isAddingHost && (
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="New Host Name"
                    value={newHost.name}
                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                    className="mr-2 mb-2"
                  />
                  <Button type="button" onClick={handleAddHost} className="ml-2">
                    Add Host
                  </Button>
                </div>
              )}

              {/* Domain Purchased From */}
              <Input
                type="text"
                placeholder="Domain Purchased From"
                value={editingSite ? editingSite.domainPurchasedFrom : newSite.domainPurchasedFrom}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, domainPurchasedFrom: e.target.value })
                  : setNewSite({ ...newSite, domainPurchasedFrom: e.target.value })
                }
                className="mb-4"
                required
              />

              {/* Expiration Date */}
              <Input
                type="date"
                placeholder="Expiration Date"
                value={editingSite ? editingSite.expirationDate : newSite.expirationDate}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, expirationDate: e.target.value })
                  : setNewSite({ ...newSite, expirationDate: e.target.value })
                }
                className="mb-4"
                required
              />

              {/* Name Changed Checkbox */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingSite ? editingSite.nameChanged : newSite.nameChanged}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, nameChanged: e.target.checked })
                      : setNewSite({ ...newSite, nameChanged: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Name Changed
                </label>
              </div>

              {/* Conditional Fields Based on Name Changed */}
              {(editingSite ? editingSite.nameChanged : newSite.nameChanged) && (
                <>
                  <Input
                    type="text"
                    placeholder="Old Domain Name"
                    value={editingSite ? editingSite.oldDomainName : newSite.oldDomainName}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, oldDomainName: e.target.value })
                      : setNewSite({ ...newSite, oldDomainName: e.target.value })
                    }
                    className="mb-4"
                  />
                  <Input
                    type="date"
                    placeholder="Old Domain Expiration Date"
                    value={editingSite ? editingSite.oldDomainExpirationDate : newSite.oldDomainExpirationDate}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, oldDomainExpirationDate: e.target.value })
                      : setNewSite({ ...newSite, oldDomainExpirationDate: e.target.value })
                    }
                    className="mb-4"
                  />
                </>
              )}

              {/* Amount Paid */}
              <Input
                type="number"
                placeholder="Amount Paid"
                value={editingSite ? editingSite.amountPaid : newSite.amountPaid}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value)) return;
                  editingSite
                    ? setEditingSite({ ...editingSite, amountPaid: value })
                    : setNewSite({ ...newSite, amountPaid: value });
                }}
                className="mb-4"
                required
                min="0"
                step="0.01"
              />

              {/* Amount Used for Creation */}
              <Input
                type="number"
                placeholder="Amount Used for Creation"
                value={editingSite ? editingSite.amountUsedForCreation : newSite.amountUsedForCreation}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value)) return;
                  editingSite
                    ? setEditingSite({ ...editingSite, amountUsedForCreation: value })
                    : setNewSite({ ...newSite, amountUsedForCreation: value });
                }}
                className="mb-4"
                required
                min="0"
                step="0.01"
              />

              {/* Form Actions */}
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => { 
                    setIsModalOpen(false); 
                    setEditingSite(null); 
                    setIsAddingHost(false); 
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingSite ? 'Update' : 'Add'} Site
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SiteManagement;

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { sendTeamInvitationEmail } from '../services/emailService';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Trash2, UserPlus, Shield } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    modules: {
      clients: boolean;
      sites: boolean;
      hosting: boolean;
      mobileApps: boolean;
      developerAccounts: boolean;
      tasks: boolean;
    };
  };
  status: 'active' | 'pending' | 'inactive';
  ownerId: string;
}

interface TeamsProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Teams: React.FC<TeamsProps> = ({ showAlert }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    role: '',
    generatePassword: true, // New field to control password generation
    permissions: {
      canCreate: true,
      canEdit: false,
      canDelete: false,
      modules: {
        clients: false,
        sites: false,
        hosting: false,
        mobileApps: false,
        developerAccounts: false,
        tasks: false,
      },
    },
  });

  useEffect(() => {
    if (currentUser) {
      fetchTeamMembers();
    }
  }, [currentUser]);

  const fetchTeamMembers = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'teamMembers'), where('ownerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const members = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTemporaryPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const teamQuery = query(
        collection(db, 'teamMembers'),
        where('email', '==', newMember.email),
        where('ownerId', '==', currentUser.uid)
      );
      const teamSnapshot = await getDocs(teamQuery);
      
      if (!teamSnapshot.empty) {
        showAlert('This email is already part of your team', 'error');
        setIsLoading(false);
        return;
      }

      const memberData = {
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        permissions: newMember.permissions,
        status: 'pending',
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        invitedBy: currentUser.email,
        lastModified: serverTimestamp()
      };

      try {
        // Get company name from current user's profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const companyName = userDoc.data()?.companyName || 'Your Company';

        // Create team member record
        const docRef = await addDoc(collection(db, 'teamMembers'), memberData);
        if (!docRef.id) {
          throw new Error('Failed to create team member document');
        }
        
        // Create team invite
        await addDoc(collection(db, 'teamInvites'), {
          email: newMember.email,
          ownerId: currentUser.uid,
          ownerEmail: currentUser.email,
          companyName,
          status: 'pending',
          createdAt: serverTimestamp(),
          permissions: newMember.permissions
        });

      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        showAlert('Failed to add team member to database. Please try again.', 'error');
        setIsLoading(false);
        return;
      }

      setIsModalOpen(false);
      setNewMember({
        email: '',
        name: '',
        role: 'developer',
        permissions: {
          canCreate: true,
          canEdit: false,
          canDelete: false,
          modules: {
            clients: false,
            sites: false,
            hosting: false,
            mobileApps: false,
            developerAccounts: false,
            tasks: false,
          },
        },
      });
      fetchTeamMembers();
      showAlert('Team member added successfully', 'success');
    } catch (error) {
      console.error('Error adding team member:', error);
      console.error('Error in team member creation:', error);
      showAlert('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsLoading(true);

    try {
      const memberRef = doc(db, 'teamMembers', selectedMember.id); 
      await updateDoc(memberRef, {
        permissions: selectedMember.permissions,
        lastModified: serverTimestamp(),
        modifiedBy: currentUser?.uid
      });
      setIsPermissionModalOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    setIsLoading(true);

    try {
      await deleteDoc(doc(db, 'team', memberId));
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add Team Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedMember(member);
                            setIsPermissionModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteMember(member.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleAddMember} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
                placeholder="team.member@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm mb-2"
                required
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="content_editor">Content Editor</option>
                <option value="support">Support</option>
                <option value="custom">Custom Role</option>
              </select>
              {newMember.role === 'custom' && (
                <div>
                  <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter custom role name"
                  value={newMember.role === 'custom' ? '' : newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  required
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Role determines the default permissions for the team member
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Initial Permissions</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.clients}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          clients: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Clients</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.sites}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          sites: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Sites</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.hosting}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          hosting: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Hosting</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.mobileApps}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          mobileApps: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Mobile Apps</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.developerAccounts}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          developerAccounts: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Developer Accounts</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.modules.tasks}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        modules: {
                          ...newMember.permissions.modules,
                          tasks: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Tasks</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Level</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.canCreate}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        canCreate: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Can Create</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.canEdit}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        canEdit: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Can Edit</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.permissions.canDelete}
                    onChange={(e) => setNewMember({
                      ...newMember,
                      permissions: {
                        ...newMember.permissions,
                        canDelete: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Can Delete</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={isLoading}>Add Member</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={isPermissionModalOpen} onClose={() => setIsPermissionModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Edit Permissions - {selectedMember?.name}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedMember && (
            <form onSubmit={handleUpdatePermissions} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">General Permissions</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMember.permissions.canCreate}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        permissions: { ...selectedMember.permissions, canCreate: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Can Create</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMember.permissions.canEdit}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        permissions: { ...selectedMember.permissions, canEdit: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Can Edit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMember.permissions.canDelete}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        permissions: { ...selectedMember.permissions, canDelete: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Can Delete</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Module Access</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedMember.permissions.modules).map(([module, value]) => (
                    <label key={module} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSelectedMember({
                          ...selectedMember,
                          permissions: {
                            ...selectedMember.permissions,
                            modules: {
                              ...selectedMember.permissions.modules,
                              [module]: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {module.charAt(0).toUpperCase() + module.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPermissionModalOpen(false);
                    setSelectedMember(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Save Permissions
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
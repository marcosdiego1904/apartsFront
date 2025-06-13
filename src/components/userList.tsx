// src/components/UserManagement.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, createNewUser, updateExistingUser, deleteUserById, seedSampleUsers, seedAllSampleData, checkDataStatus } from '../services/api';
import type { User, CreateUserPayload } from '../services/api';
import { FiUser, FiUsers, FiPlus, FiMail, FiKey, FiShield, FiHome, FiPhone, FiCheckCircle, FiXCircle, FiEdit, FiTrash2, FiAlertTriangle, FiDatabase, FiRefreshCw } from 'react-icons/fi';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const initialFormData: CreateUserPayload = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'tenant',
    unit_id: null,
    phone_number: '',
    number_of_family_members: 0,
    is_active: true
  };
  const [formData, setFormData] = useState<CreateUserPayload>(initialFormData);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', visible: boolean}>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred while loading users.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'unit_id' || name === 'number_of_family_members') {
      const parsedValue = parseInt(value, 10);
      setFormData(prev => ({
         ...prev, 
         [name]: value === '' ? (name === 'unit_id' ? null : 0) : (isNaN(parsedValue) ? (name === 'unit_id' ? null : 0) : parsedValue)
        }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetFormData = () => {
    setFormData(initialFormData);
  };
  
  const openAddModal = () => {
    resetFormData();
    setSelectedUser(null);
    setIsAddModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '', 
      role: user.role as 'manager' | 'tenant',
      unit_id: user.unit_id,
      phone_number: user.phone_number || '',
      number_of_family_members: user.number_of_family_members || 0,
      is_active: user.is_active !== undefined ? user.is_active : true,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteConfirmModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false); 
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.password?.trim()) {
      showToast('First name, last name, email, and password are required.', 'error');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await createNewUser(formData);
      closeModals();
      showToast('User added successfully!', 'success');
      fetchUsers(); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add user.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error("Error adding user:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      showToast('First name, last name, and email are required.', 'error');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload: Partial<CreateUserPayload> = { ...formData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      await updateExistingUser(selectedUser.id, payload);
      closeModals();
      showToast('User updated successfully!', 'success');
      fetchUsers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update user.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      setError(null);
      await deleteUserById(selectedUser.id);
      closeModals();
      setSelectedUser(null);
      showToast('User deleted successfully!', 'success');
      fetchUsers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete user.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUserPayload: Partial<CreateUserPayload> = { is_active: !user.is_active };
      await updateExistingUser(user.id, updatedUserPayload);
      showToast(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`, 'success');
      fetchUsers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle user status.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error("Error toggling user status:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <p>Loading users...</p>;
  }

  if (error && users.length === 0) {
    return <p>Error loading users: {error}</p>;
  }

  return (
    <div className="user-management-container">
      {toast.visible && (
        <div 
          className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} 
          role="alert"
        >
          {toast.message}
          <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className="toast-close-btn">&times;</button>
        </div>
      )}

      <div className="user-management-header">
        <h2 className="page-title">User Management</h2>
        <button onClick={openAddModal} className="btn btn-primary">
          <FiPlus /> Add New User
        </button>
      </div>

      {loading && !error && <div className="loading-container"><p>Loading users...</p></div>}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <button onClick={fetchUsers} className="btn btn-sm btn-outline-secondary" style={{marginLeft: '10px'}}>Try Again</button>
        </div>
      )}
      
      {!loading && !error && users.length === 0 && (
         <div className="alert alert-info">No users found.</div>
      )}

      {/* Users Table conditional rendering block */}
      {!loading && !error && users.length > 0 && (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th><FiUser /> ID</th>
                <th><FiUser /> Name</th>
                <th><FiMail /> Email</th>
                <th><FiShield /> Role</th>
                <th><FiHome /> Unit</th>
                <th><FiPhone /> Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === 'manager' ? (
                      <span className="badge badge-primary-inverted">
                        <FiShield /> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    ) : (
                      <span className="badge badge-secondary-inverted">
                        <FiUser /> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td>{user.unit_id ? (
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiHome /> {user.unit_id}</span>
                      ) : '-'}
                  </td>
                  <td>{user.phone_number ? (
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiPhone /> {user.phone_number}</span>
                      ) : '-'}
                  </td>
                  <td className="text-center">
                    <span 
                      className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'} cursor-pointer`}
                      onClick={() => toggleUserStatus(user)}
                      title={`Click to ${user.is_active ? 'deactivate' : 'activate'} user`}
                      role="button"
                      tabIndex={0}
                    >
                      {user.is_active ? (
                        <><FiCheckCircle /> Active</>
                      ) : (
                        <><FiXCircle /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(user)}
                      title="Edit user"
                    >
                      <FiEdit /> Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => openDeleteConfirmModal(user)} 
                      title="Delete user"
                      style={{marginLeft: 'var(--spacing-xs)'}}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FiUser /> Add New User</h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ padding: '1.5rem' }}>
                <div className="form-grid form-grid-cols-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="first_name">
                      <FiUser /> First Name
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="last_name">
                      <FiUser /> Last Name
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="email">
                      <FiMail /> Email
                    </label>
                    <input
                      className="form-input"
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="password">
                      <FiKey /> Password
                    </label>
                    <input
                      className="form-input"
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={isAddModalOpen} // Solo requerido para nuevos usuarios
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">
                      <FiShield /> Role
                    </label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="tenant">Tenant</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="unit_id">
                      <FiHome /> Unit ID
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      id="unit_id"
                      name="unit_id"
                      value={formData.unit_id || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone_number">
                      <FiPhone /> Phone Number
                    </label>
                    <input
                      className="form-input"
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="number_of_family_members">
                      <FiUsers /> Family Members
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      id="number_of_family_members"
                      name="number_of_family_members"
                      min="0"
                      value={formData.number_of_family_members}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="add_is_active"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      style={{width: '16px', height: '16px'}}
                    />
                    <label htmlFor="add_is_active" style={{ marginLeft: '8px', display:'flex', alignItems:'center', cursor: 'pointer', fontWeight: 'normal' }}>
                      <FiCheckCircle style={{ marginRight: '4px' }}/> Active
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <FiPlus /> Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FiEdit /> Edit User</h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ padding: '1.5rem' }}>
                <div className="form-grid form-grid-cols-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_first_name">
                      <FiUser /> First Name
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="edit_first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_last_name">
                      <FiUser /> Last Name
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="edit_last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="edit_email">
                      <FiMail /> Email
                    </label>
                    <input
                      className="form-input"
                      type="email"
                      id="edit_email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="edit_password">
                      <FiKey /> Password (Dejar en blanco para mantener actual)
                    </label>
                    <input
                      className="form-input"
                      type="password"
                      id="edit_password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_role">
                      <FiShield /> Role
                    </label>
                    <select
                      className="form-select"
                      id="edit_role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="tenant">Tenant</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_unit_id">
                      <FiHome /> Unit ID
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      id="edit_unit_id"
                      name="unit_id"
                      value={formData.unit_id || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_phone_number">
                      <FiPhone /> Phone Number
                    </label>
                    <input
                      className="form-input"
                      type="tel"
                      id="edit_phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_number_of_family_members">
                      <FiUsers /> Family Members
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      id="edit_number_of_family_members"
                      name="number_of_family_members"
                      min="0"
                      value={formData.number_of_family_members}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="edit_is_active"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      style={{width: '16px', height: '16px'}}
                    />
                    <label htmlFor="edit_is_active" style={{ marginLeft: '8px', display:'flex', alignItems:'center', cursor: 'pointer', fontWeight: 'normal' }}>
                      <FiCheckCircle style={{ marginRight: '4px' }} /> Active
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>
                  <FiXCircle /> Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <FiCheckCircle /> Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedUser && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#e53e3e' }}>
                <FiAlertTriangle style={{ color: '#e67e22', marginRight: '8px' }}/> Confirm Delete
              </h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  backgroundColor: '#fff5f5', 
                  padding: '12px', 
                  borderRadius: '50%', 
                  marginRight: '16px',
                  color: '#e53e3e'
                }}>
                  <FiAlertTriangle />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1a202c' }}>
                    Delete User: {selectedUser.first_name} {selectedUser.last_name}
                  </h4>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#fff5f5', 
                border: '1px solid #fed7d7', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '16px' 
              }}>
                <p style={{ margin: 0, color: '#c53030', fontSize: '0.9rem' }}>
                  <strong>Warning:</strong> This action cannot be undone. All data associated with this user will be permanently deleted.
                </p>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                <p style={{ margin: '8px 0' }}>This will remove:</p>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>User account and profile information</li>
                  <li>Associated payment records</li>
                  <li>Maintenance requests and history</li>
                  <li>Access permissions and authentication data</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModals}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteUser}
                style={{ backgroundColor: '#e53e3e', borderColor: '#e53e3e' }}
              >
                <FiTrash2 /> Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      <div className={`toast-message ${toast.visible ? 'show' : ''} bg-${toast.type}`}>
        {toast.visible && toast.type === 'success' && <FiCheckCircle />}
        {toast.visible && toast.type === 'error' && <FiXCircle />}
        {toast.message}
      </div>
    </div>
  );
};

export default UserManagement;
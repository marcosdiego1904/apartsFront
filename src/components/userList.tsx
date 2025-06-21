// src/components/userList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, createNewUser, updateExistingUser, deleteUserById } from '../services/api';
import type { User, CreateUserPayload } from '../services/api';
import { FiUser, FiUsers, FiPlus, FiMail, FiKey, FiShield, FiHome, FiPhone, FiCheckCircle, FiEdit, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

// Interface for form errors
interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
}

// ============== COMPONENTE DE FORMULARIO EXTRAÍDO ==============
// Se ha movido fuera de UserManagement para evitar que pierda el foco.
interface FormFieldsProps {
  formData: CreateUserPayload;
  formErrors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditModalOpen: boolean;
}

const FormFields: React.FC<FormFieldsProps> = ({ formData, formErrors, handleInputChange, isEditModalOpen }) => (
  <div className="form-grid form-grid-cols-2 form-grid-condensed">
    <div className="form-group">
      <label className="form-label" htmlFor="first_name"><FiUser /> First Name</label>
      <input className={`form-input ${formErrors.first_name ? 'is-invalid' : ''}`} type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
      {formErrors.first_name && <div className="invalid-feedback">{formErrors.first_name}</div>}
    </div>
    <div className="form-group">
      <label className="form-label" htmlFor="last_name"><FiUser /> Last Name</label>
      <input className={`form-input ${formErrors.last_name ? 'is-invalid' : ''}`} type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
      {formErrors.last_name && <div className="invalid-feedback">{formErrors.last_name}</div>}
    </div>
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <label className="form-label" htmlFor="email"><FiMail /> Email</label>
      <input className={`form-input ${formErrors.email ? 'is-invalid' : ''}`} type="email" name="email" value={formData.email} onChange={handleInputChange} required />
      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
    </div>
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <label className="form-label" htmlFor="password"><FiKey /> Password {isEditModalOpen && "(leave blank to keep current)"}</label>
      <input className={`form-input ${formErrors.password ? 'is-invalid' : ''}`} type="password" name="password" value={formData.password} onChange={handleInputChange} />
      {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
    </div>
    <div className="form-group">
      <label className="form-label" htmlFor="role"><FiShield /> Role</label>
      <select className="form-select" name="role" value={formData.role} onChange={handleInputChange} required>
        <option value="tenant">Tenant</option>
        <option value="manager">Manager</option>
      </select>
    </div>
    <div className="form-group">
      <label className="form-label" htmlFor="unit_id"><FiHome /> Unit ID</label>
      <input className="form-input" type="number" name="unit_id" value={formData.unit_id || ''} onChange={handleInputChange} />
    </div>
    <div className="form-group">
      <label className="form-label" htmlFor="phone_number"><FiPhone /> Phone Number</label>
      <input className="form-input" type="tel" name="phone_number" value={formData.phone_number || ''} onChange={handleInputChange} />
    </div>
    <div className="form-group">
      <label className="form-label" htmlFor="number_of_family_members"><FiUsers /> Family Members</label>
      <input className="form-input" type="number" name="number_of_family_members" min="0" value={formData.number_of_family_members || 0} onChange={handleInputChange} />
    </div>
    <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
      <input id="is_active" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{width: '16px', height: '16px'}} />
      <label htmlFor="is_active" style={{ marginLeft: '8px', cursor: 'pointer', fontWeight: 'normal' }}><FiCheckCircle style={{ marginRight: '4px' }}/> Active</label>
    </div>
  </div>
);

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
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', visible: boolean}>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    const timer = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      const msg = 'Failed to load users.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid.';
    }
    if (!isEditModalOpen && (!formData.password || formData.password.length < 6)) {
      errors.password = 'Password is required and must be at least 6 characters.';
    }
    if (isEditModalOpen && formData.password && formData.password.length > 0 && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const { checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };
  
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      ...user,
      password: '',
      phone_number: user.phone_number || '',
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
    setSelectedUser(null);
    resetForm();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await createNewUser(formData);
      showToast('User added successfully!', 'success');
      fetchUsers();
      closeModals();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add user', 'error');
    }
    setLoading(false);
  };
  
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setLoading(true);
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    try {
      await updateExistingUser(selectedUser.id, payload);
      showToast('User updated successfully!', 'success');
      fetchUsers();
      closeModals();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await deleteUserById(selectedUser.id);
      showToast('User deleted successfully!', 'success');
      fetchUsers();
      closeModals();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user.', 'error');
    }
    setLoading(false);
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await updateExistingUser(user.id, { is_active: !user.is_active });
      showToast('User status updated!', 'success');
      fetchUsers();
    } catch (err) {
      showToast('Failed to update user status.', 'error');
    }
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div className="user-management-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}
      <div className="page-header">
        <h1>User Management</h1>
        <button onClick={openAddModal} className="btn btn-primary"><FiPlus /> Add New User</button>
      </div>
      {error && <div className="error-alert">{error}</div>}
      <div className="table-container table-responsive">
        <table className="users-table table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="Name">{user.first_name} {user.last_name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role"><span className={`badge ${user.role === 'manager' ? 'badge-info' : 'badge-neutral'}`}>{user.role}</span></td>
                <td data-label="Unit">{user.unit_id || 'N/A'}</td>
                <td data-label="Status">
                  <span onClick={() => toggleUserStatus(user)} className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`} title={user.is_active ? 'Click to deactivate' : 'Click to activate'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Actions" className="table-actions">
                  <button onClick={() => openEditModal(user)} className="btn btn-icon btn-sm btn-outline-secondary" title="Edit User"><FiEdit /></button>
                  <button onClick={() => openDeleteConfirmModal(user)} className="btn btn-icon btn-sm btn-danger" title="Delete User"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{maxWidth: '750px'}}>
            <div className="modal-header">
              <h3><FiUser /> Add New User</h3>
              <button onClick={closeModals} className="modal-close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddUser} noValidate>
              <div style={{padding: '1.5rem'}}>
                <FormFields 
                  formData={formData} 
                  formErrors={formErrors} 
                  handleInputChange={handleInputChange}
                  isEditModalOpen={false}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{maxWidth: '750px'}}>
            <div className="modal-header">
              <h3><FiEdit /> Edit User</h3>
              <button onClick={closeModals} className="modal-close-btn">&times;</button>
            </div>
            <form onSubmit={handleEditUser} noValidate>
              <div style={{padding: '1.5rem'}}>
                <FormFields 
                  formData={formData} 
                  formErrors={formErrors} 
                  handleInputChange={handleInputChange}
                  isEditModalOpen={true}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Saving...' : 'Update User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedUser && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{maxWidth: '450px'}}>
            <div className="modal-header">
              <h3 style={{color: '#e53e3e'}}><FiAlertTriangle /> Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeModals} className="btn btn-secondary" disabled={loading}>Cancel</button>
              <button onClick={handleDeleteUser} className="btn btn-danger" disabled={loading}>{loading ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
// src/components/UserManagement.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, createNewUser, updateExistingUser, deleteUserById } from '../services/api';
import type { User, CreateUserPayload } from '../services/api';
import { FiUser, FiUsers, FiPlus, FiMail, FiKey, FiShield, FiHome, FiPhone, FiCheckCircle, FiXCircle, FiEdit, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

// Interfaz para los errores del formulario
interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  unit_id?: string;
}

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
  const [formErrors, setFormErrors] = useState<FormErrors>({}); // Estado para errores de formulario
  
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

  const validateForm = (data: CreateUserPayload): FormErrors => {
    const errors: FormErrors = {};

    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required.';
    }
    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required.';
    }
    if (!data.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Email address is invalid.';
    }

    // La contraseña es obligatoria solo al crear (isEditModalOpen es false)
    if (!isEditModalOpen && (!data.password || data.password.length < 6)) {
      errors.password = 'Password is required and must be at least 6 characters long.';
    }
    
    // Si la contraseña existe (en modo edición) pero es muy corta
    if (isEditModalOpen && data.password && data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.';
    }

    return errors;
  };

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
    // Limpiar el error del campo cuando el usuario empieza a escribir
    if (formErrors[name as keyof FormErrors]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const resetFormData = () => {
    setFormData(initialFormData);
    setFormErrors({}); // También limpiar errores
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
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMsg = "Please fix the errors in the form.";
      setError(errorMsg); // Mostrar en la alerta principal
      showToast(errorMsg, 'error');
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
    
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMsg = "Please fix the errors in the form.";
      setError(errorMsg);
      showToast(errorMsg, 'error');
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

  const ErrorDisplay = () => {
    if (!error) return null;
    return (
      <div className="alert alert-error" role="alert">
        {error}
        <button onClick={() => {
          setError(null);
          if (error.includes('loading users')) {
            fetchUsers();
          }
        }} className="btn btn-sm btn-outline-secondary" style={{marginLeft: '10px'}}>
          {error.includes('loading users') ? 'Try Again' : 'Close'}
        </button>
      </div>
    );
  };

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

      <ErrorDisplay />
      
      <div className="content-area" style={{ position: 'relative' }}>
        {loading && <LoadingSpinner />}
        
        {!loading && users.length === 0 && !error && (
           <div className="alert alert-info">No users found.</div>
        )}

        {/* Users Table conditional rendering block */}
        {users.length > 0 && (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th><FiUser /> Name</th>
                  <th><FiMail /> Email</th>
                  <th><FiShield /> Role</th>
                  <th><FiHome /> Unit ID</th>
                  <th><FiPhone /> Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.unit_id || 'N/A'}</td>
                    <td>{user.phone_number || 'N/A'}</td>
                    <td>
                      <span 
                        onClick={() => toggleUserStatus(user)} 
                        className={`status-badge status-${user.is_active ? 'active' : 'inactive'}`}
                        style={{cursor: 'pointer'}}
                        title={`Click to ${user.is_active ? 'deactivate' : 'activate'}`}
                      >
                        {user.is_active ? <FiCheckCircle /> : <FiXCircle />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => openEditModal(user)} className="btn-icon btn-edit" title="Edit">
                        <FiEdit />
                      </button>
                      <button onClick={() => openDeleteConfirmModal(user)} className="btn-icon btn-delete" title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FiUser /> Add New User</h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleAddUser} noValidate>
              <div style={{ padding: '1.5rem' }}>
                <div className="form-grid form-grid-cols-2 form-grid-condensed">
                  <div className="form-group">
                    <label className="form-label" htmlFor="first_name">
                      <FiUser /> First Name
                    </label>
                    <input
                      className={`form-input ${formErrors.first_name ? 'is-invalid' : ''}`}
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.first_name && <div className="invalid-feedback">{formErrors.first_name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="last_name">
                      <FiUser /> Last Name
                    </label>
                    <input
                      className={`form-input ${formErrors.last_name ? 'is-invalid' : ''}`}
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.last_name && <div className="invalid-feedback">{formErrors.last_name}</div>}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="email">
                      <FiMail /> Email
                    </label>
                    <input
                      className={`form-input ${formErrors.email ? 'is-invalid' : ''}`}
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="password">
                      <FiKey /> Password
                    </label>
                    <input
                      className={`form-input ${formErrors.password ? 'is-invalid' : ''}`}
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={isAddModalOpen}
                    />
                    {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
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
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <FiPlus /> {loading ? 'Saving...' : 'Add User'}
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
            <form onSubmit={handleEditUser} noValidate>
              <div style={{ padding: '1.5rem' }}>
                <div className="form-grid form-grid-cols-2 form-grid-condensed">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_first_name">
                      <FiUser /> First Name
                    </label>
                    <input
                      className={`form-input ${formErrors.first_name ? 'is-invalid' : ''}`}
                      type="text"
                      id="edit_first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.first_name && <div className="invalid-feedback">{formErrors.first_name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit_last_name">
                      <FiUser /> Last Name
                    </label>
                    <input
                      className={`form-input ${formErrors.last_name ? 'is-invalid' : ''}`}
                      type="text"
                      id="edit_last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.last_name && <div className="invalid-feedback">{formErrors.last_name}</div>}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="edit_email">
                      <FiMail /> Email
                    </label>
                    <input
                      className={`form-input ${formErrors.email ? 'is-invalid' : ''}`}
                      type="email"
                      id="edit_email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="edit_password">
                      <FiKey /> Password (leave blank to keep current)
                    </label>
                    <input
                      className={`form-input ${formErrors.password ? 'is-invalid' : ''}`}
                      type="password"
                      id="edit_password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
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
                <button type="submit" className="btn btn-success" disabled={loading}>
                  <FiCheckCircle /> {loading ? 'Saving...' : 'Update User'}
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
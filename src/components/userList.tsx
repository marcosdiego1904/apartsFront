// src/components/UserManagement.tsx
import React, { useEffect, useState } from 'react';
import { getAllUsers, createNewUser, updateExistingUser, deleteUserById } from '../services/api';
import type { User, CreateUserPayload } from '../services/api';
import './style1.css';

// Iconos SVG componentes
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.758 2.855L15 11.114v-5.73zm-.034 6.878L9.271 8.82 8 9.583 6.728 8.82l-5.694 3.44A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.739zM1 11.114l4.758-2.876L1 5.383v5.73z"/>
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11 9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4 4 0 0 1 0 8zm4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5z"/>
    <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
    <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
  </svg>
);

const FamilyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12.5A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5zM9.5 3A1.5 1.5 0 0 0 11 4.5h2v9.255S12 12 8 12s-5 1.755-5 1.755V2a1 1 0 0 1 1-1h5.5v2z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
  </svg>
);

// Nuevo icono para eliminar
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

// Nuevo icono de advertencia para confirmación
const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

const UserManagement: React.FC = () => {
  // User list state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Add/Edit user form state
  const [formData, setFormData] = useState<CreateUserPayload>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'tenant',
    unit_id: null,
    phone_number: '',
    number_of_family_members: 0,
    is_active: true
  });
  
  // Toast notification state
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', visible: boolean}>({
    message: '',
    type: 'success',
    visible: false
  });

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while loading users.');
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'unit_id') {
      // Convert unit_id to number or null
      setFormData({
        ...formData,
        [name]: value ? parseInt(value, 10) : null
      });
    } else if (name === 'number_of_family_members') {
      // Convert to number
      setFormData({
        ...formData,
        [name]: value ? parseInt(value, 10) : 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Open Add User Modal
  const openAddModal = () => {
    // Reset form data
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'tenant',
      unit_id: null,
      phone_number: '',
      number_of_family_members: 0,
      is_active: true
    });
    setIsAddModalOpen(true);
  };
  
  // Open Edit User Modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    // Populate form with user data
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '', // Don't include password for edit
      role: user.role as 'manager' | 'tenant',
      unit_id: user.unit_id,
      phone_number: user.phone_number || '',
      number_of_family_members: user.number_of_family_members || 0,
      is_active: user.is_active || false
    });
    setIsEditModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirm = () => {
    setIsDeleteConfirmOpen(true);
  };

  // Close all modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedUser(null);
  };

  // Submit handler for adding a new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validaciones adicionales antes de enviar
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.password.trim()) {
        showToast('All required fields must be filled', 'error');
        return;
      }

      console.log('Sending user data:', {
        ...formData,
        password: '[HIDDEN]' // No mostrar la contraseña en logs
      });

      const newUser = await createNewUser(formData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      closeModals();
      showToast('User added successfully!', 'success');
    } catch (err: any) {
      console.error("Error adding user:", err);
      
      // Mejor manejo de errores de Axios
      if (err.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        const errorMessage = err.response.data?.message || 
                            err.response.data?.error || 
                            `Server error: ${err.response.status}`;
        showToast(errorMessage, 'error');
      } else if (err.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error('Request made but no response received:', err.request);
        showToast('No response from server. Please check your connection.', 'error');
      } else {
        // Algo más causó el error
        console.error('Error setting up request:', err.message);
        showToast(err.message || 'An unexpected error occurred', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit handler for editing a user
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      // Create a new payload omitting password if it's empty
      const finalPayload = formData.password 
        ? {...formData} 
        : {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            role: formData.role,
            unit_id: formData.unit_id,
            phone_number: formData.phone_number,
            number_of_family_members: formData.number_of_family_members,
            is_active: formData.is_active
          };
      
      const updatedUser = await updateExistingUser(selectedUser.id, finalPayload);
      
      // Update users array with the edited user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      closeModals();
      showToast('User updated successfully!', 'success');
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      await deleteUserById(selectedUser.id);
      
      // Remove user from the users array
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== selectedUser.id)
      );
      
      closeModals();
      showToast('User deleted successfully!', 'success');
    } catch (err) {
      console.error("Error deleting user:", err);
      
      // Manejo de errores específicos para eliminación
      if (err instanceof Error && err.message.includes('associated')) {
        showToast('Cannot delete user: User has associated data that must be removed first.', 'error');
      } else {
        showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user: User) => {
    try {
      setLoading(true);
      const updatedUser = await updateExistingUser(user.id, {
        is_active: !user.is_active
      });
      
      // Update users array with the updated user
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === updatedUser.id ? updatedUser : u
        )
      );
      
      showToast(`User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (err) {
      console.error("Error toggling user status:", err);
      showToast(err instanceof Error ? err.message : 'Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      message,
      type,
      visible: true
    });
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({...prev, visible: false}));
    }, 3000);
  };

  if (loading && users.length === 0) {
    return <p>Loading users...</p>;
  }

  if (error && users.length === 0) {
    return <p>Error loading users: {error}</p>;
  }

  return (
    <div className="condo-panel-content-area">
      {/* Page Header */}
      <div className="section-header">
        <h1><UsersIcon /> User Management</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <PlusIcon /> Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th><UserIcon /> Name</th>
              <th><EmailIcon /> Email</th>
              <th><ShieldIcon /> Role</th>
              <th><BuildingIcon /> Unit</th>
              <th><PhoneIcon /> Phone</th>
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
                <td>{user.role === 'manager' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldIcon /> {user.role}</span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UserIcon /> {user.role}</span>
                  )}
                </td>
                <td>{user.unit_id ? (
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><BuildingIcon /> {user.unit_id}</span>
                    ) : '-'}
                </td>
                <td>{user.phone_number ? (
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><PhoneIcon /> {user.phone_number}</span>
                    ) : '-'}
                </td>
                <td className="text-center">
                  <span 
                    className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}
                    onClick={() => toggleUserStatus(user)}
                    title="Click to toggle status"
                  >
                    {user.is_active ? (
                      <><CheckCircleIcon /> Active</>
                    ) : (
                      <><CloseIcon /> Inactive</>
                    )}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-icon" 
                    onClick={() => openEditModal(user)}
                    title="Edit user"
                  >
                    <EditIcon /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><UserIcon /> Add New User</h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="form-grid form-grid-cols-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="first_name">
                    <UserIcon /> First Name
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
                    <UserIcon /> Last Name
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
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    <EmailIcon /> Email
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
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    <KeyIcon /> Password
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
                    <ShieldIcon /> Role
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
                    <BuildingIcon /> Unit ID
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
                    <PhoneIcon /> Phone Number
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
                    <FamilyIcon /> Family Members
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
                <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span style={{ marginLeft: '8px' }}>
                      <CheckCircleIcon /> Active
                    </span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <PlusIcon /> Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><EditIcon /> Edit User</h3>
              <button className="modal-close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="form-grid form-grid-cols-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_first_name">
                    <UserIcon /> First Name
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
                    <UserIcon /> Last Name
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
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_email">
                    <EmailIcon /> Email
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
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_password">
                    <KeyIcon /> Password (Dejar en blanco para mantener actual)
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
                    <ShieldIcon /> Role
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
                    <BuildingIcon /> Unit ID
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
                    <PhoneIcon /> Phone Number
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
                    <FamilyIcon /> Family Members
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
                <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span style={{ marginLeft: '8px' }}>
                      <CheckCircleIcon /> Active
                    </span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={openDeleteConfirm}>
                  <TrashIcon /> Delete User
                </button>
                <div style={{ flex: 1 }}></div>
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <EditIcon /> Update User
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
                <WarningIcon /> Confirm Delete
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
                  <WarningIcon />
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
                <TrashIcon /> Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      <div className={`toast-message ${toast.visible ? 'show' : ''} bg-${toast.type}`}>
        {toast.visible && toast.type === 'success' && <CheckCircleIcon />}
        {toast.visible && toast.type === 'error' && <CloseIcon />}
        {toast.message}
      </div>
    </div>
  );
};

export default UserManagement;
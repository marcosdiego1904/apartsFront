import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../services/api';
import type { User } from '../services/api';
// Importamos los estilos desde un archivo separado

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar usuarios.';
        setError(errorMessage);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleAddUser = () => {
    setShowAddModal(true);
  };
  
  // Function skeletons - would be implemented in a real application
  const handleDeleteUser = (userId: number) => {
    console.log(`Delete user with ID: ${userId}`);
    // In a real app, you would call an API and update the state
  };

  const handleStatusToggle = (userId: number, currentStatus: boolean) => {
    console.log(`Toggle status for user ${userId} from ${currentStatus} to ${!currentStatus}`);
    // In a real app, you would call an API and update the state
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Error al cargar usuarios</h3>
        <p>{error}</p>
        <button className="btn btn-primary">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="section-header">
        <h2 className="page-title">Gestión de Usuarios</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
          <button className="btn btn-primary add-user-btn" onClick={handleAddUser}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Añadir Usuario
          </button>
        </div>
      </div>

      {/* User Stats Section */}
      <div className="user-stats-section">
        <div className="stat-card">
          <div className="stat-icon icon-total-users">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Total Usuarios</div>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-managers">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Administradores</div>
            <div className="stat-value">{users.filter(user => user.role === 'manager').length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-tenants">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Inquilinos</div>
            <div className="stat-value">{users.filter(user => user.role === 'tenant').length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Usuarios Activos</div>
            <div className="stat-value">{users.filter(user => user.is_active).length}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        {users.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <h3>No hay usuarios registrados</h3>
            <p>Añade un nuevo usuario para comenzar</p>
            <button className="btn btn-primary" onClick={handleAddUser}>Añadir Usuario</button>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td className="user-name-cell">
                    <div className="user-avatar">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </div>
                    <div className="user-name">
                      <span>{user.first_name} {user.last_name}</span>
                      {user.phone_number && (
                        <span className="user-phone">{user.phone_number}</span>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role === 'manager' ? 'role-manager' : 'role-tenant'}`}>
                      {user.role === 'manager' ? 'Administrador' : 'Inquilino'}
                    </span>
                  </td>
                  <td>{user.unit_id || 'No asignada'}</td>
                  <td>
                    <span 
                      className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}
                      onClick={() => handleStatusToggle(user.id, !!user.is_active)}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon edit-btn" onClick={() => handleEditUser(user)} title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className="btn-icon delete-btn" onClick={() => handleDeleteUser(user.id)} title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal placeholders - would have full implementation in a real application */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Añadir Nuevo Usuario</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label htmlFor="first_name">Nombre</label>
                <input type="text" id="first_name" className="form-input" />
              </div>
              <div className="input-group">
                <label htmlFor="last_name">Apellido</label>
                <input type="text" id="last_name" className="form-input" />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" className="form-input" />
              </div>
              <div className="input-group">
                <label htmlFor="password">Contraseña</label>
                <input type="password" id="password" className="form-input" />
              </div>
              <div className="input-group">
                <label htmlFor="role">Rol</label>
                <select id="role" className="form-select">
                  <option value="tenant">Inquilino</option>
                  <option value="manager">Administrador</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="unit_id">Unidad</label>
                <select id="unit_id" className="form-select">
                  <option value="">Sin asignar</option>
                  <option value="1">Unidad 101</option>
                  <option value="2">Unidad 102</option>
                  <option value="3">Unidad 201</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="phone_number">Teléfono</label>
                <input type="tel" id="phone_number" className="form-input" />
              </div>
              <div className="input-group checkbox-group">
                <input type="checkbox" id="is_active" defaultChecked />
                <label htmlFor="is_active">Usuario activo</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label htmlFor="edit_first_name">Nombre</label>
                <input 
                  type="text" 
                  id="edit_first_name" 
                  className="form-input"
                  defaultValue={selectedUser.first_name} 
                />
              </div>
              <div className="input-group">
                <label htmlFor="edit_last_name">Apellido</label>
                <input 
                  type="text" 
                  id="edit_last_name" 
                  className="form-input"
                  defaultValue={selectedUser.last_name} 
                />
              </div>
              <div className="input-group">
                <label htmlFor="edit_email">Email</label>
                <input 
                  type="email" 
                  id="edit_email" 
                  className="form-input"
                  defaultValue={selectedUser.email} 
                />
              </div>
              <div className="input-group">
                <label htmlFor="edit_password">Contraseña</label>
                <input 
                  type="password" 
                  id="edit_password" 
                  className="form-input"
                  placeholder="Dejar en blanco para no cambiar" 
                />
              </div>
              <div className="input-group">
                <label htmlFor="edit_role">Rol</label>
                <select 
                  id="edit_role" 
                  className="form-select"
                  defaultValue={selectedUser.role}
                >
                  <option value="tenant">Inquilino</option>
                  <option value="manager">Administrador</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="edit_unit_id">Unidad</label>
                <select 
                  id="edit_unit_id" 
                  className="form-select"
                  defaultValue={selectedUser.unit_id || ""}
                >
                  <option value="">Sin asignar</option>
                  <option value="1">Unidad 101</option>
                  <option value="2">Unidad 102</option>
                  <option value="3">Unidad 201</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="edit_phone_number">Teléfono</label>
                <input 
                  type="tel" 
                  id="edit_phone_number" 
                  className="form-input"
                  defaultValue={selectedUser.phone_number || ""} 
                />
              </div>
              <div className="input-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="edit_is_active" 
                  defaultChecked={selectedUser.is_active} 
                />
                <label htmlFor="edit_is_active">Usuario activo</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn btn-primary">Actualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
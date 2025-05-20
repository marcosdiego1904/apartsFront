// src/components/UserList.tsx
import React, { useEffect, useState } from 'react';
// Ajusta la ruta si tu api.ts está en otro lugar o tiene otro nombre
import {  getAllUsers } from '../services/api';
import type {User} from '../services/api';

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
    }, []); // Se ejecuta solo una vez al montar

    if (loading) {
        return <p>Cargando usuarios...</p>;
    }

    if (error) {
        return <p>Error al cargar usuarios: {error}</p>;
    }

    return (
        <div>
            <h2>Lista de Usuarios</h2>
            {users.length === 0 ? (
                <p>No hay usuarios registrados.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {users.map(user => (
                        <li key={user.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
                            <strong>ID:</strong> {user.id} <br />
                            <strong>Nombre:</strong> {user.first_name} {user.last_name} <br />
                            <strong>Email:</strong> {user.email} <br />
                            <strong>Rol:</strong> {user.role} <br />
                            {user.unit_id && <><strong>ID Unidad:</strong> {user.unit_id} <br /></>}
                            {user.phone_number && <><strong>Teléfono:</strong> {user.phone_number} <br /></>}
                            <strong>Activo:</strong> {user.is_active ? 'Sí' : 'No'}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserList;
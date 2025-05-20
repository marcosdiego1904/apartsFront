// UserManagement.tsx
import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
// Asegúrate de que la ruta a tu archivo CSS sea correcta.
// Si styles.css está en la misma carpeta:

// Si está en una carpeta 'styles' un nivel arriba:
// import '../styles/styles.css'; 

// Define la interfaz para el usuario.
// Puedes ajustarla para que coincida exactamente con tu tipo 'User' de '../services/api'
interface User {
    id: number | string; // Permitir string si los IDs de tu API son strings
    name: string; // Combinación de first_name y last_name
    email: string;
    role: string;
    unit: string; // O unit_id si prefieres manejarlo así
    phone?: string; // phone_number
    isActive: boolean; // is_active
}

// Simulación de funciones de API (reemplaza con tus llamadas reales)
const api = {
    getAllUsers: async (): Promise<User[]> => {
        console.log("API: getAllUsers called");
        // Simula una llamada a la API
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { id: 1, name: 'Ana García Pérez', email: 'ana.garcia@email.com', role: 'Residente', unit: 'A-101', phone: '555-1234', isActive: true },
            { id: 2, name: 'Carlos López Rodríguez', email: 'carlos.lopez@email.com', role: 'Administrador', unit: 'Admin', phone: '555-5678', isActive: true },
            { id: 3, name: 'Beatriz Martínez Fernández', email: 'beatriz.martinez@email.com', role: 'Residente', unit: 'B-203', phone: '555-9012', isActive: false },
        ];
    },
    createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
        console.log("API: createUser called with", userData);
        await new Promise(resolve => setTimeout(resolve, 500));
        const newUser = { ...userData, id: Date.now() }; // Simula la creación de un ID
        return newUser;
    },
    updateUser: async (userId: number | string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
        console.log("API: updateUser called for", userId, "with", userData);
        await new Promise(resolve => setTimeout(resolve, 500));
        // En una API real, esto devolvería el usuario actualizado.
        // Aquí, simplemente devolvemos los datos fusionados como si la API lo hiciera.
        return { id: userId, name: '', email: '', role: '', unit: '', isActive: false, ...userData } as User;
    },
    // Podrías tener una función específica para cambiar el estado o incluirlo en updateUser
    toggleUserActiveState: async (userId: number | string, isActive: boolean): Promise<{ isActive: boolean }> => {
        console.log("API: toggleUserActiveState for", userId, "to", isActive);
        await new Promise(resolve => setTimeout(resolve, 300));
        return { isActive }; // Simula la respuesta
    }
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
    const [currentUserFormData, setCurrentUserFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'Residente',
        unit: '',
        phone: '',
        isActive: true,
    });

    const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
    const [lastAddedUserForEmail, setLastAddedUserForEmail] = useState<User | null>(null);
    const [emailSubject, setEmailSubject] = useState<string>('');
    const [emailBody, setEmailBody] = useState<string>('');
    const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);

    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Cargar usuarios al montar el componente
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getAllUsers(); // Reemplaza con tu llamada real
                setUsers(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar usuarios.';
                setError(errorMessage);
                console.error("Error fetching users:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Efecto para limpiar el mensaje toast después de un tiempo
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const displayToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ message, type });
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | boolean = value;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) { // Para futuros checkboxes si los hay
            processedValue = e.target.checked;
        } else if (name === 'isActive' && e.target instanceof HTMLSelectElement) { // Para el select de estado
             processedValue = value === 'true';
        }

        setCurrentUserFormData(prev => ({ ...prev, [name]: processedValue }));
    };
    
    const openUserModal = (userToEdit?: User) => {
        if (userToEdit) {
            setIsEditingUser(true);
            setCurrentUserFormData({ ...userToEdit });
        } else {
            setIsEditingUser(false);
            setCurrentUserFormData({ name: '', email: '', role: 'Residente', unit: '', phone: '', isActive: true });
        }
        setShowUserModal(true);
        setLastAddedUserForEmail(null); // Resetear para el botón de email
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setIsEditingUser(false);
        setCurrentUserFormData({ name: '', email: '', role: 'Residente', unit: '', phone: '', isActive: true });
    };

    const handleUserFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUserFormData.name || !currentUserFormData.email) {
            displayToast('Nombre y Email son requeridos.', 'error');
            return;
        }

        try {
            if (isEditingUser && currentUserFormData.id) {
                const updatedUser = await api.updateUser(currentUserFormData.id, currentUserFormData);
                setUsers(users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser} : u)); // Actualiza el usuario en la lista
                displayToast(`Usuario ${updatedUser.name} actualizado.`);
                closeUserModal();
            } else {
                // Asegurarse de que no se envíe 'id' al crear
                const { id, ...userDataToCreate } = currentUserFormData;
                const newUser = await api.createUser(userDataToCreate as Omit<User, 'id'>);
                setUsers([...users, newUser]);
                setLastAddedUserForEmail(newUser); // Guardar para el email
                displayToast(`Usuario ${newUser.name} añadido. Ahora puedes generar un email.`);
                // No cerrar el modal, permitir generar email
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al guardar usuario.';
            displayToast(errorMessage, 'error');
            console.error("Error saving user:", err);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            // Simula la llamada a la API para cambiar el estado
            const updatedStatus = await api.toggleUserActiveState(user.id, !user.isActive); 
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: updatedStatus.isActive } : u));
            displayToast(`Estado de ${user.name} cambiado a ${updatedStatus.isActive ? 'Activo' : 'Inactivo'}.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado.';
            displayToast(errorMessage, 'error');
            console.error("Error toggling status:", err);
        }
    };

    const handleGenerateWelcomeEmail = async () => {
        if (!lastAddedUserForEmail) {
            displayToast('No hay datos de usuario para generar el email.', 'error');
            return;
        }
        setShowEmailModal(true);
        setIsLoadingEmail(true);
        setEmailSubject('');
        setEmailBody('');

        const { name, role, unit } = lastAddedUserForEmail;
        const prompt = `Eres un asistente amigable para la administración de CondoPanel.
Por favor, redacta un email de bienvenida para un nuevo usuario llamado "${name}".
Su rol es "${role}" y, si aplica y no es un rol como 'Administrador' o 'Guardia', su unidad es "${unit}".
El email debe ser cordial, informativo y profesional.
Debe incluir:
1. Un saludo personalizado.
2. Una breve bienvenida a la comunidad de CondoPanel o al condominio.
3. Mencionar su rol y unidad (si es relevante para el rol).
4. Sugerir próximos pasos o dónde encontrar más información (de forma genérica).
5. Una despedida cordial.
El email debe estar en español.
Genera un asunto apropiado para el email también.
Devuelve la respuesta en formato JSON con las claves "subject" y "body".
Ejemplo: {"subject": "Asunto del email", "body": "Cuerpo del email..."}`;

        try {
            // --- INICIO DE LA LLAMADA A LA API DE GEMINI (SIMULADA) ---
            console.log("Generando email para:", lastAddedUserForEmail.name);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simular retraso de red
            const simulatedApiResponseText = JSON.stringify({
                subject: `¡Bienvenido/a a CondoPanel, ${name}!`,
                body: `Estimado/a ${name},\n\n¡Te damos la más cordial bienvenida a CondoPanel!\n\nNos alegra tenerte como ${role}${unit && !['Administrador', 'Guardia'].includes(role as string) ? ` en la unidad ${unit}` : ''}. Esperamos que tu experiencia con nuestra plataforma y en nuestra comunidad sea excelente.\n\nPara comenzar, te recomendamos explorar el panel de control para familiarizarte con las herramientas y la información disponible.\n\n¡Saludos cordiales,\nEl equipo de CondoPanel`
            });
            const emailData = JSON.parse(simulatedApiResponseText);
            // --- FIN DE LA SIMULACIÓN ---
            /*
            // --- LLAMADA REAL A LA API DE GEMINI (DESCOMENTAR Y CONFIGURAR) ---
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = ""; // Tu API Key si es necesaria para el modelo
            const apiUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKey}\`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(\`API Error: \${response.statusText} - \${errorData?.error?.message || 'Unknown error'}\`);
            }
            const result = await response.json();
            let generatedText = "";
            if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
                generatedText = result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Respuesta inesperada de la API.");
            }
            const emailData = JSON.parse(generatedText);
            // --- FIN DE LA LLAMADA REAL ---
            */
            setEmailSubject(emailData.subject);
            setEmailBody(emailData.body);
            displayToast('Email de bienvenida generado.');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al generar email.';
            displayToast(errorMessage, 'error');
            setEmailSubject('Error');
            setEmailBody(`No se pudo generar el email: ${errorMessage}`);
            console.error('Error generando email:', err);
        } finally {
            setIsLoadingEmail(false);
        }
    };
    
    const closeEmailModal = () => setShowEmailModal(false);

    const handleCopyEmail = () => {
        const emailText = `Asunto: ${emailSubject}\n\n${emailBody}`;
        const textArea = document.createElement("textarea");
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            displayToast('Email copiado al portapapeles.');
        } catch (err) {
            displayToast('Error al copiar el email.', 'error');
            console.error('Error al copiar: ', err);
        }
        document.body.removeChild(textArea);
    };


    if (isLoading) return <div className="condo-panel-content-area"><p>Cargando usuarios...</p></div>;
    if (error) return <div className="condo-panel-content-area"><p>Error al cargar usuarios: {error}</p></div>;

    return (
        <div className="condo-panel-content-area">
            <div className="section-header">
                <h1>Gestión de Usuarios</h1>
                <button onClick={() => openUserModal()} className="btn btn-primary">
                    <i className="fas fa-plus"></i>Añadir Nuevo Usuario
                </button>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Unidad</th>
                            <th>Teléfono</th>
                            <th style={{ textAlign: 'center' }}>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{user.unit}</td>
                                    <td>{user.phone || 'N/A'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span
                                            className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => handleToggleStatus(user)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && handleToggleStatus(user)}
                                        >
                                            {user.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={() => openUserModal(user)} className="btn-icon" title="Editar Usuario">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="modal-overlay active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{isEditingUser ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
                            <button onClick={closeUserModal} className="modal-close-btn">&times;</button>
                        </div>
                        <form onSubmit={handleUserFormSubmit}>
                            {/* Campo oculto para ID si es necesario para la lógica del formulario, aunque no se edita */}
                            {isEditingUser && currentUserFormData.id && <input type="hidden" name="id" value={currentUserFormData.id} />}
                            
                            <div className="form-grid form-grid-cols-2">
                                <div className="form-group">
                                    <label htmlFor="userName" className="form-label">Nombre Completo:</label>
                                    <input type="text" id="userName" name="name" value={currentUserFormData.name || ''} onChange={handleInputChange} className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="userEmail" className="form-label">Email:</label>
                                    <input type="email" id="userEmail" name="email" value={currentUserFormData.email || ''} onChange={handleInputChange} className="form-input" required />
                                </div>
                            </div>
                            <div className="form-grid form-grid-cols-2">
                                <div className="form-group">
                                    <label htmlFor="userRole" className="form-label">Rol:</label>
                                    <select id="userRole" name="role" value={currentUserFormData.role || 'Residente'} onChange={handleInputChange} className="form-select">
                                        <option value="Residente">Residente</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Guardia">Guardia</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="userUnit" className="form-label">Unidad (Ej: A-101):</label>
                                    <input type="text" id="userUnit" name="unit" value={currentUserFormData.unit || ''} onChange={handleInputChange} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="userPhone" className="form-label">Teléfono:</label>
                                <input type="tel" id="userPhone" name="phone" value={currentUserFormData.phone || ''} onChange={handleInputChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="userStatus" className="form-label">Estado:</label>
                                <select id="userStatus" name="isActive" value={currentUserFormData.isActive ? 'true' : 'false'} onChange={handleInputChange} className="form-select">
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleGenerateWelcomeEmail} className="btn btn-success" disabled={!lastAddedUserForEmail || isEditingUser}>
                                    <i className="fas fa-envelope-open-text"></i>✨ Generar Email
                                </button>
                                <div className="modal-footer-actions">
                                    <button type="button" onClick={closeUserModal} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {isEditingUser ? 'Guardar Cambios' : 'Guardar Usuario'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div className="modal-overlay active">
                    <div className="modal-content modal-content-lg">
                         {isLoadingEmail && (
                            <div className="loading-spinner-overlay">
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                        <div className="modal-header">
                            <h2 className="modal-title">Borrador de Email de Bienvenida</h2>
                            <button onClick={closeEmailModal} className="modal-close-btn">&times;</button>
                        </div>
                        <div id="emailContentArea">
                            <p>Asunto: <span id="emailSubject" className="font-semibold">{emailSubject}</span></p>
                            <textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="form-textarea" rows={10} placeholder="El cuerpo del email aparecerá aquí..."></textarea>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
                            <div className="modal-footer-actions">
                                <button type="button" onClick={handleCopyEmail} className="btn btn-secondary" disabled={isLoadingEmail}>
                                    <i className="fas fa-copy"></i>Copiar al Portapapeles
                                </button>
                                <button type="button" onClick={handleGenerateWelcomeEmail} className="btn btn-primary" disabled={isLoadingEmail}>
                                    <i className="fas fa-sync-alt"></i>✨ Regenerar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Message */}
            {toastMessage && (
                <div className={`toast-message ${toastMessage.type === 'error' ? 'bg-error' : 'bg-success'} show`}>
                    {toastMessage.message}
                </div>
            )}
        </div>
    );
};

export default UserManagement;

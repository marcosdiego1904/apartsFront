import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { MaintenanceRequest } from '../../types/maintenance';
import { fetchRequestById, updateRequestAPI } from '../../data/maintenanceMockData'; // Importar desde el archivo centralizado

// // Mover sampleRequests aquí para que sea accesible por ambas funciones - YA NO ES NECESARIO, SE IMPORTA
// const sampleRequests: MaintenanceRequest[] = [ ... ]; // ELIMINADO

// // Simulación de la función para obtener una solicitud por ID - YA NO ES NECESARIO, SE IMPORTA
// const fetchRequestById = async (id: string): Promise<MaintenanceRequest | undefined> => { ... }; // ELIMINADO

// // Simulación de la función para actualizar una solicitud - YA NO ES NECESARIO, SE IMPORTA
// const updateRequestAPI = async (id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> => { ... }; // ELIMINADO

// Componente para mostrar estrellas de calificación (simple)
const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => {
  const totalStars = 5;
  return (
    <div style={{ display: 'flex' }}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span 
            key={starValue} 
            style={{ 
              color: starValue <= rating ? '#ffc107' : '#e0e0e0', // Amarillo para llenas, gris para vacías
              fontSize: '24px',
              marginRight: '2px'
            }}
          >
            ★
          </span>
        );
      })}
       <span style={{ marginLeft: '8px', fontSize: '1em', color: '#555' }}>({rating}/{totalStars})</span>
    </div>
  );
};

const ManagerMaintenanceRequestDetail: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los campos editables por el manager
  const [currentUrgency, setCurrentUrgency] = useState<MaintenanceRequest['urgency']>('Low');
  const [assignedSpecialist, setAssignedSpecialist] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<MaintenanceRequest['status']>('New');
  const [scheduledDate, setScheduledDate] = useState<string>(''); // Para el input datetime-local
  const [managerNotesInput, setManagerNotesInput] = useState(''); // Nuevo estado para notas del manager
  const [newlyUploadedPhotos, setNewlyUploadedPhotos] = useState<string[]>([]); // Para previsualizar nuevas fotos (base64)
  const [photoFilesToUpload, setPhotoFilesToUpload] = useState<File[]>([]); // Para los archivos reales a "subir"

  useEffect(() => {
    if (requestId) {
      setLoading(true);
      fetchRequestById(requestId)
        .then(data => {
          if (data) {
            setRequest(data);
            // Inicializar los campos editables con los valores actuales de la solicitud
            setCurrentUrgency(data.urgency);
            setAssignedSpecialist(data.assignedSpecialist || '');
            setInternalNotes(data.internalNotes || '');
            setCurrentStatus(data.status);
            setManagerNotesInput(data.managerNotes || ''); // Inicializar notas del manager
            // Formatear la fecha para el input datetime-local si existe
            if (data.scheduledDate) {
              // El input datetime-local espera 'AAAA-MM-DDTHH:mm'
              const date = new Date(data.scheduledDate);
              // Ajustar por la zona horaria local para la visualización correcta en el input
              const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
              setScheduledDate(localIsoString);
            }
          } else {
            setError('Solicitud no encontrada.');
          }
        })
        .catch(() => setError('Error al cargar la solicitud.'))
        .finally(() => setLoading(false));
    }
  }, [requestId]);

  const handlePhotoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setPhotoFilesToUpload(prev => [...prev, ...filesArray]); // Acumular archivos para subir

      // Previsualización (simulada con Data URL)
      const currentPreviews: string[] = [];
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          currentPreviews.push(reader.result as string);
          if (currentPreviews.length === filesArray.length) {
            setNewlyUploadedPhotos(prev => [...prev, ...currentPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!request || !requestId || !currentUrgency || !currentStatus) {
        setError("Por favor, asegúrese de que la urgencia y el estado estén seleccionados.");
        return;
    }

    // Simulación de subida de fotos: En una app real, subir photoFilesToUpload al servidor
    // y obtener las URLs. Aquí, solo usaremos las previsualizaciones base64 como si fueran URLs.
    const uploadedPhotoUrls = newlyUploadedPhotos; // En un caso real, serían URLs del servidor

    const updates: Partial<MaintenanceRequest> = {
      urgency: currentUrgency,
      assignedSpecialist,
      internalNotes,
      status: currentStatus,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      managerNotes: managerNotesInput,
      // Solo enviar las *nuevas* fotos. La API simulada las mezclará.
      completedPhotos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
    };

    // Si se establece una fecha de programación y el estado es New o In Progress, sugerir cambiar a "Scheduled"
    if (scheduledDate && (currentStatus === 'New' || currentStatus === 'In Progress')) {
        // Opcional: preguntar al usuario o cambiarlo automáticamente
        // setCurrentStatus('Scheduled'); 
        // updates.status = 'Scheduled'; // Asegurarse de que el estado se actualice si se cambia aquí
        // Por ahora, dejaremos que el manager lo cambie manualmente si lo desea, 
        // ya que 'Scheduled' está disponible en el dropdown.
    }

    setLoading(true);
    setError(null);
    try {
      const updatedRequest = await updateRequestAPI(requestId, updates);
      if (updatedRequest) {
        setRequest(updatedRequest); // Actualizar el estado local con la respuesta simulada
         // Re-formatear la fecha para el input por si la API devolviera un formato distinto
        if (updatedRequest.scheduledDate) {
            const date = new Date(updatedRequest.scheduledDate);
            const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setScheduledDate(localIsoString);
        }
        setManagerNotesInput(updatedRequest.managerNotes || '');
        // Limpiar las previsualizaciones y archivos después de "subir"
        setNewlyUploadedPhotos([]);
        setPhotoFilesToUpload([]);
        alert('Solicitud actualizada con éxito!');
      } else {
        setError('Error al actualizar la solicitud.');
      }
    } catch (err) {
      setError('Error de conexión al actualizar.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <p style={{ color: '#343a40' }}>Cargando detalles de la solicitud...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!request) return <p style={{ color: '#343a40' }}>No se encontró la solicitud.</p>;

  const labelStyle: React.CSSProperties = { fontWeight: 'bold', color: '#212529', marginBottom: '5px', display: 'block' };
  const valueStyle: React.CSSProperties = { color: '#343a40', marginBottom: '10px', whiteSpace: 'pre-wrap' };
  const sectionTitleStyle: React.CSSProperties = { color: '#1a202c', marginTop: '20px', marginBottom: '15px' };
  const inputStyle: React.CSSProperties = { marginLeft: '0px', padding: '8px', width: '100%', borderColor: '#ced4da', color: '#343a40', marginTop: '5px', borderRadius: '4px' };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const imageStyle: React.CSSProperties = { maxWidth: '120px', maxHeight: '120px', border: '1px solid #ccc', objectFit: 'cover', borderRadius: '4px' };
  const imageContainerStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' };

  // Determinar si se debe mostrar la sección de valoración
  const showRatingSection = request.status === 'Completed' || (request.status === 'Resolved/Pending Review' && (request.rating || request.feedback));

  return (
    <div style={{ padding: '20px', color: '#343a40' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>Volver al Dashboard</button>
      <h2 style={sectionTitleStyle}>Detalle de Solicitud: {request.id}</h2>
      
      {/* Contenedor principal para dos columnas */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Columna Izquierda: Detalles de la Solicitud y Valoración */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ marginBottom: '20px'}}>
            <p><strong style={labelStyle}>Inquilino:</strong> <span style={valueStyle}>{request.tenantName || 'N/A'}</span></p>
            <p><strong style={labelStyle}>Propiedad:</strong> <span style={valueStyle}>{request.propertyId}</span></p>
            <p><strong style={labelStyle}>Fecha de Creación:</strong> <span style={valueStyle}>{new Date(request.createdAt).toLocaleString()}</span></p>
            {request.scheduledDate && (
                 <p><strong style={labelStyle}>Fecha Programada:</strong> <span style={valueStyle}>{new Date(request.scheduledDate).toLocaleString()}</span></p>
            )}
            <p><strong style={labelStyle}>Urgencia Reportada:</strong> <span style={valueStyle}>{request.urgency}</span></p>
            <p><strong style={labelStyle}>Estado Actual:</strong> <span style={valueStyle}>{request.status}</span></p>
            <p><strong style={labelStyle}>Descripción del Inquilino:</strong> <span style={valueStyle}>{request.description}</span></p>
            {request.images && request.images.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={labelStyle}>Imágenes del Inquilino:</strong>
                <div style={imageContainerStyle}>
                  {request.images.map((img, index) => (
                    <img key={`tenant-img-${index}`} src={img} alt={`Inquilino ${index + 1}`} style={imageStyle} />
                  ))}
                </div>
              </div>
            )}
            {/* Mover estas notas informativas a la columna izquierda */}
            {request.assignedSpecialist && <p style={{marginTop: '10px'}}><strong style={labelStyle}>Especialista Asignado (Info):</strong> <span style={valueStyle}>{request.assignedSpecialist}</span></p>}
            {request.internalNotes && <p style={{marginTop: '10px'}}><strong style={labelStyle}>Notas Internas (Info):</strong> <span style={valueStyle}>{request.internalNotes}</span></p>}
          </div>

          {/* Mostrar sección de valoración del inquilino si aplica, debajo de los detalles */}
          {showRatingSection && (
            <>
              <hr style={{ margin: '20px 0' }} />
              <h3 style={{...sectionTitleStyle, marginTop: '0px'}}>Valoración del Inquilino</h3>
              <div style={{ marginBottom: '20px'}}>
                {request.rating !== undefined && request.rating !== null ? (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={labelStyle}>Calificación:</strong>
                    <StarRatingDisplay rating={request.rating} />
                  </div>
                ) : (
                  <p style={valueStyle}>El inquilino aún no ha calificado este trabajo.</p>
                )}
                {request.feedback ? (
                  <div>
                    <strong style={labelStyle}>Comentarios del Inquilino:</strong>
                    <p style={{...valueStyle, fontStyle: 'italic', background: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>{request.feedback}</p>
                  </div>
                ) : (
                  <p style={valueStyle}>El inquilino no ha dejado comentarios adicionales.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Columna Derecha: Evaluar, Programar y Registrar Trabajo */}
        <div style={{ flex: 1.5, minWidth: '350px' }}> {/* Darle un poco más de espacio a la columna de formularios */}
          <h3 style={{...sectionTitleStyle, marginTop: '0px'}}>Evaluar, Programar y Registrar Trabajo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* --- Fila 1: Urgencia y Estado --- */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="urgency" style={labelStyle}>Confirmar/Ajustar Urgencia:</label>
                <select id="urgency" value={currentUrgency} onChange={(e) => setCurrentUrgency(e.target.value as MaintenanceRequest['urgency'])} style={selectStyle}>
                  <option value="Low">Baja</option> <option value="Medium">Media</option> <option value="High">Alta</option> <option value="Urgent">Urgente</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="status" style={labelStyle}>Actualizar Estado:</label>
                <select id="status" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value as MaintenanceRequest['status'])} style={selectStyle}>
                  <option value="New">Nueva (Recibida)</option> <option value="In Progress">En Progreso</option> <option value="Scheduled">Programada</option>
                  <option value="Resolved/Pending Review">Resuelta/Pendiente Valoración</option> <option value="Completed">Completada</option>  <option value="Cancelled">Cancelada</option>
                  {![ 'New', 'In Progress', 'Scheduled', 'Resolved/Pending Review', 'Completed', 'Cancelled'].includes(request.status) && (
                      <option value={request.status} disabled>{request.status} (Actual)</option>
                  )}
                </select>
              </div>
            </div>

            {/* --- Fila 2: Fecha Programada y Especialista --- */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="scheduledDate" style={labelStyle}>Programar Reparación (Fecha y Hora):</label>
                <input type="datetime-local" id="scheduledDate" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={inputStyle}/>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="specialist" style={labelStyle}>Asignar Especialista (Editable):</label>
                <input type="text" id="specialist" value={assignedSpecialist} onChange={(e) => setAssignedSpecialist(e.target.value)} placeholder="Ej: Juan Pérez, Fontanería" style={inputStyle}/>
              </div>
            </div>

            {/* --- Campos restantes (Notas, Fotos) apilados --- */}
            <div>
              <label htmlFor="internalNotes" style={labelStyle}>Añadir/Editar Notas Internas (Editable):</label>
              <textarea id="internalNotes" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Instrucciones, materiales, etc." rows={3} style={inputStyle}/>
            </div>

            <hr style={{ margin: '5px 0'}} /> {/* Reducir margen del hr */}
            <div>
              <label htmlFor="managerNotes" style={labelStyle}>Registrar Trabajo Realizado (Notas del Manager):</label>
              <textarea 
                id="managerNotes"
                value={managerNotesInput}
                onChange={(e) => setManagerNotesInput(e.target.value)}
                placeholder="Descripción de lo que se hizo, materiales utilizados, tiempo empleado, etc."
                rows={4}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="completedPhotos" style={labelStyle}>Subir Fotos del Trabajo Completado:</label>
              <input 
                type="file" 
                id="completedPhotos"
                multiple 
                accept="image/*" 
                onChange={handlePhotoInputChange}
                style={inputStyle}
              />
              {newlyUploadedPhotos.length > 0 && (
                <div style={{...imageContainerStyle, marginTop: '15px'}}>
                  <p style={{width: '100%', fontSize: '0.9em', color: '#555'}}>Nuevas fotos a subir (previsualización):</p>
                  {newlyUploadedPhotos.map((photoSrc, index) => (
                    <img key={`preview-${index}`} src={photoSrc} alt={`Previsualización ${index + 1}`} style={imageStyle} />
                  ))}
                </div>
              )}
            </div>

            {request.completedPhotos && request.completedPhotos.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                    <strong style={labelStyle}>Fotos del Trabajo Completado Existentes:</strong>
                    <div style={imageContainerStyle}>
                    {request.completedPhotos.map((img, index) => (
                        <img key={`completed-img-${index}`} src={img} alt={`Trabajo completado ${index + 1}`} style={imageStyle} />
                    ))}
                    </div>
                </div>
            )}

            <button onClick={handleSaveChanges} disabled={loading} style={{ padding: '12px 20px', marginTop: '10px', fontSize: '16px' }}>
              {loading ? 'Guardando...' : 'Guardar Cambios y Registrar Trabajo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerMaintenanceRequestDetail; 
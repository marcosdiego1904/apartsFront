import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { MaintenanceRequest } from '../../types/maintenance';
// import { fetchRequestById, updateRequestAPI } from '../../data/maintenanceMockData'; // No longer used directly for fetching/saving main data

const SHARED_LOCAL_STORAGE_KEY = 'allMaintenanceRequests';

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

  const [currentUrgency, setCurrentUrgency] = useState<MaintenanceRequest['urgency']>('Low');
  const [assignedSpecialist, setAssignedSpecialist] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  // Initialize with a valid status from the enum
  const [currentStatus, setCurrentStatus] = useState<MaintenanceRequest['status']>('Received'); 
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [managerNotesInput, setManagerNotesInput] = useState('');
  const [newlyUploadedPhotos, setNewlyUploadedPhotos] = useState<string[]>([]);
  const [photoFilesToUpload, setPhotoFilesToUpload] = useState<File[]>([]); 

  useEffect(() => {
    if (requestId) {
      setLoading(true);
      try {
        const storedRequestsJSON = localStorage.getItem(SHARED_LOCAL_STORAGE_KEY);
        if (storedRequestsJSON) {
          const allRequests = JSON.parse(storedRequestsJSON) as MaintenanceRequest[];
          const foundRequest = allRequests.find(r => r.id === requestId);
          if (foundRequest) {
            setRequest(foundRequest);
            setCurrentUrgency(foundRequest.urgency);
            setAssignedSpecialist(foundRequest.assignedSpecialist || '');
            setInternalNotes(foundRequest.internalNotes || '');
            setCurrentStatus(foundRequest.status);
            setManagerNotesInput(foundRequest.managerNotes || '');
            if (foundRequest.scheduledDate) {
              const date = new Date(foundRequest.scheduledDate);
              const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
              setScheduledDate(localIsoString);
            }
          } else {
            setError('Solicitud no encontrada en localStorage.');
          }
        } else {
          setError('No hay solicitudes en localStorage.');
        }
      } catch (e) {
        console.error("Error reading/parsing localStorage:", e);
        setError('Error al cargar la solicitud desde localStorage.');
      }
      setLoading(false);
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

    const uploadedPhotoUrls = newlyUploadedPhotos;

    const updatesToApply: Partial<MaintenanceRequest> = {
      urgency: currentUrgency,
      assignedSpecialist: assignedSpecialist || undefined,
      internalNotes: internalNotes || undefined,
      status: currentStatus,
      scheduledDate: scheduledDate || undefined, // Directly use the string state, ensure it's undefined if empty
      managerNotes: managerNotesInput || undefined,
      completedPhotos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
      updatedAt: new Date().toISOString(), // Add/update the updatedAt timestamp
    };

    // Logic for suggesting 'Scheduled' status can remain as comments or be implemented if desired
    // if (scheduledDate && (currentStatus === 'Sent' || currentStatus === 'Received' || currentStatus === 'In Progress')) {
    // }

    setLoading(true);
    setError(null);
    try {
      const storedRequestsJSON = localStorage.getItem(SHARED_LOCAL_STORAGE_KEY);
      let allRequests: MaintenanceRequest[] = [];
      if (storedRequestsJSON) {
        allRequests = JSON.parse(storedRequestsJSON) as MaintenanceRequest[];
      }

      const requestIndex = allRequests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        const updatedRequest: MaintenanceRequest = {
          ...allRequests[requestIndex],
          ...updatesToApply,
        };
        allRequests[requestIndex] = updatedRequest;
        localStorage.setItem(SHARED_LOCAL_STORAGE_KEY, JSON.stringify(allRequests));
        setRequest(updatedRequest);

        if (updatedRequest.scheduledDate) {
            const date = new Date(updatedRequest.scheduledDate);
            const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setScheduledDate(localIsoString);
        }
        setManagerNotesInput(updatedRequest.managerNotes || '');
        setNewlyUploadedPhotos([]);
        setPhotoFilesToUpload([]);
        alert('Solicitud actualizada con éxito en localStorage!');
      } else {
        setError('No se pudo encontrar la solicitud para actualizar en localStorage.');
      }
    } catch (err) {
      console.error("Error updating localStorage:", err);
      setError('Error de conexión al actualizar (localStorage).');
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
  // Use feedbackRating and feedbackComments as per the new type
  const showRatingSection = request && (request.status === 'Completed' || 
    (request.status === 'Resolved/Pending Review' && (request.feedbackRating !== undefined || request.feedbackComments !== undefined)));

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
                {request.feedbackRating !== undefined && request.feedbackRating !== null ? (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={labelStyle}>Calificación:</strong>
                    <StarRatingDisplay rating={request.feedbackRating} />
                  </div>
                ) : (
                  <p style={valueStyle}>El inquilino aún no ha calificado este trabajo.</p>
                )}
                {request.feedbackComments ? (
                  <div>
                    <strong style={labelStyle}>Comentarios del Inquilino:</strong>
                    <p style={{...valueStyle, fontStyle: 'italic', background: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>{request.feedbackComments}</p>
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
                  {/* Ensure these options match MaintenanceRequest['status'] type */}
                  <option value="Sent">Enviada (Sent)</option>
                  <option value="Received">Recibida (Received)</option>
                  <option value="In Progress">En Progreso (In Progress)</option>
                  <option value="Scheduled">Programada (Scheduled)</option>
                  <option value="Resolved/Pending Review">Resuelta/Pendiente Revisión</option>
                  <option value="Completed">Completada (Completed)</option>
                  <option value="Cancelled">Cancelada (Cancelled)</option>
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
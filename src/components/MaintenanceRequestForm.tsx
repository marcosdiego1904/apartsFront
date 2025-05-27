import React, { useState } from 'react';
import '../styles/MaintenanceRequestForm.css'; // Crearemos este archivo de estilos más adelante

interface MaintenanceRequestFormData {
  description: string;
  category: string;
  specificLocation: string;
  urgency: 'Baja' | 'Media' | 'Alta/Emergencia';
  permissionToEnter: boolean;
  preferredEntryTime: string;
}

interface MaintenanceRequestFormProps {
  onSubmit: (formData: MaintenanceRequestFormData) => void;
}

const MaintenanceRequestForm: React.FC<MaintenanceRequestFormProps> = ({ onSubmit }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [urgency, setUrgency] = useState<'Baja' | 'Media' | 'Alta/Emergencia'>('Baja');
  const [permissionToEnter, setPermissionToEnter] = useState(false);
  const [preferredEntryTime, setPreferredEntryTime] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData: MaintenanceRequestFormData = {
      description,
      category,
      specificLocation,
      urgency,
      permissionToEnter,
      preferredEntryTime: permissionToEnter ? preferredEntryTime : ''
    };
    console.log('Formulario de Mantenimiento Enviado desde el Form:', formData);
    onSubmit(formData);
    
    // Resetear formulario después de enviar (opcional, pero buena práctica)
    setDescription('');
    setCategory('');
    setSpecificLocation('');
    setUrgency('Baja');
    setPermissionToEnter(false);
    setPreferredEntryTime('');
  };

  // Categorías de ejemplo, puedes ajustarlas según necesites
  const problemCategories = [
    'Plomería',
    'Electricidad',
    'Electrodomésticos',
    'Cerrajería',
    'Pintura',
    'Aire Acondicionado/Calefacción',
    'Otro'
  ];

  return (
    <form onSubmit={handleSubmit} className="maintenance-form">
      <div className="form-group">
        <label htmlFor="description">Descripción del Problema <span className="required-asterisk">*</span></label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Describa detalladamente el problema..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Categoría del Problema <span className="required-asterisk">*</span></label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>Seleccione una categoría</option>
            {problemCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="specificLocation">Ubicación Específica <span className="required-asterisk">*</span></label>
          <input
            type="text"
            id="specificLocation"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
            required
            placeholder="Ej: Baño principal, cocina"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="urgency">Nivel de Urgencia <span className="required-asterisk">*</span></label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as 'Baja' | 'Media' | 'Alta/Emergencia')}
          required
        >
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta/Emergencia">Alta/Emergencia</option>
        </select>
      </div>
      
      <div className="form-group permission-group">
        <label htmlFor="permissionToEnter" className="checkbox-label">
          <input
            type="checkbox"
            id="permissionToEnter"
            checked={permissionToEnter}
            onChange={(e) => setPermissionToEnter(e.target.checked)}
          />
          <span className="checkbox-label-text">Permiso para entrar a la unidad para la reparación</span>
        </label>
      </div>

      {permissionToEnter && (
        <div className="form-group">
          <label htmlFor="preferredEntryTime">Franja Horaria Preferida para Entrada</label>
          <input
            type="text"
            id="preferredEntryTime"
            value={preferredEntryTime}
            onChange={(e) => setPreferredEntryTime(e.target.value)}
            placeholder="Ej: Lunes de 9am a 12pm"
          />
          <small>Por favor, indique una o varias franjas horarias convenientes.</small>
        </div>
      )}

      {/* Aquí iría la lógica para subir archivos (Paso futuro) */}
      {/* 
      <div className="form-group">
        <label htmlFor="attachments">Subir Fotos/Videos (Opcional)</label>
        <input type="file" id="attachments" multiple />
      </div>
      */}

      <button type="submit" className="action-btn">
        Enviar Solicitud
      </button>
    </form>
  );
};

export default MaintenanceRequestForm; 
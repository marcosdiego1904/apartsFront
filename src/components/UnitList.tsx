// src/components/EnhancedUnitList.tsx
import React, { useEffect, useState } from 'react';
import { getAllUnits, createNewUnit, updateExistingUnit } from '../services/api'; 
import type { Unit, CreateUnitPayload } from '../services/api';
import './style1.css';

// Iconos SVG componentes
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
  </svg>
);

const FloorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v4h14V2a1 1 0 0 0-1-1H2zm13 6H1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
  </svg>
);

const SquareFootageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.185.156.45.01.644L8.4 15.3a.5.5 0 0 1-.8 0L.1 5.3a.5.5 0 0 1 0-.6l3-4zm11.386 3.785-1.806-2.41-.776 2.413 2.582-.003zm-3.633.004.961-2.989H4.186l.963 2.995 5.704-.006zM5.47 5.495 8 13.366l2.532-7.876-5.062.005zm-1.371-.999-.78-2.422-1.818 2.425 2.598-.003zM1.499 5.5l5.113 6.817-2.192-6.82L1.5 5.5zm7.889 6.817 5.123-6.83-2.928.002-2.195 6.828z"/>
  </svg>
);

const BedroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h10V1z"/>
    <path d="M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/>
  </svg>
);

const BathroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5zm-7 4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5zm9 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5z"/>
    <path d="M4 2v.945M3 3h3v1H3V3zm4 0h3v1H7V3z"/>
    <path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5v1.672a1.5 1.5 0 0 1-.41 1.022L12 11.743V15.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.578l-.243.154a.5.5 0 0 1-.546-.011l-1.7-1.133-.295.196a.5.5 0 0 1-.555-.012l-1.131-.713-.525.35a.5.5 0 0 1-.546-.01l-.217-.136A2.498 2.498 0 0 1 3 11V9.972l-1.59-2.048A1.5 1.5 0 0 1 0 6.172V4.5zm1.5-1a.5.5 0 0 0-.5.5v1.672c0 .165.07.323.194.448l2.38 3.056c.094.121.23.197.387.216l.49.074c.126.019.256-.008.369-.077l.419-.254c.2-.12.443-.13.657-.032l.42.19c.248.112.526.12.776.021l.698-.264c.229-.087.47-.077.689.03l.463.225a.718.718 0 0 0 .67-.002l.37-.187c.22-.112.466-.113.688-.004l.585.288a.668.668 0 0 0 .585.01l.752-.356a.72.72 0 0 0 .383-.38l1.754-4.208A.5.5 0 0 0 14.5 3h-13z"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
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

const EnhancedUnitList: React.FC = () => {
    // Main units state
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    
    // Form state
    const [formData, setFormData] = useState<CreateUnitPayload>({
        unit_number: '',
        building: '',
        floor: undefined,
        square_footage: '',
        number_of_bedrooms: undefined,
        number_of_bathrooms: '',
        is_occupied: false
    });
    
    // Toast notification state
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error', visible: boolean}>({
        message: '',
        type: 'success',
        visible: false
    });

    // Fetch all units on component mount
    useEffect(() => {
        fetchUnits();
    }, []);

    // Fetch units function
    const fetchUnits = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllUnits();
            setUnits(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while loading units.');
            console.error("Error fetching units:", err);
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
        } else if (name === 'floor' || name === 'number_of_bedrooms') {
            // Convert to number or undefined
            setFormData({
                ...formData,
                [name]: value ? parseInt(value, 10) : undefined
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    // Open Add Unit Modal
    const openAddModal = () => {
        // Reset form data
        setFormData({
            unit_number: '',
            building: '',
            floor: undefined,
            square_footage: '',
            number_of_bedrooms: undefined,
            number_of_bathrooms: '',
            is_occupied: false
        });
        setIsAddModalOpen(true);
    };
    
    // Open Edit Unit Modal
    const openEditModal = (unit: Unit) => {
        setSelectedUnit(unit);
        // Populate form with unit data
        setFormData({
            unit_number: unit.unit_number,
            building: unit.building || '',
            // Convert null to undefined for TypeScript compatibility
            floor: unit.floor !== null ? unit.floor : undefined,
            square_footage: unit.square_footage?.toString() || '',
            // Convert null to undefined for TypeScript compatibility
            number_of_bedrooms: unit.number_of_bedrooms !== null ? unit.number_of_bedrooms : undefined,
            number_of_bathrooms: unit.number_of_bathrooms?.toString() || '',
            is_occupied: unit.is_occupied || false
        });
        setIsEditModalOpen(true);
    };

    // Close all modals
    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedUnit(null);
    };

    // Submit handler for adding a new unit
    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.unit_number.trim()) {
            showToast('Unit number is required', 'error');
            return;
        }

        try {
            setLoading(true);
            const newUnit = await createNewUnit(formData);
            setUnits(prevUnits => [...prevUnits, newUnit]);
            closeModals();
            showToast('Unit added successfully!', 'success');
        } catch (err) {
            console.error("Error adding unit:", err);
            showToast(err instanceof Error ? err.message : 'Failed to add unit', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Submit handler for editing a unit
    const handleEditUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) return;
        
        if (!formData.unit_number.trim()) {
            showToast('Unit number is required', 'error');
            return;
        }
        
        try {
            setLoading(true);
            
            // Need to add updateExistingUnit to API service
            const updatedUnit = await updateExistingUnit(selectedUnit.id, formData);
            
            // Update units array with the edited unit
            setUnits(prevUnits => 
                prevUnits.map(unit => 
                    unit.id === updatedUnit.id ? updatedUnit : unit
                )
            );
            
            closeModals();
            showToast('Unit updated successfully!', 'success');
        } catch (err) {
            console.error("Error updating unit:", err);
            showToast(err instanceof Error ? err.message : 'Failed to update unit', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Toggle unit occupied status
    const toggleUnitStatus = async (unit: Unit) => {
        try {
            setLoading(true);
            const updatedUnit = await updateExistingUnit(unit.id, {
                is_occupied: !unit.is_occupied
            });
            
            // Update units array with the updated unit
            setUnits(prevUnits => 
                prevUnits.map(u => 
                    u.id === updatedUnit.id ? updatedUnit : u
                )
            );
            
            showToast(`Unit marked as ${updatedUnit.is_occupied ? 'occupied' : 'vacant'} successfully!`, 'success');
        } catch (err) {
            console.error("Error toggling unit status:", err);
            showToast(err instanceof Error ? err.message : 'Failed to update unit status', 'error');
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

    if (loading && units.length === 0) {
        return <p>Loading units...</p>;
    }

    if (error && units.length === 0) {
        return <p>Error loading units: {error}</p>;
    }

    return (
        <div className="condo-panel-content-area">
            {/* Page Header */}
            <div className="section-header">
                <h1><BuildingIcon /> Unit Management</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <PlusIcon /> Add New Unit
                </button>
            </div>

            {/* Units Table */}
            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Unit Number</th>
                            <th><BuildingIcon /> Building</th>
                            <th><FloorIcon /> Floor</th>
                            <th><SquareFootageIcon /> Size (sq.ft)</th>
                            <th><BedroomIcon /> Bedrooms</th>
                            <th><BathroomIcon /> Bathrooms</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.map(unit => (
                            <tr key={unit.id}>
                                <td>{unit.id}</td>
                                <td>{unit.unit_number}</td>
                                <td>{unit.building || '-'}</td>
                                <td>{unit.floor || '-'}</td>
                                <td>{unit.square_footage || '-'}</td>
                                <td>{unit.number_of_bedrooms || '-'}</td>
                                <td>{unit.number_of_bathrooms || '-'}</td>
                                <td className="text-center">
                                    <span 
                                        className={`status-badge ${unit.is_occupied ? 'status-inactive' : 'status-active'}`}
                                        onClick={() => toggleUnitStatus(unit)}
                                        title="Click to toggle status"
                                    >
                                        {unit.is_occupied ? (
                                            <><CheckCircleIcon /> Occupied</>
                                        ) : (
                                            <><CloseIcon /> Vacant</>
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => openEditModal(unit)}
                                        title="Edit unit"
                                    >
                                        <EditIcon /> Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Unit Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay active">
                    <div className="modal-content" style={{ maxWidth: '750px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title"><BuildingIcon /> Add New Unit</h3>
                            <button className="modal-close-btn" onClick={closeModals}>&times;</button>
                        </div>
                        <form onSubmit={handleAddUnit}>
                            <div style={{ padding: '1.5rem' }}>
                                <div className="form-grid form-grid-cols-2">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="unit_number">
                                            <BuildingIcon /> Unit Number*
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            id="unit_number"
                                            name="unit_number"
                                            value={formData.unit_number}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="building">
                                            <BuildingIcon /> Building
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            id="building"
                                            name="building"
                                            value={formData.building}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="floor">
                                            <FloorIcon /> Floor
                                        </label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            id="floor"
                                            name="floor"
                                            value={formData.floor || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="square_footage">
                                            <SquareFootageIcon /> Square Footage
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            id="square_footage"
                                            name="square_footage"
                                            value={formData.square_footage}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="number_of_bedrooms">
                                            <BedroomIcon /> Number of Bedrooms
                                        </label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            id="number_of_bedrooms"
                                            name="number_of_bedrooms"
                                            min="0"
                                            value={formData.number_of_bedrooms || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="number_of_bathrooms">
                                            <BathroomIcon /> Number of Bathrooms
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            id="number_of_bathrooms"
                                            name="number_of_bathrooms"
                                            value={formData.number_of_bathrooms}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                                        <input
                                            id="add_is_occupied"
                                            type="checkbox"
                                            name="is_occupied"
                                            checked={formData.is_occupied}
                                            onChange={handleInputChange}
                                            style={{width: '16px', height: '16px'}}
                                        />
                                        <label htmlFor="add_is_occupied" style={{ marginLeft: '8px', display:'flex', alignItems:'center', cursor: 'pointer', fontWeight: 'normal' }}>
                                            <CheckCircleIcon />
                                            <span style={{ marginLeft: '4px' }}>Occupied</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    <PlusIcon /> Add Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Unit Modal */}
            {isEditModalOpen && selectedUnit && (
                <div className="modal-overlay active">
                    <div className="modal-content" style={{ maxWidth: '750px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title"><EditIcon /> Edit Unit</h3>
                            <button className="modal-close-btn" onClick={closeModals}>&times;</button>
                        </div>
                        <form onSubmit={handleEditUnit}>
                          <div style={{ padding: '1.5rem' }}>
                            <div className="form-grid form-grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_unit_number">
                                        <BuildingIcon /> Unit Number*
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        id="edit_unit_number"
                                        name="unit_number"
                                        value={formData.unit_number}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_building">
                                        <BuildingIcon /> Building
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        id="edit_building"
                                        name="building"
                                        value={formData.building}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_floor">
                                        <FloorIcon /> Floor
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        id="edit_floor"
                                        name="floor"
                                        value={formData.floor || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_square_footage">
                                        <SquareFootageIcon /> Square Footage
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        id="edit_square_footage"
                                        name="square_footage"
                                        value={formData.square_footage}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_number_of_bedrooms">
                                        <BedroomIcon /> Number of Bedrooms
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        id="edit_number_of_bedrooms"
                                        name="number_of_bedrooms"
                                        min="0"
                                        value={formData.number_of_bedrooms || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="edit_number_of_bathrooms">
                                        <BathroomIcon /> Number of Bathrooms
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        id="edit_number_of_bathrooms"
                                        name="number_of_bathrooms"
                                        value={formData.number_of_bathrooms}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        id="edit_is_occupied"
                                        type="checkbox"
                                        name="is_occupied"
                                        checked={formData.is_occupied}
                                        onChange={handleInputChange}
                                        style={{width: '16px', height: '16px'}}
                                    />
                                    <label htmlFor="edit_is_occupied" style={{ marginLeft: '8px', display:'flex', alignItems:'center', cursor: 'pointer', fontWeight: 'normal' }}>
                                        <CheckCircleIcon />
                                        <span style={{ marginLeft: '4px' }}>Occupied</span>
                                    </label>
                                </div>
                            </div>
                          </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                                <button type="submit" className="btn btn-success">
                                    <EditIcon /> Update Unit
                                </button>
                            </div>
                        </form>
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

export default EnhancedUnitList;
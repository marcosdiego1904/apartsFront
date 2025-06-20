// src/components/UnitList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllUnits, createNewUnit, updateExistingUnit, deleteUnitById, getAllUsers } from '../services/api';
import type { Unit, CreateUnitPayload, User } from '../services/api';
import { FiHome, FiPlus, FiEdit, FiTrash2, FiGrid, FiMaximize, FiUsers, FiPackage } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import '../styles/globalStyles.css';
import './UnitList.css';


interface FormErrors {
  unit_number?: string;
}

const UnitList: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
    
    const initialFormData: CreateUnitPayload = {
        unit_number: '',
        building: '',
        floor: 0,
        square_footage: '',
        number_of_bedrooms: 1,
        number_of_bathrooms: '',
        is_occupied: false,
        tenant_id: null,
    };
    const [formData, setFormData] = useState<CreateUnitPayload>(initialFormData);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [unitsData, usersData] = await Promise.all([getAllUnits(), getAllUsers()]);
            const sortedUnits = unitsData.sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }));
            setUnits(sortedUnits);
            setUsers(usersData.filter(u => u.role === 'tenant'));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateForm = (data: CreateUnitPayload): FormErrors => {
        const errors: FormErrors = {};
        if (!data.unit_number.trim()) {
            errors.unit_number = 'Unit number is required.';
        }
        return errors;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (['floor', 'number_of_bedrooms'].includes(name)) {
            const numValue = value ? parseInt(value, 10) : 0;
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else if (name === 'tenant_id') {
            setFormData(prev => ({ ...prev, [name]: value === "null" ? null : value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    const resetFormData = () => {
        setFormData(initialFormData);
        setFormErrors({});
    };
    
    const openModal = (unit: Unit | null = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                unit_number: unit.unit_number,
                building: unit.building || '',
                floor: unit.floor || 0,
                square_footage: unit.square_footage || '',
                number_of_bedrooms: unit.number_of_bedrooms || 1,
                number_of_bathrooms: unit.number_of_bathrooms || '',
                is_occupied: unit.is_occupied || false,
                tenant_id: unit.tenant_id || null,
            });
        } else {
            resetFormData();
            setEditingUnit(null);
        }
        setIsModalOpen(true);
        setError(null);
    };

    const openDeleteConfirmModal = (unit: Unit) => {
        setEditingUnit(unit);
        setIsDeleteConfirmOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
        setIsDeleteConfirmOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            const errorMsg = "Please fix the errors in the form.";
            showToast(errorMsg, 'error');
            return;
        }

        const payload: CreateUnitPayload = {
            ...formData,
            is_occupied: !!formData.tenant_id,
        };

        try {
            setLoading(true);
            if (editingUnit) {
                await updateExistingUnit(editingUnit.id, payload);
                showToast('Unit updated successfully!', 'success');
            } else {
                await createNewUnit(payload);
                showToast('Unit created successfully!', 'success');
            }
            await fetchData();
            closeModal();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnit = async () => {
        if (!editingUnit) return;
        try {
            setLoading(true);
            await deleteUnitById(editingUnit.id);
            showToast('Unit deleted successfully!', 'success');
            await fetchData();
            closeModal();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete unit.';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !units.length) return <LoadingSpinner />;
    
    return (
        <div className="manager-view-container">
            <div className={`toast-message ${toast.visible ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
                {toast.message}
            </div>

            <header className="manager-view-header">
                <h1><FiHome /> Unit Management</h1>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <FiPlus /> Add New Unit
                </button>
            </header>
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button onClick={() => setError(null)} className="btn-close">&times;</button>
                </div>
            )}

            <div className="table-responsive">
                <table className="manager-table">
                    <thead>
                        <tr>
                            <th>Unit No.</th>
                            <th>Building</th>
                            <th>Floor</th>
                            <th>Tenant</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.map(unit => {
                            const tenant = users.find(u => u.id === unit.tenant_id);
                            return (
                                <tr key={unit.id}>
                                    <td className="font-weight-bold">{unit.unit_number}</td>
                                    <td>{unit.building || '-'}</td>
                                    <td>{unit.floor ?? '-'}</td>
                                    <td>{tenant ? `${tenant.first_name} ${tenant.last_name}` : <span className="text-muted">Unassigned</span>}</td>
                                    <td>
                                        <span className={`status-badge ${unit.is_occupied ? 'status-occupied' : 'status-vacant'}`}>
                                            {unit.is_occupied ? 'Occupied' : 'Vacant'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => openModal(unit)} className="btn-icon" title="Edit Unit"><FiEdit /></button>
                                            <button onClick={() => openDeleteConfirmModal(unit)} className="btn-icon" title="Delete Unit"><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h2>
                            <button onClick={closeModal} className="modal-close-btn">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body" noValidate>
                            <div className="form-grid form-grid-cols-2">
                                <div className="form-group">
                                    <label htmlFor="unit_number"><FiHome/> Unit Number *</label>
                                    <input type="text" id="unit_number" name="unit_number" value={formData.unit_number} onChange={handleInputChange} required />
                                    {formErrors.unit_number && <small className="form-error-text">{formErrors.unit_number}</small>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="building"><FiPackage/> Building</label>
                                    <input type="text" id="building" name="building" value={formData.building || ''} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="floor"><FiGrid/> Floor</label>
                                    <input type="number" id="floor" name="floor" value={formData.floor?.toString() ?? ''} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="number_of_bedrooms"><FiUsers/> Bedrooms</label>
                                    <input type="number" id="number_of_bedrooms" name="number_of_bedrooms" value={formData.number_of_bedrooms?.toString() ?? ''} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="square_footage"><FiMaximize/> Square Footage</label>
                                    <input type="text" id="square_footage" name="square_footage" value={formData.square_footage || ''} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="number_of_bathrooms"><FiHome/> Bathrooms</label>
                                    <input type="text" id="number_of_bathrooms" name="number_of_bathrooms" value={formData.number_of_bathrooms || ''} onChange={handleInputChange} />
                                </div>
                                 <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="tenant_id"><FiUsers/> Assign Tenant</label>
                                    <select id="tenant_id" name="tenant_id" value={formData.tenant_id || 'null'} onChange={handleInputChange}>
                                        <option value="null">-- No Tenant --</option>
                                        {users.filter(u => !u.unit_id || u.unit_id === editingUnit?.id).map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingUnit ? 'Save Changes' : 'Create Unit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             {isDeleteConfirmOpen && editingUnit && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '400px'}}>
                        <div className="modal-header">
                            <h2>Confirm Deletion</h2>
                            <button onClick={closeModal} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete unit <strong>{editingUnit.unit_number}</strong>? This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleDeleteUnit} className="btn btn-danger">Delete Unit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default UnitList;
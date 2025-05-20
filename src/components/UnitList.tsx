// src/components/UnitList.tsx
import React, { useEffect, useState } from 'react';
import {  getAllUnits,  createNewUnit } from '../services/api'; 
import type { Unit } from '../services/api'; 
import type { CreateUnitPayload } from '../services/api';

const UnitList: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para el formulario de nueva unidad
    const [newUnitNumber, setNewUnitNumber] = useState('');
    const [newUnitBuilding, setNewUnitBuilding] = useState('');
    // Puedes añadir más estados para otros campos de la unidad

    // Efecto para cargar las unidades cuando el componente se monta
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getAllUnits();
                setUnits(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar unidades.');
                console.error("Error fetching units:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    // Manejador para crear una nueva unidad
    const handleCreateUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnitNumber.trim()) {
            alert('El número de unidad es requerido.');
            return;
        }

        const payload: CreateUnitPayload = {
            unit_number: newUnitNumber,
            building: newUnitBuilding.trim() || undefined, // Enviar undefined si está vacío para que el backend use NULL
            // Añade aquí otros campos del payload si los tienes en el formulario
        };

        try {
            const newUnit = await createNewUnit(payload);
            setUnits(prevUnits => [...prevUnits, newUnit]); // Añade la nueva unidad a la lista
            setNewUnitNumber(''); // Limpia el formulario
            setNewUnitBuilding('');
            alert('¡Unidad creada exitosamente!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al crear la unidad.');
            console.error("Error creating unit:", err);
            alert(`Error al crear unidad: ${error || (err as Error)?.message}`);
        }
    };

    if (loading) {
        return <p>Cargando unidades...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Crear Nueva Unidad</h2>
            <form onSubmit={handleCreateUnit}>
                <div>
                    <label htmlFor="unit_number">Número de Unidad:</label>
                    <input
                        type="text"
                        id="unit_number"
                        value={newUnitNumber}
                        onChange={(e) => setNewUnitNumber(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="unit_building">Edificio:</label>
                    <input
                        type="text"
                        id="unit_building"
                        value={newUnitBuilding}
                        onChange={(e) => setNewUnitBuilding(e.target.value)}
                    />
                </div>
                {/* Añade aquí más inputs para otros campos de la unidad */}
                <button type="submit">Crear Unidad</button>
            </form>

            <hr />

            <h2>Lista de Unidades</h2>
            {units.length === 0 ? (
                <p>No hay unidades disponibles.</p>
            ) : (
                <ul>
                    {units.map(unit => (
                        <li key={unit.id}>
                            <strong>ID:</strong> {unit.id} <br />
                            <strong>Número:</strong> {unit.unit_number} <br />
                            {unit.building && <><strong>Edificio:</strong> {unit.building} <br /></>}
                            {unit.floor !== null && unit.floor !== undefined && <><strong>Piso:</strong> {unit.floor} <br /></>}
                            {unit.is_occupied !== null && unit.is_occupied !== undefined && (
                                <><strong>Ocupada:</strong> {unit.is_occupied ? 'Sí' : 'No'} <br /></>
                            )}
                            {/* Puedes añadir más detalles de la unidad aquí */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UnitList;
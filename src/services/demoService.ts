import axios from 'axios';
import { useMockService, API_BASE_URL } from './api';
import { MockBackendService } from './MockBackendService';

const mockService = MockBackendService.getInstance();

/**
 * Resets the entire database to its initial demo state.
 * This is a destructive operation.
 */
export const resetDemo = async (): Promise<{ message: string }> => {
    if (useMockService) {
        console.log("DEMO: Usando Mock Service para resetear los datos.");
        await mockService.resetData();
        return { message: 'Datos de demostración reseteados (Mock).' };
    } else {
        console.log("DEMO: Enviando petición al backend real para resetear la base de datos.");
        const response = await axios.post<{ message: string }>(`${API_BASE_URL}/demo/reset`);
        return response.data;
    }
}; 
export const getMonthYearString = (date: Date): string => {
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
};

export const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getFirstDayOfNextMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

// Helper para convertir "Alquiler Mes de Año" a un objeto Date para ordenar
export const getSortableDateFromConcept = (concept: string): Date | null => {
    const monthNames: { [key: string]: number } = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };
    const parts = concept.toLowerCase().split(' '); // e.g., ["alquiler", "mayo", "de", "2025"]
    if (parts.length < 4 || parts[0] !== 'alquiler') {
      return null; // Formato no esperado
    }
    const monthName = parts[1];
    const yearStr = parts[3];
    
    const month = monthNames[monthName];
    const year = parseInt(yearStr, 10);
  
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1);
    }
    return null;
  };

  export const determineNextPayableMonth = (tenantPayments: any[], initialDate: Date | null): Date | null => {
    if (!initialDate) return null; // Si no hay fecha inicial, no podemos determinar.
    let currentDate = getFirstDayOfMonth(new Date(initialDate)); 
  
    // Helper function to check if rent for a specific month has been paid
    const isRentForMonthPaid = (monthDate: Date): boolean => {
      const targetConceptPrefix = `Alquiler ${getMonthYearString(monthDate)}`;
      // Check if any completed payment's concept starts with the target rent concept string
      return tenantPayments.some(payment => 
        payment.status === 'completed' && 
        payment.concept.startsWith(targetConceptPrefix)
      );
    };
    
    let attempts = 0; // Evitar bucles infinitos en casos extraños
    // eslint-disable-next-line no-constant-condition
    while (attempts < 240) { // Buscar hasta 20 años en el futuro
      if (!isRentForMonthPaid(currentDate)) {
        return currentDate; // Este mes de alquiler no está pagado
      }
      currentDate = getFirstDayOfNextMonth(currentDate); // Mover al siguiente mes
      attempts++;
    }
    return null; // No se encontró un mes pagable (ej. todos los meses futuros aparecen como pagados)
  }; 
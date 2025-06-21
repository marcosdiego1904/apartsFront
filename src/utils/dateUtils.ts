export const getMonthYearString = (date: Date): string => {
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getFirstDayOfNextMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

// Helper to convert "Rent Month Year" to a Date object for sorting
export const getSortableDateFromConcept = (concept: string): Date | null => {
    const monthNames: { [key: string]: number } = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const parts = concept.toLowerCase().split(' '); // e.g., ["rent", "may", "2025"]
    if (parts.length < 3 || (parts[0] !== 'rent' && parts[0] !== 'alquiler')) { // Keep 'alquiler' for backward compatibility
      return null; // Unexpected format
    }
    const monthName = parts[0] === 'rent' ? parts[1] : parts[1]; // Logic is the same, but clear
    const yearStr = parts[parts.length - 1];
    
    const month = monthNames[monthName];
    const year = parseInt(yearStr, 10);
  
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1);
    }
    return null;
  };

  export const determineNextPayableMonth = (tenantPayments: any[], initialDate: Date | null): Date | null => {
    if (!initialDate) return null; // If there's no initial date, we can't determine.
    let currentDate = getFirstDayOfMonth(new Date(initialDate)); 
  
    // Helper function to check if rent for a specific month has been paid
    const isRentForMonthPaid = (monthDate: Date): boolean => {
      const targetConceptPrefixRent = `Rent ${getMonthYearString(monthDate)}`;
      const targetConceptPrefixAlquiler = `Alquiler ${getMonthYearString(monthDate)}`; // For backward compatibility
      // Check if any completed payment's concept starts with the target rent concept string
      return tenantPayments.some(payment => 
        payment.status === 'completed' && 
        (payment.concept.startsWith(targetConceptPrefixRent) || payment.concept.startsWith(targetConceptPrefixAlquiler))
      );
    };
    
    let attempts = 0; // Avoid infinite loops in strange cases
    // eslint-disable-next-line no-constant-condition
    while (attempts < 240) { // Search up to 20 years in the future
      if (!isRentForMonthPaid(currentDate)) {
        return currentDate; // This month's rent is not paid
      }
      currentDate = getFirstDayOfNextMonth(currentDate); // Move to the next month
      attempts++;
    }
    return null; // No payable month found (e.g., all future months appear as paid)
  }; 
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateString: string): string {
  try {
    // Parse YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} – ${end}`;
  } catch (e) {
    return `${startDate} - ${endDate}`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function formatCostBasis(basis: string): string {
  switch (basis) {
    case 'per_person':
      return '/ person';
    case 'per_night':
      return '/ night';
    case 'per_group':
      return '/ group';
    case 'total':
      return 'total';
    default:
      return '';
  }
}

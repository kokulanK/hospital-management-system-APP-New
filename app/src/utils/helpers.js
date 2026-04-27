export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return '#3b82f6';
    case 'completed': return '#10b981';
    case 'cancelled': return '#ef4444';
    case 'pending': return '#f59e0b';
    case 'approved': return '#10b981';
    case 'rejected': return '#ef4444';
    default: return '#6b7280';
  }
};
export const crowdPredictionService = {
  predictCrowd(rsvpCount: number, capacity: number): string {
    if (!capacity || capacity <= 0) return 'Medium';
    
    const ratio = rsvpCount / capacity;
    
    if (ratio >= 0.8) return 'High';
    if (ratio >= 0.4) return 'Medium';
    return 'Low';
  }
};

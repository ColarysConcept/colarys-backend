const getWeekDates = (weekString: string): Date[] => {
  if (!weekString.includes('-W')) return [];
  
  try {
    const [year, weekNum] = weekString.split('-W');
    const yearNum = parseInt(year);
    const weekNumber = parseInt(weekNum);
    
    const dates: Date[] = [];
    const jan4 = new Date(yearNum, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - (jan4Day - 1));
    
    const monday = new Date(startOfWeek1);
    monday.setDate(startOfWeek1.getDate() + (weekNumber - 1) * 7);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      dates.push(currentDate);
    }
    
    return dates;
  } catch (error) {
    console.error('Erreur getWeekDates:', error);
    return [];
  }
};
export const parseWeekId = (weekId) => {
    const [year, week] = weekId.split('-W').map(Number);
    return { year, week };
};

const getMondayOfISOWeek = (weekId) => {
    const { year, week } = parseWeekId(weekId);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - (dayOfWeek || 7) + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - (dayOfWeek || 7));
    }
    ISOweekStart.setHours(12, 0, 0, 0);
    return ISOweekStart;
};

export const getAbsoluteWeek = (weekId) => {
    const monday = getMondayOfISOWeek(weekId);
    // Reference date: 2020-01-06 (a Monday)
    const refDate = new Date(2020, 0, 6, 12, 0, 0, 0);
    const diffMs = monday.getTime() - refDate.getTime();
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
};

export const isWeekInRange = (targetWeekId, startWeekId, durationWeeks) => {
    const startAbsolute = getAbsoluteWeek(startWeekId);
    const targetAbsolute = getAbsoluteWeek(targetWeekId);
    const endAbsolute = startAbsolute + durationWeeks - 1;

    return targetAbsolute >= startAbsolute && targetAbsolute <= endAbsolute;
};

export const getDateOfTuesday = (weekId) => {
    const monday = getMondayOfISOWeek(weekId);
    const tuesday = new Date(monday);
    tuesday.setDate(monday.getDate() + 1);

    return tuesday.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' });
};

export const getISODateOfTuesday = (weekId) => {
    const monday = getMondayOfISOWeek(weekId);
    const tuesday = new Date(monday);
    tuesday.setDate(monday.getDate() + 1);
    return tuesday.toISOString().split('T')[0];
};

export const getWeekIdFromDate = (dateInput) => {
    const date = new Date(dateInput);
    // Copy date so don't modify original
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    // Return year and week number with padding
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export const getWeekIdFromAbs = (absWeek) => {
    const refDate = new Date(2020, 0, 6, 12, 0, 0, 0);
    const targetDate = new Date(refDate.getTime() + (absWeek * 7 * 24 * 60 * 60 * 1000));
    return getWeekIdFromDate(targetDate);
};

export const parseWeekId = (weekId) => {
    const [year, week] = weekId.split('-W').map(Number);
    return { year, week };
};

export const isWeekInRange = (targetWeekId, startWeekId, durationWeeks) => {
    const target = parseWeekId(targetWeekId);
    const start = parseWeekId(startWeekId);

    // Calculate relative week offset
    // Simplified for same year. In a real app we need year transition logic.
    const startAbsolute = start.year * 53 + start.week;
    const targetAbsolute = target.year * 53 + target.week;

    const endAbsolute = startAbsolute + durationWeeks - 1;

    return targetAbsolute >= startAbsolute && targetAbsolute <= endAbsolute;
};

export const getDateOfTuesday = (weekId) => {
    const { year, week } = parseWeekId(weekId);
    // ISO week date logic: find the first Monday of the year
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = simple;
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    // Tuesday is the 2nd day of the week
    const tuesday = new Date(ISOweekStart);
    tuesday.setDate(ISOweekStart.getDate() + 1);

    return tuesday.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' });
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
    // Return array of year and week number
    return `${d.getUTCFullYear()}-W${weekNo}`;
};

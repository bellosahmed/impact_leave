const { _calculateLeaveDaysForTest } = require('../controller');

describe('Leave Day Calculation', () => {

    // Mock holidays for testing
    const holidays = [
        { date: '2025-12-25T00:00:00.000Z' }, // Christmas (a Thursday)
        { date: '2025-12-26T00:00:00.000Z' }, // Boxing Day (a Friday)
    ];

    test('should calculate 5 days for a full week', () => {
        const startDate = '2025-12-01'; // Monday
        const endDate = '2025-12-05';   // Friday
        expect(_calculateLeaveDaysForTest(startDate, endDate)).toBe(5);
    });

    test('should exclude weekends', () => {
        const startDate = '2025-12-05'; // Friday
        const endDate = '2025-12-08';   // Next Monday
        // Should count Fri, Mon (2 days), and skip Sat, Sun.
        expect(_calculateLeaveDaysForTest(startDate, endDate)).toBe(2);
    });

    test('should exclude public holidays', () => {
        const startDate = '2025-12-22'; // Monday
        const endDate = '2025-12-26';   // Friday
        // Should be 5 days, but Christmas (Thurs) and Boxing Day (Fri) are holidays.
        // So, it should count Mon, Tue, Wed (3 days).
        expect(_calculateLeaveDaysForTest(startDate, endDate, holidays)).toBe(3);
    });

    test('should return 0 if end date is before start date', () => {
        const startDate = '2025-12-10';
        const endDate = '2025-12-09';
        expect(_calculateLeaveDaysForTest(startDate, endDate)).toBe(0);
    });
});
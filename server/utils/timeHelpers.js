/**
 * Time and Business Hours Utilities (Asia/Bangkok timezone UTC+7)
 */

/**
 * Gets Thai (Asia/Bangkok) time components from a Date object
 * @param {Date} date
 * @returns {{ dayOfWeek: number, timeStr: string, hours: number, minutes: number }}
 */
export const getThaiDateTimeComponents = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  let hourStr = '00';
  let minStr = '00';
  let weekdayStr = 'Mon';

  for (const part of parts) {
    if (part.type === 'hour') hourStr = part.value;
    if (part.type === 'minute') minStr = part.value;
    if (part.type === 'weekday') weekdayStr = part.value;
  }

  // Map weekday to 0-6 (0 = Sunday, 1 = Monday, etc.)
  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = weekdayMap[weekdayStr] ?? 1;
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);
  const timeStr = `${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`;

  return { dayOfWeek, timeStr, hours, minutes };
};

/**
 * Checks whether a given Date is within configured business hours
 * @param {Date} [date=new Date()]
 * @param {Object} [config]
 * @param {string} config.start - e.g. "08:30"
 * @param {string} config.end - e.g. "18:00"
 * @param {number[]} config.workdays - array of days (0=Sun, 1=Mon, ..., 6=Sat)
 * @returns {boolean}
 */
export const isWithinBusinessHours = (date = new Date(), config) => {
  if (!config || !config.start || !config.end) return true;

  const { dayOfWeek, timeStr } = getThaiDateTimeComponents(date);

  // Check workday
  if (Array.isArray(config.workdays) && config.workdays.length > 0) {
    if (!config.workdays.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check time window (start <= timeStr <= end)
  if (timeStr < config.start || timeStr > config.end) {
    return false;
  }

  return true;
};

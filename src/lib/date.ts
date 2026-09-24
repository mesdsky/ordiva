// Local calendar date as YYYY-MM-DD.
// toISOString() is UTC, which in Indonesia (UTC+7) returns
// yesterday's date between midnight and 7am.
export function todayLocal(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

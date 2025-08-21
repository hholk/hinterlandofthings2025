function isHobbyCronValid(expression) {
  const exp = expression.trim();
  if (exp === '@daily' || exp === '@midnight') return true;
  const parts = exp.split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  return isSingle(minute, 0, 59) &&
         isSingle(hour, 0, 23) &&
         dayOfMonth === '*' &&
         month === '*' &&
         dayOfWeek === '*';
}

function isSingle(field, min, max) {
  if (!/^\d+$/.test(field)) return false;
  const num = Number(field);
  return num >= min && num <= max;
}

module.exports = { isHobbyCronValid };

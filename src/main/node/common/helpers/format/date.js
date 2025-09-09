function formatDate(date) {
  if (!date) return '';

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return '';

  const monthNames = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  const day = dateObj.getDate();
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

module.exports = formatDate;

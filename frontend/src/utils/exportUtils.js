/**
 * Utility to export JSON data to CSV/Excel compatible format
 */
export const downloadCSV = (data, filename, headers) => {
  if (!data || !data.length) return;

  const csvRows = [];
  
  // Add Headers
  csvRows.push(headers.join(','));

  // Add Data
  for (const row of data) {
    const values = headers.map(header => {
      const field = header.toLowerCase().replace(/ /g, '_');
      let val = row[field];
      
      // Handle special cases
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        val = val.replace(/"/g, '""');
        if (val.includes(',') || val.includes('\n')) {
          val = `"${val}"`;
        }
      }
      
      return val;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

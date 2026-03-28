import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exports an array of objects to a CSV file.
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        // Handle null/undefined and escape quotes
        const escaped = (val === null || val === undefined) ? "" : String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    )
  ];
  
  // Create blob and download link
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Helper to load the logo image
 */
const loadLogo = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = '/deriv-logo.png';
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.warn("Failed to load logo image, falling back to text-only header.");
      reject(e);
    };
  });
};

/**
 * Exports data to a PDF table with the site logo.
 * @param headers Array of column headers
 * @param data 2D array of row data
 * @param filename Name of the file (without extension)
 * @param title Title of the PDF document
 */
export const exportToPDF = async (headers: string[], data: any[][], filename: string, title: string) => {
  const doc = new jsPDF();
  
  // Try to add the logo
  try {
    const logo = await loadLogo();
    // Position logo in the center (A4 width is 210, logo width is 45)
    doc.addImage(logo, 'PNG', 82.5, 10, 45, 12);
  } catch (e) {
    // If logo fails, the space will be used for the title higher up
  }
  
  // Add title (positioned below the logo area, centered)
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 37, { align: 'center' });
  
  // Generate table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [234, 68, 68], textColor: 255 }, // Match Deriv Red theme
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });
  
  doc.save(`${filename}.pdf`);
};

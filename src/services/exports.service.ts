import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import type { DashboardFilters, TableRow, KPIData } from './dashboard.service';

export const exportToExcel = async (
  filters: DashboardFilters,
  kpi: KPIData,
  tableData: TableRow[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Chaturthi Enterprises';
  workbook.lastModifiedBy = 'System';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.getColumn('A').width = 20;
  summarySheet.getColumn('B').width = 30;

  summarySheet.addRow(['Chaturthi Enterprises']);
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.addRow(['Milk Distribution Report']);
  summarySheet.addRow([]);
  summarySheet.addRow(['Period:', `${filters.fromDate} to ${filters.toDate}`]);
  summarySheet.addRow(['Total Units:', kpi.totalUnits.toLocaleString()]);
  summarySheet.addRow(['Total Litres:', `${kpi.totalLitres.toFixed(2)} L`]);

  // Detailed Data Sheet (1 row per itemized submission entry)
  const dataSheet = workbook.addWorksheet('Detailed Data');
  dataSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Shop', key: 'shop', width: 30 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Pack Size', key: 'range', width: 15 },
    { header: 'Units/Count', key: 'units', width: 15 },
    { header: 'Litres', key: 'litres', width: 15 }
  ];

  // Style header row
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };

  // Add data rows for every submission item
  tableData.forEach(row => {
    row.items.forEach(item => {
      dataSheet.addRow({
        date: format(new Date(row.date), 'dd MMM yyyy'),
        shop: row.shop,
        product: item.product,
        range: item.range,
        units: item.units,
        litres: item.litres
      });
    });
  });

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Chaturthi_Enterprises_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportDashboardToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Chaturthi_Enterprises_Dashboard_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (err) {
    console.error('Error generating PDF', err);
    throw err;
  }
};

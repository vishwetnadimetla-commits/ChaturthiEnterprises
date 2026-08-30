import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { format } from 'date-fns';
import type { DashboardFilters, TableRow, KPIData } from './dashboard.service';

// ── CA PERSPECTIVE EXCEL AUDIT WORKBOOK ──
export const exportToExcel = async (
  filters: DashboardFilters,
  kpi: KPIData,
  tableData: TableRow[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Chaturthi Enterprises';
  workbook.lastModifiedBy = 'CA Audit System';
  workbook.created = new Date();

  // Color Constants for CA Styling
  const NAVY_HEADER = '1E293B';

  // ----------------------------------------------------
  // SHEET 1: EXECUTIVE AUDIT SUMMARY
  // ----------------------------------------------------
  const summarySheet = workbook.addWorksheet('Executive Audit Summary', { views: [{ showGridLines: true }] });
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 25;
  summarySheet.getColumn('C').width = 20;
  summarySheet.getColumn('D').width = 20;

  // Company Header
  summarySheet.mergeCells('A1:D1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'CHATURTHI ENTERPRISES — MILK DISTRIBUTION CA AUDIT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_HEADER } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.addRow([]);
  summarySheet.addRow(['Audit Period:', `${filters.fromDate} to ${filters.toDate}`]);
  summarySheet.addRow(['Report Generated On:', format(new Date(), 'dd MMM yyyy, hh:mm a')]);
  summarySheet.addRow(['Total Active Outlets Served:', kpi.totalShops]);
  summarySheet.addRow(['Total Net Litres Distributed:', `${kpi.totalLitres.toFixed(2)} L`]);
  summarySheet.addRow(['Total Packs / Units:', kpi.totalUnits.toLocaleString()]);
  summarySheet.addRow(['Average Daily Sales Volume:', `${kpi.avgSellPerDay.toFixed(2)} L / day`]);

  for (let r = 3; r <= 8; r++) {
    summarySheet.getCell(`A${r}`).font = { bold: true, color: { argb: '475569' } };
    summarySheet.getCell(`B${r}`).font = { bold: true };
  }

  summarySheet.addRow([]);
  summarySheet.addRow([]);

  // Product Volume Share Audit Table
  summarySheet.addRow(['Product Volume & Pack Breakdown Audit']);
  const pHeaderRow = summarySheet.addRow(['Product Short Code', 'Total Packs (Units)', 'Total Volume (Litres)', '% Share of Volume']);
  pHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  pHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } };
  });

  const productAgg: Record<string, { units: number; litres: number }> = {};
  tableData.forEach(row => {
    row.items.forEach(item => {
      productAgg[item.shortName] ??= { units: 0, litres: 0 };
      productAgg[item.shortName].units += item.units;
      productAgg[item.shortName].litres += item.litres;
    });
  });

  Object.entries(productAgg).forEach(([pCode, data]) => {
    const share = kpi.totalLitres > 0 ? (data.litres / kpi.totalLitres) * 100 : 0;
    summarySheet.addRow([
      pCode,
      data.units,
      parseFloat(data.litres.toFixed(2)),
      `${share.toFixed(2)}%`
    ]);
  });

  // ----------------------------------------------------
  // SHEET 2: SHOP-WISE MASTER AUDIT LEDGER
  // ----------------------------------------------------
  const shopSheet = workbook.addWorksheet('Shop Master Ledger', { views: [{ showGridLines: true }] });
  shopSheet.columns = [
    { header: 'Shop Name', key: 'shop', width: 32 },
    { header: 'Submissions Count', key: 'submissions', width: 20 },
    { header: 'Total Packs/Units', key: 'units', width: 20 },
    { header: 'Total Volume (Litres)', key: 'litres', width: 22 },
    { header: 'Avg Volume / Submission (L)', key: 'avg', width: 26 },
  ];

  const shopHeader = shopSheet.getRow(1);
  shopHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  shopHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_HEADER } };
  shopHeader.height = 24;

  const shopAgg: Record<string, { submissions: number; units: number; litres: number }> = {};
  tableData.forEach(row => {
    shopAgg[row.shop] ??= { submissions: 0, units: 0, litres: 0 };
    shopAgg[row.shop].submissions += 1;
    shopAgg[row.shop].units += row.totalUnits;
    shopAgg[row.shop].litres += row.totalLitres;
  });

  Object.entries(shopAgg).forEach(([shopName, data]) => {
    const avg = data.submissions > 0 ? data.litres / data.submissions : 0;
    shopSheet.addRow({
      shop: shopName,
      submissions: data.submissions,
      units: data.units,
      litres: parseFloat(data.litres.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
    });
  });

  // ----------------------------------------------------
  // SHEET 3: ITEMIZED TRANSACTION AUDIT LEDGER
  // ----------------------------------------------------
  const itemSheet = workbook.addWorksheet('Itemized Transaction Audit', { views: [{ showGridLines: true }] });
  itemSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Shop Name', key: 'shop', width: 30 },
    { header: 'Product Name', key: 'product', width: 22 },
    { header: 'Pack Size', key: 'range', width: 15 },
    { header: 'Units (Count)', key: 'units', width: 15 },
    { header: 'Litres', key: 'litres', width: 15 },
  ];

  const itemHeader = itemSheet.getRow(1);
  itemHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  itemHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_HEADER } };
  itemHeader.height = 24;

  tableData.forEach(row => {
    row.items.forEach(item => {
      itemSheet.addRow({
        date: format(new Date(row.date), 'yyyy-MM-dd'),
        shop: row.shop,
        product: item.product,
        range: item.range,
        units: item.units,
        litres: item.litres,
      });
    });
  });

  // Download Excel Workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Chaturthi_CA_Audit_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ── PERFORMANCE MANAGERS INFOGRAPHIC PDF REPORT EXPORT ──
export const exportDashboardToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return alert('Report container not found.');

  try {
    // Scroll container to top before taking canvas snapshot
    const prevScroll = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc',
    });

    window.scrollTo(0, prevScroll);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Handle multi-page overflow if report exceeds single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Chaturthi_Performance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (err: any) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF: ' + err.message);
  }
};

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CustomerData, BillingData } from '../types';
import { ASSETS } from '../assets';

export const generateSlip = async (
  customer: CustomerData,
  billing: BillingData
): Promise<Uint8Array> => {
  let pdfDoc: PDFDocument;

  // 1. Try to load external Template if provided in assets
  if (ASSETS.PDF_TEMPLATE) {
    try {
      const existingPdfBytes = await fetch(ASSETS.PDF_TEMPLATE).then(res => res.arrayBuffer());
      pdfDoc = await PDFDocument.load(existingPdfBytes);
    } catch (e) {
      console.warn("Failed to load template from assets, creating new document.", e);
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]); // A4
    }
  } else {
    // Create new blank A4
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]); // A4 Size
  }

  // Get the first page (either from template or new)
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  
  // Embed standard fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- 1. HEADER SECTION ---
  
  // Try to load logo (if CORS allows, otherwise skip)
  try {
    const logoImageBytes = await fetch(ASSETS.LOGO).then((res) => res.arrayBuffer());
    // Determine image type based on simple heuristic or try/catch both
    let logoImage;
    try {
        logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch {
        logoImage = await pdfDoc.embedJpg(logoImageBytes);
    }
    
    const logoDims = logoImage.scale(0.2); // Adjust scale
    
    // Draw Logo on top left
    page.drawImage(logoImage, {
      x: 50,
      y: height - 150,
      width: logoDims.width,
      height: logoDims.height,
    });
    
    // Draw Text "ITTHAD DAIRY FARM" below logo
    // Only draw these if we assume the template doesn't have them
    // For now, we draw them to match the screenshot requested.
    page.drawText('ITTHAD', {
      x: 50,
      y: height - 165,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.3, 0.1), // Greenish
    });
    page.drawText('DAIRY FARM', {
        x: 50,
        y: height - 180,
        size: 10,
        font: helveticaBold,
        color: rgb(0.4, 0.2, 0), // Brownish
      });

  } catch (e) {
    // Fallback if logo fails
    console.warn("Logo fetch failed or CORS issue", e);
  }

  // Company Name
  page.drawText('ITTHAD DAIRY FARM', {
    x: 250,
    y: height - 80,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Address
  page.drawText('Chak Mathroma, Darul Fazal, Rabwah', {
    x: 250,
    y: height - 100,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Contact
  page.drawText('Contact: 0331-6198039', {
    x: 250,
    y: height - 115,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Slogan
  page.drawText('Love For All', {
    x: 250,
    y: height - 130,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // --- 2. CUSTOMER & INVOICE INFO ---
  
  const sectionTop = height - 200;

  // Left Side: Customer
  page.drawText(`Bill To: ${customer.name}`, { x: 50, y: sectionTop, size: 11, font: helveticaBold });
  page.drawText(`Phone: ${customer.phone}`, { x: 50, y: sectionTop - 15, size: 10, font: helvetica });
  page.drawText(`Address: ${customer.address}`, { x: 50, y: sectionTop - 30, size: 10, font: helvetica });

  // Right Side: Invoice Info
  const invoiceNo = Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  page.drawText(`Invoice No: ${invoiceNo}`, { x: 400, y: sectionTop, size: 10, font: helvetica });
  page.drawText(`Date: ${dateStr}`, { x: 400, y: sectionTop - 15, size: 10, font: helvetica });


  // --- 3. TABLE ---
  
  const tableTop = sectionTop - 60;
  
  // Top Line
  page.drawLine({ start: { x: 50, y: tableTop }, end: { x: 550, y: tableTop }, thickness: 1.5, color: rgb(0, 0, 0) });
  
  // Headers
  const colY = tableTop - 15;
  page.drawText('Description', { x: 60, y: colY, size: 11, font: helveticaBold });
  page.drawText('Quantity', { x: 250, y: colY, size: 11, font: helveticaBold });
  page.drawText('Unit Price', { x: 350, y: colY, size: 11, font: helveticaBold });
  page.drawText('Amount', { x: 480, y: colY, size: 11, font: helveticaBold });

  // Bottom Line of Header
  page.drawLine({ start: { x: 50, y: tableTop - 25 }, end: { x: 550, y: tableTop - 25 }, thickness: 1, color: rgb(0, 0, 0) });

  // Row Data
  const rowY = tableTop - 50;
  page.drawText('Milk (Buffalo)', { x: 60, y: rowY, size: 11, font: helvetica });
  page.drawText(`${billing.totalLiters} Liters`, { x: 250, y: rowY, size: 11, font: helvetica });
  page.drawText(`Rs. ${billing.ratePerLiter}`, { x: 350, y: rowY, size: 11, font: helvetica });
  page.drawText(`Rs. ${billing.totalAmount}`, { x: 480, y: rowY, size: 11, font: helvetica });


  // --- 4. TOTALS SECTION ---
  
  const totalsTop = rowY - 50;
  
  // Total
  page.drawText('Total:', { x: 380, y: totalsTop, size: 11, font: helveticaBold });
  page.drawText(`Rs. ${billing.totalAmount}`, { x: 480, y: totalsTop, size: 11, font: helveticaBold });
  
  // Due Amount
  page.drawText('Due Amount:', { x: 380, y: totalsTop - 20, size: 11, font: helvetica });
  page.drawText('Rs. 0', { x: 480, y: totalsTop - 20, size: 11, font: helvetica });

  // Payable
  page.drawText('Payable:', { x: 380, y: totalsTop - 40, size: 11, font: helvetica });
  page.drawText(`Rs. ${billing.totalAmount}`, { x: 480, y: totalsTop - 40, size: 11, font: helvetica });


  // --- 5. FOOTER ---
  
  const footerY = 150;
  
  // Payment Term Line
  const paymentText = "Payment Term : Account Holder : Inzimam Ul Haq : 03065278010 : JazzCash";
  const paymentWidth = helvetica.widthOfTextAtSize(paymentText, 9);
  page.drawText(paymentText, { 
      x: (width - paymentWidth) / 2, 
      y: footerY, 
      size: 9, 
      font: helvetica 
  });

  // Thank you message
  const thanksText = "Thank you for your business!";
  const thanksWidth = helveticaBold.widthOfTextAtSize(thanksText, 12);
  page.drawText(thanksText, { 
      x: (width - thanksWidth) / 2, 
      y: footerY - 40, 
      size: 12, 
      font: helveticaBold 
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

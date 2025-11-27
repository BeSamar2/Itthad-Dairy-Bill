import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CustomerData, BillingData } from '../types';
import { ASSETS } from '../assets';

export const generateSlip = async (
  customer: CustomerData,
  billing: BillingData
): Promise<Uint8Array> => {
  let pdfDoc: PDFDocument;

  // 1. Try to load external Template
  try {
    const existingPdfBytes = await fetch(ASSETS.PDF_TEMPLATE).then(res => {
      if (!res.ok) throw new Error("Template not found");
      return res.arrayBuffer();
    });
    pdfDoc = await PDFDocument.load(existingPdfBytes);
  } catch (e) {
    console.warn("Template not found at " + ASSETS.PDF_TEMPLATE + ", creating blank A4.", e);
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]); // A4
  }

  // Get the first page
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  
  // Embed standard fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- 1. HEADER SECTION ---
  
  // Attempt to load Logo onto the PDF
  try {
    const logoRes = await fetch(ASSETS.LOGO);
    if (logoRes.ok) {
      const logoImageBytes = await logoRes.arrayBuffer();
      let logoImage;
      try {
          logoImage = await pdfDoc.embedPng(logoImageBytes);
      } catch {
          logoImage = await pdfDoc.embedJpg(logoImageBytes);
      }
      
      const logoDims = logoImage.scale(0.25); // Adjusted scale to match screenshot
      
      // Draw Logo on top left
      page.drawImage(logoImage, {
        x: 40,
        y: height - 140, // Adjusted Y to match screenshot
        width: logoDims.width,
        height: logoDims.height,
      });
    }
  } catch (e) {
    console.warn("Logo load failed for PDF", e);
  }

  // Center Text Header
  const centerX = width / 2;
  const headerY = height - 60;

  // Company Name
  const titleText = 'ITTHAD DAIRY FARM';
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 22);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2, // Centered
    y: headerY,
    size: 22,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Address
  const addressText = 'Chak Mathroma, Darul Fazal, Rabwah';
  const addressWidth = helvetica.widthOfTextAtSize(addressText, 10);
  page.drawText(addressText, {
    x: (width - addressWidth) / 2, // Centered
    y: headerY - 20,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Contact
  const contactText = 'Contact: 0331-6198039';
  const contactWidth = helvetica.widthOfTextAtSize(contactText, 10);
  page.drawText(contactText, {
    x: (width - contactWidth) / 2, // Centered
    y: headerY - 35,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Slogan
  const sloganText = 'Love For All';
  const sloganWidth = helvetica.widthOfTextAtSize(sloganText, 10);
  page.drawText(sloganText, {
    x: (width - sloganWidth) / 2, // Centered
    y: headerY - 50,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // --- 2. BILL TO & INVOICE DETAILS ---
  
  const infoY = height - 180;
  const leftMargin = 50;
  const rightColX = 400;

  // Left: Customer
  page.drawText(`Bill To: ${customer.name}`, { 
    x: leftMargin, y: infoY, size: 12, font: helveticaBold 
  });
  page.drawText(`Phone: ${customer.phone}`, { 
    x: leftMargin, y: infoY - 18, size: 11, font: helvetica 
  });
  page.drawText(`Address: ${customer.address}`, { 
    x: leftMargin, y: infoY - 36, size: 11, font: helvetica 
  });

  // Right: Invoice Info
  const invoiceNo = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4); // 4 digit random
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  page.drawText(`Invoice No: ${1001 + Math.floor(Math.random() * 100)}`, { 
    x: rightColX, y: infoY, size: 11, font: helvetica 
  });
  page.drawText(`Date: ${dateStr}`, { 
    x: rightColX, y: infoY - 18, size: 11, font: helvetica 
  });

  // --- 3. TABLE ---
  
  const tableTop = infoY - 70;
  const tableBottom = tableTop - 30; // Height of header row

  // Top Line (Thick)
  page.drawLine({ 
    start: { x: leftMargin, y: tableTop }, 
    end: { x: width - leftMargin, y: tableTop }, 
    thickness: 1.5, 
    color: rgb(0, 0, 0) 
  });

  // Headers
  const col1X = 60;  // Description
  const col2X = 300; // Quantity
  const col3X = 400; // Unit Price
  const col4X = 480; // Amount

  const headerTextY = tableTop - 18;
  page.drawText('Description', { x: col1X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Quantity', { x: col2X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Unit Price', { x: col3X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Amount', { x: col4X, y: headerTextY, size: 12, font: helveticaBold });

  // Bottom Line (Thin)
  page.drawLine({ 
    start: { x: leftMargin, y: tableBottom }, 
    end: { x: width - leftMargin, y: tableBottom }, 
    thickness: 1, 
    color: rgb(0, 0, 0) 
  });

  // Data Row
  const rowY = tableBottom - 25;
  page.drawText('Milk (Buffalo)', { x: col1X, y: rowY, size: 11, font: helvetica });
  page.drawText(`${billing.totalLiters} Liters`, { x: col2X, y: rowY, size: 11, font: helvetica });
  page.drawText(`Rs. ${billing.ratePerLiter}`, { x: col3X, y: rowY, size: 11, font: helvetica });
  page.drawText(`Rs. ${billing.totalAmount}`, { x: col4X, y: rowY, size: 11, font: helvetica });

  // --- 4. TOTALS SECTION ---
  
  const totalsY = rowY - 60;
  const labelX = 380;
  const valueX = 480;

  const dueAmount = billing.dueAmount || 0;
  const payable = billing.totalAmount + dueAmount;

  // Total Label & Value
  page.drawText('Total:', { x: labelX, y: totalsY, size: 12, font: helveticaBold });
  page.drawText(`Rs. ${billing.totalAmount}`, { x: valueX, y: totalsY, size: 12, font: helveticaBold });

  // Due Amount
  page.drawText('Due Amount:', { x: labelX, y: totalsY - 20, size: 11, font: helvetica });
  page.drawText(`Rs. ${dueAmount}`, { x: valueX, y: totalsY - 20, size: 11, font: helvetica });

  // Payable
  page.drawText('Payable:', { x: labelX, y: totalsY - 40, size: 11, font: helvetica });
  page.drawText(`Rs. ${payable}`, { x: valueX, y: totalsY - 40, size: 11, font: helvetica });


  // --- 5. FOOTER ---
  
  // We place this above the template's Urdu footer if it exists.
  const footerY = 180; 
  
  const paymentText = "Payment Term : Account Holder : Inzimam Ul Haq : 03065278010 : JazzCash";
  const paymentWidth = helvetica.widthOfTextAtSize(paymentText, 9);
  page.drawText(paymentText, { 
      x: (width - paymentWidth) / 2, 
      y: footerY, 
      size: 9, 
      font: helvetica 
  });

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
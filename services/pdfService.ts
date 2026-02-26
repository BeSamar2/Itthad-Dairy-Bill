import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CustomerData, BillingData } from '../types';
import { ASSETS } from '../assets';

export const generateSlip = async (
  customer: CustomerData,
  billing: BillingData
): Promise<Uint8Array> => {
  // Create a blank PDF document (not using template to ensure content shows)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Embed standard fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- 1. HEADER SECTION ---
  
  // Load Logo onto the PDF
  try {
    console.log('Logo path:', ASSETS.LOGO);
    // Fetch the logo image
    const logoRes = await fetch(ASSETS.LOGO);
    console.log('Logo fetch response:', logoRes.status, logoRes.ok);
    if (!logoRes.ok) throw new Error("Logo fetch failed");
    const logoImageBytes = new Uint8Array(await logoRes.arrayBuffer());
    console.log('Logo bytes loaded:', logoImageBytes.length);

    // Embed as PNG
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    console.log('Logo embedded successfully');
    
    // Smart Scaling: constrain to 80x80 box
    const maxW = 80;
    const maxH = 80;
    const scaleX = maxW / logoImage.width;
    const scaleY = maxH / logoImage.height;
    const scale = Math.min(scaleX, scaleY); 
    
    const logoDims = logoImage.scale(scale);
    
    // Draw Logo on top left
    page.drawImage(logoImage, {
      x: 40,
      y: height - 130, // Positioned near top
      width: logoDims.width,
      height: logoDims.height,
    });
    console.log('Logo drawn at position (40, ' + (height - 130) + ')');

  } catch (e) {
    console.error("Logo load failed for PDF:", e);
  }

  // Center Text Header
  const headerY = height - 60;

  // Company Name
  const titleText = 'ITTHAD DAIRY FARM';
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 22);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2, 
    y: headerY,
    size: 22,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Address
  const addressText = 'Chak Mathroma, Darul Fazal, Rabwah';
  const addressWidth = helvetica.widthOfTextAtSize(addressText, 10);
  page.drawText(addressText, {
    x: (width - addressWidth) / 2,
    y: headerY - 20,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Contact
  const contactText = 'Contact: 0331-6198039';
  const contactWidth = helveticaBold.widthOfTextAtSize(contactText, 12);
  page.drawText(contactText, {
    x: (width - contactWidth) / 2, 
    y: headerY - 38,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Slogan
  const sloganText = 'Love For All';
  const sloganWidth = helvetica.widthOfTextAtSize(sloganText, 10);
  page.drawText(sloganText, {
    x: (width - sloganWidth) / 2,
    y: headerY - 55,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // --- 2. BILL TO & INVOICE DETAILS ---
  
  const infoY = height - 180;
  const leftMargin = 50;
  const rightColX = 400;

  // Left: Customer
  let currentY = infoY;
  page.drawText(`Bill To: ${customer.name}`, { 
    x: leftMargin, y: currentY, size: 12, font: helveticaBold 
  });
  currentY -= 18;

  // Father Name
  if (customer.fatherName && customer.fatherName.trim() !== '') {
    page.drawText(`S/O: ${customer.fatherName}`, { 
      x: leftMargin, y: currentY, size: 11, font: helvetica 
    });
    currentY -= 18;
  }

  page.drawText(`Phone: ${customer.phone}`, { 
    x: leftMargin, y: currentY, size: 11, font: helvetica 
  });
  currentY -= 18;

  page.drawText(`Address: ${customer.address}`, { 
    x: leftMargin, y: currentY, size: 11, font: helvetica 
  });

  // Right: Invoice Info
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const randInv = 1001 + Math.floor(Math.random() * 100);
  
  page.drawText(`Invoice No: ${randInv}`, { 
    x: rightColX, y: infoY, size: 11, font: helvetica 
  });
  page.drawText(`Date: ${dateStr}`, { 
    x: rightColX, y: infoY - 18, size: 11, font: helvetica 
  });

  // --- 3. DYNAMIC TABLE ---
  
  const tableTop = infoY - 70;
  const headerTextY = tableTop - 18;

  // Column X Positions
  const col1X = 60;  // Description
  const col2X = 300; // Quantity
  const col3X = 400; // Unit Price
  const col4X = 480; // Amount

  // Top Line
  page.drawLine({ 
    start: { x: leftMargin, y: tableTop }, 
    end: { x: width - leftMargin, y: tableTop }, 
    thickness: 1.5, 
    color: rgb(0, 0, 0) 
  });

  // Headers
  page.drawText('Description', { x: col1X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Quantity', { x: col2X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Unit Price', { x: col3X, y: headerTextY, size: 12, font: helveticaBold });
  page.drawText('Amount', { x: col4X, y: headerTextY, size: 12, font: helveticaBold });

  // Determine which rows to print
  const rows = [];
  
  if (billing.selection === 'Cow' || billing.selection === 'Both') {
    rows.push({
      desc: 'Milk (Cow)',
      qty: billing.cow.totalLiters,
      rate: billing.cow.rate,
      amt: billing.cow.amount
    });
  }

  if (billing.selection === 'Buffalo' || billing.selection === 'Both') {
    rows.push({
      desc: 'Milk (Buffalo)',
      qty: billing.buffalo.totalLiters,
      rate: billing.buffalo.rate,
      amt: billing.buffalo.amount
    });
  }

  if (billing.selection === 'Mix') {
    rows.push({
      desc: 'Milk (Mix)',
      qty: billing.mix.totalLiters,
      rate: billing.mix.rate,
      amt: billing.mix.amount
    });
  }

  let rowY = tableTop - 30; // Start of data rows area
  
  // Draw header bottom line
  page.drawLine({ 
    start: { x: leftMargin, y: rowY }, 
    end: { x: width - leftMargin, y: rowY }, 
    thickness: 1, 
    color: rgb(0, 0, 0) 
  });

  // Render Rows
  rowY -= 20; // First row position
  let currentBillTotal = 0;

  rows.forEach(item => {
     page.drawText(item.desc, { x: col1X, y: rowY, size: 11, font: helvetica });
     page.drawText(`${item.qty.toFixed(1)} Liters`, { x: col2X, y: rowY, size: 11, font: helvetica });
     page.drawText(`Rs. ${item.rate}`, { x: col3X, y: rowY, size: 11, font: helvetica });
     page.drawText(`Rs. ${item.amt.toLocaleString()}`, { x: col4X, y: rowY, size: 11, font: helvetica });
     
     currentBillTotal += item.amt;
     rowY -= 25; // Move down for next row
  });

  // --- 4. TOTALS SECTION ---
  
  // Position totals below the last row
  const totalsY = rowY - 40;
  const labelX = 380;
  const valueX = 480;

  const dueAmount = billing.dueAmount || 0;
  const discount = billing.discount || 0;
  const payable = currentBillTotal + dueAmount - discount;

  // Total Label & Value
  page.drawText('Total:', { x: labelX, y: totalsY, size: 12, font: helveticaBold });
  page.drawText(`Rs. ${currentBillTotal.toLocaleString()}`, { x: valueX, y: totalsY, size: 12, font: helveticaBold });

  // Due Amount
  page.drawText('Due Amount:', { x: labelX, y: totalsY - 20, size: 11, font: helvetica });
  page.drawText(`Rs. ${dueAmount.toLocaleString()}`, { x: valueX, y: totalsY - 20, size: 11, font: helvetica });

  // Discount
  page.drawText('Discount:', { x: labelX, y: totalsY - 40, size: 11, font: helvetica });
  page.drawText(`Rs. ${discount.toLocaleString()}`, { x: valueX, y: totalsY - 40, size: 11, font: helvetica });

  // Payable
  page.drawText('Payable:', { x: labelX, y: totalsY - 60, size: 11, font: helvetica });
  page.drawText(`Rs. ${payable.toLocaleString()}`, { x: valueX, y: totalsY - 60, size: 11, font: helvetica });


  // --- 5. FOOTER ---
  
  const footerStartY = 160; 
  
  // Line 1: Heading
  const termHeader = "Payment Terms";
  const termHeaderWidth = helveticaBold.widthOfTextAtSize(termHeader, 12);
  page.drawText(termHeader, {
      x: (width - termHeaderWidth) / 2,
      y: footerStartY,
      size: 12,
      font: helveticaBold
  });

  // Line 2: Instruction
  const instruction = "Please make payment to the following account:";
  const instructionWidth = helvetica.widthOfTextAtSize(instruction, 10);
  page.drawText(instruction, {
      x: (width - instructionWidth) / 2,
      y: footerStartY - 18,
      size: 10,
      font: helvetica
  });

  // Line 3: Account Holder (Bold)
  const accHolder = "Account Title: Inzimam Ul Haq";
  const accHolderWidth = helveticaBold.widthOfTextAtSize(accHolder, 12);
  page.drawText(accHolder, {
      x: (width - accHolderWidth) / 2,
      y: footerStartY - 40,
      size: 12,
      font: helveticaBold
  });

  // Line 4: Faysal Bank (Bigger, Bold)
  const faysalBank = "Faysal Bank: 3309301000001174";
  const faysalBankWidth = helveticaBold.widthOfTextAtSize(faysalBank, 14);
  page.drawText(faysalBank, {
      x: (width - faysalBankWidth) / 2,
      y: footerStartY - 60,
      size: 14,
      font: helveticaBold
  });

  // Line 5: Closing
  const thanksText = "Thank you for your continued trust and business!";
  const thanksWidth = helveticaBold.widthOfTextAtSize(thanksText, 12);
  page.drawText(thanksText, { 
      x: (width - thanksWidth) / 2, 
      y: footerStartY - 90, 
      size: 12, 
      font: helveticaBold 
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

/**
 * Generate PDF and convert to PNG image
 */
export const generateSlipAsImage = async (
  customer: CustomerData,
  billing: BillingData
): Promise<Blob> => {
  try {
    // First generate the PDF
    console.log('Generating PDF for image conversion...');
    const pdfBytes = await generateSlip(customer, billing);
    console.log('PDF generated, size:', pdfBytes.length);
    
    // Use pdfjs-dist to render
    const pdfjsLib = await import('pdfjs-dist');
    console.log('PDF.js loaded, version:', pdfjsLib.version);
    
    // Set worker source to local file in public folder
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    const pdfPage = await pdf.getPage(1);
    console.log('Got first page');
    
    // Create a canvas to render the PDF
    const scale = 2; // Higher scale for better quality
    const viewport = pdfPage.getViewport({ scale });
    console.log('Viewport:', viewport.width, 'x', viewport.height);
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    console.log('Rendering PDF to canvas...');
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    await pdfPage.render(renderContext as any).promise;
    console.log('PDF rendered to canvas successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Canvas converted to blob, size:', blob.size);
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
  } catch (error) {
    console.error('Error in generateSlipAsImage:', error);
    throw error;
  }
};
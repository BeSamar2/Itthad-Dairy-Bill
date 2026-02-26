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

  // Billing Period
  let billingPeriodText = '';
  if (billing.billingMode === 'monthly') {
    const monthName = new Date(billing.year, parseInt(billing.month)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    billingPeriodText = `Period: ${monthName}`;
  } else {
    const startDate = billing.startDate ? new Date(billing.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
    const endDate = billing.endDate ? new Date(billing.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    billingPeriodText = `Period: ${startDate} - ${endDate}`;
  }
  page.drawText(billingPeriodText, { 
    x: rightColX, y: infoY - 36, size: 11, font: helvetica 
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

  // Determine which rows to print based on billing mode
  const rows: Array<{desc: string; qty: number; rate: number; amt: number}> = [];
  
  if (billing.billingMode === 'monthly') {
    // Monthly billing - show summary rows
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
  } else {
    // Date-based billing - show daily breakdown sorted by date
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Collect all entries with their type and sort by date
    const allEntries: Array<{date: string; type: string; entry: any}> = [];

    if (billing.selection === 'Cow' || billing.selection === 'Both') {
      billing.cowDateBased.entries.forEach(entry => {
        allEntries.push({ date: entry.date, type: 'Cow', entry });
      });
    }

    if (billing.selection === 'Buffalo' || billing.selection === 'Both') {
      billing.buffaloDateBased.entries.forEach(entry => {
        allEntries.push({ date: entry.date, type: 'Buffalo', entry });
      });
    }

    if (billing.selection === 'Mix') {
      billing.mixDateBased.entries.forEach(entry => {
        allEntries.push({ date: entry.date, type: 'Mix', entry });
      });
    }

    // Sort by date ascending, then by type to keep same-date entries together
    allEntries.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If dates are equal, sort alphabetically by type (Buffalo before Cow before Mix)
      return a.type.localeCompare(b.type);
    });

    // Now push sorted entries to rows
    allEntries.forEach(({ type, entry }) => {
      rows.push({
        desc: `${type} - ${formatDate(entry.date)}`,
        qty: entry.liters,
        rate: entry.rate,
        amt: entry.amount
      });
    });
  }

  let rowY = tableTop - 30; // Start of data rows area
  let currentPage = page;
  const minY = 180; // Minimum Y position before creating new page (conservative, we'll check totals/footer separately)
  const rowHeight = 25;
  const newPageStartY = height - 60; // Starting Y position on new pages
  
  // Draw header bottom line
  currentPage.drawLine({ 
    start: { x: leftMargin, y: rowY }, 
    end: { x: width - leftMargin, y: rowY }, 
    thickness: 1, 
    color: rgb(0, 0, 0) 
  });

  // Render Rows with pagination
  rowY -= 20; // First row position
  let currentBillTotal = 0;

  rows.forEach((item, index) => {
     // Check if we need a new page
     if (rowY < minY) {
       currentPage = pdfDoc.addPage([595.28, 841.89]);
       rowY = newPageStartY;
       
       // Draw table header on new page
       const headerY = rowY;
       currentPage.drawLine({ 
         start: { x: leftMargin, y: headerY }, 
         end: { x: width - leftMargin, y: headerY }, 
         thickness: 1.5, 
         color: rgb(0, 0, 0) 
       });
       currentPage.drawText('Description', { x: col1X, y: headerY - 18, size: 12, font: helveticaBold });
       currentPage.drawText('Quantity', { x: col2X, y: headerY - 18, size: 12, font: helveticaBold });
       currentPage.drawText('Unit Price', { x: col3X, y: headerY - 18, size: 12, font: helveticaBold });
       currentPage.drawText('Amount', { x: col4X, y: headerY - 18, size: 12, font: helveticaBold });
       currentPage.drawLine({ 
         start: { x: leftMargin, y: headerY - 30 }, 
         end: { x: width - leftMargin, y: headerY - 30 }, 
         thickness: 1, 
         color: rgb(0, 0, 0) 
       });
       
       // Update rowY to be below the header
       rowY = headerY - 50; // 30px for header bottom line + 20px spacing
     }
     
     currentPage.drawText(item.desc, { x: col1X, y: rowY, size: 11, font: helvetica });
     currentPage.drawText(`${item.qty.toFixed(1)} Liters`, { x: col2X, y: rowY, size: 11, font: helvetica });
     currentPage.drawText(`Rs. ${item.rate}`, { x: col3X, y: rowY, size: 11, font: helvetica });
     currentPage.drawText(`Rs. ${item.amt.toLocaleString()}`, { x: col4X, y: rowY, size: 11, font: helvetica });
     
     currentBillTotal += item.amt;
     rowY -= rowHeight; // Move down for next row
  });

  // --- 4. TOTALS SECTION ---
  
  // Check if we need a new page for totals
  // Totals start at (rowY - 40) and take ~60px height, ending at (rowY - 100)
  // We need 50px bottom margin, so totals end must be >= 50, meaning rowY >= 150
  if (rowY < 150) {
    currentPage = pdfDoc.addPage([595.28, 841.89]);
    rowY = newPageStartY;
  }
  
  // Position totals below the last row
  const totalsY = rowY - 40;
  const labelX = 380;
  const valueX = 480;

  const dueAmount = billing.dueAmount || 0;
  const discount = billing.discount || 0;
  const payable = currentBillTotal + dueAmount - discount;

  // Total Label & Value
  currentPage.drawText('Total:', { x: labelX, y: totalsY, size: 12, font: helveticaBold });
  currentPage.drawText(`Rs. ${currentBillTotal.toLocaleString()}`, { x: valueX, y: totalsY, size: 12, font: helveticaBold });

  // Due Amount
  currentPage.drawText('Due Amount:', { x: labelX, y: totalsY - 20, size: 11, font: helvetica });
  currentPage.drawText(`Rs. ${dueAmount.toLocaleString()}`, { x: valueX, y: totalsY - 20, size: 11, font: helvetica });

  // Discount
  currentPage.drawText('Discount:', { x: labelX, y: totalsY - 40, size: 11, font: helvetica });
  currentPage.drawText(`Rs. ${discount.toLocaleString()}`, { x: valueX, y: totalsY - 40, size: 11, font: helvetica });

  // Payable
  currentPage.drawText('Payable:', { x: labelX, y: totalsY - 60, size: 11, font: helvetica });
  currentPage.drawText(`Rs. ${payable.toLocaleString()}`, { x: valueX, y: totalsY - 60, size: 11, font: helvetica });


  // --- 5. FOOTER ---
  
  // Footer needs 90px of space for content. Calculate where it would start and end.
  const footerHeight = 90;
  const footerStartY = totalsY - 95; // Compact gap between totals and footer (Payable ends at totalsY - 60, giving ~35px gap)
  const footerEndY = footerStartY - footerHeight;
  
  // Only create new page if footer would go below 40px from bottom (minimum margin)
  if (footerEndY < 40) {
    currentPage = pdfDoc.addPage([595.28, 841.89]);
    const newFooterStartY = height - 100; // Position near top of new page (100px from top)
    
    // Line 1: Heading
    const termHeader = "Payment Terms";
    const termHeaderWidth = helveticaBold.widthOfTextAtSize(termHeader, 12);
    currentPage.drawText(termHeader, {
        x: (width - termHeaderWidth) / 2,
        y: newFooterStartY,
        size: 12,
        font: helveticaBold
    });

    // Line 2: Instruction
    const instruction = "Please make payment to the following account:";
    const instructionWidth = helvetica.widthOfTextAtSize(instruction, 10);
    currentPage.drawText(instruction, {
        x: (width - instructionWidth) / 2,
        y: newFooterStartY - 18,
        size: 10,
        font: helvetica
    });

    // Line 3: Account Holder (Bold)
    const accHolder = "Account Title: Inzimam Ul Haq";
    const accHolderWidth = helveticaBold.widthOfTextAtSize(accHolder, 12);
    currentPage.drawText(accHolder, {
        x: (width - accHolderWidth) / 2,
        y: newFooterStartY - 40,
        size: 12,
        font: helveticaBold
    });

    // Line 4: Faysal Bank (Bigger, Bold)
    const faysalBank = "Faysal Bank: 3309301000001174";
    const faysalBankWidth = helveticaBold.widthOfTextAtSize(faysalBank, 14);
    currentPage.drawText(faysalBank, {
        x: (width - faysalBankWidth) / 2,
        y: newFooterStartY - 60,
        size: 14,
        font: helveticaBold
    });

    // Line 5: Closing
    const thanksText = "Thank you for your continued trust and business!";
    const thanksWidth = helveticaBold.widthOfTextAtSize(thanksText, 12);
    currentPage.drawText(thanksText, { 
        x: (width - thanksWidth) / 2, 
        y: newFooterStartY - 90, 
        size: 12, 
        font: helveticaBold 
    });
  } else {
    // Draw footer on current page
    // Line 1: Heading
    const termHeader = "Payment Terms";
    const termHeaderWidth = helveticaBold.widthOfTextAtSize(termHeader, 12);
    currentPage.drawText(termHeader, {
        x: (width - termHeaderWidth) / 2,
        y: footerStartY,
        size: 12,
        font: helveticaBold
    });

    // Line 2: Instruction
    const instruction = "Please make payment to the following account:";
    const instructionWidth = helvetica.widthOfTextAtSize(instruction, 10);
    currentPage.drawText(instruction, {
        x: (width - instructionWidth) / 2,
        y: footerStartY - 18,
        size: 10,
        font: helvetica
    });

    // Line 3: Account Holder (Bold)
    const accHolder = "Account Title: Inzimam Ul Haq";
    const accHolderWidth = helveticaBold.widthOfTextAtSize(accHolder, 12);
    currentPage.drawText(accHolder, {
        x: (width - accHolderWidth) / 2,
        y: footerStartY - 40,
        size: 12,
        font: helveticaBold
    });

    // Line 4: Faysal Bank (Bigger, Bold)
    const faysalBank = "Faysal Bank: 3309301000001174";
    const faysalBankWidth = helveticaBold.widthOfTextAtSize(faysalBank, 14);
    currentPage.drawText(faysalBank, {
        x: (width - faysalBankWidth) / 2,
        y: footerStartY - 60,
        size: 14,
        font: helveticaBold
    });

    // Line 5: Closing
    const thanksText = "Thank you for your continued trust and business!";
    const thanksWidth = helveticaBold.widthOfTextAtSize(thanksText, 12);
    currentPage.drawText(thanksText, { 
        x: (width - thanksWidth) / 2, 
        y: footerStartY - 90, 
        size: 12, 
        font: helveticaBold 
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

/**
 * Generate PDF and convert to PNG image (all pages stacked vertically)
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
    
    const scale = 2; // Higher scale for better quality
    const pageGap = 20; // Gap between pages in pixels
    
    // Render all pages and collect their canvases
    const pageCanvases: HTMLCanvasElement[] = [];
    let totalHeight = 0;
    let maxWidth = 0;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Rendering page ${pageNum}...`);
      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Render page to canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await pdfPage.render(renderContext as any).promise;
      console.log(`Page ${pageNum} rendered: ${viewport.width}x${viewport.height}`);
      
      pageCanvases.push(canvas);
      totalHeight += viewport.height;
      if (pageNum < pdf.numPages) {
        totalHeight += pageGap; // Add gap between pages
      }
      maxWidth = Math.max(maxWidth, viewport.width);
    }
    
    console.log(`All pages rendered. Creating combined image: ${maxWidth}x${totalHeight}`);
    
    // Create final canvas that will contain all pages stacked vertically
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = maxWidth;
    finalCanvas.height = totalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (!finalCtx) throw new Error('Could not get final canvas context');
    
    // Fill with white background
    finalCtx.fillStyle = 'white';
    finalCtx.fillRect(0, 0, maxWidth, totalHeight);
    
    // Draw each page canvas onto the final canvas
    let currentY = 0;
    pageCanvases.forEach((canvas, index) => {
      finalCtx.drawImage(canvas, 0, currentY);
      currentY += canvas.height;
      if (index < pageCanvases.length - 1) {
        currentY += pageGap; // Add gap after each page except the last
      }
    });
    
    console.log('All pages combined into single image');
    
    // Convert final canvas to blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob((blob) => {
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
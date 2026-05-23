const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Generator Utility
 * 
 * Creates a professional fee receipt in PDF format.
 */

/**
 * Generate Fee Receipt PDF
 * @param {Object} data - Receipt data
 * @returns {Promise<Object>} Object containing filePath and downloadUrl
 */
const generateFeeReceipt = async (data) => {
  const { 
    receiptNumber, 
    date, 
    studentName, 
    class: className, 
    rollNumber, 
    paidAmount, 
    dueAmount, 
    paymentMode = 'Cash/Online' 
  } = data;

  const fileName = `Receipt_${receiptNumber}.pdf`;
  const dirPath = path.join(__dirname, '../uploads/receipts');
  const filePath = path.join(dirPath, fileName);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- Header ---
    const logoPath = path.join(__dirname, '../assets/schoollogo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 45, height: 45 });
      
      doc.fillColor('#1e293b')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('LITTLE FLOWER ENGLISH SCHOOL', 110, 50)
         .fontSize(8)
         .font('Helvetica')
         .fillColor('#64748b')
         .text('Meerut Road, Little Flower Campus, Siwan, Bihar, India', 110, 68)
         .text('Email: contact@littleflowerschool.edu.in | Web: www.littleflowerschool.edu.in', 110, 80);
    } else {
      doc.fillColor('#444444')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('LITTLE FLOWER ENGLISH SCHOOL ERP', 50, 57)
         .fontSize(10)
         .font('Helvetica')
         .text('Meerut Road, Little Flower Campus', 200, 65, { align: 'right' })
         .text('Siwan, Bihar, India', 200, 80, { align: 'right' });
    }
    doc.moveDown();

    // Line separator
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 105)
       .lineTo(550, 105)
       .stroke();

    // --- Receipt Info ---
    doc.fillColor('#000000')
       .fontSize(20)
       .text('FEE RECEIPT', 50, 120);

    doc.fontSize(10)
       .text(`Receipt Number: ${receiptNumber}`, 50, 150)
       .text(`Date: ${new Date(date).toLocaleDateString()}`, 50, 165)
       .text(`Payment Mode: ${paymentMode}`, 50, 180);

    // --- Student Info ---
    doc.fontSize(12)
       .text('STUDENT DETAILS', 50, 210, { underline: true });

    doc.fontSize(10)
       .text(`Name: ${studentName}`, 50, 230)
       .text(`Class: ${className}`, 50, 245)
       .text(`Roll Number: ${rollNumber}`, 50, 260);

    // --- Payment Details ---
    const tableTop = 300;
    doc.fontSize(12)
       .text('PAYMENT SUMMARY', 50, tableTop, { underline: true });

    doc.fontSize(10)
       .text('Description', 50, tableTop + 30)
       .text('Amount (INR)', 400, tableTop + 30, { align: 'right' });

    doc.strokeColor('#eeeeee')
       .moveTo(50, tableTop + 45)
       .lineTo(550, tableTop + 45)
       .stroke();

    doc.text('Current Payment', 50, tableTop + 60)
       .text((paidAmount || 0).toFixed(2), 400, tableTop + 60, { align: 'right' });

    doc.fontSize(12)
       .fillColor('#ff0000')
       .text('DUE AMOUNT', 50, tableTop + 90)
       .text((dueAmount || 0).toFixed(2), 400, tableTop + 90, { align: 'right' });

    // --- Footer ---
    doc.fillColor('#444444')
       .fontSize(10)
       .text('This is a computer generated receipt and does not require a physical signature.', 50, 700, { align: 'center', width: 500 });

    doc.end();

    stream.on('finish', () => {
      resolve({
        filePath,
        downloadUrl: `/uploads/receipts/${fileName}`
      });
    });

    stream.on('error', reject);
  });
};

module.exports = { generateFeeReceipt };

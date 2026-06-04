const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const FeeLedger = require('../models/FeeLedger');
const FeeTransaction = require('../models/FeeTransaction');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Delete ledgers for 2026-2027
    const ledgerResult = await FeeLedger.deleteMany({ academicYear: '2026-2027' });
    console.log(`Deleted ${ledgerResult.deletedCount} faulty ledgers for academicYear '2026-2027'.`);

    // Delete transactions for 2026-2027
    const transactionResult = await FeeTransaction.deleteMany({ academicYear: '2026-2027' });
    console.log(`Deleted ${transactionResult.deletedCount} transactions for academicYear '2026-2027'.`);

    console.log("Cleanup completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanup();

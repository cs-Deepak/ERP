const mongoose = require('mongoose');

const feeLedgerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g., 2024-25)'],
      trim: true,
      index: true,
    },
    monthlyFees: [
      {
        month: {
          type: String,
          required: [true, 'Month name is required'],
          enum: [
            'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December', 'January', 'February', 'March'
          ],
        },
        amount: {
          type: Number,
          required: [true, 'Fee amount is required'],
          min: [0, 'Amount cannot be negative'],
        },
        paidAmount: {
          type: Number,
          default: 0,
          min: [0, 'Paid amount cannot be negative'],
        },
        status: {
          type: String,
          enum: ["PAID", "PARTIAL", "UNPAID", "EXEMPTED"],
          default: "UNPAID",
        },
        paidOn: {
          type: Date,
        },
      },
    ],
    totalFee: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a student's ledger for a specific year
feeLedgerSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

// Pre-save middleware to calculate totals and status
feeLedgerSchema.pre('save', async function () {
  if (this.monthlyFees && this.monthlyFees.length > 0) {
    this.monthlyFees.forEach((month) => {
      if (month.status === "EXEMPTED") {
        month.amount = 0;
        month.paidAmount = 0;
      } else if (month.paidAmount >= month.amount) {
        month.status = "PAID";
      } else if (month.paidAmount > 0) {
        month.status = "PARTIAL";
      } else {
        month.status = "UNPAID";
      }
    });

    this.totalFee = this.monthlyFees.reduce((acc, curr) => acc + curr.amount, 0);
    this.totalPaid = this.monthlyFees.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    this.pendingAmount = this.totalFee - this.totalPaid;
  }
});

module.exports = mongoose.model('FeeLedger', feeLedgerSchema);

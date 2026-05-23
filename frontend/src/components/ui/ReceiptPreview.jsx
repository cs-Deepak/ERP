import React from "react";
import {
  Printer,
  Download,
  CheckCircle2,
  Receipt as ReceiptIcon,
  ShieldCheck,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";
import Button from "./Button";
import { cn } from "../../utils/cn";
import { formatToINR } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import SchoolLogo from "./SchoolLogo";

const ReceiptPreview = ({ transaction, student, className }) => {
  const { addToast } = useToast();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      addToast("Preparing your professional receipt...", "info");

      // Use the actual transaction ID from the data
      const downloadId = transaction.mongoId || transaction.id;

      const res = await api.get(`/fees/receipt/${downloadId}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `receipt_${transaction.studentName.replace(/\s+/g, "_")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
      addToast("Receipt downloaded successfully", "success");
    } catch (error) {
      console.error("Receipt Download Error:", error);
      addToast("Failed to generate digital receipt", "error");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Success Decoration */}
      <div className="flex flex-col items-center text-center space-y-2 mb-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner animate-in zoom-in-50 duration-500">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-xl font-black text-gray-900">Payment Received</h4>
        <p className="text-xs text-gray-500 font-medium">
          Little Flower English School Digital Ledger Entry #{" "}
          {transaction.id.split("-")[1] || "NEW"}
        </p>
      </div>

      {/* The Actual Receipt Card */}
      <div
        id="receipt-content"
        className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-sm"
      >
        {/* Anti-fraud watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-12">
          <ShieldCheck size={400} />
        </div>

        {/* School Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-8 gap-4 relative">
          <div className="flex items-center gap-4">
            <SchoolLogo className="w-14 h-14" />
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                LITTLE FLOWER ENGLISH SCHOOL
              </h2>
              <div className="flex flex-col text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> Meerut Road, Little Flower Campus
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={10} /> www.littleflowerschool.edu.in
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
              Official Fee Receipt
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Receipt No:{" "}
              <span className="text-gray-900">{transaction.id}</span>
            </p>
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Date: <span className="text-gray-900">{transaction.date}</span>
            </p>
          </div>
        </div>

        {/* Student Details Section */}
        <div className="grid grid-cols-2 gap-10 relative">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Received From
              </p>
              <p className="text-lg font-black text-gray-900 leading-tight">
                {transaction.studentName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Class / Section
              </p>
              <p className="text-sm font-bold text-gray-700">
                {student?.class || "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-4 text-right">
            <div>
              <p className="text-[10px) font-black text-gray-400 uppercase tracking-widest mb-1">
                Roll Number
              </p>
              <p className="text-lg font-black text-gray-900 leading-tight">
                {transaction.roll}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Academic Year
              </p>
              <p className="text-sm font-bold text-gray-700">2025 - 2026</p>
            </div>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-gray-50/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 flex items-center justify-between relative group hover:bg-gray-50 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Transaction Amount
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-indigo-700">
                {formatToINR(transaction.amount)}
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Payment Mode
            </p>
            <div className="flex items-center justify-end gap-2 text-indigo-700">
              <span className="font-black uppercase text-sm tracking-tight">
                {transaction.mode}
              </span>
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ReceiptIcon size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Verification */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-4 relative">
          <div className="max-w-[300px] space-y-2">
            <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
              * This is a computer generated receipt and does not require a
              physical signature. The payment is subject to realization for
              non-cash modes.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
              <ShieldCheck size={14} />
              <span>Verified Digitally</span>
            </div>
          </div>

          <div className="text-center w-full md:w-auto">
            <div className="w-32 h-1 bg-gray-100 mx-auto mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Authorized Registrar
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="secondary"
          icon={Printer}
          onClick={handlePrint}
          className="flex-1 rounded-2xl border-gray-100 h-14 font-black"
        >
          Print Receipt
        </Button>
        <Button
          variant="primary"
          icon={Download}
          onClick={handleDownload}
          className="flex-1 rounded-2xl shadow-xl shadow-indigo-100 h-14 font-black"
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
};

export default ReceiptPreview;

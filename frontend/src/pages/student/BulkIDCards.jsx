import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  FileText,
  Palette,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle,
  BadgeInfo,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import SchoolLogo from "../../components/ui/SchoolLogo";
import { cn } from "../../utils/cn";

// Color themes
const CARD_THEMES = [
  { id: "sapphire", name: "Sapphire Blue", primary: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-100", gradient: "from-indigo-600 to-blue-500", light: "bg-indigo-50/50" },
  { id: "crimson", name: "Crimson Red", primary: "bg-rose-600", text: "text-rose-600", border: "border-rose-100", gradient: "from-rose-600 to-red-500", light: "bg-rose-50/50" },
  { id: "emerald", name: "Emerald Green", primary: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-100", gradient: "from-emerald-600 to-teal-500", light: "bg-emerald-50/50" },
  { id: "golden", name: "Golden Sun", primary: "bg-amber-600", text: "text-amber-600", border: "border-amber-100", gradient: "from-amber-500 to-yellow-400", light: "bg-amber-50/50" },
  { id: "charcoal", name: "Charcoal", primary: "bg-slate-800", text: "text-slate-800", border: "border-slate-200", gradient: "from-slate-800 to-slate-600", light: "bg-slate-50" },
];

const BulkIDCards = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(CARD_THEMES[0]);
  const [orientation, setOrientation] = useState("portrait");
  
  // Progress states
  const [downloading, setDownloading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Dynamic host URL resolution for photo serving
  const apiHost = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : "";

  useEffect(() => {
    const fetchStudentsBatch = async () => {
      try {
        setLoading(true);
        const idsString = searchParams.get("ids");
        if (!idsString) {
          addToast("No student records selected for generation", "error");
          navigate("/students");
          return;
        }

        const idsArray = idsString.split(",");
        
        // Sequential retrieval to gather clean population data for all selected IDs
        const gatheredStudents = [];
        for (let i = 0; i < idsArray.length; i++) {
          const res = await api.get(`/students/${idsArray[i]}/profile`);
          if (res.data.success) {
            gatheredStudents.push(res.data.data);
          }
        }

        setStudents(gatheredStudents);
      } catch (error) {
        console.error("Bulk ID card loading failed:", error);
        addToast("Failed to load selected student records", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsBatch();
  }, [searchParams]);

  const handlePrintAll = () => {
    window.print();
  };

  // Optimized sequential PDF downloader to avoid high-DPI canvas memory spikes or browser crashes
  const handleExportPDF = async () => {
    if (students.length === 0) return;
    
    try {
      setDownloading(true);
      setProgressPercent(0);
      setProgressText(`Starting generation of ${students.length} ID cards...`);

      // Initialize jsPDF document (A4 Portrait)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const options = {
        scale: 2.5, // Well-balanced scale: highly sharp and extremely lightweight
        useCORS: true,
        backgroundColor: null,
        logging: false,
      };

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setProgressText(`Converting card ${i + 1} of ${students.length} (${student.personalDetails?.name})...`);
        setProgressPercent(Math.round(((i) / students.length) * 100));

        const frontEl = document.getElementById(`front-${student.personalDetails?.studentId}`);
        const backEl = document.getElementById(`back-${student.personalDetails?.studentId}`);

        if (!frontEl || !backEl) continue;

        // Render card canvases sequentially
        const frontCanvas = await html2canvas(frontEl, options);
        const backCanvas = await html2canvas(backEl, options);

        const frontImg = frontCanvas.toDataURL("image/png");
        const backImg = backCanvas.toDataURL("image/png");

        // Add page divider except for first record
        if (i > 0) {
          pdf.addPage();
        }

        // Add A4 decorative header
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(30, 41, 59); // Slate 800
        pdf.text("LBS PUBLIC SCHOOL — OFFICIAL STUDENT IDENTIFICATIONS", 105, 20, { align: "center" });

        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // Slate 400
        pdf.text(`ACADEMIC YEAR: 2026-2027  |  PAGE ${i + 1} OF ${students.length}`, 105, 25, { align: "center" });

        // Add line divider
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.4);
        pdf.line(20, 28, 190, 28);

        // Position card front & back side-by-side
        if (orientation === "portrait") {
          const cardW = 60;
          const cardH = 90;
          const yCoord = 45;

          pdf.addImage(frontImg, "PNG", 30, yCoord, cardW, cardH);
          pdf.addImage(backImg, "PNG", 120, yCoord, cardW, cardH);

          // Cutting grey borders
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineDashMode([1.5, 1.5], 0);
          pdf.rect(30, yCoord, cardW, cardH, "D");
          pdf.rect(120, yCoord, cardW, cardH, "D");
        } else {
          const cardW = 90;
          const cardH = 60;
          const yCoord1 = 45;
          const yCoord2 = 120;

          pdf.addImage(frontImg, "PNG", 60, yCoord1, cardW, cardH);
          pdf.addImage(backImg, "PNG", 60, yCoord2, cardW, cardH);

          // Cutting grey borders
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineDashMode([1.5, 1.5], 0);
          pdf.rect(60, yCoord1, cardW, cardH, "D");
          pdf.rect(60, yCoord2, cardW, cardH, "D");
        }

        // Instructions Footer
        pdf.setDrawColor(0);
        pdf.setLineDashMode([], 0);
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text("OFFICIAL ASSEMBLY INSTRUCTIONS:", 20, 200);

        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text("1. Print this record sheet on premium card stock (220 GSM or higher) at 100% scale.", 20, 207);
        pdf.text("2. Carefully trim the front and back card pieces along the dotted grey guidelines.", 20, 212);
        pdf.text("3. Place both pieces back-to-back, glue securely, and laminate for maximum protection.", 20, 217);
      }

      setProgressPercent(100);
      setProgressText("Downloading PDF document...");
      pdf.save(`lbs-bulk-idcards-${Date.now()}.pdf`);
      addToast(`Batch export of ${students.length} ID cards successful!`, "success");
    } catch (err) {
      console.error("Bulk PDF export failed:", err);
      addToast("Failed to compile bulk ID cards PDF", "error");
    } finally {
      setDownloading(false);
      setProgressText("");
    }
  };

  // Inline Mock barcode renderer
  const renderBarcode = () => (
    <svg className="w-full h-11 shrink-0" viewBox="0 0 100 20" preserveAspectRatio="none">
      <rect x="0" y="0" width="1.5" height="20" fill="black" />
      <rect x="3" y="0" width="0.7" height="20" fill="black" />
      <rect x="5" y="0" width="2" height="20" fill="black" />
      <rect x="9" y="0" width="1.2" height="20" fill="black" />
      <rect x="14" y="0" width="2.5" height="20" fill="black" />
      <rect x="18" y="0" width="1" height="20" fill="black" />
      <rect x="23" y="0" width="2" height="20" fill="black" />
      <rect x="27" y="0" width="1.5" height="20" fill="black" />
      <rect x="32" y="0" width="2.2" height="20" fill="black" />
      <rect x="38" y="0" width="1.8" height="20" fill="black" />
      <rect x="44" y="0" width="0.5" height="20" fill="black" />
      <rect x="46" y="0" width="2.8" height="20" fill="black" />
      <rect x="50" y="0" width="1.2" height="20" fill="black" />
      <rect x="55" y="0" width="2.1" height="20" fill="black" />
      <rect x="59" y="0" width="1.4" height="20" fill="black" />
      <rect x="64" y="0" width="2" height="20" fill="black" />
      <rect x="68" y="0" width="1" height="20" fill="black" />
      <rect x="73" y="0" width="2.5" height="20" fill="black" />
      <rect x="77" y="0" width="1.5" height="20" fill="black" />
      <rect x="83" y="0" width="2" height="20" fill="black" />
      <rect x="87" y="0" width="1.2" height="20" fill="black" />
      <rect x="92" y="0" width="2.4" height="20" fill="black" />
      <rect x="98" y="0" width="1.5" height="20" fill="black" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <h3 className="text-lg font-black text-gray-800">Compiling selected records...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 print:bg-white print:p-0">
      
      {/* 1. Stepper Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/students")}
            className="p-3 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
              Bulk Credential Console
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
              Generate ID Cards ({students.length})
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            disabled={downloading}
            onClick={handleExportPDF}
            className={cn(
              "flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50",
              downloading && "cursor-wait"
            )}
          >
            <FileText size={18} className={cn(downloading && "animate-pulse")} />
            <span>{downloading ? "Exporting PDF..." : "Export All to PDF"}</span>
          </button>

          <button
            disabled={downloading}
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Printer size={18} />
            <span>Print All Cards</span>
          </button>
        </div>
      </div>

      {/* 2. Customizers Toolbar (hidden during print) */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Layers size={14} /> Layout:
          </span>
          <div className="flex border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setOrientation("portrait")}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-all",
                orientation === "portrait" ? "bg-indigo-50 text-indigo-700 font-extrabold" : "bg-white text-gray-500 hover:bg-gray-50"
              )}
            >
              Portrait Card
            </button>
            <button
              onClick={() => setOrientation("landscape")}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-all",
                orientation === "landscape" ? "bg-indigo-50 text-indigo-700 font-extrabold" : "bg-white text-gray-500 hover:bg-gray-50"
              )}
            >
              Landscape Card
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={14} /> Theme:
          </span>
          {CARD_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
                theme.id === t.id
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className={cn("w-3 h-3 rounded-full", t.primary)} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Progress status overlay */}
      {downloading && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 text-center space-y-4 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between text-sm font-bold text-indigo-700">
            <span>{progressText}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. The ID Cards Preview List */}
      <div className="space-y-12 p-8 bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] print:bg-white print:p-0 print:border-none">
        
        {students.map((student, index) => {
          const { personalDetails, academicDetails, contactDetails } = student;
          const validityYear = new Date().getFullYear() + 4;
          
          // Photo path resolution
          const photoUrl = personalDetails?.studentPhoto
            ? (personalDetails.studentPhoto.startsWith("http") || personalDetails.studentPhoto.startsWith("data:")
              ? personalDetails.studentPhoto
              : `${apiHost}${personalDetails.studentPhoto}`)
            : null;

          // QR code resolution
          const qrCodeUrl = personalDetails?.qrCode
            ? (personalDetails.qrCode.startsWith("http") || personalDetails.qrCode.startsWith("data:")
              ? personalDetails.qrCode
              : `${apiHost}${personalDetails.qrCode}`)
            : null;

          return (
            <div
              key={student._id || index}
              className={cn(
                "flex flex-col items-center justify-center gap-8 border-b border-gray-200 pb-12 last:border-none print:pb-0 print:border-none print:page-break-after-always",
                orientation === "landscape" ? "lg:flex-row lg:gap-10" : "md:flex-row md:gap-12"
              )}
            >
              
              {/* Card A: FRONT */}
              <div
                id={`front-${personalDetails?.studentId}`}
                className={cn(
                  "bg-white border border-gray-200 rounded-[2.25rem] shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0 font-sans print:shadow-none print:border print:border-gray-300",
                  orientation === "portrait" ? "w-[300px] h-[450px]" : "w-[450px] h-[300px]"
                )}
              >
                {/* Header wave */}
                <div className={cn("bg-gradient-to-r p-5 shrink-0 flex items-center gap-3 justify-between relative", theme.gradient)}>
                  <div className="flex items-center gap-2">
                    <SchoolLogo className="w-8 h-8 flex-shrink-0 bg-white/10 p-0.5 rounded-lg border border-white/20 text-white" showText={false} />
                    <div className="text-left leading-tight">
                      <h4 className="text-[12px] font-black text-white uppercase tracking-wider leading-none">
                        LBS Public School
                      </h4>
                      <p className="text-[7.5px] font-bold text-white/80 uppercase tracking-widest leading-none mt-0.5">
                        Educating for Excellence
                      </p>
                    </div>
                  </div>
                  <div className="text-right leading-none">
                    <span className="text-[8px] font-black bg-white/20 text-white border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Student
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={cn("flex-1 p-5 flex", orientation === "portrait" ? "flex-col items-center justify-between text-center" : "flex-row items-center justify-between text-left gap-4")}>
                  
                  {/* Photo area */}
                  <div className={cn("shrink-0 relative flex items-center justify-center", orientation === "portrait" ? "mt-2" : "ml-2")}>
                    <div className={cn("w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 border border-gray-100 shadow-inner overflow-hidden", theme.border)}>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={personalDetails?.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span className="text-3xl font-black text-gray-300 tracking-tighter uppercase shrink-0">
                          {(personalDetails?.name || "??")
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div className={cn("absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-sm", theme.primary)}>
                      ACTIVE
                    </div>
                  </div>

                  {/* Fields */}
                  <div className={cn("flex-1 space-y-3.5", orientation === "portrait" ? "w-full mt-4" : "space-y-2.5")}>
                    <div>
                      <h3 className={cn("text-lg font-black uppercase tracking-tight leading-tight", theme.text)}>
                        {personalDetails?.name}
                      </h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-0.5">
                        Class: {academicDetails?.className} - {academicDetails?.section}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50">
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Student ID</span>
                        <span className="text-[10px] font-black font-mono text-gray-700 mt-0.5 block">{personalDetails?.studentId || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Roll Number</span>
                        <span className="text-[10px] font-black text-gray-700 mt-0.5 block">{personalDetails?.rollNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer barcode */}
                <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/40 shrink-0 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider block">Academic Session</span>
                    <span className="text-[9px] font-black text-gray-700 block mt-0.5">{academicDetails?.session || "2026-2027"}</span>
                  </div>

                  <div className="w-28 opacity-85">
                    {renderBarcode()}
                  </div>
                </div>

              </div>

              {/* Card B: BACK */}
              <div
                id={`back-${personalDetails?.studentId}`}
                className={cn(
                  "bg-white border border-gray-200 rounded-[2.25rem] shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0 font-sans print:shadow-none print:border print:border-gray-300",
                  orientation === "portrait" ? "w-[300px] h-[450px]" : "w-[450px] h-[300px]"
                )}
              >
                {/* Back emergency header */}
                <div className="px-5 py-4.5 border-b border-gray-50 bg-gray-50/40 flex items-center gap-2 shrink-0">
                  <BadgeInfo className={cn("w-5 h-5", theme.text)} />
                  <div>
                    <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-wider leading-none">
                      Emergency Information
                    </h4>
                    <p className="text-[7px] font-bold text-gray-400 uppercase mt-0.5 leading-none">
                      If found, please notify the LBS administration
                    </p>
                  </div>
                </div>

                {/* Back info list */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-4 text-xs font-semibold text-gray-600">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2">
                      <span className="text-[8.5px] font-black text-gray-400 uppercase block shrink-0 w-20">Guardian</span>
                      <span className="text-[10px] font-bold text-gray-800 text-right">{contactDetails?.parentName}</span>
                    </div>
                    
                    <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2">
                      <span className="text-[8.5px] font-black text-gray-400 uppercase block shrink-0 w-20">Emergency Call</span>
                      <span className="text-[10px] font-bold text-gray-800 font-mono text-right">{contactDetails?.parentMobile}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2 pb-1">
                      <span className="text-[8.5px] font-black text-gray-400 uppercase block shrink-0 w-20">Address</span>
                      <span className="text-[9px] font-semibold text-gray-600 text-right leading-tight max-w-[200px] truncate-3-lines">
                        {contactDetails?.address || "LBS School Housing Colony Campus, New Delhi"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[7px] font-semibold text-slate-500 leading-normal">
                    This identity card is the property of LBS Public School and is non-transferable.
                    Cardholders must carry it while on school premises at all times.
                  </div>

                </div>

                {/* Back QR and Principal footer */}
                <div className="px-5 py-4.5 border-t border-gray-50 bg-gray-50/50 shrink-0 flex items-center justify-between">
                  
                  <div className="flex items-center gap-2.5">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="ID QR Code"
                        className="w-14 h-14 shrink-0 border border-gray-100 p-0.5 rounded-lg bg-white object-contain"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-gray-300">QR</div>
                    )}
                    <div className="text-left">
                      <span className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider block">Authorized Signatory</span>
                      <p className="text-[10px] font-black text-gray-800 italic font-serif mt-1">Principal</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[7px] font-bold text-gray-400 uppercase block leading-none">Administration Phone</span>
                    <span className="text-[9px] font-black text-gray-800 mt-1 block leading-none">+91-11-2345678</span>
                  </div>

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* Print Specific CSS stylesheet */}
      <style>{`
        @media print {
          header, 
          aside,
          .print\\:hidden,
          nav,
          div.print\\:hidden {
            display: none !important;
          }
          
          body, html, main, #root, div.flex-1 {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }

          div.space-y-12.p-8 {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: none !important;
            display: block !important;
          }

          div.last\\:border-none {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 40px !important;
            margin-top: 3cm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          #idcard-front, #idcard-back {
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkIDCards;

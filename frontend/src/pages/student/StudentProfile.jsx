import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  GraduationCap,
  MapPin,
  Phone,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
  BadgeInfo,
  CreditCard,
  UserSquare2,
  UserCheck,
  Percent,
  CalendarCheck2,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attLoading, setAttLoading] = useState(true);

  // Dynamic API host resolution for static assets (studentPhoto, qrCode)
  const apiHost = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : "";

  const fetchProfile = React.useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await api.get(`/students/${studentId}/profile`);
        if (res.data.success) {
          setStudent(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [studentId]
  );

  const fetchAttendance = React.useCallback(
    async () => {
      try {
        setAttLoading(true);
        // Find MongoDB _id or custom studentId first
        let idToQuery = studentId;
        
        // Fetch profile if student is not loaded to get MongoDB _id
        let targetDbId = null;
        if (student && student.personalDetails) {
          targetDbId = student.personalDetails._id || student._id;
        } else {
          const profileRes = await api.get(`/students/${studentId}/profile`);
          if (profileRes.data.success && profileRes.data.data) {
            targetDbId = profileRes.data.data._id || profileRes.data.data.personalDetails?._id;
          }
        }

        if (targetDbId) {
          const res = await api.get(`/admin/attendance/student/${targetDbId}`);
          if (res.data.success) {
            setAttendance(res.data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching student attendance report:", error);
      } finally {
        setAttLoading(false);
      }
    },
    [studentId, student]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (student) {
      fetchAttendance();
    }
  }, [student, fetchAttendance]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-10 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 h-64 bg-gray-200 rounded-[2.5rem]" />
          <div className="md:col-span-2 h-64 bg-gray-200 rounded-[2.5rem]" />
        </div>
        <div className="h-96 bg-gray-200 rounded-[2.5rem]" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle size={48} className="text-gray-300 animate-bounce" />
        <h2 className="text-2xl font-black text-gray-900">Student Record Not Found</h2>
        <Button onClick={() => navigate("/students")} icon={ArrowLeft} className="rounded-2xl">
          Back to Directory
        </Button>
      </div>
    );
  }

  const { personalDetails, academicDetails, contactDetails, feeSummary } = student;

  // Resolve photo URL
  const photoUrl = personalDetails?.studentPhoto
    ? (personalDetails.studentPhoto.startsWith("http") || personalDetails.studentPhoto.startsWith("data:")
      ? personalDetails.studentPhoto
      : `${apiHost}${personalDetails.studentPhoto}`)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 animate-in fade-in duration-500 pb-20 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 1. Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/students")}
              className="p-3 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Student Profile
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Comprehensive academic overview & transaction details
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/students/${personalDetails.studentId || studentId}/idcard`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-all shadow-sm"
              title="ID Card Builder"
            >
              <UserSquare2 size={16} />
              <span>ID Card Operations</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              title="Print Page"
            >
              <Printer size={16} />
              <span>Print Profile</span>
            </button>
          </div>
        </div>

        {/* 2. Identity Header Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 text-center sm:text-left">
            
            {/* Student Avatar/Photo thumbnail */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-indigo-100 border-4 border-white shrink-0 overflow-hidden uppercase">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={personalDetails?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {(personalDetails?.name || "??")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-1 w-full">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {personalDetails?.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <span className="px-3 py-1 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 whitespace-nowrap">
                  ID: <span className="font-mono">{personalDetails?.studentId}</span>
                </span>
                <span className="px-3 py-1 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 whitespace-nowrap">
                  Roll No: {personalDetails?.rollNumber}
                </span>
                <span className="px-3 py-1 bg-indigo-50/50 rounded-xl text-xs font-bold text-indigo-700 border border-indigo-100/30 whitespace-nowrap">
                  Class: {academicDetails?.className} {academicDetails?.section}
                </span>
                <span
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap",
                    personalDetails?.status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                >
                  {personalDetails?.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Analytics Block Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Assessment Dues */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold shrink-0">
              ₹
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">
                Total assessed fee
              </span>
              <span className="text-xl font-black text-gray-800 block mt-1.5 truncate">
                ₹{feeSummary?.totalFee.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          {/* Settled payments */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block leading-none">
                Payments Cleared
              </span>
              <span className="text-xl font-black text-emerald-700 block mt-1.5 truncate">
                ₹{feeSummary?.totalPaid.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          {/* Outstanding balances */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block leading-none">
                Outstanding dues
              </span>
              <span className="text-xl font-black text-rose-700 block mt-1.5 truncate">
                ₹{feeSummary?.pendingAmount.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          {/* Attendance Analytics card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              attendance?.summary?.percentage >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              <Percent size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">
                Attendance Ratio
              </span>
              <span className={cn(
                "text-xl font-black block mt-1.5",
                attendance?.summary?.percentage >= 75 ? "text-emerald-700" : "text-rose-700"
              )}>
                {attLoading ? "..." : (attendance?.summary ? `${attendance.summary.percentage}%` : "N/A")}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Details, Attendance & Fees grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column A: Personal & Academic Details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Box: Profile Info */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
                <BadgeInfo className="text-indigo-600" size={16} />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Profile Information
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Admission No</span>
                  <span className="font-black text-gray-700">{personalDetails?.admissionNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Admission Date</span>
                  <span className="font-black text-gray-700">
                    {personalDetails?.admissionDate
                      ? new Date(personalDetails.admissionDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Fee Discount</span>
                  <span className="font-black text-emerald-600">
                    {personalDetails?.discountPercentage ? `${personalDetails.discountPercentage}%` : "0% (Regular)"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Prev. School</span>
                  <span className="font-black text-gray-700 truncate max-w-[150px] inline-block text-right" title={personalDetails?.previousSchool}>
                    {personalDetails?.previousSchool || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-gray-50 pt-3 mt-2">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Academic Session</span>
                  <span className="font-black text-gray-700">{academicDetails?.session || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Gender</span>
                  <span className="font-black text-gray-700">{personalDetails?.gender || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Date of Birth</span>
                  <span className="font-black text-gray-700">
                    {personalDetails?.dob
                      ? new Date(personalDetails.dob).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Blood Group</span>
                  <span className="font-black text-gray-700">{personalDetails?.bloodGroup || "Unknown"}</span>
                </div>
                {personalDetails?.customFields && Object.entries(personalDetails.customFields).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-xs border-t border-gray-50 pt-3">
                    <span className="font-bold text-gray-400 uppercase tracking-wide">{key}</span>
                    <span className="font-black text-indigo-700">{val || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box: Parent & Contact Info */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
                <UserCheck className="text-indigo-600" size={16} />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Guardian Contact Card
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Father's Name</p>
                    <p className="text-xs font-black text-gray-800 mt-1 truncate">{contactDetails?.fatherName || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Mother's Name</p>
                    <p className="text-xs font-black text-gray-800 mt-1 truncate">{contactDetails?.motherName || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Emergency Phone</p>
                    <p className="text-xs font-black text-gray-800 mt-1 font-mono">{contactDetails?.emergencyContact || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Address</p>
                    <p className="text-xs font-bold text-gray-600 mt-1 leading-normal truncate-2-lines">{contactDetails?.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column B: Attendance Section & Fee details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Box: Attendance Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="text-indigo-600" size={16} />
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Attendance Analytics Section
                  </h3>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                  attendance?.summary?.percentage >= 75
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                  {attendance?.summary?.percentage >= 75 ? "Sufficient" : "Attention Required"}
                </span>
              </div>

              {attLoading ? (
                <div className="h-44 bg-gray-50 rounded-2xl animate-pulse" />
              ) : attendance ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 text-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Classes Held</span>
                      <span className="text-lg font-black text-gray-800 mt-1 block">{attendance.summary.totalClasses}</span>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 text-center">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase block">Present</span>
                      <span className="text-lg font-black text-emerald-700 mt-1 block">{attendance.summary.present}</span>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 text-center">
                      <span className="text-[9px] font-bold text-rose-500 uppercase block">Absent</span>
                      <span className="text-lg font-black text-rose-700 mt-1 block">{attendance.summary.absent}</span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                      <span>Overall attendance ratio</span>
                      <span>{attendance.summary.percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          attendance.summary.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"
                        )}
                        style={{ width: `${attendance.summary.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs font-bold text-gray-400 italic">
                  No registered attendance logs found in database.
                </div>
              )}
            </div>

            {/* Box: Dynamic Monthly Fee Ledger */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-indigo-600" size={16} />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Academic Year Fee Breakdown
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                    CYCLE: {feeSummary?.academicYear || "2026-2027"}
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Assessed Month
                        </th>
                        <th className="px-6 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Assessed Amount
                        </th>
                        <th className="px-6 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Cleared Amount
                        </th>
                        <th className="px-6 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Ledger Status
                        </th>
                        <th className="px-6 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">
                          Clearance Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {feeSummary?.monthlyFees && feeSummary.monthlyFees.length > 0 ? (
                        feeSummary.monthlyFees.map((fee) => (
                          <tr
                            key={fee.month}
                            className="hover:bg-gray-50/30 transition-colors"
                          >
                            <td className="px-6 py-4 text-xs font-bold text-gray-700">
                              {fee.month}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-gray-400">
                              ₹{fee.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-gray-900">
                              ₹{fee.paidAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight inline-flex items-center gap-1 border",
                                  fee.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : fee.status === "PARTIAL"
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : "bg-rose-50 text-rose-700 border-rose-100"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-1 h-1 rounded-full",
                                    fee.status === "PAID"
                                      ? "bg-emerald-500"
                                      : fee.status === "PARTIAL"
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                  )}
                                />
                                {fee.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase">
                              {fee.paidOn
                                ? new Date(fee.paidOn).toLocaleDateString(undefined, {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-semibold text-gray-400 italic">
                            No financial monthly fee breakups available for this record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="p-4 px-6 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Financial Ledger records</span>
                <span>100% Secure Transaction System</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Print styles override */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;

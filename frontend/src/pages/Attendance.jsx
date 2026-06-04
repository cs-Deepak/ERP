import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  CheckCircle,
  Filter,
  ChevronDown,
} from "lucide-react";
import Button from "../components/ui/Button";
import Skeleton, { TableSkeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../context/ToastContext";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Attendance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [isMarked, setIsMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const location = useLocation();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const endpoint =
          user?.role === "teacher"
            ? "/timetable/teacher/assigned-classes"
            : "/admin/classes";
        const res = await api.get(endpoint);
        if (res.data.success) {
          const classData = res.data.data;
          setClasses(classData);
          
          const stateClassId = location.state?.classId;
          if (stateClassId && classData.some(c => c._id === stateClassId)) {
            setSelectedClass(stateClassId);
          } else if (classData.length > 0) {
            setSelectedClass(classData[0]._id);
          }
        }
      } catch (error) {
        console.error("Fetch classes error:", error);
      }
    };
    fetchClasses();
  }, [location.state]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchStudentsAndStatus = async () => {
      setLoading(true);
      try {
        // 1. Fetch Students
        const studentsRes = await api.get(
          `/admin/classes/${selectedClass}/students`,
        );
        const fetchedStudents = studentsRes.data.data;
        setStudents(fetchedStudents);

        // 2. Check if already marked
        const statusRes = await api.get("/attendance", {
          params: { classId: selectedClass, date: selectedDate },
        });

        if (statusRes.data.success && statusRes.data.data.length > 0) {
          setIsMarked(true);
          const markedData = {};
          statusRes.data.data.forEach((entry) => {
            markedData[entry.student._id] = entry.status.toLowerCase();
          });
          setAttendanceData(markedData);
        } else {
          setIsMarked(false);
          const initialData = {};
          fetchedStudents.forEach((s) => {
            initialData[s._id] = "present";
          });
          setAttendanceData(initialData);
        }
      } catch (error) {
        console.error("Fetch attendance data error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndStatus();
  }, [selectedClass, selectedDate]);

  const toggleAttendance = (id, status) => {
    if (isMarked) return;
    setAttendanceData((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const attendanceDataArray = students.map((s) => ({
        studentId: s._id,
        status:
          attendanceData[s._id].charAt(0).toUpperCase() +
          attendanceData[s._id].slice(1), // 'present' -> 'Present'
      }));

      const res = await api.post("/attendance", {
        classId: selectedClass,
        date: selectedDate,
        attendanceData: attendanceDataArray,
      });

      if (res.data.success) {
        setIsMarked(true);
        addToast(`Daily attendance for class archived successfully`, "success");
      }
    } catch (error) {
      console.error("Submit attendance error:", error);
      addToast(
        error.response?.data?.message || "Failed to submit attendance",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.includes(searchQuery)),
  );

  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter((s) => s === "present")
      .length,
    absent: Object.values(attendanceData).filter((s) => s === "absent").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Roll Call
          </h2>
          <p className="text-gray-500 font-medium italic">
            Track daily student presence for{" "}
            {classes.find((c) => c._id === selectedClass)?.name || "Class"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 group-focus-within:text-indigo-600 transition-colors"
              size={18}
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>
          <div className="relative group">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-6 pr-12 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all cursor-pointer appearance-none"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  Class {cls.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-600 pointer-events-none transition-colors"
              size={16}
            />
          </div>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={isMarked}
            icon={Save}
            className="h-14 rounded-3xl shadow-xl shadow-indigo-100 px-8"
          >
            {isMarked ? "Records Finalized" : "Submit Attendance"}
          </Button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Total Capacity",
            value: stats.total,
            color: "indigo",
            icon: Users,
          },
          {
            label: "Confirmed Present",
            value: stats.present,
            color: "emerald",
            icon: CheckCircle2,
          },
          {
            label: "Current Absentees",
            value: stats.absent,
            color: "rose",
            icon: XCircle,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                {item.value}
              </p>
            </div>
            <div
              className={cn(
                "p-4 rounded-2xl shadow-inner",
                item.color === "indigo" &&
                  "bg-indigo-50 text-indigo-600 shadow-indigo-100/50",
                item.color === "emerald" &&
                  "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
                item.color === "rose" &&
                  "bg-rose-50 text-rose-600 shadow-rose-100/50",
              )}
            >
              <item.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-32 md:mb-0">
        <div className="p-6 sm:p-10 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Cohort Roster
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Mark presence for{" "}
              {classes.find((c) => c._id === selectedClass)?.name || "Class"} •{" "}
              {selectedDate}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-64 relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Find student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            <button className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-2xl border border-transparent hover:border-gray-50 transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="p-10">
              <TableSkeleton rows={8} columns={4} />
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              title="Cohort not found"
              description="No students enrolled in this class group yet."
              actionLabel="Add Student"
              onAction={() => {}}
            />
          ) : (
            <>
              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const status = attendanceData[student._id];
                  return (
                    <div
                      key={student._id}
                      className="p-6 space-y-5 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-black shadow-inner">
                            {student.fullName ? student.fullName.charAt(0) : "S"}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-tight uppercase tracking-tight">
                              {student.fullName || "N/A"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                              Roll: {student.rollNumber}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          disabled={isMarked}
                          onClick={() =>
                            toggleAttendance(student._id, "present")
                          }
                          className={cn(
                            "py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95",
                            status === "present"
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                              : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          <CheckCircle2 size={16} />
                          Present
                        </button>
                        <button
                          disabled={isMarked}
                          onClick={() =>
                            toggleAttendance(student._id, "absent")
                          }
                          className={cn(
                            "py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95",
                            status === "absent"
                              ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                              : "bg-rose-50 text-rose-600",
                          )}
                        >
                          <XCircle size={16} />
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/30 border-b border-gray-100">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Roll Call
                      </th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Student Information
                      </th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Verification Status
                      </th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => {
                      const status = attendanceData[student._id];
                      return (
                        <tr
                          key={student._id}
                          className="group hover:bg-gray-50/50 transition-all duration-300"
                        >
                          <td className="px-10 py-6">
                            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-500 font-black rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                              {student.rollNumber}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                                {student.fullName ? student.fullName.charAt(0) : "S"}
                              </div>
                              <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                {student.fullName || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            {status ? (
                              <span
                                className={cn(
                                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                                  status === "present"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-rose-50 text-rose-600 border border-rose-100",
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    status === "present"
                                      ? "bg-emerald-500"
                                      : "bg-rose-500",
                                  )}
                                />
                                {status}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">
                                Pending...
                              </span>
                            )}
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={isMarked}
                                onClick={() =>
                                  toggleAttendance(student._id, "present")
                                }
                                className={cn(
                                  "p-3 rounded-xl transition-all active:scale-90",
                                  status === "present"
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110"
                                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                                )}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                              <button
                                disabled={isMarked}
                                onClick={() =>
                                  toggleAttendance(student._id, "absent")
                                }
                                className={cn(
                                  "p-3 rounded-xl transition-all active:scale-90",
                                  status === "absent"
                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-100 scale-110"
                                    : "text-gray-400 hover:text-rose-600 hover:bg-rose-50",
                                )}
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Mobile Submit Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 animate-in slide-in-from-bottom duration-500">
        <Button
          className="w-full h-16 text-lg font-black uppercase tracking-tighter shadow-2xl shadow-indigo-200 rounded-[1.5rem]"
          onClick={handleSubmit}
          loading={loading}
          icon={Save}
          disabled={Object.keys(attendanceData).length === 0 || isMarked}
        >
          Finalize Roll Call
        </Button>
      </div>

      {isMarked && (
        <div className="bg-emerald-600 p-8 rounded-[2.5rem] flex items-center gap-6 border border-emerald-500 shadow-2xl shadow-emerald-100 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <CheckCircle size={32} />
          </div>
          <div>
            <p className="font-black text-white text-xl tracking-tight uppercase">
              Records Synchronized
            </p>
            <p className="text-emerald-50 font-bold tracking-tight opacity-90">
              Attendance for{" "}
              {classes.find((c) => c._id === selectedClass)?.name || "Class"}{" "}
              has been securely uploaded at {new Date().toLocaleTimeString()}.
            </p>
          </div>
          <div className="ml-auto block sm:hidden md:block">
            <Button
              variant="secondary"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl h-12"
              onClick={() => setIsMarked(false)}
            >
              Modify Entry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

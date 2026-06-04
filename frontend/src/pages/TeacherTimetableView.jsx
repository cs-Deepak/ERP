import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Calendar,
  Download,
  Clock,
  User,
  BookOpen,
  LayoutDashboard,
  Search,
} from "lucide-react";
import Button from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { cn } from "../utils/cn";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TeacherTimetableView = () => {
  const { addToast } = useToast();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const location = useLocation();

  // Fetch classes assigned to teacher
  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await api.get("/timetable/teacher/assigned-classes");
        if (res.data.success) {
          const classData = res.data.data;
          setAssignedClasses(classData);
          
          const stateClassId = location.state?.classId;
          if (stateClassId && classData.some(c => c._id === stateClassId)) {
            setSelectedClass(stateClassId);
          } else if (classData.length > 0) {
            setSelectedClass(classData[0]._id);
          }
        }
      } catch (error) {
        addToast("Failed to load assigned classes", "error");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchAssignedClasses();
  }, [location.state]);

  // Fetch timetable when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
    }
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/timetable/class/${selectedClass}`);
      if (res.data.success) {
        setTimetable(res.data.data);
      }
    } catch (error) {
      setTimetable(null);
      if (error.response?.status !== 404) {
        addToast("Error fetching timetable", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      addToast("Preparing your PDF...", "info");
      const res = await api.get(`/timetable/download/${selectedClass}`, {
        responseType: "blob",
      });

      // Create a blob URL from the data
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `timetable_${selectedClass}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast("PDF downloaded successfully", "success");
    } catch (error) {
      console.error("PDF Download Error:", error);
      addToast("Failed to download PDF. Please try again.", "error");
    }
  };

  if (loadingClasses) {
    return (
      <div className="p-10">
        <TableSkeleton rows={8} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            My Schedules
          </h2>
          <p className="text-gray-500 font-medium italic">
            View and download timetables for your assigned classes.
          </p>
        </div>
        {selectedClass && timetable && (
          <Button
            onClick={handleDownload}
            icon={Download}
            className="h-14 rounded-3xl shadow-xl shadow-indigo-100 px-8"
          >
            Download Official PDF
          </Button>
        )}
      </div>

      {/* Class Selector / Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
            size={20}
          />
          <select
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all cursor-pointer appearance-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {assignedClasses.length === 0 ? (
              <option value="">No classes assigned</option>
            ) : (
              assignedClasses.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  Class {cls.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-indigo-600 rounded-[1.5rem] p-4 flex items-center justify-between text-white shadow-xl shadow-indigo-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Assigned Classes
            </span>
            <span className="text-2xl font-black">
              {assignedClasses.length}
            </span>
          </div>
          <BookOpen size={32} className="opacity-40" />
        </div>
      </div>

      {/* Timetable Display */}
      {!selectedClass ? (
        <div className="bg-white rounded-[2.5rem] p-20 border border-gray-100 shadow-sm text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <LayoutDashboard size={48} className="text-rose-400 opacity-60" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            No Classes Assigned
          </h3>
          <p className="text-gray-500 font-bold italic max-w-sm mx-auto leading-relaxed">
            Your teaching portfolio currently has no classes. Please coordinate
            with the Administration Office to sync your schedule.
          </p>
        </div>
      ) : loading ? (
        <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <TableSkeleton rows={5} columns={5} />
        </div>
      ) : !timetable ? (
        <div className="bg-white rounded-[2.5rem] p-20 border border-gray-100 shadow-sm text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Calendar size={48} className="text-amber-400 opacity-60" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Schedule Pending
          </h3>
          <p className="text-gray-500 font-bold italic max-w-sm mx-auto leading-relaxed">
            The timetable for{" "}
            <span className="text-indigo-600">
              Class {assignedClasses.find((c) => c._id === selectedClass)?.name}
            </span>{" "}
            is currently being finalized by the administration.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {timetable.weeklySchedule.map((dayData) => (
            <div
              key={dayData.day}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group/day transition-all duration-300 hover:shadow-xl hover:border-indigo-100"
            >
              <div className="bg-gray-50/80 px-4 md:px-10 py-6 border-b border-gray-100 flex items-center gap-2 md:gap-4 sticky top-0 z-10 backdrop-blur-sm group-hover/day:bg-white transition-colors">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover/day:scale-110 transition-transform duration-500">
                  <Calendar size={22} />
                </div>
                <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
                  {dayData.day}
                </h3>
              </div>

              <div className="p-6 md:p-8 overflow-x-auto custom-scrollbar">
                {dayData.slots.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                      <Clock size={32} className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 italic font-bold">
                      No academic sessions scheduled for this day.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-8 min-w-full md:min-w-max pb-4">
                    {dayData.slots.map((slot, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-full md:w-[280px] p-8 rounded-[2.5rem] border transition-all relative group/slot overflow-hidden",
                          slot.type === "Break"
                            ? "bg-amber-50/30 border-amber-100/50"
                            : "bg-white border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 hover:border-indigo-100",
                        )}
                      >
                        {/* Shimmer Effect */}
                        {!slot.type === "Break" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none" />
                        )}

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-6">
                            <div
                              className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                slot.type === "Break"
                                  ? "bg-amber-100 text-amber-700 shadow-amber-100/50"
                                  : "bg-indigo-600 text-white shadow-indigo-100/50",
                              )}
                            >
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="min-h-[80px]">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2 opacity-60">
                                {slot.type === "Break"
                                  ? "Interval"
                                  : "Session Topic"}
                              </p>
                              <h4 className="text-2xl font-black text-gray-900 leading-[1.1] tracking-tight group-hover/slot:text-indigo-600 transition-colors">
                                {slot.subject
                                  ? slot.subject.name
                                  : slot.label || slot.type}
                              </h4>
                              {slot.subject && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                    Course ID: {slot.subject.code}
                                  </span>
                                </div>
                              )}
                            </div>

                            {slot.teacher && (
                              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-0.5 group-hover/slot:bg-indigo-50 group-hover/slot:border-indigo-100 transition-all">
                                  <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center shadow-inner">
                                    <User
                                      size={18}
                                      className="text-gray-300 group-hover/slot:text-indigo-400 transition-colors"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 opacity-60">
                                    Assigned Faculty
                                  </p>
                                  <p className="text-sm font-black text-gray-800">
                                    {slot.teacher.firstName}{" "}
                                    {slot.teacher.lastName}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherTimetableView;

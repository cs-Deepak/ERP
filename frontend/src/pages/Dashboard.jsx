import React, { useState, useEffect } from "react";
import {
  Users,
  UserSquare2,
  BookOpen,
  CreditCard,
  Plus,
  ArrowUpRight,
  Search,
  MoreVertical,
} from "lucide-react";
import Button from "../components/ui/Button";
import { cn } from "../utils/cn";
import { formatToINR } from "../utils/format";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      label: "Total Students",
      value: "0",
      icon: Users,
      color: "indigo",
      change: "+4.5%",
    },
    {
      label: "Total Teachers",
      value: "0",
      icon: UserSquare2,
      color: "emerald",
      change: "+2",
    },
    {
      label: "Total Classes",
      value: "0",
      icon: BookOpen,
      color: "amber",
      change: "0",
    },
    {
      label: "Fees Collected",
      value: "$0",
      icon: CreditCard,
      color: "rose",
      change: "+12.2%",
    },
  ]);
  const [loading, setLoading] = useState(true);

  // API Integration
  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role !== "admin") return;
      setLoading(true);
      try {
        const res = await api.get("/admin/stats");
        const data = res.data.data;

        setStats([
          {
            label: "Total Students",
            value: data.totalStudents.toString(),
            icon: Users,
            color: "indigo",
            change: "Live",
          },
          {
            label: "Total Teachers",
            value: data.totalTeachers.toString(),
            icon: UserSquare2,
            color: "emerald",
            change: "Live",
          },
          {
            label: "Total Classes",
            value: data.totalClasses.toString(),
            icon: BookOpen,
            color: "amber",
            change: "Live",
          },
          {
            label: "Fees Collected",
            value: formatToINR(data.totalFeesCollected),
            icon: CreditCard,
            color: "rose",
            change: "Live",
          },
        ]);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { label: "Add Student", icon: Plus, variant: "primary" },
    { label: "Add Teacher", icon: Plus, variant: "secondary" },
    { label: "Add Class", icon: Plus, variant: "secondary" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Welcome back! Here's a summary of the school's performance.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-10">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
          >
            {/* Background Accent */}
            <div
              className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-500",
                stat.color === "indigo" && "bg-indigo-600",
                stat.color === "emerald" && "bg-emerald-600",
                stat.color === "amber" && "bg-amber-600",
                stat.color === "rose" && "bg-rose-600",
              )}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-gray-100/50",
                    stat.color === "indigo" && "bg-indigo-50 text-indigo-600",
                    stat.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600",
                    stat.color === "amber" && "bg-amber-50 text-amber-600",
                    stat.color === "rose" && "bg-rose-50 text-rose-600",
                  )}
                >
                  <stat.icon size={28} />
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full",
                      stat.change.startsWith("+")
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-gray-500 bg-gray-50",
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                    vs last month
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-gray-500 text-sm font-semibold">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3
                    className={cn(
                      "text-3xl font-black text-gray-900",
                      loading && "blur-sm animate-pulse",
                    )}
                  >
                    {stat.value}
                  </h3>
                  <ArrowUpRight
                    size={16}
                    className="text-gray-300 group-hover:text-indigo-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 group overflow-hidden relative min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold text-gray-900 tracking-tight">
              Financial Overview
            </h4>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full">
                Monthly
              </button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                Yearly
              </button>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-full max-w-md h-48 bg-gradient-to-r from-indigo-50 via-indigo-200 to-indigo-50 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 italic font-medium p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CreditCard size={32} className="text-gray-200" />
            </div>
            Interactive Financial Chart Placeholder
            <br />
            (Integrate Chart.js/Recharts here)
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
            <h4 className="text-lg font-bold mb-2">School Announcement</h4>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Annual day preparations start from next Monday. Please inform all
              department heads.
            </p>
            <Button
              variant="ghost"
              className="bg-white/10 text-white border-none hover:bg-white/20 w-full rounded-2xl"
            >
              Post Update
            </Button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center justify-between">
              Critical Alerts
              <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[10px]">
                2
              </span>
            </h4>
            <div className="space-y-4">
              {[
                {
                  title: "Teacher Absence",
                  desc: "Grade 10-A Math period empty",
                  time: "10 mins ago",
                  type: "urgent",
                },
                {
                  title: "Fee Overdue",
                  desc: "5 students have pending fees",
                  time: "1 hour ago",
                  type: "notice",
                },
              ].map((alert, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      alert.type === "urgent"
                        ? "bg-red-500 shadow-sm shadow-red-200"
                        : "bg-amber-500 shadow-sm shadow-amber-200",
                    )}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight">
                      {alert.desc}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [stats, setStats] = useState([
    { label: "My Classes", value: "0", icon: BookOpen, color: "indigo" },
    { label: "Students", value: "0", icon: Users, color: "emerald" },
    {
      label: "Attendance Target",
      value: "95%",
      icon: ArrowUpRight,
      color: "amber",
    },
  ]);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherStats = async () => {
      setLoading(true);
      try {
        const res = await api.get("/teachers/dashboard/stats");
        const data = res.data.data;

        setStats([
          {
            label: "My Classes",
            value: data.totalClasses.toString(),
            icon: BookOpen,
            color: "indigo",
          },
          {
            label: "My Students",
            value: data.totalStudents.toString(),
            icon: Users,
            color: "emerald",
          },
          {
            label: "Classes Assigned",
            value: data.assignedClasses.length.toString(),
            icon: ArrowUpRight,
            color: "amber",
          },
        ]);

        setAttendance({
          present: data.attendanceSummary.present,
          absent: data.attendanceSummary.absent,
          total: data.attendanceSummary.totalMarked,
        });
      } catch (error) {
        console.error("Teacher Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Teacher Dashboard
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          Manage your classes, students, and attendance records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  stat.color === "indigo" && "bg-indigo-50 text-indigo-600",
                  stat.color === "emerald" && "bg-emerald-50 text-emerald-600",
                  stat.color === "amber" && "bg-amber-50 text-amber-600",
                )}
              >
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-black text-gray-900">
                  {stat.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
          <h4 className="text-xl font-bold text-gray-900 mb-6">
            Today's Attendance Summary
          </h4>
          <div className="flex items-center justify-around h-48 border-2 border-dashed border-gray-100 rounded-3xl relative">
            <div className="text-center">
              <p className="text-4xl font-black text-emerald-600">
                {attendance.present}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase mt-1">
                Present
              </p>
            </div>
            <div className="w-px h-12 bg-gray-100" />
            <div className="text-center">
              <p className="text-4xl font-black text-rose-600">
                {attendance.absent}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase mt-1">
                Absent
              </p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-center">
          <h4 className="text-xl font-bold mb-4">Class Overview</h4>
          <p className="text-indigo-100 mb-6">
            You are currently handling students across multiple sessions. Ensure
            attendance is marked daily.
          </p>
          <Button
            variant="ghost"
            className="bg-white/10 text-white border-none hover:bg-white/20 rounded-2xl"
          >
            View My Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === "admin" ? <AdminDashboard /> : <TeacherDashboard />;
};

export default Dashboard;

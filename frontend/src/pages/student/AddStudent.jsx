import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Save,
  User,
  GraduationCap,
  Users2,
  MapPin,
  UploadCloud,
  FileImage,
  X,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";
import { cn } from "../../utils/cn";

// Form steps definition
const STEPS = [
  { id: "personal", title: "Personal Details", icon: User },
  { id: "academic", title: "Academic Details", icon: GraduationCap },
  { id: "parent", title: "Parent Details", icon: Users2 },
  { id: "address", title: "Address & Photo", icon: MapPin },
];

const AddStudent = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      gender: "",
      dob: "",
      bloodGroup: "Unknown",
      email: "",
      phone: "",
      admissionNumber: "",
      rollNumber: "",
      className: "",
      section: "",
      session: "2026-2027",
      status: "Active",
      transportMode: "Private",
      hostelRequired: false,
      fatherName: "",
      motherName: "",
      emergencyContact: "",
      address: "",
    },
    mode: "onTouched",
  });

  // Step fields for trigger validation
  const STEP_FIELDS = [
    ["fullName", "gender", "dob", "bloodGroup", "email", "phone"],
    ["admissionNumber", "rollNumber", "className", "section", "session", "status", "transportMode"],
    ["fatherName", "motherName", "emergencyContact"],
    ["address"],
  ];

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      addToast("Please correct the errors in the current step", "error");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Image validation rules
  const validateAndSetImage = (file) => {
    setPhotoError("");
    
    if (!file) return;

    // Validate type (JPEG, PNG, WEBP)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setPhotoError("Unsupported file type. Please upload a JPEG, PNG, or WEBP image.");
      addToast("Invalid photo type", "error");
      return;
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setPhotoError("File size exceeds 2MB limit. Please upload a smaller image.");
      addToast("Photo exceeds 2MB limit", "error");
      return;
    }

    // Set preview and file
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetImage(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoError("");
  };

  // Submit handler
  const onSubmit = async (data) => {
    if (photoError) {
      addToast("Please resolve student photo errors first", "error");
      return;
    }

    setLoading(true);
    try {
      // Append student photo base64 string directly into payload if present
      const payload = {
        ...data,
        studentPhoto: photoPreview || "",
      };

      const res = await api.post("/students/create", payload);
      
      if (res.data.success) {
        addToast("Student enrolled successfully! Credentials created.", "success");
        navigate("/students");
      }
    } catch (error) {
      console.error("Create student error:", error);
      const msg = error.response?.data?.message || "Failed to create student. Please verify input fields.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/students")}
          className="p-3 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            ERP Student Registrations
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Enroll New Student
          </h2>
        </div>
      </div>

      {/* 2. Visual Stepper Tracker */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300",
                    index === currentStep
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : index < currentStep
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-gray-50 text-gray-400 border border-transparent"
                  )}
                >
                  <step.icon size={18} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                    Step {index + 1}
                  </p>
                  <h5 className="text-xs font-black text-gray-700 uppercase tracking-tight mt-1">
                    {step.title}
                  </h5>
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className="hidden sm:block flex-1 h-px bg-gray-100 mx-4" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Stepper Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-10 min-h-[380px] flex flex-col justify-between">
          
          <div className="space-y-8">
            {/* STEP 1: PERSONAL DETAILS */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-gray-50 pb-2">
                  <h4 className="text-md font-black text-gray-800 uppercase tracking-tight">
                    1. Student Personal Information
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">Please enter legal names, biological details, and primary emails.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.fullName && "border-red-200 bg-red-50/30"
                      )}
                      {...register("fullName", { required: "Full name is required" })}
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender *</label>
                    <select
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer",
                        errors.gender && "border-red-200 bg-red-50/30"
                      )}
                      {...register("gender", { required: "Gender is required" })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.gender.message}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth *</label>
                    <input
                      type="date"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.dob && "border-red-200 bg-red-50/30"
                      )}
                      {...register("dob", { required: "Date of birth is required" })}
                    />
                    {errors.dob && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.dob.message}</p>}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Blood Group</label>
                    <select
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer"
                      {...register("bloodGroup")}
                    >
                      <option value="Unknown">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Personal Email</label>
                    <input
                      type="text"
                      placeholder="john.doe@example.com"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.email && "border-red-200 bg-red-50/30"
                      )}
                      {...register("email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email format",
                        },
                      })}
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Personal Phone</label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all"
                      {...register("phone")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-gray-50 pb-2">
                  <h4 className="text-md font-black text-gray-800 uppercase tracking-tight">
                    2. Academic Alignment & Classroom details
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">Configure admission credentials, class assignments, and logistics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Admission Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admission Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. ADM-2026-0044"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.admissionNumber && "border-red-200 bg-red-50/30"
                      )}
                      {...register("admissionNumber", { required: "Admission number is required" })}
                    />
                    {errors.admissionNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.admissionNumber.message}</p>}
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Roll Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.rollNumber && "border-red-200 bg-red-50/30"
                      )}
                      {...register("rollNumber", { required: "Roll number is required" })}
                    />
                    {errors.rollNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.rollNumber.message}</p>}
                  </div>

                  {/* Class Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 10th Standard"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.className && "border-red-200 bg-red-50/30"
                      )}
                      {...register("className", { required: "Class name is required" })}
                    />
                    {errors.className && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.className.message}</p>}
                  </div>

                  {/* Section */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section *</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.section && "border-red-200 bg-red-50/30"
                      )}
                      {...register("section", { required: "Section is required" })}
                    />
                    {errors.section && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.section.message}</p>}
                  </div>

                  {/* Session */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Session *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.session && "border-red-200 bg-red-50/30"
                      )}
                      {...register("session", { required: "Academic session is required" })}
                    />
                    {errors.session && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.session.message}</p>}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Enrollment Status</label>
                    <select
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer"
                      {...register("status")}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>

                  {/* Transport Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transport Mode</label>
                    <select
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer"
                      {...register("transportMode")}
                    >
                      <option value="Private">Private</option>
                      <option value="School Bus">School Bus</option>
                      <option value="Self">Self</option>
                      <option value="Walking">Walking</option>
                    </select>
                  </div>

                  {/* Hostel Required */}
                  <div className="flex items-center gap-3 md:col-span-2 md:pt-8 pl-1">
                    <input
                      type="checkbox"
                      id="hostelRequired"
                      className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      {...register("hostelRequired")}
                    />
                    <label htmlFor="hostelRequired" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Hostel Accommodations Required
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PARENT DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-gray-50 pb-2">
                  <h4 className="text-md font-black text-gray-800 uppercase tracking-tight">
                    3. Parent / Guardian Guardianship credentials
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">Provide emergency contact references and parental information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Father's Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Father's Name *</label>
                    <input
                      type="text"
                      placeholder="Father's full name"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.fatherName && "border-red-200 bg-red-50/30"
                      )}
                      {...register("fatherName", { required: "Father's name is required" })}
                    />
                    {errors.fatherName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fatherName.message}</p>}
                  </div>

                  {/* Mother's Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mother's Name *</label>
                    <input
                      type="text"
                      placeholder="Mother's full name"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.motherName && "border-red-200 bg-red-50/30"
                      )}
                      {...register("motherName", { required: "Mother's name is required" })}
                    />
                    {errors.motherName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.motherName.message}</p>}
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Emergency Contact Number *</label>
                    <input
                      type="text"
                      placeholder="Primary phone number (10-15 digits)"
                      className={cn(
                        "w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all",
                        errors.emergencyContact && "border-red-200 bg-red-50/30"
                      )}
                      {...register("emergencyContact", {
                        required: "Emergency contact is required",
                        pattern: {
                          value: /^\d{10,15}$/,
                          message: "Please enter a valid 10-15 digit contact number",
                        },
                      })}
                    />
                    {errors.emergencyContact && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.emergencyContact.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ADDRESS DETAILS & PHOTO UPLOAD */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-gray-50 pb-2">
                  <h4 className="text-md font-black text-gray-800 uppercase tracking-tight">
                    4. Permanent Address & Student Portrait
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">Verify structural address files and upload drag-and-drop imagery.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Address Area */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Residential Address *</label>
                      <textarea
                        rows={6}
                        placeholder="House/Plot no., Street name, City, State, Country, Postal Code..."
                        className={cn(
                          "w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-3xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all resize-none",
                          errors.address && "border-red-200 bg-red-50/30"
                        )}
                        {...register("address", { required: "Residential address is required" })}
                      />
                      {errors.address && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.address.message}</p>}
                    </div>
                  </div>

                  {/* Drag and Drop Zone Area */}
                  <div className="md:col-span-5 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student Photo Portrait</label>
                    
                    {photoPreview ? (
                      /* Live Image Preview Mode */
                      <div className="relative border border-indigo-100 rounded-3xl p-2 bg-indigo-50/20 overflow-hidden flex flex-col items-center justify-center group h-44">
                        <img
                          src={photoPreview}
                          alt="Student Portrait preview"
                          className="h-full rounded-2xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-rose-600 rounded-full hover:bg-rose-50 border border-gray-100 shadow-md transition-all active:scale-90"
                          title="Remove Photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                          "border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 h-44 group",
                          isDragActive
                            ? "border-indigo-600 bg-indigo-50/30 scale-98"
                            : "border-gray-200 hover:border-indigo-500 hover:bg-gray-50/40"
                        )}
                        onClick={() => document.getElementById("file-upload").click()}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <UploadCloud className={cn("w-10 h-10 transition-transform duration-300 group-hover:-translate-y-1", isDragActive ? "text-indigo-600" : "text-gray-400")} />
                        <span className="text-xs font-bold text-gray-700 mt-3 block">
                          Drag & drop portrait photo, or <span className="text-indigo-600 underline">browse</span>
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-1.5 leading-none block">
                          Supports JPEG, PNG, WEBP (Max 2MB)
                        </span>
                      </div>
                    )}
                    {photoError && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">{photoError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Actions */}
          <div className="flex items-center justify-between border-t border-gray-50 pt-8 mt-10">
            <div>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={ChevronLeft}
                  className="h-12 rounded-2xl px-5 text-xs font-bold border border-gray-100 hover:bg-gray-50"
                  onClick={handleBack}
                >
                  Previous Step
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-12 rounded-2xl px-5 text-xs"
                onClick={() => navigate("/students")}
              >
                Cancel
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="h-12 rounded-2xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <Button
                  type="submit"
                  icon={Save}
                  loading={loading}
                  className="h-12 rounded-2xl px-7 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100"
                >
                  Submit Registration
                </Button>
              )}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default AddStudent;

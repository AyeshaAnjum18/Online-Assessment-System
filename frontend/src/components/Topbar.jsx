
import React, { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Mail, Shield, X } from "lucide-react";

export default function Topbar({ user }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userName = user?.name || user?.full_name || "User";
  const userEmail = user?.email || "Email not available";
  const userRole = user?.role || "Student";

  return (
    <header className="h-16 w-full bg-white border-b border-[#E1E9DD] flex items-center justify-between px-6 relative z-30">
      {/* Left section */}
      <div>
        <h2 className="text-lg font-bold text-[#344536]">
          QuizMaster
        </h2>
        <p className="text-xs text-gray-500">
          Online Assessment and Quiz Management System
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-[#F5F8F2] transition"
          >
            <div className="w-9 h-9 rounded-full bg-[#E1E9DD] flex items-center justify-center">
              <User size={19} className="text-[#718F6D]" />
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-[#344536]">
                {userName}
              </p>
              <p className="text-xs text-gray-500">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-14 w-72 bg-white rounded-xl shadow-xl border border-[#E1E9DD] overflow-hidden">
              <div className="bg-[#F5F8F2] p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E1E9DD] flex items-center justify-center">
                  <User size={24} className="text-[#718F6D]" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-[#344536] truncate">
                    {userName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {userRole}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="ml-auto text-gray-400 hover:text-gray-700"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-[#718F6D] mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email address</p>
                    <p className="text-sm text-gray-700 break-all">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-[#718F6D]" />
                  <div>
                    <p className="text-xs text-gray-500">Account role</p>
                    <p className="text-sm text-gray-700 capitalize">
                      {userRole}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E1E9DD] px-4 py-3">
                <p className="text-xs text-gray-400">
                  QuizMaster Account
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

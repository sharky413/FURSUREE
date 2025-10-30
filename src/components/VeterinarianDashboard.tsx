import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VeterinarianAppointments } from "./VeterinarianAppointments";
import { ScheduleManagement } from "./ScheduleManagement";

interface User {
  _id: string;
  email?: string;
  profile: {
    role: "pet_owner" | "veterinarian";
    firstName: string;
    lastName: string;
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
  } | null;
}

interface VeterinarianDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function VeterinarianDashboard({ user, activeTab, setActiveTab }: VeterinarianDashboardProps) {
  const appointments = useQuery(api.appointments.getVeterinarianAppointments);

  const tabs = [
    { id: "appointments", label: "Appointments", icon: "📋" },
    { id: "schedule", label: "Schedule", icon: "🗓️" },
  ];

  const pendingAppointments = appointments?.filter(apt => apt.status === "pending") || [];
  const confirmedAppointments = appointments?.filter(apt => apt.status === "confirmed") || [];
  const completedAppointments = appointments?.filter(apt => apt.status === "completed") || [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏳</div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {pendingAppointments.length}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {confirmedAppointments.length}
              </div>
              <div className="text-gray-600">Confirmed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🏁</div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {completedAppointments.length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👩‍⚕️</div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                Dr. {user.profile?.lastName}
              </div>
              <div className="text-gray-600">{user.profile?.specialization || "General Practice"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "appointments" && <VeterinarianAppointments appointments={appointments} />}
          {activeTab === "schedule" && <ScheduleManagement />}
        </div>
      </div>
    </div>
  );
}

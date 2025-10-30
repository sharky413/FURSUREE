import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppointmentBooking } from "./AppointmentBooking";
import { PetManagement } from "./PetManagement";
import { AppointmentHistory } from "./AppointmentHistory";

interface User {
  _id: string;
  email?: string;
  profile: {
    role: "pet_owner" | "veterinarian";
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
  } | null;
}

interface PetOwnerDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function PetOwnerDashboard({ user, activeTab, setActiveTab }: PetOwnerDashboardProps) {
  const appointments = useQuery(api.appointments.getUserAppointments);
  const pets = useQuery(api.pets.getUserPets);

  const tabs = [
    { id: "appointments", label: "My Appointments", icon: "📅" },
    { id: "book", label: "Book Appointment", icon: "➕" },
    { id: "pets", label: "My Pets", icon: "🐾" },
  ];

  const upcomingAppointments = appointments?.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  ) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📅</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {upcomingAppointments.length}
              </div>
              <div className="text-gray-600">Upcoming Appointments</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🐾</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pets?.length || 0}
              </div>
              <div className="text-gray-600">Registered Pets</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">✅</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments?.filter(apt => apt.status === "completed").length || 0}
              </div>
              <div className="text-gray-600">Completed Visits</div>
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
          {activeTab === "appointments" && <AppointmentHistory appointments={appointments} />}
          {activeTab === "book" && <AppointmentBooking pets={pets} />}
          {activeTab === "pets" && <PetManagement pets={pets} />}
        </div>
      </div>
    </div>
  );
}

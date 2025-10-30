import { useState } from "react";
import { PetOwnerDashboard } from "./PetOwnerDashboard";
import { VeterinarianDashboard } from "./VeterinarianDashboard";

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
    address?: string;
  } | null;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div>
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.profile?.firstName}!
              </h1>
              <p className="text-gray-600">
                {user.profile?.role === "pet_owner" ? "Pet Owner Dashboard" : "Veterinarian Dashboard"}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {user.profile?.role === "pet_owner" ? (
        <PetOwnerDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <VeterinarianDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}

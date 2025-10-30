import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Appointment {
  _id: Id<"appointments">;
  date: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  severity: string;
  status: string;
  notes?: string;
  depositAmount: number;
  depositPaid: boolean;
  veterinarianNotes?: string;
  pet: {
    name: string;
    breed: string;
    type: string;
  } | null;
  owner: {
    email?: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
    } | null;
  } | null;
}

interface VeterinarianAppointmentsProps {
  appointments?: Appointment[];
}

export function VeterinarianAppointments({ appointments }: VeterinarianAppointmentsProps) {
  const confirmAppointment = useMutation(api.appointments.confirmAppointment);
  const cancelAppointment = useMutation(api.appointments.cancelAppointment);
  const addVeterinarianNotes = useMutation(api.appointments.addVeterinarianNotes);

  const handleConfirm = async (appointmentId: Id<"appointments">) => {
    try {
      await confirmAppointment({ appointmentId });
      toast.success("Appointment confirmed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm appointment");
    }
  };

  const handleCancel = async (appointmentId: Id<"appointments">) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await cancelAppointment({ appointmentId });
        toast.success("Appointment cancelled successfully");
      } catch (error) {
        toast.error("Failed to cancel appointment");
      }
    }
  };

  const handleAddNotes = async (appointmentId: Id<"appointments">, notes: string) => {
    if (!notes.trim()) {
      toast.error("Please enter notes before completing the appointment");
      return;
    }

    try {
      await addVeterinarianNotes({ appointmentId, notes });
      toast.success("Appointment completed with notes");
    } catch (error) {
      toast.error("Failed to add notes");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAppointmentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const groupedAppointments = {
    pending: appointments?.filter(apt => apt.status === "pending") || [],
    confirmed: appointments?.filter(apt => apt.status === "confirmed") || [],
    completed: appointments?.filter(apt => apt.status === "completed") || [],
    cancelled: appointments?.filter(apt => apt.status === "cancelled") || [],
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
        <p className="text-gray-600">Patient appointments will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Patient Appointments</h3>
      
      <div className="space-y-8">
        {/* Pending Appointments */}
        {groupedAppointments.pending.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-orange-600 mb-4">Pending Appointments ({groupedAppointments.pending.length})</h4>
            <div className="space-y-4">
              {groupedAppointments.pending.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onAddNotes={handleAddNotes}
                  getStatusColor={getStatusColor}
                  getSeverityColor={getSeverityColor}
                  formatAppointmentType={formatAppointmentType}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Appointments */}
        {groupedAppointments.confirmed.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-green-600 mb-4">Confirmed Appointments ({groupedAppointments.confirmed.length})</h4>
            <div className="space-y-4">
              {groupedAppointments.confirmed.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onAddNotes={handleAddNotes}
                  getStatusColor={getStatusColor}
                  getSeverityColor={getSeverityColor}
                  formatAppointmentType={formatAppointmentType}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Appointments */}
        {groupedAppointments.completed.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-blue-600 mb-4">Completed Appointments ({groupedAppointments.completed.length})</h4>
            <div className="space-y-4">
              {groupedAppointments.completed.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onAddNotes={handleAddNotes}
                  getStatusColor={getStatusColor}
                  getSeverityColor={getSeverityColor}
                  formatAppointmentType={formatAppointmentType}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: Id<"appointments">) => void;
  onCancel: (id: Id<"appointments">) => void;
  onAddNotes: (id: Id<"appointments">, notes: string) => void;
  getStatusColor: (status: string) => string;
  getSeverityColor: (severity: string) => string;
  formatAppointmentType: (type: string) => string;
}

function AppointmentCard({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onAddNotes,
  getStatusColor,
  getSeverityColor,
  formatAppointmentType 
}: AppointmentCardProps) {
  const [notes, setNotes] = useState("");
  const [showNotesForm, setShowNotesForm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">
              {appointment.pet?.name} - {formatAppointmentType(appointment.appointmentType)}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(appointment.severity)}`}>
              {appointment.severity.charAt(0).toUpperCase() + appointment.severity.slice(1)} Priority
            </span>
          </div>
          <p className="text-gray-600">
            Owner: {appointment.owner?.profile?.firstName} {appointment.owner?.profile?.lastName}
            {appointment.owner?.email && ` (${appointment.owner.email})`}
            {appointment.owner?.profile?.phone && ` - ${appointment.owner.profile.phone}`}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {appointment.status === "pending" && appointment.depositPaid && (
            <button
              onClick={() => onConfirm(appointment._id)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
          )}
          {appointment.status === "confirmed" && (
            <button
              onClick={() => setShowNotesForm(!showNotesForm)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Complete Visit
            </button>
          )}
          {(appointment.status === "pending" || appointment.status === "confirmed") && (
            <button
              onClick={() => onCancel(appointment._id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <span className="text-sm text-gray-600">Date:</span>
          <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Time:</span>
          <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Pet:</span>
          <p className="font-medium">{appointment.pet?.name} ({appointment.pet?.breed} {appointment.pet?.type})</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Deposit:</span>
          <p className="font-medium">
            ${appointment.depositAmount} 
            {appointment.depositPaid ? (
              <span className="text-green-600 ml-1">✓ Paid</span>
            ) : (
              <span className="text-red-600 ml-1">✗ Unpaid</span>
            )}
          </p>
        </div>
      </div>

      {appointment.status === "pending" && !appointment.depositPaid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Waiting for deposit payment before this appointment can be confirmed.
          </p>
        </div>
      )}

      {appointment.notes && (
        <div className="mb-4">
          <span className="text-sm text-gray-600">Patient Notes:</span>
          <p className="text-gray-800 mt-1">{appointment.notes}</p>
        </div>
      )}

      {showNotesForm && appointment.status === "confirmed" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            Treatment Notes (Required to complete visit):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Enter treatment details, diagnosis, recommendations, etc..."
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => onAddNotes(appointment._id, notes)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Complete Visit
            </button>
            <button
              onClick={() => {
                setShowNotesForm(false);
                setNotes("");
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {appointment.veterinarianNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-sm font-medium text-blue-900">Treatment Notes:</span>
          <p className="text-blue-800 mt-1">{appointment.veterinarianNotes}</p>
        </div>
      )}
    </div>
  );
}

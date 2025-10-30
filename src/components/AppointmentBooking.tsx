import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Pet {
  _id: Id<"pets">;
  name: string;
  breed: string;
  type: string;
  age: number;
}

interface AppointmentBookingProps {
  pets?: Pet[];
}

export function AppointmentBooking({ pets }: AppointmentBookingProps) {
  const [selectedPet, setSelectedPet] = useState<Id<"pets"> | "">("");
  const [selectedVet, setSelectedVet] = useState<Id<"users"> | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Id<"availableSlots"> | "">("");
  const [appointmentType, setAppointmentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const veterinarians = useQuery(api.users.getVeterinarians);
  const availableSlots = useQuery(
    api.appointments.getAvailableSlots,
    selectedVet && selectedDate ? { veterinarianId: selectedVet, date: selectedDate } : "skip"
  );

  const bookAppointment = useMutation(api.appointments.bookAppointment);
  const processPayment = useAction(api.payments.processPayment);

  const appointmentTypes = [
    { value: "regular_checkup", label: "Regular Checkup", price: 25 },
    { value: "vaccination", label: "Vaccination", price: 30 },
    { value: "emergency", label: "Emergency", price: 75 },
    { value: "surgery", label: "Surgery", price: 50 },
    { value: "dental", label: "Dental Care", price: 40 },
    { value: "grooming", label: "Grooming", price: 20 },
  ];

  const severityLevels = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "emergency", label: "Emergency" },
  ];

  const getDepositAmount = () => {
    const type = appointmentTypes.find(t => t.value === appointmentType);
    return type ? Math.round(type.price * 0.3) : 15; // 30% deposit
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet || !selectedVet || !selectedDate || !selectedSlot || !appointmentType || !severity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const slot = availableSlots?.find(s => s._id === selectedSlot);
    if (!slot) {
      toast.error("Selected time slot is no longer available");
      return;
    }

    setIsBooking(true);
    try {
      // Book appointment
      const appointmentId = await bookAppointment({
        veterinarianId: selectedVet as Id<"users">,
        petId: selectedPet as Id<"pets">,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        appointmentType: appointmentType as any,
        severity: severity as any,
        notes: notes || undefined,
        depositAmount: getDepositAmount(),
      });

      // Process payment
      await processPayment({
        appointmentId,
        amount: getDepositAmount(),
        paymentMethod: "card", // In real app, let user choose
      });

      toast.success("Appointment booked and deposit paid successfully!");
      
      // Reset form
      setSelectedPet("");
      setSelectedVet("");
      setSelectedDate("");
      setSelectedSlot("");
      setAppointmentType("");
      setSeverity("");
      setNotes("");
      
    } catch (error: any) {
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Book New Appointment</h3>
      
      {!pets || pets.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You need to add at least one pet before booking an appointment. 
            Please go to the "My Pets" tab to add your pet's information.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Pet *
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value as Id<"pets"> | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a pet...</option>
              {pets.map((pet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.breed} {pet.type}, {pet.age} years old)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Veterinarian *
            </label>
            <select
              value={selectedVet}
              onChange={(e) => setSelectedVet(e.target.value as Id<"users"> | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a veterinarian...</option>
              {veterinarians?.map((vet) => (
                <option key={vet._id} value={vet.userId}>
                  Dr. {vet.firstName} {vet.lastName} 
                  {vet.specialization && ` - ${vet.specialization}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDateStr}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {selectedVet && selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots *
              </label>
              {availableSlots === undefined ? (
                <div className="text-gray-500">Loading available slots...</div>
              ) : availableSlots.length === 0 ? (
                <div className="text-gray-500">No available slots for this date</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => setSelectedSlot(slot._id)}
                      className={`p-2 text-sm border rounded-md transition-colors ${
                        selectedSlot === slot._id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type *
            </label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose appointment type...</option>
              {appointmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} (${type.price} - Deposit: ${Math.round(type.price * 0.3)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose priority level...</option>
              {severityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information about your pet's condition or concerns..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {appointmentType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
              <p className="text-blue-800 text-sm">
                A deposit of <strong>${getDepositAmount()}</strong> is required to confirm your appointment.
                This helps prevent fake bookings and will be applied to your final bill.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isBooking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBooking ? "Booking Appointment..." : `Book Appointment & Pay $${getDepositAmount()} Deposit`}
          </button>
        </form>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface TimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSlots, setCustomSlots] = useState([{ startTime: "09:00", endTime: "09:30" }]);

  const schedule = useQuery(
    api.schedule.getVeterinarianSchedule,
    {
      startDate: selectedDate,
      endDate: selectedDate,
    }
  );

  const generateDefaultSlots = useMutation(api.schedule.generateDefaultSlots);
  const createAvailableSlots = useMutation(api.schedule.createAvailableSlots);

  const handleGenerateDefault = async () => {
    setIsGenerating(true);
    try {
      await generateDefaultSlots({ date: selectedDate });
      toast.success("Default schedule generated successfully!");
    } catch (error) {
      toast.error("Failed to generate schedule");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustomSlots = async () => {
    if (customSlots.some(slot => !slot.startTime || !slot.endTime)) {
      toast.error("Please fill in all time slots");
      return;
    }

    // Validate time slots
    for (const slot of customSlots) {
      if (slot.startTime >= slot.endTime) {
        toast.error("End time must be after start time for all slots");
        return;
      }
    }

    setIsGenerating(true);
    try {
      await createAvailableSlots({
        date: selectedDate,
        slots: customSlots,
      });
      toast.success("Custom schedule created successfully!");
      setCustomSlots([{ startTime: "09:00", endTime: "09:30" }]);
    } catch (error) {
      toast.error("Failed to create custom schedule");
    } finally {
      setIsGenerating(false);
    }
  };

  const addCustomSlot = () => {
    setCustomSlots([...customSlots, { startTime: "09:00", endTime: "09:30" }]);
  };

  const removeCustomSlot = (index: number) => {
    if (customSlots.length > 1) {
      setCustomSlots(customSlots.filter((_, i) => i !== index));
    }
  };

  const updateCustomSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...customSlots];
    updated[index][field] = value;
    setCustomSlots(updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const todaySlots = schedule?.filter(slot => slot.date === selectedDate) || [];
  const availableSlots = todaySlots.filter(slot => !slot.isBooked);
  const bookedSlots = todaySlots.filter(slot => slot.isBooked);

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Schedule Management</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Viewer */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Current Schedule</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDateStr}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {schedule === undefined ? (
            <div className="text-gray-500">Loading schedule...</div>
          ) : todaySlots.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-600">No time slots set for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableSlots.length > 0 && (
                <div>
                  <h5 className="font-medium text-green-600 mb-2">Available Slots ({availableSlots.length})</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <div key={slot._id} className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookedSlots.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-600 mb-2">Booked Slots ({bookedSlots.length})</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {bookedSlots.map((slot) => (
                      <div key={slot._id} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule Creator */}
        <div className="space-y-6">
          {/* Quick Generate */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Schedule</h4>
            <p className="text-gray-600 text-sm mb-4">
              Generate a standard schedule from 9:00 AM to 5:00 PM with 30-minute slots.
            </p>
            <button
              onClick={handleGenerateDefault}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "Generating..." : "Generate Default Schedule"}
            </button>
          </div>

          {/* Custom Schedule */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Custom Schedule</h4>
            <p className="text-gray-600 text-sm mb-4">
              Create your own time slots for the selected date.
            </p>
            
            <div className="space-y-3 mb-4">
              {customSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateCustomSlot(index, 'startTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateCustomSlot(index, 'endTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {customSlots.length > 1 && (
                    <button
                      onClick={() => removeCustomSlot(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={addCustomSlot}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Time Slot
              </button>
            </div>

            <button
              onClick={handleCreateCustomSlots}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "Creating..." : "Create Custom Schedule"}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">Schedule Management Tips</h5>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Creating a new schedule for a date will replace any existing unbooked slots</li>
          <li>• Booked slots cannot be deleted and will remain on the schedule</li>
          <li>• You can create schedules up to 3 months in advance</li>
          <li>• Consider your typical appointment duration when setting time slots</li>
        </ul>
      </div>
    </div>
  );
}

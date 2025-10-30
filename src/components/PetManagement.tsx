import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Pet {
  _id: Id<"pets">;
  name: string;
  breed: string;
  type: string;
  age: number;
  weight?: number;
  medicalHistory?: string;
}

interface PetManagementProps {
  pets?: Pet[];
}

export function PetManagement({ pets }: PetManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    type: "",
    age: 0,
    weight: "",
    medicalHistory: "",
  });

  const addPet = useMutation(api.pets.addPet);
  const updatePet = useMutation(api.pets.updatePet);
  const deletePet = useMutation(api.pets.deletePet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.breed || !formData.type || !formData.age) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingPet) {
        await updatePet({
          petId: editingPet._id,
          name: formData.name,
          breed: formData.breed,
          type: formData.type,
          age: formData.age,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          medicalHistory: formData.medicalHistory || undefined,
        });
        toast.success("Pet updated successfully!");
        setEditingPet(null);
      } else {
        await addPet({
          name: formData.name,
          breed: formData.breed,
          type: formData.type,
          age: formData.age,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          medicalHistory: formData.medicalHistory || undefined,
        });
        toast.success("Pet added successfully!");
        setShowAddForm(false);
      }
      
      setFormData({
        name: "",
        breed: "",
        type: "",
        age: 0,
        weight: "",
        medicalHistory: "",
      });
    } catch (error) {
      toast.error("Failed to save pet information");
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      breed: pet.breed,
      type: pet.type,
      age: pet.age,
      weight: pet.weight?.toString() || "",
      medicalHistory: pet.medicalHistory || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (petId: Id<"pets">) => {
    if (confirm("Are you sure you want to delete this pet?")) {
      try {
        await deletePet({ petId });
        toast.success("Pet deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete pet");
      }
    }
  };

  const cancelEdit = () => {
    setEditingPet(null);
    setShowAddForm(false);
    setFormData({
      name: "",
      breed: "",
      type: "",
      age: 0,
      weight: "",
      medicalHistory: "",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">My Pets</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Pet
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingPet ? "Edit Pet" : "Add New Pet"}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Fish">Fish</option>
                  <option value="Reptile">Reptile</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed *
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age (years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                rows={3}
                placeholder="Any medical conditions, allergies, or previous treatments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingPet ? "Update Pet" : "Add Pet"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets?.map((pet) => (
          <div key={pet._id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{pet.name}</h4>
                <p className="text-gray-600">{pet.breed} {pet.type}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(pet)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pet._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Age:</span>
                <span>{pet.age} years</span>
              </div>
              {pet.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span>{pet.weight} lbs</span>
                </div>
              )}
              {pet.medicalHistory && (
                <div>
                  <span className="text-gray-600">Medical History:</span>
                  <p className="text-gray-800 mt-1 text-xs">{pet.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!pets || pets.length === 0) && !showAddForm && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pets registered yet</h3>
          <p className="text-gray-600 mb-4">Add your first pet to start booking appointments</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Pet
          </button>
        </div>
      )}
    </div>
  );
}

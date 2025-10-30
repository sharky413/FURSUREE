import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Extended user profiles
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("pet_owner"), v.literal("veterinarian")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    // Veterinarian specific fields
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    // Pet owner specific fields
    address: v.optional(v.string()),
  }).index("by_user_id", ["userId"]).index("by_role", ["role"]),

  // Pet information
  pets: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    breed: v.string(),
    age: v.number(),
    type: v.string(), // dog, cat, bird, etc.
    weight: v.optional(v.number()),
    medicalHistory: v.optional(v.string()),
  }).index("by_owner", ["ownerId"]),

  // Available time slots set by veterinarians
  availableSlots: defineTable({
    veterinarianId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    startTime: v.string(), // HH:MM format
    endTime: v.string(), // HH:MM format
    isBooked: v.boolean(),
  }).index("by_veterinarian_and_date", ["veterinarianId", "date"])
    .index("by_date", ["date"]),

  // Appointments
  appointments: defineTable({
    petOwnerId: v.id("users"),
    veterinarianId: v.id("users"),
    petId: v.id("pets"),
    date: v.string(), // YYYY-MM-DD format
    startTime: v.string(), // HH:MM format
    endTime: v.string(), // HH:MM format
    appointmentType: v.union(
      v.literal("regular_checkup"),
      v.literal("vaccination"),
      v.literal("emergency"),
      v.literal("surgery"),
      v.literal("dental"),
      v.literal("grooming")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("emergency")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    depositAmount: v.number(),
    depositPaid: v.boolean(),
    paymentId: v.optional(v.string()),
    veterinarianNotes: v.optional(v.string()),
  }).index("by_pet_owner", ["petOwnerId"])
    .index("by_veterinarian", ["veterinarianId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  // Payment records
  payments: defineTable({
    appointmentId: v.id("appointments"),
    userId: v.id("users"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentId: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    transactionDate: v.number(),
  }).index("by_appointment", ["appointmentId"])
    .index("by_user", ["userId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("appointment_booked"),
      v.literal("appointment_confirmed"),
      v.literal("appointment_cancelled"),
      v.literal("payment_received")
    ),
    read: v.boolean(),
    appointmentId: v.optional(v.id("appointments")),
  }).index("by_user", ["userId"]).index("by_read", ["read"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAvailableSlots = query({
  args: {
    veterinarianId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("availableSlots")
      .withIndex("by_veterinarian_and_date", (q) => 
        q.eq("veterinarianId", args.veterinarianId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("isBooked"), false))
      .collect();
  },
});

export const bookAppointment = mutation({
  args: {
    veterinarianId: v.id("users"),
    petId: v.id("pets"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
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
    notes: v.optional(v.string()),
    depositAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Verify pet ownership
    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.ownerId !== userId) {
      throw new Error("Pet not found or unauthorized");
    }
    
    // Check if slot is still available
    const slot = await ctx.db
      .query("availableSlots")
      .withIndex("by_veterinarian_and_date", (q) => 
        q.eq("veterinarianId", args.veterinarianId).eq("date", args.date)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("startTime"), args.startTime),
          q.eq(q.field("isBooked"), false)
        )
      )
      .unique();
    
    if (!slot) {
      throw new Error("Time slot is no longer available");
    }
    
    // Create appointment
    const appointmentId = await ctx.db.insert("appointments", {
      petOwnerId: userId,
      veterinarianId: args.veterinarianId,
      petId: args.petId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      appointmentType: args.appointmentType,
      severity: args.severity,
      status: "pending",
      notes: args.notes,
      depositAmount: args.depositAmount,
      depositPaid: false,
    });
    
    // Mark slot as booked
    await ctx.db.patch(slot._id, { isBooked: true });
    
    // Create notification for veterinarian
    await ctx.db.insert("notifications", {
      userId: args.veterinarianId,
      title: "New Appointment Request",
      message: `New appointment request for ${args.date} at ${args.startTime}`,
      type: "appointment_booked",
      read: false,
      appointmentId,
    });
    
    return appointmentId;
  },
});

export const getUserAppointments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_pet_owner", (q) => q.eq("petOwnerId", userId))
      .order("desc")
      .collect();
    
    const appointmentsWithDetails = [];
    for (const appointment of appointments) {
      const pet = await ctx.db.get(appointment.petId);
      const vetProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", appointment.veterinarianId))
        .unique();
      
      appointmentsWithDetails.push({
        ...appointment,
        pet,
        veterinarian: vetProfile,
      });
    }
    
    return appointmentsWithDetails;
  },
});

export const getVeterinarianAppointments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Verify user is a veterinarian
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile || profile.role !== "veterinarian") {
      throw new Error("Unauthorized");
    }
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_veterinarian", (q) => q.eq("veterinarianId", userId))
      .order("desc")
      .collect();
    
    const appointmentsWithDetails = [];
    for (const appointment of appointments) {
      const pet = await ctx.db.get(appointment.petId);
      const ownerProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", appointment.petOwnerId))
        .unique();
      const owner = await ctx.db.get(appointment.petOwnerId);
      
      appointmentsWithDetails.push({
        ...appointment,
        pet,
        owner: { ...owner, profile: ownerProfile },
      });
    }
    
    return appointmentsWithDetails;
  },
});

export const confirmAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.veterinarianId !== userId) {
      throw new Error("Appointment not found or unauthorized");
    }
    
    if (!appointment.depositPaid) {
      throw new Error("Deposit must be paid before confirming appointment");
    }
    
    await ctx.db.patch(args.appointmentId, { status: "confirmed" });
    
    // Create notification for pet owner
    await ctx.db.insert("notifications", {
      userId: appointment.petOwnerId,
      title: "Appointment Confirmed",
      message: `Your appointment for ${appointment.date} at ${appointment.startTime} has been confirmed`,
      type: "appointment_confirmed",
      read: false,
      appointmentId: args.appointmentId,
    });
    
    return args.appointmentId;
  },
});

export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    
    // Check if user is authorized to cancel
    if (appointment.petOwnerId !== userId && appointment.veterinarianId !== userId) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.patch(args.appointmentId, { status: "cancelled" });
    
    // Free up the time slot
    const slot = await ctx.db
      .query("availableSlots")
      .withIndex("by_veterinarian_and_date", (q) => 
        q.eq("veterinarianId", appointment.veterinarianId).eq("date", appointment.date)
      )
      .filter((q) => q.eq(q.field("startTime"), appointment.startTime))
      .unique();
    
    if (slot) {
      await ctx.db.patch(slot._id, { isBooked: false });
    }
    
    // Create notification for the other party
    const notificationUserId = appointment.petOwnerId === userId 
      ? appointment.veterinarianId 
      : appointment.petOwnerId;
    
    await ctx.db.insert("notifications", {
      userId: notificationUserId,
      title: "Appointment Cancelled",
      message: `Appointment for ${appointment.date} at ${appointment.startTime} has been cancelled`,
      type: "appointment_cancelled",
      read: false,
      appointmentId: args.appointmentId,
    });
    
    return args.appointmentId;
  },
});

export const addVeterinarianNotes = mutation({
  args: {
    appointmentId: v.id("appointments"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.veterinarianId !== userId) {
      throw new Error("Appointment not found or unauthorized");
    }
    
    await ctx.db.patch(args.appointmentId, { 
      veterinarianNotes: args.notes,
      status: "completed"
    });
    
    return args.appointmentId;
  },
});

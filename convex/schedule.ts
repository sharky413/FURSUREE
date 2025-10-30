import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const createAvailableSlots = mutation({
  args: {
    date: v.string(),
    slots: v.array(v.object({
      startTime: v.string(),
      endTime: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Verify user is a veterinarian
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile || profile.role !== "veterinarian") {
      throw new Error("Only veterinarians can create time slots");
    }
    
    // Delete existing slots for this date
    const existingSlots = await ctx.db
      .query("availableSlots")
      .withIndex("by_veterinarian_and_date", (q) => 
        q.eq("veterinarianId", userId).eq("date", args.date)
      )
      .collect();
    
    for (const slot of existingSlots) {
      if (!slot.isBooked) {
        await ctx.db.delete(slot._id);
      }
    }
    
    // Create new slots
    const slotIds = [];
    for (const slot of args.slots) {
      const slotId = await ctx.db.insert("availableSlots", {
        veterinarianId: userId,
        date: args.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
      });
      slotIds.push(slotId);
    }
    
    return slotIds;
  },
});

export const getVeterinarianSchedule = query({
  args: {
    veterinarianId: v.optional(v.id("users")),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const targetVetId = args.veterinarianId || userId;
    
    if (!targetVetId) throw new Error("Veterinarian ID required");
    
    // Get all slots in date range
    const slots = await ctx.db
      .query("availableSlots")
      .withIndex("by_veterinarian_and_date", (q) => 
        q.eq("veterinarianId", targetVetId)
      )
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
    
    return slots;
  },
});

// Generate default time slots for a veterinarian
export const generateDefaultSlots = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Verify user is a veterinarian
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile || profile.role !== "veterinarian") {
      throw new Error("Only veterinarians can generate time slots");
    }
    
    // Generate slots from 9 AM to 5 PM, 30-minute intervals
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        slots.push({ startTime, endTime });
      }
    }
    
    return await ctx.runMutation(api.schedule.createAvailableSlots, {
      date: args.date,
      slots,
    });
  },
});

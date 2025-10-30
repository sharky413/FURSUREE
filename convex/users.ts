import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    return { ...user, profile };
  },
});

export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("pet_owner"), v.literal("veterinarian")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    if (existingProfile) {
      throw new Error("Profile already exists");
    }
    
    return await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      specialization: args.specialization,
      licenseNumber: args.licenseNumber,
      address: args.address,
    });
  },
});

export const updateUserProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) throw new Error("Profile not found");
    
    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.specialization !== undefined) updates.specialization = args.specialization;
    if (args.licenseNumber !== undefined) updates.licenseNumber = args.licenseNumber;
    if (args.address !== undefined) updates.address = args.address;
    
    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const getVeterinarians = query({
  args: {},
  handler: async (ctx) => {
    const vets = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "veterinarian"))
      .collect();
    
    const veterinarians = [];
    for (const vet of vets) {
      const user = await ctx.db.get(vet.userId);
      if (user) {
        veterinarians.push({
          ...vet,
          email: user.email,
        });
      }
    }
    
    return veterinarians;
  },
});

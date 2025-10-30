import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserPets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("pets")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
  },
});

export const addPet = mutation({
  args: {
    name: v.string(),
    breed: v.string(),
    age: v.number(),
    type: v.string(),
    weight: v.optional(v.number()),
    medicalHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("pets", {
      ownerId: userId,
      name: args.name,
      breed: args.breed,
      age: args.age,
      type: args.type,
      weight: args.weight,
      medicalHistory: args.medicalHistory,
    });
  },
});

export const updatePet = mutation({
  args: {
    petId: v.id("pets"),
    name: v.optional(v.string()),
    breed: v.optional(v.string()),
    age: v.optional(v.number()),
    type: v.optional(v.string()),
    weight: v.optional(v.number()),
    medicalHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.ownerId !== userId) {
      throw new Error("Pet not found or unauthorized");
    }
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.breed !== undefined) updates.breed = args.breed;
    if (args.age !== undefined) updates.age = args.age;
    if (args.type !== undefined) updates.type = args.type;
    if (args.weight !== undefined) updates.weight = args.weight;
    if (args.medicalHistory !== undefined) updates.medicalHistory = args.medicalHistory;
    
    await ctx.db.patch(args.petId, updates);
    return args.petId;
  },
});

export const deletePet = mutation({
  args: {
    petId: v.id("pets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.ownerId !== userId) {
      throw new Error("Pet not found or unauthorized");
    }
    
    await ctx.db.delete(args.petId);
    return args.petId;
  },
});

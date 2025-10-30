import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Simulate payment processing (in real app, integrate with Stripe, PayPal, etc.)
export const processPayment = action({
  args: {
    appointmentId: v.id("appointments"),
    amount: v.number(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args): Promise<{ paymentId: string; paymentRecordId: any }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment success (90% success rate for demo)
    const paymentSuccess = Math.random() > 0.1;
    
    if (!paymentSuccess) {
      throw new Error("Payment failed. Please try again.");
    }
    
    // Generate mock payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record payment
    const paymentRecordId: any = await ctx.runMutation(internal.payments.recordPayment, {
      appointmentId: args.appointmentId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentId,
      status: "completed",
    });
    
    // Update appointment
    await ctx.runMutation(internal.payments.updateAppointmentPayment, {
      appointmentId: args.appointmentId,
      paymentId,
    });
    
    return { paymentId, paymentRecordId };
  },
});

export const recordPayment = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentId: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("payments", {
      appointmentId: args.appointmentId,
      userId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentId: args.paymentId,
      status: args.status,
      transactionDate: Date.now(),
    });
  },
});

export const updateAppointmentPayment = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.petOwnerId !== userId) {
      throw new Error("Appointment not found or unauthorized");
    }
    
    await ctx.db.patch(args.appointmentId, {
      depositPaid: true,
      paymentId: args.paymentId,
    });
    
    // Create notification for veterinarian
    await ctx.db.insert("notifications", {
      userId: appointment.veterinarianId,
      title: "Payment Received",
      message: `Deposit payment received for appointment on ${appointment.date}`,
      type: "payment_received",
      read: false,
      appointmentId: args.appointmentId,
    });
    
    return args.appointmentId;
  },
});

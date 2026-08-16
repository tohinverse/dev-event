import { Schema, model, models, Types, type Model, type HydratedDocument } from "mongoose";
import { Event } from "./event.model";

// Shape of a Booking document's own fields (excludes Mongoose-injected members like _id).
export interface IBooking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<IBooking>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => EMAIL_PATTERN.test(value),
        message: "email must be a valid email address",
      },
    },
  },
  { timestamps: true },
);

// Speeds up lookups like "all bookings for event X".
bookingSchema.index({ eventId: 1 });

// Mongoose 9's `pre("save")` hook is promise-based (no `next` callback) —
// throw to abort the save, return to proceed.
bookingSchema.pre("save", async function () {
  // Only re-check on new bookings or when eventId is reassigned, avoiding a
  // redundant lookup on every unrelated update (e.g. re-saving after a typo fix in email).
  if (this.isModified("eventId")) {
    const eventExists = await Event.exists({ _id: this.eventId });

    if (!eventExists) {
      throw new Error(`Event with id "${this.eventId.toString()}" does not exist`);
    }
  }
});

export const Booking: Model<IBooking> = models.Booking ?? model<IBooking>("Booking", bookingSchema);

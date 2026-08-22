import { Schema, model, models, type Model, type HydratedDocument } from "mongoose";

// Shape of an Event document's own fields (excludes Mongoose-injected members like _id).
export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventDocument = HydratedDocument<IEvent>;

// Matches "HH:mm" (24-hour) and "h:mm AM/PM" (12-hour) time formats.
const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$|^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i;

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => TIME_PATTERN.test(value),
        message: "time must be in HH:mm (24h) or h:mm AM/PM format",
      },
    },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "agenda must contain at least one non-empty item",
      },
    },
    organizer: { type: String, required: true, trim: true },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "tags must contain at least one non-empty item",
      },
    },
  },
  { timestamps: true },
);

// Slug generation is idempotent on save, so this index only needs to enforce uniqueness.
eventSchema.index({ slug: 1 }, { unique: true });

// Mongoose 9's `pre("save")` hook is promise-based (no `next` callback) —
// throw to abort the save, return to proceed.
eventSchema.pre("save", function () {
  // Regenerate the slug only when the title changes, so existing slugs
  // (and anything referencing them, e.g. shared links) stay stable.
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Normalize `date` to ISO (YYYY-MM-DD) so downstream sorting/filtering is consistent
  // regardless of the input format (e.g. "January 5, 2026" or "01/05/2026").
  if (this.isModified("date")) {
    const parsedDate = new Date(this.date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date value: "${this.date}"`);
    }

    this.date = parsedDate.toISOString().split("T")[0];
  }

  // `time` format is enforced via schema validation above; normalize whitespace/casing here.
  if (this.isModified("time")) {
    this.time = this.time.trim().toUpperCase();
  }
});

export const Event: Model<IEvent> = models.Event ?? model<IEvent>("Event", eventSchema);

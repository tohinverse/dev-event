'use server';

import { io } from "next/cache";

import { Event } from '@/database/event.model';
import connectDB from "@/lib/mongodb";

// Lean docs still carry non-plain fields (ObjectId `_id`, Date timestamps)
// that React rejects when a Server Action's return value crosses into
// Client Components, so serialize through JSON to get plain data.
const toPlain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const getEvents = async () => {
    try {
        // Mongoose generates ObjectIds/timestamps internally, which reads as
        // an unstable synchronous value (like `new Date()`) to the prerenderer.
        await io();
        await connectDB();
        const events = await Event.find().sort({ createdAt: -1 }).lean();
        return toPlain(events);
    } catch {
        return [];
    }
}

export const getEventBySlug = async (slug: string) => {
    try {
        await io();
        await connectDB();
        const event = await Event.findOne({ slug }).lean();
        return event ? toPlain(event) : null;
    } catch {
        return null;
    }
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await io();
        await connectDB();
        const event = await Event.findOne({ slug });

        if (!event) return [];

        const similarEvents = await Event.find({ _id: { $ne: event._id }, tags: { $in: event.tags } }).lean();
        return toPlain(similarEvents);
    } catch {
        return [];
    }
}
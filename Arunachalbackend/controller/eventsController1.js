import { EventDayCollection, EventsCollection, TimeCollection } from "../models/eventsModel1.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import upload from "../utils/multerMemory.js";
import { bucket } from "../config/firebaseConfig.js";

export const addEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, description, year, month, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) throw new Error("Invalid start date");
    if (isNaN(end.getTime())) throw new Error("Invalid end date");
    if (end <= start) throw new Error("End date must be after start date");

    // Only block exact duplicate names; allow overlapping dates
    const conflictingEvent = await EventsCollection.findOne({ name }).session(session);

    if (conflictingEvent) {
      throw new Error(`Event conflict: name already exists`);
    }

    const totalDays = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;

    const event = new EventsCollection({
      name,
      description,
      year,
      month,
      startDate: start,
      endDate: end,
      totalDays,
    });

    await event.save({ session });

    const eventDayDocs = Array.from({ length: totalDays }, (_, i) => {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);
      return {
        event_ref: event._id,
        dayNumber: i + 1,
        name: `Day ${i + 1}`,
        description: description || `Day ${i + 1} description`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    await EventDayCollection.insertMany(eventDayDocs, { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    await session.abortTransaction();
    const statusCode = error.message.includes("Invalid")
      ? 400
      : error.message.includes("conflict")
      ? 409
      : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateEventDay = async (req, res) => {
  try {
    const { eventDayId } = req.params;
    const { name, description } = req.body;
    const eventDay = await EventDayCollection.findById(eventDayId);
    if (!eventDay) {
      return res.status(404).json({ message: "Event day not found" });
    }
    eventDay.name = name;
    eventDay.description = description;
    eventDay.updatedAt = new Date();
    await eventDay.save();
    res.status(201).json({ message: "Event day updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update day name/description AND optionally image in a single request (form-data)
export const updateEventDayWithImage = async (req, res) => {
  try {
    const { eventDayId } = req.params;
    const { name, description } = req.body;

    const eventDay = await EventDayCollection.findById(eventDayId);
    if (!eventDay) {
      return res.status(404).json({ message: "Event day not found" });
    }

    if (typeof name !== "undefined") eventDay.name = name;
    if (typeof description !== "undefined") eventDay.description = description;

    if (req.file) {
      const fileName = `event-days/${eventDayId}_${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(fileName);
      await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
      await file.makePublic();
      eventDay.image = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    eventDay.updatedAt = new Date();
    await eventDay.save();

    res.status(200).json({ message: "Event day updated", day: eventDay });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadEventDayImage = async (req, res) => {
  try {
    const { eventDayId } = req.params;
    const eventDay = await EventDayCollection.findById(eventDayId);
    if (!eventDay) {
      return res.status(404).json({ message: "Event day not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const fileName = `event-days/${eventDayId}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();
    eventDay.image = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    eventDay.updatedAt = new Date();
    await eventDay.save();

    res.status(200).json({ message: "Image updated", image: eventDay.image });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const events = await EventsCollection.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// List all event days (optionally filter by event_ref via query ?eventId=...)
export const getEventDay = async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { event_ref: eventId } : {};
    const days = await EventDayCollection.find(filter);
    if (!days || days.length === 0) {
      return res.status(404).json({ message: "No event days found" });
    }
    res.status(200).json(days);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getTotalEvent = async (req, res) => {
  try {
    const events = await EventsCollection.find();
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }
    const event = events[0];
    const timeEntries = await TimeCollection.find({ event_ref: event._id })
      .populate("day_ref")
      .populate("event_ref");
    const eventDays = await EventDayCollection.find({ event_ref: event._id });

    const daysMap = new Map();
    eventDays.forEach((day) => {
      const dayObj = day.toObject();
      dayObj.times = [];
      daysMap.set(day._id.toString(), dayObj);
    });

    timeEntries.forEach((entry) => {
      if (!entry.day_ref) return;
      const dayId = entry.day_ref._id.toString();
      if (daysMap.has(dayId)) {
        const timeEntry = entry.toObject();
        delete timeEntry.event_ref;
        delete timeEntry.day_ref;
        daysMap.get(dayId).times.push(timeEntry);
      }
    });

    const days = Array.from(daysMap.values());
    days.sort((a, b) => a.dayNumber - b.dayNumber);
    days.forEach((day) => {
      day.times.sort((a, b) => {
        const timeA = a.startTime ? new Date(`1970-01-01T${a.startTime}`) : 0;
        const timeB = b.startTime ? new Date(`1970-01-01T${b.startTime}`) : 0;
        return timeA - timeB;
      });
    });

    res.json({ event: event.toObject(), days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTime = async (req, res) => {
  try {
    const { eventId, eventDay_ref } = req.params;
    const { startTime, endTime, title, description, type, location } = req.body;

    const toMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    if (isNaN(newStart) || isNaN(newEnd)) {
      return res.status(400).json({ message: "Invalid time format (use HH:MM)" });
    }
    if (newEnd <= newStart) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const existingTimes = await TimeCollection.find({
      day_ref: eventDay_ref,
      event_ref: eventId,
    });

    const hasConflict = existingTimes.some((existing) => {
      const existingStart = toMinutes(existing.startTime);
      const existingEnd = toMinutes(existing.endTime);
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      return res.status(409).json({
        message: "Time slot conflicts with an existing event",
        suggestion: "Please choose a different time slot",
      });
    }

    const time = new TimeCollection({
      day_ref: eventDay_ref,
      event_ref: eventId,
      startTime,
      endTime,
      title,
      description,
      type,
      location,
    });
    await time.save();
    res.status(200).json({ message: "Time added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTime = async (req, res) => {
  try {
    const { timeId, day_ref } = req.params;
    const { startTime, endTime, title, description, type, location } = req.body;

    const toMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    if (isNaN(newStart) || isNaN(newEnd)) {
      return res.status(400).json({ message: "Invalid time format (use HH:MM)" });
    }
    if (newEnd <= newStart) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const existingTimes = await TimeCollection.find({
      day_ref: day_ref,
      _id: { $ne: timeId },
    });

    const hasConflict = existingTimes.some((existing) => {
      const existingStart = toMinutes(existing.startTime);
      const existingEnd = toMinutes(existing.endTime);
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      return res.status(409).json({
        message: "Time slot conflicts with an existing event",
        suggestion: "Please choose a different time slot",
      });
    }

    const time = await TimeCollection.findById(timeId);
    if (!time) {
      return res.status(404).json({ message: "Time not found" });
    }
    time.startTime = startTime;
    time.endTime = endTime;
    time.title = title;
    time.description = description;
    time.type = type;
    time.location = location;
    time.updatedAt = new Date();
    await time.save();
    res.status(201).json({ message: "Time updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventDays = await EventDayCollection.find({ event_ref: eventId });
    const eventDayIds = eventDays.map((day) => day._id);
    await TimeCollection.deleteMany({ day_ref: { $in: eventDayIds } });
    await EventDayCollection.deleteMany({ event_ref: eventId });
    await EventsCollection.findByIdAndDelete(eventId);
    res.status(200).json({
      message: "Event and all associated data deleted successfully",
      deletedEvent: eventId,
      deletedEventDays: eventDays.length,
      deletedTimeEntries: eventDayIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteTime = async (req, res) => {
  try {
    const { timeId } = req.params;
    const time = await TimeCollection.findByIdAndDelete(timeId);
    if (!time) {
      return res.status(404).json({ message: "Time not found" });
    }
    res.status(200).json({ message: "Time deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getTime = async (req, res) => {
  try {
    const time = await TimeCollection.find();
    if (!time || time.length === 0) {
      return res.status(404).json({ message: "Time not found" });
    }
    res.status(200).json(time);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getFullEventDetails = async (req, res) => {
  try {
    const events = await EventsCollection.find();
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    const event = events[0];
    const eventDays = await EventDayCollection.find({ event_ref: event._id });
    const timeSlots = await TimeCollection.find({ event_ref: event._id }).populate(
      "day_ref"
    );
    const structuredDays = eventDays.map((day) => ({
      ...day.toObject(),
      timeSlots: timeSlots.filter(
        (slot) => slot.day_ref._id.toString() === day._id.toString()
      ),
    }));
    res.status(200).json({ event, days: structuredDays });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



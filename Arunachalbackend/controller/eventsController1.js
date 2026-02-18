import { EventDayCollection, EventsCollection, TimeCollection } from "../models/eventsModel1.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import upload from "../utils/multerMemory.js";
import { deleteLocalByUrl , saveBufferToLocal } from "../utils/fileStorage.js";

// Update event core fields and optionally replace image
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, year, month, startDate, endDate, location } = req.body;

    const event = await EventsCollection.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (typeof name !== "undefined") event.name = name;
    if (typeof description !== "undefined") event.description = description;
    if (typeof year !== "undefined") event.year = year;
    if (typeof month !== "undefined") event.month = month;
    if (typeof location !== "undefined") event.location = location;

    if (typeof startDate !== "undefined") event.startDate = new Date(startDate);
    if (typeof endDate !== "undefined") event.endDate = new Date(endDate);

    // Recompute totalDays if dates changed
    if (typeof startDate !== "undefined" || typeof endDate !== "undefined") {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return res.status(400).json({ message: "Invalid start/end date" });
      }
      event.totalDays = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
    }

    if (req.file) {
      if (event.image) {
        await deleteLocalByUrl(event.image);
      }
      event.image = await saveBufferToLocal(req.file, "events");
    }

    event.updatedAt = new Date();
    await event.save();
    res.status(200).json({ message: "Event updated", event });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Create event; supports multipart/form-data with optional image
export const addEvent = async (req, res) => {
  try {
    const { name, description, year, month, startDate, endDate, location } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) throw new Error("Invalid start date");
    if (isNaN(end.getTime())) throw new Error("Invalid end date");
    if (end <= start) throw new Error("End date must be after start date");

    // Only block exact duplicate names; allow overlapping dates
    const conflictingEvent = await EventsCollection.findOne({ name });

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
      location,
    });

    // If image file present, upload to Firebase and set event.image before saving
    if (req.file) {
      event.image = await saveBufferToLocal(req.file, "events");
    }

    await event.save();

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

    await EventDayCollection.insertMany(eventDayDocs);

    res.status(201).json({ success: true, eventId: event._id, image: event.image });
  } catch (error) {
    const statusCode = error.message.includes("Invalid")
      ? 400
      : error.message.includes("conflict")
      ? 409
      : 500;
    res.status(statusCode).json({ success: false, error: error.message });
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
      // Delete old image if it exists
      if (eventDay.image) {
        try {
          await deleteLocalByUrl(eventDay.image);
        } catch (storageError) {
          console.log("Old image not found in storage, continuing with new upload");
        }
      }

      // Upload new image
      eventDay.image = await saveBufferToLocal(req.file, "eventdays");
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

    // Delete old image if it exists
    if (eventDay.image) {
      try {
       await deleteLocalByUrl(eventDay.image)
      } catch (storageError) {
        console.log("Old image not found in storage, continuing with new upload");
      }
    }

    eventDay.image = await saveBufferToLocal(req.file, "eventdays");
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

    // For each event, gather its days and times
    const all = await Promise.all(
      events.map(async (eventDoc) => {
        const eventId = eventDoc._id;
        const [timeEntries, eventDays] = await Promise.all([
          TimeCollection.find({ event_ref: eventId }).populate("day_ref").populate("event_ref"),
          EventDayCollection.find({ event_ref: eventId }),
        ]);

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

        return { event: eventDoc.toObject(), days };
      })
    );

    res.json({ items: all, count: all.length });
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

// Get a single event by id, with its days and time slots
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await EventsCollection.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventDays = await EventDayCollection.find({ event_ref: event._id });
    const timeSlots = await TimeCollection.find({ event_ref: event._id }).populate(
      "day_ref"
    );

    const structuredDays = eventDays.map((day) => ({
      ...day.toObject(),
      timeSlots: timeSlots.filter(
        (slot) => slot.day_ref && slot.day_ref._id.toString() === day._id.toString()
      ),
    }));

    res.status(200).json({ event, days: structuredDays });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete event day image
export const deleteEventDayImage = async (req, res) => {
  try {
    const { eventDayId } = req.params;
    const eventDay = await EventDayCollection.findById(eventDayId);
    
    if (!eventDay) {
      return res.status(404).json({ message: "Event day not found" });
    }

    if (!eventDay.image) {
      return res.status(404).json({ message: "No image found for this event day" });
    }

    // Extract file name from the full URL
    const imageUrl = eventDay.image;
    await deleteLocalByUrl(imageUrl);

   

    // Remove image URL from database
    eventDay.image = undefined;
    eventDay.updatedAt = new Date();
    await eventDay.save();

    res.status(200).json({ 
      message: "Event day image deleted successfully",
      eventDay: eventDay 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};



// Get today's event if within any event's date range; otherwise latest past event
export const getTodayOrLatestEvent = async (req, res) => {
  try {
    const msPerDay = 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Try to find an ongoing event for today
    let event = await EventsCollection.findOne({
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
    }).sort({ startDate: -1 });

    if (!event) {
      // If none ongoing, find the nearest upcoming event
      event = await EventsCollection.findOne({ startDate: { $gte: todayStart } }).sort({ startDate: 1 });
    }

    if (!event) {
      // If no upcoming, get the most recent past event
      event = await EventsCollection.findOne({ endDate: { $lt: todayStart } }).sort({ endDate: -1 });
      if (!event) {
        return res.status(404).json({ message: "No events available" });
      }
    }

    // Fetch all days of the selected event
    const eventDays = await EventDayCollection.find({ event_ref: event._id });

    // Fetch all time slots for the event, with populated day_ref to mirror example
    const timeSlots = await TimeCollection.find({ event_ref: event._id }).populate("day_ref");

    // Structure days with their timeSlots
    const structuredDays = eventDays
      .map((day) => ({
        ...day.toObject(),
        timeSlots: timeSlots
          .filter((slot) => slot.day_ref && String(slot.day_ref._id) === String(day._id))
          .sort((a, b) => {
            const toDate = (t) => (t ? new Date(`1970-01-01T${t}`) : 0);
            return toDate(a.startTime) - toDate(b.startTime);
          }),
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    return res.status(200).json({ event, days: structuredDays });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getEventDetailsById = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "eventId required" });

    const event = await EventsCollection.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const eventDays = await EventDayCollection.find({ event_ref: event._id });
    const timeSlots = await TimeCollection.find({ event_ref: event._id }).populate("day_ref");

    const days = eventDays.map((day) => ({
      ...day.toObject(),
      timeSlots: timeSlots.filter(
        (slot) => slot.day_ref && slot.day_ref._id.toString() === day._id.toString()
      ),
    }));

    return res.status(200).json({ event, days });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

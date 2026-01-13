import Event from "../models/eventsModel.js";
import { saveBufferToLocal } from "../utils/fileStorage.js";

const createEvent = async (req, res) => {
  try {
    const { title, startDate, endDate, days } = req.body;

    // Parse days JSON if sent as string in form-data
    let parsedDays = typeof days === "string" ? JSON.parse(days) : days;

    // Upload each image from form-data
    if (req.files && req.files.length > 0) {
      parsedDays = await Promise.all(
        parsedDays.map(async (day, idx) => {
          if (req.files[idx]) {
            day.image = await saveBufferToLocal(req.files[idx], "events");
          }
          return day;
        })
      );
    }

    const newEvent = new Event({
      title,
      startDate,
      endDate,
      days: parsedDays,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteEventById = async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }
        await deleteLocalByUrl(deletedEvent.image);
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateEventById = async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }
        await deleteLocalByUrl(updatedEvent.image);
        await saveBufferToLocal(req.file, "events");
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { createEvent, getEvents, getEventById, deleteEventById, updateEventById };
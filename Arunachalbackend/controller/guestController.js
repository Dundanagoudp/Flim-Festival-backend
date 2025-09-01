import Guest from "../models/guestModel.js";
import Year from "../models/yearModel.js";
import { bucket } from "../config/firebaseConfig.js";
import multer from "multer";

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("photo");

// Year Management Functions
export const createYear = async (req, res) => {
  try {
    const { value } = req.body;
    
    // Check if year already exists
    const existingYear = await Year.findOne({ value });
    if (existingYear) {
      return res.status(400).json({ message: "Year already exists" });
    }

    // Make newly created year active by default
    const year = new Year({ value, active: true });
    await year.save();

    res.status(201).json({
      message: "Year created successfully",
      year
    });
  } catch (err) {
    console.error("Error creating year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllYears = async (req, res) => {
  try {
    const years = await Year.find().sort({ value: -1, active: -1 });
    
    res.status(200).json(years);
  } catch (err) {
    console.error("Error getting years:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, active } = req.body;

    const year = await Year.findById(id);
    if (!year) {
      return res.status(404).json({ message: "Year not found" });
    }

    if (value !== undefined) {
      // ensure value uniqueness if changed
      if (value !== year.value) {
        const exists = await Year.findOne({ value });
        if (exists) {
          return res.status(400).json({ message: "Year value already exists" });
        }
        year.value = value;
      }
    }

    if (active !== undefined) {
      year.active = Boolean(active);
    }

    await year.save();
    res.status(200).json({ message: "Year updated successfully", year });
  } catch (err) {
    console.error("Error updating year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const { id } = req.params;
    const year = await Year.findByIdAndDelete(id);
    if (!year) {
      return res.status(404).json({ message: "Year not found" });
    }
    // Optionally: also delete guests for this year — keeping data by default
    res.status(200).json({ message: "Year deleted successfully" });
  } catch (err) {
    console.error("Error deleting year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Guest Management Functions
export const createGuest = async (req, res) => {
  const handleUpload = () => {
    return new Promise((resolve) => {
      if (req.is && req.is("multipart/form-data")) {
        upload(req, res, () => resolve());
      } else {
        resolve();
      }
    });
  };

  try {
    await handleUpload();
    
    const { name, role, age, description, year, movies, photo: photoUrlFromBody } = req.body;
    const file = req.file;

    // Validate required fields
    if (!name || !role || !year) {
      return res.status(400).json({ 
        message: "Name, role and year are required" 
      });
    }

    // Check if year exists
    const yearDoc = await Year.findById(year);
    if (!yearDoc) {
      return res.status(400).json({ message: "Invalid year" });
    }

    let photoUrl = photoUrlFromBody; // may be undefined

    // If file uploaded, upload to Firebase
    if (file && file.buffer) {
      const fileName = `guests/${yearDoc.value}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: { contentType: file.mimetype },
        });
        stream.on("error", reject);
        stream.on("finish", async () => {
          try {
            await fileUpload.makePublic();
            resolve();
          } catch (error) { reject(error); }
        });
        stream.end(file.buffer);
      });

      photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Require at least one of file or URL
    if (!photoUrl) {
      return res.status(400).json({ message: "Provide photo file or photo URL" });
    }

    // Create guest
    const guest = new Guest({
      name,
      role,
      age: age ? parseInt(age) : undefined,
      description,
      year,
      movies,
      photo: photoUrl
    });

    await guest.save();

    res.status(201).json({ message: "Guest created successfully", guest });
  } catch (err) {
    console.error("Error creating guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllGuests = async (req, res) => {
  try {
    const { year, groupBy } = req.query;

    if (groupBy === 'year') {
      const guests = await Guest.find()
        .populate('year', 'value')
        .sort({ 'year.value': -1, name: 1 });

      const groupedGuests = guests.reduce((acc, guest) => {
        const yearValue = guest.year.value;
        if (!acc.find(item => item._id === yearValue)) {
          acc.push({ _id: yearValue, guests: [] });
        }
        const yearGroup = acc.find(item => item._id === yearValue);
        yearGroup.guests.push({
          _id: guest._id,
          name: guest.name,
          role: guest.role,
          age: guest.age,
          description: guest.description,
          movies: guest.movies,
          photo: guest.photo
        });
        return acc;
      }, []);

      res.status(200).json(groupedGuests);
    } else {
      let query = {};
      if (year) {
        const yearDoc = await Year.findOne({ value: parseInt(year) });
        if (yearDoc) { query.year = yearDoc._id; }
      }

      const guests = await Guest.find(query)
        .populate('year', 'value')
        .sort({ 'year.value': -1, name: 1 });

      const formattedGuests = guests.map(guest => ({
        _id: guest._id,
        name: guest.name,
        role: guest.role,
        year: guest.year.value,
        age: guest.age,
        description: guest.description,
        movies: guest.movies,
        photo: guest.photo
      }));

      res.status(200).json(formattedGuests);
    }
  } catch (err) {
    console.error("Error getting guests:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Guests grouped by year with safe fields
export const getGuestsGroupedByYear = async (req, res) => {
  try {
    const guests = await Guest.find()
      .populate('year', 'value')
      .sort({ 'year.value': -1, name: 1 });

    const map = new Map();
    guests.forEach(g => {
      const y = g.year?.value;
      if (y === undefined) return;
      if (!map.has(y)) map.set(y, []);
      map.get(y).push({
        _id: g._id,
        name: g.name,
        role: g.role,
        age: g.age,
        description: g.description,
        photo: g.photo
      });
    });

    const result = Array.from(map.entries())
      .map(([yearValue, items]) => ({ year: yearValue, guests: items }))
      .sort((a, b) => b.year - a.year);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error grouping guests by year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getSingleGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id).populate('year', 'value');
    if (!guest) { return res.status(404).json({ message: "Guest not found" }); }
    res.status(200).json({
      _id: guest._id,
      name: guest.name,
      role: guest.role,
      year: guest.year.value,
      age: guest.age,
      description: guest.description,
      movies: guest.movies,
      photo: guest.photo
    });
  } catch (err) {
    console.error("Error getting guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateGuest = async (req, res) => {
  const handleUpload = () => {
    return new Promise((resolve) => {
      if (req.is && req.is("multipart/form-data")) {
        upload(req, res, () => resolve());
      } else {
        resolve();
      }
    });
  };

  try {
    await handleUpload();
    
    const { id } = req.params;
    const { name, role, age, description, year, movies, photo: photoUrlFromBody } = req.body;
    const file = req.file;

    const guest = await Guest.findById(id);
    if (!guest) { return res.status(404).json({ message: "Guest not found" }); }

    if (name) guest.name = name;
    if (role) guest.role = role;
    if (age !== undefined) guest.age = age ? parseInt(age) : undefined;
    if (description !== undefined) guest.description = description;
    if (year) {
      const yearDoc = await Year.findById(year);
      if (!yearDoc) { return res.status(400).json({ message: "Invalid year" }); }
      guest.year = year;
    }
    if (movies !== undefined) guest.movies = movies;

    if (file && file.buffer) {
      if (guest.photo) {
        const oldFilePath = guest.photo.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
        if (oldFilePath) {
          await bucket.file(oldFilePath).delete().catch(() => {});
        }
      }
      const yearDoc = await Year.findById(guest.year);
      const fileName = `guests/${yearDoc.value}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);
      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });
        stream.on("error", reject);
        stream.on("finish", async () => { try { await fileUpload.makePublic(); resolve(); } catch (e) { reject(e); } });
        stream.end(file.buffer);
      });
      guest.photo = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } else if (photoUrlFromBody !== undefined) {
      // If client sends a new URL (string or empty to clear), set it
      guest.photo = photoUrlFromBody || undefined;
    }

    await guest.save();

    res.status(200).json({ message: "Guest updated successfully", guest });
  } catch (err) {
    console.error("Error updating guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id);
    if (!guest) { return res.status(404).json({ message: "Guest not found" }); }

    if (guest.photo) {
      const filePath = guest.photo.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
      if (filePath) {
        await bucket.file(filePath).delete().catch(() => {});
      }
    }

    await Guest.findByIdAndDelete(id);
    res.status(200).json({ message: "Guest deleted successfully" });
  } catch (err) {
    console.error("Error deleting guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get guests by specific year
export const getGuestsByYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const yearDoc = await Year.findById(yearId);
    if (!yearDoc) { return res.status(404).json({ message: "Year not found" }); }

    const guests = await Guest.find({ year: yearId })
      .populate('year', 'value')
      .sort({ name: 1 });

    res.status(200).json({
      year: yearDoc.value,
      guests: guests.map(guest => ({
        _id: guest._id,
        name: guest.name,
        role: guest.role,
        age: guest.age,
        description: guest.description,
        movies: guest.movies,
        photo: guest.photo
      }))
    });
  } catch (err) {
    console.error("Error getting guests by year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

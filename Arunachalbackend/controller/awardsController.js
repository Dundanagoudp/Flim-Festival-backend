import { Award, AwardCategory } from "../models/awardsModel.js";
import { bucket } from "../config/firebaseConfig.js";

// Category management functions
const createAwardCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    const exists = await AwardCategory.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    const category = await AwardCategory.create({ name });
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating award category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllAwardCategories = async (req, res) => {
  try {
    const categories = await AwardCategory.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching award categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAwardCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    const category = await AwardCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const exists = await AwardCategory.findOne({ name });
    if (exists && String(exists._id) !== String(id)) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    
    category.name = name;
    await category.save();
    res.status(200).json(category);
  } catch (error) {
    console.error("Error updating award category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAwardCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is in use by any awards
    const inUse = await Award.countDocuments({ category: id });
    if (inUse > 0) {
      return res.status(400).json({ message: "Category is in use by awards and cannot be deleted" });
    }
    
    await AwardCategory.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting award category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createAwards = async (req, res) => {
  try {
    const { title, description, rule1, rule2, rule3, category } = req.body;

    // Validate category
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    
    const categoryExists = await AwardCategory.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    let mainImageUrl = null;
    let arrayImageUrls = [];

    // Handle main image (single file)
    if (req.files && req.files.image && req.files.image[0]) {
      const mainFile = req.files.image[0];
      const fileName = `awards/${Date.now()}_${mainFile.originalname}`;
      const file = bucket.file(fileName);

      await file.save(mainFile.buffer, {
        metadata: { contentType: mainFile.mimetype },
      });

      await file.makePublic();
      mainImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Handle array images (multiple files)
    if (req.files && req.files.array_images) {
      arrayImageUrls = await Promise.all(
        req.files.array_images.map(async (img) => {
          const fileName = `awards/${Date.now()}_${img.originalname}`;
          const file = bucket.file(fileName);

          await file.save(img.buffer, {
            metadata: { contentType: img.mimetype },
          });

          await file.makePublic();
          return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        })
      );
    }

    const newAwards = new Award({
      title,
      description,
      image: mainImageUrl,
      array_images: arrayImageUrls,
      rule1,
      rule2,
      rule3,
      category,
    });

    const savedAward = await newAwards.save();
    const populatedAward = await Award.findById(savedAward._id).populate("category", "name");
    res.status(201).json(populatedAward);
  } catch (error) {
    console.error("Error creating awards:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAwardsById = async (req, res) => {
    try {
        const awards = await Award.findById(req.params.id).populate("category", "name");
        if (!awards) {
            return res.status(404).json({ message: "Awards not found" });
        }
        res.status(200).json(awards);
    } catch (error) {
        console.error("Error fetching awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllAwards = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        
        if (category) {
            filter.category = category;
        }
        
        const awards = await Award.find(filter).populate("category", "name").sort({ createdAt: -1 });
        res.status(200).json(awards);
    } catch (error) {
        console.error("Error fetching awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateAwards = async (req, res) => {
    try {
        const { title, description, rule1, rule2, rule3, category } = req.body;
        const updateData = { title, description, rule1, rule2, rule3 };

        // Validate category if provided
        if (category) {
            const categoryExists = await AwardCategory.findById(category);
            if (!categoryExists) {
                return res.status(400).json({ message: "Invalid category" });
            }
            updateData.category = category;
        }

        // Handle main image update if new file is uploaded
        if (req.files && req.files.image && req.files.image[0]) {
            const mainFile = req.files.image[0];
            const fileName = `awards/${Date.now()}_${mainFile.originalname}`;
            const file = bucket.file(fileName);

            await file.save(mainFile.buffer, {
                metadata: { contentType: mainFile.mimetype },
            });

            await file.makePublic();
            updateData.image = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        }

        // Handle array images update if new files are uploaded
        if (req.files && req.files.array_images && req.files.array_images.length > 0) {
            const arrayImageUrls = await Promise.all(
                req.files.array_images.map(async (img) => {
                    const fileName = `awards/${Date.now()}_${img.originalname}`;
                    const file = bucket.file(fileName);

                    await file.save(img.buffer, {
                        metadata: { contentType: img.mimetype },
                    });

                    await file.makePublic();
                    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                })
            );
            updateData.array_images = arrayImageUrls;
        }

        const updatedAwards = await Award.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate("category", "name");
        
        if (!updatedAwards) {
            return res.status(404).json({ message: "Awards not found" });
        }
        res.status(200).json(updatedAwards);
    } catch (error) {
        console.error("Error updating awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteAwards = async (req, res) => {
    try {
        const deletedAwards = await Award.findByIdAndDelete(req.params.id);
        if (!deletedAwards) {
            return res.status(404).json({ message: "Awards not found" });
        }
        res.status(200).json({ message: "Awards deleted successfully" });
    } catch (error) {
        console.error("Error deleting awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { 
    createAwards, 
    getAwardsById, 
    getAllAwards, 
    updateAwards, 
    deleteAwards,
    createAwardCategory,
    getAllAwardCategories,
    updateAwardCategory,
    deleteAwardCategory
};
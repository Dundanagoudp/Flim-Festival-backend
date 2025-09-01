import Awards from "../models/awardsModel.js";
import { bucket } from "../config/firebaseConfig.js";

const createAwards = async (req, res) => {
  try {
    const { title, description, rule1, rule2, rule3 } = req.body;

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

    const newAwards = new Awards({
      title,
      description,
      image: mainImageUrl,
      array_images: arrayImageUrls,
      rule1,
      rule2,
      rule3,
    });

    const savedAward = await newAwards.save();
    res.status(201).json(savedAward);
  } catch (error) {
    console.error("Error creating awards:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const getAwardsById = async (req, res) => {
    try {
        const awards = await Awards.findById(req.params.id);
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
        const awards = await Awards.find();
        res.status(200).json(awards);
    } catch (error) {
        console.error("Error fetching awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateAwards = async (req, res) => {
    try {
        const { title, description, rule1, rule2, rule3 } = req.body;
        const updateData = { title, description, rule1, rule2, rule3 };

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

        const updatedAwards = await Awards.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
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
        const deletedAwards = await Awards.findByIdAndDelete(req.params.id);
        if (!deletedAwards) {
            return res.status(404).json({ message: "Awards not found" });
        }
        res.status(200).json({ message: "Awards deleted successfully" });
    } catch (error) {
        console.error("Error deleting awards:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { createAwards, getAwardsById, getAllAwards, updateAwards, deleteAwards };
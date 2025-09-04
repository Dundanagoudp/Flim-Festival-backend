import { bucket } from "../config/firebaseConfig.js";
import { AboutUsBanner, AboutUsStatistics, AboutUsLookInside } from "../models/aboutusModels.js";

// Helper: delete a file from Firebase Storage when given a public URL
const deleteFileFromPublicUrl = async (publicUrl) => {
    try {
        if (!publicUrl) return;
        const base = `https://storage.googleapis.com/${bucket.name}/`;
        if (!publicUrl.startsWith(base)) return; // not our bucket
        const relativePath = publicUrl.slice(base.length); // e.g. about-us/banner/abc.png
        if (!relativePath) return;
        const file = bucket.file(relativePath);
        await file.delete({ ignoreNotFound: true });
    } catch (_) {
        // Best-effort cleanup; ignore errors so API behavior remains consistent
    }
};


// Section-specific GET endpoints (public)
const getAboutUsBanner = async (req, res) => {
    try {
        const bannerDoc = await AboutUsBanner.findOne();
        if (!bannerDoc) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Banner content retrieved successfully",
            data: { id: bannerDoc._id, title: bannerDoc.title, backgroundImage: bannerDoc.backgroundImage }
        });
    } catch (error) {
        console.error("Error fetching banner:", error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching banner content" });
    }
};

// Removed main content handler

const getAboutUsStatistics = async (req, res) => {
    try {
        const statsDoc = await AboutUsStatistics.findOne();
        if (!statsDoc) {
            return res.status(404).json({ success: false, message: "Statistics not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Statistics retrieved successfully",
            data: { id: statsDoc._id, years: statsDoc.years, films: statsDoc.films, countries: statsDoc.countries, image: statsDoc.image }
        });
    } catch (error) {
        console.error("Error fetching statistics:", error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching statistics" });
    }
};

// Look Inside - GET (public)
const getAboutUsLookInside = async (req, res) => {
    try {
        const lookDoc = await AboutUsLookInside.findOne();
        if (!lookDoc) {
            return res.status(404).json({ success: false, message: "Look Inside not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Look Inside content retrieved successfully",
            data: { id: lookDoc._id, title: lookDoc.title, description: lookDoc.description, image: lookDoc.image }
        });
    } catch (error) {
        console.error("Error fetching lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching lookInside content" });
    }
};

const deleteAboutUsBanner = async (req, res) => {
    try {
        const bannerDoc = await AboutUsBanner.findOne();
        if (!bannerDoc) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        await deleteFileFromPublicUrl(bannerDoc.backgroundImage);
        const deletedId = bannerDoc._id;
        await bannerDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Banner document deleted", data: { id: deletedId } });
    } catch (error) {
        console.error("Error deleting banner:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting banner" });
    }
};

const deleteAboutUsStatistics = async (req, res) => {
    try {
        const statsDoc = await AboutUsStatistics.findOne();
        if (!statsDoc) {
            return res.status(404).json({ success: false, message: "Statistics not found" });
        }
        await deleteFileFromPublicUrl(statsDoc.image);
        const deletedId = statsDoc._id;
        await statsDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Statistics document deleted", data: { id: deletedId } });
    } catch (error) {
        console.error("Error deleting statistics:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting statistics" });
    }
};

const deleteAboutUsBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const bannerDoc = await AboutUsBanner.findById(id);
        if (!bannerDoc) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        await deleteFileFromPublicUrl(bannerDoc.backgroundImage);
        await bannerDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Banner document deleted", data: { id } });
    } catch (error) {
        console.error("Error deleting banner by id:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting banner" });
    }
};

const deleteAboutUsStatisticsById = async (req, res) => {
    try {
        const { id } = req.params;
        const statsDoc = await AboutUsStatistics.findById(id);
        if (!statsDoc) {
            return res.status(404).json({ success: false, message: "Statistics not found" });
        }
        await deleteFileFromPublicUrl(statsDoc.image);
        await statsDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Statistics document deleted", data: { id } });
    } catch (error) {
        console.error("Error deleting statistics by id:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting statistics" });
    }
};

// Removed three columns handler

// Section-specific CREATE/UPDATE endpoints (admin only)
const createOrUpdateBanner = async (req, res) => {
    try {
        const { title } = req.body;
        let backgroundImage = "";
        
        // Handle file upload to Firebase if present
        if (req.file) {
            try {
                const crypto = await import('crypto');
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `banner-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
                const file = bucket.file(`about-us/banner/${fileName}`);
                
                // Upload file to Firebase Storage
                await new Promise((resolve, reject) => {
                    const stream = file.createWriteStream({
                        metadata: {
                            contentType: req.file.mimetype,
                        },
                    });
                    
                    stream.on('error', (err) => {
                        console.error('Firebase upload error:', err);
                        reject(err);
                    });
                    
                    stream.on('finish', async () => {
                        try {
                            // Make file public after upload is complete
                            await file.makePublic();
                            backgroundImage = `https://storage.googleapis.com/${bucket.name}/about-us/banner/${fileName}`;
                            resolve();
                        } catch (publicError) {
                            console.error('Error making file public:', publicError);
                            reject(publicError);
                        }
                    });
                    
                    stream.end(req.file.buffer);
                });
                
            } catch (uploadError) {
                console.error('Firebase upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading image to Firebase"
                });
            }
        }
        
        const bannerData = {
            title: title || "",
            backgroundImage: backgroundImage || req.body.backgroundImage || "",
        };

        let bannerDoc = await AboutUsBanner.findOne();
        if (bannerDoc) {
            if (!backgroundImage && !req.body.backgroundImage) {
                bannerData.backgroundImage = bannerDoc.backgroundImage;
            }
            bannerDoc.title = bannerData.title;
            bannerDoc.backgroundImage = bannerData.backgroundImage;
            await bannerDoc.save();
            return res.status(200).json({ success: true, message: "Banner updated successfully", data: { id: bannerDoc._id, title: bannerDoc.title, backgroundImage: bannerDoc.backgroundImage } });
        }

        bannerDoc = new AboutUsBanner(bannerData);
        await bannerDoc.save();
        return res.status(201).json({ success: true, message: "Banner created successfully", data: { id: bannerDoc._id, title: bannerDoc.title, backgroundImage: bannerDoc.backgroundImage } });
    } catch (error) {
        console.error("Error creating/updating banner:", error.message);
        return res.status(500).json({ success: false, message: "Server error while creating/updating banner" });
    }
};

// Removed main content updater

const createOrUpdateStatistics = async (req, res) => {
    try {
        const statisticsData = req.body || {};
        let uploadedImageUrl = "";

        // If an image file is present, upload to Firebase similar to banner
        if (req.file) {
            try {
                const crypto = await import('crypto');
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `statistics-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
                const file = bucket.file(`about-us/statistics/${fileName}`);

                await new Promise((resolve, reject) => {
                    const stream = file.createWriteStream({
                        metadata: {
                            contentType: req.file.mimetype,
                        },
                    });

                    stream.on('error', (err) => reject(err));
                    stream.on('finish', async () => {
                        try {
                            await file.makePublic();
                            uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/about-us/statistics/${fileName}`;
                            resolve();
                        } catch (publicError) {
                            reject(publicError);
                        }
                    });

                    stream.end(req.file.buffer);
                });
            } catch (uploadError) {
                console.error('Firebase upload error:', uploadError);
                return res.status(500).json({
            success: false,
                    message: "Error uploading image to Firebase"
                });
            }
        }

        // Compose final stats payload; allow passing image as URL when no file
        const mergedStatistics = {
            years: Number(statisticsData.years) || 0,
            films: Number(statisticsData.films) || 0,
            countries: Number(statisticsData.countries) || 0,
            image: uploadedImageUrl || statisticsData.image || "",
        };

        let statsDoc = await AboutUsStatistics.findOne();
        if (statsDoc) {
            if (!uploadedImageUrl && !statisticsData.image && statsDoc.image) {
                mergedStatistics.image = statsDoc.image;
            }
            statsDoc.years = mergedStatistics.years;
            statsDoc.films = mergedStatistics.films;
            statsDoc.countries = mergedStatistics.countries;
            statsDoc.image = mergedStatistics.image;
            await statsDoc.save();
            return res.status(200).json({ success: true, message: "Statistics updated successfully", data: { id: statsDoc._id, years: statsDoc.years, films: statsDoc.films, countries: statsDoc.countries, image: statsDoc.image } });
        }

        statsDoc = new AboutUsStatistics(mergedStatistics);
        await statsDoc.save();
        return res.status(201).json({ success: true, message: "Statistics created successfully", data: { id: statsDoc._id, years: statsDoc.years, films: statsDoc.films, countries: statsDoc.countries, image: statsDoc.image } });
    } catch (error) {
        console.error("Error creating/updating statistics:", error.message);
        return res.status(500).json({ success: false, message: "Server error while creating/updating statistics" });
    }
};

// Removed three columns updater

// Look Inside - CREATE/UPDATE (admin)
const createOrUpdateLookInside = async (req, res) => {
    try {
        const { title = "", description = "" } = req.body || {};
        let uploadedImageUrl = "";

        if (req.file) {
            try {
                const crypto = await import('crypto');
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `lookinside-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
                const file = bucket.file(`about-us/look-inside/${fileName}`);

                await new Promise((resolve, reject) => {
                    const stream = file.createWriteStream({
                        metadata: { contentType: req.file.mimetype },
                    });
                    stream.on('error', (err) => reject(err));
                    stream.on('finish', async () => {
                        try {
                            await file.makePublic();
                            uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/about-us/look-inside/${fileName}`;
                            resolve();
                        } catch (publicError) {
                            reject(publicError);
                        }
                    });
                    stream.end(req.file.buffer);
                });
            } catch (uploadError) {
                console.error('Firebase upload error:', uploadError);
                return res.status(500).json({ success: false, message: "Error uploading image to Firebase" });
            }
        }

        const payload = {
            title,
            description,
            image: uploadedImageUrl || req.body.image || "",
        };

        let lookDoc = await AboutUsLookInside.findOne();
        if (lookDoc) {
            if (!uploadedImageUrl && !req.body.image && lookDoc.image) {
                payload.image = lookDoc.image;
            }
            lookDoc.title = payload.title;
            lookDoc.description = payload.description;
            lookDoc.image = payload.image;
            await lookDoc.save();
            return res.status(200).json({ success: true, message: "Look Inside updated successfully", data: { id: lookDoc._id, title: lookDoc.title, description: lookDoc.description, image: lookDoc.image } });
        }

        lookDoc = new AboutUsLookInside(payload);
        await lookDoc.save();
        return res.status(201).json({ success: true, message: "Look Inside created successfully", data: { id: lookDoc._id, title: lookDoc.title, description: lookDoc.description, image: lookDoc.image } });
    } catch (error) {
        console.error("Error creating/updating lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while creating/updating lookInside" });
    }
};

// Look Inside - DELETE (active)
const deleteAboutUsLookInside = async (req, res) => {
    try {
        const lookDoc = await AboutUsLookInside.findOne();
        if (!lookDoc) {
            return res.status(404).json({ success: false, message: "Look Inside not found" });
        }
        await deleteFileFromPublicUrl(lookDoc.image);
        const deletedId = lookDoc._id;
        await lookDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Look Inside document deleted", data: { id: deletedId } });
    } catch (error) {
        console.error("Error deleting lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting lookInside" });
    }
};

// Look Inside - DELETE by ID
const deleteAboutUsLookInsideById = async (req, res) => {
    try {
        const { id } = req.params;
        const lookDoc = await AboutUsLookInside.findById(id);
        if (!lookDoc) {
            return res.status(404).json({ success: false, message: "Look Inside not found" });
        }
        await deleteFileFromPublicUrl(lookDoc.image);
        await lookDoc.deleteOne();
        return res.status(200).json({ success: true, message: "Look Inside document deleted", data: { id } });
    } catch (error) {
        console.error("Error deleting lookInside by id:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting lookInside" });
    }
};

export {
    // Section-specific GET endpoints
    getAboutUsBanner,
    getAboutUsStatistics,
    // Look Inside GET
    getAboutUsLookInside,
    
    // Section-specific CREATE/UPDATE endpoints
    createOrUpdateBanner,
    createOrUpdateStatistics,
    // Look Inside CREATE/UPDATE
    createOrUpdateLookInside,
    
    // Section-specific DELETE endpoints
    deleteAboutUsBanner,
    deleteAboutUsStatistics,
    deleteAboutUsLookInside,
    // ID-based DELETE endpoints
    deleteAboutUsBannerById,
    deleteAboutUsStatisticsById,
    deleteAboutUsLookInsideById
};

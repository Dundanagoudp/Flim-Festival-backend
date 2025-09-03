import AboutUs from "../models/aboutusModule.js";
import { bucket } from "../config/firebaseConfig.js";


// Section-specific GET endpoints (public)
const getAboutUsBanner = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        
        if (!aboutUs) {
            return res.status(404).json({
                success: false,
                message: "About Us content not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Banner content retrieved successfully",
            data: { id: aboutUs._id, ...aboutUs.banner }
        });
    } catch (error) {
        console.error("Error fetching banner:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching banner content"
        });
    }
};

// Removed main content handler

const getAboutUsStatistics = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        
        if (!aboutUs) {
            return res.status(404).json({
                success: false,
                message: "About Us content not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Statistics retrieved successfully",
            data: { id: aboutUs._id, ...aboutUs.statistics }
        });
    } catch (error) {
        console.error("Error fetching statistics:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching statistics"
        });
    }
};

// Look Inside - GET (public)
const getAboutUsLookInside = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Look Inside content retrieved successfully",
            data: { id: aboutUs._id, ...aboutUs.lookInside }
        });
    } catch (error) {
        console.error("Error fetching lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching lookInside content" });
    }
};

const deleteAboutUsBanner = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.banner = { title: "", backgroundImage: "" };
        await aboutUs.save();
        res.status(200).json({ success: true, message: "Banner deleted successfully", data: { id: aboutUs._id, ...aboutUs.banner } });
    } catch (error) {
        console.error("Error deleting banner:", error.message);
        res.status(500).json({ success: false, message: "Server error while deleting banner" });
    }
};

const deleteAboutUsStatistics = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.statistics = { years: 0, films: 0, countries: 0, image: "" };
        await aboutUs.save();
        res.status(200).json({ success: true, message: "Statistics deleted successfully", data: { id: aboutUs._id, ...aboutUs.statistics } });
    } catch (error) {
        console.error("Error deleting statistics:", error.message);
        res.status(500).json({ success: false, message: "Server error while deleting statistics" });
    }
};

const deleteAboutUsBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const aboutUs = await AboutUs.findById(id);
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.banner = { title: "", backgroundImage: "" };
        await aboutUs.save();
        res.status(200).json({ success: true, message: "Banner deleted successfully", data: { id: aboutUs._id, ...aboutUs.banner } });
    } catch (error) {
        console.error("Error deleting banner by id:", error.message);
        res.status(500).json({ success: false, message: "Server error while deleting banner" });
    }
};

const deleteAboutUsStatisticsById = async (req, res) => {
    try {
        const { id } = req.params;
        const aboutUs = await AboutUs.findById(id);
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.statistics = { years: 0, films: 0, countries: 0, image: "" };
        await aboutUs.save();
        res.status(200).json({ success: true, message: "Statistics deleted successfully", data: { id: aboutUs._id, ...aboutUs.statistics } });
    } catch (error) {
        console.error("Error deleting statistics by id:", error.message);
        res.status(500).json({ success: false, message: "Server error while deleting statistics" });
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
            backgroundImage: backgroundImage || req.body.backgroundImage || ""
        };
        
        let aboutUs = await AboutUs.findOne({ isActive: true });
        
        if (aboutUs) {
            // If updating and no new image, keep existing image
            if (!backgroundImage && !req.body.backgroundImage) {
                bannerData.backgroundImage = aboutUs.banner.backgroundImage;
            }
            aboutUs.banner = { ...aboutUs.banner, ...bannerData };
            await aboutUs.save();
            
            res.status(200).json({
                success: true,
                message: "Banner updated successfully",
                data: { id: aboutUs._id, ...aboutUs.banner }
            });
        } else {
            aboutUs = new AboutUs({ banner: bannerData });
            await aboutUs.save();
            
            res.status(201).json({
                success: true,
                message: "Banner created successfully",
                data: { id: aboutUs._id, ...aboutUs.banner }
            });
        }
    } catch (error) {
        console.error("Error creating/updating banner:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while creating/updating banner"
        });
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
                const fileName = `statistics-${(await crypto).randomBytes(16).toString('hex')}.${fileExtension}`;
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
            ...statisticsData,
            ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}),
        };
        
        let aboutUs = await AboutUs.findOne({ isActive: true });
        
        if (aboutUs) {
            // Preserve existing image if none provided
            if (!uploadedImageUrl && !statisticsData.image && aboutUs.statistics?.image) {
                mergedStatistics.image = aboutUs.statistics.image;
            }
            aboutUs.statistics = { ...aboutUs.statistics, ...mergedStatistics };
            await aboutUs.save();
            
            return res.status(200).json({
                success: true,
                message: "Statistics updated successfully",
                data: { id: aboutUs._id, ...aboutUs.statistics }
            });
        } else {
            aboutUs = new AboutUs({ statistics: mergedStatistics });
            await aboutUs.save();
            
            return res.status(201).json({
                success: true,
                message: "Statistics created successfully",
                data: { id: aboutUs._id, ...aboutUs.statistics }
            });
        }
    } catch (error) {
        console.error("Error creating/updating statistics:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while creating/updating statistics"
        });
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
            ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}),
        };

        let aboutUs = await AboutUs.findOne({ isActive: true });
        if (aboutUs) {
            if (!uploadedImageUrl && aboutUs.lookInside?.image && !req.body.image) {
                payload.image = aboutUs.lookInside.image;
            } else if (!uploadedImageUrl && req.body.image) {
                payload.image = req.body.image;
            }
            aboutUs.lookInside = { ...aboutUs.lookInside, ...payload };
            await aboutUs.save();
            return res.status(200).json({ success: true, message: "Look Inside updated successfully", data: { id: aboutUs._id, ...aboutUs.lookInside } });
        } else {
            aboutUs = new AboutUs({ lookInside: payload });
            await aboutUs.save();
            return res.status(201).json({ success: true, message: "Look Inside created successfully", data: { id: aboutUs._id, ...aboutUs.lookInside } });
        }
    } catch (error) {
        console.error("Error creating/updating lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while creating/updating lookInside" });
    }
};

// Look Inside - DELETE (active)
const deleteAboutUsLookInside = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne({ isActive: true });
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.lookInside = { title: "", description: "", image: "" };
        await aboutUs.save();
        return res.status(200).json({ success: true, message: "Look Inside deleted successfully", data: { id: aboutUs._id, ...aboutUs.lookInside } });
    } catch (error) {
        console.error("Error deleting lookInside:", error.message);
        return res.status(500).json({ success: false, message: "Server error while deleting lookInside" });
    }
};

// Look Inside - DELETE by ID
const deleteAboutUsLookInsideById = async (req, res) => {
    try {
        const { id } = req.params;
        const aboutUs = await AboutUs.findById(id);
        if (!aboutUs) {
            return res.status(404).json({ success: false, message: "About Us content not found" });
        }
        aboutUs.lookInside = { title: "", description: "", image: "" };
        await aboutUs.save();
        return res.status(200).json({ success: true, message: "Look Inside deleted successfully", data: { id: aboutUs._id, ...aboutUs.lookInside } });
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

import Homepage from "../models/HomepageModel.js";

export const createHomepage = async (req, res) => {
    try {
        const homepage = await Homepage.create(req.body);
        res.status(201).json(homepage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getHomepage = async (req, res) => {
    try {
        const homepage = await Homepage.findOne();
        res.status(200).json(homepage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateHomepage = async (req, res) => {
    try {
        const homepage = await Homepage.findOneAndUpdate({}, req.body, { new: true });
        res.status(200).json(homepage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteHomepage = async (req, res) => {
    try {
        const homepage = await Homepage.findOneAndDelete();
        res.status(200).json(homepage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllHomepages = async (req, res) => {
    try {
        const homepages = await Homepage.find();
        res.status(200).json(homepages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
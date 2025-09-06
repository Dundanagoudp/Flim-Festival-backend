import mongoose from "mongoose";

// AboutUsBanner schema and model
const aboutUsBannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "",
        },
        backgroundImage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const AboutUsBanner = mongoose.model("AboutUsBanner", aboutUsBannerSchema);

// AboutUsStatistics schema and model
const aboutUsStatisticsSchema = new mongoose.Schema(
    {
        years: {
            type: Number,
            default: 0,
        },
        films: {
            type: Number,
            default: 0,
        },
        countries: {
            type: Number,
            default: 0,
        },
        image: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const AboutUsStatistics = mongoose.model("AboutUsStatistics", aboutUsStatisticsSchema);

// AboutUsLookInside schema and model
const aboutUsLookInsideSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const AboutUsLookInside = mongoose.model("AboutUsLookInside", aboutUsLookInsideSchema);

export { AboutUsBanner, AboutUsStatistics, AboutUsLookInside };


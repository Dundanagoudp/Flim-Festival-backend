import mongoose from "mongoose";

const aboutUsSchema = new mongoose.Schema({
    // Banner Section
    banner: {
        title: {
            type: String,
            required: false,
            default: ""
        },
        backgroundImage: {
            type: String, // URL or file path
            default: ""
        }
    },
    
    // Statistics Section
    statistics: {
        // New numeric summary stats
        years: {
            type: Number,
            default: 0
        },
        films: {
            type: Number,
            default: 0
        },
        countries: {
            type: Number,
            default: 0
        },
        image: {
            type: String,
            default: ""
        }
    },
    
    // Look Inside Section
    lookInside: {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        image: {
            type: String,
            default: ""
        }
    },
    
    // Meta information
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated field before saving
aboutUsSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

const AboutUs = mongoose.model("AboutUs", aboutUsSchema);
export default AboutUs;

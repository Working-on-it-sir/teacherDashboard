import mongoose from 'mongoose';

// Define the schema for the Teacher model
const teacherSchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String },
    teacherID: { type: String, unique: true },
    techUsed: [String], // Array of technologies used
    
    subjects: [
        {
            language: [String], // Array of languages spoken
            videos: [
                {
                    path: String, // Path to the video file
                    title: String, // Title of the video
                    duration: Number, // Duration in seconds
                    format: String, // File format (mp4, mkv, etc.)
                    uploadDate: { type: Date, default: Date.now },
                    views: { type: Number, default: 0 } // Views per video
                }
            ],
            subject: String,
            TotalStudentsTrial: {
                type: Number,
                default: 0
            },
            TotalStudentsPaid: {
                type: Number,
                default: 0
            },
            views: { type: Number, default: 0 } // Total views per subject
        }
    ], // Array of subjects
    
    Totalviews: { type: Number, default: 0 }, // Number of views for this teacher's content
    earnings: { type: Number, default: 0 }, // Earnings from the class
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }); // Enable virtuals

// Virtual field to calculate total views by adding all subject views
teacherSchema.virtual('calculatedTotalViews').get(function() {
    // Calculate the sum of views from all subjects
    if (!this.subjects || this.subjects.length === 0) return 0;
    
    return this.subjects.reduce((total, subject) => total + (subject.views || 0), 0);
});

// Calculate total trial students across all subjects
teacherSchema.virtual('totalTrialStudents').get(function() {
    if (!this.subjects || this.subjects.length === 0) return 0;
    
    return this.subjects.reduce((total, subject) => total + (subject.TotalStudentsTrial || 0), 0);
});

// Calculate total paid students across all subjects
teacherSchema.virtual('totalPaidStudents').get(function() {
    if (!this.subjects || this.subjects.length === 0) return 0;
    
    return this.subjects.reduce((total, subject) => total + (subject.TotalStudentsPaid || 0), 0);
});

// Virtual field for class student status with trial and paid students counts
teacherSchema.virtual('classStudentStatus').get(function() {
    const totalTrialStudents = this.totalTrialStudents;
    const totalPaidStudents = this.totalPaidStudents;
    const totalStudents = totalTrialStudents + totalPaidStudents;
    
    return {
        totalStudents,
        totalTrialStudents,
        totalPaidStudents,
        conversionRate: totalTrialStudents > 0 ? 
            ((totalPaidStudents / totalTrialStudents) * 100).toFixed(2) + '%' : '0%'
    };
});

// Pre-save middleware to update Totalviews from calculatedTotalViews
teacherSchema.pre('save', function(next) {
    if (this.subjects && this.subjects.length > 0) {
        this.Totalviews = this.subjects.reduce((total, subject) => total + (subject.views || 0), 0);
    }
    next();
});

// This middleware will run before insertMany operations
teacherSchema.pre('insertMany', function(next, docs) {
    if (Array.isArray(docs) && docs.length > 0) {
        docs.forEach(doc => {
            if (doc.subjects && doc.subjects.length > 0) {
                doc.Totalviews = doc.subjects.reduce((total, subject) => total + (subject.views || 0), 0);
            }
        });
    }
    next();
});

// Create the Teacher model using the schema
const Teacher = mongoose.model('TeachersDashboardSchema', teacherSchema);

export default Teacher;
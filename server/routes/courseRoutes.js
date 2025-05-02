import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure storage for course videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/courses'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Create Course Schema
const courseSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  experienceYears: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Course = mongoose.model('Course', courseSchema);

// Add new course
router.post('/add', upload.single('courseVideo'), async (req, res) => {
  try {
    const { tutorId, courseName, experienceYears, experience, language } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Course video is required' });
    }

    const newCourse = new Course({
      tutorId,
      courseName,
      experienceYears,
      experience,
      language,
      videoUrl: req.file.filename
    });

    await newCourse.save();
    res.status(201).json({ 
      message: 'Course added successfully', 
      course: newCourse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add course', error: err.message });
  }
});

// Get all courses for a tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const courses = await Course.find({ tutorId: req.params.tutorId });
    res.status(200).json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
});

// Update a course
router.put('/update/:courseId', upload.single('courseVideo'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { courseName, experienceYears, experience, language } = req.body;
    
    // Get the current course to check its video
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update fields
    const updateData = {
      courseName,
      experienceYears,
      experience,
      language
    };
    
    // If a new video is uploaded, update the video URL and delete the old file
    if (req.file) {
      // Delete old video file
      const oldVideoPath = path.join(__dirname, '../uploads/courses', course.videoUrl);
      fs.unlink(oldVideoPath, (err) => {
        if (err) console.error('Error deleting old video file:', err);
      });
      
      // Set new video URL
      updateData.videoUrl = req.file.filename;
    }
    
    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId, 
      updateData,
      { new: true }
    );
    
    res.status(200).json({ 
      message: 'Course updated successfully', 
      course: updatedCourse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
});

// Delete a course
router.delete('/delete/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Log for debugging
    console.log('Deleting course with ID:', courseId);
    
    // Find the course to get its video file info
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete the course from the database
    await Course.findByIdAndDelete(courseId);
    
    // Delete the video file from storage
    if (course.videoUrl) {
      const videoPath = path.join(__dirname, '../uploads/courses', course.videoUrl);
      try {
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(
            videoPath);
        }
      } catch (fsErr) {
        console.error('Error deleting video file:', fsErr);
      }
    }
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ message: 'Failed to delete course', error: err.message });
  }
});

export default router;
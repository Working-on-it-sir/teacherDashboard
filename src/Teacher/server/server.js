import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import multer from 'multer';
import Teacher from './models/teacherModel.js';
import Tutor from './models/tutor.js';
import courseRoutes from './routes/courseRoutes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacherDB';
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// Static file serving for uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure storage for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    const uploadDir = path.join(__dirname, 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connection successful');
    // Create admin user if it doesn't exist
    createAdminUser();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Function to create admin user if it doesn't exist - with better error handling
async function createAdminUser() {
  try {
    // Check if admin user already exists
    const adminExists = await Tutor.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('Admin user not found, creating one...');
      
      // Create unhashed password for direct comparison in login route
      const plainPassword = 'admin';
      
      // Hash password for storage
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Create new admin user with all required fields
      const adminUser = new Tutor({
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        email: 'admin@example.com',
        city: 'Admin City',
        state: 'AS',
        aadhar: 'ADMIN123456789'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
      
      // Verify the user was created
      const verifyAdmin = await Tutor.findOne({ username: 'admin' });
      if (verifyAdmin) {
        console.log('Admin user verified in database');
      }
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Authentication endpoints - improved with better debugging
app.post('/api/tutor/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    
    // Find the user by username
    const tutor = await Tutor.findOne({ username });
    if (!tutor) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`User found: ${username}`);
    
    // Compare passwords - with direct comparison for admin during development
    let isMatch = false;
    
    if (username === 'admin' && password === 'admin') {
      // Special case for admin user - direct password comparison for easier debugging
      console.log('Admin user with direct password match');
      isMatch = true;
    } else {
      // Regular bcrypt comparison for all other users
      isMatch = await bcrypt.compare(password, tutor.password);
      console.log(`Password comparison result: ${isMatch}`);
    }
    
    if (!isMatch) {
      console.log(`Password mismatch for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Password matches - create user object without password
    const tutorInfo = tutor.toObject();
    delete tutorInfo.password;
    
    console.log(`Login successful for: ${username}`);
    res.status(200).json({ 
      message: 'Login successful',
      tutor: tutorInfo
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration endpoint
app.post('/api/tutor/register', async (req, res) => {
  try {
    const { username, password, name, email, city, state, aadhar } = req.body;
    
    // Check if username already exists
    const existingUsername = await Tutor.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await Tutor.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new tutor
    const newTutor = new Tutor({
      username,
      password: hashedPassword,
      name,
      email,
      city,
      state,
      aadhar
    });
    
    await newTutor.save();
    res.status(201).json({ message: 'Tutor registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Add a test route to check if admin exists and verify password
app.get('/api/test-admin', async (req, res) => {
  try {
    const admin = await Tutor.findOne({ username: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    return res.status(200).json({ 
      message: 'Admin user exists',
      username: admin.username,
      name: admin.name,
      email: admin.email
    });
  } catch (err) {
    console.error('Test admin error:', err);
    res.status(500).json({ message: 'Error testing admin', error: err.message });
  }
});

// Use course routes
app.use('/api/courses', courseRoutes);

// Route to get all teachers with virtual fields
app.get('/api/teachers', async (req, res) => {
  try {
    // Find all teachers and include virtual fields
    const teachers = await Teacher.find();
    // Return teachers with virtual fields included
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get a specific teacher by ID with virtual fields
app.get('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    // Return teacher with virtual fields
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to demonstrate calculating classStatus manually
app.get('/api/teachers/:id/class-status', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Access the virtual field
    const classStatus = teacher.classStudentStatus;
    
    res.json({
      teacherId: teacher.teacherID,
      teacherName: teacher.name,
      classStatus: classStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all teachers with their class statistics
app.get('/api/class-statistics', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    
    // Process the data to include class statistics
    const classStatistics = teachers.map(teacher => {
      // Get class status from virtual field
      const classStatus = teacher.classStudentStatus;
      const totalStudents = classStatus.totalStudents;
      
      // Calculate percentage of trial vs paid students
      const trialPercentage = (classStatus.totalTrialStudents / totalStudents * 100 || 0).toFixed(1);
      const paidPercentage = (classStatus.totalPaidStudents / totalStudents * 100 || 0).toFixed(1);
      
      // Calculate average students per subject
      const avgStudentsPerSubject = (totalStudents / (teacher.subjects.length || 1)).toFixed(1);
      
      return {
        teacherName: teacher.name,
        teacherId: teacher.teacherID,
        role: teacher.role,
        totalSubjects: teacher.subjects.length,
        technologies: teacher.techUsed,
        languages: teacher.subjects.map(s => s.language).flat(),
        classStatus: classStatus,
        statistics: {
          totalStudents,
          trialPercentage: `${trialPercentage}%`,
          paidPercentage: `${paidPercentage}%`,
          avgStudentsPerSubject,
          conversionRate: classStatus.conversionRate
        }
      };
    });
    
    res.json(classStatistics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get views statistics for all teachers
app.get('/api/views-statistics', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    
    // Process the data to include views statistics
    const viewsStatistics = teachers.map(teacher => {
      // Calculate total views
      const totalViews = teacher.Totalviews || 0;
      
      // Calculate percentage of views by subject
      const subjectViewsBreakdown = teacher.subjects.map(subject => ({
        subject: subject.subject,
        views: subject.views || 0,
        percentage: ((subject.views || 0) / (totalViews || 1) * 100).toFixed(1) + '%'
      }));
      
      return {
        teacherName: teacher.name,
        teacherId: teacher.teacherID,
        role: teacher.role,
        viewsData: {
          totalViews,
          subjectBreakdown: subjectViewsBreakdown
        }
      };
    });
    
    res.json(viewsStatistics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific teacher views data
app.get('/api/teachers/:id/views', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const totalViews = teacher.Totalviews || 0;
    
    res.json({
      teacherId: teacher.teacherID,
      teacherName: teacher.name,
      totalViews,
      subjectsViewsBreakdown: teacher.subjects.map(subject => ({
        subject: subject.subject,
        views: subject.views || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all videos from all teachers
app.get('/api/videos', async (req, res) => {
  try {
    const teachers = await Teacher.find().select('name teacherID subjects.subject subjects.videos');
    
    const allVideos = [];
    
    teachers.forEach(teacher => {
      teacher.subjects.forEach(subject => {
        subject.videos.forEach(video => {
          allVideos.push({
            teacherName: teacher.name,
            teacherID: teacher.teacherID,
            subject: subject.subject,
            videoDetails: {
              title: video.title,
              path: video.path,
              format: video.format,
              duration: video.duration,
              views: video.views,
              uploadDate: video.uploadDate,
              streamUrl: `/api/stream-video/${encodeURIComponent(video.path)}`
            }
          });
        });
      });
    });
    
    res.json(allVideos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get videos for a specific teacher
app.get('/api/teachers/:id/videos', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('name teacherID subjects.subject subjects.videos');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const teacherVideos = [];
    
    teacher.subjects.forEach(subject => {
      subject.videos.forEach(video => {
        teacherVideos.push({
          subject: subject.subject,
          videoDetails: {
            title: video.title,
            path: video.path,
            format: video.format,
            duration: video.duration,
            views: video.views,
            uploadDate: video.uploadDate,
            streamUrl: `/api/stream-video/${encodeURIComponent(video.path)}`
          }
        });
      });
    });
    
    res.json({
      teacherName: teacher.name,
      teacherID: teacher.teacherID,
      videos: teacherVideos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stream a specific video file
app.get('/api/stream-video/:videoPath', (req, res) => {
  try {
    const videoPath = decodeURIComponent(req.params.videoPath);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }
    
    // Get file stats
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Handle range requests (important for video streaming)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Calculate content length
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, {start, end});
      
      // Set appropriate headers for streaming
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': videoPath.endsWith('.mp4') ? 'video/mp4' : 'video/x-matroska'
      };
      
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Set headers for the entire file
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': videoPath.endsWith('.mp4') ? 'video/mp4' : 'video/x-matroska'
      };
      
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Increment view count for a specific video
app.post('/api/videos/view/:teacherId/:subjectIndex/:videoIndex', async (req, res) => {
  try {
    const { teacherId, subjectIndex, videoIndex } = req.params;
    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (!teacher.subjects[subjectIndex] || !teacher.subjects[subjectIndex].videos[videoIndex]) {
      return res.status(404).json({ message: 'Subject or video not found' });
    }
    
    // Increment view counts
    teacher.subjects[subjectIndex].videos[videoIndex].views += 1;
    teacher.subjects[subjectIndex].views += 1;
    
    await teacher.save();
    
    res.json({ 
      message: 'View count updated successfully',
      newViewCount: teacher.subjects[subjectIndex].videos[videoIndex].views
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ------------------------------------------------
// Subject Management Routes
// ------------------------------------------------

// Add new subject with video
app.post('/api/subjects/add', videoUpload.single('video'), async (req, res) => {
  try {
    const { tutorId, subjectName, experienceYears, description } = req.body;
    
    // Get language from request body, handling both string and array formats
    let language = req.body.language;
    if (!Array.isArray(language)) {
      language = language.split(',').map(lang => lang.trim());
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }
    
    // Get the first teacher for demo purposes
    // In a real app, you would match tutor to a specific teacher
    const teachers = await Teacher.find();
    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: 'No teachers found' });
    }
    
    const teacher = teachers[0];
    
    // Get video file details
    const videoPath = req.file.path;
    const format = path.extname(req.file.originalname).substring(1); // Remove the dot
    
    // Create a new subject object
    const newSubject = {
      subject: subjectName,
      description: description,
      language: language,
      TotalStudentsTrial: 0,
      TotalStudentsPaid: 0,
      views: 0,
      videos: [
        {
          path: videoPath,
          title: subjectName, // Using subject name as video title, you can customize this
          duration: 0, // This would be calculated from the actual video in a real app
          format: format,
          views: 0,
          uploadDate: new Date()
        }
      ]
    };
    
    // Add the new subject to the teacher's subjects array
    teacher.subjects.push(newSubject);
    await teacher.save();
    
    res.status(201).json({
      message: 'Subject added successfully',
      subject: newSubject
    });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ message: 'Failed to add subject', error: error.message });
  }
});

// Update a subject
app.put('/api/subjects/update/:teacherId/:subjectIndex', videoUpload.single('video'), async (req, res) => {
  try {
    const { teacherId, subjectIndex } = req.params;
    const { subjectName, description } = req.body;
    
    // Get language from request body, handling both string and array formats
    let language = req.body.language;
    if (!Array.isArray(language)) {
      language = language.split(',').map(lang => lang.trim());
    }
    
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Verify subject exists
    if (!teacher.subjects[subjectIndex]) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Update the subject properties
    teacher.subjects[subjectIndex].subject = subjectName;
    teacher.subjects[subjectIndex].description = description;
    teacher.subjects[subjectIndex].language = language;
    
    // If a new video is uploaded, add it to the videos array
    if (req.file) {
      const videoPath = req.file.path;
      const format = path.extname(req.file.originalname).substring(1);
      
      // Add as a new video or replace the first one
      const newVideo = {
        path: videoPath,
        title: subjectName,
        duration: 0, // This would be calculated from the actual video in a real app
        format: format,
        views: 0,
        uploadDate: new Date()
      };
      
      // Option 1: Add as an additional video
      teacher.subjects[subjectIndex].videos.push(newVideo);
      
      // Option 2: Replace the first video (uncomment if needed)
      // if (teacher.subjects[subjectIndex].videos.length > 0) {
      //   // Delete old video file if it exists
      //   const oldVideoPath = teacher.subjects[subjectIndex].videos[0].path;
      //   if (fs.existsSync(oldVideoPath)) {
      //     fs.unlinkSync(oldVideoPath);
      //   }
      //   teacher.subjects[subjectIndex].videos[0] = newVideo;
      // } else {
      //   teacher.subjects[subjectIndex].videos.push(newVideo);
      // }
    }
    
    await teacher.save();
    
    res.status(200).json({
      message: 'Subject updated successfully',
      subject: teacher.subjects[subjectIndex]
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ message: 'Failed to update subject', error: error.message });
  }
});

// Delete a subject
app.delete('/api/subjects/delete/:teacherId/:subjectIndex', async (req, res) => {
  try {
    const { teacherId, subjectIndex } = req.params;
    
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Verify subject exists
    if (!teacher.subjects[subjectIndex]) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Get the subject for deleting video files
    const subject = teacher.subjects[subjectIndex];
    
    // Delete associated video files
    if (subject.videos && subject.videos.length > 0) {
      subject.videos.forEach(video => {
        try {
          if (fs.existsSync(video.path)) {
            fs.unlinkSync(video.path);
            console.log(`Deleted video file: ${video.path}`);
          }
        } catch (fsErr) {
          console.error('Error deleting video file:', fsErr);
        }
      });
    }
    
    // Remove the subject from the array
    teacher.subjects.splice(subjectIndex, 1);
    await teacher.save();
    
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Failed to delete subject', error: error.message });
  }
});

// Add a new video to an existing subject
app.post('/api/subjects/:teacherId/:subjectIndex/addVideo', videoUpload.single('video'), async (req, res) => {
  try {
    const { teacherId, subjectIndex } = req.params;
    const { videoTitle } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }
    
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Verify subject exists
    if (!teacher.subjects[subjectIndex]) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Get video file details
    const videoPath = req.file.path;
    const format = path.extname(req.file.originalname).substring(1);
    
    // Create new video object
    const newVideo = {
      path: videoPath,
      title: videoTitle || `Video for ${teacher.subjects[subjectIndex].subject}`,
      duration: 0, // This would be calculated from the actual video in a real app
      format: format,
      views: 0,
      uploadDate: new Date()
    };
    
    // Add video to the subject
    teacher.subjects[subjectIndex].videos.push(newVideo);
    await teacher.save();
    
    res.status(201).json({
      message: 'Video added successfully',
      video: newVideo
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ message: 'Failed to add video', error: error.message });
  }
});

// Delete a video from a subject
app.delete('/api/subjects/:teacherId/:subjectIndex/videos/:videoIndex', async (req, res) => {
  try {
    const { teacherId, subjectIndex, videoIndex } = req.params;
    
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Verify subject exists
    if (!teacher.subjects[subjectIndex]) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Verify video exists
    if (!teacher.subjects[subjectIndex].videos[videoIndex]) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Get video path for deletion
    const videoPath = teacher.subjects[subjectIndex].videos[videoIndex].path;
    
    // Delete the video file
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log(`Deleted video file: ${videoPath}`);
      }
    } catch (fsErr) {
      console.error('Error deleting video file:', fsErr);
    }
    
    // Remove the video from the array
    teacher.subjects[subjectIndex].videos.splice(videoIndex, 1);
    await teacher.save();
    
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
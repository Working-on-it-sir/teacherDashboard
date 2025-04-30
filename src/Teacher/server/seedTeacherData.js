import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from './models/teacherModel.js'; 
dotenv.config();

const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('MongoDB connection successful');

    // Example teacher data with video objects
    const teachers = [
      {
        name: "John Smith",
        role: "Senior Math Teacher",
        teacherID: "TECH001",
        techUsed: ["PowerPoint", "Tablet", "Digital Whiteboard"],
        subjects: [
          {
            language: ["English", "Spanish"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\1.mkv",
                title: "Algebra Fundamentals",
                duration: 1800, // 30 minutes
                format: "mkv",
                views: 452
              },
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\2.mp4",
                title: "Advanced Algebra Techniques",
                duration: 2400, // 40 minutes
                format: "mp4",
                views: 328
              }
            ],
            subject: "Algebra",
            TotalStudentsTrial: 25,
            TotalStudentsPaid: 18,
            views: 780
          },
          {
            language: ["English"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\3.mkv",
                title: "Calculus I - Introduction",
                duration: 3600, // 60 minutes
                format: "mkv",
                views: 541
              },
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\1.mkv",
                title: "Calculus II - Advanced Topics",
                duration: 2700, // 45 minutes
                format: "mkv",
                views: 387
              }
            ],
            subject: "Calculus",
            TotalStudentsTrial: 18,
            TotalStudentsPaid: 12,
            views: 928
          },
          {
            language: ["English", "Spanish"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\2.mp4",
                title: "Understanding Geometry",
                duration: 1500, // 25 minutes
                format: "mp4",
                views: 325
              }
            ],
            subject: "Geometry",
            TotalStudentsTrial: 15,
            TotalStudentsPaid: 8,
            views: 325
          }
        ],
        earnings: 2500
      },
      {
        name: "Sarah Johnson",
        role: "Physics Professor",
        teacherID: "TECH002",
        techUsed: ["Interactive Simulations", "Digital Labs", "VR Equipment"],
        subjects: [
          {
            language: ["English", "French"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\3.mkv",
                title: "Mechanics - Basic Principles",
                duration: 3200, // ~53 minutes
                format: "mkv",
                views: 712
              },
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\1.mkv",
                title: "Newton's Laws of Motion",
                duration: 2800, // ~47 minutes
                format: "mkv",
                views: 658
              }
            ],
            subject: "Mechanics",
            TotalStudentsTrial: 32,
            TotalStudentsPaid: 24,
            views: 1370
          },
          {
            language: ["English"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\2.mp4",
                title: "Electricity and Magnetism",
                duration: 2900, // ~48 minutes
                format: "mp4",
                views: 523
              }
            ],
            subject: "Electromagnetism",
            TotalStudentsTrial: 28,
            TotalStudentsPaid: 20,
            views: 523
          },
          {
            language: ["English", "French"],
            videos: [
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\3.mkv",
                title: "Quantum Physics for Beginners",
                duration: 4200, // 70 minutes
                format: "mkv",
                views: 872
              },
              {
                path: "C:\\Users\\1887s\\OneDrive\\Desktop\\kanishk\\internship\\teachers\\server\\uploads\\videos\\1.mkv",
                title: "Quantum Mechanics Advanced Concepts",
                duration: 3600, // 60 minutes
                format: "mkv",
                views: 614
              }
            ],
            subject: "Quantum Physics",
            TotalStudentsTrial: 20,
            TotalStudentsPaid: 12,
            views: 1486
          }
        ],
        earnings: 3200
      }
    ];

    try {
      // Check if teacher data already exists to avoid duplicates
      const existingTeachers = await Teacher.find({ teacherID: { $in: ["TECH001", "TECH002"] } });
      
      if (existingTeachers.length > 0) {
        console.log('Teachers already exist in database. Removing existing data before inserting...');
        await Teacher.deleteMany({ teacherID: { $in: ["TECH001", "TECH002"] } });
      }

      // Insert multiple teachers into the database
      const insertedTeachers = await Teacher.insertMany(teachers);
      console.log(`${insertedTeachers.length} teachers added successfully`);

      // Verify virtual fields by retrieving one teacher
      if (insertedTeachers.length > 0) {
        const teacherId = insertedTeachers[0]._id;
        const teacherWithVirtuals = await Teacher.findById(teacherId);
        
        console.log('Sample teacher with virtual fields:');
        console.log(JSON.stringify({
          name: teacherWithVirtuals.name,
          teacherID: teacherWithVirtuals.teacherID,
          // Show the calculated fields
          calculatedTotalViews: teacherWithVirtuals.calculatedTotalViews,
          storedTotalViews: teacherWithVirtuals.Totalviews,
          classStudentStatus: teacherWithVirtuals.classStudentStatus,
          totalTrialStudents: teacherWithVirtuals.totalTrialStudents,
          totalPaidStudents: teacherWithVirtuals.totalPaidStudents
        }, null, 2));
        
        // Example of getting the second teacher to show different student stats
        if (insertedTeachers.length > 1) {
          const secondTeacherId = insertedTeachers[1]._id;
          const secondTeacherWithVirtuals = await Teacher.findById(secondTeacherId);
          
          console.log('\nSecond teacher with virtual fields:');
          console.log(JSON.stringify({
            name: secondTeacherWithVirtuals.name,
            teacherID: secondTeacherWithVirtuals.teacherID,
            calculatedTotalViews: secondTeacherWithVirtuals.calculatedTotalViews,
            storedTotalViews: secondTeacherWithVirtuals.Totalviews,
            classStudentStatus: secondTeacherWithVirtuals.classStudentStatus
          }, null, 2));
        }
      }
    } catch (error) {
      console.error('Error inserting teacher data:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    mongoose.connection.close();
  });
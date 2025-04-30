import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../App.css"; 
import DashboardHeader from './DashboardHeader';

function CourseManagement() {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseName: '',
    experienceYears: '',
    experience: '',
    language: '',
    courseVideo: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Add new state for editing
  const [editingCourse, setEditingCourse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const tutorInfo = localStorage.getItem('tutorInfo');
    if (!tutorInfo) {
      navigate('/teacher/signin');
      return;
    }
    
    // Parse the stored tutor info
    const parsedTutorInfo = JSON.parse(tutorInfo);
    setTutor(parsedTutorInfo);
    setLoading(false);
    
    // Fetch courses for this tutor
    fetchCourses(parsedTutorInfo._id);
  }, [navigate]);
  
  const fetchCourses = async (tutorId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/tutor/${tutorId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourses(data);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // If we're editing, use update logic instead
      if (editingCourse) {
        return handleUpdateCourse(e);
      }
      
      if (!formData.courseVideo) {
        setError('Please upload a course video');
        return;
      }
      
      const courseData = new FormData();
      courseData.append('tutorId', tutor._id);
      courseData.append('courseName', formData.courseName);
      courseData.append('experienceYears', formData.experienceYears);
      courseData.append('experience', formData.experience);
      courseData.append('language', formData.language);
      courseData.append('courseVideo', formData.courseVideo);
      
      const response = await fetch('http://localhost:5000/api/courses/add', {
        method: 'POST',
        body: courseData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add course');
      }
      
      setSuccess('Course added successfully!');
      
      // Reset form
      resetForm();
      
      // Refresh courses
      fetchCourses(tutor._id);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.error('Error:', err);
    }
  };
  
  // New function to reset the form
  const resetForm = () => {
    setFormData({
      courseName: '',
      experienceYears: '',
      experience: '',
      language: '',
      courseVideo: null
    });
    setEditingCourse(null);
  };
  
  // New function to handle edit button click
  const handleEditClick = (course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      experienceYears: course.experienceYears || '',
      experience: course.experience,
      language: course.language,
      courseVideo: null // We can't populate the file input, but we'll handle this conditionally
    });
    
    // Scroll to the form
    document.querySelector('.add-course').scrollIntoView({ behavior: 'smooth' });
  };
  
  // New function to update a course
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const courseData = new FormData();
      courseData.append('courseName', formData.courseName);
      courseData.append('experienceYears', formData.experienceYears);
      courseData.append('experience', formData.experience);
      courseData.append('language', formData.language);
      
      // Only append video if a new one is selected
      if (formData.courseVideo) {
        courseData.append('courseVideo', formData.courseVideo);
      }
      
      const response = await fetch(`http://localhost:5000/api/courses/update/${editingCourse._id}`, {
        method: 'PUT',
        body: courseData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update course');
      }
      
      setSuccess('Course updated successfully!');
      
      // Reset form
      resetForm();
      
      // Refresh courses
      fetchCourses(tutor._id);
    } catch (err) {
      setError(err.message || 'Something went wrong with update');
      console.error('Error updating course:', err);
    }
  };
  
  // New function to handle delete confirmation
  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };
  
  // New function to handle course deletion
  const handleDeleteCourse = async () => {
    try {
      console.log('Deleting course:', courseToDelete._id);
      
      const response = await fetch(`http://localhost:5000/api/courses/delete/${courseToDelete._id}`, {
        method: 'DELETE',
      });
      
      // Log the response for debugging
      console.log('Delete response status:', response.status);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Received non-JSON response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete course');
      }
      
      setSuccess('Course deleted successfully!');
      
      // Add the optimistic UI update here
      setCourses(prevCourses => prevCourses.filter(course => course._id !== courseToDelete._id));
      
      // Close modal
      setShowDeleteModal(false);
      setCourseToDelete(null);
      
      // Refresh courses (consider removing this since we already updated the UI)
      // fetchCourses(tutor._id);
    } catch (err) {
      setError(err.message || 'Something went wrong with deletion');
      console.error('Error deleting course:', err);
      setShowDeleteModal(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    resetForm();
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="teacher-dashboard">
      <DashboardHeader />
      
      <div className="dashboard-content">
        <h1>Course Management</h1>
        <p className="welcome-text">Welcome, {tutor.name}</p>
        
        {/* Dashboard Tabs for Navigation */}
        <div className="dashboard-tabs">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Overview
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Class Statistics
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Views Statistics
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Videos
          </button>
          <button 
            className="active"
            onClick={() => navigate('/teacher/CourseManagement')}
          >
            Course Management
          </button>
        </div>
      
        <div className="content-area">
          <section className="add-course">
            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="courseName">Course Name</label>
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="experienceYears">Years of Experience</label>
                <select
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Years of Experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="experience">Course Description</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  placeholder="Describe the course content and what students will learn"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="language">Course Language</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="courseVideo">
                  {editingCourse ? 'Course Video (Leave empty to keep current video)' : 'Course Video'}
                </label>
                <input
                  type="file"
                  id="courseVideo"
                  name="courseVideo"
                  onChange={handleChange}
                  accept="video/*"
                  required={!editingCourse}
                />
                <small>Upload a video file for your course</small>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </button>
                
                {editingCourse && (
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
          
          <section className="course-list">
            <h2>Your Courses</h2>
            {courses.length === 0 ? (
              <p>You haven't added any courses yet.</p>
            ) : (
              <div className="courses-grid">
                {courses.map(course => (
                  <div key={course._id} className="course-card">
                    <h3>{course.courseName}</h3>
                    <p><strong>Language:</strong> {course.language}</p>
                    <div className="course-details">
                      <video controls width="100%">
                        <source src={`http://localhost:5000/uploads/courses/${course.videoUrl}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="course-info">
                        <h4>Course Details:</h4>
                        <p><strong>Teaching Experience:</strong> {course.experienceYears || 'Not specified'}</p>
                        <p>{course.experience}</p>
                        <p className="date-added">Added: {new Date(course.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="course-actions">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditClick(course)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteClick(course)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete the course "{courseToDelete?.courseName}"?</p>
              <p className="warning">This action cannot be undone.</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-btn" 
                  onClick={handleDeleteCourse}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseManagement;

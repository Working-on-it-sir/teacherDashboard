import React from 'react';
import SubjectCard from './SubjectCard';

const CourseCard = ({ course, courseIndex, filter, handleView, handleTrialRegister, handleNormalRegister }) => {
  return (
    <div className="course-card">
      <h2>{course.title}</h2>
      {course.subjects
        .filter(subject => subject.name.toLowerCase().includes(filter.toLowerCase()))
        .map((subject, subjectIndex) => (
          <SubjectCard
            key={subjectIndex}
            subject={subject}
            onView={() => handleView(courseIndex, subjectIndex)}
            onTrialRegister={() => handleTrialRegister(courseIndex, subjectIndex)}
            onNormalRegister={() => handleNormalRegister(courseIndex, subjectIndex)}
          />
        ))}
    </div>
  );
};

export default CourseCard;

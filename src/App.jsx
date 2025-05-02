import { useState } from 'react'
import { Link } from 'react-router-dom';
import CourseManagement from './components/CourseManagement';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      <h1>Hello from Home Page</h1>
      <CourseManagement />
   
    </>
  )
}

export default App

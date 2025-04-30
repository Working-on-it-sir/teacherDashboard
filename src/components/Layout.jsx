import { Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> 
        <Link to="/teacher/signin">Teacher Login</Link>
      </nav>
      
      {/* This is where nested routes will render */}
      <Outlet />
    </>
  );
}

export default Layout;


// import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
// import { useEffect, useState } from 'react';

// function Layout() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     // Check login status whenever location changes
//     const tutorInfo = localStorage.getItem('tutorInfo');
//     setIsLoggedIn(!!tutorInfo);
//   }, [location]);

//   const handleLogout = () => {
//     localStorage.removeItem('tutorInfo');
//     setIsLoggedIn(false);
//     navigate('/');
//   };

//   return (
//     <>
//       <nav className="main-nav">
//         <Link to="/">Home</Link> 
//         {isLoggedIn ? (
//           <>
//             <Link to="../Teacher/frontend/CourseManagement">My Courses</Link>
//             <button onClick={handleLogout} className="logout-link">Logout</button>
//           </>
//         ) : (
//           <Link to="/teacher/signin">Teacher Login</Link>
//         )}
//       </nav>
      
//       {/* This is where nested routes will render */}
//       <main className="content-container">
//         <Outlet />
//       </main>
//     </>
//   );
// }

// export default Layout;
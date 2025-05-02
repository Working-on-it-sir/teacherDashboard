import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import SignIn from './components/signIn';
import Layout from './components/Layout';
import CourseManagement from './components/CourseManagement';
import TeacherDashboard from './components/TeacherDashboard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <App />
      },
      {
        path: "teacher",
        children: [
          {
            path: "signin",
            element: <SignIn />
          },
          {
            path: "dashboard",
            element: <TeacherDashboard />
          },
          {
            path: "CourseManagement",
            element: <CourseManagement />
          }
          //  add other routes here
        ]
      }
    ]
  }
]);

export default router;
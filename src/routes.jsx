import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import SignIn from './Teacher/frontend/signIn';
import Layout from './components/Layout';
import CourseManagement from './Teacher/frontend/CourseManagement';
import TeacherDashboard from './Teacher/frontend/TeacherDashboard';

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
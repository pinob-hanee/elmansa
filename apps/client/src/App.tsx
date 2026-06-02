import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));
// Student routes
const StudentLayout = lazy(() => import('./layouts/StudentLayout'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const CoursesPage = lazy(() => import('./pages/student/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/student/CourseDetailPage'));
const LessonPage = lazy(() => import('./pages/student/LessonPage'));
const CommunityPage = lazy(() => import('./pages/student/CommunityPage'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'));

// Admin routes
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminCourseEditor = lazy(() => import('./pages/admin/CourseEditor'));
const AdminCommunity = lazy(() => import('./pages/admin/Community'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Route guards
const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  // PENDING students can see the student area — Dashboard will show a banner
  if (user?.approvalStatus === 'PENDING' && user.role === 'STUDENT' && roles) {
    // Only block role-restricted routes (like admin), but let student routes pass
    return <>{children}</>;
  }
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.approvalStatus === 'APPROVED') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-surface-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-surface-400 text-sm">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Student routes */}
            <Route path="/" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:slug" element={<CourseDetailPage />} />
              <Route path="courses/:slug/lesson/:lessonId" element={<LessonPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['SUPER_ADMIN', 'TEACHER', 'MODERATOR']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/new" element={<AdminCourseEditor />} />
              <Route path="courses/:id/edit" element={<AdminCourseEditor />} />
              <Route path="community" element={<AdminCommunity />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
    </QueryClientProvider>
  );
}

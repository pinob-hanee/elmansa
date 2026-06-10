const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'apps/client/src/i18n/locales/en.json');
const arPath = path.join(__dirname, 'apps/client/src/i18n/locales/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Adding Dashboard translations
en.adminDashboard = {
  title: "Dashboard",
  subtitle: "Welcome! Here is an overview of the platform",
  totalStudents: "Total Students",
  pendingStudents: "Pending",
  courses: "Courses",
  publishedCourses: "Published",
  totalEnrollments: "Total Enrollments",
  acrossAllCourses: "Across all courses",
  pendingAlert: "{{count}} students waiting for approval",
  reviewRequests: "Review new registration requests",
  reviewBtn: "Review",
  recentStudents: "Recent Registered Students",
  student: "Student",
  email: "Email",
  registrationDate: "Registration Date",
  status: "Status",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected"
};

ar.adminDashboard = {
  title: "لوحة التحكم",
  subtitle: "مرحباً! إليك نظرة عامة على المنصة",
  totalStudents: "إجمالي الطلاب",
  pendingStudents: "في الانتظار",
  courses: "الكورسات",
  publishedCourses: "منشور",
  totalEnrollments: "إجمالي التسجيلات",
  acrossAllCourses: "عبر جميع الكورسات",
  pendingAlert: "{{count}} طالب ينتظر الموافقة",
  reviewRequests: "راجع طلبات التسجيل الجديدة",
  reviewBtn: "مراجعة",
  recentStudents: "أحدث الطلاب المسجلين",
  student: "الطالب",
  email: "البريد",
  registrationDate: "تاريخ التسجيل",
  status: "الحالة",
  approved: "مقبول",
  pending: "منتظر",
  rejected: "مرفوض"
};

// Adding Students translations
en.adminStudents = {
  title: "Student Management",
  subtitle: "Review and manage registration requests and students",
  searchPlaceholder: "Search by name or email...",
  allStatuses: "All Statuses",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  banned: "Banned",
  student: "Student",
  details: "Details",
  status: "Status",
  registrationDate: "Registration Date",
  actions: "Actions",
  noStudents: "No students match the search",
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend",
  viewCourses: "View Courses",
  totalStudents: "Total Students",
  showing: "Showing {{start}}–{{end}} of {{total}}",
  prev: "Previous",
  next: "Next",
  courseList: "Student Courses: {{name}}",
  noCourses: "No courses enrolled for this student",
  courseStatus: "Status: {{status}}",
  active: "Active",
  dropped: "Dropped",
  dropCourse: "Drop Course"
};

ar.adminStudents = {
  title: "إدارة الطلاب",
  subtitle: "راجع وأدر طلبات التسجيل والطلاب",
  searchPlaceholder: "ابحث بالاسم أو البريد الإلكتروني...",
  allStatuses: "كل الحالات",
  pending: "في الانتظار",
  approved: "مقبول",
  rejected: "مرفوض",
  suspended: "موقوف",
  banned: "محظور",
  student: "الطالب",
  details: "التفاصيل",
  status: "الحالة",
  registrationDate: "تاريخ التسجيل",
  actions: "الإجراءات",
  noStudents: "لا يوجد طلاب مطابقون للبحث",
  approve: "قبول",
  reject: "رفض",
  suspend: "توقيف",
  viewCourses: "عرض الكورسات",
  totalStudents: "إجمالي الطلاب",
  showing: "عرض {{start}}–{{end}} من {{total}}",
  prev: "السابق",
  next: "التالي",
  courseList: "كورسات الطالب: {{name}}",
  noCourses: "لا يوجد كورسات مسجلة لهذا الطالب",
  courseStatus: "الحالة: {{status}}",
  active: "نشط",
  dropped: "موقوف",
  dropCourse: "إيقاف الكورس"
};

// Adding Courses translations
en.adminCourses = {
  title: "Course Management",
  subtitle: "Create, edit, and publish platform courses",
  createNew: "Create New Course",
  searchPlaceholder: "Search courses by name...",
  allLevels: "All Levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  course: "Course",
  instructor: "Instructor",
  stats: "Stats",
  status: "Status",
  actions: "Actions",
  noCourses: "No courses match the search",
  students: "Students",
  lessons: "Lessons",
  published: "Published",
  draft: "Draft",
  edit: "Edit",
  manage: "Manage",
  showing: "Showing {{start}}–{{end}} of {{total}}",
  prev: "Previous",
  next: "Next"
};

ar.adminCourses = {
  title: "إدارة الكورسات",
  subtitle: "إنشاء وتعديل ونشر كورسات المنصة",
  createNew: "إنشاء كورس جديد",
  searchPlaceholder: "ابحث عن الكورسات بالاسم...",
  allLevels: "كل المستويات",
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  course: "الكورس",
  instructor: "المعلم",
  stats: "إحصائيات",
  status: "الحالة",
  actions: "الإجراءات",
  noCourses: "لا يوجد كورسات مطابقة للبحث",
  students: "طلاب",
  lessons: "دروس",
  published: "منشور",
  draft: "مسودة",
  edit: "تعديل",
  manage: "إدارة",
  showing: "عرض {{start}}–{{end}} من {{total}}",
  prev: "السابق",
  next: "التالي"
};

// Analytics translations
en.adminAnalytics = {
  title: "Analytics & Reports",
  subtitle: "Comprehensive overview of platform performance and growth",
  loading: "Loading data...",
  totalStudents: "Total Students",
  vsLastMonth: "vs last month",
  activeCourses: "Active Courses",
  totalEnrollments: "Total Enrollments",
  completionRate: "Completion Rate",
  avgCompletion: "Avg completion",
  growthChart: "Growth Chart",
  enrollmentTrend: "Enrollment Trend over 6 months",
  topCourses: "Top Performing Courses",
  course: "Course",
  students: "Students",
  rating: "Rating",
  revenue: "Revenue",
  studentDistribution: "Student Distribution by Level"
};

ar.adminAnalytics = {
  title: "التحليلات والتقارير",
  subtitle: "نظرة شاملة على أداء المنصة ونموها",
  loading: "جاري تحميل البيانات...",
  totalStudents: "إجمالي الطلاب",
  vsLastMonth: "مقارنة بالشهر الماضي",
  activeCourses: "الكورسات النشطة",
  totalEnrollments: "إجمالي التسجيلات",
  completionRate: "معدل الإكمال",
  avgCompletion: "متوسط الإكمال",
  growthChart: "الرسم البياني للنمو",
  enrollmentTrend: "معدل التسجيلات خلال 6 أشهر",
  topCourses: "أفضل الكورسات أداءً",
  course: "الكورس",
  students: "الطلاب",
  rating: "التقييم",
  revenue: "الإيرادات",
  studentDistribution: "توزيع الطلاب حسب المستوى"
};

// Community translations
en.adminCommunity = {
  title: "Community Moderation",
  subtitle: "Review and manage discussions and posts",
  searchPlaceholder: "Search in posts...",
  allCategories: "All Categories",
  questions: "Questions",
  discussions: "Discussions",
  announcements: "Announcements",
  post: "Post",
  author: "Author",
  date: "Date",
  likes: "Likes",
  comments: "Comments",
  actions: "Actions",
  noPosts: "No posts found",
  delete: "Delete",
  deleteConfirm: "Are you sure you want to delete this post?",
  showing: "Showing {{start}}–{{end}} of {{total}}",
  prev: "Previous",
  next: "Next",
  deletedSuccess: "Post deleted successfully"
};

ar.adminCommunity = {
  title: "إدارة المجتمع",
  subtitle: "راجع وأدر النقاشات والمنشورات",
  searchPlaceholder: "ابحث في المنشورات...",
  allCategories: "كل الأقسام",
  questions: "أسئلة",
  discussions: "نقاشات",
  announcements: "إعلانات",
  post: "المنشور",
  author: "الكاتب",
  date: "التاريخ",
  likes: "إعجابات",
  comments: "تعليقات",
  actions: "الإجراءات",
  noPosts: "لا يوجد منشورات مطابقة",
  delete: "حذف",
  deleteConfirm: "هل أنت متأكد من حذف هذا المنشور؟",
  showing: "عرض {{start}}–{{end}} من {{total}}",
  prev: "السابق",
  next: "التالي",
  deletedSuccess: "تم حذف المنشور"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
console.log('JSON updated successfully!');

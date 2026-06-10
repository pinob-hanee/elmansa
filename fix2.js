const fs = require('fs');
const path = require('path');

const clientSrc = path.join(__dirname, 'apps', 'client', 'src');
const adminCoursesPath = path.join(clientSrc, 'pages', 'admin', 'Courses.tsx');
let adminCourses = fs.readFileSync(adminCoursesPath, 'utf8');

adminCourses = adminCourses.replace("هل أنت متأكد من الحذف؟ لا يمكن التراجع.", "{t('adminCourses.deleteConfirm', 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.')}");
adminCourses = adminCourses.replace(">إلغاء<", ">{t('common.cancel', 'إلغاء')}<");
adminCourses = adminCourses.replace(">نعم، احذف<", ">{t('adminCourses.deleteYes', 'نعم، احذف')}<");
adminCourses = adminCourses.replace(">الكورسات<", ">{t('adminCourses.title', 'الكورسات')}<");
adminCourses = adminCourses.replace(">إدارة الكورسات، المناهج، والمحتوى التعليمي<", ">{t('adminCourses.subtitle', 'إدارة الكورسات، المناهج، والمحتوى التعليمي')}<");
adminCourses = adminCourses.replace("إضافة كورس جديد", "{t('adminCourses.addNew', 'إضافة كورس جديد')}");
adminCourses = adminCourses.replace('"ابحث عن كورس..."', "t('adminCourses.search', 'ابحث عن كورس...')");
adminCourses = adminCourses.replace(">لا توجد كورسات<", ">{t('adminCourses.noCourses', 'لا توجد كورسات')}<");
adminCourses = adminCourses.replace(">لم تقم بإضافة أي كورسات بعد.<", ">{t('adminCourses.noCoursesDesc', 'لم تقم بإضافة أي كورسات بعد.')}<");
adminCourses = adminCourses.replace("إنشاء الكورس الأول", "{t('adminCourses.createFirst', 'إنشاء الكورس الأول')}");
adminCourses = adminCourses.replace("'منشور' : 'مسودة'", "t('adminCourses.published', 'منشور') : t('adminCourses.draft', 'مسودة')");
adminCourses = adminCourses.replace("'لا يوجد وصف'", "t('adminCourses.noDescription', 'لا يوجد وصف')");
adminCourses = adminCourses.replace(" طالب", " {t('adminCourses.student', 'طالب')}");

fs.writeFileSync(adminCoursesPath, adminCourses);
console.log('Fixed AdminCourses.tsx');

const enJsonPath = path.join(clientSrc, 'i18n', 'locales', 'en.json');
const arJsonPath = path.join(clientSrc, 'i18n', 'locales', 'ar.json');
const en = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));

const adminCoursesEn = {
  deleteConfirm: "Are you sure you want to delete? This action cannot be undone.",
  deleteYes: "Yes, delete",
  title: "Courses",
  subtitle: "Manage courses, curriculum, and educational content",
  addNew: "Add New Course",
  search: "Search for a course...",
  noCourses: "No courses found",
  noCoursesDesc: "You haven't added any courses yet.",
  createFirst: "Create your first course",
  published: "Published",
  draft: "Draft",
  noDescription: "No description available",
  student: "Student"
};

const adminCoursesAr = {
  deleteConfirm: "هل أنت متأكد من الحذف؟ لا يمكن التراجع.",
  deleteYes: "نعم، احذف",
  title: "الكورسات",
  subtitle: "إدارة الكورسات، المناهج، والمحتوى التعليمي",
  addNew: "إضافة كورس جديد",
  search: "ابحث عن كورس...",
  noCourses: "لا توجد كورسات",
  noCoursesDesc: "لم تقم بإضافة أي كورسات بعد.",
  createFirst: "إنشاء الكورس الأول",
  published: "منشور",
  draft: "مسودة",
  noDescription: "لا يوجد وصف",
  student: "طالب"
};

en.adminCourses = { ...en.adminCourses, ...adminCoursesEn };
ar.adminCourses = { ...ar.adminCourses, ...adminCoursesAr };

fs.writeFileSync(enJsonPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arJsonPath, JSON.stringify(ar, null, 2));
console.log('Fixed JSONs again');

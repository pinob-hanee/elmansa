const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/client/src/pages/admin/Students.tsx');
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(/import toast from 'react-hot-toast';/, `import toast from 'react-hot-toast';\nimport { useTranslation } from 'react-i18next';`);
}

if (!code.includes('const { t, i18n } = useTranslation();')) {
  code = code.replace(/export default function AdminStudents\(\) \{/, `export default function AdminStudents() {\n  const { t, i18n } = useTranslation();\n  const isRtl = i18n.language === 'ar';`);
}

code = code.replace(/<div dir="rtl" className="space-y-6">/, `<div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">`);

code = code.replace(/>إدارة الطلاب</g, `>{t('adminStudents.title')}<`);
code = code.replace(/>راجع وأدر طلبات التسجيل والطلاب</g, `>{t('adminStudents.subtitle')}<`);
code = code.replace(/placeholder="ابحث بالاسم أو البريد الإلكتروني\.\.\."/g, `placeholder={t('adminStudents.searchPlaceholder')}`);

code = code.replace(/>كل الحالات</g, `>{t('adminStudents.allStatuses')}<`);
code = code.replace(/>في الانتظار</g, `>{t('adminStudents.pending')}<`);
code = code.replace(/>مقبول</g, `>{t('adminStudents.approved')}<`);
code = code.replace(/>مرفوض</g, `>{t('adminStudents.rejected')}<`);
code = code.replace(/>موقوف</g, `>{t('adminStudents.suspended')}<`);

code = code.replace(/>الطالب</g, `>{t('adminStudents.student')}<`);
code = code.replace(/>التفاصيل</g, `>{t('adminStudents.details')}<`);
code = code.replace(/>الحالة</g, `>{t('adminStudents.status')}<`);
code = code.replace(/>تاريخ التسجيل</g, `>{t('adminStudents.registrationDate')}<`);
code = code.replace(/>الإجراءات</g, `>{t('adminStudents.actions')}<`);
code = code.replace(/>لا يوجد طلاب مطابقون للبحث</g, `>{t('adminStudents.noStudents')}<`);

code = code.replace(/title="قبول"/g, `title={t('adminStudents.approve')}`);
code = code.replace(/title="رفض"/g, `title={t('adminStudents.reject')}`);
code = code.replace(/title="توقيف"/g, `title={t('adminStudents.suspend')}`);
code = code.replace(/title="عرض الكورسات"/g, `title={t('adminStudents.viewCourses')}`);

code = code.replace(/>السابق</g, `>{t('adminStudents.prev')}<`);
code = code.replace(/>التالي</g, `>{t('adminStudents.next')}<`);

code = code.replace(/عرض \{\(\(page - 1\) \* data\.meta\.limit\) \+ 1\}–\{Math\.min\(page \* data\.meta\.limit, data\.meta\.total\)\} من \{data\.meta\.total\}/g, 
  `{t('adminStudents.showing', { start: ((page - 1) * data.meta.limit) + 1, end: Math.min(page * data.meta.limit, data.meta.total), total: data.meta.total })}`);

// Inside EnrollmentsModal
if (!code.includes('const { t } = useTranslation();')) {
  code = code.replace(/function EnrollmentsModal\(\{ student, onClose \}: \{ student: any, onClose: \(\) => void \}\) \{/, `function EnrollmentsModal({ student, onClose }: { student: any, onClose: () => void }) {\n  const { t } = useTranslation();`);
}
code = code.replace(/كورسات الطالب: \{student\.profile\?\.firstName\}/g, `{t('adminStudents.courseList', { name: student.profile?.firstName })}`);
code = code.replace(/>جاري التحميل\.\.\.</g, `>{t('common.loading')}<`);
code = code.replace(/>لا يوجد كورسات مسجلة لهذا الطالب</g, `>{t('adminStudents.noCourses')}<`);
code = code.replace(/الحالة: \{en\.status === 'ACTIVE' \? 'نشط' : en\.status === 'DROPPED' \? 'موقوف' : en\.status\}/g, 
  `{t('adminStudents.courseStatus', { status: en.status === 'ACTIVE' ? t('adminStudents.active') : en.status === 'DROPPED' ? t('adminStudents.dropped') : en.status })}`);
code = code.replace(/>إيقاف الكورس</g, `>{t('adminStudents.dropCourse')}<`);
code = code.replace(/'تم إيقاف الكورس للطالب'/g, `t('adminStudents.dropSuccess', 'تم إيقاف الكورس للطالب')`);
code = code.replace(/'حدث خطأ أثناء إيقاف الكورس'/g, `t('adminStudents.dropError', 'حدث خطأ أثناء إيقاف الكورس')`);

code = code.replace(/toLocaleDateString\('ar-EG'\)/g, `toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')`);

fs.writeFileSync(file, code);
console.log('Students updated');

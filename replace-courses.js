const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/client/src/pages/admin/Courses.tsx');
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(/import \{ cn \} from '\.\.\/\.\.\/lib\/utils';/, `import { cn } from '../../lib/utils';\nimport { useTranslation } from 'react-i18next';`);
}

if (!code.includes('const { t, i18n } = useTranslation();')) {
  code = code.replace(/export default function AdminCourses\(\) \{/, `export default function AdminCourses() {\n  const { t, i18n } = useTranslation();\n  const isRtl = i18n.language === 'ar';`);
}

code = code.replace(/<div dir="rtl" className="space-y-6">/, `<div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">`);

code = code.replace(/>إدارة الكورسات</g, `>{t('adminCourses.title')}<`);
code = code.replace(/>إنشاء وتعديل ونشر كورسات المنصة</g, `>{t('adminCourses.subtitle')}<`);
code = code.replace(/>إنشاء كورس جديد</g, `>{t('adminCourses.createNew')}<`);
code = code.replace(/placeholder="ابحث عن الكورسات بالاسم\.\.\."/g, `placeholder={t('adminCourses.searchPlaceholder')}`);

code = code.replace(/>كل المستويات</g, `>{t('adminCourses.allLevels')}<`);
code = code.replace(/>مبتدئ</g, `>{t('adminCourses.beginner')}<`);
code = code.replace(/>متوسط</g, `>{t('adminCourses.intermediate')}<`);
code = code.replace(/>متقدم</g, `>{t('adminCourses.advanced')}<`);

code = code.replace(/>الكورس</g, `>{t('adminCourses.course')}<`);
code = code.replace(/>المعلم</g, `>{t('adminCourses.instructor')}<`);
code = code.replace(/>إحصائيات</g, `>{t('adminCourses.stats')}<`);
code = code.replace(/>الحالة</g, `>{t('adminCourses.status')}<`);
code = code.replace(/>الإجراءات</g, `>{t('adminCourses.actions')}<`);

code = code.replace(/>لا يوجد كورسات مطابقة للبحث</g, `>{t('adminCourses.noCourses')}<`);

code = code.replace(/>طلاب</g, `>{t('adminCourses.students')}<`);
code = code.replace(/>دروس</g, `>{t('adminCourses.lessons')}<`);

code = code.replace(/>منشور</g, `>{t('adminCourses.published')}<`);
code = code.replace(/>مسودة</g, `>{t('adminCourses.draft')}<`);

code = code.replace(/>تعديل</g, `>{t('adminCourses.edit')}<`);
code = code.replace(/>إدارة</g, `>{t('adminCourses.manage')}<`);

code = code.replace(/>السابق</g, `>{t('adminCourses.prev')}<`);
code = code.replace(/>التالي</g, `>{t('adminCourses.next')}<`);

code = code.replace(/عرض \{\(\(page - 1\) \* data\.meta\.limit\) \+ 1\}–\{Math\.min\(page \* data\.meta\.limit, data\.meta\.total\)\} من \{data\.meta\.total\}/g, 
  `{t('adminCourses.showing', { start: ((page - 1) * data.meta.limit) + 1, end: Math.min(page * data.meta.limit, data.meta.total), total: data.meta.total })}`);

fs.writeFileSync(file, code);
console.log('Courses updated');

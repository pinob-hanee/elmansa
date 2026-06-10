const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/client/src/pages/admin/Dashboard.tsx');
let code = fs.readFileSync(file, 'utf8');

// Add useTranslation
if (!code.includes('useTranslation')) {
  code = code.replace(/import \{ cn \} from '\.\.\/\.\.\/lib\/utils';/, `import { cn } from '../../lib/utils';\nimport { useTranslation } from 'react-i18next';`);
}

if (!code.includes('const { t, i18n } = useTranslation();')) {
  code = code.replace(/export default function AdminDashboard\(\) \{/, `export default function AdminDashboard() {\n  const { t, i18n } = useTranslation();\n  const isRtl = i18n.language === 'ar';`);
}

code = code.replace(/<div dir="rtl" className="space-y-8">/, `<div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-8">`);

code = code.replace(/'إجمالي الطلاب'/g, `t('adminDashboard.totalStudents')`);
code = code.replace(/'الكورسات'/g, `t('adminDashboard.courses')`);
code = code.replace(/'إجمالي التسجيلات'/g, `t('adminDashboard.totalEnrollments')`);

code = code.replace(/\`\$\{data\?\.pendingStudents \?\? 0\} في الانتظار\`/g, `\`\$\{data?.pendingStudents ?? 0\} \$\{t('adminDashboard.pendingStudents')\}\``);
code = code.replace(/\`\$\{data\?\.publishedCourses \?\? 0\} منشور\`/g, `\`\$\{data?.publishedCourses ?? 0\} \$\{t('adminDashboard.publishedCourses')\}\``);
code = code.replace(/'عبر جميع الكورسات'/g, `t('adminDashboard.acrossAllCourses')`);

code = code.replace(/>لوحة التحكم</g, `>{t('adminDashboard.title')}<`);
code = code.replace(/>مرحباً! إليك نظرة عامة على المنصة</g, `>{t('adminDashboard.subtitle')}<`);
code = code.replace(/>\{data\.pendingStudents\} طالب ينتظر الموافقة</g, `>{t('adminDashboard.pendingAlert', { count: data.pendingStudents })}<`);
code = code.replace(/>راجع طلبات التسجيل الجديدة</g, `>{t('adminDashboard.reviewRequests')}<`);
code = code.replace(/>مراجعة</g, `>{t('adminDashboard.reviewBtn')}<`);
code = code.replace(/>أحدث الطلاب المسجلين</g, `>{t('adminDashboard.recentStudents')}<`);

code = code.replace(/>الطالب</g, `>{t('adminDashboard.student')}<`);
code = code.replace(/>البريد</g, `>{t('adminDashboard.email')}<`);
code = code.replace(/>تاريخ التسجيل</g, `>{t('adminDashboard.registrationDate')}<`);
code = code.replace(/>الحالة</g, `>{t('adminDashboard.status')}<`);

code = code.replace(/>مقبول</g, `>{t('adminDashboard.approved')}<`);
code = code.replace(/>منتظر</g, `>{t('adminDashboard.pending')}<`);
code = code.replace(/>مرفوض</g, `>{t('adminDashboard.rejected')}<`);

// toLocaleDateString
code = code.replace(/toLocaleDateString\('ar-EG'\)/g, `toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')`);

fs.writeFileSync(file, code);
console.log('Dashboard updated');

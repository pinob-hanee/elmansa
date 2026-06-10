const fs = require('fs');
const path = require('path');

// --- Community.tsx ---
const comFile = path.join(__dirname, 'apps/client/src/pages/admin/Community.tsx');
let comCode = fs.readFileSync(comFile, 'utf8');

if (!comCode.includes('useTranslation')) {
  comCode = comCode.replace(/import toast from 'react-hot-toast';/, `import toast from 'react-hot-toast';\nimport { useTranslation } from 'react-i18next';`);
}

if (!comCode.includes('const { t, i18n } = useTranslation();')) {
  comCode = comCode.replace(/export default function AdminCommunity\(\) \{/, `export default function AdminCommunity() {\n  const { t, i18n } = useTranslation();\n  const isRtl = i18n.language === 'ar';`);
}

comCode = comCode.replace(/<div dir="rtl" className="space-y-6">/, `<div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">`);

comCode = comCode.replace(/>إدارة المجتمع</g, `>{t('adminCommunity.title')}<`);
comCode = comCode.replace(/>راجع وأدر النقاشات والمنشورات</g, `>{t('adminCommunity.subtitle')}<`);
comCode = comCode.replace(/placeholder="ابحث في المنشورات\.\.\."/g, `placeholder={t('adminCommunity.searchPlaceholder')}`);

comCode = comCode.replace(/>كل الأقسام</g, `>{t('adminCommunity.allCategories')}<`);
comCode = comCode.replace(/>أسئلة</g, `>{t('adminCommunity.questions')}<`);
comCode = comCode.replace(/>نقاشات</g, `>{t('adminCommunity.discussions')}<`);
comCode = comCode.replace(/>إعلانات</g, `>{t('adminCommunity.announcements')}<`);

comCode = comCode.replace(/>المنشور</g, `>{t('adminCommunity.post')}<`);
comCode = comCode.replace(/>الكاتب</g, `>{t('adminCommunity.author')}<`);
comCode = comCode.replace(/>التاريخ</g, `>{t('adminCommunity.date')}<`);
comCode = comCode.replace(/>إعجابات</g, `>{t('adminCommunity.likes')}<`);
comCode = comCode.replace(/>تعليقات</g, `>{t('adminCommunity.comments')}<`);
comCode = comCode.replace(/>الإجراءات</g, `>{t('adminCommunity.actions')}<`);

comCode = comCode.replace(/>لا يوجد منشورات مطابقة</g, `>{t('adminCommunity.noPosts')}<`);

comCode = comCode.replace(/title="حذف"/g, `title={t('adminCommunity.delete')}`);

comCode = comCode.replace(/confirm\('هل أنت متأكد من حذف هذا المنشور؟'\)/g, `confirm(t('adminCommunity.deleteConfirm'))`);
comCode = comCode.replace(/'تم حذف المنشور'/g, `t('adminCommunity.deletedSuccess')`);

comCode = comCode.replace(/>السابق</g, `>{t('adminCommunity.prev')}<`);
comCode = comCode.replace(/>التالي</g, `>{t('adminCommunity.next')}<`);

comCode = comCode.replace(/عرض \{\(\(page - 1\) \* data\.meta\.limit\) \+ 1\}–\{Math\.min\(page \* data\.meta\.limit, data\.meta\.total\)\} من \{data\.meta\.total\}/g, 
  `{t('adminCommunity.showing', { start: ((page - 1) * data.meta.limit) + 1, end: Math.min(page * data.meta.limit, data.meta.total), total: data.meta.total })}`);

comCode = comCode.replace(/toLocaleDateString\('ar-EG'\)/g, `toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')`);

fs.writeFileSync(comFile, comCode);
console.log('Community updated');


// --- Analytics.tsx ---
const anaFile = path.join(__dirname, 'apps/client/src/pages/admin/Analytics.tsx');
let anaCode = fs.readFileSync(anaFile, 'utf8');

if (!anaCode.includes('useTranslation')) {
  anaCode = anaCode.replace(/import \{ BarChart3, TrendingUp, Users, BookOpen, Star, CreditCard \} from 'lucide-react';/, `import { BarChart3, TrendingUp, Users, BookOpen, Star, CreditCard } from 'lucide-react';\nimport { useTranslation } from 'react-i18next';`);
}

if (!anaCode.includes('const { t, i18n } = useTranslation();')) {
  anaCode = anaCode.replace(/export default function AdminAnalytics\(\) \{/, `export default function AdminAnalytics() {\n  const { t, i18n } = useTranslation();\n  const isRtl = i18n.language === 'ar';`);
}

anaCode = anaCode.replace(/<div dir="rtl" className="space-y-6">/, `<div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">`);

anaCode = anaCode.replace(/>التحليلات والتقارير</g, `>{t('adminAnalytics.title')}<`);
anaCode = anaCode.replace(/>نظرة شاملة على أداء المنصة ونموها</g, `>{t('adminAnalytics.subtitle')}<`);
anaCode = anaCode.replace(/>جاري تحميل البيانات\.\.\.</g, `>{t('adminAnalytics.loading')}<`);

anaCode = anaCode.replace(/'إجمالي الطلاب'/g, `t('adminAnalytics.totalStudents')`);
anaCode = anaCode.replace(/'مقارنة بالشهر الماضي'/g, `t('adminAnalytics.vsLastMonth')`);
anaCode = anaCode.replace(/'الكورسات النشطة'/g, `t('adminAnalytics.activeCourses')`);
anaCode = anaCode.replace(/'إجمالي التسجيلات'/g, `t('adminAnalytics.totalEnrollments')`);
anaCode = anaCode.replace(/'معدل الإكمال'/g, `t('adminAnalytics.completionRate')`);
anaCode = anaCode.replace(/'متوسط الإكمال'/g, `t('adminAnalytics.avgCompletion')`);

anaCode = anaCode.replace(/>الرسم البياني للنمو</g, `>{t('adminAnalytics.growthChart')}<`);
anaCode = anaCode.replace(/>معدل التسجيلات خلال 6 أشهر</g, `>{t('adminAnalytics.enrollmentTrend')}<`);
anaCode = anaCode.replace(/>توزيع الطلاب حسب المستوى</g, `>{t('adminAnalytics.studentDistribution')}<`);
anaCode = anaCode.replace(/>أفضل الكورسات أداءً</g, `>{t('adminAnalytics.topCourses')}<`);

anaCode = anaCode.replace(/>الكورس</g, `>{t('adminAnalytics.course')}<`);
anaCode = anaCode.replace(/>الطلاب</g, `>{t('adminAnalytics.students')}<`);
anaCode = anaCode.replace(/>التقييم</g, `>{t('adminAnalytics.rating')}<`);
anaCode = anaCode.replace(/>الإيرادات</g, `>{t('adminAnalytics.revenue')}<`);

fs.writeFileSync(anaFile, anaCode);
console.log('Analytics updated');

const fs = require('fs');
const path = require('path');

const clientSrc = path.join(__dirname, 'apps', 'client', 'src');

// 1. Fix App.tsx
const appTsxPath = path.join(clientSrc, 'App.tsx');
let appTsx = fs.readFileSync(appTsxPath, 'utf8');
appTsx = appTsx.replace("const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));\n", '');
appTsx = appTsx.replace('<Route path="analytics" element={<AdminAnalytics />} />\n', '');
fs.writeFileSync(appTsxPath, appTsx);
console.log('Fixed App.tsx');

// 2. Fix AdminLayout.tsx
const adminLayoutPath = path.join(clientSrc, 'layouts', 'AdminLayout.tsx');
let adminLayout = fs.readFileSync(adminLayoutPath, 'utf8');
adminLayout = adminLayout.replace("{ icon: BarChart3, label: t('nav.analytics'), href: '/admin/analytics' },\n", '');
fs.writeFileSync(adminLayoutPath, adminLayout);
console.log('Fixed AdminLayout.tsx');

// 3. Fix ProfilePage.tsx
const profilePagePath = path.join(clientSrc, 'pages', 'student', 'ProfilePage.tsx');
let profilePage = fs.readFileSync(profilePagePath, 'utf8');
profilePage = profilePage.replace("api.post('/media/upload'", "api.post('/media/file'");
profilePage = profilePage.replace(/data\.data\.url/g, "data.data.location");
fs.writeFileSync(profilePagePath, profilePage);
console.log('Fixed ProfilePage.tsx');

// 4. Fix CreatePost.tsx
const createPostPath = path.join(clientSrc, 'features', 'community', 'components', 'CreatePost.tsx');
let createPost = fs.readFileSync(createPostPath, 'utf8');
if (!createPost.includes('useTranslation')) {
  createPost = createPost.replace("import toast from 'react-hot-toast';", "import toast from 'react-hot-toast';\nimport { useTranslation } from 'react-i18next';");
  createPost = createPost.replace("const { user } = useAuthStore();", "const { user } = useAuthStore();\n  const { t } = useTranslation();");
}
createPost = createPost.replace("'تم نشر المنشور بنجاح'", "t('community.postSuccess', 'تم نشر المنشور بنجاح')");
createPost = createPost.replace("'حدث خطأ أثناء النشر'", "t('community.postError', 'حدث خطأ أثناء النشر')");
createPost = createPost.replace("'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت'", "t('community.imageSizeError', 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت')");
createPost = createPost.replace("'تم رفع الصورة بنجاح'", "t('community.imageUploadSuccess', 'تم رفع الصورة بنجاح')");
createPost = createPost.replace("'فشل رفع الصورة'", "t('community.imageUploadError', 'فشل رفع الصورة')");
createPost = createPost.replace("'بم تفكر؟ شارك أفكارك أو صورك مع المجتمع...'", "t('community.whatAreYouThinking', 'بم تفكر؟ شارك أفكارك أو صورك مع المجتمع...')");
createPost = createPost.replace("'جاري رفع الصورة...'", "t('community.uploadingImage', 'جاري رفع الصورة...')");
createPost = createPost.replace("> إخفاء", "> {t('community.hide', 'إخفاء')}");
createPost = createPost.replace("'جاري النشر...' : 'نشر'", "t('community.publishing', 'جاري النشر...') : t('community.publish', 'نشر')");
createPost = createPost.replace("جاري رفع الصورة...", "{t('community.uploadingImage', 'جاري رفع الصورة...')}");
fs.writeFileSync(createPostPath, createPost);
console.log('Fixed CreatePost.tsx');

// 5. Fix PostCard.tsx
const postCardPath = path.join(clientSrc, 'features', 'community', 'components', 'PostCard.tsx');
let postCard = fs.readFileSync(postCardPath, 'utf8');
if (!postCard.includes('useTranslation')) {
  postCard = postCard.replace("import toast from 'react-hot-toast';", "import toast from 'react-hot-toast';\nimport { useTranslation } from 'react-i18next';");
  postCard = postCard.replace("const queryClient = useQueryClient();", "const queryClient = useQueryClient();\n  const { t } = useTranslation();");
}
postCard = postCard.replace("هل تريد إبلاغ الإدارة عن هذا المنشور كمحتوى غير لائق؟", "{t('community.reportConfirm', 'هل تريد إبلاغ الإدارة عن هذا المنشور كمحتوى غير لائق؟')}");
postCard = postCard.replace("إلغاء</button>", "{t('common.cancel', 'إلغاء')}</button>");
postCard = postCard.replace("نعم، أبلغ</button>", "{t('community.reportYes', 'نعم، أبلغ')}</button>");
postCard = postCard.replace("'تم إرسال البلاغ للإدارة'", "t('community.reportSuccess', 'تم إرسال البلاغ للإدارة')");
postCard = postCard.replace("'حدث خطأ أثناء الإبلاغ'", "t('community.reportError', 'حدث خطأ أثناء الإبلاغ')");
postCard = postCard.replace("معلم", "{t('common.teacher', 'معلم')}");
postCard = postCard.replace("مثبت", "{t('community.pinned', 'مثبت')}");
postCard = postCard.replace("إعجاب", "{t('community.like', 'إعجاب')}");
postCard = postCard.replace("تعليق", "{t('community.comment', 'تعليق')}");
postCard = postCard.replace("تم الإبلاغ", "{t('community.reported', 'تم الإبلاغ')}");
postCard = postCard.replace('"إبلاغ كمحتوى غير لائق"', "t('community.reportAction', 'إبلاغ كمحتوى غير لائق')");
fs.writeFileSync(postCardPath, postCard);
console.log('Fixed PostCard.tsx');

// 6. Fix CommentSection.tsx
const commentSectionPath = path.join(clientSrc, 'features', 'community', 'components', 'CommentSection.tsx');
let commentSection = fs.readFileSync(commentSectionPath, 'utf8');
if (!commentSection.includes('useTranslation')) {
  commentSection = commentSection.replace("import { ar } from 'date-fns/locale';", "import { ar } from 'date-fns/locale';\nimport { useTranslation } from 'react-i18next';");
  commentSection = commentSection.replace("const queryClient = useQueryClient();", "const queryClient = useQueryClient();\n  const { t } = useTranslation();");
}
commentSection = commentSection.replace("جاري تحميل التعليقات...", "{t('community.loadingComments', 'جاري تحميل التعليقات...')}");
commentSection = commentSection.replace("لا توجد تعليقات بعد. كن أول من يعلق!", "{t('community.noComments', 'لا توجد تعليقات بعد. كن أول من يعلق!')}");
commentSection = commentSection.replace('"اكتب تعليقاً..."', "t('community.writeComment', 'اكتب تعليقاً...')");
fs.writeFileSync(commentSectionPath, commentSection);
console.log('Fixed CommentSection.tsx');

// 7. Update en.json and ar.json for Community + Courses
const enJsonPath = path.join(clientSrc, 'i18n', 'locales', 'en.json');
const arJsonPath = path.join(clientSrc, 'i18n', 'locales', 'ar.json');
const en = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));

// Community
const communityKeys = {
  title: "Platform Community",
  subtitle: "Connect with classmates, ask questions, and share knowledge",
  searchPlaceholder: "Search posts...",
  filter: "Filter",
  noPosts: "No posts yet",
  beFirstToPost: "Be the first to post!",
  postSuccess: "Post published successfully",
  postError: "Failed to publish post",
  imageSizeError: "Image size must not exceed 5MB",
  imageUploadSuccess: "Image uploaded successfully",
  imageUploadError: "Failed to upload image",
  whatAreYouThinking: "What's on your mind? Share thoughts or images...",
  uploadingImage: "Uploading image...",
  hide: "Hide",
  publishing: "Publishing...",
  publish: "Publish",
  reportConfirm: "Do you want to report this post as inappropriate?",
  reportYes: "Yes, Report",
  reportSuccess: "Report sent successfully",
  reportError: "Failed to report",
  pinned: "Pinned",
  like: "Like",
  comment: "Comment",
  reported: "Reported",
  reportAction: "Report as inappropriate",
  loadingComments: "Loading comments...",
  noComments: "No comments yet. Be the first to comment!",
  writeComment: "Write a comment..."
};

const commonKeys = {
  cancel: "Cancel",
  teacher: "Teacher",
  loadError: "Error loading data",
  retry: "Retry"
};

en.community = { ...en.community, ...communityKeys };
en.common = { ...en.common, ...commonKeys };

// Ar
const arCommunityKeys = {
  title: "مجتمع المنصة",
  subtitle: "تواصل مع زملائك، اطرح أسئلة، وشارك المعرفة",
  searchPlaceholder: "ابحث في المنشورات...",
  filter: "تصفية",
  noPosts: "لا يوجد منشورات بعد",
  beFirstToPost: "كن أول من يشارك في المجتمع!",
  postSuccess: "تم نشر المنشور بنجاح",
  postError: "حدث خطأ أثناء النشر",
  imageSizeError: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت",
  imageUploadSuccess: "تم رفع الصورة بنجاح",
  imageUploadError: "فشل رفع الصورة",
  whatAreYouThinking: "بم تفكر؟ شارك أفكارك أو صورك مع المجتمع...",
  uploadingImage: "جاري رفع الصورة...",
  hide: "إخفاء",
  publishing: "جاري النشر...",
  publish: "نشر",
  reportConfirm: "هل تريد إبلاغ الإدارة عن هذا المنشور كمحتوى غير لائق؟",
  reportYes: "نعم، أبلغ",
  reportSuccess: "تم إرسال البلاغ للإدارة",
  reportError: "حدث خطأ أثناء الإبلاغ",
  pinned: "مثبت",
  like: "إعجاب",
  comment: "تعليق",
  reported: "تم الإبلاغ",
  reportAction: "إبلاغ كمحتوى غير لائق",
  loadingComments: "جاري تحميل التعليقات...",
  noComments: "لا توجد تعليقات بعد. كن أول من يعلق!",
  writeComment: "اكتب تعليقاً..."
};

const arCommonKeys = {
  cancel: "إلغاء",
  teacher: "معلم",
  loadError: "حدث خطأ أثناء تحميل البيانات",
  retry: "حاول مرة أخرى"
};

ar.community = { ...ar.community, ...arCommunityKeys };
ar.common = { ...ar.common, ...arCommonKeys };

fs.writeFileSync(enJsonPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arJsonPath, JSON.stringify(ar, null, 2));
console.log('Fixed JSONs');


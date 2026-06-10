import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-50 transition-colors"
      title="تغيير اللغة / Change Language"
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-medium uppercase">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
}

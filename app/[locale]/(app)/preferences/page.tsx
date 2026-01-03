import { getTranslations } from 'next-intl/server';
import { PreferencesContent } from './preferences-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Preferences' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function PreferencesPage() {
  return (
    <div className="container mx-auto py-10">
      <PreferencesContent />
    </div>
  );
}

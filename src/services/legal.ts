import { Linking } from 'react-native';

/**
 * Where the terms and privacy policy are published, one page per language:
 * `<base>/<tr|en>/<terms|privacy>`. The sources are in `site/`, deployed to Vercel. The
 * store listings link to the same addresses, so keep them stable: move the
 * hosting behind the domain, never the paths.
 */
export const LEGAL_BASE_URL = 'https://streetshelf.app';

export type LegalDocument = 'terms' | 'privacy';

/** Address of a legal page in the given app language (Turkish unless English). */
export function legalUrl(document: LegalDocument, language: string): string {
  return `${LEGAL_BASE_URL}/${language === 'en' ? 'en' : 'tr'}/${document}`;
}

/** Opens a legal page in the system browser. Rejects if nothing can open it. */
export async function openLegal(document: LegalDocument, language: string): Promise<void> {
  await Linking.openURL(legalUrl(document, language));
}

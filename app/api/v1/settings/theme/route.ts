import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { themeConfigSchema } from '@/lib/validations';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme-defaults';
import { getWebsiteSettingsSafe } from '@/lib/cms-server';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const body = await req.json();
    const action = body?.action as 'save_draft' | 'publish' | 'reset' | undefined;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === 'reset') {
      db.prepare(
        'UPDATE theme_settings SET publishedConfigJson = ?, draftConfigJson = NULL, updatedAt = ? WHERE id = ?'
      ).run(JSON.stringify(DEFAULT_THEME_CONFIG), now, 'default');
      return ok({ settings: getWebsiteSettingsSafe(), message: 'Theme reset to SONIQ defaults.' });
    }

    const parsed = themeConfigSchema.parse(body.themeConfig ?? body);

    if (action === 'save_draft') {
      db.prepare('UPDATE theme_settings SET draftConfigJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(parsed),
        now,
        'default'
      );
      return ok({ settings: getWebsiteSettingsSafe(), message: 'Theme draft saved.' });
    }

    // Default or 'publish': publish immediately and clear draft
    db.prepare(
      'UPDATE theme_settings SET publishedConfigJson = ?, draftConfigJson = NULL, updatedAt = ? WHERE id = ?'
    ).run(JSON.stringify(parsed), now, 'default');

    return ok({ settings: getWebsiteSettingsSafe(), message: 'Theme published live across the storefront.' });
  } catch (err) {
    return handleApiError(err);
  }
}

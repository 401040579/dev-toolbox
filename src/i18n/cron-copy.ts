import type { TFunction } from 'i18next';
import { CRON_FIELD_KEYS, type CronField } from '@/lib/cron';

export function describeCronFields(fields: CronField[], t: TFunction, locale: string): string[] {
  return fields.map((field, index) => {
    const label = t(`tools.cron.fields.${CRON_FIELD_KEYS[index]}`);
    if (field.source === '*') return t('tools.cron.every', { field: label });
    const values = field.values.map((value) => {
      if (index === 3) return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, value - 1, 1)));
      if (index === 4) return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + value)));
      return String(value);
    });
    return t('tools.cron.values', { field: label, values: values.join(', ') });
  });
}

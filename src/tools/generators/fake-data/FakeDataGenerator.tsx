import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateFullName, generateEmail, generatePhone, generateAddress,
  generateCompany, generateCreditCard, generateDate, generateUsername,
  generatePassword, generateUrl, generateIPv4, generateFakeRecord
} from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type DataType = 'all' | 'name' | 'email' | 'phone' | 'address' | 'company' | 'creditCard' | 'date' | 'username' | 'password' | 'url' | 'ipv4';

export default function FakeDataGenerator() {
  const { t } = useTranslation();
  const [dataType, setDataType] = useState<DataType>('all');
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState('');

  const handleGenerate = () => {
    const results: string[] = [];

    for (let i = 0; i < count; i++) {
      if (dataType === 'all') {
        const record = generateFakeRecord();
        results.push(JSON.stringify(record, null, 2));
      } else {
        let value = '';
        switch (dataType) {
          case 'name': value = generateFullName(); break;
          case 'email': value = generateEmail(); break;
          case 'phone': value = generatePhone(); break;
          case 'address': value = generateAddress(); break;
          case 'company': value = generateCompany(); break;
          case 'creditCard': value = generateCreditCard(); break;
          case 'date': value = generateDate(); break;
          case 'username': value = generateUsername(); break;
          case 'password': value = generatePassword(); break;
          case 'url': value = generateUrl(); break;
          case 'ipv4': value = generateIPv4(); break;
        }
        results.push(value);
      }
    }

    setOutput(dataType === 'all' ? `[\n${results.join(',\n')}\n]` : results.join('\n'));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.fakeData.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.fakeData.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.fakeData.typeLabel')}
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as DataType)}
              className="w-44"
            >
              <option value="all">{t('tools.fakeData.typeAll')}</option>
              <option value="name">{t('tools.fakeData.typeName')}</option>
              <option value="email">{t('tools.fakeData.typeEmail')}</option>
              <option value="phone">{t('tools.fakeData.typePhone')}</option>
              <option value="address">{t('tools.fakeData.typeAddress')}</option>
              <option value="company">{t('tools.fakeData.typeCompany')}</option>
              <option value="creditCard">{t('tools.fakeData.typeCreditCard')}</option>
              <option value="date">{t('tools.fakeData.typeDate')}</option>
              <option value="username">{t('tools.fakeData.typeUsername')}</option>
              <option value="password">{t('tools.fakeData.typePassword')}</option>
              <option value="url">{t('tools.fakeData.typeUrl')}</option>
              <option value="ipv4">{t('tools.fakeData.typeIpv4')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.fakeData.countLabel')}
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="w-20"
            />
          </div>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary">
          {t('tools.fakeData.generate')}
        </button>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.fakeData.output')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-64 resize-none font-mono text-sm bg-surface"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {(['name', 'email', 'phone', 'address', 'username'] as DataType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setDataType(type);
                setCount(1);
                setTimeout(handleGenerate, 0);
              }}
              className="px-3 py-1 text-sm rounded-md bg-surface-alt hover:bg-border text-text-secondary"
            >
              {t(`tools.fakeData.type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

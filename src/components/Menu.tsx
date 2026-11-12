import { LEVELS, type Level, type Stats } from '../lib/game';
import { LANG_NAMES, LANGS, type Language, type Strings } from '../lib/i18n';

export function NewGame({
  onStart,
  t,
}: {
  onStart: (l: Level) => void;
  t: Strings;
}) {
  return (
    <section className='card'>
      <h2>{t.newGame}</h2>
      <div className='levels'>
        {LEVELS.map((l, n) => (
          <button key={l} className='level' onClick={() => onStart(l)}>
            <span className='level__pips' aria-hidden='true'>
              {LEVELS.map((_, k) => (
                <span key={k} className={k <= n ? 'pip pip--on' : 'pip'} />
              ))}
            </span>
            {t.levels[l]}
          </button>
        ))}
      </div>
    </section>
  );
}

function Segmented<T>({
  options,
  value,
  label,
  onChange,
}: {
  options: readonly T[];
  value: T;
  label: (o: T) => string;
  onChange: (o: T) => void;
}) {
  return (
    <div className='segmented'>
      {options.map((o) => (
        <button
          key={String(o)}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({
  sound,
  language,
  setLanguage,
  setSound,
  stats,
  t,
}: {
  sound: boolean;
  language: Language;
  setLanguage: (l: Language) => void;
  setSound: (on: boolean) => void;
  stats: Stats;
  t: Strings;
}) {
  const languages: Language[] = ['auto', ...LANGS];

  return (
    <>
      <section className='card'>
        <h2>{t.settings}</h2>

        <div className='field'>
          <span>{t.language}</span>
          <Segmented
            options={languages}
            value={language}
            label={(l) => (l === 'auto' ? t.automatic : LANG_NAMES[l])}
            onChange={setLanguage}
          />
        </div>

        <div className='field'>
          <span>{t.sound}</span>
          <Segmented
            options={[true, false]}
            value={sound}
            label={(on) => (on ? t.on : t.off)}
            onChange={setSound}
          />
        </div>
      </section>

      <section className='card'>
        <h2>{t.statistics}</h2>
        <table className='stats'>
          <thead>
            <tr>
              <th />
              <th>{t.solvedColumn}</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => (
              <tr key={l}>
                <th>{t.levels[l]}</th>
                <td>{stats[l].solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

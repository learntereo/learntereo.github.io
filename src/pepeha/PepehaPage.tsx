import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { KoruMark, KowhaiwhaiBorder } from '../ui/components/Kowhaiwhai';
import { EMPTY_INPUT, WATER_EN, buildPepeha, pepehaToText, type PepehaInput, type PepehaKind, type WaterType } from './buildPepeha';
import { ALL_PLACES, MAUNGA, WATERS, type Suggestion } from './places';
import styles from './Pepeha.module.css';

const STORAGE_KEY = 'ako-pepeha-v1';
const BASE = import.meta.env.BASE_URL;

type TextKey = Exclude<keyof PepehaInput, 'kind' | 'waterType'>;

const TEXT_KEYS: TextKey[] = [
  'name', 'maunga', 'water', 'waka', 'iwi', 'hapu', 'marae', 'father', 'mother', 'ancestors1', 'ancestors2', 'born', 'grewUp', 'live', 'work',
];

function loadInput(): PepehaInput {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_INPUT;
    const data = JSON.parse(raw) as Partial<Record<keyof PepehaInput, unknown>>;
    const next: PepehaInput = { ...EMPTY_INPUT };
    for (const key of TEXT_KEYS) {
      if (typeof data[key] === 'string') next[key] = data[key];
    }
    if (data.kind === 'maori' || data.kind === 'tauiwi') next.kind = data.kind;
    if (data.waterType === 'awa' || data.waterType === 'roto' || data.waterType === 'moana') next.waterType = data.waterType;
    return next;
  } catch {
    return EMPTY_INPUT;
  }
}

function saveInput(input: PepehaInput) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // Storage can be blocked. The page works without it.
  }
}

function forgetInput() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked. The page works without it.
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the older way.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function Datalist({ id, items }: { id: string; items: Suggestion[] }) {
  return (
    <datalist id={id}>
      {items.map((s) => (
        <option key={s.en} value={s.en} label={s.mi === s.en ? undefined : s.mi} />
      ))}
    </datalist>
  );
}

interface FieldProps {
  label: ReactNode;
  name: TextKey;
  value: string;
  onChange: (name: TextKey, value: string) => void;
  list?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
}

function Field({ label, name, value, onChange, list, required, hint, autoComplete }: FieldProps) {
  const hintId = useId();
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        className={styles.input}
        type="text"
        name={name}
        value={value}
        list={list}
        required={required}
        autoComplete={autoComplete ?? 'off'}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </label>
  );
}

const mi = (text: string) => <span lang="mi">{text}</span>;

export function PepehaPage() {
  const [input, setInput] = useState<PepehaInput>(loadInput);
  const [showEnglish, setShowEnglish] = useState(true);
  const [status, setStatus] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const ids = { places: useId(), maunga: useId(), waters: useId() };

  useEffect(() => {
    if (input === EMPTY_INPUT) forgetInput();
    else saveInput(input);
  }, [input]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const lines = buildPepeha(input);
  const ready = lines.length > 0;

  function setText(name: TextKey, value: string) {
    setInput((prev) => ({ ...prev, [name]: value }));
  }

  function flash(message: string) {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 2500);
  }

  async function handleCopy() {
    flash((await copyText(pepehaToText(lines))) ? 'Copied' : 'Could not copy. Select the text and copy it.');
  }

  function handleClear() {
    setInput(EMPTY_INPUT);
    forgetInput();
    setStatus('');
  }

  const field = (label: ReactNode, name: TextKey, extra: Partial<FieldProps> = {}) => (
    <Field label={label} name={name} value={input[name]} onChange={setText} {...extra} />
  );

  const waterPicker = (
    <label className={styles.field}>
      <span>Kind of water</span>
      <select
        className={styles.input}
        name="waterType"
        value={input.waterType}
        onChange={(e) => setInput((prev) => ({ ...prev, waterType: e.target.value as WaterType }))}
      >
        <option value="awa">River (awa)</option>
        <option value="roto">Lake (roto)</option>
        <option value="moana">Sea (moana)</option>
      </select>
    </label>
  );

  const isMaori = input.kind === 'maori';

  return (
    <div className={styles.page}>
      <div className={styles.chrome}>
        <KowhaiwhaiBorder />
      </div>
      <main className={styles.main}>
        <header className={`${styles.header} ${styles.noPrint}`}>
          <KoruMark size={40} className={styles.mark} />
          <h1>Pepeha builder</h1>
          <p className={styles.lead}>
            Write your {mi('pepeha')} in te reo {mi('Māori')}, with the English underneath. Free, with no sign-in.
          </p>
          <p>
            <a href={BASE}>Learn te reo {mi('Māori')} with Ako</a>
          </p>
        </header>

        <div className={styles.layout}>
          <form className={`${styles.form} ${styles.noPrint}`} onSubmit={(e) => e.preventDefault()} aria-label="Your details">
            <fieldset className={styles.fieldset}>
              <legend>
                Do you whakapapa {mi('Māori')}?
              </legend>
              <label className={styles.radio}>
                <input type="radio" name="kind" value="maori" checked={isMaori} onChange={() => setInput((p) => ({ ...p, kind: 'maori' as PepehaKind }))} />
                Yes
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="kind"
                  value="tauiwi"
                  checked={input.kind === 'tauiwi'}
                  onChange={() => setInput((p) => ({ ...p, kind: 'tauiwi' as PepehaKind }))}
                />
                No, I&apos;m {mi('tauiwi')}
              </label>
              <p className={styles.hint}>If you whakapapa Māori, check the names and lines with your whānau.</p>
            </fieldset>

            {input.kind && (
              <>
                {isMaori ? (
                  <fieldset className={styles.fieldset}>
                    <legend>Where you are from</legend>
                    {field(<>{mi('Maunga')} (mountain)</>, 'maunga', { list: ids.maunga })}
                    {waterPicker}
                    {field(<>Name of your {mi(input.waterType)} ({WATER_EN[input.waterType]})</>, 'water', { list: ids.waters })}
                    {field(<>{mi('Waka')} (canoe)</>, 'waka')}
                    {field(<>{mi('Iwi')} (tribe)</>, 'iwi')}
                    {field(<>{mi('Hapū')} (subtribe)</>, 'hapu')}
                    {field(<>{mi('Marae')}</>, 'marae')}
                  </fieldset>
                ) : (
                  <>
                    <fieldset className={styles.fieldset}>
                      <legend>Where your ancestors are from</legend>
                      {field('First place', 'ancestors1', { list: ids.places })}
                      {field('Second place (optional)', 'ancestors2', { list: ids.places })}
                    </fieldset>
                    <fieldset className={styles.fieldset}>
                      <legend>Where you have lived</legend>
                      {field('Where you were born', 'born', { list: ids.places })}
                      {field('Where you grew up', 'grewUp', { list: ids.places })}
                      {field('Where you live now', 'live', { list: ids.places })}
                    </fieldset>
                    <fieldset className={styles.fieldset}>
                      <legend>A mountain / water that matters to you</legend>
                      {field('Mountain', 'maunga', { list: ids.maunga })}
                      {waterPicker}
                      {field('Name of the water', 'water', { list: ids.waters })}
                    </fieldset>
                  </>
                )}

                <fieldset className={styles.fieldset}>
                  <legend>Whānau</legend>
                  {field(<>Your father ({mi('pāpā')})</>, 'father')}
                  {field(<>Your mother ({mi('māmā')})</>, 'mother')}
                </fieldset>

                <fieldset className={styles.fieldset}>
                  <legend>About you</legend>
                  {field('Your name', 'name', { required: true, autoComplete: 'name' })}
                  {field('Where you work (optional)', 'work')}
                </fieldset>
              </>
            )}

            <Datalist id={ids.places} items={ALL_PLACES} />
            <Datalist id={ids.maunga} items={MAUNGA} />
            <Datalist id={ids.waters} items={WATERS} />

            <button type="button" className={styles.clear} onClick={handleClear}>
              Clear
            </button>
          </form>

          <section className={styles.output} aria-labelledby="pepeha-title">
            <h2 id="pepeha-title" className={styles.noPrint}>
              Your pepeha
            </h2>
            {ready ? (
              <div className={styles.lines} data-testid="pepeha-lines">
                {lines.map((line, i) => (
                  <div key={i} className={styles.line}>
                    <p lang="mi" className={styles.mi}>
                      {line.mi}
                    </p>
                    {showEnglish && <p className={styles.en}>{line.en}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${styles.hint} ${styles.noPrint}`}>
                {input.kind ? 'Add your name to see your pepeha.' : 'Choose an answer above to start.'}
              </p>
            )}

            <div className={`${styles.actions} ${styles.noPrint}`}>
              <button type="button" className={styles.primary} onClick={handleCopy} disabled={!ready}>
                Copy pepeha
              </button>
              <button type="button" className={styles.secondary} onClick={() => window.print()} disabled={!ready}>
                Print
              </button>
              <label className={styles.toggle}>
                <input type="checkbox" checked={showEnglish} onChange={(e) => setShowEnglish(e.target.checked)} />
                Show English
              </label>
            </div>
            <p role="status" className={`${styles.status} ${styles.noPrint}`}>
              {status}
            </p>
            <p className={`${styles.note} ${styles.noPrint}`}>
              Ako&apos;s te reo has not yet been reviewed by a fluent speaker. Check your pepeha with a kaiako (teacher) or your whānau before you use
              it.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

import { useId, type CSSProperties } from 'react';
import './faq-drawer.css';

export type FaqDrawerItem = {
  question: string;
  answer: string;
  topic?: string;
  link?: { href: string; label: string };
};

type FaqDrawerProps = {
  items: readonly FaqDrawerItem[];
  label: string;
  title: string;
  lead?: string;
  drawer: string;
  heading?: 'h1' | 'h2';
  action?: { href: string; label: string; note?: string };
};

const finish = { '--fq-accent': '#fdba74', '--fq-metal': '#302019' } as CSSProperties;
const tabStations = [0.05, 0.5, 0.95];

/** Tactile index-card FAQ adapted from the supplied drawer. Native disclosures need no hydration to work. */
export function FaqDrawer({ items, label, title, lead, drawer, heading: Heading = 'h2', action }: FaqDrawerProps) {
  const id = useId();
  if (!items.length) return null;

  return (
    <section className="fq" data-finish="graphite" data-block="faq-drawer" aria-labelledby={`${id}-title`} style={finish}>
      <div className="fq-wrap">
        <header className="fq-head">
          <p className="fq-label">{label}</p>
          <Heading className="fq-title" id={`${id}-title`}>{title}</Heading>
          {lead && <p className="fq-lead">{lead}</p>}
        </header>
        <div className="fq-cabinet">
          <div className="fq-drawer">
            <div className="fq-tray">
              {items.map(({ question, answer, topic, link }, index) => {
                const number = String(index + 1).padStart(2, '0');
                return (
                  <details className="fq-card" name={id} key={question} style={{
                    '--depth': items.length < 2 ? 0 : 1 - index / (items.length - 1),
                    '--tab-at': tabStations[index % tabStations.length],
                  } as CSSProperties}>
                    <summary className="fq-edge">
                      <span className="fq-tab" aria-hidden="true">{topic || `Q.${number}`}</span>
                      <span className="fq-no" aria-hidden="true">Q.{number}</span>
                      <span className="fq-q">{question}</span>
                      <span className="fq-mark" aria-hidden="true" />
                    </summary>
                    <div className="fq-face">
                      <p className="fq-a">{answer}</p>
                      {link && <a className="fq-answer-link" href={link.href}>{link.label}</a>}
                    </div>
                  </details>
                );
              })}
            </div>
            <div className="fq-front" aria-hidden="true">
              <span className="fq-holder"><span className="fq-holder-card">{drawer}</span></span>
              <span className="fq-pull" />
            </div>
          </div>
          {action && <div className="fq-ask">
            {action.note && <p className="fq-note">{action.note}</p>}
            <a className="fq-key" href={action.href}>{action.label}</a>
          </div>}
        </div>
      </div>
    </section>
  );
}

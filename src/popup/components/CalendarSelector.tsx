import type { ExtractedEvent, CalendarProvider } from '../../shared/types';
import type { Message } from '../../shared/messages';
import { buildGoogleCalendarUrl } from '../../export/google-url';
import { buildOutlookUrl } from '../../export/outlook-url';
import { generateICS } from '../../export/ics-generator';
import { useStore } from '../store';

interface Props {
  event: ExtractedEvent;
}

interface CardConfig {
  provider: CalendarProvider;
  label: string;
  icon: string;
  colorClass: string;
  description: string;
}

const CARDS: CardConfig[] = [
  {
    provider: 'google',
    label: 'Google Calendar',
    icon: '📆',
    colorClass: 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
    description: 'Opens in a new tab',
  },
  {
    provider: 'outlook',
    label: 'Outlook',
    icon: '📅',
    colorClass: 'border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
    description: 'Opens in a new tab',
  },
  {
    provider: 'apple',
    label: 'Apple / ICS',
    icon: '🍎',
    colorClass: 'border-gray-200 hover:border-gray-400 hover:shadow-gray-100',
    description: 'Downloads .ics file',
  },
];

export function CalendarSelector({ event }: Props) {
  const setState = useStore((s) => s.setState);

  function handleSelect(card: CardConfig) {
    let url: string | undefined;
    let msg: Message;

    if (card.provider === 'google') {
      url = buildGoogleCalendarUrl(event);
      msg = { type: 'OPEN_URL', payload: { url } };
    } else if (card.provider === 'outlook') {
      url = buildOutlookUrl(event);
      msg = { type: 'OPEN_URL', payload: { url } };
    } else {
      const icsContent = generateICS(event);
      const filename = `${event.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}.ics`;
      msg = { type: 'DOWNLOAD_ICS', payload: { icsContent, filename } };
    }

    chrome.runtime.sendMessage(msg, () => {
      setState({
        status: 'success',
        provider: card.provider,
        url,
      });
    });
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Export to</h3>
      <div className="flex gap-2">
        {CARDS.map((card) => (
          <button
            key={card.provider}
            onClick={() => handleSelect(card)}
            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border bg-white transition-all hover:shadow-md ${card.colorClass}`}
          >
            <span className="text-2xl">{card.icon}</span>
            <span className="text-xs font-semibold text-gray-800">{card.label}</span>
            <span className="text-xs text-gray-500">{card.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

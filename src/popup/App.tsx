import { useEffect } from 'react';
import type { Message } from '../shared/messages';
import type { EmailData } from '../shared/types';
import { parseEmail } from '../parser/index';
import { useStore } from './store';
import { EventForm } from './components/EventForm';
import { CalendarSelector } from './components/CalendarSelector';
import { StatusBanner } from './components/StatusBanner';

const PROVIDER_NAMES = {
  google: 'Google Calendar',
  outlook: 'Outlook Calendar',
  apple: 'Apple Calendar',
};

export function App() {
  const { state, setState } = useStore();

  useEffect(() => {
    // Ask the active tab's content script for the email
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        setState({ status: 'no-email' });
        return;
      }
      const scrapeMsg: Message = { type: 'SCRAPE_REQUEST' };
      chrome.tabs.sendMessage(tab.id, scrapeMsg, (response: Message | undefined) => {
        if (chrome.runtime.lastError) {
          setState({ status: 'no-email' });
          return;
        }
        if (!response) {
          setState({ status: 'no-email' });
          return;
        }
        if (response.type === 'SCRAPE_RESULT') {
          const emailData: EmailData = response.payload;
          setState({ status: 'parsing', emailData });
          const event = parseEmail(emailData);
          setState({ status: 'review', event });
        } else if (response.type === 'SCRAPE_ERROR') {
          setState({ status: 'error', message: response.payload });
        }
      });
    });
  }, [setState]);

  if (state.status === 'idle' || state.status === 'no-email') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <div className="text-4xl">📅</div>
        <p className="text-sm text-gray-500">
          Open an email to extract an event, then click this button.
        </p>
      </div>
    );
  }

  if (state.status === 'parsing') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Reading email…</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col gap-3 p-4">
        <StatusBanner message={state.message} type="error" />
        <button
          onClick={() => setState({ status: 'idle' })}
          className="text-sm text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.status === 'success') {
    const name = PROVIDER_NAMES[state.provider];
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="text-5xl">✅</div>
        <p className="text-sm font-semibold text-gray-700">Added to {name}</p>
        {state.url && (
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            View Event →
          </a>
        )}
        <button
          onClick={() => setState({ status: 'idle' })}
          className="text-xs text-gray-400 underline mt-2"
        >
          Start over
        </button>
      </div>
    );
  }

  // status === 'review'
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <EventForm event={state.event} />
      <CalendarSelector event={state.event} />
    </div>
  );
}

import type { ExtractedEvent } from '../../shared/types';
import { useStore } from '../store';

interface Props {
  event: ExtractedEvent;
}

const CONFIDENCE_CONFIG = {
  high: { label: 'High confidence', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium confidence', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: 'Low confidence', color: 'bg-red-100 text-red-800' },
};

export function EventForm({ event }: Props) {
  const updateEvent = useStore((s) => s.updateEvent);
  const conf = CONFIDENCE_CONFIG[event.confidence];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Event Details</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf.color}`}>
          {conf.label}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
        <input
          type="text"
          value={event.title}
          onChange={(e) => updateEvent({ title: e.target.value })}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={event.startDate}
            onChange={(e) => updateEvent({ startDate: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={event.isAllDay}
              onChange={(e) => updateEvent({ isAllDay: e.target.checked, startTime: null, endTime: null })}
              className="rounded"
            />
            All day
          </label>
        </div>
      </div>

      {!event.isAllDay && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={event.startTime ?? ''}
              onChange={(e) => updateEvent({ startTime: e.target.value || null })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
            <input
              type="time"
              value={event.endTime ?? ''}
              onChange={(e) => updateEvent({ endTime: e.target.value || null })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">End Date (optional)</label>
        <input
          type="date"
          value={event.endDate ?? ''}
          onChange={(e) => updateEvent({ endDate: e.target.value || null })}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
        <input
          type="text"
          value={event.location ?? ''}
          onChange={(e) => updateEvent({ location: e.target.value || null })}
          placeholder="Add location or meeting URL"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea
          rows={4}
          value={event.description}
          onChange={(e) => updateEvent({ description: e.target.value })}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

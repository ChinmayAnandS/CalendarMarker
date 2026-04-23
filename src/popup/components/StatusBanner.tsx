interface Props {
  message: string;
  type: 'success' | 'error' | 'info';
}

const CONFIG = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function StatusBanner({ message, type }: Props) {
  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${CONFIG[type]}`}>
      {message}
    </div>
  );
}

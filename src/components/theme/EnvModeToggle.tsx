import { useEnvMode } from '../../context/EnvironmentModeContext';
import { cn } from '../../utils/cn';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export function EnvModeToggle() {
  const { mode, toggle } = useEnvMode();
  const [complianceComplete, setComplianceComplete] = useState(false);

  useEffect(() => {
    const check = () => {
      setComplianceComplete(localStorage.getItem('compliance:progress') === '6');
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const canGoLive = complianceComplete;

  const body = (
    <button
      type="button"
      onClick={() => {
        if (!canGoLive && mode === 'test') return; // block toggling to live
        toggle();
      }}
      className={cn(
        'relative inline-flex items-center rounded-full border border-border px-2 py-1 text-xs font-medium transition-colors',
        'bg-card',
        canGoLive ? 'hover:bg-primary/10' : 'opacity-60 cursor-not-allowed'
      )}
      aria-disabled={!canGoLive}
    >
      <span
        className={cn(
          'px-2 py-0.5 rounded-full',
          mode === 'test' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        Test
      </span>
      <span
        className={cn(
          'px-2 py-0.5 rounded-full flex items-center gap-1',
          mode === 'live' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
        )}
      >
        {mode === 'live' && <ShieldCheck size={12} />}
        Live
      </span>
    </button>
  );

  if (canGoLive) return body;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{body}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            className="max-w-xs rounded bg-gray-900 text-white text-[10px] px-2 py-1 shadow"
          >
            Complete compliance to enable Live mode.
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default EnvModeToggle;
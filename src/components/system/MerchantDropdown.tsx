import { useEffect } from 'react';
import { Dropdown } from '../ui/dropdown';
import { Button } from '../ui/button';
import { ChevronDown, Store } from 'lucide-react';
import { useMerchantSelectionStore, ensureMerchantSelected } from '../../store/merchantSelection';

export function MerchantDropdown() {
  const { selectedMerchantCode, setMerchant, merchants } = useMerchantSelectionStore();

  useEffect(()=>{ ensureMerchantSelected(); }, []);

  const current = merchants.find(m=>m.merchantCode === selectedMerchantCode) || merchants[0];
  if (!current) {
    return (
      <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 opacity-60" disabled>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
          <Store className="h-4 w-4" />
        </div>
        <span className="text-xs">No merchants</span>
      </Button>
    );
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm font-medium max-w-[140px] truncate">
            {current.merchantName}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Content sideOffset={6} className="bg-card border border-border w-64 p-1">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Select merchant</div>
        <Dropdown.Separator />
        {merchants.map(m => (
          <Dropdown.Item
            key={m.merchantCode}
            className={m.merchantCode === current.merchantCode ? 'bg-primary/10 font-medium' : ''}
            onSelect={() => setMerchant(m.merchantCode)}
          >
            <div className="flex flex-col">
              <span className="text-sm">{m.merchantName}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.merchantCode}</span>
            </div>
          </Dropdown.Item>
        ))}
        {merchants.length === 0 && <div className="px-2 py-2 text-xs text-muted-foreground">No merchants available.</div>}
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
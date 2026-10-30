import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDayRegen?: boolean;
  dayNumber?: number;
  onConfirm: (instructions?: string) => Promise<void>;
  isLoading: boolean;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  title,
  isDayRegen = false,
  dayNumber,
  onConfirm,
  isLoading,
}) => {
  const [instructions, setInstructions] = useState('');

  const handleConfirm = async () => {
    await onConfirm(instructions.trim() || undefined);
    setInstructions('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={
        isDayRegen
          ? `Regenerate Day ${dayNumber} with fresh alternative suggestions while preserving the rest of your trip.`
          : 'Regenerate the entire itinerary from scratch using your original preferences and constraints.'
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            {isDayRegen
              ? 'This will replace existing activities for this day only. Other days will remain untouched.'
              : 'This will recreate all days. Any custom activities you added manually to this trip will be replaced.'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Special Instructions / Focus Area (Optional)
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={
              isDayRegen
                ? 'e.g. Focus on outdoor nature walks and relaxed cafes instead of museums...'
                : 'e.g. Include more evening entertainment and budget-friendly street food...'
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleConfirm}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            {isDayRegen ? `Regenerate Day ${dayNumber}` : 'Regenerate Entire Itinerary'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

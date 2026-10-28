import { CircleHelp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

export function TaskNotFound({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="small-dialog">
        <span className="dialog-symbol">
          <CircleHelp size={23} />
        </span>
        <DialogTitle>Task not found</DialogTitle>
        <DialogDescription>
          This task is not in the current sample data. Temporary tasks are cleared when
          you reload the page or samples.
        </DialogDescription>
        <div className="confirm-actions">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

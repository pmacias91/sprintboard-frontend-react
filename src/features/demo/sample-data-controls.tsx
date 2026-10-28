import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useIsMutating } from '@tanstack/react-query';
import {
  Check,
  Database,
  LoaderCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';
import {
  TASK_WRITE_KEY,
  useDemoSettings,
  useDemoState,
  useResetDemo,
} from '../../hooks/use-tasks';
import type { DemoSettings } from '../../types/demo';

const countFormatter = new Intl.NumberFormat('en');

export function SampleDataControls() {
  const [reloadOpen, setReloadOpen] = useState(false);
  const [reloadError, setReloadError] = useState('');
  const info = useDemoState();
  const settings = useDemoSettings();
  const reset = useResetDemo();
  const activeWrites = useIsMutating({ mutationKey: TASK_WRITE_KEY });
  const busy = reset.isPending || activeWrites > 0;
  const settingsDisabled = busy || settings.isPending || !info.data;
  const failureArmed = Boolean(info.data?.failNextWrite);
  const changeCount = info.data?.changes ?? 0;

  function updateSettings(changes: Partial<DemoSettings>) {
    settings.mutate(changes, {
      onError: (error) => {
        toast.error('Could not update the sample connection', {
          description: error.message,
        });
      },
    });
  }

  function reloadSamples() {
    setReloadError('');
    reset.mutate(undefined, {
      onSuccess: () => {
        setReloadOpen(false);
        toast.success('Sample data reloaded', {
          description: 'Temporary tasks and edits have been cleared.',
        });
      },
      onError: (error) => {
        setReloadError(error.message);
      },
    });
  }

  return (
    <>
      <div className="demo-card sample-controls" aria-label="Sample data">
        <div className="sample-controls-heading">
          <strong>Sample data</strong>
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sample-controls-options"
                aria-label="Sample data options"
              >
                <SlidersHorizontal size={13} />
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="sample-controls-popover"
                side="right"
                align="end"
                sideOffset={16}
                collisionPadding={16}
                aria-label="Sample data options"
              >
                <div className="sample-controls-popover-heading">
                  <Database size={16} />
                  <h2>Sample data options</h2>
                </div>
                <div className="sample-controls-setting">
                  <label htmlFor="sample-connection">Connection</label>
                  <Select
                    id="sample-connection"
                    label="Simulated connection"
                    value={info.data?.latency ?? 'normal'}
                    disabled={settingsDisabled}
                    onValueChange={(value) => {
                      if (value === 'normal' || value === 'slow') {
                        updateSettings({ latency: value });
                      }
                    }}
                    options={[
                      { value: 'normal', label: 'Normal' },
                      { value: 'slow', label: 'Slow' },
                    ]}
                  />
                  <p>Slow mode makes loading and saving states easier to inspect.</p>
                </div>
                <div className="sample-controls-setting sample-controls-failure">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={failureArmed}
                    disabled={settingsDisabled || failureArmed}
                    onClick={() => updateSettings({ failNextWrite: true })}
                  >
                    {failureArmed ? <Check size={14} /> : <RotateCcw size={14} />}
                    Fail next save
                  </Button>
                  <p role={failureArmed ? 'status' : undefined}>
                    {failureArmed
                      ? 'The next save will fail once. Retry it to continue.'
                      : 'Simulate one failed save to check recovery and retry.'}
                  </p>
                </div>
                <p className="sample-controls-memory-note">
                  Changes stay in memory until you reload the page or samples.
                </p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        {info.data ? (
          <p className="sample-controls-counts">
            {countFormatter.format(info.data.taskCount)} tasks
            <span aria-hidden="true"> · </span>
            {countFormatter.format(info.data.userCount)} users
          </p>
        ) : info.isError ? (
          <p className="sample-controls-counts">Sample data unavailable</p>
        ) : (
          <p className="sample-controls-counts" role="status">
            Loading samples…
          </p>
        )}
        {changeCount > 0 && (
          <p className="sample-controls-changes">
            {countFormatter.format(changeCount)} temporary{' '}
            {changeCount === 1 ? 'change' : 'changes'}
          </p>
        )}
        <button
          type="button"
          className="sample-controls-reload"
          disabled={busy || settings.isPending}
          onClick={() => {
            setReloadError('');
            setReloadOpen(true);
          }}
        >
          {reset.isPending ? (
            <LoaderCircle size={13} className="animate-spin" />
          ) : (
            <RotateCcw size={13} />
          )}
          {reset.isPending ? 'Reloading samples…' : 'Reload samples'}
        </button>
      </div>
      <Dialog
        open={reloadOpen}
        onOpenChange={(open) => {
          if (!reset.isPending) {
            setReloadOpen(open);
          }
        }}
      >
        <DialogContent
          className="small-dialog sample-controls-confirm"
          onEscapeKeyDown={(event) => {
            if (reset.isPending) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (reset.isPending) {
              event.preventDefault();
            }
          }}
        >
          <span className="dialog-symbol">
            <Database size={23} />
          </span>
          <DialogTitle>Reload sample data?</DialogTitle>
          <DialogDescription>
            Replace the current tasks and users with the original samples. Temporary tasks
            and edits will be removed. Reloading the page also restores the samples.
          </DialogDescription>
          {reloadError && (
            <p className="field-error" role="alert">
              {reloadError}
            </p>
          )}
          <div className="confirm-actions">
            <Button
              type="button"
              variant="outline"
              disabled={reset.isPending}
              onClick={() => setReloadOpen(false)}
            >
              Keep my changes
            </Button>
            <Button
              type="button"
              disabled={busy || settings.isPending}
              onClick={reloadSamples}
              aria-busy={reset.isPending}
            >
              {reset.isPending && <LoaderCircle size={14} className="animate-spin" />}
              {reset.isPending ? 'Reloading…' : 'Reload samples'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

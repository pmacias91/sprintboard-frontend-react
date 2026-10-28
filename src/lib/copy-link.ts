import { toast } from 'sonner';

export async function copyLink(href: string, message: string): Promise<void> {
  try {
    const url = new URL(href, window.location.origin);
    await navigator.clipboard.writeText(url.href);
    toast.success(message);
  } catch {
    toast.error('Could not copy the link', {
      description: 'Copy the address from your browser instead.',
    });
  }
}

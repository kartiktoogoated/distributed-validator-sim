/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => void;
}

const AddSiteDialog = ({ open, onOpenChange, onAdd }: AddSiteDialogProps) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError('URL is required');
      return;
    }

    try {
      new URL(url);
    } catch (e) {
      setError('Please enter a valid URL including http:// or https://');
      return;
    }

    setIsValidating(true);

    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to add website');
      } else {
        onAdd(url); // Update local list if needed
        setUrl('');
        setError('');
        onOpenChange(false);
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Website</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to monitor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label>Monitoring Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="uptime" className="rounded" defaultChecked disabled />
                  <Label htmlFor="uptime" className="text-sm font-normal">Uptime</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="response-time" className="rounded" defaultChecked disabled />
                  <Label htmlFor="response-time" className="text-sm font-normal">Response Time</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="ssl" className="rounded" defaultChecked disabled />
                  <Label htmlFor="ssl" className="text-sm font-normal">SSL Certificate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="content" className="rounded" defaultChecked disabled />
                  <Label htmlFor="content" className="text-sm font-normal">Content Check</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isValidating}>
              {isValidating ? 'Adding...' : 'Add Website'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSiteDialog;

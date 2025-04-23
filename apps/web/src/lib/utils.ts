import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from '@/hooks/use-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function comingSoon() {
  const { toast } = useToast();
  toast({
    title: "Coming Soon",
    description: "This feature will be available in a future update.",
  });
  return false;
}
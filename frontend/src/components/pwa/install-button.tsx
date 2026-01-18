'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

interface InstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function InstallButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: InstallButtonProps) {
  const { canInstall, installApp } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    await installApp();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={`flex items-center gap-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  Settings,
  Eye,
  Layout
} from 'lucide-react';

// Types for progressive enhancement
interface ViewportInfo {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

interface ProgressiveEnhancementProps {
  children: React.ReactNode;
  mobileComponent?: React.ComponentType<any>;
  tabletComponent?: React.ComponentType<any>;
  desktopComponent?: React.ComponentType<any>;
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  enableViewportToggle?: boolean;
  className?: string;
}

// Hook for viewport detection and management
const useViewport = (breakpoints = { mobile: 768, tablet: 1024, desktop: 1200 }) => {
  // Initialize with consistent server-side values to prevent hydration mismatch
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: 1200, // Consistent default for SSR
    height: 800,  // Consistent default for SSR
    deviceType: 'desktop', // Consistent default for SSR
    orientation: 'landscape', // Consistent default for SSR
    pixelRatio: 1, // Consistent default for SSR
  });

  const [forcedViewport, setForcedViewport] = useState<'mobile' | 'tablet' | 'desktop' | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateViewport = useCallback(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio;
    
    let deviceType: 'mobile' | 'tablet' | 'desktop';
    if (width < breakpoints.mobile) {
      deviceType = 'mobile';
    } else if (width < breakpoints.tablet) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

    setViewport(prev => {
      const newViewport = {
        width,
        height,
        deviceType: forcedViewport || deviceType,
        orientation,
        pixelRatio,
      };
      
      // Only update if values have actually changed
      if (
        prev.width !== newViewport.width ||
        prev.height !== newViewport.height ||
        prev.deviceType !== newViewport.deviceType ||
        prev.orientation !== newViewport.orientation ||
        prev.pixelRatio !== newViewport.pixelRatio
      ) {
        return newViewport;
      }
      
      return prev;
    });
  }, [breakpoints.mobile, breakpoints.tablet, breakpoints.desktop, forcedViewport, isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    updateViewport();
    
    const handleResize = () => updateViewport();
    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(updateViewport, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewport, isClient]);

  const forceViewport = useCallback((type: 'mobile' | 'tablet' | 'desktop' | null) => {
    setForcedViewport(type);
  }, []);

  return { viewport, forceViewport, forcedViewport, isClient };
};

// Progressive enhancement wrapper component
export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  children,
  mobileComponent: MobileComponent,
  tabletComponent: TabletComponent,
  desktopComponent: DesktopComponent,
  breakpoints,
  enableViewportToggle = false,
  className,
}) => {
  const { viewport, forceViewport, forcedViewport, isClient } = useViewport(breakpoints);
  const [showViewportControls, setShowViewportControls] = useState(false);

  // Determine which component to render
  const renderComponent = () => {
    switch (viewport.deviceType) {
      case 'mobile':
        return MobileComponent ? <MobileComponent viewport={viewport} /> : children;
      case 'tablet':
        return TabletComponent ? <TabletComponent viewport={viewport} /> : children;
      case 'desktop':
        return DesktopComponent ? <DesktopComponent viewport={viewport} /> : children;
      default:
        return children;
    }
  };

  // Get appropriate CSS classes for current viewport
  const getViewportClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    switch (viewport.deviceType) {
      case 'mobile':
        return cn(
          baseClasses,
          'mobile-layout',
          'max-w-full',
          'px-4 py-2',
          viewport.orientation === 'portrait' ? 'mobile-portrait' : 'mobile-landscape'
        );
      case 'tablet':
        return cn(
          baseClasses,
          'tablet-layout',
          'max-w-4xl mx-auto',
          'px-6 py-4',
          viewport.orientation === 'portrait' ? 'tablet-portrait' : 'tablet-landscape'
        );
      case 'desktop':
        return cn(
          baseClasses,
          'desktop-layout',
          'max-w-6xl mx-auto',
          'px-8 py-6'
        );
      default:
        return baseClasses;
    }
  };

  return (
    <div className={cn('progressive-enhancement-wrapper', className)}>
      {/* Viewport controls for development/testing - only render on client */}
      {enableViewportToggle && isClient && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewportControls(!showViewportControls)}
              className="bg-white/90 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {showViewportControls && (
              <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Viewport Controls</CardTitle>
                  <CardDescription className="text-xs">
                    Current: {viewport.width}×{viewport.height} ({viewport.deviceType})
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant={viewport.deviceType === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => forceViewport(forcedViewport === 'mobile' ? null : 'mobile')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Smartphone className="h-3 w-3" />
                        Mobile
                      </Button>
                      <Button
                        variant={viewport.deviceType === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => forceViewport(forcedViewport === 'tablet' ? null : 'tablet')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Tablet className="h-3 w-3" />
                        Tablet
                      </Button>
                      <Button
                        variant={viewport.deviceType === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => forceViewport(forcedViewport === 'desktop' ? null : 'desktop')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Monitor className="h-3 w-3" />
                        Desktop
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Pixel Ratio: {viewport.pixelRatio}</span>
                      <Badge variant="secondary" className="text-xs">
                        {viewport.orientation}
                      </Badge>
                    </div>
                    
                    {forcedViewport && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => forceViewport(null)}
                        className="text-xs"
                      >
                        Reset to Auto
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Viewport info indicator - only render on client */}
      {isClient && (
        <div className="fixed bottom-4 left-4 z-[45]">
          <Badge 
            variant="secondary" 
            className="bg-white/90 backdrop-blur-sm text-xs font-mono"
          >
            {viewport.deviceType} {viewport.width}×{viewport.height}
            {forcedViewport && ' (forced)'}
          </Badge>
        </div>
      )}

      {/* Main content with progressive enhancement */}
      <div className={getViewportClasses()}>
        {renderComponent()}
      </div>

      {/* CSS custom properties for responsive design - using inline styles to avoid hydration mismatch */}
      {isClient && (
        <style 
          dangerouslySetInnerHTML={{
            __html: `
              .progressive-enhancement-wrapper {
                --viewport-width: ${viewport.width}px;
                --viewport-height: ${viewport.height}px;
                --device-type: ${viewport.deviceType};
                --orientation: ${viewport.orientation};
                --pixel-ratio: ${viewport.pixelRatio};
              }
              
              .mobile-layout {
                --content-padding: 1rem;
                --card-spacing: 0.75rem;
                --font-scale: 0.9;
              }
              
              .tablet-layout {
                --content-padding: 1.5rem;
                --card-spacing: 1rem;
                --font-scale: 1;
              }
              
              .desktop-layout {
                --content-padding: 2rem;
                --card-spacing: 1.5rem;
                --font-scale: 1.1;
              }
              
              .mobile-portrait {
                --layout-columns: 1;
                --sidebar-width: 100%;
              }
              
              .mobile-landscape {
                --layout-columns: 2;
                --sidebar-width: 40%;
              }
              
              .tablet-portrait {
                --layout-columns: 2;
                --sidebar-width: 35%;
              }
              
              .tablet-landscape {
                --layout-columns: 3;
                --sidebar-width: 30%;
              }
            `
          }}
        />
      )}
    </div>
  );
};

// Enhanced layout components for different viewports
export const MobileOptimizedLayout: React.FC<{ children: React.ReactNode; viewport: ViewportInfo }> = ({
  children,
  viewport,
}) => (
  <div className="mobile-optimized-layout">
    {/* Mobile-optimized content - no duplicate header */}
    <div className="h-full">
      {children}
    </div>
  </div>
);

export const TabletOptimizedLayout: React.FC<{ children: React.ReactNode; viewport: ViewportInfo }> = ({
  children,
  viewport,
}) => (
  <div className="tablet-optimized-layout">
    <div className="max-w-4xl mx-auto h-full">
      {/* Tablet-optimized content - let mobile wizard handle its own header */}
      <div className="h-full">
        {children}
      </div>
    </div>
  </div>
);

export const DesktopOptimizedLayout: React.FC<{ children: React.ReactNode; viewport: ViewportInfo }> = ({
  children,
  viewport,
}) => (
  <div className="desktop-optimized-layout">
    <div className="max-w-7xl mx-auto h-full">
      {/* Desktop-optimized content - let mobile wizard handle its own header */}
      <div className="flex gap-8 h-full">
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
        
        {/* Desktop sidebar with enhanced features */}
        <div className="w-96 space-y-6 p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onboarding Assistant</CardTitle>
              <CardDescription>
                Get help and tips as you complete your property setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  Desktop users get enhanced features including:
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Real-time preview</li>
                  <li>• Advanced validation</li>
                  <li>• Bulk operations</li>
                  <li>• Keyboard shortcuts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-sm text-slate-600 mt-1">
                Your property profile is looking great!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default ProgressiveEnhancement;
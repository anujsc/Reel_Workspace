import React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import loaderAnimation from '@/assets/loader-animation.json';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  fullScreen?: boolean;
  message?: string;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
  full: 'w-full h-full',
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  className,
  fullScreen = false,
  message,
}) => {
  const loaderContent = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn(sizeMap[size], 'flex items-center justify-center')}>
        <Lottie
          animationData={loaderAnimation}
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

// Inline loader for buttons and small spaces
export const InlineLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('w-5 h-5 inline-block', className)}>
      <Lottie
        animationData={loaderAnimation}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Page loader component
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size="lg" message={message} />
    </div>
  );
};

// Card loader for content areas
export const CardLoader: React.FC<{ message?: string; className?: string }> = ({
  message,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Loader size="md" message={message} />
    </div>
  );
};

export default Loader;

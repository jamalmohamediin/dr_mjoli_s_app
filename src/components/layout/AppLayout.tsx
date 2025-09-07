import React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-medical-gradient">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
      
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-300/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gray-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      {/* Main Content */}
      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  );
};

export const GlassContainer: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("glass-container py-8", className)}>
      {children}
    </div>
  );
};

export const GlassSection: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <section className={cn("glass-card p-6 mb-8", className)}>
      {children}
    </section>
  );
};

export const GlassHeader: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; className?: string }> = ({ 
  title, 
  subtitle, 
  icon, 
  className 
}) => {
  return (
    <div className={cn("text-center mb-12", className)}>
      {icon && (
        <div className="flex justify-center mb-6">
          <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            {icon}
          </div>
        </div>
      )}
      <h1 className="text-4xl font-bold text-black text-shadow-glass mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl glass-text-muted max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const GlassProgress: React.FC<{ 
  steps: Array<{ step: number; title: string; icon: React.ReactNode }>; 
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("glass-card p-6 mb-8", className)}>
      <div className="flex justify-between items-center">
        {steps.map(({ step, title, icon: Icon }) => (
          <div
            key={step}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg transition-all duration-300",
              currentStep === step 
                ? 'bg-white/30 backdrop-blur-sm border border-white/40' 
                : 'hover:bg-white/10'
            )}
          >
            <div className={cn(
              "glass-card p-3 mb-2 transition-all duration-300",
              currentStep === step ? 'shadow-glass-heavy scale-110' : ''
            )}>
              <div className={cn(
                "h-6 w-6 transition-colors duration-300",
                currentStep === step ? 'text-gray-800' : 'text-gray-600'
              )}>
                {typeof Icon === 'function' ? <Icon /> : Icon}
              </div>
            </div>
            <span className={cn(
              "text-sm font-medium transition-colors duration-300",
              currentStep === step ? 'text-black' : 'text-gray-600'
            )}>
              {title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GlassNavigation: React.FC<{
  onPrevious: () => void;
  onNext: () => void;
  onAction?: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentStep: number;
  totalSteps: number;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  className?: string;
}> = ({
  onPrevious,
  onNext,
  onAction,
  canGoPrevious,
  canGoNext,
  currentStep,
  totalSteps,
  actionLabel,
  actionIcon,
  className
}) => {
  const isLastStep = currentStep === totalSteps;
  
  return (
    <div className={cn("glass-card p-6 mt-8", className)}>
      <div className="flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="glass-button px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="glass-card px-4 py-2">
          <span className="text-black font-medium">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        {isLastStep && onAction ? (
          <button
            onClick={onAction}
            className="glass-button-primary px-6 py-2 flex items-center gap-2"
          >
            {actionIcon}
            {actionLabel || 'Complete'}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="glass-button-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
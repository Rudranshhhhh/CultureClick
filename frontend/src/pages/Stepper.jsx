import { Children, cloneElement, isValidElement, useCallback, useMemo, useState } from 'react';
import './Stepper.css';

export function Step({ children }) {
  return <>{children}</>;
}

export default function Stepper({
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Previous',
  nextButtonText = 'Next',
  /** When set, Next/Finish and step dots require the current / prior steps to be complete before advancing. */
  isStepComplete,
  children,
}) {
  const steps = useMemo(
    () =>
      Children.toArray(children).filter(
        (c) => isValidElement(c) && (c.type === Step || c.type?.name === 'Step')
      ),
    [children]
  );

  const maxStep = steps.length || 1;
  const clamp = (n) => Math.min(Math.max(n, 1), maxStep);
  const [activeStep, setActiveStep] = useState(clamp(initialStep));

  const setStep = useCallback(
    (n) => {
      const next = clamp(n);
      setActiveStep(next);
      onStepChange?.(next);
    },
    [maxStep, onStepChange]
  );

  const isFirst = activeStep === 1;
  const isLast = activeStep === maxStep;

  const canNavigateToStep = useCallback(
    (n) => {
      if (!isStepComplete) return true;
      if (n <= activeStep) return true;
      for (let s = 1; s < n; s += 1) {
        if (!isStepComplete(s)) return false;
      }
      return true;
    },
    [isStepComplete, activeStep]
  );

  const currentStepComplete = !isStepComplete || isStepComplete(activeStep);

  return (
    <div className="rb-stepper">
      <div className="rb-stepper-header">
        <div className="rb-stepper-track" aria-hidden="true">
          {Array.from({ length: maxStep }).map((_, i) => {
            const n = i + 1;
            const state = n < activeStep ? 'done' : n === activeStep ? 'active' : 'todo';
            const dotDisabled = n > activeStep && !canNavigateToStep(n);
            return (
              <button
                key={n}
                type="button"
                className={`rb-stepper-dot ${state}`}
                onClick={() => {
                  if (dotDisabled) return;
                  setStep(n);
                }}
                disabled={dotDisabled}
                aria-label={`Go to step ${n}`}
                aria-current={n === activeStep ? 'step' : undefined}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="rb-stepper-meta">
          <span className="rb-stepper-count">
            Step <strong>{activeStep}</strong> / {maxStep}
          </span>
        </div>
      </div>

      <div className="rb-stepper-body">
        {steps[activeStep - 1]
          ? cloneElement(steps[activeStep - 1], { key: activeStep })
          : null}
      </div>

      <div className={`rb-stepper-footer ${isFirst ? 'rb-stepper-footer--first' : ''}`}>
        {!isFirst && (
          <button type="button" className="btn-ghost" onClick={() => setStep(activeStep - 1)}>
            {backButtonText}
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={!currentStepComplete}
          onClick={() => {
            if (!currentStepComplete) return;
            if (isLast) {
              onFinalStepCompleted?.();
              return;
            }
            setStep(activeStep + 1);
          }}
        >
          {isLast ? 'Finish' : nextButtonText}
        </button>
      </div>
    </div>
  );
}


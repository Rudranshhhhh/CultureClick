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

  return (
    <div className="rb-stepper">
      <div className="rb-stepper-header">
        <div className="rb-stepper-track" aria-hidden="true">
          {Array.from({ length: maxStep }).map((_, i) => {
            const n = i + 1;
            const state = n < activeStep ? 'done' : n === activeStep ? 'active' : 'todo';
            return (
              <button
                key={n}
                type="button"
                className={`rb-stepper-dot ${state}`}
                onClick={() => setStep(n)}
                aria-label={`Go to step ${n}`}
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

      <div className="rb-stepper-footer">
        <button type="button" className="btn-ghost" onClick={() => setStep(activeStep - 1)} disabled={isFirst}>
          {backButtonText}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
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


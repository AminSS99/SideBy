import React from 'react';

export interface StardustButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'blue' | 'red';
  shape?: 'pill' | 'circle';
}

export const StardustButton = ({ 
  children = "Launching Soon", 
  onClick, 
  className = "",
  variant = 'blue',
  shape = 'pill',
  ...props 
}: StardustButtonProps) => {
  const buttonStyle = {
    '--white': variant === 'red' ? '#ffebeb' : '#e6f3ff',
    '--bg': variant === 'red' ? '#180202' : '#0a1929',
    '--radius': shape === 'circle' ? '50%' : '100px',
    '--glow-light': variant === 'red' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(64, 180, 255, 0.15)',
    '--glow-intense': variant === 'red' ? 'rgba(248, 113, 113, 0.6)' : 'rgba(129, 216, 255, 0.6)',
    '--glow-color': variant === 'red' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(64, 180, 255, 0.25)',
    '--text-color': variant === 'red' ? 'rgba(248, 113, 113, 0.9)' : 'rgba(129, 216, 255, 0.9)',
    '--glow-hover-inset-top': variant === 'red' ? 'rgba(248, 113, 113, 0.4)' : 'rgba(129, 216, 255, 0.4)',
    '--glow-hover-inset-bottom': variant === 'red' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(64, 180, 255, 0.6)',
    '--glow-active-inset-top': variant === 'red' ? 'rgba(248, 113, 113, 0.5)' : 'rgba(129, 216, 255, 0.5)',
    '--glow-active-inset-bottom': variant === 'red' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(64, 180, 255, 0.4)',
    outline: 'none',
    cursor: 'pointer',
    border: 0,
    position: 'relative',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
    transition: 'all 0.2s ease',
    boxShadow: variant === 'red' ? `
      inset 0 0.3rem 0.9rem rgba(255, 230, 230, 0.3),
      inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
      inset 0 -0.4rem 0.9rem rgba(255, 230, 230, 0.5),
      0 3rem 3rem rgba(0, 0, 0, 0.3),
      0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)
    ` : `
      inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
      inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
      inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
      0 3rem 3rem rgba(0, 0, 0, 0.3),
      0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)
    `,
  } as React.CSSProperties;

  const wrapStyle: React.CSSProperties = {
    fontSize: shape === 'circle' ? '18px' : '25px',
    fontWeight: 500,
    color: 'var(--text-color)',
    padding: shape === 'circle' ? '12px' : '32px 45px',
    borderRadius: 'inherit',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: shape === 'circle' ? '48px' : 'auto',
    height: shape === 'circle' ? '48px' : 'auto',
  };

  const pStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: shape === 'circle' ? '4px' : '12px',
    margin: 0,
    transition: 'all 0.2s ease',
    transform: 'translateY(2%)',
    maskImage: 'linear-gradient(to bottom, var(--text-color) 40%, transparent)',
  };

  const beforeAfterStyles = `
    .pearl-button .wrap::before,
    .pearl-button .wrap::after {
      content: "";
      position: absolute;
      transition: all 0.3s ease;
    }
    
    .pearl-button .wrap::before {
      left: -15%;
      right: -15%;
      bottom: 25%;
      top: -100%;
      border-radius: 50%;
      background-color: var(--glow-light);
    }
    
    .pearl-button .wrap::after {
      left: 6%;
      right: 6%;
      top: 12%;
      bottom: 40%;
      border-radius: 22px 22px 0 0;
      box-shadow: inset 0 10px 8px -10px var(--glow-intense);
      background: linear-gradient(
        180deg,
        var(--glow-color) 0%,
        rgba(0, 0, 0, 0) 50%,
        rgba(0, 0, 0, 0) 100%
      );
    }
    
    .pearl-button .wrap p span:nth-child(2) {
      display: none;
    }
    
    .pearl-button:hover .wrap p span:nth-child(1) {
      display: none;
    }
    
    .pearl-button:hover .wrap p span:nth-child(2) {
      display: inline-block;
    }
    
    .pearl-button:hover {
      box-shadow:
        inset 0 0.3rem 0.5rem var(--glow-hover-inset-top),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
        inset 0 -0.4rem 0.9rem var(--glow-hover-inset-bottom),
        0 3rem 3rem rgba(0, 0, 0, 0.3),
        0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
    }
    
    .pearl-button:hover .wrap::before {
      transform: translateY(-5%);
    }
    
    .pearl-button:hover .wrap::after {
      opacity: 0.4;
      transform: translateY(5%);
    }
    
    .pearl-button:hover .wrap p {
      transform: translateY(-4%);
    }
    
    .pearl-button:active {
      transform: translateY(4px);
      box-shadow:
        inset 0 0.3rem 0.5rem var(--glow-active-inset-top),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8),
        inset 0 -0.4rem 0.9rem var(--glow-active-inset-bottom),
        0 3rem 3rem rgba(0, 0, 0, 0.3),
        0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <button
        className={`pearl-button ${className}`}
        style={buttonStyle}
        onClick={onClick}
        {...props}
      >
        <div className="wrap" style={wrapStyle}>
          <p style={pStyle}>
            <span>✧</span>
            <span>✦</span>
            {children}
          </p>
        </div>
      </button>
    </>
  );
};

// Demo component showing the button in action
export const StardustButtonDemo = () => {
  return (
    <div className="min-h-screen bg-slate-200 dark:bg-stone-900 w-full flex flex-col gap-12 items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-stone-800 dark:text-stone-200 text-lg font-semibold">Standard Blue (Pill)</h2>
        <StardustButton onClick={() => alert('Coming soon!')}>
          Launching Soon
        </StardustButton>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-stone-800 dark:text-stone-200 text-lg font-semibold">Custom Red (Pill)</h2>
        <StardustButton variant="red" onClick={() => alert('Coming soon!')}>
          Launching Soon
        </StardustButton>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-stone-800 dark:text-stone-200 text-lg font-semibold">Circle Red</h2>
        <StardustButton variant="red" shape="circle" onClick={() => alert('Coming soon!')} aria-label="Snapsolve">
          {null}
        </StardustButton>
      </div>
    </div>
  );
};

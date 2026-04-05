/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  isLoading?: boolean;
}

const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "font-retro uppercase text-xs md:text-sm py-3 px-6 border-4 transition-all duration-150 active:translate-y-1 relative overflow-hidden group";

  const variants = {
    primary: "bg-[#ff2a6d] border-[#05d9e8] text-[#0a0a12] hover:bg-[#ff5c8f] hover:text-white hover:border-white hover:shadow-[0_0_15px_rgba(255,42,109,0.7)]",
    secondary: "bg-[#0a0a12] border-[#05d9e8] text-[#05d9e8] hover:bg-[#05d9e8] hover:text-[#0a0a12] hover:shadow-[0_0_15px_rgba(5,217,232,0.7)]",
    accent: "bg-[#f9c80e] border-[#ff2a6d] text-[#0a0a12] hover:bg-[#ffe066] hover:border-white hover:shadow-[0_0_15px_rgba(249,200,14,0.7)]",
  };

  const loadingOverlay = (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <span className="animate-pulse">LOADING...</span>
    </div>
  );

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
        <span className={isLoading ? 'invisible' : ''}>{children}</span>
        {isLoading && loadingOverlay}
    </button>
  );
};

export default RetroButton;

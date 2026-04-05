/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface CRTScreenProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  isActive?: boolean;
  theme?: 'DARK' | 'LIGHT';
}

const CRTScreen: React.FC<CRTScreenProps> = ({ children, title, className = '', isActive = false, theme = 'DARK' }) => {
  const titleColor = theme === 'LIGHT' 
    ? (isActive ? 'text-cyan-700' : 'text-gray-500') 
    : (isActive ? 'text-[#05d9e8] retro-text-glow' : 'text-gray-600');
    
  const borderColor = theme === 'LIGHT'
    ? (isActive ? 'border-gray-400' : 'border-gray-300')
    : (isActive ? 'border-[#05d9e8] retro-border-glow' : 'border-[#333]');

  const bgClass = theme === 'LIGHT' ? 'bg-[#f3f3f3]' : 'bg-black';

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
        {title && (
            <div className={`font-retro text-xs mb-2 tracking-widest ${titleColor}`}>
                {">"} {title}
            </div>
        )}
      <div className={`flex-1 relative overflow-hidden border-4 ${borderColor} ${bgClass} rounded-lg`}>
        <div className="crt-overlay z-20 pointer-events-none"></div>
        <div className="relative z-10 h-full w-full overflow-auto p-4">
            {children}
        </div>
      </div>
    </div>
  );
};

export default CRTScreen;

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * 可调整宽度的侧边栏组件
 */
export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  defaultWidth = 320,
  minWidth = 260,
  maxWidth = 520
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 侧边栏内容 */}
      <div
        ref={sidebarRef}
        style={{
          width: `${width}px`,
          minWidth: `${width}px`,
          backgroundColor: '#1a1a2e',
          borderRight: '1px solid #333',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </div>

      {/* 分隔条 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#4CAF50' : '#333',
          transition: isResizing ? 'none' : 'background-color 0.2s'
        }}
      />
    </div>
  );
};

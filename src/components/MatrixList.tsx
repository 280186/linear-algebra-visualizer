import React, { useState } from 'react';
import { MatrixItem } from '../types';
import { MatrixInput } from './MatrixInput';

interface MatrixListProps {
  items: MatrixItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, matrix: [[number, number], [number, number]]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  activeMatrixIndex: number | null;
  disabled?: boolean;
}

/**
 * 矩阵序列列表组件
 * 支持拖动排序、高亮当前执行矩阵、上移/下移按钮
 */
export const MatrixList: React.FC<MatrixListProps> = ({
  items,
  onAdd,
  onRemove,
  onChange,
  onReorder,
  activeMatrixIndex,
  disabled = false
}) => {
  // 拖拽状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 拖拽开始
  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  // 拖拽进入目标区域
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  // 拖拽离开目标区域
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 释放拖拽
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    onReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (index < items.length - 1) {
      onReorder(index, index + 1);
    }
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>
        矩阵序列 ({items.length}/8)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, index) => {
          const isActive = activeMatrixIndex === index;
          const isDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={item.id}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(index)}
              style={{
                padding: '10px',
                backgroundColor: isActive ? '#1a3a1a' : isDragOver ? '#1a2a3a' : '#0f0f23',
                borderRadius: '4px',
                borderLeft: isActive ? '3px solid #4CAF50' : '3px solid transparent',
                opacity: isDragged ? 0.5 : 1,
                borderTop: isDragOver ? '2px solid #4CAF50' : '2px solid transparent'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '8px'
              }}>
                {/* 拖拽手柄 */}
                <div
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: disabled ? 'not-allowed' : 'grab',
                    color: '#666',
                    fontSize: '16px',
                    userSelect: 'none',
                    padding: '2px'
                  }}
                  title="拖拽排序"
                >
                  ⠿
                </div>

                {/* 矩阵名称 */}
                <span style={{
                  fontSize: '12px',
                  color: isActive ? '#4CAF50' : '#aaa',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}>
                  {item.name}
                  {isActive && ' (当前)'}
                </span>

                {/* 上移/下移按钮 */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={disabled || index === 0}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: (disabled || index === 0) ? '#333' : '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: (disabled || index === 0) ? 'not-allowed' : 'pointer',
                      fontSize: '11px'
                    }}
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={disabled || index === items.length - 1}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: (disabled || index === items.length - 1) ? '#333' : '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: (disabled || index === items.length - 1) ? 'not-allowed' : 'pointer',
                      fontSize: '11px'
                    }}
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    disabled={disabled}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>

              <MatrixInput
                value={item.matrix}
                onChange={(m) => onChange(item.id, m)}
                disabled={disabled}
                name={item.name}
              />
            </div>
          );
        })}
      </div>

      {items.length < 8 && (
        <button
          onClick={onAdd}
          disabled={disabled}
          style={{
            marginTop: '10px',
            padding: '8px',
            width: '100%',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px dashed #555',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          + 添加矩阵
        </button>
      )}
    </div>
  );
};

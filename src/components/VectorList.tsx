import React, { useState, useEffect } from 'react';
import { VectorItem, BasisConfig } from '../types';
import { parseNumberInput, formatNumber } from '../utils/numberInput';
import { buildBasisMatrix, isValidBasis } from '../utils/basis';
import { Vec2 } from '../math/Vec2';

interface VectorListProps {
  items: VectorItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, vector: [number, number]) => void;
  onChangeShowLabel: (id: string, show: boolean) => void;
  onStandardChange: (id: string, vector: [number, number]) => void;
  onBasisChange: (id: string, basisCoord: [number, number]) => void;
  basisConfig?: BasisConfig;
  disabled?: boolean;
}

/**
 * 向量输入组件（支持中间态）
 */
const VectorInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  width?: string;
}> = ({ value, onChange, disabled, width = '50px' }) => {
  const [rawValue, setRawValue] = useState(formatNumber(value));
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setRawValue(formatNumber(value));
      setError('');
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value);
    setError('');
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    const result = parseNumberInput(rawValue);
    if (result.ok) {
      onChange(result.value);
      setError('');
    } else {
      setError(result.reason);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <input
        type="text"
        value={rawValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          width,
          padding: '4px',
          textAlign: 'center',
          backgroundColor: disabled ? '#333' : '#222',
          color: error ? '#ff6b6b' : '#fff',
          border: `1px solid ${error ? '#ff6b6b' : '#555'}`,
          borderRadius: '3px',
          fontSize: '12px'
        }}
      />
      {error && (
        <div style={{ fontSize: '9px', color: '#ff6b6b', marginTop: '1px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * 向量集合列表组件
 */
export const VectorList: React.FC<VectorListProps> = ({
  items,
  onAdd,
  onRemove,
  onChange: _onChange,
  onChangeShowLabel,
  onStandardChange,
  onBasisChange,
  basisConfig,
  disabled = false
}) => {
  // 计算基矩阵
  const showBasis = basisConfig?.showBasisCoordinateInfo ?? false;
  const P = basisConfig
    ? buildBasisMatrix(
        new Vec2(basisConfig.b1[0], basisConfig.b1[1]),
        new Vec2(basisConfig.b2[0], basisConfig.b2[1])
      )
    : null;
  const basisValid = P ? isValidBasis(P) : false;

  return (
    <div>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>
        用户向量 ({items.length}/8)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item) => {
          const controlMode = item.controlMode ?? 'standard';
          const basisCoord = item.basisCoord ?? [0, 0];

          return (
            <div
              key={item.id}
              style={{
                padding: '8px',
                backgroundColor: '#0f0f23',
                borderRadius: '4px'
              }}
            >
              {/* 标准坐标输入 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '12px', color: '#2196F3', minWidth: '24px' }}>
                  {item.name}
                </span>

                <VectorInput
                  value={item.vector[0]}
                  onChange={(val) => onStandardChange(item.id, [val, item.vector[1]])}
                  disabled={disabled}
                />

                <span style={{ fontSize: '12px', color: '#888' }}>,</span>

                <VectorInput
                  value={item.vector[1]}
                  onChange={(val) => onStandardChange(item.id, [item.vector[0], val])}
                  disabled={disabled}
                />

                <button
                  onClick={() => onRemove(item.id)}
                  disabled={disabled}
                  style={{
                    marginLeft: 'auto',
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

              {/* 新基坐标输入（仅在 showBasis 且 basisValid 时显示） */}
              {showBasis && basisValid && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}>
                  <span style={{ fontSize: '11px', color: '#00ffff', minWidth: '48px' }}>
                    [{item.name}]_B
                  </span>

                  <VectorInput
                    value={basisCoord[0]}
                    onChange={(val) => onBasisChange(item.id, [val, basisCoord[1]])}
                    disabled={disabled}
                  />

                  <span style={{ fontSize: '12px', color: '#888' }}>,</span>

                  <VectorInput
                    value={basisCoord[1]}
                    onChange={(val) => onBasisChange(item.id, [basisCoord[0], val])}
                    disabled={disabled}
                  />
                </div>
              )}

              {/* 新基坐标显示（仅在 showBasis 且 basisValid 时显示，只读） */}
              {showBasis && !basisValid && (
                <div style={{
                  marginTop: '6px',
                  fontSize: '10px',
                  color: '#ff4444'
                }}>
                  当前基无效，无法计算 B 坐标
                </div>
              )}

              {/* 主控模式显示 */}
              {showBasis && basisValid && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  color: controlMode === 'standard' ? '#4CAF50' : '#00ffff'
                }}>
                  当前锁定：{controlMode === 'standard' ? '标准坐标' : 'B 坐标'}
                </div>
              )}

              {/* 显示数值标签选项 */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px',
                fontSize: '11px',
                color: '#888',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={item.showValueLabel ?? false}
                  onChange={(e) => onChangeShowLabel(item.id, e.target.checked)}
                  disabled={disabled}
                />
                在网格中显示向量值
              </label>
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
          + 添加向量
        </button>
      )}
    </div>
  );
};

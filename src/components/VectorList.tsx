import React, { useState, useEffect } from 'react';
import { VectorItem } from '../types';
import { parseNumberInput, formatNumber } from '../utils/numberInput';

interface VectorListProps {
  items: VectorItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, vector: [number, number]) => void;
  onChangeShowLabel: (id: string, show: boolean) => void;
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

  // 外部 value 变化时，只在未聚焦时同步
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

  const handleFocus = () => {
    setFocused(true);
  };

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
  onChange,
  onChangeShowLabel,
  disabled = false
}) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>
        用户向量 ({items.length}/8)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '8px',
              backgroundColor: '#0f0f23',
              borderRadius: '4px'
            }}
          >
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
                onChange={(val) => onChange(item.id, [val, item.vector[1]])}
                disabled={disabled}
              />

              <span style={{ fontSize: '12px', color: '#888' }}>,</span>

              <VectorInput
                value={item.vector[1]}
                onChange={(val) => onChange(item.id, [item.vector[0], val])}
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
        ))}
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

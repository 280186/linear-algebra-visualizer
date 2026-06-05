import React, { useState, useEffect, useRef } from 'react';
import { parseNumberInput, formatNumber } from '../utils/numberInput';

interface MatrixInputProps {
  value: [[number, number], [number, number]];
  onChange: (matrix: [[number, number], [number, number]]) => void;
  disabled?: boolean;
  name?: string;
}

type MatrixKey = 'a' | 'b' | 'c' | 'd';

// 方向键映射：只有光标在边界时才切换
const KEY_MAP: Record<string, MatrixKey> = {
  'a-right': 'b',
  'a-down': 'c',
  'b-left': 'a',
  'b-down': 'd',
  'c-right': 'd',
  'c-up': 'a',
  'd-left': 'c',
  'd-up': 'b'
};

// 元素位置显示
const ELEMENT_LABEL: Record<MatrixKey, string> = {
  a: '1,1',
  b: '1,2',
  c: '2,1',
  d: '2,2'
};

/**
 * 2×2 矩阵输入组件
 * 矩阵格式：[[a, b], [c, d]]
 * 显示为：
 *   [ a  b ]
 *   [ c  d ]
 */
export const MatrixInput: React.FC<MatrixInputProps> = ({
  value,
  onChange,
  disabled = false,
  name = 'M'
}) => {
  // rawValue：输入框显示的字符串
  const [rawValues, setRawValues] = useState({
    a: formatNumber(value[0][0]),
    b: formatNumber(value[0][1]),
    c: formatNumber(value[1][0]),
    d: formatNumber(value[1][1])
  });

  // 错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 是否正在编辑
  const [focusedKey, setFocusedKey] = useState<MatrixKey | null>(null);

  // 输入框引用
  const inputRefs = useRef<Record<MatrixKey, HTMLInputElement | null>>({
    a: null, b: null, c: null, d: null
  });

  // 外部 value 变化时，只同步未聚焦的输入框
  useEffect(() => {
    if (focusedKey === null) {
      setRawValues({
        a: formatNumber(value[0][0]),
        b: formatNumber(value[0][1]),
        c: formatNumber(value[1][0]),
        d: formatNumber(value[1][1])
      });
    }
  }, [value, focusedKey]);

  const handleChange = (key: MatrixKey, raw: string) => {
    setRawValues(prev => ({ ...prev, [key]: raw }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleFocus = (key: MatrixKey) => {
    setFocusedKey(key);
  };

  const handleBlur = (key: MatrixKey) => {
    setFocusedKey(null);

    const result = parseNumberInput(rawValues[key]);
    if (result.ok) {
      const newMatrix: [[number, number], [number, number]] = [
        [value[0][0], value[0][1]],
        [value[1][0], value[1][1]]
      ];
      const keyMap: Record<MatrixKey, [number, number]> = {
        a: [0, 0], b: [0, 1], c: [1, 0], d: [1, 1]
      };
      const [row, col] = keyMap[key];
      newMatrix[row][col] = result.value;
      onChange(newMatrix);
      setErrors(prev => ({ ...prev, [key]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [key]: result.reason }));
    }
  };

  const handleKeyDown = (key: MatrixKey, e: React.KeyboardEvent) => {
    // Enter 提交
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
      return;
    }

    // 如果按住 Ctrl/Alt/Meta，保留浏览器默认行为
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    const input = e.target as HTMLInputElement;
    const direction = e.key.replace('Arrow', '').toLowerCase();

    // ArrowLeft：只有光标在开头时切换
    if (e.key === 'ArrowLeft' && input.selectionStart !== 0) {
      return;
    }

    // ArrowRight：只有光标在末尾时切换
    if (e.key === 'ArrowRight' && input.selectionStart !== input.value.length) {
      return;
    }

    // ArrowUp/ArrowDown：直接切换
    const targetKey = KEY_MAP[`${key}-${direction}`];

    if (targetKey) {
      e.preventDefault();
      const targetInput = inputRefs.current[targetKey];
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  const getInputStyle = (key: MatrixKey): React.CSSProperties => ({
    padding: '6px 4px',
    textAlign: 'center',
    backgroundColor: disabled ? '#333' : '#222',
    color: errors[key] ? '#ff6b6b' : '#fff',
    border: `2px solid ${
      errors[key] ? '#ff6b6b' :
      focusedKey === key ? '#4CAF50' :
      '#555'
    }`,
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: focusedKey === key && !errors[key]
      ? '0 0 5px rgba(76, 175, 80, 0.5)'
      : 'none',
    outline: 'none'
  });

  const keys: MatrixKey[] = ['a', 'b', 'c', 'd'];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa' }}>列1</div>
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa' }}>列2</div>
        {keys.map((key) => (
          <div key={key}>
            <input
              ref={(el) => { inputRefs.current[key] = el; }}
              type="text"
              value={rawValues[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              onFocus={() => handleFocus(key)}
              onBlur={() => handleBlur(key)}
              onKeyDown={(e) => handleKeyDown(key, e)}
              disabled={disabled}
              style={getInputStyle(key)}
            />
            {errors[key] && (
              <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '2px' }}>
                {errors[key]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 当前编辑元素显示 */}
      {focusedKey && (
        <div style={{
          fontSize: '10px',
          color: errors[focusedKey] ? '#ff6b6b' : '#4CAF50',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          正在编辑：{name}[{ELEMENT_LABEL[focusedKey]}] = {focusedKey}
        </div>
      )}
    </div>
  );
};

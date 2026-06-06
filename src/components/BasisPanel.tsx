import React, { useState, useEffect } from 'react';
import { BasisConfig } from '../types';
import { Vec2 } from '../math/Vec2';
import { buildBasisMatrix, isValidBasis, formatElement, formatScalar } from '../utils/basis';
import { parseNumberInput, formatNumber } from '../utils/numberInput';

/**
 * 单个数值输入组件（支持中间态）
 */
const NumberInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  width?: string;
}> = ({ value, onChange, disabled, width = '60px' }) => {
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

interface BasisPanelProps {
  config: BasisConfig;
  onChange: (config: BasisConfig) => void;
  disabled?: boolean;
}

/**
 * 基与坐标控制面板
 */
export const BasisPanel: React.FC<BasisPanelProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  // 构造基矩阵
  const b1 = new Vec2(config.b1[0], config.b1[1]);
  const b2 = new Vec2(config.b2[0], config.b2[1]);
  const P = buildBasisMatrix(b1, b2);
  const det = P.determinant();
  const valid = isValidBasis(P);
  const PInverse = valid ? P.inverse() : null;

  const handleToggleShow = () => {
    onChange({ ...config, showBasisCoordinateInfo: !config.showBasisCoordinateInfo });
  };

  const handleB1Change = (vector: [number, number]) => {
    onChange({ ...config, b1: vector });
  };

  const handleB2Change = (vector: [number, number]) => {
    onChange({ ...config, b2: vector });
  };

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#0f0f23',
      borderRadius: '4px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>
        基与坐标
      </h3>

      {/* 总开关 */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '12px',
        fontSize: '12px',
        color: '#888',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}>
        <input
          type="checkbox"
          checked={config.showBasisCoordinateInfo}
          onChange={handleToggleShow}
          disabled={disabled}
        />
        显示基与坐标信息
      </label>

      {/* 基向量输入（矩阵形式） */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 1fr',
        gap: '4px',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        {/* 列标题 */}
        <div></div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#00ffff' }}>b1</div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#ff00ff' }}>b2</div>

        {/* 第一行：x 分量 */}
        <div style={{ fontSize: '10px', color: '#666', textAlign: 'right' }}>x:</div>
        <NumberInput
          value={config.b1[0]}
          onChange={(val) => handleB1Change([val, config.b1[1]])}
          disabled={disabled}
          width="100%"
        />
        <NumberInput
          value={config.b2[0]}
          onChange={(val) => handleB2Change([val, config.b2[1]])}
          disabled={disabled}
          width="100%"
        />

        {/* 第二行：y 分量 */}
        <div style={{ fontSize: '10px', color: '#666', textAlign: 'right' }}>y:</div>
        <NumberInput
          value={config.b1[1]}
          onChange={(val) => handleB1Change([config.b1[0], val])}
          disabled={disabled}
          width="100%"
        />
        <NumberInput
          value={config.b2[1]}
          onChange={(val) => handleB2Change([config.b2[0], val])}
          disabled={disabled}
          width="100%"
        />
      </div>

      {/* 基矩阵 P */}
      <div style={{
        padding: '8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '3px',
        fontSize: '11px',
        marginBottom: '8px'
      }}>
        <span style={{ color: '#888' }}>基矩阵：</span>
        <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
          {`P = [ ${formatElement(P.a)}  ${formatElement(P.b)} ]`}
          {'\n'}
          {`    [ ${formatElement(P.c)}  ${formatElement(P.d)} ]`}
        </pre>
      </div>

      {/* det(P) */}
      <div style={{
        padding: '8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '3px',
        fontSize: '11px',
        marginBottom: '8px'
      }}>
        <span style={{ color: '#888' }}>det(P) = {formatScalar(det)}</span>
      </div>

      {/* 状态 */}
      <div style={{
        padding: '8px',
        backgroundColor: valid ? '#1a3a1a' : '#3a1a1a',
        borderRadius: '3px',
        fontSize: '11px',
        marginBottom: '8px'
      }}>
        {valid ? (
          <span style={{ color: '#4CAF50' }}>可构成基</span>
        ) : (
          <span style={{ color: '#ff4444' }}>b1, b2 线性相关，不能构成基</span>
        )}
      </div>

      {/* P^{-1} */}
      {valid && PInverse && (
        <div style={{
          padding: '8px',
          backgroundColor: '#1a1a2e',
          borderRadius: '3px',
          fontSize: '11px'
        }}>
          <span style={{ color: '#888' }}>P⁻¹ =</span>
          <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
            {`[ ${formatElement(PInverse.a)}  ${formatElement(PInverse.b)} ]`}
            {'\n'}
            {`[ ${formatElement(PInverse.c)}  ${formatElement(PInverse.d)} ]`}
          </pre>
        </div>
      )}
    </div>
  );
};

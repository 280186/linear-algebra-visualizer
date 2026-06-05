import React from 'react';
import { MatrixInput } from './MatrixInput';

interface ControlPanelProps {
  matrixA: [[number, number], [number, number]];
  matrixB: [[number, number], [number, number]];
  onMatrixAChange: (matrix: [[number, number], [number, number]]) => void;
  onMatrixBChange: (matrix: [[number, number], [number, number]]) => void;
  onPlayA: () => void;
  onPlaySequence: () => void;
  onReset: () => void;
  onTogglePause: () => void;
  isPlaying: boolean;
  isPaused: boolean;
}

/**
 * 左侧控制面板
 * 包含矩阵 A、B 输入和播放按钮
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  matrixA,
  matrixB,
  onMatrixAChange,
  onMatrixBChange,
  onPlayA,
  onPlaySequence,
  onReset,
  onTogglePause,
  isPlaying,
  isPaused
}) => {
  const disabled = isPlaying && !isPaused;

  return (
    <div style={{
      width: '250px',
      padding: '20px',
      backgroundColor: '#1a1a2e',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      borderRight: '1px solid #333',
      position: 'relative',
      zIndex: 10,
      overflowY: 'auto'
    }}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>矩阵变换</h2>

      {/* 矩阵 A */}
      <div>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
          矩阵 A：
        </p>
        <MatrixInput
          value={matrixA}
          onChange={onMatrixAChange}
          disabled={disabled}
        />
      </div>

      {/* 矩阵 B */}
      <div>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
          矩阵 B：
        </p>
        <MatrixInput
          value={matrixB}
          onChange={onMatrixBChange}
          disabled={disabled}
        />
      </div>

      <div style={{ fontSize: '11px', color: '#666' }}>
        <p style={{ margin: 0 }}>
          先 A 后 B = B × A
        </p>
      </div>

      {/* 播放按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onPlayA}
          disabled={disabled}
          style={{
            padding: '10px',
            backgroundColor: disabled ? '#555' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isPlaying && !isPaused ? '播放中...' : '播放 A'}
        </button>

        <button
          onClick={onPlaySequence}
          disabled={disabled}
          style={{
            padding: '10px',
            backgroundColor: disabled ? '#555' : '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          顺序播放 I→A→B×A
        </button>

        {isPlaying && (
          <button
            onClick={onTogglePause}
            style={{
              padding: '10px',
              backgroundColor: isPaused ? '#4CAF50' : '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isPaused ? '继续' : '暂停'}
          </button>
        )}

        <button
          onClick={onReset}
          style={{
            padding: '10px',
            backgroundColor: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          重置
        </button>
      </div>

      {/* 当前矩阵显示 */}
      <div style={{
        marginTop: 'auto',
        padding: '10px',
        backgroundColor: '#0f0f23',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>矩阵 A：</p>
        <pre style={{ margin: '0 0 10px 0' }}>
          {`[ ${matrixA[0][0]}  ${matrixA[0][1]} ]\n[ ${matrixA[1][0]}  ${matrixA[1][1]} ]`}
        </pre>
        <p style={{ margin: '0 0 5px 0', color: '#2196F3' }}>矩阵 B：</p>
        <pre style={{ margin: 0 }}>
          {`[ ${matrixB[0][0]}  ${matrixB[0][1]} ]\n[ ${matrixB[1][0]}  ${matrixB[1][1]} ]`}
        </pre>
      </div>
    </div>
  );
};

import React from 'react';
import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { VectorItem, BasisConfig, PathDemoState } from '../types';
import {
  buildBasisMatrix,
  isValidBasis,
  standardToBasisCoordinates,
  computeTransformInBasis,
  formatElement,
} from '../utils/basis';

const EPS = 1e-8;

interface PathPanelProps {
  pathDemo: PathDemoState;
  vectorSet: VectorItem[];
  basisConfig: BasisConfig;
  finalMatrix: Mat2;
  disabled: boolean;
  onSelectVector: (id: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onPlayPath: () => void;
  onResetPath: () => void;
}

/**
 * 格式化向量为字符串
 */
function fmtVec(v: Vec2): string {
  return `(${formatElement(v.x)}, ${formatElement(v.y)})`;
}

/**
 * P^{-1}AP 路径演示控制面板
 *
 * 显示条件：showBasisCoordinateInfo=true, P 可逆, 至少有一个用户向量
 * 5 个步骤的数值推导在控制面板中显示
 */
export const PathPanel: React.FC<PathPanelProps> = ({
  pathDemo,
  vectorSet,
  basisConfig,
  finalMatrix,
  disabled,
  onSelectVector,
  onPrevStep,
  onNextStep,
  onPlayPath,
  onResetPath,
}) => {
  // 构造基矩阵
  const b1 = new Vec2(basisConfig.b1[0], basisConfig.b1[1]);
  const b2 = new Vec2(basisConfig.b2[0], basisConfig.b2[1]);
  const P = buildBasisMatrix(b1, b2);
  const valid = isValidBasis(P);
  const PInverse = valid ? P.inverse() : null;

  // 不满足显示条件
  if (!basisConfig.showBasisCoordinateInfo) {
    return null;
  }

  if (!valid) {
    return (
      <div style={{
        padding: '10px',
        backgroundColor: '#0f0f23',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
          P⁻¹AP 路径演示
        </h3>
        <div style={{ padding: '8px', backgroundColor: '#3a1a1a', borderRadius: '3px', fontSize: '11px' }}>
          <span style={{ color: '#ff4444' }}>当前基无效，无法演示 P⁻¹AP</span>
        </div>
      </div>
    );
  }

  if (vectorSet.length === 0) {
    return (
      <div style={{
        padding: '10px',
        backgroundColor: '#0f0f23',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
          P⁻¹AP 路径演示
        </h3>
        <div style={{ padding: '8px', backgroundColor: '#3a1a1a', borderRadius: '3px', fontSize: '11px' }}>
          <span style={{ color: '#888' }}>请先添加至少一个用户向量</span>
        </div>
      </div>
    );
  }

  // 派生计算（不存 state，每次 render 计算）
  const A = finalMatrix;
  const A_B = computeTransformInBasis(A, P);
  const selectedVec = vectorSet.find(v => v.id === pathDemo.selectedVectorId) || vectorSet[0];
  const v = new Vec2(selectedVec.vector[0], selectedVec.vector[1]);
  const v_B = standardToBasisCoordinates(v, P);
  const v_E = v_B ? P.multiplyVec(v_B) : null; // should equal v
  const Av_E = v_E ? A.multiplyVec(v_E) : null;
  const Av_B = Av_E && PInverse ? PInverse.multiplyVec(Av_E) : null;
  const AB_v_B = A_B && v_B ? A_B.multiplyVec(v_B) : null;

  // 步骤描述
  const steps = [
    { label: 'step 0', desc: '选择演示向量' },
    { label: 'step 1', desc: 'P [v]_B = v_E' },
    { label: 'step 2', desc: 'A v_E' },
    { label: 'step 3', desc: 'P⁻¹ A v_E = [Av]_B' },
    { label: 'step 4', desc: '对比 A_B [v]_B' },
  ];

  const isPathActive = pathDemo.isPlaying || disabled;

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#0f0f23',
      borderRadius: '4px',
      fontSize: '12px',
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
        P⁻¹AP 路径演示
      </h3>

      {/* 向量选择 */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>
          演示向量：
        </label>
        <select
          value={selectedVec.id}
          onChange={(e) => onSelectVector(e.target.value)}
          disabled={isPathActive}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '3px',
            fontSize: '12px',
          }}
        >
          {vectorSet.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} = ({v.vector[0]}, {v.vector[1]})
            </option>
          ))}
        </select>
      </div>

      {/* 当前步骤指示 */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
      }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '3px 2px',
              borderRadius: '3px',
              fontSize: '9px',
              backgroundColor: i === pathDemo.stepIndex ? '#1a3a5a' : '#1a1a2e',
              color: i === pathDemo.stepIndex ? '#4CAF50' : '#666',
              border: i === pathDemo.stepIndex ? '1px solid #4CAF50' : '1px solid #333',
            }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* 当前步骤数值推导 */}
      <div style={{
        padding: '8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '3px',
        fontSize: '11px',
        marginBottom: '8px',
        minHeight: '60px',
      }}>
        {pathDemo.stepIndex === 0 && v_B && (
          <div>
            <span style={{ color: '#888' }}>选定向量 {selectedVec.name} 在标准坐标下：</span>
            <span style={{ color: '#aaa', marginLeft: '4px' }}>{fmtVec(v)}</span>
            <br />
            <span style={{ color: '#888' }}>新基坐标：</span>
            <span style={{ color: '#00ffff', marginLeft: '4px' }}>
              [{selectedVec.name}]_B = {fmtVec(v_B)}
            </span>
          </div>
        )}

        {pathDemo.stepIndex === 1 && v_B && v_E && (
          <div>
            <span style={{ color: '#888' }}>[{selectedVec.name}]_B = {fmtVec(v_B)}</span>
            <br />
            <span style={{ color: '#4CAF50' }}>P [{selectedVec.name}]_B = v_E = {fmtVec(v_E)}</span>
          </div>
        )}

        {pathDemo.stepIndex === 2 && v_E && Av_E && (
          <div>
            <span style={{ color: '#888' }}>v_E = {fmtVec(v_E)}</span>
            <br />
            <span style={{ color: '#FF9800' }}>A v_E = {fmtVec(Av_E)}</span>
          </div>
        )}

        {pathDemo.stepIndex === 3 && Av_E && Av_B && (
          <div>
            <span style={{ color: '#888' }}>A v_E = {fmtVec(Av_E)}</span>
            <br />
            <span style={{ color: '#E91E63' }}>P⁻¹ A v_E = [Av]_B = {fmtVec(Av_B)}</span>
          </div>
        )}

        {pathDemo.stepIndex === 4 && A_B && v_B && Av_B && AB_v_B && (() => {
          const match =
            Math.abs(AB_v_B.x - Av_B.x) < EPS &&
            Math.abs(AB_v_B.y - Av_B.y) < EPS;
          return (
            <div>
              <span style={{ color: '#888' }}>A_B = P⁻¹ A P = </span>
              <span style={{ color: '#aaa' }}>
                [{formatElement(A_B.a)}, {formatElement(A_B.b)}; {formatElement(A_B.c)}, {formatElement(A_B.d)}]
              </span>
              <br />
              <span style={{ color: '#2196F3' }}>A_B [{selectedVec.name}]_B = {fmtVec(AB_v_B)}</span>
              <br />
              <span style={{ color: '#E91E63' }}>[A {selectedVec.name}]_B = {fmtVec(Av_B)}</span>
              <br />
              <span style={{ color: match ? '#4CAF50' : '#ff4444', fontWeight: 'bold' }}>
                {match ? '✓ 验证一致：A_B [v]_B = [Av]_B' : '✗ 验证不一致'}
              </span>
            </div>
          );
        })()}
      </div>

      {/* 控制按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onPrevStep}
            disabled={pathDemo.stepIndex <= 0 || isPathActive}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: pathDemo.stepIndex > 0 && !isPathActive ? '#9C27B0' : '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: pathDemo.stepIndex > 0 && !isPathActive ? 'pointer' : 'not-allowed',
              fontSize: '12px',
            }}
          >
            上一步
          </button>
          <button
            onClick={onNextStep}
            disabled={pathDemo.stepIndex >= 4 || isPathActive}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: pathDemo.stepIndex < 4 && !isPathActive ? '#9C27B0' : '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: pathDemo.stepIndex < 4 && !isPathActive ? 'pointer' : 'not-allowed',
              fontSize: '12px',
            }}
          >
            下一步
          </button>
        </div>

        <button
          onClick={onPlayPath}
          disabled={isPathActive}
          style={{
            padding: '6px',
            backgroundColor: isPathActive ? '#555' : '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: isPathActive ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          {pathDemo.isPlaying ? '播放中...' : '播放完整路径'}
        </button>

        <button
          onClick={onResetPath}
          disabled={pathDemo.isPlaying}
          style={{
            padding: '6px',
            backgroundColor: pathDemo.isPlaying ? '#555' : '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: pathDemo.isPlaying ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          重置路径
        </button>
      </div>
    </div>
  );
};

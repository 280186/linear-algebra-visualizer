import React from 'react';
import { Mat2 } from '../math/Mat2';
import { Vec2 } from '../math/Vec2';
import { MatrixItem, VectorItem } from '../types';
import { computeCumulativeMatrices, computeTransformedVectors } from '../utils/matrixSequence';

const EPS = 1e-8;

interface ResultPanelProps {
  matrixSequence: MatrixItem[];
  vectorSet: VectorItem[];
  currentMatrix?: Mat2 | null;
}

/**
 * 格式化矩阵为字符串
 */
function formatMatrix(mat: Mat2): string {
  return `[ ${mat.a.toFixed(2)}  ${mat.b.toFixed(2)} ]\n[ ${mat.c.toFixed(2)}  ${mat.d.toFixed(2)} ]`;
}

/**
 * 格式化向量为字符串
 */
function formatVec2(v: Vec2): string {
  return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;
}

/**
 * 判断两个矩阵是否相等
 */
function matricesEqual(a: Mat2, b: Mat2): boolean {
  return (
    Math.abs(a.a - b.a) < EPS &&
    Math.abs(a.b - b.b) < EPS &&
    Math.abs(a.c - b.c) < EPS &&
    Math.abs(a.d - b.d) < EPS
  );
}

/**
 * 结果面板组件
 */
export const ResultPanel: React.FC<ResultPanelProps> = ({
  matrixSequence,
  vectorSet,
  currentMatrix
}) => {
  if (matrixSequence.length === 0 && vectorSet.length === 0) {
    return null;
  }

  // 计算累计矩阵
  const cumulativeMatrices = computeCumulativeMatrices(matrixSequence);
  const finalMatrix = cumulativeMatrices[cumulativeMatrices.length - 1];

  // 使用当前动画矩阵（如果存在），否则使用最终矩阵
  const displayMatrix = currentMatrix || finalMatrix;

  // 计算向量变换结果（使用当前显示的矩阵）
  const transformedVectors = computeTransformedVectors(displayMatrix, vectorSet);

  // 非交换性验证（仅当矩阵数量为 2 时）
  let commutativityInfo: React.ReactNode = null;
  if (matrixSequence.length === 2) {
    const M1 = Mat2.fromMatrix(matrixSequence[0].matrix);
    const M2 = Mat2.fromMatrix(matrixSequence[1].matrix);

    const C_current = M2.multiplyMat(M1);  // 当前顺序：先 M1，再 M2
    const C_swap = M1.multiplyMat(M2);     // 交换顺序：先 M2，再 M1

    const isCommutative = matricesEqual(C_current, C_swap);

    commutativityInfo = (
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '4px'
      }}>
        <p style={{ margin: '0 0 6px 0', color: '#E91E63', fontWeight: 'bold' }}>
          非交换性验证：
        </p>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#888' }}>当前顺序：先 {matrixSequence[0].name}，再 {matrixSequence[1].name}</span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#aaa' }}>
            C = {matrixSequence[1].name} × {matrixSequence[0].name} = [{C_current.a.toFixed(2)}, {C_current.b.toFixed(2)}; {C_current.c.toFixed(2)}, {C_current.d.toFixed(2)}]
          </span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#888' }}>交换顺序：先 {matrixSequence[1].name}，再 {matrixSequence[0].name}</span>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: '#aaa' }}>
            C_swap = {matrixSequence[0].name} × {matrixSequence[1].name} = [{C_swap.a.toFixed(2)}, {C_swap.b.toFixed(2)}; {C_swap.c.toFixed(2)}, {C_swap.d.toFixed(2)}]
          </span>
        </div>
        <div style={{
          padding: '4px 8px',
          backgroundColor: isCommutative ? '#1a3a1a' : '#3a1a1a',
          borderRadius: '3px'
        }}>
          {isCommutative ? (
            <span style={{ color: '#4CAF50' }}>
              本例中 {matrixSequence[1].name} × {matrixSequence[0].name} = {matrixSequence[0].name} × {matrixSequence[1].name}，但一般情况下矩阵乘法不满足交换律。
            </span>
          ) : (
            <span style={{ color: '#ff6b6b' }}>
              {matrixSequence[1].name} × {matrixSequence[0].name} ≠ {matrixSequence[0].name} × {matrixSequence[1].name}，矩阵乘法通常不满足交换律。
            </span>
          )}
        </div>
      </div>
    );
  } else if (matrixSequence.length > 2) {
    commutativityInfo = (
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <span style={{ color: '#888' }}>
          提示：保留两个矩阵时可查看交换顺序差异。
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#0f0f23',
      borderRadius: '4px',
      fontSize: '12px'
    }}>
      {/* 最终累计矩阵 */}
      {matrixSequence.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>最终累计矩阵：</p>
          <pre style={{ margin: 0, fontSize: '11px' }}>
            {formatMatrix(finalMatrix)}
          </pre>
        </div>
      )}

      {/* 每一步累计矩阵 */}
      {matrixSequence.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 5px 0', color: '#888' }}>累计步骤：</p>
          {matrixSequence.map((item, index) => {
            const cumMatrix = cumulativeMatrices[index + 1];
            return (
              <div key={item.id} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>C{index + 1} = {item.name} × C{index} = </span>
                <span style={{ color: '#aaa' }}>
                  [{cumMatrix.a.toFixed(1)}, {cumMatrix.b.toFixed(1)}; {cumMatrix.c.toFixed(1)}, {cumMatrix.d.toFixed(1)}]
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 当前动画矩阵 */}
      {currentMatrix && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 5px 0', color: '#FF9800' }}>当前动画矩阵：</p>
          <pre style={{ margin: 0, fontSize: '11px' }}>
            {formatMatrix(currentMatrix)}
          </pre>
        </div>
      )}

      {/* 向量变换结果（使用当前矩阵实时计算） */}
      {transformedVectors.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 5px 0', color: '#2196F3' }}>
            向量变换结果（{currentMatrix ? '实时' : '最终'}）：
          </p>
          {transformedVectors.map(({ original, transformed, name }) => (
            <div key={name} style={{ marginBottom: '4px' }}>
              <span style={{ color: '#666' }}>{name} = {formatVec2(original)} → </span>
              <span style={{ color: '#fff' }}>{name}' = {formatVec2(transformed)}</span>
            </div>
          ))}
        </div>
      )}

      {/* 非交换性验证（放在最下面） */}
      {commutativityInfo}
    </div>
  );
};

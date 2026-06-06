import React from 'react';
import { Mat2 } from '../math/Mat2';
import { Vec2 } from '../math/Vec2';
import { MatrixItem, VectorItem, BasisConfig } from '../types';
import { computeCumulativeMatrices, computeTransformedVectors } from '../utils/matrixSequence';
import { buildBasisMatrix, isValidBasis, standardToBasisCoordinates, computeTransformInBasis, formatElement } from '../utils/basis';

const EPS = 1e-8;

interface ResultPanelProps {
  matrixSequence: MatrixItem[];
  vectorSet: VectorItem[];
  currentMatrix?: Mat2 | null;
  basisConfig?: BasisConfig;
}

/**
 * 格式化矩阵为字符串
 */
function formatMatrix(mat: Mat2): string {
  return `[ ${formatElement(mat.a)}  ${formatElement(mat.b)} ]\n[ ${formatElement(mat.c)}  ${formatElement(mat.d)} ]`;
}

/**
 * 格式化标量值，避免 -0.00、NaN、Infinity
 */
function formatScalar(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < EPS) return '0';
  return Math.abs(value).toFixed(2);
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
  currentMatrix,
  basisConfig
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
          {/* 最终矩阵行列式 */}
          <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', fontSize: '11px' }}>
            <span style={{ color: '#888' }}>det(C) = {formatScalar(finalMatrix.determinant())}</span>
            <span style={{ color: '#666', marginLeft: '8px' }}>
              → 面积缩放 {formatScalar(Math.abs(finalMatrix.determinant()))} 倍
            </span>
            {finalMatrix.determinant() > EPS && (
              <span style={{ color: '#4CAF50', marginLeft: '8px' }}>方向保持</span>
            )}
            {finalMatrix.determinant() < -EPS && (
              <span style={{ color: '#ff4444', marginLeft: '8px' }}>方向翻转</span>
            )}
            {Math.abs(finalMatrix.determinant()) <= EPS && (
              <span style={{ color: '#888', marginLeft: '8px' }}>平面被压缩，矩阵不可逆</span>
            )}
          </div>
          {/* 最终矩阵逆矩阵 */}
          <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', fontSize: '11px' }}>
            {(() => {
              const finalInverse = finalMatrix.inverse();
              return finalInverse ? (
                <div>
                  <span style={{ color: '#4CAF50' }}>最终累计矩阵可逆</span>
                  <span style={{ color: '#aaa', marginLeft: '8px' }}>C⁻¹ =</span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                    {`[ ${formatElement(finalInverse.a)}  ${formatElement(finalInverse.b)} ]`}
                    {'\n'}
                    {`[ ${formatElement(finalInverse.c)}  ${formatElement(finalInverse.d)} ]`}
                  </pre>
                </div>
              ) : (
                <span style={{ color: '#888' }}>最终累计矩阵不可逆</span>
              );
            })()}
          </div>
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
          {/* 当前矩阵行列式 */}
          <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', fontSize: '11px' }}>
            <span style={{ color: '#888' }}>det(M) = {formatScalar(currentMatrix.determinant())}</span>
            <span style={{ color: '#666', marginLeft: '8px' }}>
              → 面积缩放 {formatScalar(Math.abs(currentMatrix.determinant()))} 倍
            </span>
            {currentMatrix.determinant() > EPS && (
              <span style={{ color: '#4CAF50', marginLeft: '8px' }}>方向保持</span>
            )}
            {currentMatrix.determinant() < -EPS && (
              <span style={{ color: '#ff4444', marginLeft: '8px' }}>方向翻转</span>
            )}
            {Math.abs(currentMatrix.determinant()) <= EPS && (
              <span style={{ color: '#888', marginLeft: '8px' }}>平面被压缩，矩阵不可逆</span>
            )}
          </div>
          {/* 当前矩阵逆矩阵 */}
          <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', fontSize: '11px' }}>
            {(() => {
              const currentInverse = currentMatrix.inverse();
              return currentInverse ? (
                <div>
                  <span style={{ color: '#4CAF50' }}>当前矩阵可逆</span>
                  <span style={{ color: '#aaa', marginLeft: '8px' }}>M⁻¹ =</span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                    {`[ ${formatElement(currentInverse.a)}  ${formatElement(currentInverse.b)} ]`}
                    {'\n'}
                    {`[ ${formatElement(currentInverse.c)}  ${formatElement(currentInverse.d)} ]`}
                  </pre>
                </div>
              ) : (
                <div>
                  <span style={{ color: '#ff4444' }}>当前矩阵不可逆</span>
                  <span style={{ color: '#888', marginLeft: '8px' }}>det ≈ 0，平面被压缩，无法唯一恢复</span>
                </div>
              );
            })()}
          </div>
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

      {/* 新基坐标显示 */}
      {basisConfig?.showBasisCoordinateInfo && vectorSet.length > 0 && (() => {
        const b1 = new Vec2(basisConfig.b1[0], basisConfig.b1[1]);
        const b2 = new Vec2(basisConfig.b2[0], basisConfig.b2[1]);
        const P = buildBasisMatrix(b1, b2);
        const valid = isValidBasis(P);

        if (!valid) {
          return (
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#3a1a1a', borderRadius: '4px', fontSize: '11px' }}>
              <span style={{ color: '#ff4444' }}>当前 b1, b2 不能构成基，无法计算新基坐标。</span>
            </div>
          );
        }

        // 计算 A_B = P^{-1} A P
        const A_final_B = computeTransformInBasis(finalMatrix, P);
        const A_current_B = currentMatrix ? computeTransformInBasis(currentMatrix, P) : null;

        return (
          <div style={{ marginBottom: '10px' }}>
            {/* 用户向量在新基下的坐标 */}
            <p style={{ margin: '0 0 6px 0', color: '#00ffff', fontWeight: 'bold' }}>用户向量在新基 B 下的坐标：</p>
            {vectorSet.map(v => {
              const vec = new Vec2(v.vector[0], v.vector[1]);
              const basisCoord = standardToBasisCoordinates(vec, P);
              if (!basisCoord) return null;

              return (
                <div key={v.id} style={{ marginBottom: '6px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px' }}>
                  <span style={{ color: '#888', fontSize: '11px' }}>{v.name} = {formatVec2(vec)}</span>
                  <span style={{ color: '#666', marginLeft: '8px', fontSize: '11px' }}>在新基 B 下：</span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                    {`[${v.name}]_B = [ ${formatElement(basisCoord.x)} ]`}
                    {'\n'}
                    {`         [ ${formatElement(basisCoord.y)} ]`}
                  </pre>
                </div>
              );
            })}

            {/* 同一变换在新基下的矩阵 */}
            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#1a1a2e', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 6px 0', color: '#E91E63', fontWeight: 'bold' }}>同一变换在新基下的矩阵：</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#888' }}>A_B = P⁻¹ A P</p>

              {/* A_final_B */}
              {A_final_B && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#4CAF50' }}>最终累计变换：</span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                    {`A_final_B = [ ${formatElement(A_final_B.a)}  ${formatElement(A_final_B.b)} ]`}
                    {'\n'}
                    {`            [ ${formatElement(A_final_B.c)}  ${formatElement(A_final_B.d)} ]`}
                  </pre>
                </div>
              )}

              {/* A_current_B */}
              {A_current_B && (
                <div>
                  <span style={{ fontSize: '11px', color: '#FF9800' }}>当前变换：</span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                    {`A_current_B = [ ${formatElement(A_current_B.a)}  ${formatElement(A_current_B.b)} ]`}
                    {'\n'}
                    {`              [ ${formatElement(A_current_B.c)}  ${formatElement(A_current_B.d)} ]`}
                  </pre>
                </div>
              )}
            </div>

            {/* 用户向量验证（简洁版） */}
            {A_final_B && vectorSet.length > 0 && (
              <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#888' }}>向量验证（A_B [v]_B = [A v]_B）：</p>
                {vectorSet.map(v => {
                  const vec = new Vec2(v.vector[0], v.vector[1]);
                  const basisCoord = standardToBasisCoordinates(vec, P);
                  if (!basisCoord) return null;

                  // A_B [v]_B
                  const AB_times_basisCoord = A_final_B.multiplyVec(basisCoord);

                  // [A v]_B
                  const Av = finalMatrix.multiplyVec(vec);
                  const Av_basisCoord = standardToBasisCoordinates(Av, P);
                  if (!Av_basisCoord) return null;

                  // 验证是否一致
                  const match =
                    Math.abs(AB_times_basisCoord.x - Av_basisCoord.x) < EPS &&
                    Math.abs(AB_times_basisCoord.y - Av_basisCoord.y) < EPS;

                  return (
                    <div key={v.id} style={{ marginBottom: '4px', fontSize: '10px' }}>
                      <span style={{ color: '#aaa' }}>{v.name}: </span>
                      <span style={{ color: match ? '#4CAF50' : '#ff4444' }}>
                        {match ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 非交换性验证（放在最下面） */}
      {commutativityInfo}
    </div>
  );
};

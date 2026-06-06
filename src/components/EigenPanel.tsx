import React from 'react';
import { EigenConfig, EigenResult } from '../types';
import { getEigenMeaning } from '../utils/eigen';
import { formatElement } from '../utils/basis';

const EPS = 1e-8;

interface EigenPanelProps {
  eigenConfig: EigenConfig;
  eigenResult: EigenResult;
  onConfigChange: (config: EigenConfig) => void;
}

/**
 * 格式化方向向量
 */
function fmtDir(d: [number, number] | null): string {
  if (!d) return '(任意方向)';
  return `(${formatElement(d[0])}, ${formatElement(d[1])})`;
}

/**
 * 特征值 / 特征向量控制面板
 */
export const EigenPanel: React.FC<EigenPanelProps> = ({
  eigenConfig,
  eigenResult,
  onConfigChange,
}) => {
  const handleToggle = () => {
    onConfigChange({
      ...eigenConfig,
      showEigenInfo: !eigenConfig.showEigenInfo,
    });
  };

  const handleSelectDirection = (id: string) => {
    onConfigChange({
      ...eigenConfig,
      selectedDirectionId: id,
    });
  };

  const handleScalarTChange = (t: number) => {
    onConfigChange({
      ...eigenConfig,
      scalarT: t,
    });
  };

  // 找到当前选中的方向
  const selectedDir = eigenResult.directions.find(
    d => d.id === eigenConfig.selectedDirectionId
  ) || eigenResult.directions[0] || null;

  // 计算示例向量
  const t = eigenConfig.scalarT;
  const exampleDir = selectedDir?.displayDirection || [1, 0]; // all-directions 时用 (1,0)
  const lambda = selectedDir?.lambda ?? 0;
  const v_x = t * exampleDir[0];
  const v_y = t * exampleDir[1];
  const Av_x = lambda * v_x;
  const Av_y = lambda * v_y;

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#0f0f23',
      borderRadius: '4px',
      fontSize: '12px',
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>
        特征值 / 特征向量
      </h3>

      {/* 总开关 */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '10px',
        fontSize: '12px',
        color: '#888',
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={eigenConfig.showEigenInfo}
          onChange={handleToggle}
        />
        显示特征信息
      </label>

      {eigenConfig.showEigenInfo && (
        <>
          {/* 标题说明 */}
          <div style={{
            padding: '6px 8px',
            backgroundColor: '#1a1a2e',
            borderRadius: '3px',
            fontSize: '10px',
            color: '#666',
            marginBottom: '8px',
          }}>
            最终累计矩阵的特征分析
          </div>

          {/* 无实特征值 */}
          {eigenResult.kind === 'no-real-eigenvalues' && (
            <div style={{
              padding: '8px',
              backgroundColor: '#3a1a1a',
              borderRadius: '3px',
              fontSize: '11px',
            }}>
              <span style={{ color: '#ff4444' }}>
                该矩阵没有实特征值 / 实特征向量。
              </span>
              <br />
              <span style={{ color: '#888', fontSize: '10px' }}>
                在二维实平面中，没有非零向量经过该变换后仍保持在同一条方向直线上。
              </span>
            </div>
          )}

          {/* 所有方向都是特征方向 */}
          {eigenResult.kind === 'all-directions' && (
            <div style={{
              padding: '8px',
              backgroundColor: '#1a3a1a',
              borderRadius: '3px',
              fontSize: '11px',
              marginBottom: '8px',
            }}>
              <span style={{ color: '#4CAF50' }}>
                该矩阵近似为 λI，所有非零方向都是特征方向。
              </span>
              <br />
              <span style={{ color: '#888', fontSize: '10px' }}>
                λ = {formatElement(lambda)}
              </span>
            </div>
          )}

          {/* 有特征方向时显示方向列表 */}
          {eigenResult.kind !== 'no-real-eigenvalues' && eigenResult.directions.length > 0 && (
            <>
              {/* 特征值列表 */}
              <div style={{ marginBottom: '8px' }}>
                {eigenResult.directions.map((d) => {
                  const isSelected = d.id === (selectedDir?.id || '');
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDirection(d.id)}
                      style={{
                        padding: '6px 8px',
                        marginBottom: '4px',
                        borderRadius: '3px',
                        backgroundColor: isSelected ? '#1a3a5a' : '#1a1a2e',
                        border: isSelected ? '1px solid #4CAF50' : '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                        λ = {formatElement(d.lambda)}
                      </span>
                      <span style={{ color: '#888', marginLeft: '8px' }}>
                        {fmtDir(d.displayDirection)}
                      </span>
                      <br />
                      <span style={{ color: '#aaa', fontSize: '10px' }}>
                        {getEigenMeaning(d.lambda)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 选中方向的详细信息 */}
              {selectedDir && (
                <>
                  <div style={{
                    padding: '6px 8px',
                    backgroundColor: '#1a1a2e',
                    borderRadius: '3px',
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ color: '#888' }}>当前选择：λ = </span>
                    <span style={{ color: '#00ffff' }}>{formatElement(selectedDir.lambda)}</span>
                  </div>

                  {/* t 滑块 */}
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#888' }}>
                      t = {t.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="0.1"
                      value={t}
                      onChange={(e) => handleScalarTChange(parseFloat(e.target.value))}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  {/* v 和 Av 显示 */}
                  <div style={{
                    padding: '6px 8px',
                    backgroundColor: '#1a1a2e',
                    borderRadius: '3px',
                    fontSize: '11px',
                    marginBottom: '6px',
                  }}>
                    <span style={{ color: '#888' }}>u = {fmtDir(selectedDir.displayDirection)}</span>
                    <br />
                    <span style={{ color: '#4CAF50' }}>
                      v = t·u = ({formatElement(v_x)}, {formatElement(v_y)})
                    </span>
                    <br />
                    <span style={{ color: '#FF9800' }}>
                      Av = λv = ({formatElement(Av_x)}, {formatElement(Av_y)})
                    </span>
                  </div>

                  {/* t=0 提示 */}
                  {Math.abs(t) < EPS && (
                    <div style={{
                      padding: '6px 8px',
                      backgroundColor: '#3a3a1a',
                      borderRadius: '3px',
                      fontSize: '10px',
                      color: '#FFD54F',
                    }}>
                      零向量没有方向，通常不作为特征向量讨论。
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

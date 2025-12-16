
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { calculatePaintEstimate, EstimationResult } from '../utils/calculator';
import { SUPPLIER_DATA, PaintProduct, getProductById } from '../utils/supplier_data';
import { WINTER_TRENDS } from '../utils/trends';

export default function Home() {
  // Filter products for dropdowns
  const wallProducts = SUPPLIER_DATA.filter(p => p.type === 'wall');
  const trimProducts = SUPPLIER_DATA.filter(p => p.type === 'trim');

  // Input Mode state
  const [inputMode, setInputMode] = useState<'dimensions' | 'area'>('dimensions');
  const [customWallArea, setCustomWallArea] = useState<number | ''>('');

  const [width, setWidth] = useState<number | ''>(4); // meters (approx 13ft)
  const [length, setLength] = useState<number | ''>(6); // meters (approx 20ft)
  const [height, setHeight] = useState<number | ''>(2.4); // meters (approx 8ft)

  // Default selections
  const [wallProductId, setWallProductId] = useState<string>(wallProducts[0].id);
  const [trimProductId, setTrimProductId] = useState<string>(trimProducts[0].id);

  const [coats, setCoats] = useState<number>(2);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);
  const [includeTrim, setIncludeTrim] = useState<boolean>(true);

  const [numDoors, setNumDoors] = useState<number | ''>(1);
  const [numWindows, setNumWindows] = useState<number | ''>(1);

  const [laborRate, setLaborRate] = useState<number>(16); // £/m²

  const [result, setResult] = useState<EstimationResult | null>(null);

  useEffect(() => {
    const wallProduct = getProductById(wallProductId);
    const trimProduct = includeTrim ? getProductById(trimProductId) : null;

    if (!wallProduct) return; // Should not happen with defaults

    // Calculation Logic Selection
    let dimensions: { width: number; length: number; height: number } | { totalWallArea: number } | null = null;

    if (inputMode === 'dimensions') {
      // Safety check: ensure all dimensions are valid numbers
      if (width === '' || length === '' || height === '') {
        return;
      }
      dimensions = { width: Number(width), length: Number(length), height: Number(height) };
    } else {
      // Area mode
      if (customWallArea === '') {
        return;
      }
      dimensions = { totalWallArea: Number(customWallArea) };
    }

    if (!dimensions) return;

    const res = calculatePaintEstimate(
      dimensions,
      wallProduct,
      trimProduct || null,
      coats,
      numDoors === '' ? 0 : numDoors,
      numWindows === '' ? 0 : numWindows,
      // In Area mode, we disable specific ceiling logic (assumed in total) or force false
      inputMode === 'dimensions' ? includeCeiling : false,
      laborRate
    );
    setResult(res);
  }, [width, length, height, customWallArea, inputMode, wallProductId, trimProductId, coats, numDoors, numWindows, includeCeiling, includeTrim, laborRate]);

  // Helper for safe number input updates
  const handleDimensionChange = (
    setter: (val: number | '') => void,
    rawVal: string
  ) => {
    if (rawVal === '') {
      setter('');
      return;
    }
    const val = parseFloat(rawVal);
    if (!isNaN(val)) {
      setter(val);
    }
  };

  const adjustDimension = (
    setter: (val: number | '') => void,
    current: number | '',
    amount: number
  ) => {
    const base = current === '' ? 0 : current;
    const newVal = Math.max(0, parseFloat((base + amount).toFixed(1)));
    setter(newVal);
  };

  const adjustCount = (
    setter: (val: number) => void,
    current: number,
    amount: number
  ) => {
    setter(Math.max(0, current + amount));
  };

  return (
    <>
      <Head>
        <title>Paint Cost Estimator (UK)</title>
        <meta name="description" content="Calculate paint material costs for your room" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Paint Material Estimator</h1>
          <p style={{ color: 'var(--text-muted)' }}>Get a quick estimate for your DIY painting project (UK Standards)</p>
        </header>

        <div className="card">
          {/* Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <button
              onClick={() => setInputMode('dimensions')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                border: 'none',
                background: inputMode === 'dimensions' ? 'var(--primary)' : 'var(--surface-2)',
                color: inputMode === 'dimensions' ? 'white' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              By Dimensions
            </button>
            <button
              onClick={() => setInputMode('area')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                border: 'none',
                background: inputMode === 'area' ? 'var(--primary)' : 'var(--surface-2)',
                color: inputMode === 'area' ? 'white' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              By Total Area
            </button>
          </div>

          <div className="input-group">
            <label>
              {inputMode === 'dimensions' ? 'Room Dimensions (Meters)' : 'Total Wall Area (sq meters)'}
            </label>

            {inputMode === 'dimensions' ? (
              <div className="input-row">
                <div className="dimension-field">
                  <span className="field-label">Length</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={length}
                    onChange={(e) => handleDimensionChange(setLength, e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="dimension-field">
                  <span className="field-label">Width</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={width}
                    onChange={(e) => handleDimensionChange(setWidth, e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="dimension-field">
                  <span className="field-label">Height</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={height}
                    onChange={(e) => handleDimensionChange(setHeight, e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            ) : (
              <div className="input-row">
                <div className="dimension-field" style={{ width: '100%' }}>
                  <span className="field-label">Total Area (m²)</span>
                  <input
                    type="number"
                    placeholder="e.g. 40"
                    value={customWallArea}
                    onChange={(e) => handleDimensionChange(setCustomWallArea, e.target.value)}
                    min="0"
                    style={{ fontSize: '1.2rem', padding: '1rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Wall Paint</label>
              <select value={wallProductId} onChange={(e) => setWallProductId(e.target.value)}>
                {wallProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} - {p.name} (£{p.pricePerLitre.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Number of Coats</label>
              <select value={coats} onChange={(e) => setCoats(Number(e.target.value))}>
                <option value="1">1 Coat</option>
                <option value="2">2 Coats (Recommended)</option>
                <option value="3">3 Coats</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            {inputMode === 'dimensions' && (
              <label className="checkbox-visual">
                <input
                  type="checkbox"
                  checked={includeCeiling}
                  onChange={(e) => setIncludeCeiling(e.target.checked)}
                />
                Include Ceiling (Same as Wall)
              </label>
            )}
            <label className="checkbox-visual">
              <input
                type="checkbox"
                checked={includeTrim}
                onChange={(e) => setIncludeTrim(e.target.checked)}
              />
              Include Trim/Baseboards
            </label>
          </div>

          {includeTrim && (
            <div className="input-group" style={{ marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
              <label>Trim Paint</label>
              <select value={trimProductId} onChange={(e) => setTrimProductId(e.target.value)}>
                {trimProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} - {p.name} (£{p.pricePerLitre.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label>Doors & Windows (Deductions)</label>
            <div className="input-row">
              <div className="dimension-field">
                <span className="field-label">Doors (approx 2m²)</span>
                <input
                  type="number"
                  value={numDoors}
                  placeholder="0"
                  onChange={(e) => handleDimensionChange(setNumDoors, e.target.value)}
                  min="0"
                />
              </div>
              <div className="dimension-field">
                <span className="field-label">Windows (approx 1.5m²)</span>
                <input
                  type="number"
                  value={numWindows}
                  placeholder="0"
                  onChange={(e) => handleDimensionChange(setNumWindows, e.target.value)}
                  min="0"
                />
              </div>
            </div>
            {inputMode === 'area' && (
              <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                * Deductions are subtracted from your total area input above.
              </small>
            )}
          </div>

          {/* Results Panel */}
          {result && (
            <div style={{ marginTop: '2rem', background: 'var(--surface-2)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div className="result-item">
                <span className="result-label">Net Wall Area (Paintable)</span>
                <span className="result-value">{result.paintableArea.toFixed(1)} m²</span>
              </div>

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              <div className="result-item">
                <div>
                  <span className="result-label">Wall Paint ({coats} coats)</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {result.wallPaint.litresNeeded} Litres required
                  </div>
                </div>
                <div className="result-value">£{result.wallPaint.cost.toFixed(2)}</div>
              </div>

              {result.trimPaint && (
                <div className="result-item" style={{ marginTop: '1rem' }}>
                  <div>
                    <span className="result-label">Trim Paint</span>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {result.trimPaint.litresNeeded} Litres required
                    </div>
                  </div>
                  <div className="result-value">£{result.trimPaint.cost.toFixed(2)}</div>
                </div>
              )}

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              <div className="result-item" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total Materials Cost</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-highlight">
                    £{result.totalEstimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {result.estimatedLaborCost && (
                <>
                  <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
                  <div className="result-item" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <span className="result-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Professional Labor Estimate</span>

                      {/* Interactive Labor Rate Control */}
                      <div style={{ background: 'var(--surface-1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Adjust Hourly/Area Rate:</span>
                          <strong>£{laborRate}/m²</strong>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="40"
                          step="1"
                          value={laborRate}
                          onChange={(e) => setLaborRate(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <span>£10 (Budget)</span>
                          <span>£40 (High-Spec)</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                      <div className="result-value" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                        £{Math.round(result.preciseLaborCost)}
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>Typical range: £{Math.round(result.estimatedLaborCost.min)} - £{Math.round(result.estimatedLaborCost.max)}</small>
                    </div>
                  </div>
                </>
              )}
              <p className="disclaimer">*Estimate based on mock supplier prices. Actual in-store prices may vary.</p>
            </div>
          )}

        </div>

        {/* Seasonal Trends Section */}
        <section className="trends-section">
          <header className="trends-header">
            <span>❄️</span>
            <h2>Trending This Season (Winter 2025/2026)</h2>
          </header>

          <div className="trends-grid">
            {WINTER_TRENDS.map(trend => (
              <div key={trend.id} className="trend-card">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: trend.hex }}
                  title={trend.hex}
                ></div>
                <div className="trend-name">{trend.name}</div>
                <div className="trend-brand">{trend.brand}</div>
                <div className="trend-desc">{trend.description}</div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}

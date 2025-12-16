
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { calculatePaintEstimate, EstimationResult } from '../utils/calculator';
import { SUPPLIER_DATA, PaintProduct, getProductById } from '../utils/supplier_data';
import { WINTER_TRENDS } from '../utils/trends';

export default function Home() {
  const [width, setWidth] = useState<number | ''>(4); // meters (approx 13ft)
  const [length, setLength] = useState<number | ''>(4); // meters
  const [height, setHeight] = useState<number | ''>(2.4); // meters (approx 8ft)

  // Default selections
  const [wallProductId, setWallProductId] = useState<string>('wall_standard');
  const [trimProductId, setTrimProductId] = useState<string>('trim_satin');

  const [coats, setCoats] = useState<number>(2);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);
  const [includeTrim, setIncludeTrim] = useState<boolean>(true);

  const [numDoors, setNumDoors] = useState<number | ''>(1);
  const [numWindows, setNumWindows] = useState<number | ''>(1);

  const [result, setResult] = useState<EstimationResult | null>(null);

  // Filter products for dropdowns
  const wallProducts = SUPPLIER_DATA.filter(p => p.type === 'wall');
  const trimProducts = SUPPLIER_DATA.filter(p => p.type === 'trim');

  useEffect(() => {
    const wallProduct = getProductById(wallProductId);
    const trimProduct = includeTrim ? getProductById(trimProductId) : null;

    if (!wallProduct) return; // Should not happen with defaults

    // Safety check: ensure all dimensions are valid numbers
    if (width === '' || length === '' || height === '') {
      return;
    }

    const res = calculatePaintEstimate(
      { width: Number(width), length: Number(length), height: Number(height) },
      wallProduct,
      trimProduct || null,
      coats,
      numDoors === '' ? 0 : numDoors,
      numWindows === '' ? 0 : numWindows,
      includeCeiling
    );
    setResult(res);
  }, [width, length, height, wallProductId, trimProductId, coats, numDoors, numWindows, includeCeiling, includeTrim]);

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
          <div className="input-group">
            <label>Room Dimensions (Meters)</label>
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
            <label className="checkbox-visual">
              <input
                type="checkbox"
                checked={includeCeiling}
                onChange={(e) => setIncludeCeiling(e.target.checked)}
              />
              Include Ceiling (Same as Wall)
            </label>
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
          </div>

          {/* Results Panel */}
          {result && (
            <div className="results-panel">
              <div className="result-item">
                <span className="result-label">Net Wall Area</span>
                <span className="result-value">{Math.round(result.paintableArea)} sq m</span>
              </div>

              <div className="result-item">
                <span className="result-label">Wall Paint ({result.wallPaint.product.brand})</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="result-value">{result.wallPaint.litresNeeded} Litres</div>
                  <small style={{ color: 'var(--text-muted)' }}>£{result.wallPaint.cost.toFixed(2)}</small>
                </div>
              </div>

              {result.trimPaint && (
                <div className="result-item">
                  <span className="result-label">Trim Paint ({result.trimPaint.product.brand})</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="result-value">{result.trimPaint.litresNeeded} Litres</div>
                    <small style={{ color: 'var(--text-muted)' }}>£{result.trimPaint.cost.toFixed(2)}</small>
                  </div>
                </div>
              )}

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
              <div className="result-item">
                <span className="result-label" style={{ fontWeight: 600 }}>Total Estimated Cost</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-highlight">
                    £{result.totalEstimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {result.estimatedLaborCost && (
                <>
                  <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
                  <div className="result-item">
                    <span className="result-label" style={{ fontWeight: 600 }}>Professional Labor Estimate</span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="result-value" style={{ fontSize: '1rem' }}>
                        £{Math.round(result.estimatedLaborCost.min)} - £{Math.round(result.estimatedLaborCost.max)}
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>Based on approx £12-£20/m²</small>
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


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
  const [includePrimer, setIncludePrimer] = useState<boolean>(false);

  const [numDoors, setNumDoors] = useState<number | ''>(1);
  const [numWindows, setNumWindows] = useState<number | ''>(1);

  const [laborRate, setLaborRate] = useState<number>(16); // £/m²
  const [result, setResult] = useState<EstimationResult | null>(null);

  // Price Search State
  const [isSearching, setIsSearching] = useState(false);
  const [priceResults, setPriceResults] = useState<any[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    const wallProduct = getProductById(wallProductId);
    const trimProduct = includeTrim ? getProductById(trimProductId) : null;
    const primerProduct = includePrimer ? getProductById('trim_primer') : null;

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
      laborRate,
      includePrimer,
      primerProduct || null
    );
    setResult(res);
  }, [width, length, height, customWallArea, inputMode, wallProductId, trimProductId, coats, numDoors, numWindows, includeCeiling, includeTrim, laborRate, includePrimer]);

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

  const handleSearchPrices = async (manualLocation?: string) => {
    // Determine search query based on selected product
    const wallProduct = getProductById(wallProductId);
    if (!wallProduct) return;

    // Use manual location if provided (from "Update" button), otherwise use state
    const loc = manualLocation !== undefined ? manualLocation : locationInput;

    const query = `${wallProduct.brand} ${wallProduct.name} paint`;
    setIsSearching(true);
    setPriceResults([]);
    setShowPriceModal(true);

    try {
      let url = `/api/search-prices?query=${encodeURIComponent(query)}`;
      if (loc.trim()) {
        url += `&location=${encodeURIComponent(loc.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setPriceResults(data.results);
      }
    } catch (err) {
      console.error("Failed to fetch prices", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPrice = (priceStr: string) => {
    // Extract number from string like "£42.00"
    const cost = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(cost) && result) {
      // Note: This is a visual override for the user. In a real app we'd update the context/product data.
      // For this estimator, we'll just allow them to see the comparison for now.
      alert(`Selected price: £${cost}. (Note: To use this exact price in calculation, further backend updates are needed. Keeping original estimate for now.)`);
    }
    setShowPriceModal(false);
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
        <header className="header-hero">
          <h1>Paint Material Estimator</h1>
          <p>Get a quick estimate for your DIY painting project (UK Standards)</p>
        </header>

        <div className="card">
          {/* Mode Toggle */}
          {/* Mode Toggle */}
          <div className="toggle-group">
            <button
              onClick={() => setInputMode('dimensions')}
              className={`btn-toggle ${inputMode === 'dimensions' ? 'active' : ''}`}
            >
              By Dimensions
            </button>
            <button
              onClick={() => setInputMode('area')}
              className={`btn-toggle ${inputMode === 'area' ? 'active' : ''}`}
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

            {includeTrim && (
              <label className="checkbox-visual" style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={includePrimer}
                  onChange={(e) => setIncludePrimer(e.target.checked)}
                />
                Include Primer/Undercoat
              </label>
            )}
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
              <small className="deductions-note">
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

              {result.primerPaint && (
                <div className="result-item" style={{ marginTop: '1rem' }}>
                  <div>
                    <span className="result-label">Primer/Undercoat</span>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {result.primerPaint.litresNeeded} Litres required
                    </div>
                  </div>
                  <div className="result-value">£{result.primerPaint.cost.toFixed(2)}</div>
                </div>
              )}

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              <div className="result-item" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total Materials Cost</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-highlight">
                    £{result.totalEstimatedCost.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleSearchPrices()}
                    style={{
                      fontSize: '0.8rem',
                      marginTop: '0.5rem',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Find Real Prices
                  </button>
                </div>
              </div>

              {/* Price Search Modal (Inline) */}
              {showPriceModal && (
                <div style={{
                  marginTop: '1rem',
                  background: 'white',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primary-light)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Current Online Prices</h4>
                    <button
                      onClick={() => setShowPriceModal(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        lineHeight: 1,
                        padding: '0 4px'
                      }}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Location Input */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Postcode or City (e.g. London)"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '0.9rem'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchPrices(locationInput);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSearchPrices(locationInput)}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Update
                    </button>
                  </div>

                  {isSearching ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>🔍</span> Searching...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {priceResults.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No results found via Google Shopping.</div>
                      ) : (
                        priceResults.map((item, idx) => (
                          <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              background: 'var(--surface-1)',
                              padding: '10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(0,0,0,0.03)',
                              textDecoration: 'none', // Remove underline
                              color: 'inherit', // Inherit text color
                              transition: 'transform 0.1s ease, background 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--surface-2)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--surface-1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'white', borderRadius: '4px', padding: '2px' }} />
                            ) : (
                              <div style={{ width: '48px', height: '48px', background: '#eee', borderRadius: '4px' }}></div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.2' }}>{item.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.source} ↗</div>
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{item.price}</div>
                          </a>
                        ))
                      )}
                      {priceResults.length > 0 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: '0.5rem',
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                          paddingTop: '0.5rem'
                        }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            Prices provided by SerpApi
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {result.estimatedLaborCost && (
                <>
                  <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
                  <div className="result-item" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <span className="result-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Professional Labor Estimate</span>

                      {/* Interactive Labor Rate Control */}
                      <div className="labor-control-panel">
                        <label className="labor-header">
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
                        />
                        <div className="range-labels">
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

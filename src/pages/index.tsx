
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { calculatePaintEstimate, EstimationResult } from '../utils/calculator';
import { SUPPLIER_DATA, PaintProduct, getProductById } from '../utils/supplier_data';

interface Room {
  id: string;
  name: string;
  type: string;
  inputMode: 'dimensions' | 'area';
  customWallArea: number | '';
  width: number | '';
  length: number | '';
  height: number | '';
  wallProductId: string;
  trimProductId: string;
  coats: number;
  includeCeiling: boolean;
  includeTrim: boolean;
  includePrimer: boolean;
  numDoors: number | '';
  numWindows: number | '';
  laborRate: number;
  result: EstimationResult | null;
}

const ROOM_TYPES = [
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'living', label: 'Living Room', icon: '🛋️' },
  { id: 'dining', label: 'Dining Room', icon: '🍽️' },
  { id: 'bathroom', label: 'Bathroom', icon: '🛁' },
  { id: 'hallway', label: 'Hallway', icon: '🚪' },
  { id: 'other', label: 'Other', icon: '🏠' },
];

export default function Home() {
  const wallProducts = SUPPLIER_DATA.filter(p => p.type === 'wall');
  const trimProducts = SUPPLIER_DATA.filter(p => p.type === 'trim');

  // Multi-room state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'room-picker' | 'editor'>('dashboard');

  const activeRoom = rooms.find(r => r.id === activeRoomId) || null;

  // Price Search State (Global for simplicity, or could be per room)
  const [isSearching, setIsSearching] = useState(false);
  const [priceResults, setPriceResults] = useState<any[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    if (!activeRoom) return;

    const wallProduct = getProductById(activeRoom.wallProductId);
    const trimProduct = activeRoom.includeTrim ? getProductById(activeRoom.trimProductId) : null;
    const primerProduct = activeRoom.includePrimer ? getProductById('trim_primer') : null;

    if (!wallProduct) return;

    let dimensions: any = null;
    if (activeRoom.inputMode === 'dimensions') {
      if (activeRoom.width === '' || activeRoom.length === '' || activeRoom.height === '') return;
      dimensions = { width: Number(activeRoom.width), length: Number(activeRoom.length), height: Number(activeRoom.height) };
    } else {
      if (activeRoom.customWallArea === '') return;
      dimensions = { totalWallArea: Number(activeRoom.customWallArea) };
    }

    const res = calculatePaintEstimate(
      dimensions,
      wallProduct,
      trimProduct || null,
      activeRoom.coats,
      activeRoom.numDoors === '' ? 0 : activeRoom.numDoors,
      activeRoom.numWindows === '' ? 0 : activeRoom.numWindows,
      activeRoom.inputMode === 'dimensions' ? activeRoom.includeCeiling : false,
      activeRoom.laborRate,
      activeRoom.includePrimer,
      primerProduct || null
    );

    setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, result: res } : r));
  }, [
    activeRoom?.width,
    activeRoom?.length,
    activeRoom?.height,
    activeRoom?.customWallArea,
    activeRoom?.inputMode,
    activeRoom?.wallProductId,
    activeRoom?.trimProductId,
    activeRoom?.coats,
    activeRoom?.numDoors,
    activeRoom?.numWindows,
    activeRoom?.includeCeiling,
    activeRoom?.includeTrim,
    activeRoom?.includePrimer,
    activeRoomId
  ]);

  const updateActiveRoom = (updates: Partial<Room>) => {
    if (!activeRoomId) return;
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
  };

  const addRoom = (typeId: string) => {
    const type = ROOM_TYPES.find(t => t.id === typeId);
    let roomName = type?.label || 'New Room';

    if (typeId === 'other') {
      const customName = window.prompt('Enter room name:', 'Other');
      if (customName !== null && customName.trim() !== '') {
        roomName = customName.trim();
      }
    }

    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: roomName,
      type: typeId,
      inputMode: 'dimensions',
      customWallArea: '',
      width: '',
      length: '',
      height: '',
      wallProductId: wallProducts[0].id,
      trimProductId: trimProducts[0].id,
      coats: 2,
      includeCeiling: true,
      includeTrim: true,
      includePrimer: false,
      numDoors: 1,
      numWindows: 1,
      laborRate: 16,
      result: null,
    };
    setRooms(prev => [...prev, newRoom]);
    setActiveRoomId(newRoom.id);
    setViewMode('editor');
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    if (activeRoomId === id) setActiveRoomId(null);
  };

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
    if (!activeRoom) return;
    const wallProduct = getProductById(activeRoom.wallProductId);
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
    const cost = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(cost) && activeRoom?.result) {
      alert(`Selected price: £${cost}. (Note: To use this exact price in calculation, further backend updates are needed. Keeping original estimate for now.)`);
    }
    setShowPriceModal(false);
  };

  if (viewMode === 'dashboard') {
    const totalMaterials = rooms.reduce((sum, r) => sum + (r.result?.totalEstimatedCost || 0), 0);
    const totalLabor = rooms.reduce((sum, r) => sum + (r.result?.preciseLaborCost || 0), 0);
    const grandTotal = totalMaterials + totalLabor;

    return (
      <main>
        <header className="header-hero">
          <h1>OPC Painting Estimator</h1>
          <p>Project Dashboard - Manage your room estimates</p>
        </header>

        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="label">Project Total</div>
            <div className="value price-highlight">£{grandTotal.toFixed(2)}</div>
          </div>
          <div className="summary-details">
            <div>Materials: £{totalMaterials.toFixed(2)}</div>
            <div>Labour: £{totalLabor.toFixed(2)}</div>
          </div>
        </div>

        <div className="room-grid">
          {rooms.map(room => (
            <div key={room.id} className="room-card" onClick={() => { setActiveRoomId(room.id); setViewMode('editor'); }}>
              <div className="room-icon">{ROOM_TYPES.find(t => t.id === room.type)?.icon}</div>
              <div className="room-info">
                <h3>{room.name}</h3>
                <div className="room-price">£{((room.result?.totalEstimatedCost || 0) + (room.result?.preciseLaborCost || 0)).toFixed(2)}</div>
              </div>
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}>✕</button>
            </div>
          ))}
          <button className="btn-add-room" onClick={() => setViewMode('room-picker')}>
            <span>+</span>
            <div>Add Room</div>
          </button>
        </div>
      </main>
    );
  }

  if (viewMode === 'room-picker') {
    return (
      <main>
        <header className="header-hero">
          <button className="btn-back" onClick={() => setViewMode('dashboard')}>← Back to Dashboard</button>
          <h1>Select Room Type</h1>
          <p>What room are you estimating?</p>
        </header>
        <div className="room-type-grid">
          {ROOM_TYPES.map(type => (
            <button key={type.id} className="type-card" onClick={() => addRoom(type.id)}>
              <span className="type-icon">{type.icon}</span>
              <span className="type-label">{type.label}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (!activeRoom) {
    setViewMode('dashboard');
    return null;
  }

  return (
    <>
      <Head>
        <title>OPC Painting Estimator</title>
        <meta name="description" content="Calculate paint material costs for your room" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <header className="header-hero">
          <button className="btn-back" onClick={() => setViewMode('dashboard')}>← Back to Dashboard</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <input
              type="text"
              value={activeRoom.name}
              onChange={(e) => updateActiveRoom({ name: e.target.value })}
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px dashed rgba(66, 133, 244, 0.3)',
                color: 'var(--primary)',
                width: '100%',
                maxWidth: '600px',
                padding: '0 0.5rem',
                outline: 'none',
                letterSpacing: '-0.02em'
              }}
              title="Click to rename room"
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Adjust dimensions and materials for this room.</p>
            {activeRoom.result && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'rgba(66, 133, 244, 0.1)',
                borderRadius: '50px',
                border: '1px solid rgba(66, 133, 244, 0.2)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Total Estimate:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  £{((activeRoom.result?.totalEstimatedCost || 0) + (activeRoom.result?.preciseLaborCost || 0)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="card">
          <div className="toggle-group">
            <button
              onClick={() => updateActiveRoom({ inputMode: 'dimensions' })}
              className={`btn-toggle ${activeRoom.inputMode === 'dimensions' ? 'active' : ''}`}
            >
              By Dimensions
            </button>
            <button
              onClick={() => updateActiveRoom({ inputMode: 'area' })}
              className={`btn-toggle ${activeRoom.inputMode === 'area' ? 'active' : ''}`}
            >
              By Total Area
            </button>
          </div>

          <div className="input-group">
            <label>
              {activeRoom.inputMode === 'dimensions' ? 'Room Dimensions (Meters)' : 'Total Wall Area (sq meters)'}
            </label>

            {activeRoom.inputMode === 'dimensions' ? (
              <div className="input-row">
                <div className="dimension-field">
                  <span className="field-label">Length</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={activeRoom.length}
                    onChange={(e) => updateActiveRoom({ length: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="dimension-field">
                  <span className="field-label">Width</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={activeRoom.width}
                    onChange={(e) => updateActiveRoom({ width: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="dimension-field">
                  <span className="field-label">Height</span>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={activeRoom.height}
                    onChange={(e) => updateActiveRoom({ height: e.target.value === '' ? '' : parseFloat(e.target.value) })}
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
                    value={activeRoom.customWallArea}
                    onChange={(e) => updateActiveRoom({ customWallArea: e.target.value === '' ? '' : parseFloat(e.target.value) })}
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
              <select value={activeRoom.wallProductId} onChange={(e) => updateActiveRoom({ wallProductId: e.target.value })}>
                {wallProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} - {p.name} (£{p.pricePerLitre.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Number of Coats</label>
              <select value={activeRoom.coats} onChange={(e) => updateActiveRoom({ coats: Number(e.target.value) })}>
                <option value="1">1 Coat</option>
                <option value="2">2 Coats (Recommended)</option>
                <option value="3">3 Coats</option>
              </select>
            </div>
          </div>

          <div className="checkbox-group">
            {activeRoom.inputMode === 'dimensions' && (
              <label className="checkbox-visual">
                <input
                  type="checkbox"
                  checked={activeRoom.includeCeiling}
                  onChange={(e) => updateActiveRoom({ includeCeiling: e.target.checked })}
                />
                Include Ceiling (Same as Wall)
              </label>
            )}
            <label className="checkbox-visual">
              <input
                type="checkbox"
                checked={activeRoom.includeTrim}
                onChange={(e) => updateActiveRoom({ includeTrim: e.target.checked })}
              />
              Include Trim/Baseboards
            </label>

            {activeRoom.includeTrim && (
              <label className="checkbox-visual" style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={activeRoom.includePrimer}
                  onChange={(e) => updateActiveRoom({ includePrimer: e.target.checked })}
                />
                Include Primer/Undercoat
              </label>
            )}
          </div>

          {activeRoom.includeTrim && (
            <div className="input-group" style={{ marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
              <label>Trim Paint</label>
              <select value={activeRoom.trimProductId} onChange={(e) => updateActiveRoom({ trimProductId: e.target.value })}>
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
                  value={activeRoom.numDoors}
                  placeholder="0"
                  onChange={(e) => updateActiveRoom({ numDoors: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="dimension-field">
                <span className="field-label">Windows (approx 1.5m²)</span>
                <input
                  type="number"
                  value={activeRoom.numWindows}
                  placeholder="0"
                  onChange={(e) => updateActiveRoom({ numWindows: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
            {activeRoom.inputMode === 'area' && (
              <small className="deductions-note">
                * Deductions are subtracted from your total area input above.
              </small>
            )}
          </div>

          {activeRoom.result && (
            <div style={{ marginTop: '2rem', background: 'var(--surface-2)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div className="result-item">
                <span className="result-label">Net Wall Area (Paintable)</span>
                <span className="result-value">{activeRoom.result.paintableArea.toFixed(1)} m²</span>
              </div>

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              <div className="result-item">
                <div>
                  <span className="result-label">Wall Paint ({activeRoom.coats} coats)</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {activeRoom.result.wallPaint.litresNeeded} Litres required
                  </div>
                </div>
                <div className="result-value">£{activeRoom.result.wallPaint.cost.toFixed(2)}</div>
              </div>

              {activeRoom.result.trimPaint && (
                <div className="result-item" style={{ marginTop: '1rem' }}>
                  <div>
                    <span className="result-label">Trim Paint</span>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {activeRoom.result.trimPaint.litresNeeded} Litres required
                    </div>
                  </div>
                  <div className="result-value">£{activeRoom.result.trimPaint.cost.toFixed(2)}</div>
                </div>
              )}

              {activeRoom.result.primerPaint && (
                <div className="result-item" style={{ marginTop: '1rem' }}>
                  <div>
                    <span className="result-label">Primer/Undercoat</span>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {activeRoom.result.primerPaint.litresNeeded} Litres required
                    </div>
                  </div>
                  <div className="result-value">£{activeRoom.result.primerPaint.cost.toFixed(2)}</div>
                </div>
              )}

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              <div className="result-item" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total Materials Cost</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-highlight">
                    £{activeRoom.result.totalEstimatedCost.toFixed(2)}
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
                      Searching...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {priceResults.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No results found.</div>
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
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                          >
                            {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.source}</div>
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{item.price}</div>
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeRoom.result.estimatedLaborCost && (
                <>
                  <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
                  <div className="result-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div>
                      <span className="result-label" style={{ fontWeight: 600, display: 'block' }}>Labour effort required</span>
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                        Less prep less cost, more prep more cost
                      </small>

                      <div className="labor-control-panel">
                        <label className="labor-header">
                          <span>Adjust Preparation Effort:</span>
                          <strong>£{activeRoom.laborRate}/m²</strong>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="40"
                          step="1"
                          value={activeRoom.laborRate}
                          onChange={(e) => updateActiveRoom({ laborRate: Number(e.target.value) })}
                        />
                        <div className="range-labels">
                          <span>£10 (Min Preparation)</span>
                          <span>£40 (Extensive Prep)</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'left', marginTop: '1rem', borderTop: '1px solid var(--surface-1)', paddingTop: '1rem' }}>
                      <div className="result-value" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                        £{Math.round(activeRoom.result.preciseLaborCost)}
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>Typical range: £{Math.round(activeRoom.result.estimatedLaborCost.min)} - £{Math.round(activeRoom.result.estimatedLaborCost.max)}</small>
                    </div>
                  </div>
                </>
              )}
              <p className="disclaimer">*Prices are feed via test API, actual prices may vary.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

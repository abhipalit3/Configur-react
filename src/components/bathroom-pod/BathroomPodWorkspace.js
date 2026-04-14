/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useMemo, useRef, useState } from 'react'
import BathroomPodPreview3D from './BathroomPodPreview3D'
import {
  BATHROOM_POD_MAX_SEGMENTS,
  bathroomPodFixtureTypes,
  bathroomPodFinishTypes,
  bathroomPodStructuralTypes,
  bathroomPodTemplates,
  createBathroomPodFixture,
  createBathroomPodFromTemplate,
  feetToInches,
  inchesToFeetInches,
  formatInchesAsFeet
} from '../../types/bathroomPod'
import {
  distance,
  getDrainFixture,
  getEdgeLength,
  getFixtureCounts,
  getPointAlongEdge,
  getPolygonBounds,
  getRotatedBoxCorners,
  getWallSegmentsWithDoor,
  isPointInsidePolygon,
  validateBathroomPodLayout,
  validateDoorOpening,
  wouldCreateSelfIntersection
} from '../../utils/bathroomPodGeometry'

import './bathroom-pod.css'

const clampNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const makePodUpdate = (pod, changes) => ({
  ...pod,
  ...changes,
  updatedAt: new Date().toISOString()
})

const DimensionInput = ({ label, value, onChange }) => {
  const feetInches = inchesToFeetInches(value)
  return (
    <label className="bathroom-pod-field">
      <span>{label}</span>
      <div className="bathroom-pod-feet-inches">
        <input
          type="number"
          min="0"
          value={feetInches.feet}
          onChange={(event) => onChange(feetToInches(event.target.value, feetInches.inches))}
        />
        <span>ft</span>
        <input
          type="number"
          min="0"
          max="11"
          value={feetInches.inches}
          onChange={(event) => onChange(feetToInches(feetInches.feet, event.target.value))}
        />
        <span>in</span>
      </div>
    </label>
  )
}

export default function BathroomPodWorkspace({ podData, onChange }) {
  const svgRef = useRef(null)
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState(0)
  const [selectedVertexIndex, setSelectedVertexIndex] = useState(null)
  const [selectedFixtureId, setSelectedFixtureId] = useState(null)
  const [fixtureType, setFixtureType] = useState('toilet')
  const [placingFixture, setPlacingFixture] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [draftPoints, setDraftPoints] = useState([])
  const [dragState, setDragState] = useState(null)
  const [message, setMessage] = useState('')

  const pod = podData || createBathroomPodFromTemplate('standard')
  const layout = pod.layout || []
  const validation = useMemo(() => validateBathroomPodLayout(pod), [pod])
  const doorValidation = useMemo(() => validateDoorOpening(pod), [pod])
  const fixtureCounts = useMemo(() => getFixtureCounts(pod.fixtures || []), [pod.fixtures])
  const drain = getDrainFixture(pod.fixtures || [])
  const slopeCorners = drain ? getRotatedBoxCorners(drain, pod.slopeBox.width, pod.slopeBox.length, pod.slopeBox.rotation) : []
  const bounds = getPolygonBounds(drawing && draftPoints.length ? draftPoints : layout)
  const margin = 48
  const viewBox = `${bounds.minX - margin} ${bounds.minY - margin} ${Math.max(bounds.width, 96) + margin * 2} ${Math.max(bounds.height, 96) + margin * 2}`
  const wallSegments = getWallSegmentsWithDoor(layout, doorValidation.valid ? pod.doorway : null)
  const selectedEdgeLength = getEdgeLength(layout, selectedEdgeIndex)

  const updatePod = (changes) => {
    onChange(makePodUpdate(pod, changes))
  }

  const updateNested = (key, changes) => {
    updatePod({
      [key]: {
        ...pod[key],
        ...changes
      }
    })
  }

  const updateSlopeBox = (changes) => {
    const nextPod = makePodUpdate(pod, {
      slopeBox: {
        ...pod.slopeBox,
        ...changes
      }
    })
    const result = validateBathroomPodLayout(nextPod)
    if (!result.valid && result.errors.some(error => error.includes('GFRC slope box'))) {
      setMessage('GFRC slope box must stay inside the pod layout.')
      return
    }
    onChange(nextPod)
  }

  const getSvgPoint = (event) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse())
    return {
      x: Math.round(transformed.x * 10) / 10,
      y: Math.round(transformed.y * 10) / 10
    }
  }

  const applyTemplate = (templateId) => {
    const nextPod = createBathroomPodFromTemplate(templateId)
    onChange({
      ...nextPod,
      id: pod.id,
      name: pod.name || nextPod.name
    })
    setSelectedEdgeIndex(0)
    setSelectedVertexIndex(null)
    setSelectedFixtureId(null)
    setMessage(`Loaded ${nextPod.name}.`)
  }

  const startDrawing = () => {
    setDrawing(true)
    setDraftPoints([])
    setMessage('Click plan points. Click near the first point to close the loop.')
  }

  const finishDrawing = (points) => {
    const draftPod = makePodUpdate(pod, {
      templateId: 'custom',
      layout: points,
      doorway: { ...pod.doorway, edgeIndex: 0, offset: 0 },
      coveEdgeIndex: Math.min(pod.coveEdgeIndex || 0, points.length - 1),
      fixtures: (pod.fixtures || []).filter(fixture => isPointInsidePolygon(fixture, points))
    })
    const result = validateBathroomPodLayout(draftPod)
    if (!result.valid) {
      setMessage(result.errors[0])
      return
    }
    setDrawing(false)
    setDraftPoints([])
    setSelectedEdgeIndex(0)
    onChange(draftPod)
    setMessage('Custom pod layout closed.')
  }

  const handleCanvasClick = (event) => {
    const point = getSvgPoint(event)

    if (drawing) {
      if (draftPoints.length >= 3 && distance(point, draftPoints[0]) <= 8) {
        if (wouldCreateSelfIntersection(draftPoints, draftPoints[0], true)) {
          setMessage('Closing this loop would create a self-intersection.')
          return
        }
        finishDrawing(draftPoints)
        return
      }

      if (draftPoints.length >= BATHROOM_POD_MAX_SEGMENTS) {
        setMessage(`Bathroom pod layouts can have at most ${BATHROOM_POD_MAX_SEGMENTS} segments.`)
        return
      }

      if (draftPoints.length > 1 && wouldCreateSelfIntersection(draftPoints, point)) {
        setMessage('That segment would cross another segment.')
        return
      }

      setDraftPoints([...draftPoints, point])
      return
    }

    if (placingFixture) {
      if (!isPointInsidePolygon(point, layout)) {
        setMessage('Fixture markers must be inside the pod.')
        return
      }
      const nextFixture = createBathroomPodFixture(fixtureType, point.x, point.y)
      const fixtures = fixtureType === 'drain'
        ? [...(pod.fixtures || []).filter(fixture => fixture.type !== 'drain'), nextFixture]
        : [...(pod.fixtures || []), nextFixture]
      updatePod({ fixtures })
      setSelectedFixtureId(nextFixture.id)
      setPlacingFixture(false)
      setMessage(`${nextFixture.label} placed.`)
    }
  }

  const handleMouseMove = (event) => {
    if (!dragState) return
    const point = getSvgPoint(event)

    if (dragState.type === 'vertex') {
      const nextLayout = layout.map((vertex, index) => (
        index === dragState.index ? point : vertex
      ))
      const draftPod = makePodUpdate(pod, { layout: nextLayout })
      const result = validateBathroomPodLayout(draftPod)
      if (result.valid) onChange(draftPod)
      return
    }

    if (dragState.type === 'fixture') {
      if (!isPointInsidePolygon(point, layout)) return
      const fixtures = (pod.fixtures || []).map(fixture => (
        fixture.id === dragState.id ? { ...fixture, x: point.x, y: point.y } : fixture
      ))
      const draftPod = makePodUpdate(pod, { fixtures })
      const result = validateBathroomPodLayout(draftPod)
      if (result.valid) onChange(draftPod)
    }
  }

  const insertVertexOnSelectedEdge = () => {
    if (layout.length >= BATHROOM_POD_MAX_SEGMENTS) {
      setMessage(`Bathroom pod layouts can have at most ${BATHROOM_POD_MAX_SEGMENTS} segments.`)
      return
    }
    const midpoint = getPointAlongEdge(layout, selectedEdgeIndex, selectedEdgeLength / 2)
    const nextLayout = [
      ...layout.slice(0, selectedEdgeIndex + 1),
      midpoint,
      ...layout.slice(selectedEdgeIndex + 1)
    ]
    updatePod({ layout: nextLayout })
    setSelectedVertexIndex(selectedEdgeIndex + 1)
  }

  const removeSelectedVertex = () => {
    if (selectedVertexIndex === null) return
    if (layout.length <= 3) {
      setMessage('A closed pod layout needs at least 3 segments.')
      return
    }
    const nextLayout = layout.filter((_, index) => index !== selectedVertexIndex)
    const draftPod = makePodUpdate(pod, {
      layout: nextLayout,
      doorway: { ...pod.doorway, edgeIndex: Math.min(pod.doorway.edgeIndex, nextLayout.length - 1) },
      coveEdgeIndex: Math.min(pod.coveEdgeIndex, nextLayout.length - 1)
    })
    const result = validateBathroomPodLayout(draftPod)
    if (!result.valid) {
      setMessage(result.errors[0])
      return
    }
    onChange(draftPod)
    setSelectedVertexIndex(null)
  }

  const deleteSelectedFixture = () => {
    if (!selectedFixtureId) return
    const fixture = (pod.fixtures || []).find(item => item.id === selectedFixtureId)
    if (fixture?.type === 'drain') {
      setMessage('Bathroom pods require one drain marker.')
      return
    }
    updatePod({
      fixtures: (pod.fixtures || []).filter(item => item.id !== selectedFixtureId)
    })
    setSelectedFixtureId(null)
  }

  const updateDoorway = (changes) => {
    updateNested('doorway', changes)
  }

  const edgeOptions = layout.map((_, index) => (
    <option key={index} value={index}>Segment {index + 1}</option>
  ))

  return (
    <div className="bathroom-pod-workspace">
      <div className="bathroom-pod-control-panel">
        <div className="bathroom-pod-panel-heading">
          <h2>Bathroom Pod</h2>
          <span>{validation.valid ? 'Valid layout' : 'Needs attention'}</span>
        </div>

        <label className="bathroom-pod-field">
          <span>Template</span>
          <select value={pod.templateId || 'custom'} onChange={(event) => applyTemplate(event.target.value)}>
            {pod.templateId === 'custom' && <option value="custom">Custom</option>}
            {bathroomPodTemplates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </label>

        <div className="bathroom-pod-button-row">
          <button type="button" onClick={startDrawing}>Draw New Loop</button>
          <button type="button" onClick={insertVertexOnSelectedEdge}>Add Vertex</button>
          <button type="button" onClick={removeSelectedVertex}>Remove Vertex</button>
        </div>

        <DimensionInput
          label="Bottom to Top of Pod"
          value={pod.heights?.overall || 108}
          onChange={(value) => updateNested('heights', { overall: value })}
        />
        <DimensionInput
          label="Top of Floor Finish to Bottom of Ceiling Finish"
          value={pod.heights?.clear || 96}
          onChange={(value) => updateNested('heights', { clear: value })}
        />

        <label className="bathroom-pod-field">
          <span>Structural Type</span>
          <select value={pod.structuralType} onChange={(event) => updatePod({ structuralType: event.target.value })}>
            {bathroomPodStructuralTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>

        <label className="bathroom-pod-field">
          <span>FF&E / Finish</span>
          <select value={pod.finishType} onChange={(event) => updatePod({ finishType: event.target.value })}>
            {bathroomPodFinishTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>

        <div className="bathroom-pod-section-title">Doorway Knockout</div>
        <label className="bathroom-pod-field">
          <span>Door Segment</span>
          <select
            value={pod.doorway.edgeIndex}
            onChange={(event) => {
              const edgeIndex = parseInt(event.target.value, 10)
              setSelectedEdgeIndex(edgeIndex)
              updateDoorway({ edgeIndex })
            }}
          >
            {edgeOptions}
          </select>
        </label>
        <div className="bathroom-pod-grid-3">
          <label>
            <span>Offset</span>
            <input type="number" min="0" value={pod.doorway.offset} onChange={(event) => updateDoorway({ offset: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Width</span>
            <input type="number" min="1" value={pod.doorway.width} onChange={(event) => updateDoorway({ width: clampNumber(event.target.value, 1) })} />
          </label>
          <label>
            <span>Height</span>
            <input type="number" min="1" value={pod.doorway.height} onChange={(event) => updateDoorway({ height: clampNumber(event.target.value, 1) })} />
          </label>
        </div>

        <div className="bathroom-pod-section-title">Shower Cove</div>
        <label className="bathroom-pod-field">
          <span>Cove Segment</span>
          <select value={pod.coveEdgeIndex} onChange={(event) => updatePod({ coveEdgeIndex: parseInt(event.target.value, 10) })}>
            {edgeOptions}
          </select>
        </label>
        <button type="button" className="bathroom-pod-secondary-button" onClick={() => updatePod({ coveEdgeIndex: selectedEdgeIndex })}>
          Mark Selected Segment as Cove
        </button>

        <div className="bathroom-pod-section-title">Drain and GFRC Slope</div>
        <div className="bathroom-pod-grid-3">
          <label>
            <span>Width</span>
            <input type="number" min="1" value={pod.slopeBox.width} onChange={(event) => updateSlopeBox({ width: clampNumber(event.target.value, 1) })} />
          </label>
          <label>
            <span>Length</span>
            <input type="number" min="1" value={pod.slopeBox.length} onChange={(event) => updateSlopeBox({ length: clampNumber(event.target.value, 1) })} />
          </label>
          <label>
            <span>Depth</span>
            <input type="number" min="0" step="0.25" value={pod.slopeBox.depth} onChange={(event) => updateSlopeBox({ depth: clampNumber(event.target.value, 0) })} />
          </label>
        </div>
        <label className="bathroom-pod-field">
          <span>Box Rotation</span>
          <input type="number" value={pod.slopeBox.rotation} onChange={(event) => updateSlopeBox({ rotation: clampNumber(event.target.value, 0) })} />
        </label>

        <div className="bathroom-pod-section-title">Fixture Markers</div>
        <div className="bathroom-pod-fixture-row">
          <select value={fixtureType} onChange={(event) => setFixtureType(event.target.value)}>
            {bathroomPodFixtureTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => setPlacingFixture(true)}>
            {placingFixture ? 'Click Plan' : 'Place Fixture'}
          </button>
          <button type="button" onClick={deleteSelectedFixture}>Delete</button>
        </div>

        <div className="bathroom-pod-data-display">
          <div><span>Segments</span><strong>{layout.length} / {BATHROOM_POD_MAX_SEGMENTS}</strong></div>
          <div><span>GFRC slope depth</span><strong>{pod.slopeBox.depth}"</strong></div>
          <div><span>Fixtures</span><strong>{fixtureCounts.total || 0}</strong></div>
          <div><span>Finish</span><strong>{pod.finishType === 'tile' ? 'Tile' : 'Future Finish'}</strong></div>
          <div><span>Pod height</span><strong>{formatInchesAsFeet(pod.heights?.overall || 108)}</strong></div>
          <div><span>Clear height</span><strong>{formatInchesAsFeet(pod.heights?.clear || 96)}</strong></div>
        </div>

        <div className="bathroom-pod-counts">
          {bathroomPodFixtureTypes.map(type => (
            <span key={type.value}>{type.label}: {fixtureCounts[type.value] || 0}</span>
          ))}
        </div>

        {(!validation.valid || !doorValidation.valid || message) && (
          <div className={`bathroom-pod-message ${validation.valid && doorValidation.valid ? 'info' : 'error'}`}>
            {!validation.valid ? validation.errors[0] : (!doorValidation.valid ? doorValidation.message : message)}
          </div>
        )}
      </div>

      <div className="bathroom-pod-split">
        <div className="bathroom-pod-plan-shell">
          <div className="bathroom-pod-pane-heading">
            <span>2D Pod Layout</span>
            <span>{drawing ? `${draftPoints.length} draft points` : `${layout.length} closed segments`}</span>
          </div>
          <svg
            ref={svgRef}
            className="bathroom-pod-plan"
            viewBox={viewBox}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragState(null)}
            onMouseLeave={() => setDragState(null)}
          >
            <defs>
              <pattern id="pod-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#dbe4ee" strokeWidth="0.7" />
              </pattern>
            </defs>
            <rect x={bounds.minX - margin} y={bounds.minY - margin} width={Math.max(bounds.width, 96) + margin * 2} height={Math.max(bounds.height, 96) + margin * 2} fill="url(#pod-grid)" />

            {!drawing && (
              <>
                <polygon points={layout.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-floor-fill" />
                {wallSegments.filter(segment => segment.type === 'wall').map((segment, index) => (
                  <line
                    key={`${segment.edgeIndex}-${index}`}
                    x1={segment.start.x}
                    y1={segment.start.y}
                    x2={segment.end.x}
                    y2={segment.end.y}
                    className={`bathroom-pod-wall-line ${segment.edgeIndex === pod.coveEdgeIndex ? 'cove' : ''}`}
                  />
                ))}
                {wallSegments.filter(segment => segment.type === 'door').map((segment, index) => (
                  <line
                    key={`door-${index}`}
                    x1={segment.start.x}
                    y1={segment.start.y}
                    x2={segment.end.x}
                    y2={segment.end.y}
                    className="bathroom-pod-door-line"
                  />
                ))}
                {layout.map((point, index) => {
                  const next = layout[(index + 1) % layout.length]
                  return (
                    <line
                      key={`edge-hit-${index}`}
                      x1={point.x}
                      y1={point.y}
                      x2={next.x}
                      y2={next.y}
                      className={`bathroom-pod-edge-hit ${selectedEdgeIndex === index ? 'selected' : ''}`}
                      onClick={(event) => {
                      event.stopPropagation()
                      setSelectedEdgeIndex(index)
                      updateDoorway({ edgeIndex: index })
                      setSelectedVertexIndex(null)
                    }}
                    />
                  )
                })}
                {slopeCorners.length > 0 && (
                  <polygon points={slopeCorners.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-slope-box" />
                )}
                {(pod.fixtures || []).map(fixture => {
                  const fixtureTypeInfo = bathroomPodFixtureTypes.find(type => type.value === fixture.type)
                  return (
                    <g
                      key={fixture.id}
                      className={`bathroom-pod-fixture ${selectedFixtureId === fixture.id ? 'selected' : ''}`}
                      onMouseDown={(event) => {
                        event.stopPropagation()
                        setSelectedFixtureId(fixture.id)
                        setDragState({ type: 'fixture', id: fixture.id })
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <circle cx={fixture.x} cy={fixture.y} r={fixture.type === 'drain' ? 4 : 6} fill={fixtureTypeInfo?.color || '#64748b'} />
                      <text x={fixture.x + 8} y={fixture.y - 8}>{fixtureTypeInfo?.label || fixture.type}</text>
                    </g>
                  )
                })}
                {layout.map((point, index) => (
                  <circle
                    key={`vertex-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    className={`bathroom-pod-vertex ${selectedVertexIndex === index ? 'selected' : ''}`}
                    onMouseDown={(event) => {
                      event.stopPropagation()
                      setSelectedVertexIndex(index)
                      setSelectedEdgeIndex(index)
                      setDragState({ type: 'vertex', index })
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                ))}
              </>
            )}

            {drawing && (
              <>
                {draftPoints.length > 1 && (
                  <polyline points={draftPoints.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-draft-line" />
                )}
                {draftPoints.map((point, index) => (
                  <circle key={`draft-${index}`} cx={point.x} cy={point.y} r="5" className={index === 0 ? 'bathroom-pod-draft-start' : 'bathroom-pod-vertex'} />
                ))}
              </>
            )}
          </svg>
        </div>

        <BathroomPodPreview3D pod={pod} />
      </div>
    </div>
  )
}

/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  formatInchesAsFeet,
  inchesToFeetInches
} from '../../types/bathroomPod'
import {
  createBathroomPodFromImportedType,
  createBathroomPodTypeFromImport,
  parseBathroomPodDxf
} from '../../utils/bathroomPodDxf'
import {
  bathroomPodExportFormats
} from '../../utils/bathroomPodExport'
import {
  createBathroomPodPreconDefaults,
  deriveBathroomPodPrecon
} from '../../utils/bathroomPodPrecon'
import {
  distance,
  getDrainFixture,
  getEdgeLength,
  getFixtureCounts,
  getInsetPolygon,
  getPointAlongEdge,
  getPolygonBounds,
  getRotatedBoxCorners,
  getWallFacePolygons,
  getWallSegmentsWithDoor,
  isPointInsidePolygon,
  validateBathroomPodLayout,
  validateDoorOpening,
  wouldCreateSelfIntersection
} from '../../utils/bathroomPodGeometry'
import {
  getProjectManifest,
  saveBathroomPodImportBatch,
  updateBathroomPodProjectLocation,
  updateBathroomPodTypeCount
} from '../../utils/projectManifest'
import {
  getTemporaryState,
  updateUIState as updateTempUIState
} from '../../utils/temporaryState'
import {
  canUseLocalProjectDirectory,
  chooseLocalProjectDirectory,
  clearSelectedProjectDirectory,
  hasSelectedProjectDirectory,
  writeProjectFiles
} from '../../utils/localProjectFiles'

import './bathroom-pod.css'

const DEFAULT_COLLAPSED_SECTIONS = {
  podTypes: false,
  export: false,
  files: false,
  dimensions: false,
  structural: false,
  doorway: false,
  cove: true,
  slope: false,
  fixtures: false
}

const WALL_THICKNESS_INCHES = 6
const DIMENSION_OFFSET = 24
const DIMENSION_TICK = 8

const clampNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const makePodUpdate = (pod, changes) => ({
  ...pod,
  ...changes,
  updatedAt: new Date().toISOString()
})

const formatCurrency = (value = 0) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
)

const OutlinePreview = ({ outline }) => {
  const bounds = getPolygonBounds(outline.points || [])
  const margin = 18
  const viewBox = `${bounds.minX - margin} ${bounds.minY - margin} ${Math.max(bounds.width, 24) + margin * 2} ${Math.max(bounds.height, 24) + margin * 2}`

  return (
    <svg className="bathroom-pod-outline-preview-svg" viewBox={viewBox}>
      <rect
        x={bounds.minX - margin}
        y={bounds.minY - margin}
        width={Math.max(bounds.width, 24) + margin * 2}
        height={Math.max(bounds.height, 24) + margin * 2}
        fill="#ffffff"
      />
      <polygon
        points={(outline.points || []).map(point => `${point.x},${point.y}`).join(' ')}
        fill="rgba(59, 130, 246, 0.15)"
        stroke="#2563eb"
        strokeWidth="2"
      />
    </svg>
  )
}

const Section = ({ collapsed, title, onToggle, children }) => (
  <section className="bathroom-pod-section">
    <button type="button" className="bathroom-pod-section-toggle" onClick={onToggle}>
      <span>{title}</span>
      <span>{collapsed ? '+' : '−'}</span>
    </button>
    {!collapsed && <div className="bathroom-pod-section-body">{children}</div>}
  </section>
)

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

const getInitialCollapsedSections = () => {
  try {
    const state = getTemporaryState()
    return {
      ...DEFAULT_COLLAPSED_SECTIONS,
      ...(state.ui?.bathroomPodCollapsedSections || {})
    }
  } catch (error) {
    return DEFAULT_COLLAPSED_SECTIONS
  }
}

const getProjectLocationState = () => (
  getProjectManifest().bathroomPods?.projectLocation || {
    mode: 'download',
    label: 'Browser Downloads',
    lastSelectedAt: null
  }
)

const getTemplateOptions = (importedTypes = []) => {
  const optionsById = new Map()

  bathroomPodTemplates.forEach(template => {
    optionsById.set(template.id, {
      id: template.id,
      label: template.name
    })
  })

  importedTypes.forEach(type => {
    optionsById.set(type.id, {
      id: type.id,
      label: type.name
    })
  })

  return Array.from(optionsById.values())
}

export default function BathroomPodWorkspace({
  podData,
  onChange,
  projectRefreshKey,
  onProjectRepositoryUpdated
}) {
  const svgRef = useRef(null)
  const importInputRef = useRef(null)
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState(0)
  const [selectedWallFaceIndex, setSelectedWallFaceIndex] = useState(null)
  const [selectedVertexIndex, setSelectedVertexIndex] = useState(null)
  const [selectedFixtureId, setSelectedFixtureId] = useState(null)
  const [fixtureType, setFixtureType] = useState('toilet')
  const [placingFixture, setPlacingFixture] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [draftPoints, setDraftPoints] = useState([])
  const [dragState, setDragState] = useState(null)
  const [message, setMessage] = useState('')
  const [collapsedSections, setCollapsedSections] = useState(getInitialCollapsedSections)
  const [importPreview, setImportPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('ifc')
  const [importMode, setImportMode] = useState('add')
  const [replaceTargetTypeId, setReplaceTargetTypeId] = useState('standard')
  const [importedTypes, setImportedTypes] = useState(() => (
    getProjectManifest().bathroomPods?.types || []
  ))
  const [podTypeCount, setPodTypeCount] = useState(() => (
    getProjectManifest().bathroomPods?.podTypeCount || 3
  ))
  const [exportHistory, setExportHistory] = useState(() => (
    getProjectManifest().bathroomPods?.exportHistory || []
  ))
  const [projectLocation, setProjectLocation] = useState(getProjectLocationState)

  const syncPodState = (nextPod) => ({
    ...nextPod,
    precon: deriveBathroomPodPrecon({
      ...nextPod,
      precon: nextPod.precon || createBathroomPodPreconDefaults()
    })
  })

  const pod = useMemo(
    () => syncPodState(podData || createBathroomPodFromTemplate('standard')),
    [podData]
  )
  const layout = pod.layout || []
  const validation = useMemo(() => validateBathroomPodLayout(pod), [pod])
  const doorValidation = useMemo(() => validateDoorOpening(pod), [pod])
  const fixtureCounts = useMemo(() => getFixtureCounts(pod.fixtures || []), [pod.fixtures])
  const drain = getDrainFixture(pod.fixtures || [])
  const slopeCorners = drain
    ? getRotatedBoxCorners(drain, pod.slopeBox.width, pod.slopeBox.length, pod.slopeBox.rotation)
    : []
  const bounds = getPolygonBounds(drawing && draftPoints.length ? draftPoints : layout)
  const margin = 48
  const viewBox = `${bounds.minX - margin} ${bounds.minY - margin} ${Math.max(bounds.width, 96) + margin * 2} ${Math.max(bounds.height, 96) + margin * 2}`
  const wallSegments = getWallSegmentsWithDoor(layout, doorValidation.valid ? pod.doorway : null)
  const insetLayout = useMemo(() => getInsetPolygon(layout, WALL_THICKNESS_INCHES), [layout])
  const wallFacePolygons = useMemo(
    () => getWallFacePolygons(layout, doorValidation.valid ? pod.doorway : null, WALL_THICKNESS_INCHES),
    [layout, pod.doorway, doorValidation.valid]
  )
  const selectedEdgeLength = getEdgeLength(layout, selectedEdgeIndex)
  const precon = pod.precon || createBathroomPodPreconDefaults()
  const activeExportFormat = bathroomPodExportFormats.find(format => format.value === exportFormat) || bathroomPodExportFormats[0]
  const requiresDirectoryReselection = projectLocation.mode === 'directory' && !hasSelectedProjectDirectory()
  const templateOptions = useMemo(() => getTemplateOptions(importedTypes), [importedTypes])

  useEffect(() => {
    updateTempUIState({
      bathroomPodCollapsedSections: collapsedSections
    })
  }, [collapsedSections])

  useEffect(() => {
    if (selectedEdgeIndex >= layout.length) {
      setSelectedEdgeIndex(Math.max(0, layout.length - 1))
    }
    if (selectedWallFaceIndex !== null && selectedWallFaceIndex >= layout.length) {
      setSelectedWallFaceIndex(null)
    }
    if (selectedVertexIndex !== null && selectedVertexIndex >= layout.length) {
      setSelectedVertexIndex(null)
    }
    if (selectedFixtureId && !(pod.fixtures || []).some(fixture => fixture.id === selectedFixtureId)) {
      setSelectedFixtureId(null)
    }
  }, [layout.length, pod.fixtures, selectedEdgeIndex, selectedFixtureId, selectedVertexIndex, selectedWallFaceIndex])

  useEffect(() => {
    setProjectLocation(getProjectLocationState())
    setImportedTypes(getProjectManifest().bathroomPods?.types || [])
    setPodTypeCount(getProjectManifest().bathroomPods?.podTypeCount || 3)
  }, [projectRefreshKey])

  const toggleSection = (sectionKey) => {
    setCollapsedSections(previous => ({
      ...previous,
      [sectionKey]: !previous[sectionKey]
    }))
  }

  const updatePod = (changes) => {
    onChange(syncPodState(makePodUpdate(pod, changes)))
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
    const nextPod = syncPodState(makePodUpdate(pod, {
      slopeBox: {
        ...pod.slopeBox,
        ...changes
      }
    }))
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
    const importedType = importedTypes.find(type => type.id === templateId)
    const starterTemplate = bathroomPodTemplates.find(template => template.id === templateId)
    const nextPod = starterTemplate
      ? (importedType ? createBathroomPodFromImportedType(importedType) : createBathroomPodFromTemplate(templateId))
      : createBathroomPodFromImportedType(importedType)

    if (!nextPod) return

    onChange(syncPodState({
      ...nextPod,
      id: pod.id,
      name: pod.name || nextPod.name
    }))
    setSelectedEdgeIndex(0)
    setSelectedWallFaceIndex(null)
    setSelectedVertexIndex(null)
    setSelectedFixtureId(null)
    setMessage(`Loaded ${nextPod.name}.`)
  }

  const startDrawing = () => {
    setDrawing(true)
    setDraftPoints([])
    setSelectedWallFaceIndex(null)
    setSelectedVertexIndex(null)
    setSelectedFixtureId(null)
    setMessage('Click plan points. Click near the first point to close the loop.')
  }

  const finishDrawing = (points) => {
    const draftPod = syncPodState(makePodUpdate(pod, {
      templateId: 'custom',
      layout: points,
      doorway: { ...pod.doorway, edgeIndex: 0, offset: 0 },
      coveEdgeIndex: Math.min(pod.coveEdgeIndex || 0, points.length - 1),
      fixtures: (pod.fixtures || []).filter(fixture => isPointInsidePolygon(fixture, points))
    }))
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
        setMessage(`Bathroom pod layouts can have at most ${BATHROOM_POD_MAX_SEGMENTS} wall faces.`)
        return
      }

      if (draftPoints.length > 1 && wouldCreateSelfIntersection(draftPoints, point)) {
        setMessage('That wall face would cross another wall face.')
        return
      }

      setDraftPoints(previous => [...previous, point])
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
      setSelectedWallFaceIndex(null)
      setPlacingFixture(false)
      setMessage(`${nextFixture.label} placed.`)
      return
    }

    setSelectedWallFaceIndex(null)
    setSelectedVertexIndex(null)
    setSelectedFixtureId(null)
  }

  const handleMouseMove = (event) => {
    if (!dragState) return
    const point = getSvgPoint(event)

    if (dragState.type === 'vertex') {
      const nextLayout = layout.map((vertex, index) => (
        index === dragState.index ? point : vertex
      ))
      const draftPod = syncPodState(makePodUpdate(pod, { layout: nextLayout }))
      const result = validateBathroomPodLayout(draftPod)
      if (result.valid) onChange(draftPod)
      return
    }

    if (dragState.type === 'fixture') {
      if (!isPointInsidePolygon(point, layout)) return
      const fixtures = (pod.fixtures || []).map(fixture => (
        fixture.id === dragState.id ? { ...fixture, x: point.x, y: point.y } : fixture
      ))
      const draftPod = syncPodState(makePodUpdate(pod, { fixtures }))
      const result = validateBathroomPodLayout(draftPod)
      if (result.valid) onChange(draftPod)
    }
  }

  const insertVertexOnSelectedEdge = () => {
    if (layout.length >= BATHROOM_POD_MAX_SEGMENTS) {
      setMessage(`Bathroom pod layouts can have at most ${BATHROOM_POD_MAX_SEGMENTS} wall faces.`)
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
      setMessage('A closed pod layout needs at least 3 wall faces.')
      return
    }
    const nextLayout = layout.filter((_, index) => index !== selectedVertexIndex)
    const draftPod = syncPodState(makePodUpdate(pod, {
      layout: nextLayout,
      doorway: { ...pod.doorway, edgeIndex: Math.min(pod.doorway.edgeIndex, nextLayout.length - 1) },
      coveEdgeIndex: Math.min(pod.coveEdgeIndex, nextLayout.length - 1)
    }))
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

  const handleChooseProjectDirectory = async () => {
    try {
      const handle = await chooseLocalProjectDirectory()
      if (!handle) {
        setMessage('Directory picker is not available in this browser.')
        return
      }

      const nextLocation = updateBathroomPodProjectLocation({
        mode: 'directory',
        label: handle.name
      })
      setProjectLocation(nextLocation)
      onProjectRepositoryUpdated?.(handle.name)
      setMessage(`Local project folder set to ${handle.name}.`)
    } catch (error) {
      setMessage(error.message || 'Project folder selection was cancelled.')
    }
  }

  const handleUseDownloads = () => {
    clearSelectedProjectDirectory()
    const nextLocation = updateBathroomPodProjectLocation({
      mode: 'download',
      label: 'Browser Downloads'
    })
    setProjectLocation(nextLocation)
    onProjectRepositoryUpdated?.()
    setMessage('Exports will use browser downloads.')
  }

  const handleImportFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setImporting(true)
    try {
      const previews = []
      for (const file of files) {
        if (!/\.dxf$/i.test(file.name)) {
          previews.push({
            fileName: file.name,
            typeName: file.name,
            acceptedOutlines: [],
            rejectedOutlines: [
              { reason: 'Only DXF files can be imported.' }
            ],
            rawContent: ''
          })
          continue
        }

        const rawContent = await file.text()
        previews.push({
          ...parseBathroomPodDxf(rawContent, file.name),
          rawContent
        })
      }

      setImportPreview(previews)
      setMessage(`Prepared ${previews.length} DXF file${previews.length === 1 ? '' : 's'} for review.`)
      if (event.target) event.target.value = ''
    } catch (error) {
      setMessage(error.message || 'DXF import failed.')
    } finally {
      setImporting(false)
    }
  }

  const commitImportPreview = async () => {
    if (importMode === 'replace' && importPreview.length !== 1) {
      setMessage('Replace layout mode requires exactly one DXF file.')
      return
    }

    const importedTypeRecords = importMode === 'replace'
      ? importPreview
        .map(preview => {
          const targetTemplate = templateOptions.find(option => option.id === replaceTargetTypeId)
          return createBathroomPodTypeFromImport(preview, {
            id: replaceTargetTypeId,
            name: targetTemplate?.label || preview.typeName
          })
        })
        .filter(Boolean)
      : importPreview
        .map(createBathroomPodTypeFromImport)
        .filter(Boolean)

    if (!importedTypeRecords.length) {
      setMessage('No valid pod types are ready to import.')
      return
    }

    const importBatch = {
      source: 'dxf',
      units: 'in',
      files: importPreview.map(preview => ({
        name: preview.fileName,
        typeName: preview.typeName,
        acceptedOutlineCount: preview.acceptedOutlines.length,
        rejectedOutlineCount: preview.rejectedOutlines.length
      })),
      acceptedOutlineCount: importPreview.reduce((total, preview) => total + preview.acceptedOutlines.length, 0),
      rejectedOutlineCount: importPreview.reduce((total, preview) => total + preview.rejectedOutlines.length, 0),
      typeNames: importedTypeRecords.map(type => type.name)
    }

    const savedBatch = saveBathroomPodImportBatch(importBatch, importedTypeRecords)
    const manifest = getProjectManifest()
    setImportedTypes(manifest.bathroomPods?.types || [])
    setPodTypeCount(manifest.bathroomPods?.podTypeCount || podTypeCount)

    if (projectLocation.mode === 'directory' && hasSelectedProjectDirectory()) {
      const archiveFiles = [
        {
          name: 'import-report.json',
          content: JSON.stringify({
            importBatch: savedBatch,
            previews: importPreview
          }, null, 2),
          mimeType: 'application/json;charset=utf-8'
        },
        ...importPreview
          .filter(preview => preview.rawContent)
          .map(preview => ({
            name: preview.fileName,
            content: preview.rawContent,
            mimeType: 'application/dxf'
          }))
      ]
      await writeProjectFiles({
        folder: `imports/${savedBatch.id}`,
        files: archiveFiles
      })
    }

    if (importMode === 'replace' && replaceTargetTypeId === pod.templateId) {
      const updatedType = importedTypeRecords[0]
      const replacementPod = createBathroomPodFromImportedType(updatedType)
      if (replacementPod) {
        onChange(syncPodState({
          ...replacementPod,
          id: pod.id,
          name: pod.name || replacementPod.name
        }))
      }
    }

    setImportPreview([])
    setMessage(
      importMode === 'replace'
        ? `Replaced the layout for ${importedTypeRecords[0]?.name || 'the selected pod type'}.`
        : `Imported ${importedTypeRecords.length} pod type${importedTypeRecords.length === 1 ? '' : 's'}.`
    )
  }

  const edgeOptions = layout.map((_, index) => (
    <option key={index} value={index}>Wall Face {index + 1}</option>
  ))

  const ceilingThickness = Math.max(0, (pod.heights?.overall || 0) - (pod.heights?.clear || 0) - (pod.heights?.floorBase || 0))
  const heightValidationMessage = ceilingThickness < 0.01
    ? 'Bottom to top of pod must exceed clear height plus floor base thickness.'
    : ''

  const visibleMessage = !validation.valid
    ? validation.errors[0]
    : !doorValidation.valid
      ? doorValidation.message
      : heightValidationMessage || message

  const widthDimensionY = bounds.minY - DIMENSION_OFFSET
  const heightDimensionX = bounds.maxX + DIMENSION_OFFSET

  return (
    <div className="bathroom-pod-workspace">
      <div className="bathroom-pod-control-panel">
        <div className="bathroom-pod-panel-heading">
          <h2>Bathroom Pod</h2>
          <span>{validation.valid ? 'Valid layout' : 'Needs attention'}</span>
        </div>

        <Section
          title="Project Repository"
          collapsed={collapsedSections.files}
          onToggle={() => toggleSection('files')}
        >
          <div className="bathroom-pod-location-pill">
            {projectLocation.mode === 'directory' ? 'Local Folder' : 'Downloads'}: {projectLocation.label}
          </div>
          <div className="bathroom-pod-inline-actions">
            <button type="button" onClick={handleChooseProjectDirectory}>
              Select Project Folder
            </button>
            <button type="button" onClick={handleUseDownloads}>
              Use Downloads
            </button>
          </div>
          <p className="bathroom-pod-support-text">
            {canUseLocalProjectDirectory()
              ? (
                requiresDirectoryReselection
                  ? 'Re-select the project folder after a page refresh to keep writing directly into that repository.'
                  : 'The selected local folder is used as the project repository for imports and exports in this browser session.'
              )
              : 'This browser does not support direct local folder access, so files will use browser downloads.'}
          </p>
        </Section>

        <Section
          title="Pod Types"
          collapsed={collapsedSections.podTypes}
          onToggle={() => toggleSection('podTypes')}
        >
          <div className="bathroom-pod-subsection">
            <div className="bathroom-pod-subsection-title">Project Pod Types</div>
            <div className="bathroom-pod-grid-3">
              <label>
                <span>Pod Type Count</span>
                <input
                  type="number"
                  min="1"
                  value={podTypeCount}
                  onChange={(event) => {
                    const nextCount = updateBathroomPodTypeCount(Math.max(1, clampNumber(event.target.value, 1)))
                    setPodTypeCount(nextCount)
                  }}
                />
              </label>
            </div>
            <label className="bathroom-pod-field">
              <span>Active Pod Type</span>
              <select value={pod.templateId || 'custom'} onChange={(event) => applyTemplate(event.target.value)}>
                {pod.templateId === 'custom' && <option value="custom">Custom</option>}
                {templateOptions.map(template => (
                  <option key={template.id} value={template.id}>{template.label}</option>
                ))}
              </select>
            </label>
            <p className="bathroom-pod-support-text">
              {templateOptions.length} pod type{templateOptions.length === 1 ? '' : 's'} currently available in this project.
            </p>
          </div>

          <div className="bathroom-pod-subsection">
            <div className="bathroom-pod-subsection-title">Import DXF Layouts</div>
            <div className="bathroom-pod-grid-3 bathroom-pod-grid-2">
              <label>
                <span>Import Action</span>
                <select value={importMode} onChange={(event) => setImportMode(event.target.value)}>
                  <option value="add">Add Pod Type per DXF</option>
                  <option value="replace">Replace Existing Pod Type</option>
                </select>
              </label>
              {importMode === 'replace' && (
                <label>
                  <span>Replace Pod Type</span>
                  <select value={replaceTargetTypeId} onChange={(event) => setReplaceTargetTypeId(event.target.value)}>
                    {templateOptions.map(template => (
                      <option key={template.id} value={template.id}>{template.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          <label className="bathroom-pod-field">
            <span>DXF Files</span>
            <input
              ref={importInputRef}
              type="file"
              accept=".dxf"
              multiple
              onChange={handleImportFiles}
            />
          </label>
          <p className="bathroom-pod-support-text">
            Closed straight polylines only, in inches. Add mode creates a new pod type per DXF. Replace mode swaps the layout on the selected pod type.
          </p>
          <div className="bathroom-pod-inline-actions">
            <button type="button" onClick={() => importInputRef.current?.click()} disabled={importing}>
              {importing ? 'Reading DXFs...' : 'Select DXFs'}
            </button>
            <button type="button" onClick={commitImportPreview} disabled={!importPreview.some(preview => preview.acceptedOutlines.length)}>
              Commit Import
            </button>
            <button type="button" onClick={() => setImportPreview([])} disabled={!importPreview.length}>
              Clear
            </button>
          </div>
          </div>

          <div className="bathroom-pod-subsection">
            <div className="bathroom-pod-subsection-title">Author Layout</div>
            <div className="bathroom-pod-button-row">
              <button type="button" onClick={startDrawing}>Draw New Loop</button>
              <button type="button" onClick={insertVertexOnSelectedEdge}>Add Vertex</button>
              <button type="button" onClick={removeSelectedVertex}>Remove Vertex</button>
            </div>
            <p className="bathroom-pod-support-text">
              Select a wall face to insert a vertex, or select a vertex marker to remove it.
            </p>
          </div>

          {importPreview.length > 0 && (
            <div className="bathroom-pod-outline-preview-list">
              {importPreview.map(preview => (
                <article key={preview.fileName} className="bathroom-pod-outline-preview-card">
                  <header>
                    <strong>{preview.typeName}</strong>
                    <span>{preview.acceptedOutlines.length} accepted / {preview.rejectedOutlines.length} rejected</span>
                  </header>
                  {preview.acceptedOutlines.map(outline => (
                    <div key={`${preview.fileName}_${outline.outlineIndex}`}>
                      <span>{outline.segmentCount} wall face{outline.segmentCount === 1 ? '' : 's'}</span>
                      <OutlinePreview outline={outline} />
                    </div>
                  ))}
                  {preview.rejectedOutlines.length > 0 && (
                    <div className="bathroom-pod-outline-rejections">
                      {preview.rejectedOutlines.map((rejection, index) => (
                        <div key={`${preview.fileName}_rejection_${index}`}>{rejection.reason}</div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Export Settings"
          collapsed={collapsedSections.export}
          onToggle={() => toggleSection('export')}
        >
          <label className="bathroom-pod-field">
            <span>Format</span>
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
              {bathroomPodExportFormats.map(format => (
                <option key={format.value} value={format.value} disabled={!format.enabled}>
                  {format.label}{format.enabled ? '' : ' (Planned)'}
                </option>
              ))}
            </select>
          </label>
          <p className="bathroom-pod-support-text">{activeExportFormat.description}</p>
          {exportHistory.length > 0 && (
            <div className="bathroom-pod-history-list">
              {exportHistory.slice(0, 3).map(item => (
                <article key={item.id} className="bathroom-pod-history-item">
                  <header>
                    <strong>{item.format?.toUpperCase()} export</strong>
                    <span>{item.status}</span>
                  </header>
                  <div><span>{item.target}</span></div>
                  <div><span>{item.files?.join(', ')}</span></div>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Dimensions"
          collapsed={collapsedSections.dimensions}
          onToggle={() => toggleSection('dimensions')}
        >
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
          <DimensionInput
            label="Floor Base Thickness"
            value={pod.heights?.floorBase || 6}
            onChange={(value) => updateNested('heights', { floorBase: value })}
          />
          <p className="bathroom-pod-support-text">
            Ceiling thickness: {formatInchesAsFeet(ceilingThickness)}. Bottom-to-top includes the floor base thickness.
          </p>
        </Section>

        <Section
          title="Structural and Finish"
          collapsed={collapsedSections.structural}
          onToggle={() => toggleSection('structural')}
        >
          <label className="bathroom-pod-field">
            <span>Structural Type</span>
            <select value={pod.structuralType} onChange={(event) => updatePod({ structuralType: event.target.value })}>
              {bathroomPodStructuralTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>

          <label className="bathroom-pod-field">
            <span>FF&amp;E / Finish</span>
            <select value={pod.finishType} onChange={(event) => updatePod({ finishType: event.target.value })}>
              {bathroomPodFinishTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
        </Section>

        <Section
          title="Doorway Knockout"
          collapsed={collapsedSections.doorway}
          onToggle={() => toggleSection('doorway')}
        >
          <label className="bathroom-pod-field">
            <span>Door Wall Face</span>
            <select
              value={pod.doorway.edgeIndex}
              onChange={(event) => {
                const edgeIndex = parseInt(event.target.value, 10)
                setSelectedEdgeIndex(edgeIndex)
                setSelectedWallFaceIndex(edgeIndex)
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
        </Section>

        <Section
          title="Shower Cove"
          collapsed={collapsedSections.cove}
          onToggle={() => toggleSection('cove')}
        >
          <label className="bathroom-pod-field">
            <span>Cove Wall Face</span>
            <select value={pod.coveEdgeIndex} onChange={(event) => updatePod({ coveEdgeIndex: parseInt(event.target.value, 10) })}>
              {edgeOptions}
            </select>
          </label>
          <button type="button" className="bathroom-pod-secondary-button" onClick={() => updatePod({ coveEdgeIndex: selectedEdgeIndex })}>
            Mark Selected Wall Face as Cove
          </button>
        </Section>

        <Section
          title="Drain and GFRC Slope"
          collapsed={collapsedSections.slope}
          onToggle={() => toggleSection('slope')}
        >
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
        </Section>

        <Section
          title="Fixture Markers"
          collapsed={collapsedSections.fixtures}
          onToggle={() => toggleSection('fixtures')}
        >
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

          <div className="bathroom-pod-counts">
            {bathroomPodFixtureTypes.map(type => (
              <span key={type.value}>{type.label}: {fixtureCounts[type.value] || 0}</span>
            ))}
          </div>
        </Section>

        <div className="bathroom-pod-data-display">
          <div><span>Wall Faces</span><strong>{layout.length} / {BATHROOM_POD_MAX_SEGMENTS}</strong></div>
          <div><span>GFRC slope depth</span><strong>{pod.slopeBox.depth}"</strong></div>
          <div><span>Fixtures</span><strong>{fixtureCounts.total || 0}</strong></div>
          <div><span>Finish</span><strong>{pod.finishType === 'tile' ? 'Tile' : 'Future Finish'}</strong></div>
          <div><span>Pod height</span><strong>{formatInchesAsFeet(pod.heights?.overall || 108)}</strong></div>
          <div><span>Cost / Pod</span><strong>{formatCurrency(precon.derivedTotals.totalCostPerPod)}</strong></div>
        </div>

        {visibleMessage && (
          <div className={`bathroom-pod-message ${validation.valid && doorValidation.valid && !heightValidationMessage ? 'info' : 'error'}`}>
            {visibleMessage}
          </div>
        )}
      </div>

      <div className="bathroom-pod-split">
        <div className="bathroom-pod-plan-shell">
          <div className="bathroom-pod-pane-heading">
            <span>2D Pod Layout</span>
            <span>{drawing ? `${draftPoints.length} draft points` : `${layout.length} closed wall faces`}</span>
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
            <rect
              x={bounds.minX - margin}
              y={bounds.minY - margin}
              width={Math.max(bounds.width, 96) + margin * 2}
              height={Math.max(bounds.height, 96) + margin * 2}
              fill="url(#pod-grid)"
            />

            {!drawing && (
              <>
                <polygon points={layout.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-floor-fill" />
                <polygon points={layout.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-wall-outline" />
                <polygon points={insetLayout.map(point => `${point.x},${point.y}`).join(' ')} className="bathroom-pod-wall-outline inner" />
                {wallFacePolygons.filter(face => face.type === 'wall').map((face, index) => (
                  <polygon
                    key={`wall-face-fill-${face.edgeIndex}-${index}`}
                    points={face.polygon.map(point => `${point.x},${point.y}`).join(' ')}
                    className={`bathroom-pod-wall-face-fill ${face.edgeIndex === pod.coveEdgeIndex ? 'cove' : ''} ${face.edgeIndex === selectedWallFaceIndex ? 'selected' : ''}`}
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
                {wallFacePolygons
                  .filter(face => face.type === 'door')
                  .flatMap(face => face.caps || [])
                  .map((cap, index) => (
                    <line
                      key={`door-cap-${index}`}
                      x1={cap.start.x}
                      y1={cap.start.y}
                      x2={cap.end.x}
                      y2={cap.end.y}
                      className="bathroom-pod-wall-cap"
                    />
                  ))}
                <line
                  x1={bounds.minX}
                  y1={bounds.minY}
                  x2={bounds.minX}
                  y2={widthDimensionY}
                  className="bathroom-pod-dimension-extension"
                />
                <line
                  x1={bounds.maxX}
                  y1={bounds.minY}
                  x2={bounds.maxX}
                  y2={widthDimensionY}
                  className="bathroom-pod-dimension-extension"
                />
                <line
                  x1={bounds.minX}
                  y1={widthDimensionY}
                  x2={bounds.maxX}
                  y2={widthDimensionY}
                  className="bathroom-pod-dimension-line"
                />
                <line
                  x1={bounds.minX}
                  y1={widthDimensionY - DIMENSION_TICK}
                  x2={bounds.minX}
                  y2={widthDimensionY + DIMENSION_TICK}
                  className="bathroom-pod-dimension-line"
                />
                <line
                  x1={bounds.maxX}
                  y1={widthDimensionY - DIMENSION_TICK}
                  x2={bounds.maxX}
                  y2={widthDimensionY + DIMENSION_TICK}
                  className="bathroom-pod-dimension-line"
                />
                <text
                  x={(bounds.minX + bounds.maxX) / 2}
                  y={widthDimensionY - 6}
                  className="bathroom-pod-dimension-text"
                  textAnchor="middle"
                >
                  {formatInchesAsFeet(bounds.width)}
                </text>
                <line
                  x1={bounds.maxX}
                  y1={bounds.minY}
                  x2={heightDimensionX}
                  y2={bounds.minY}
                  className="bathroom-pod-dimension-extension"
                />
                <line
                  x1={bounds.maxX}
                  y1={bounds.maxY}
                  x2={heightDimensionX}
                  y2={bounds.maxY}
                  className="bathroom-pod-dimension-extension"
                />
                <line
                  x1={heightDimensionX}
                  y1={bounds.minY}
                  x2={heightDimensionX}
                  y2={bounds.maxY}
                  className="bathroom-pod-dimension-line"
                />
                <line
                  x1={heightDimensionX - DIMENSION_TICK}
                  y1={bounds.minY}
                  x2={heightDimensionX + DIMENSION_TICK}
                  y2={bounds.minY}
                  className="bathroom-pod-dimension-line"
                />
                <line
                  x1={heightDimensionX - DIMENSION_TICK}
                  y1={bounds.maxY}
                  x2={heightDimensionX + DIMENSION_TICK}
                  y2={bounds.maxY}
                  className="bathroom-pod-dimension-line"
                />
                <text
                  x={heightDimensionX + 8}
                  y={(bounds.minY + bounds.maxY) / 2}
                  className="bathroom-pod-dimension-text"
                  textAnchor="middle"
                  transform={`rotate(90 ${heightDimensionX + 8} ${(bounds.minY + bounds.maxY) / 2})`}
                >
                  {formatInchesAsFeet(bounds.height)}
                </text>
                {layout.map((point, index) => {
                  const next = layout[(index + 1) % layout.length]
                  return (
                    <line
                      key={`edge-hit-${index}`}
                      x1={point.x}
                      y1={point.y}
                      x2={next.x}
                      y2={next.y}
                      className={`bathroom-pod-edge-hit ${selectedWallFaceIndex === index ? 'selected' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedEdgeIndex(index)
                        setSelectedWallFaceIndex(index)
                        updateDoorway({ edgeIndex: index })
                        setSelectedFixtureId(null)
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
                        setSelectedWallFaceIndex(null)
                        setDragState({ type: 'fixture', id: fixture.id })
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <circle cx={fixture.x} cy={fixture.y} r={fixture.type === 'drain' ? 4 : 6} fill={fixtureTypeInfo?.color || '#64748b'} />
                      <text x={fixture.x} y={fixture.y - 10} textAnchor="middle">{fixtureTypeInfo?.label || fixture.type}</text>
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
                      setSelectedWallFaceIndex(null)
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

        <BathroomPodPreview3D pod={{ ...pod, selectedWallFaceIndex }} />
      </div>
    </div>
  )
}

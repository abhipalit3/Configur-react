import {
  BATHROOM_POD_MAX_SEGMENTS,
  createBathroomPodFromLayout
} from '../types/bathroomPod'
import {
  hasDuplicatePoints,
  hasSelfIntersections,
  polygonArea
} from './bathroomPodGeometry'

const CURVED_ENTITY_TYPES = new Set(['ARC', 'CIRCLE', 'ELLIPSE', 'SPLINE'])

const roundCoordinate = (value) => Math.round((parseFloat(value) || 0) * 1000) / 1000

const toSlug = (value = '') => value
  .toLowerCase()
  .replace(/\.dxf$/i, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') || 'bathroom-pod-type'

export const getBathroomPodTypeNameFromFile = (fileName = 'Imported Pod.dxf') => {
  const rawName = fileName.replace(/\.dxf$/i, '').replace(/[_-]+/g, ' ').trim()
  return rawName || 'Imported Pod'
}

const parsePairs = (text = '') => {
  const lines = text.replace(/\r/g, '').split('\n')
  const pairs = []

  for (let index = 0; index < lines.length; index += 2) {
    pairs.push({
      code: (lines[index] || '').trim(),
      value: (lines[index + 1] || '').trim()
    })
  }

  return pairs
}

const validateOutlinePoints = (points = []) => {
  const errors = []

  if (points.length < 3) errors.push('Outline must have at least 3 wall faces.')
  if (points.length > BATHROOM_POD_MAX_SEGMENTS) {
    errors.push(`Outline exceeds the ${BATHROOM_POD_MAX_SEGMENTS} wall face limit.`)
  }
  if (hasDuplicatePoints(points)) errors.push('Outline contains duplicate vertices.')
  if (Math.abs(polygonArea(points)) < 0.0001) errors.push('Outline area must be greater than 0.')
  if (hasSelfIntersections(points)) errors.push('Outline self-intersects.')

  return {
    valid: errors.length === 0,
    errors
  }
}

const parseLwPolyline = (pairs = []) => {
  const points = []
  let isClosed = false
  let hasCurve = false
  let pendingX = null

  pairs.forEach(pair => {
    if (pair.code === '70') {
      isClosed = (parseInt(pair.value, 10) & 1) === 1
    }
    if (pair.code === '42' && Math.abs(parseFloat(pair.value) || 0) > 0.0001) {
      hasCurve = true
    }
    if (pair.code === '10') {
      pendingX = roundCoordinate(pair.value)
    }
    if (pair.code === '20' && pendingX !== null) {
      points.push({
        x: pendingX,
        y: roundCoordinate(pair.value)
      })
      pendingX = null
    }
  })

  return {
    entityType: 'LWPOLYLINE',
    points,
    isClosed,
    hasCurve
  }
}

const parsePolylineEntity = (startPairs = [], vertexEntities = []) => {
  const points = []
  let isClosed = false
  let hasCurve = false

  startPairs.forEach(pair => {
    if (pair.code === '70') {
      isClosed = (parseInt(pair.value, 10) & 1) === 1
    }
  })

  vertexEntities.forEach(vertex => {
    let x = null
    let y = null
    vertex.pairs.forEach(pair => {
      if (pair.code === '42' && Math.abs(parseFloat(pair.value) || 0) > 0.0001) {
        hasCurve = true
      }
      if (pair.code === '10') x = roundCoordinate(pair.value)
      if (pair.code === '20') y = roundCoordinate(pair.value)
    })

    if (x !== null && y !== null) {
      points.push({ x, y })
    }
  })

  return {
    entityType: 'POLYLINE',
    points,
    isClosed,
    hasCurve
  }
}

const buildOutlineResult = (entity, typeName, index) => {
  if (entity.hasCurve) {
    return {
      accepted: false,
      reason: 'Curved DXF wall faces are not supported.',
      entityType: entity.entityType,
      outlineIndex: index
    }
  }

  if (!entity.isClosed) {
    return {
      accepted: false,
      reason: 'DXF outline must be a closed polyline.',
      entityType: entity.entityType,
      outlineIndex: index
    }
  }

  const validation = validateOutlinePoints(entity.points)
  if (!validation.valid) {
    return {
      accepted: false,
      reason: validation.errors[0],
      entityType: entity.entityType,
      outlineIndex: index
    }
  }

  return {
    accepted: true,
    entityType: entity.entityType,
    outlineIndex: index,
    typeName,
    points: entity.points,
    segmentCount: entity.points.length,
    area: Math.abs(polygonArea(entity.points))
  }
}

export const parseBathroomPodDxf = (text = '', fileName = 'Imported Pod.dxf') => {
  const pairs = parsePairs(text)
  const typeName = getBathroomPodTypeNameFromFile(fileName)
  const outlines = []
  const rejectedOutlines = []
  let activeSection = ''

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index]

    if (pair.code === '0' && pair.value === 'SECTION') {
      const nextPair = pairs[index + 1]
      if (nextPair?.code === '2') {
        activeSection = nextPair.value
        index += 1
      }
      continue
    }

    if (pair.code === '0' && pair.value === 'ENDSEC') {
      activeSection = ''
      continue
    }

    if (activeSection !== 'ENTITIES' || pair.code !== '0') continue

    if (CURVED_ENTITY_TYPES.has(pair.value)) {
      rejectedOutlines.push({
        accepted: false,
        entityType: pair.value,
        reason: 'Curved DXF entities are not supported for pod boundaries.'
      })
      continue
    }

    if (pair.value === 'LWPOLYLINE') {
      const entityPairs = []
      let cursor = index + 1
      while (cursor < pairs.length && pairs[cursor].code !== '0') {
        entityPairs.push(pairs[cursor])
        cursor += 1
      }
      index = cursor - 1
      const result = buildOutlineResult(parseLwPolyline(entityPairs), typeName, outlines.length + rejectedOutlines.length + 1)
      if (result.accepted) outlines.push(result)
      else rejectedOutlines.push(result)
    }

    if (pair.value === 'POLYLINE') {
      const headerPairs = []
      const vertices = []
      let cursor = index + 1

      while (cursor < pairs.length && !(pairs[cursor].code === '0' && pairs[cursor].value === 'SEQEND')) {
        if (pairs[cursor].code === '0' && pairs[cursor].value === 'VERTEX') {
          const vertexPairs = []
          cursor += 1
          while (cursor < pairs.length && pairs[cursor].code !== '0') {
            vertexPairs.push(pairs[cursor])
            cursor += 1
          }
          vertices.push({
            entityType: 'VERTEX',
            pairs: vertexPairs
          })
          continue
        }

        if (pairs[cursor].code !== '0') {
          headerPairs.push(pairs[cursor])
        }
        cursor += 1
      }

      index = cursor
      const result = buildOutlineResult(
        parsePolylineEntity(headerPairs, vertices),
        typeName,
        outlines.length + rejectedOutlines.length + 1
      )
      if (result.accepted) outlines.push(result)
      else rejectedOutlines.push(result)
    }
  }

  return {
    fileName,
    typeName,
    typeId: `imported_${toSlug(typeName)}`,
    acceptedOutlines: outlines,
    rejectedOutlines
  }
}

export const createBathroomPodTypeFromImport = (preview = {}, overrides = {}) => {
  const acceptedOutlines = preview.acceptedOutlines || []
  const primaryOutline = [...acceptedOutlines].sort((first, second) => second.area - first.area)[0]

  if (!primaryOutline) return null

  return {
    id: overrides.id || preview.typeId || `imported_${toSlug(preview.typeName)}`,
    name: overrides.name || preview.typeName || 'Imported Pod',
    source: 'dxf',
    sourceFileName: preview.fileName,
    importedAt: new Date().toISOString(),
    outlineCount: acceptedOutlines.length,
    defaultLayout: primaryOutline.points.map(point => ({ ...point })),
    instances: acceptedOutlines.map((outline, index) => ({
      id: `${overrides.id || preview.typeId || 'imported'}_instance_${index + 1}`,
      name: `${overrides.name || preview.typeName || 'Imported Pod'} ${index + 1}`,
      layout: outline.points.map(point => ({ ...point })),
      segmentCount: outline.segmentCount
    }))
  }
}

export const createBathroomPodFromImportedType = (podType) => {
  if (!podType?.defaultLayout?.length) return null
  return createBathroomPodFromLayout({
    layout: podType.defaultLayout,
    name: podType.name,
    templateId: podType.id,
    sourceImportBatchId: podType.sourceImportBatchId || null
  })
}

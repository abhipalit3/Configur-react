/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BATHROOM_POD_MAX_SEGMENTS } from '../types/bathroomPod'

const EPSILON = 0.0001

export const distance = (a, b) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export const pointsAlmostEqual = (a, b, tolerance = EPSILON) => {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance
}

export const getPolygonSegments = (points = []) => {
  if (!Array.isArray(points) || points.length < 2) return []
  return points.map((point, index) => ({
    start: point,
    end: points[(index + 1) % points.length],
    index
  }))
}

export const getPolygonBounds = (points = []) => {
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 }
  }

  const xs = points.map(point => point.x)
  const ys = points.map(point => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export const polygonArea = (points = []) => {
  if (!Array.isArray(points) || points.length < 3) return 0
  let area = 0
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    area += point.x * next.y - next.x * point.y
  })
  return area / 2
}

const orientation = (a, b, c) => {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(value) < EPSILON) return 0
  return value > 0 ? 1 : 2
}

const onSegment = (a, b, c) => {
  return (
    b.x <= Math.max(a.x, c.x) + EPSILON &&
    b.x + EPSILON >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + EPSILON &&
    b.y + EPSILON >= Math.min(a.y, c.y)
  )
}

export const segmentsIntersect = (a1, a2, b1, b2) => {
  const o1 = orientation(a1, a2, b1)
  const o2 = orientation(a1, a2, b2)
  const o3 = orientation(b1, b2, a1)
  const o4 = orientation(b1, b2, a2)

  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(a1, b1, a2)) return true
  if (o2 === 0 && onSegment(a1, b2, a2)) return true
  if (o3 === 0 && onSegment(b1, a1, b2)) return true
  if (o4 === 0 && onSegment(b1, a2, b2)) return true
  return false
}

const areAdjacentEdges = (firstIndex, secondIndex, edgeCount) => {
  if (firstIndex === secondIndex) return true
  if (Math.abs(firstIndex - secondIndex) === 1) return true
  return (
    (firstIndex === 0 && secondIndex === edgeCount - 1) ||
    (secondIndex === 0 && firstIndex === edgeCount - 1)
  )
}

export const hasDuplicatePoints = (points = []) => {
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (pointsAlmostEqual(points[i], points[j])) return true
    }
  }
  return false
}

export const hasSelfIntersections = (points = []) => {
  const segments = getPolygonSegments(points)
  if (segments.length < 4) return false

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (areAdjacentEdges(i, j, segments.length)) continue
      if (segmentsIntersect(segments[i].start, segments[i].end, segments[j].start, segments[j].end)) {
        return true
      }
    }
  }

  return false
}

export const wouldCreateSelfIntersection = (points = [], nextPoint, closing = false) => {
  if (!points.length) return false
  const newSegmentStart = points[points.length - 1]
  const newSegmentEnd = closing ? points[0] : nextPoint

  const startIndex = closing ? 1 : 0
  const endIndex = closing ? points.length - 2 : points.length - 2

  for (let i = startIndex; i < endIndex; i += 1) {
    const start = points[i]
    const end = points[i + 1]
    if (segmentsIntersect(newSegmentStart, newSegmentEnd, start, end)) {
      return true
    }
  }

  return false
}

export const isPointOnSegment = (point, start, end, tolerance = 0.05) => {
  const segmentLength = distance(start, end)
  if (segmentLength < EPSILON) return false
  const distanceSum = distance(start, point) + distance(point, end)
  return Math.abs(distanceSum - segmentLength) <= tolerance
}

export const isPointInsidePolygon = (point, points = []) => {
  if (!Array.isArray(points) || points.length < 3) return false

  for (const segment of getPolygonSegments(points)) {
    if (isPointOnSegment(point, segment.start, segment.end, 0.1)) return true
  }

  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x
    const yi = points[i].y
    const xj = points[j].x
    const yj = points[j].y
    const intersects = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + EPSILON) + xi)
    if (intersects) inside = !inside
  }
  return inside
}

export const getRotatedBoxCorners = (center, width, length, rotationDegrees = 0) => {
  const halfWidth = width / 2
  const halfLength = length / 2
  const rotation = rotationDegrees * Math.PI / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const corners = [
    { x: -halfWidth, y: -halfLength },
    { x: halfWidth, y: -halfLength },
    { x: halfWidth, y: halfLength },
    { x: -halfWidth, y: halfLength }
  ]

  return corners.map(corner => ({
    x: center.x + corner.x * cos - corner.y * sin,
    y: center.y + corner.x * sin + corner.y * cos
  }))
}

export const isRotatedBoxInsidePolygon = (center, box, polygon) => {
  if (!center || !box || !Array.isArray(polygon) || polygon.length < 3) return false
  const corners = getRotatedBoxCorners(center, box.width, box.length, box.rotation)
  const boxSegments = getPolygonSegments(corners)
  const polygonSegments = getPolygonSegments(polygon)

  if (!corners.every(corner => isPointInsidePolygon(corner, polygon))) {
    return false
  }

  for (const boxSegment of boxSegments) {
    for (const polygonSegment of polygonSegments) {
      const sharesEndpoint = (
        pointsAlmostEqual(boxSegment.start, polygonSegment.start) ||
        pointsAlmostEqual(boxSegment.start, polygonSegment.end) ||
        pointsAlmostEqual(boxSegment.end, polygonSegment.start) ||
        pointsAlmostEqual(boxSegment.end, polygonSegment.end)
      )
      if (!sharesEndpoint && segmentsIntersect(boxSegment.start, boxSegment.end, polygonSegment.start, polygonSegment.end)) {
        return false
      }
    }
  }

  return true
}

export const getDrainFixture = (fixtures = []) => {
  return fixtures.find(fixture => fixture.type === 'drain') || null
}

export const getFixtureCounts = (fixtures = []) => {
  return fixtures.reduce((counts, fixture) => {
    counts[fixture.type] = (counts[fixture.type] || 0) + 1
    counts.total = (counts.total || 0) + 1
    return counts
  }, { total: 0 })
}

export const getEdgeLength = (points = [], edgeIndex = 0) => {
  if (!points.length || edgeIndex < 0 || edgeIndex >= points.length) return 0
  return distance(points[edgeIndex], points[(edgeIndex + 1) % points.length])
}

export const getPointAlongEdge = (points = [], edgeIndex = 0, offset = 0) => {
  const start = points[edgeIndex]
  const end = points[(edgeIndex + 1) % points.length]
  const length = distance(start, end)
  if (!start || !end || length < EPSILON) return start || { x: 0, y: 0 }
  const t = Math.max(0, Math.min(1, offset / length))
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  }
}

export const validateDoorOpening = (pod) => {
  const points = pod?.layout || []
  const doorway = pod?.doorway
  if (!doorway || !points.length) return { valid: true, message: '' }
  if (doorway.edgeIndex < 0 || doorway.edgeIndex >= points.length) {
    return { valid: false, message: 'Select a valid doorway edge.' }
  }

  const edgeLength = getEdgeLength(points, doorway.edgeIndex)
  if (doorway.width <= 0) return { valid: false, message: 'Doorway width must be greater than 0.' }
  if (doorway.height <= 0) return { valid: false, message: 'Doorway height must be greater than 0.' }
  if (doorway.offset < 0) return { valid: false, message: 'Doorway offset cannot be negative.' }
  if (doorway.offset + doorway.width > edgeLength + EPSILON) {
    return { valid: false, message: 'Doorway opening must fit on the selected segment.' }
  }
  if (pod?.heights?.overall && doorway.height > pod.heights.overall + EPSILON) {
    return { valid: false, message: 'Doorway height cannot exceed pod height.' }
  }

  return { valid: true, message: '' }
}

export const getWallSegmentsWithDoor = (points = [], doorway) => {
  const segments = []
  if (!Array.isArray(points) || points.length < 2) return segments

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!doorway || doorway.edgeIndex !== index || doorway.width <= 0) {
      segments.push({ start: point, end: next, edgeIndex: index, type: 'wall' })
      return
    }

    const edgeLength = distance(point, next)
    if (doorway.offset < 0 || doorway.offset + doorway.width > edgeLength + EPSILON) {
      segments.push({ start: point, end: next, edgeIndex: index, type: 'wall' })
      return
    }

    const openingStart = getPointAlongEdge(points, index, doorway.offset)
    const openingEnd = getPointAlongEdge(points, index, doorway.offset + doorway.width)
    if (distance(point, openingStart) > EPSILON) {
      segments.push({ start: point, end: openingStart, edgeIndex: index, type: 'wall' })
    }
    segments.push({ start: openingStart, end: openingEnd, edgeIndex: index, type: 'door' })
    if (distance(openingEnd, next) > EPSILON) {
      segments.push({ start: openingEnd, end: next, edgeIndex: index, type: 'wall' })
    }
  })

  return segments
}

export const validateBathroomPodLayout = (pod) => {
  const points = pod?.layout || []
  const drain = getDrainFixture(pod?.fixtures || [])
  const errors = []

  if (points.length < 3) errors.push('Pod layout must have at least 3 segments.')
  if (points.length > BATHROOM_POD_MAX_SEGMENTS) errors.push(`Pod layout cannot exceed ${BATHROOM_POD_MAX_SEGMENTS} segments.`)
  if (hasDuplicatePoints(points)) errors.push('Pod layout cannot contain duplicate vertices.')
  if (Math.abs(polygonArea(points)) < EPSILON) errors.push('Pod layout area must be greater than 0.')
  if (hasSelfIntersections(points)) errors.push('Pod layout cannot self-intersect.')

  if (drain && !isPointInsidePolygon(drain, points)) {
    errors.push('Drain must be inside the pod layout.')
  }

  if (drain && pod?.slopeBox && !isRotatedBoxInsidePolygon(drain, pod.slopeBox, points)) {
    errors.push('GFRC slope box must stay inside the pod layout.')
  }

  const doorValidation = validateDoorOpening(pod)
  if (!doorValidation.valid) errors.push(doorValidation.message)

  return {
    valid: errors.length === 0,
    errors
  }
}

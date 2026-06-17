import {
  bathroomPodFixtureTypes,
  bathroomPodTemplates,
  createBathroomPodFromTemplate
} from '../types/bathroomPod'
import {
  getFixtureCounts,
  hasSelfIntersections,
  isPointInsidePolygon,
  isRotatedBoxInsidePolygon,
  validateBathroomPodLayout,
  validateDoorOpening
} from './bathroomPodGeometry'

describe('bathroom pod geometry', () => {
  test('accepts valid starter templates', () => {
    bathroomPodTemplates.forEach(template => {
      const pod = createBathroomPodFromTemplate(template.id)
      const result = validateBathroomPodLayout(pod)

      expect(pod.layout.length).toBeLessThanOrEqual(10)
      expect(result.valid).toBe(true)
    })
  })

  test('rejects layouts with more than 10 wall faces', () => {
    const pod = createBathroomPodFromTemplate('standard')
    pod.layout = Array.from({ length: 11 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 11
      return {
        x: Math.round(Math.cos(angle) * 60 + 80),
        y: Math.round(Math.sin(angle) * 60 + 80)
      }
    })

    const result = validateBathroomPodLayout(pod)

    expect(result.valid).toBe(false)
    expect(result.errors.some(error => error.includes('10 wall faces'))).toBe(true)
  })

  test('rejects self-intersecting loops', () => {
    const bowTie = [
      { x: 0, y: 0 },
      { x: 80, y: 80 },
      { x: 0, y: 80 },
      { x: 80, y: 0 }
    ]

    expect(hasSelfIntersections(bowTie)).toBe(true)
  })

  test('detects points inside and outside pod polygons', () => {
    const pod = createBathroomPodFromTemplate('standard')

    expect(isPointInsidePolygon({ x: 48, y: 60 }, pod.layout)).toBe(true)
    expect(isPointInsidePolygon({ x: 140, y: 60 }, pod.layout)).toBe(false)
  })

  test('validates rotated slope box containment', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const drain = pod.fixtures.find(fixture => fixture.type === 'drain')

    expect(isRotatedBoxInsidePolygon(drain, { width: 36, length: 36, rotation: 35 }, pod.layout)).toBe(true)
    expect(isRotatedBoxInsidePolygon(drain, { width: 140, length: 36, rotation: 35 }, pod.layout)).toBe(false)
  })

  test('validates doorway opening fit on selected wall face', () => {
    const pod = createBathroomPodFromTemplate('standard')
    pod.doorway = { edgeIndex: 0, offset: 20, width: 36, height: 84 }
    expect(validateDoorOpening(pod).valid).toBe(true)

    pod.doorway = { edgeIndex: 0, offset: 80, width: 36, height: 84 }
    expect(validateDoorOpening(pod).valid).toBe(false)
  })

  test('counts fixture markers by type and total', () => {
    const fixtures = bathroomPodFixtureTypes.map((type, index) => ({
      id: `${type.value}_${index}`,
      type: type.value,
      x: 10 + index,
      y: 10 + index
    }))

    const counts = getFixtureCounts(fixtures)

    expect(counts.total).toBe(bathroomPodFixtureTypes.length)
    expect(counts.drain).toBe(1)
    expect(counts.toilet).toBe(1)
  })
})

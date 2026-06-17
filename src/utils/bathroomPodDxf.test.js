import {
  createBathroomPodFromImportedType,
  createBathroomPodTypeFromImport,
  getBathroomPodTypeNameFromFile,
  parseBathroomPodDxf
} from './bathroomPodDxf'

const createLwPolylineEntity = (points, { closed = true, bulges = {} } = {}) => {
  const lines = [
    '0',
    'LWPOLYLINE',
    '90',
    String(points.length),
    '70',
    closed ? '1' : '0'
  ]

  points.forEach((point, index) => {
    lines.push('10', String(point.x), '20', String(point.y))
    if (bulges[index] !== undefined) {
      lines.push('42', String(bulges[index]))
    }
  })

  return lines
}

const wrapEntities = (...entities) => [
  '0',
  'SECTION',
  '2',
  'ENTITIES',
  ...entities.flat(),
  '0',
  'ENDSEC',
  '0',
  'EOF'
].join('\n')

describe('bathroom pod DXF import', () => {
  test('maps DXF filenames to readable pod type names', () => {
    expect(getBathroomPodTypeNameFromFile('POD_TYPE-01.dxf')).toBe('POD TYPE 01')
  })

  test('accepts closed straight polylines and creates imported pod types', () => {
    const dxf = wrapEntities(
      createLwPolylineEntity([
        { x: 0, y: 0 },
        { x: 96, y: 0 },
        { x: 96, y: 120 },
        { x: 0, y: 120 }
      ]),
      createLwPolylineEntity([
        { x: 0, y: 0 },
        { x: 72, y: 0 },
        { x: 72, y: 96 },
        { x: 0, y: 96 }
      ])
    )

    const preview = parseBathroomPodDxf(dxf, 'Standard Pod Type.dxf')
    const podType = createBathroomPodTypeFromImport(preview)
    const pod = createBathroomPodFromImportedType(podType)

    expect(preview.acceptedOutlines).toHaveLength(2)
    expect(preview.rejectedOutlines).toHaveLength(0)
    expect(podType.name).toBe('Standard Pod Type')
    expect(podType.defaultLayout).toHaveLength(4)
    expect(pod.layout).toEqual(podType.defaultLayout)
    expect(pod.templateId).toBe(podType.id)
  })

  test('rejects curved, open, and over-wall-face-limit DXF boundaries', () => {
    const overSegmentPoints = Array.from({ length: 11 }, (_, index) => ({
      x: index * 12,
      y: index % 2 === 0 ? 0 : 12
    }))

    const dxf = wrapEntities(
      createLwPolylineEntity(
        [
          { x: 0, y: 0 },
          { x: 96, y: 0 },
          { x: 96, y: 120 },
          { x: 0, y: 120 }
        ],
        { bulges: { 1: 0.5 } }
      ),
      createLwPolylineEntity(
        [
          { x: 0, y: 0 },
          { x: 96, y: 0 },
          { x: 96, y: 120 },
          { x: 0, y: 120 }
        ],
        { closed: false }
      ),
      createLwPolylineEntity(overSegmentPoints)
    )

    const preview = parseBathroomPodDxf(dxf, 'Rejected Type.dxf')
    const rejectionReasons = preview.rejectedOutlines.map(rejection => rejection.reason)

    expect(preview.acceptedOutlines).toHaveLength(0)
    expect(rejectionReasons).toEqual(expect.arrayContaining([
      'Curved DXF wall faces are not supported.',
      'DXF outline must be a closed polyline.',
      'Outline exceeds the 10 wall face limit.'
    ]))
  })
})

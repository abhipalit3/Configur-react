import {
  getDrainFixture,
  getPolygonBounds,
  getRotatedBoxCorners,
  getWallSegmentsWithDoor,
  validateBathroomPodLayout,
  validateDoorOpening
} from './bathroomPodGeometry'
import { deriveBathroomPodPrecon } from './bathroomPodPrecon'

const INCH_TO_METERS = 0.0254

const formatNumber = (value) => {
  const numericValue = Number(value) || 0
  return Number.isInteger(numericValue)
    ? `${numericValue}.`
    : `${Math.round(numericValue * 1000000) / 1000000}`
}

const quoteIfcString = (value = '') => `'${String(value).replace(/'/g, "''")}'`

const randomGuid = () => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let guid = ''
  for (let index = 0; index < 22; index += 1) {
    guid += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return guid
}

const toMeters = (valueInInches = 0) => (Number(valueInInches) || 0) * INCH_TO_METERS

const toIfcPoint2D = (writer, point) => writer.add('IFCCARTESIANPOINT', `((${formatNumber(toMeters(point.x))},${formatNumber(toMeters(point.y))}))`)
const toIfcPoint3D = (writer, point) => writer.add('IFCCARTESIANPOINT', `((${formatNumber(toMeters(point.x))},${formatNumber(toMeters(point.y))},${formatNumber(toMeters(point.z || 0))}))`)

const createWriter = () => {
  let nextId = 1
  const entities = []

  return {
    add(type, args) {
      const ref = `#${nextId}`
      entities.push(`${ref}=${type}${args};`)
      nextId += 1
      return ref
    },
    toString() {
      return entities.join('\n')
    }
  }
}

const buildPolylineRef = (writer, points = []) => {
  const refs = points.map(point => toIfcPoint2D(writer, point))
  if (points.length) {
    refs.push(refs[0])
  }
  return writer.add('IFCPOLYLINE', `((${refs.join(',')}))`)
}

const buildClosedProfile = (writer, points = []) => {
  const polylineRef = buildPolylineRef(writer, points)
  return writer.add('IFCARBITRARYCLOSEDPROFILEDEF', `(.AREA.,$,${polylineRef})`)
}

const buildBodyShape = (writer, bodyContextRef, itemRefs = []) => {
  const shapeRef = writer.add('IFCSHAPEREPRESENTATION', `(${bodyContextRef},'Body','SweptSolid',(${itemRefs.join(',')}))`)
  return writer.add('IFCPRODUCTDEFINITIONSHAPE', `($,$,(${shapeRef}))`)
}

const buildProxyShape = (writer, bodyContextRef, itemRefs = []) => {
  const shapeRef = writer.add('IFCSHAPEREPRESENTATION', `(${bodyContextRef},'Body','Tessellation',(${itemRefs.join(',')}))`)
  return writer.add('IFCPRODUCTDEFINITIONSHAPE', `($,$,(${shapeRef}))`)
}

const buildRectangleSolid = (writer, { width, depth, height, placementRef }) => {
  const profile2DOrigin = writer.add('IFCCARTESIANPOINT', `((0.,0.))`)
  const profile2DPlacement = writer.add('IFCAXIS2PLACEMENT2D', `(${profile2DOrigin},$)`)
  const rectangleProfile = writer.add(
    'IFCRECTANGLEPROFILEDEF',
    `(.AREA.,$,${profile2DPlacement},${formatNumber(width)},${formatNumber(depth)})`
  )
  const extrudeDirection = writer.add('IFCDIRECTION', `((0.,0.,1.))`)
  return writer.add(
    'IFCEXTRUDEDAREASOLID',
    `(${rectangleProfile},${placementRef},${extrudeDirection},${formatNumber(height)})`
  )
}

const buildCylinderSolid = (writer, { radius, height, placementRef }) => {
  const profile2DOrigin = writer.add('IFCCARTESIANPOINT', `((0.,0.))`)
  const profile2DPlacement = writer.add('IFCAXIS2PLACEMENT2D', `(${profile2DOrigin},$)`)
  const circleProfile = writer.add(
    'IFCCIRCLEPROFILEDEF',
    `(.AREA.,${profile2DPlacement},${formatNumber(radius)})`
  )
  const extrudeDirection = writer.add('IFCDIRECTION', `((0.,0.,1.))`)
  return writer.add(
    'IFCEXTRUDEDAREASOLID',
    `(${circleProfile},${placementRef},${extrudeDirection},${formatNumber(height)})`
  )
}

const buildLocalPlacement = (writer, point, xDirection = { x: 1, y: 0, z: 0 }, parentPlacement = '$') => {
  const locationRef = toIfcPoint3D(writer, point)
  const axisRef = writer.add('IFCDIRECTION', `((0.,0.,1.))`)
  const refDirectionRef = writer.add(
    'IFCDIRECTION',
    `((${formatNumber(xDirection.x)},${formatNumber(xDirection.y)},${formatNumber(xDirection.z || 0)}))`
  )
  const placement3DRef = writer.add('IFCAXIS2PLACEMENT3D', `(${locationRef},${axisRef},${refDirectionRef})`)
  return writer.add('IFCLOCALPLACEMENT', `(${parentPlacement},${placement3DRef})`)
}

const buildPropertySet = (writer, ownerHistoryRef, name, values = {}) => {
  const propertyRefs = Object.entries(values).map(([key, value]) => {
    const label = typeof value === 'number'
      ? `IFCREAL(${formatNumber(value)})`
      : `IFCLABEL(${quoteIfcString(value)})`
    return writer.add(
      'IFCPROPERTYSINGLEVALUE',
      `(${quoteIfcString(key)},$,
${label},$)`
    )
  })
  return writer.add(
    'IFCPROPERTYSET',
    `(${quoteIfcString(randomGuid())},${ownerHistoryRef},${quoteIfcString(name)},$,(${propertyRefs.join(',')}))`
  )
}

export const bathroomPodExportFormats = [
  {
    value: 'ifc',
    label: 'IFC for Revit',
    enabled: true,
    description: 'Writes an IFC model and a JSON sidecar for coordination.'
  },
  {
    value: 'driveworks',
    label: 'DriveWorks Connector',
    enabled: true,
    description: 'Writes a DriveWorks-ready JSON payload and connector script scaffold.'
  },
  {
    value: 'fusion',
    label: 'Fusion 360 Adapter',
    enabled: false,
    description: 'Framework only for now.'
  }
]

export const buildBathroomPodExportPackage = (pod = {}, options = {}) => {
  const validation = validateBathroomPodLayout(pod)
  if (!validation.valid) {
    throw new Error(validation.errors[0])
  }

  const doorValidation = validateDoorOpening(pod)
  if (!doorValidation.valid) {
    throw new Error(doorValidation.message)
  }

  const drain = getDrainFixture(pod.fixtures || [])
  const wallSegments = getWallSegmentsWithDoor(pod.layout || [], pod.doorway)
  const slopeCorners = drain
    ? getRotatedBoxCorners(drain, pod.slopeBox.width, pod.slopeBox.length, pod.slopeBox.rotation)
    : []
  const precon = deriveBathroomPodPrecon(pod)
  const bounds = getPolygonBounds(pod.layout || [])

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      app: 'Configur',
      version: 'bathroom-pod-local-v1',
      productType: 'bathroomPod',
      projectName: options.projectName || 'Untitled Project',
      sourceUnits: 'in',
      destinationLabel: options.projectLocation?.label || 'Browser Downloads',
      configurationId: pod.id || null
    },
    pod: {
      id: pod.id || null,
      name: pod.name || 'Bathroom Pod',
      templateId: pod.templateId || 'custom',
      structuralType: pod.structuralType,
      finishType: pod.finishType,
      layout: (pod.layout || []).map(point => ({ ...point })),
      heights: { ...(pod.heights || {}) },
      doorway: { ...(pod.doorway || {}) },
      coveEdgeIndex: pod.coveEdgeIndex,
      slopeBox: { ...(pod.slopeBox || {}) },
      fixtures: (pod.fixtures || []).map(fixture => ({ ...fixture }))
    },
    geometry: {
      bounds,
      wallSegments,
      drain,
      slopeCorners
    },
    validation,
    precon
  }
}

export const generateBathroomPodIfc = (exportPackage) => {
  const writer = createWriter()
  const ownerHistory = writer.add('IFCOWNERHISTORY', `($,$,$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)})`)
  const originPoint = toIfcPoint3D(writer, { x: 0, y: 0, z: 0 })
  const axisDirection = writer.add('IFCDIRECTION', '((0.,0.,1.))')
  const refDirection = writer.add('IFCDIRECTION', '((1.,0.,0.))')
  const worldPlacement = writer.add('IFCAXIS2PLACEMENT3D', `(${originPoint},${axisDirection},${refDirection})`)
  const modelContext = writer.add('IFCGEOMETRICREPRESENTATIONCONTEXT', `($,'Model',3,1.E-05,${worldPlacement},$)`)
  const bodyContext = writer.add(
    'IFCGEOMETRICREPRESENTATIONSUBCONTEXT',
    `('Body','Model',*,*,*,*,${modelContext},$,.MODEL_VIEW.,$)`
  )
  const lengthUnit = writer.add('IFCSIUNIT', '(*,.LENGTHUNIT.,$,.METRE.)')
  const areaUnit = writer.add('IFCSIUNIT', '(*,.AREAUNIT.,$,.SQUARE_METRE.)')
  const unitAssignment = writer.add('IFCUNITASSIGNMENT', `((${lengthUnit},${areaUnit}))`)
  const project = writer.add(
    'IFCPROJECT',
    `(${quoteIfcString(randomGuid())},${ownerHistory},${quoteIfcString(exportPackage.metadata.projectName)},$,$,$,$,(${modelContext}),${unitAssignment})`
  )
  const sitePlacement = writer.add('IFCLOCALPLACEMENT', `($,${worldPlacement})`)
  const site = writer.add(
    'IFCSITE',
    `(${quoteIfcString(randomGuid())},${ownerHistory},'Default Site',$,$,${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)`
  )
  const buildingPlacement = writer.add('IFCLOCALPLACEMENT', `(${sitePlacement},${worldPlacement})`)
  const building = writer.add(
    'IFCBUILDING',
    `(${quoteIfcString(randomGuid())},${ownerHistory},'Bathroom Pod Building',$,$,${buildingPlacement},$,$,.ELEMENT.,$,$,$)`
  )
  const storeyPlacement = writer.add('IFCLOCALPLACEMENT', `(${buildingPlacement},${worldPlacement})`)
  const storey = writer.add(
    'IFCBUILDINGSTOREY',
    `(${quoteIfcString(randomGuid())},${ownerHistory},'Coordination Level',$,$,${storeyPlacement},$,$,.ELEMENT.,0.)`
  )
  writer.add('IFCRELAGGREGATES', `(${quoteIfcString(randomGuid())},${ownerHistory},$,$,${project},(${site}))`)
  writer.add('IFCRELAGGREGATES', `(${quoteIfcString(randomGuid())},${ownerHistory},$,$,${site},(${building}))`)
  writer.add('IFCRELAGGREGATES', `(${quoteIfcString(randomGuid())},${ownerHistory},$,$,${building},(${storey}))`)

  const slabProfile = buildClosedProfile(writer, exportPackage.pod.layout)
  const slabPlacement = buildLocalPlacement(writer, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, storeyPlacement)
  const slabSolid = writer.add(
    'IFCEXTRUDEDAREASOLID',
    `(${slabProfile},${worldPlacement},${axisDirection},${formatNumber(toMeters(4))})`
  )
  const slabShape = buildBodyShape(writer, bodyContext, [slabSolid])
  const slab = writer.add(
    'IFCSLAB',
    `(${quoteIfcString(randomGuid())},${ownerHistory},${quoteIfcString(exportPackage.pod.name || 'Bathroom Pod Floor')},$,$,${slabPlacement},${slabShape},$,.FLOOR.)`
  )

  const elementRefs = [slab]
  const overallHeightMeters = toMeters(exportPackage.pod.heights?.overall || 108)
  const wallThicknessMeters = toMeters(4)

  exportPackage.geometry.wallSegments
    .filter(segment => segment.type === 'wall')
    .forEach((segment, index) => {
      const dx = segment.end.x - segment.start.x
      const dy = segment.end.y - segment.start.y
      const lengthMeters = toMeters(Math.sqrt(dx * dx + dy * dy))
      const direction = {
        x: dx === 0 && dy === 0 ? 1 : dx / Math.sqrt(dx * dx + dy * dy),
        y: dx === 0 && dy === 0 ? 0 : dy / Math.sqrt(dx * dx + dy * dy),
        z: 0
      }
      const wallPlacement = buildLocalPlacement(
        writer,
        { x: segment.start.x, y: segment.start.y, z: 0 },
        direction,
        storeyPlacement
      )
      const wallSolid = buildRectangleSolid(writer, {
        width: lengthMeters,
        depth: wallThicknessMeters,
        height: overallHeightMeters,
        placementRef: worldPlacement
      })
      const wallShape = buildBodyShape(writer, bodyContext, [wallSolid])
      const wall = writer.add(
        'IFCWALL',
        `(${quoteIfcString(randomGuid())},${ownerHistory},${quoteIfcString(`Wall Face ${index + 1}`)},$,$,${wallPlacement},${wallShape},$,$)`
      )
      elementRefs.push(wall)
    })

  if (exportPackage.geometry.slopeCorners.length === 4 && exportPackage.geometry.drain) {
    const slopeProfile = buildClosedProfile(writer, exportPackage.geometry.slopeCorners)
    const slopeSolid = writer.add(
      'IFCEXTRUDEDAREASOLID',
      `(${slopeProfile},${worldPlacement},${axisDirection},${formatNumber(toMeters(Math.max(1, exportPackage.pod.slopeBox?.depth || 1)))})`
    )
    if (slopeSolid) {
      const slopeShape = buildBodyShape(writer, bodyContext, [slopeSolid])
      const slopePlacement = buildLocalPlacement(writer, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, storeyPlacement)
      const slopeProxy = writer.add(
        'IFCBUILDINGELEMENTPROXY',
        `(${quoteIfcString(randomGuid())},${ownerHistory},'GFRC Slope Zone',$,$,${slopePlacement},${slopeShape},$,$)`
      )
      elementRefs.push(slopeProxy)
    }
  }

  ;(exportPackage.pod.fixtures || []).forEach((fixture) => {
    const placement = buildLocalPlacement(writer, { x: fixture.x, y: fixture.y, z: 0 }, { x: 1, y: 0, z: 0 }, storeyPlacement)
    const cylinder = buildCylinderSolid(writer, {
      radius: fixture.type === 'drain' ? toMeters(2) : toMeters(3),
      height: fixture.type === 'drain' ? toMeters(1) : toMeters(6),
      placementRef: worldPlacement
    })
    const shape = buildBodyShape(writer, bodyContext, [cylinder])
    const proxy = writer.add(
      'IFCBUILDINGELEMENTPROXY',
      `(${quoteIfcString(randomGuid())},${ownerHistory},${quoteIfcString(fixture.label || fixture.type)},$,$,${placement},${shape},$,$)`
    )
    elementRefs.push(proxy)
  })

  writer.add(
    'IFCRELCONTAINEDINSPATIALSTRUCTURE',
    `(${quoteIfcString(randomGuid())},${ownerHistory},$,$,(${elementRefs.join(',')}),${storey})`
  )

  const podPropertySet = buildPropertySet(writer, ownerHistory, 'Pset_ConfigurBathroomPod', {
    StructuralType: exportPackage.pod.structuralType || 'monolithic',
    FinishType: exportPackage.pod.finishType || 'tile',
    PodHeightInches: exportPackage.pod.heights?.overall || 0,
    ClearHeightInches: exportPackage.pod.heights?.clear || 0,
    SlopeDepthInches: exportPackage.pod.slopeBox?.depth || 0,
    FixtureCount: exportPackage.precon.quantityDrivers.fixtureCount || 0,
    TotalCostPerPod: exportPackage.precon.derivedTotals.totalCostPerPod || 0
  })
  writer.add(
    'IFCRELDEFINESBYPROPERTIES',
    `(${quoteIfcString(randomGuid())},${ownerHistory},$,$,(${slab}),${podPropertySet})`
  )

  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('bathroom-pod.ifc','${exportPackage.metadata.exportedAt}',('Configur'),('Configur'),'Configur','Configur','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
${writer.toString()}
ENDSEC;
END-ISO-10303-21;
`
}

export const createBathroomPodExportFiles = (exportPackage, format = 'ifc') => {
  const safeName = (exportPackage.pod.name || 'bathroom-pod')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'bathroom-pod'

  if (format === 'driveworks') {
    const driveworksPayload = {
      metadata: {
        ...exportPackage.metadata,
        target: 'driveworks'
      },
      pod: {
        id: exportPackage.pod.id,
        name: exportPackage.pod.name,
        templateId: exportPackage.pod.templateId,
        structuralType: exportPackage.pod.structuralType,
        finishType: exportPackage.pod.finishType
      },
      parameters: {
        podHeightInches: exportPackage.pod.heights?.overall || 0,
        clearHeightInches: exportPackage.pod.heights?.clear || 0,
        floorBaseInches: exportPackage.pod.heights?.floorBase || 0,
        slopeDepthInches: exportPackage.pod.slopeBox?.depth || 0,
        slopeBoxWidthInches: exportPackage.pod.slopeBox?.width || 0,
        slopeBoxLengthInches: exportPackage.pod.slopeBox?.length || 0,
        doorwayWidthInches: exportPackage.pod.doorway?.width || 0,
        doorwayHeightInches: exportPackage.pod.doorway?.height || 0,
        doorwayOffsetInches: exportPackage.pod.doorway?.offset || 0,
        doorwayWallFace: (exportPackage.pod.doorway?.edgeIndex ?? -1) + 1,
        coveWallFace: (exportPackage.pod.coveEdgeIndex ?? -1) + 1,
        fixtureCount: exportPackage.precon.quantityDrivers?.fixtureCount || 0,
        totalCostPerPod: exportPackage.precon.derivedTotals?.totalCostPerPod || 0
      },
      layout: exportPackage.pod.layout || [],
      fixtures: exportPackage.pod.fixtures || []
    }

    const connectorScript = [
      '// DriveWorks connector scaffold generated by Configur',
      '// Replace the endpoint and auth handling with your DriveWorks environment values.',
      "const fs = require('fs')",
      '',
      `const payload = JSON.parse(fs.readFileSync('./${safeName}.driveworks.json', 'utf8'))`,
      '',
      'async function pushToDriveWorks() {',
      "  console.log(`Ready to send ${payload.pod.name} to DriveWorks.`)",
      '  console.log(payload)',
      '}',
      '',
      'pushToDriveWorks().catch((error) => {',
      '  console.error(error)',
      '  process.exit(1)',
      '})',
      ''
    ].join('\n')

    return [
      {
        name: `${safeName}.driveworks.json`,
        content: JSON.stringify(driveworksPayload, null, 2),
        mimeType: 'application/json;charset=utf-8'
      },
      {
        name: `${safeName}.driveworks.js`,
        content: connectorScript,
        mimeType: 'text/javascript;charset=utf-8'
      }
    ]
  }

  if (format !== 'ifc') {
    throw new Error('Selected export format is not available yet.')
  }

  return [
    {
      name: `${safeName}.ifc`,
      content: generateBathroomPodIfc(exportPackage),
      mimeType: 'application/x-step'
    },
    {
      name: `${safeName}.json`,
      content: JSON.stringify(exportPackage, null, 2),
      mimeType: 'application/json;charset=utf-8'
    }
  ]
}

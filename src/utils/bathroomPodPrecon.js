import {
  distance,
  getEdgeLength,
  getFixtureCounts,
  getPolygonSegments,
  polygonArea
} from './bathroomPodGeometry'

const PRECON_VERSION = '1.0.0'

const roundValue = (value, precision = 2) => {
  const factor = 10 ** precision
  return Math.round((Number(value) || 0) * factor) / factor
}

const toSquareFeet = (squareInches = 0) => roundValue((Number(squareInches) || 0) / 144, 2)
const toLinearFeet = (inches = 0) => roundValue((Number(inches) || 0) / 12, 2)

const findRowOverride = (rows = [], rowId) => rows.find(row => row.id === rowId) || {}

const SAFE_FORMULA_PATTERN = /^[0-9a-zA-Z_+\-*/().\s]+$/

export const bathroomPodPreconSections = [
  { id: 'flooring', label: 'Flooring' },
  { id: 'wallAssemblies', label: 'Wall Assemblies' },
  { id: 'ffe', label: 'FF&E' },
  { id: 'assemblyLabor', label: 'Assembly Labor' },
  { id: 'shippingCosts', label: 'Shipping Costs' }
]

export const bathroomPodPreconDefaults = {
  version: PRECON_VERSION,
  inputs: {
    laborRate: 85,
    materialRate: 1,
    equipmentRate: 240,
    overheadPct: 12,
    markupPct: 10,
    contingencyPct: 5,
    podQuantity: 1,
    wasteFactor: 0.05,
    regionFactor: 1
  },
  costRows: [
    {
      id: 'gfrcFloor',
      section: 'flooring',
      costCode: 'GFRC-100',
      category: 'material',
      description: 'GFRC floor panel',
      unit: 'SF',
      quantityFormula: 'floorAreaSqFt * podQuantity',
      unitRate: 24,
      rateKey: 'materialRate',
      wasteFactor: 0.05,
      source: 'default'
    },
    {
      id: 'wallAssembly',
      section: 'wallAssemblies',
      costCode: 'WALL-210',
      category: 'material',
      description: 'Wall assembly',
      unit: 'SF',
      quantityFormula: 'wallAreaSqFt * podQuantity',
      unitRate: 32,
      rateKey: 'materialRate',
      wasteFactor: 0.05,
      source: 'default'
    },
    {
      id: 'tileFinish',
      section: 'ffe',
      costCode: 'FIN-300',
      category: 'material',
      description: 'Finish buildout',
      unit: 'SF',
      quantityFormula: 'tileFinishAreaSqFt * podQuantity',
      unitRate: 18,
      rateKey: 'materialRate',
      wasteFactor: 0.08,
      source: 'default'
    },
    {
      id: 'doorwayFraming',
      section: 'wallAssemblies',
      costCode: 'DOOR-410',
      category: 'material',
      description: 'Doorway framing',
      unit: 'EA',
      quantityFormula: 'doorwayCount * podQuantity',
      unitRate: 450,
      rateKey: 'materialRate',
      wasteFactor: 0,
      source: 'default'
    },
    {
      id: 'drainSlope',
      section: 'flooring',
      costCode: 'GFRC-220',
      category: 'material',
      description: 'Drain and slope buildout',
      unit: 'SF',
      quantityFormula: 'slopeBoxAreaSqFt * podQuantity',
      unitRate: 28,
      rateKey: 'materialRate',
      wasteFactor: 0.05,
      source: 'default'
    },
    {
      id: 'fixtures',
      section: 'ffe',
      costCode: 'FIX-500',
      category: 'material',
      description: 'FF&E package',
      unit: 'EA',
      quantityFormula: 'fixtureCount * podQuantity',
      unitRate: 180,
      rateKey: 'materialRate',
      wasteFactor: 0.02,
      source: 'default'
    },
    {
      id: 'assemblyLabor',
      section: 'assemblyLabor',
      costCode: 'LAB-100',
      category: 'labor',
      description: 'Assembly labor',
      unit: 'HR',
      quantityFormula: 'assemblyHours',
      unitRate: 1,
      rateKey: 'laborRate',
      wasteFactor: 0,
      source: 'default'
    },
    {
      id: 'riggingEquipment',
      section: 'shippingCosts',
      costCode: 'EQP-200',
      category: 'equipment',
      description: 'Shipping and handling',
      unit: 'DAY',
      quantityFormula: 'equipmentDays',
      unitRate: 1,
      rateKey: 'equipmentRate',
      wasteFactor: 0,
      source: 'default'
    }
  ]
}

export const createBathroomPodPreconDefaults = () => ({
  version: PRECON_VERSION,
  inputs: { ...bathroomPodPreconDefaults.inputs },
  costRows: bathroomPodPreconDefaults.costRows.map(row => ({ ...row })),
  quantityDrivers: {},
  derivedTotals: {}
})

export const getBathroomPodQuantityDrivers = (pod = {}) => {
  const layout = pod.layout || []
  const fixtureCounts = getFixtureCounts(pod.fixtures || [])
  const perimeterInches = getPolygonSegments(layout).reduce(
    (total, segment) => total + distance(segment.start, segment.end),
    0
  )
  const clearHeightFeet = toLinearFeet(pod.heights?.clear || 0)
  const floorAreaSqFt = toSquareFeet(Math.abs(polygonArea(layout)))
  const wallAreaSqFt = roundValue(toLinearFeet(perimeterInches) * clearHeightFeet, 2)
  const slopeBoxAreaSqFt = toSquareFeet((pod.slopeBox?.width || 0) * (pod.slopeBox?.length || 0))
  const selectedCoveLengthLft = toLinearFeet(getEdgeLength(layout, pod.coveEdgeIndex || 0))
  const doorwayCount = pod.doorway?.width > 0 ? 1 : 0
  const podQuantity = Math.max(1, parseFloat(pod.precon?.inputs?.podQuantity) || 1)
  const tileFinishAreaSqFt = roundValue(
    floorAreaSqFt + (
      (pod.finishType || 'tile') === 'tile'
        ? wallAreaSqFt * 0.35
        : wallAreaSqFt * 0.15
    ),
    2
  )
  const fixtureCount = fixtureCounts.total || 0
  const assemblyHours = roundValue(
    (
      floorAreaSqFt * 0.18 +
      wallAreaSqFt * 0.12 +
      slopeBoxAreaSqFt * 0.35 +
      fixtureCount * 1.75 +
      doorwayCount * 1.25
    ) * podQuantity,
    2
  )
  const equipmentDays = roundValue(
    Math.max(0.25, (floorAreaSqFt + wallAreaSqFt) / 160) * podQuantity,
    2
  )

  return {
    floorAreaSqFt,
    perimeterLft: toLinearFeet(perimeterInches),
    wallAreaSqFt,
    slopeBoxAreaSqFt,
    tileFinishAreaSqFt,
    coveLengthLft: selectedCoveLengthLft,
    fixtureCount,
    doorwayCount,
    drainCount: fixtureCounts.drain || 0,
    toiletCount: fixtureCounts.toilet || 0,
    lavatoryCount: fixtureCounts.lavatory || 0,
    showerCount: fixtureCounts.shower || 0,
    accessoryCount: fixtureCounts.accessory || 0,
    otherFixtureCount: fixtureCounts.other || 0,
    assemblyHours,
    equipmentDays,
    podQuantity
  }
}

export const evaluateBathroomPodFormula = (expression, context = {}) => {
  const safeExpression = (expression || '0').trim()
  if (!safeExpression) return 0
  if (!SAFE_FORMULA_PATTERN.test(safeExpression)) return 0

  try {
    const argNames = Object.keys(context)
    const argValues = Object.values(context).map(value => Number(value) || 0)
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(...argNames, `return (${safeExpression});`)
    return Number(evaluator(...argValues)) || 0
  } catch (error) {
    return 0
  }
}

export const deriveBathroomPodPrecon = (pod = {}) => {
  const defaults = createBathroomPodPreconDefaults()
  const existing = pod.precon || {}
  const inputs = {
    ...defaults.inputs,
    ...(existing.inputs || {})
  }

  const quantityDrivers = getBathroomPodQuantityDrivers({
    ...pod,
    precon: {
      ...(existing || {}),
      inputs
    }
  })

  const formulaContext = {
    ...inputs,
    ...quantityDrivers
  }

  const costRows = defaults.costRows.map(defaultRow => {
    const override = findRowOverride(existing.costRows || [], defaultRow.id)
    const row = {
      ...defaultRow,
      ...override
    }
    const rawQuantity = evaluateBathroomPodFormula(row.quantityFormula, formulaContext)
    const quantityMultiplier = row.category === 'material'
      ? 1 + (row.wasteFactor ?? inputs.wasteFactor ?? 0)
      : 1
    const quantity = roundValue(rawQuantity * quantityMultiplier, 2)
    const rateBase = row.rateKey ? (inputs[row.rateKey] || 0) : 1
    const unitRate = roundValue((row.unitRate || 0) * rateBase * (inputs.regionFactor || 1), 2)
    const subtotal = roundValue(quantity * unitRate, 2)

    return {
      ...row,
      quantity,
      unitRate,
      subtotal
    }
  })

  const directMaterialCost = roundValue(
    costRows.filter(row => row.category === 'material').reduce((total, row) => total + row.subtotal, 0),
    2
  )
  const directLaborCost = roundValue(
    costRows.filter(row => row.category === 'labor').reduce((total, row) => total + row.subtotal, 0),
    2
  )
  const directEquipmentCost = roundValue(
    costRows.filter(row => row.category === 'equipment').reduce((total, row) => total + row.subtotal, 0),
    2
  )
  const directCost = roundValue(directMaterialCost + directLaborCost + directEquipmentCost, 2)
  const overheadCost = roundValue(directCost * ((inputs.overheadPct || 0) / 100), 2)
  const markupCost = roundValue((directCost + overheadCost) * ((inputs.markupPct || 0) / 100), 2)
  const contingencyCost = roundValue(
    (directCost + overheadCost + markupCost) * ((inputs.contingencyPct || 0) / 100),
    2
  )
  const totalCost = roundValue(directCost + overheadCost + markupCost + contingencyCost, 2)
  const totalCostPerPod = roundValue(totalCost / Math.max(1, quantityDrivers.podQuantity || 1), 2)

  return {
    version: PRECON_VERSION,
    inputs,
    quantityDrivers,
    costRows,
    derivedTotals: {
      directMaterialCost,
      directLaborCost,
      directEquipmentCost,
      directCost,
      overheadCost,
      markupCost,
      contingencyCost,
      totalCost,
      totalCostPerPod
    }
  }
}

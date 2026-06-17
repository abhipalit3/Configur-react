import { createBathroomPodFromTemplate } from '../types/bathroomPod'
import {
  deriveBathroomPodPrecon,
  evaluateBathroomPodFormula,
  getBathroomPodQuantityDrivers
} from './bathroomPodPrecon'

describe('bathroom pod precon', () => {
  test('derives quantity drivers from the standard pod geometry', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const drivers = getBathroomPodQuantityDrivers(pod)

    expect(drivers.floorAreaSqFt).toBeCloseTo(80, 2)
    expect(drivers.perimeterLft).toBeCloseTo(36, 2)
    expect(drivers.wallAreaSqFt).toBeCloseTo(288, 2)
    expect(drivers.slopeBoxAreaSqFt).toBeCloseTo(9, 2)
    expect(drivers.coveLengthLft).toBeCloseTo(8, 2)
    expect(drivers.fixtureCount).toBe(1)
    expect(drivers.assemblyHours).toBeCloseTo(55.11, 2)
    expect(drivers.equipmentDays).toBeCloseTo(2.3, 2)
  })

  test('derives total cost per pod from default cost rows', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const precon = deriveBathroomPodPrecon(pod)

    expect(precon.costRows).toHaveLength(8)
    expect(precon.derivedTotals.directMaterialCost).toBeCloseTo(16105.68, 2)
    expect(precon.derivedTotals.directLaborCost).toBeCloseTo(4684.35, 2)
    expect(precon.derivedTotals.directEquipmentCost).toBeCloseTo(552, 2)
    expect(precon.derivedTotals.totalCostPerPod).toBeCloseTo(27608.05, 2)
  })

  test('returns 0 for invalid formulas instead of throwing', () => {
    expect(evaluateBathroomPodFormula('floorAreaSqFt + bad()', { floorAreaSqFt: 80 })).toBe(0)
    expect(evaluateBathroomPodFormula('floorAreaSqFt + [1]', { floorAreaSqFt: 80 })).toBe(0)
  })
})

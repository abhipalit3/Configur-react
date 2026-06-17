import { createBathroomPodFromTemplate } from '../types/bathroomPod'
import {
  buildBathroomPodExportPackage,
  createBathroomPodExportFiles
} from './bathroomPodExport'

describe('bathroom pod export', () => {
  test('builds a canonical export package with geometry and precon data', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const exportPackage = buildBathroomPodExportPackage(pod, {
      projectName: 'Local Pod Project',
      projectLocation: {
        mode: 'download',
        label: 'Browser Downloads'
      }
    })

    expect(exportPackage.metadata.projectName).toBe('Local Pod Project')
    expect(exportPackage.metadata.destinationLabel).toBe('Browser Downloads')
    expect(exportPackage.geometry.wallSegments.length).toBeGreaterThan(0)
    expect(exportPackage.geometry.drain.type).toBe('drain')
    expect(exportPackage.precon.derivedTotals.totalCostPerPod).toBeGreaterThan(0)
  })

  test('writes an IFC file and JSON sidecar for valid pods', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const exportPackage = buildBathroomPodExportPackage(pod)
    const files = createBathroomPodExportFiles(exportPackage, 'ifc')
    const ifcFile = files.find(file => file.name.endsWith('.ifc'))
    const jsonFile = files.find(file => file.name.endsWith('.json'))
    const jsonContent = JSON.parse(jsonFile.content)

    expect(files).toHaveLength(2)
    expect(ifcFile.content).toContain('IFCPROJECT')
    expect(ifcFile.content).toContain('IFCSLAB')
    expect(ifcFile.content).toContain('Pset_ConfigurBathroomPod')
    expect(jsonContent.pod.layout).toHaveLength(4)
    expect(jsonContent.precon.derivedTotals.totalCostPerPod).toBeGreaterThan(0)
  })

  test('writes a DriveWorks payload and connector script for valid pods', () => {
    const pod = createBathroomPodFromTemplate('standard')
    const exportPackage = buildBathroomPodExportPackage(pod)
    const files = createBathroomPodExportFiles(exportPackage, 'driveworks')
    const payloadFile = files.find(file => file.name.endsWith('.driveworks.json'))
    const scriptFile = files.find(file => file.name.endsWith('.driveworks.js'))
    const payloadContent = JSON.parse(payloadFile.content)

    expect(files).toHaveLength(2)
    expect(payloadContent.metadata.target).toBe('driveworks')
    expect(payloadContent.parameters.doorwayWallFace).toBeGreaterThan(0)
    expect(scriptFile.content).toContain('pushToDriveWorks')
  })

  test('rejects export packages for invalid pods', () => {
    const pod = createBathroomPodFromTemplate('standard')
    pod.layout = [
      { x: 0, y: 0 },
      { x: 96, y: 120 },
      { x: 0, y: 120 },
      { x: 96, y: 0 }
    ]

    expect(() => buildBathroomPodExportPackage(pod)).toThrow()
  })
})

import React, { useMemo } from 'react'
import {
  bathroomPodPreconSections,
  createBathroomPodPreconDefaults,
  deriveBathroomPodPrecon
} from '../../utils/bathroomPodPrecon'

import './bathroom-pod.css'

const clampNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formatCurrency = (value = 0) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
)

export default function BathroomPodPreconPanel({ pod, onChange }) {
  const precon = pod?.precon || createBathroomPodPreconDefaults()

  const groupedRows = useMemo(() => (
    bathroomPodPreconSections.map(section => ({
      ...section,
      rows: (precon.costRows || []).filter(row => row.section === section.id)
    })).filter(section => section.rows.length > 0)
  ), [precon.costRows])

  const syncPodState = (nextPod) => ({
    ...nextPod,
    precon: deriveBathroomPodPrecon({
      ...nextPod,
      precon: nextPod.precon || createBathroomPodPreconDefaults()
    })
  })

  const updatePodPrecon = (changes) => {
    onChange(syncPodState({
      ...pod,
      updatedAt: new Date().toISOString(),
      precon: {
        ...precon,
        ...changes
      }
    }))
  }

  const updatePreconInputs = (changes) => {
    updatePodPrecon({
      inputs: {
        ...precon.inputs,
        ...changes
      }
    })
  }

  const updatePreconRow = (rowId, changes) => {
    updatePodPrecon({
      costRows: (precon.costRows || []).map(row => (
        row.id === rowId
          ? { ...row, ...changes }
          : row
      ))
    })
  }

  return (
    <section className="bathroom-pod-precon-side-panel">
      <div className="bathroom-pod-precon-side-heading">
        <h2>Precon</h2>
        <span>Total / Pod {formatCurrency(precon.derivedTotals?.totalCostPerPod || 0)}</span>
      </div>

      <div className="bathroom-pod-precon-grid">
        <div className="bathroom-pod-precon-inputs">
          <label>
            <span>Labor Rate</span>
            <input type="number" min="0" value={precon.inputs.laborRate} onChange={(event) => updatePreconInputs({ laborRate: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Material Rate</span>
            <input type="number" min="0" step="0.01" value={precon.inputs.materialRate} onChange={(event) => updatePreconInputs({ materialRate: clampNumber(event.target.value, 1) })} />
          </label>
          <label>
            <span>Equipment Rate</span>
            <input type="number" min="0" value={precon.inputs.equipmentRate} onChange={(event) => updatePreconInputs({ equipmentRate: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Pod Quantity</span>
            <input type="number" min="1" value={precon.inputs.podQuantity} onChange={(event) => updatePreconInputs({ podQuantity: Math.max(1, clampNumber(event.target.value, 1)) })} />
          </label>
          <label>
            <span>Waste Factor</span>
            <input type="number" min="0" step="0.01" value={precon.inputs.wasteFactor} onChange={(event) => updatePreconInputs({ wasteFactor: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Region Factor</span>
            <input type="number" min="0.1" step="0.01" value={precon.inputs.regionFactor} onChange={(event) => updatePreconInputs({ regionFactor: clampNumber(event.target.value, 1) })} />
          </label>
          <label>
            <span>Overhead %</span>
            <input type="number" min="0" step="0.1" value={precon.inputs.overheadPct} onChange={(event) => updatePreconInputs({ overheadPct: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Markup %</span>
            <input type="number" min="0" step="0.1" value={precon.inputs.markupPct} onChange={(event) => updatePreconInputs({ markupPct: clampNumber(event.target.value, 0) })} />
          </label>
          <label>
            <span>Contingency %</span>
            <input type="number" min="0" step="0.1" value={precon.inputs.contingencyPct} onChange={(event) => updatePreconInputs({ contingencyPct: clampNumber(event.target.value, 0) })} />
          </label>
        </div>

        {groupedRows.map(section => (
          <div key={section.id} className="bathroom-pod-precon-group">
            <div className="bathroom-pod-precon-group-title">{section.label}</div>
            {section.rows.map(row => (
              <article key={row.id} className="bathroom-pod-precon-row">
                <header>
                  <strong>{row.description}</strong>
                  <span>{row.costCode}</span>
                </header>
                <div className="bathroom-pod-precon-row-grid">
                  <div>
                    <span>{row.unit} · {row.category}</span>
                    <span>{row.quantityFormula}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitRate}
                    onChange={(event) => updatePreconRow(row.id, { unitRate: clampNumber(event.target.value, 0) })}
                  />
                  <div>
                    <strong>{formatCurrency(row.subtotal)}</strong>
                    <span>{row.quantity} {row.unit}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}

        <div className="bathroom-pod-precon-summary">
          <div><span>Floor Area</span><strong>{precon.quantityDrivers?.floorAreaSqFt || 0} SF</strong></div>
          <div><span>Wall Area</span><strong>{precon.quantityDrivers?.wallAreaSqFt || 0} SF</strong></div>
          <div><span>Cove Length</span><strong>{precon.quantityDrivers?.coveLengthLft || 0} LF</strong></div>
          <div><span>Assembly Hours</span><strong>{precon.quantityDrivers?.assemblyHours || 0} HR</strong></div>
          <div><span>Total Cost</span><strong>{formatCurrency(precon.derivedTotals?.totalCost || 0)}</strong></div>
          <div><span>Total Cost / Pod</span><strong>{formatCurrency(precon.derivedTotals?.totalCostPerPod || 0)}</strong></div>
        </div>
      </div>
    </section>
  )
}

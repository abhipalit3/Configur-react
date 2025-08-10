import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { buildingShellDefaults } from '../../types/buildingShell'
import './app-manual-building.css'

const AppManualBuilding = (props) => {
  // State for form data with defaults
  const [formData, setFormData] = useState({
    ...buildingShellDefaults,
    ...props.initial
  })
  
  const [errors, setErrors] = useState({})

  // Update form when initial props change
  useEffect(() => {
    setFormData({
      ...buildingShellDefaults,
      ...props.initial
    })
  }, [props.initial])

  // Re-validate when form data changes
  useEffect(() => {
    const newErrors = {}
    
    const corridorWidthTotal = convertToFeet(formData.corridorWidth)
    const corridorHeightTotal = convertToFeet(formData.corridorHeight)
    const ceilingHeightTotal = convertToFeet(formData.ceilingHeight)
    const beamDepthTotal = convertToFeet(formData.beamDepth)
    
    if (corridorWidthTotal <= 0) newErrors.corridorWidth = 'Must be greater than 0'
    if (corridorHeightTotal <= 0) newErrors.corridorHeight = 'Must be greater than 0'
    if (ceilingHeightTotal <= 0) newErrors.ceilingHeight = 'Must be greater than 0'
    if (beamDepthTotal <= 0) newErrors.beamDepth = 'Must be greater than 0'
    if (ceilingHeightTotal > corridorHeightTotal) {
      newErrors.ceilingHeight = 'Cannot exceed corridor height'
    }
    if (formData.slabDepth <= 0) newErrors.slabDepth = 'Must be greater than 0'
    if (formData.wallThickness <= 0) newErrors.wallThickness = 'Must be greater than 0'
    
    setErrors(newErrors)
  }, [formData])

  // No unit conversion needed - everything is in feet/inches

  // Helper to convert feet+inches to total feet for comparison
  const convertToFeet = (feetInches) => {
    if (typeof feetInches === 'number') return feetInches;
    return feetInches.feet + (feetInches.inches / 12);
  }

  const validateForm = () => {
    const newErrors = {}
    
    const corridorWidthTotal = convertToFeet(formData.corridorWidth)
    const corridorHeightTotal = convertToFeet(formData.corridorHeight)
    const ceilingHeightTotal = convertToFeet(formData.ceilingHeight)
    const beamDepthTotal = convertToFeet(formData.beamDepth)
    
    if (corridorWidthTotal <= 0) newErrors.corridorWidth = 'Must be greater than 0'
    if (corridorHeightTotal <= 0) newErrors.corridorHeight = 'Must be greater than 0'
    if (ceilingHeightTotal <= 0) newErrors.ceilingHeight = 'Must be greater than 0'
    if (beamDepthTotal <= 0) newErrors.beamDepth = 'Must be greater than 0'
    if (ceilingHeightTotal > corridorHeightTotal) {
      newErrors.ceilingHeight = 'Cannot exceed corridor height'
    }
    if (formData.slabDepth <= 0) newErrors.slabDepth = 'Must be greater than 0'
    if (formData.wallThickness <= 0) newErrors.wallThickness = 'Must be greater than 0'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    setFormData(prev => ({ ...prev, [field]: numValue }))
  }

  // Handler for feet+inches input changes
  const handleFeetInchesChange = (field, type, value) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: numValue
      }
    }))
  }

  const handleSave = () => {
    if (validateForm() && props.onSave) {
      props.onSave(formData)
    }
  }

  const getUnitLabel = (type) => {
    return type === 'length' ? 'feet' : 'inches'
  }

  return (
    <div className={`app-manual-building-container ${props.rootClassName} `}>
      <div className="app-manual-building-heading">
        <h1 className="heading"> Building Shell Properties</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-manual-building-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      <div className="app-manual-building-title1">
        <span className="app-manual-building-text13 title">
          Floor to Deck Height
        </span>
      </div>
      <div className="app-manual-building-input1">
        <div className="feet-inches-input">
          <input
            type="number"
            value={formData.corridorHeight.feet}
            onChange={(e) => handleFeetInchesChange('corridorHeight', 'feet', e.target.value)}
            className={`app-manual-building-textinput1 input-form ${errors.corridorHeight ? 'error' : ''}`}
            min="0"
            step="1"
          />
          <span className="unit-label">ft</span>
          <input
            type="number"
            value={formData.corridorHeight.inches}
            onChange={(e) => handleFeetInchesChange('corridorHeight', 'inches', e.target.value)}
            className={`app-manual-building-textinput1 input-form ${errors.corridorHeight ? 'error' : ''}`}
            min="0"
            max="11"
            step="1"
          />
          <span className="unit-label">in</span>
        </div>
        {errors.corridorHeight && <span className="error-text">{errors.corridorHeight}</span>}
      </div>

      <div className="app-manual-building-title2">
        <span className="app-manual-building-text15 title">
          Beam/Joist Depth
        </span>
      </div>
      <div className="app-manual-building-input2">
        <div className="feet-inches-input">
          <input
            type="number"
            value={formData.beamDepth.feet}
            onChange={(e) => handleFeetInchesChange('beamDepth', 'feet', e.target.value)}
            className={`app-manual-building-textinput2 input-form ${errors.beamDepth ? 'error' : ''}`}
            min="0"
            step="1"
          />
          <span className="unit-label">ft</span>
          <input
            type="number"
            value={formData.beamDepth.inches}
            onChange={(e) => handleFeetInchesChange('beamDepth', 'inches', e.target.value)}
            className={`app-manual-building-textinput2 input-form ${errors.beamDepth ? 'error' : ''}`}
            min="0"
            max="11"
            step="1"
          />
          <span className="unit-label">in</span>
        </div>
        {errors.beamDepth && <span className="error-text">{errors.beamDepth}</span>}
      </div>

      <div className="app-manual-building-title3">
        <span className="app-manual-building-text15 title">
          Corridor Width
        </span>
      </div>
      <div className="app-manual-building-input3">
        <div className="feet-inches-input">
          <input
            type="number"
            value={formData.corridorWidth.feet}
            onChange={(e) => handleFeetInchesChange('corridorWidth', 'feet', e.target.value)}
            className={`app-manual-building-textinput3 input-form ${errors.corridorWidth ? 'error' : ''}`}
            min="0"
            step="1"
          />
          <span className="unit-label">ft</span>
          <input
            type="number"
            value={formData.corridorWidth.inches}
            onChange={(e) => handleFeetInchesChange('corridorWidth', 'inches', e.target.value)}
            className={`app-manual-building-textinput3 input-form ${errors.corridorWidth ? 'error' : ''}`}
            min="0"
            max="11"
            step="1"
          />
          <span className="unit-label">in</span>
        </div>
        {errors.corridorWidth && <span className="error-text">{errors.corridorWidth}</span>}
      </div>

      <div className="app-manual-building-title4">
        <span className="app-manual-building-text17 title">
          Ceiling Height
        </span>
      </div>
      <div className="app-manual-building-input4">
        <div className="feet-inches-input">
          <input
            type="number"
            value={formData.ceilingHeight.feet}
            onChange={(e) => handleFeetInchesChange('ceilingHeight', 'feet', e.target.value)}
            className={`app-manual-building-textinput4 input-form ${errors.ceilingHeight ? 'error' : ''}`}
            min="0"
            step="1"
          />
          <span className="unit-label">ft</span>
          <input
            type="number"
            value={formData.ceilingHeight.inches}
            onChange={(e) => handleFeetInchesChange('ceilingHeight', 'inches', e.target.value)}
            className={`app-manual-building-textinput4 input-form ${errors.ceilingHeight ? 'error' : ''}`}
            min="0"
            max="11"
            step="1"
          />
          <span className="unit-label">in</span>
        </div>
        {errors.ceilingHeight && <span className="error-text">{errors.ceilingHeight}</span>}
      </div>

      <div className="app-manual-building-save">
        <button
          type="button"
          className="app-manual-building-button save-button"
          onClick={handleSave}
          disabled={Object.keys(errors).length > 0}
        >
          <span className="app-manual-building-text19">Save</span>
        </button>
      </div>
    </div>
  )
}

AppManualBuilding.defaultProps = {
  rootClassName: '',
  initial: {},
  onSave: () => {},
  onClose: () => {}
}

AppManualBuilding.propTypes = {
  rootClassName: PropTypes.string,
  initial: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default AppManualBuilding

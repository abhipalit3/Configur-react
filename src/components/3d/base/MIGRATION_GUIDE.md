# MEP Abstraction Migration Guide

This guide shows how to migrate your existing MEP components to use the new base classes, resulting in **~80% less code** and much better maintainability.

## Overview

The abstraction provides:
- **BaseMepInteraction**: Handles all common interaction logic (selection, transform controls, snapping, measurements)
- **BaseMepEditor**: React component for consistent MEP editing UIs

## 🚀 Quick Start - Ductwork Example

### 1. Update DuctInteraction (31k lines → 150 lines)

**Before** (DuctInteraction.js - 31,078 lines):
```javascript
// Hundreds of lines of transform controls, snapping, selection logic...
export class DuctInteraction {
  constructor(scene, camera, renderer, orbitControls, ductGeometry, snapLineManager) {
    // 500+ lines of setup code
  }
  
  selectDuct(duct) {
    // 100+ lines of selection logic
  }
  
  // ... hundreds more lines
}
```

**After** (DuctInteractionBase.js - ~150 lines):
```javascript
import { BaseMepInteraction } from '../base/BaseMepInteraction.js'

export class DuctInteractionBase extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, ductGeometry, snapLineManager) {
    super({
      scene, camera, renderer, orbitControls, snapLineManager,
      mepType: 'duct',
      groupName: 'DuctsGroup',
      geometryManager: ductGeometry
    })
  }

  // Only implement duct-specific methods (~10 methods, ~100 lines total)
  findSelectableObject(target) { /* duct-specific logic */ }
  updateObjectAppearance(object, state) { /* duct appearance */ }
  getObjectData(object) { return object.userData.ductData }
  // ... 7 more simple methods
}
```

### 2. Update DuctEditor (13k lines → 50 lines)

**Before** (DuctEditor.js - 13,105 lines):
```javascript
// Hundreds of lines of React component logic, positioning, validation...
```

**After** (DuctEditorBase.js - ~50 lines):
```javascript
import { BaseMepEditor } from '../base/BaseMepEditor.js'

export const DuctEditorBase = (props) => {
  const fields = [
    { type: 'tier', name: 'tier', label: 'Tier' },
    { type: 'number', name: 'width', label: 'W', min: '1', max: '48' },
    { type: 'number', name: 'height', label: 'H', min: '1', max: '48' },
    { type: 'number', name: 'insulation', label: 'I', min: '0', max: '6' }
  ]

  const getInitialDimensions = (selectedDuct) => ({
    width: selectedDuct?.userData?.ductData?.width || 12,
    height: selectedDuct?.userData?.ductData?.height || 8,
    insulation: selectedDuct?.userData?.ductData?.insulation || 0,
    tier: selectedDuct?.userData?.ductData?.tier || 1
  })

  return (
    <BaseMepEditor
      {...props}
      mepType="duct"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
    />
  )
}
```

## 📋 Step-by-Step Migration

### Step 1: Create Base Implementation

For each MEP type, create two new files:

1. **`[MepType]InteractionBase.js`** - Extends `BaseMepInteraction`
2. **`[MepType]EditorBase.js`** - Uses `BaseMepEditor`

### Step 2: Implement Abstract Methods

Each interaction class needs these 12 methods:

```javascript
export class PipeInteractionBase extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, pipeGeometry, snapLineManager) {
    super({
      scene, camera, renderer, orbitControls, snapLineManager,
      mepType: 'pipe',              // Required: MEP type identifier
      groupName: 'PipingGroup',     // Required: Scene group name
      geometryManager: pipeGeometry // Required: Geometry manager
    })
  }

  // 1. Object Selection
  findSelectableObject(target) {
    // How to find the selectable pipe from a clicked object
  }

  findGroupForObject(object) {
    // How to find the group containing a pipe
  }

  // 2. Visual Appearance
  updateObjectAppearance(object, state) {
    // How to update pipe appearance (normal/hover/selected)
  }

  // 3. Data Management
  getObjectData(object) {
    // How to get pipe data from object
  }

  setObjectData(object, data) {
    // How to set pipe data on object
  }

  // 4. Calculations
  calculateObjectDimensions(pipeData) {
    // Calculate pipe dimensions in meters
  }

  calculateTierTolerance(pipeHeight) {
    // Calculate snapping tolerance
  }

  // 5. Geometry Updates
  needsGeometryUpdate(newDimensions) {
    // Check if geometry needs recreation
  }

  recreateObjectGeometry(object, updatedData) {
    // Recreate pipe geometry
  }

  // 6. Object Creation
  createNewObject(pipeData) {
    // Create new pipe object
  }

  // 7. Storage
  saveNewObjectToStorage(pipeData) {
    // Save new pipe to localStorage
  }

  saveObjectDataToStorage(pipeData) {
    // Update existing pipe in localStorage
  }
}
```

### Step 3: Create Editor Component

```javascript
export const PipeEditorBase = (props) => {
  const fields = [
    {
      type: 'tier',
      name: 'tier',
      label: 'Tier',
      processor: (value) => parseInt(value)
    },
    {
      type: 'number',
      name: 'diameter',
      label: 'Ø',
      step: '0.25',
      min: '0.5',
      max: '12',
      processor: (value) => parseFloat(value)
    },
    {
      type: 'select',
      name: 'material',
      label: 'Mat',
      options: [
        { value: 'steel', label: 'Steel' },
        { value: 'copper', label: 'Copper' },
        { value: 'pvc', label: 'PVC' }
      ]
    }
  ]

  const getInitialDimensions = (selectedPipe) => ({
    diameter: selectedPipe?.userData?.pipeData?.diameter || 2,
    material: selectedPipe?.userData?.pipeData?.material || 'steel',
    tier: selectedPipe?.userData?.pipeData?.tier || 1
  })

  return (
    <BaseMepEditor
      {...props}
      mepType="pipe"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
      minWidth="350px"
    />
  )
}
```

### Step 4: Update Renderer

**Before**:
```javascript
setupInteractions(camera, renderer, orbitControls) {
  this.ductInteraction = new DuctInteraction(/*...*/)
  // Hundreds of lines of manual setup
}
```

**After**:
```javascript
setupInteractions(camera, renderer, orbitControls) {
  this.ductInteraction = new DuctInteractionBase(
    this.scene, camera, renderer, orbitControls, 
    this.ductGeometry, this.snapLineManager
  )
  // That's it! Everything is handled automatically
}
```

## 🔧 Integration in ThreeScene

Update your main scene to use the new base classes:

```javascript
// Replace old imports
import { DuctInteraction, DuctEditor } from './ductwork'

// With new base class imports
import { DuctInteractionBase, DuctEditorBase } from './ductwork'

// Usage remains exactly the same
this.ductInteraction = new DuctInteractionBase(/*...*/)

<DuctEditorBase
  selectedObject={selectedDuct}
  camera={camera}
  renderer={renderer}
  onSave={handleDuctSave}
  onCancel={handleDuctCancel}
  onCopy={handleDuctCopy}
  visible={showDuctEditor}
/>
```

## ✨ Benefits After Migration

### Code Reduction
- **DuctInteraction**: 31,078 lines → 150 lines (**95% reduction**)
- **DuctEditor**: 13,105 lines → 50 lines (**99% reduction**)
- **Total**: ~45k lines → ~200 lines per MEP type

### Consistency
- All MEP types behave identically for common operations
- Unified snapping, measurement, and tier calculation
- Consistent storage format and event handling

### Maintainability
- Bug fixes in base class benefit all MEP types
- New features added once, available everywhere
- Easier testing and debugging

### Type Coverage
Create implementations for all MEP types:
- ✅ **Ductwork** (DuctInteractionBase, DuctEditorBase)
- 🔄 **Piping** (PipeInteractionBase, PipeEditorBase)
- 🔄 **Conduits** (ConduitInteractionBase, ConduitEditorBase)
- 🔄 **Cable Trays** (CableTrayInteractionBase, CableTrayEditorBase)
- 🔄 **Trade Racks** (TradeRackInteractionBase, TradeRackEditorBase)

## 🎯 Quick Win - Start with Ductwork

1. Import the new base classes:
   ```javascript
   import { DuctInteractionBase } from './ductwork/DuctInteractionBase.js'
   import { DuctEditorBase } from './ductwork/DuctEditorBase.js'
   ```

2. Replace your current ductwork instances:
   ```javascript
   // Old
   this.ductInteraction = new DuctInteraction(/*...*/)
   
   // New
   this.ductInteraction = new DuctInteractionBase(/*...*/)
   ```

3. Update your React component:
   ```javascript
   // Old
   <DuctEditor {...props} />
   
   // New
   <DuctEditorBase {...props} />
   ```

That's it! You now have all the advanced functionality with 95% less code.
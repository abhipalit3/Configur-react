# Rack Change Tracking Data Structures

## Overview
This document describes the data structures used for tracking rack position and parameter changes in the DPR Configur system.

## Project Manifest Structure

The main container for all change tracking data is stored in `localStorage` under key `projectManifest`:

```javascript
{
  "version": "1.0.0",
  "projectId": "project_1725677047000",
  "createdAt": "2024-09-07T02:04:07.000Z",
  "lastUpdated": "2024-09-07T02:04:07.000Z",
  
  // Project metadata
  "project": {
    "name": "Untitled Project",
    "description": "DPR Configur Project",
    "status": "active",
    "tags": []
  },
  
  // Trade rack configurations
  "tradeRacks": {
    "active": { /* current rack config */ },
    "activeConfigurationId": null,
    "configurations": [],
    "lastModified": "2024-09-07T02:04:07.000Z",
    "totalCount": 0
  },
  
  // MEP items
  "mepItems": {
    "ductwork": [],
    "piping": [],
    "conduits": [],
    "cableTrays": [],
    "totalCount": 0,
    "lastModified": null
  },
  
  // ** NEW: Change history for audit trail **
  "changeHistory": [
    // Array of change objects (max 100 items)
  ]
}
```

## Change History Data Structure

Each change in the `changeHistory` array has this structure:

### Base Change Object
```javascript
{
  "id": "change_1725677047123_abc12",           // Unique change ID
  "timestamp": "2024-09-07T02:04:07.123Z",     // When the change occurred
  "component": "tradeRacks",                   // Which system component
  "action": "position_moved",                  // What type of action
  "details": { /* action-specific data */ },  // Detailed change information
  "sessionId": "session_1725677047000_def34"   // Session identifier
}
```

## Rack Position Change Structure

When a rack is moved using the transform gizmo:

```javascript
{
  "id": "change_1725677047123_abc12",
  "timestamp": "2024-09-07T02:04:07.123Z",
  "component": "tradeRacks",
  "action": "position_moved",
  "details": {
    "rackId": "rack_1725677047000",           // ID of the moved rack
    "operation": "move_position",             // Type of operation
    "oldPosition": {                          // Previous position
      "x": 0,
      "y": 0, 
      "z": 0
    },
    "newPosition": {                          // New position
      "x": 1.5,
      "y": 0,
      "z": 2.3
    },
    "distance": {                             // Movement distance
      "x": 1.5,
      "y": 0,
      "z": 2.3
    }
  },
  "sessionId": "session_1725677047000_def34"
}
```

## Rack Parameter Change Structure

When rack parameters (tierCount, tierHeights, bayCount, etc.) are modified:

```javascript
{
  "id": "change_1725677047456_xyz89",
  "timestamp": "2024-09-07T02:04:07.456Z",
  "component": "tradeRacks",
  "action": "parameter_changed",
  "details": {
    "rackId": "rack_1725677047000",           // ID of the modified rack
    "operation": "update_parameter",          // Type of operation
    "parameterName": "tierCount",             // Which parameter changed
    "oldValue": 2,                            // Previous value
    "newValue": 3,                            // New value
    "parameterType": "number"                 // Data type of parameter
  },
  "sessionId": "session_1725677047000_def34"
}
```

### Examples of Different Parameter Changes:

#### Tier Count Change
```javascript
{
  "parameterName": "tierCount",
  "oldValue": 2,
  "newValue": 3,
  "parameterType": "number"
}
```

#### Tier Heights Change
```javascript
{
  "parameterName": "tierHeights",
  "oldValue": [
    {"feet": 2, "inches": 0},
    {"feet": 2, "inches": 6}
  ],
  "newValue": [
    {"feet": 3, "inches": 0},
    {"feet": 2, "inches": 6},
    {"feet": 2, "inches": 0}
  ],
  "parameterType": "object"
}
```

#### Bay Count Change
```javascript
{
  "parameterName": "bayCount", 
  "oldValue": 4,
  "newValue": 6,
  "parameterType": "number"
}
```

#### Mount Type Change
```javascript
{
  "parameterName": "mountType",
  "oldValue": "floor",
  "newValue": "deck", 
  "parameterType": "string"
}
```

## Rack Configuration Structure

The actual rack configuration stored in temporary state and saved configurations:

```javascript
{
  // Basic rack parameters
  "tierCount": 3,
  "tierHeights": [
    {"feet": 3, "inches": 0},
    {"feet": 2, "inches": 6}, 
    {"feet": 2, "inches": 0}
  ],
  "bayCount": 4,
  "bayWidth": {"feet": 3, "inches": 0},
  "rackLength": {"feet": 12, "inches": 0},
  "rackWidth": {"feet": 4, "inches": 0},
  "depth": 4,
  "mountType": "deck",
  "beamSize": 2,
  "postSize": 2,
  
  // Position information (added when rack is moved)
  "position": {
    "x": 1.5,
    "y": 0,
    "z": 2.3
  },
  
  // MEP items associated with this configuration
  "mepItems": [
    {
      "id": "duct_123",
      "type": "duct",
      "tier": 1,
      "position": {"x": 1, "y": 2, "z": 1},
      // ... other MEP properties
    }
    // ... more MEP items
  ],
  
  // Metadata for saved configurations
  "id": 1725677047000,
  "name": "Configuration Name",
  "savedAt": "2024-09-07T02:04:07.000Z",
  "updatedAt": "2024-09-07T02:05:15.000Z",
  "isTemporary": false,
  "lastModified": "2024-09-07T02:05:15.000Z"
}
```

## Temporary State Structure

Stored in `localStorage` under key `configurTempRackState`:

```javascript
{
  // All rack parameters (same as configuration above)
  "tierCount": 3,
  "tierHeights": [...],
  "bayCount": 4,
  // ... other parameters
  
  // Position (updated when rack is moved)
  "position": {
    "x": 1.5,
    "y": 0,
    "z": 2.3
  },
  
  // Associated MEP items
  "mepItems": [
    // Array of current MEP items
  ],
  
  // Temporary state metadata
  "isTemporary": true,
  "lastModified": "2024-09-07T02:05:15.000Z"
}
```

## Storage Locations

1. **Project Manifest**: `localStorage['projectManifest']`
   - Contains change history and project metadata
   - Persists all change tracking information

2. **Temporary State**: `localStorage['configurTempRackState']` 
   - Contains current working rack configuration
   - Updated on every rack change (position or parameters)
   - Cleared when saved to permanent configuration

3. **Saved Configurations**: `localStorage['tradeRackConfigurations']`
   - Array of permanently saved rack configurations
   - Each includes rack parameters, position, and MEP items

4. **Current Rack Parameters**: `localStorage['rackParameters']`
   - Current rack parameters for consistency
   - Updated alongside temporary state

## API Functions

### Position Tracking
```javascript
// Add position change to history
addRackPositionChange(oldPosition, newPosition, rackId)
```

### Parameter Tracking  
```javascript
// Add parameter change to history
addRackParameterChange(parameterName, oldValue, newValue, rackId)

// Update parameters with automatic change tracking
TradeRackInteraction.updateRackParameters(newParams, rackId)

// Track individual parameter change
TradeRackInteraction.trackParameterChange(paramName, oldVal, newVal, rackId)
```

### Debugging Tools
```javascript
// View recent change history
window.debugTempState.viewHistory()

// Test parameter tracking
window.debugTempState.testParameterTracking('tierCount', 2, 3)

// Test position tracking
window.debugTempState.testPositionTracking()
```

## Change History Limits

- Maximum of 100 change entries in history
- Oldest entries automatically removed when limit exceeded
- Each session gets unique session ID for grouping related changes
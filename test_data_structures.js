/**
 * Test script to demonstrate rack change tracking data structures
 * Run this in the browser console after the app loads
 */

console.log('🧪 Testing Rack Change Tracking Data Structures...\n')

// 1. Test Parameter Change Tracking
console.log('1️⃣ Testing Parameter Changes:')
console.log('   - Changing tierCount from 2 to 3...')
window.debugTempState.testParameterTracking('tierCount', 2, 3)

console.log('   - Changing mountType from "floor" to "deck"...')
window.debugTempState.testParameterTracking('mountType', 'floor', 'deck')

console.log('   - Changing bayCount from 4 to 6...')
window.debugTempState.testParameterTracking('bayCount', 4, 6)

// 2. Test Position Change Tracking  
console.log('\n2️⃣ Testing Position Changes:')
console.log('   - Moving rack from (0,0,0) to (1,0,2)...')
window.debugTempState.testPositionTracking()

// 3. Test MEP Item Tracking
console.log('\n3️⃣ Testing MEP Item Changes:')
console.log('   - Adding a duct...')
if (window.addMEPItemChange) {
  window.addMEPItemChange('item_added', 'duct', 'test_duct_123', 'Test Ductwork', {
    tier: 2,
    dimensions: { width: 24, height: 12, insulation: 2 }
  })
}

console.log('   - Modifying a pipe...')
if (window.addMEPItemChange) {
  window.addMEPItemChange('item_modified', 'pipe', 'test_pipe_456', 'Test Piping', {
    modificationType: 'dimensions',
    newDimensions: { diameter: 6 }
  })
}

console.log('   - Removing a conduit...')
if (window.addMEPItemChange) {
  window.addMEPItemChange('item_removed', 'conduit', 'test_conduit_789', 'Test Conduit', {
    tier: 1,
    removedFrom: 'ui_panel'
  })
}

// 4. View the manifest structure
console.log('\n4️⃣ Current Project Manifest Structure:')
try {
  const manifest = JSON.parse(localStorage.getItem('projectManifest'))
  console.log('Project ID:', manifest.projectId)
  console.log('Created At:', manifest.createdAt)
  console.log('Last Updated:', manifest.lastUpdated)
  console.log('Total Changes in History:', manifest.changeHistory?.length || 0)
  
  if (manifest.changeHistory && manifest.changeHistory.length > 0) {
    console.log('\n📊 Recent Changes:')
    manifest.changeHistory.slice(0, 5).forEach((change, i) => {
      const time = new Date(change.timestamp).toLocaleTimeString()
      console.log(`   ${i+1}. [${time}] ${change.component}:${change.action}`)
      console.log('      Details:', change.details)
    })
  }
} catch (error) {
  console.error('Error reading manifest:', error)
}

// 5. Show temporary state structure
console.log('\n5️⃣ Current Temporary State:')
try {
  const tempState = localStorage.getItem('configurTempRackState')
  if (tempState) {
    const parsed = JSON.parse(tempState)
    console.log('Temporary State Keys:', Object.keys(parsed))
    console.log('Is Temporary:', parsed.isTemporary)
    console.log('Last Modified:', parsed.lastModified)
    console.log('Position:', parsed.position)
    console.log('MEP Items Count:', parsed.mepItems?.length || 0)
    console.log('Tier Count:', parsed.tierCount)
    console.log('Mount Type:', parsed.mountType)
  } else {
    console.log('No temporary state found')
  }
} catch (error) {
  console.error('Error reading temporary state:', error)
}

// 6. Show saved configurations structure
console.log('\n6️⃣ Saved Configurations:')
try {
  const savedConfigs = localStorage.getItem('tradeRackConfigurations')
  if (savedConfigs) {
    const configs = JSON.parse(savedConfigs)
    console.log('Number of Saved Configurations:', configs.length)
    configs.forEach((config, i) => {
      console.log(`   ${i+1}. "${config.name}" (ID: ${config.id})`)
      console.log(`      Saved: ${new Date(config.savedAt).toLocaleString()}`)
      console.log(`      MEP Items: ${config.mepItems?.length || 0}`)
      console.log(`      Position: ${config.position ? 'Yes' : 'No'}`)
    })
  } else {
    console.log('No saved configurations found')
  }
} catch (error) {
  console.error('Error reading saved configurations:', error)
}

// 7. Data structure sizes
console.log('\n7️⃣ Storage Usage:')
const getStorageSize = (key) => {
  const item = localStorage.getItem(key)
  return item ? (item.length / 1024).toFixed(2) + ' KB' : 'N/A'
}

console.log('Project Manifest:', getStorageSize('projectManifest'))
console.log('Temporary State:', getStorageSize('configurTempRackState'))
console.log('Saved Configurations:', getStorageSize('tradeRackConfigurations'))
console.log('Rack Parameters:', getStorageSize('rackParameters'))
console.log('MEP Items:', getStorageSize('configurMepItems'))

console.log('\n✅ Data structure testing complete! Check the output above.')
console.log('\n💡 Tip: Run window.debugTempState.viewHistory() to see recent changes')
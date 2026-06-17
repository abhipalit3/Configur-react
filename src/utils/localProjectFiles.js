let selectedProjectDirectoryHandle = null

const downloadTextFile = (file) => {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  const blob = new Blob([file.content], { type: file.mimeType || 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const canUseLocalProjectDirectory = () => (
  typeof window !== 'undefined' &&
  typeof window.showDirectoryPicker === 'function'
)

export const hasSelectedProjectDirectory = () => Boolean(selectedProjectDirectoryHandle)

export const clearSelectedProjectDirectory = () => {
  selectedProjectDirectoryHandle = null
}

export const chooseLocalProjectDirectory = async () => {
  if (!canUseLocalProjectDirectory()) return null
  selectedProjectDirectoryHandle = await window.showDirectoryPicker({
    id: 'configur-local-project-directory',
    mode: 'readwrite'
  })
  return selectedProjectDirectoryHandle
}

const getWritableDirectory = async (folder = '') => {
  let current = selectedProjectDirectoryHandle
  if (!current) throw new Error('No local project directory has been selected.')

  const folderParts = folder.split('/').filter(Boolean)
  for (const part of folderParts) {
    current = await current.getDirectoryHandle(part, { create: true })
  }

  return current
}

const writeFileToDirectory = async (directoryHandle, file) => {
  const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(file.content)
  await writable.close()
}

export const writeProjectFiles = async ({ folder = '', files = [] } = {}) => {
  if (selectedProjectDirectoryHandle) {
    const targetDirectory = await getWritableDirectory(folder)
    for (const file of files) {
      await writeFileToDirectory(targetDirectory, file)
    }
    return {
      method: 'directory',
      files: files.map(file => `${folder}/${file.name}`.replace(/^\/+/, ''))
    }
  }

  files.forEach(downloadTextFile)
  return {
    method: 'download',
    files: files.map(file => file.name)
  }
}

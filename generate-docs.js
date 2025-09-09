/**
 * Documentation Generator for React Codebase
 * Extracts functions, imports, and exports from JavaScript/JSX files
 */

const fs = require('fs');
const path = require('path');

class CodebaseDocumenter {
  constructor(sourceDir = './src') {
    this.sourceDir = sourceDir;
    this.documentation = {
      files: {},
      functions: {},
      imports: {},
      exports: {},
      summary: {
        totalFiles: 0,
        totalFunctions: 0,
        totalImports: 0,
        totalExports: 0
      }
    };
  }

  // Get all JS/JSX files recursively
  getAllJSFiles(dir = this.sourceDir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllJSFiles(fullPath));
      } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  // Extract functions from file content with descriptions
  extractFunctions(content, filePath) {
    const functions = [];
    const lines = content.split('\n');
    
    // Regular expressions for different function patterns with line tracking
    const patterns = [
      // Function declarations: function name() {}
      { pattern: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g, type: 'function' },
      // Arrow functions: const name = () => {} or export const name = () => {}
      { pattern: /(?:export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(([^)]*)\)\s*=>/g, type: 'arrow' },
      // React component functions: export default function ComponentName
      { pattern: /export\s+default\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g, type: 'component' },
      // Async functions
      { pattern: /async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g, type: 'async' },
      // Method definitions in classes or objects
      { pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g, type: 'method' }
    ];

    patterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        const parameters = match[2] || '';
        
        if (functionName && !functions.some(f => f.name === functionName)) {
          // Find the line number where this function is defined
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          
          // Extract description from comments above the function
          const description = this.extractFunctionDescription(lines, lineIndex, functionName);
          
          // Extract parameter information
          const paramInfo = this.parseParameters(parameters);
          
          functions.push({
            name: functionName,
            file: filePath,
            type: this.determineFunctionType(match[0]),
            parameters: paramInfo,
            description: description,
            lineNumber: lineIndex + 1,
            signature: match[0].substring(0, Math.min(match[0].length, 100)) + (match[0].length > 100 ? '...' : '')
          });
        }
      }
    });

    return functions;
  }

  // Extract function description from comments above the function
  extractFunctionDescription(lines, functionLineIndex, functionName) {
    let description = '';
    let summary = '';
    let details = [];
    let params = [];
    let returns = '';
    
    // Look backwards from function line to find comments
    let currentLine = functionLineIndex - 1;
    let commentBlock = [];
    
    // Collect comment lines above the function
    while (currentLine >= 0) {
      const line = lines[currentLine].trim();
      
      if (line.startsWith('/**') || line.startsWith('/*')) {
        // Start of JSDoc comment block
        commentBlock.unshift(line);
        break;
      } else if (line.startsWith('*') || line.startsWith('//')) {
        // Comment line
        commentBlock.unshift(line);
      } else if (line === '') {
        // Empty line, continue looking
      } else {
        // Non-comment line, stop looking
        break;
      }
      currentLine--;
    }
    
    // Parse JSDoc comments
    if (commentBlock.length > 0) {
      let inDescription = true;
      
      for (const line of commentBlock) {
        const cleanLine = line.replace(/^[\s\*\/]+/, '').trim();
        
        if (cleanLine.startsWith('@param')) {
          inDescription = false;
          const paramMatch = cleanLine.match(/@param\s+\{([^}]*)\}\s+([a-zA-Z_$][a-zA-Z0-9_$.[\]]*)\s*(.*)/);
          if (paramMatch) {
            params.push({
              name: paramMatch[2],
              type: paramMatch[1],
              description: paramMatch[3]
            });
          }
        } else if (cleanLine.startsWith('@returns') || cleanLine.startsWith('@return')) {
          inDescription = false;
          const returnMatch = cleanLine.match(/@returns?\s+\{([^}]*)\}\s*(.*)/);
          if (returnMatch) {
            returns = {
              type: returnMatch[1],
              description: returnMatch[2]
            };
          }
        } else if (cleanLine && inDescription && !cleanLine.includes('Copyright') && !cleanLine.includes('proprietary')) {
          if (!summary) {
            summary = cleanLine;
          } else {
            details.push(cleanLine);
          }
        }
      }
    }
    
    // If no JSDoc, try to infer from function context or nearby comments
    if (!summary) {
      // Look for inline comments or try to infer from function name
      summary = this.inferFunctionPurpose(functionName);
    }
    
    return {
      summary: summary || `Function: ${functionName}`,
      details: details,
      parameters: params,
      returns: returns
    };
  }

  // Parse function parameters
  parseParameters(paramString) {
    if (!paramString.trim()) return [];
    
    const params = paramString.split(',').map(param => {
      const cleaned = param.trim();
      const parts = cleaned.split('=');
      const name = parts[0].trim();
      const hasDefault = parts.length > 1;
      const defaultValue = hasDefault ? parts[1].trim() : null;
      
      return {
        name: name,
        hasDefault: hasDefault,
        defaultValue: defaultValue,
        type: this.inferParameterType(name, defaultValue)
      };
    });
    
    return params;
  }

  // Infer parameter type from name and default value
  inferParameterType(name, defaultValue) {
    if (defaultValue) {
      if (defaultValue === 'true' || defaultValue === 'false') return 'boolean';
      if (!isNaN(defaultValue)) return 'number';
      if (defaultValue.startsWith("'") || defaultValue.startsWith('"')) return 'string';
      if (defaultValue.startsWith('[') || defaultValue === '[]') return 'array';
      if (defaultValue.startsWith('{') || defaultValue === '{}') return 'object';
    }
    
    // Infer from parameter name
    if (name.includes('is') || name.includes('has') || name.includes('can') || name.includes('should')) return 'boolean';
    if (name.includes('count') || name.includes('index') || name.includes('size') || name.includes('width') || name.includes('height')) return 'number';
    if (name.includes('id') || name.includes('name') || name.includes('title') || name.includes('text')) return 'string';
    if (name.includes('items') || name.includes('list') || name.includes('array')) return 'array';
    if (name.includes('config') || name.includes('params') || name.includes('options') || name.includes('props')) return 'object';
    
    return 'any';
  }

  // Infer function purpose from name
  inferFunctionPurpose(functionName) {
    const name = functionName.toLowerCase();
    
    if (name.startsWith('get') || name.startsWith('fetch')) return `Retrieves ${name.substring(3)}`;
    if (name.startsWith('set') || name.startsWith('update')) return `Updates ${name.substring(3)}`;
    if (name.startsWith('create') || name.startsWith('build')) return `Creates ${name.substring(6)}`;
    if (name.startsWith('delete') || name.startsWith('remove')) return `Removes ${name.substring(6)}`;
    if (name.startsWith('handle') || name.startsWith('on')) return `Handles ${name.substring(6)} events`;
    if (name.startsWith('render')) return `Renders ${name.substring(6)} component`;
    if (name.startsWith('init') || name.startsWith('initialize')) return `Initializes ${name.substring(4)}`;
    if (name.startsWith('validate')) return `Validates ${name.substring(8)}`;
    if (name.startsWith('parse')) return `Parses ${name.substring(5)}`;
    if (name.startsWith('format')) return `Formats ${name.substring(6)}`;
    if (name.startsWith('calculate') || name.startsWith('compute')) return `Calculates ${name.substring(9)}`;
    if (name.startsWith('is') || name.startsWith('has') || name.startsWith('can')) return `Checks if ${name.substring(2)}`;
    if (name.startsWith('use')) return `Custom hook for ${name.substring(3)}`;
    if (name.endsWith('handler')) return `Event handler for ${name.replace('handler', '')}`;
    if (name.endsWith('listener')) return `Event listener for ${name.replace('listener', '')}`;
    if (name.endsWith('callback')) return `Callback function for ${name.replace('callback', '')}`;
    
    return `Function: ${functionName}`;
  }

  // Determine function type based on declaration
  determineFunctionType(declaration) {
    if (declaration.includes('export default')) return 'default export';
    if (declaration.includes('export')) return 'named export';
    if (declaration.includes('async')) return 'async function';
    if (declaration.includes('=>')) return 'arrow function';
    if (declaration.includes('function')) return 'function declaration';
    return 'method';
  }

  // Extract imports from file content
  extractImports(content, filePath) {
    const imports = [];
    
    // Import patterns
    const importPatterns = [
      // import { named } from 'module'
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/g,
      // import defaultImport from 'module'
      /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/g,
      // import * as name from 'module'
      /import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/g,
      // import 'module' (side effects)
      /import\s*['"`]([^'"`]+)['"`]/g
    ];

    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[2]) {
          // Named or default imports
          const importedItems = match[1] ? match[1].split(',').map(item => item.trim()) : [];
          imports.push({
            items: importedItems,
            source: match[2],
            type: pattern.source.includes('\\*') ? 'namespace' : 
                  pattern.source.includes('\\{') ? 'named' : 'default',
            file: filePath
          });
        } else {
          // Side effect imports
          imports.push({
            items: [],
            source: match[1],
            type: 'side-effect',
            file: filePath
          });
        }
      }
    });

    return imports;
  }

  // Extract exports from file content
  extractExports(content, filePath) {
    const exports = [];
    
    const exportPatterns = [
      // export { named }
      /export\s*\{\s*([^}]+)\s*\}/g,
      // export const/function/class name
      /export\s+(?:const|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // export default
      /export\s+default\s+(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)?/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[0].includes('default')) {
          exports.push({
            name: match[1] || 'default',
            type: 'default',
            file: filePath
          });
        } else if (match[0].includes('{')) {
          const exportedItems = match[1].split(',').map(item => item.trim());
          exportedItems.forEach(item => {
            exports.push({
              name: item,
              type: 'named',
              file: filePath
            });
          });
        } else {
          exports.push({
            name: match[1],
            type: 'named',
            file: filePath
          });
        }
      }
    });

    return exports;
  }

  // Process a single file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      const functions = this.extractFunctions(content, relativePath);
      const imports = this.extractImports(content, relativePath);
      const exports = this.extractExports(content, relativePath);

      this.documentation.files[relativePath] = {
        functions: functions.map(f => f.name),
        imports: imports,
        exports: exports,
        lineCount: content.split('\n').length
      };

      // Add to global collections
      functions.forEach(func => {
        if (!this.documentation.functions[func.name]) {
          this.documentation.functions[func.name] = [];
        }
        this.documentation.functions[func.name].push({
          file: relativePath,
          type: func.type,
          description: func.description,
          parameters: func.parameters,
          lineNumber: func.lineNumber,
          signature: func.signature
        });
      });

      imports.forEach(imp => {
        if (!this.documentation.imports[imp.source]) {
          this.documentation.imports[imp.source] = [];
        }
        this.documentation.imports[imp.source].push({
          file: relativePath,
          items: imp.items,
          type: imp.type
        });
      });

      exports.forEach(exp => {
        if (!this.documentation.exports[exp.name]) {
          this.documentation.exports[exp.name] = [];
        }
        this.documentation.exports[exp.name].push({
          file: relativePath,
          type: exp.type
        });
      });

      return {
        file: relativePath,
        functionsCount: functions.length,
        importsCount: imports.length,
        exportsCount: exports.length
      };

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error.message);
      return null;
    }
  }

  // Generate documentation
  generateDocumentation() {
    console.log('🔍 Scanning codebase for documentation...');
    
    const files = this.getAllJSFiles();
    console.log(`📁 Found ${files.length} JavaScript/JSX files`);

    let processedCount = 0;
    files.forEach(file => {
      const result = this.processFile(file);
      if (result) {
        processedCount++;
        this.documentation.summary.totalFunctions += result.functionsCount;
        this.documentation.summary.totalImports += result.importsCount;
        this.documentation.summary.totalExports += result.exportsCount;
      }
    });

    this.documentation.summary.totalFiles = processedCount;
    
    console.log(`✅ Processed ${processedCount} files`);
    console.log(`📊 Found ${this.documentation.summary.totalFunctions} functions`);
    console.log(`📦 Found ${this.documentation.summary.totalImports} imports`);
    console.log(`🔄 Found ${this.documentation.summary.totalExports} exports`);
    
    return this.documentation;
  }

  // Save documentation to files
  saveDocumentation(outputDir = './docs') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save complete documentation as JSON
    fs.writeFileSync(
      path.join(outputDir, 'codebase-documentation.json'),
      JSON.stringify(this.documentation, null, 2)
    );

    // Generate markdown summary
    this.generateMarkdownSummary(outputDir);
    
    // Generate function index
    this.generateFunctionIndex(outputDir);
    
    // Generate dependency map
    this.generateDependencyMap(outputDir);

    console.log(`📝 Documentation saved to ${outputDir}/`);
  }

  // Generate markdown summary
  generateMarkdownSummary(outputDir) {
    let markdown = '# Codebase Documentation\n\n';
    
    markdown += '## Summary\n\n';
    markdown += `- **Total Files**: ${this.documentation.summary.totalFiles}\n`;
    markdown += `- **Total Functions**: ${this.documentation.summary.totalFunctions}\n`;
    markdown += `- **Total Imports**: ${this.documentation.summary.totalImports}\n`;
    markdown += `- **Total Exports**: ${this.documentation.summary.totalExports}\n\n`;

    markdown += '## File Overview\n\n';
    Object.entries(this.documentation.files).forEach(([file, data]) => {
      markdown += `### ${file}\n`;
      markdown += `- **Functions**: ${data.functions.length}\n`;
      markdown += `- **Imports**: ${data.imports.length}\n`;
      markdown += `- **Exports**: ${data.exports.length}\n`;
      markdown += `- **Lines**: ${data.lineCount}\n`;
      
      if (data.functions.length > 0) {
        markdown += `- **Function List**: ${data.functions.join(', ')}\n`;
      }
      
      if (data.imports.length > 0) {
        const importSources = data.imports.map(imp => imp.source).join(', ');
        markdown += `- **Import Sources**: ${importSources}\n`;
      }
      
      markdown += '\n';
    });

    fs.writeFileSync(path.join(outputDir, 'README.md'), markdown);
  }

  // Generate function index
  generateFunctionIndex(outputDir) {
    let markdown = '# Function Index\n\n';
    
    Object.entries(this.documentation.functions).forEach(([funcName, locations]) => {
      markdown += `## ${funcName}\n\n`;
      
      locations.forEach((loc, index) => {
        if (locations.length > 1) {
          markdown += `### Location ${index + 1}\n\n`;
        }
        
        markdown += `- **File**: \`${loc.file}:${loc.lineNumber}\`\n`;
        markdown += `- **Type**: ${loc.type}\n`;
        
        if (loc.description) {
          markdown += `- **Description**: ${loc.description.summary}\n`;
          
          if (loc.description.details && loc.description.details.length > 0) {
            markdown += `- **Details**: ${loc.description.details.join(' ')}\n`;
          }
          
          if (loc.parameters && loc.parameters.length > 0) {
            markdown += `- **Parameters**:\n`;
            loc.parameters.forEach(param => {
              const defaultStr = param.hasDefault ? ` = ${param.defaultValue}` : '';
              markdown += `  - \`${param.name}${defaultStr}\` (${param.type})\n`;
            });
          }
          
          if (loc.description.parameters && loc.description.parameters.length > 0) {
            markdown += `- **JSDoc Parameters**:\n`;
            loc.description.parameters.forEach(param => {
              markdown += `  - \`${param.name}\` ({${param.type}}) - ${param.description}\n`;
            });
          }
          
          if (loc.description.returns) {
            markdown += `- **Returns**: {${loc.description.returns.type}} ${loc.description.returns.description}\n`;
          }
        }
        
        if (loc.signature) {
          markdown += `- **Signature**: \`${loc.signature}\`\n`;
        }
        
        markdown += '\n';
      });
      
      markdown += '---\n\n';
    });

    fs.writeFileSync(path.join(outputDir, 'function-index.md'), markdown);
  }

  // Generate dependency map
  generateDependencyMap(outputDir) {
    let markdown = '# Dependency Map\n\n';
    
    markdown += '## External Dependencies\n\n';
    Object.entries(this.documentation.imports).forEach(([source, importers]) => {
      if (!source.startsWith('.')) {
        markdown += `### ${source}\n`;
        markdown += 'Used in:\n';
        importers.forEach(imp => {
          markdown += `- ${imp.file} (${imp.items.join(', ') || 'side-effect'})\n`;
        });
        markdown += '\n';
      }
    });

    markdown += '## Internal Dependencies\n\n';
    Object.entries(this.documentation.imports).forEach(([source, importers]) => {
      if (source.startsWith('.')) {
        markdown += `### ${source}\n`;
        markdown += 'Used in:\n';
        importers.forEach(imp => {
          markdown += `- ${imp.file} (${imp.items.join(', ') || 'side-effect'})\n`;
        });
        markdown += '\n';
      }
    });

    fs.writeFileSync(path.join(outputDir, 'dependency-map.md'), markdown);
  }
}

// Main execution
if (require.main === module) {
  const documenter = new CodebaseDocumenter('./src');
  documenter.generateDocumentation();
  documenter.saveDocumentation('./docs');
  
  console.log('\n🎉 Documentation generation complete!');
  console.log('📖 Check the ./docs/ directory for generated documentation');
}

module.exports = CodebaseDocumenter;
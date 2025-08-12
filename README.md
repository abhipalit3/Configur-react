# Configur - Prefabrication Assembly Automation

**Copyright (c) 2024 DPR Construction. All rights reserved.**

A sophisticated 3D visualization and configuration tool for multi-trade rack prefabrication in construction projects. This proprietary software enables real-time design, visualization, and configuration of building infrastructure components.

## 🏗️ Overview

Configur is an advanced React-based application that provides:

- **3D Visualization**: Interactive Three.js-powered 3D scene rendering
- **Multi-Trade Rack Configuration**: Design and customize structural rack systems
- **MEP Integration**: Ductwork, piping, and conduit management
- **Real-time Measurement Tools**: Precision measurement and annotation
- **Building Shell Design**: Comprehensive building envelope configuration
- **Export Capabilities**: Generate project manifests and configurations

## 🔒 License & Intellectual Property

This software is **proprietary and confidential** property of DPR Construction.

- ❌ **No redistribution allowed**
- ❌ **No derivative works permitted** 
- ❌ **Reverse engineering prohibited**
- ✅ **Internal DPR Construction use only**

See [LICENSE](./LICENSE) for full terms.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository (DPR internal access only)
git clone https://github.com/abhipalit3/Configur-react.git
cd Configur-react

# Install dependencies
npm install

# Start development server
npm start
```

### Production Build

```bash
# Create optimized production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🏛️ Architecture

### Core Technologies

- **React 17.0.2** - UI framework
- **Three.js 0.178.0** - 3D graphics and visualization
- **Craco 7.1.0** - Build configuration
- **React Router DOM 5.2.0** - Navigation

### Project Structure

```
src/
├── components/
│   ├── 3d/                    # 3D visualization components
│   │   ├── scene/            # Main 3D scene management
│   │   ├── core/             # Core utilities and helpers
│   │   ├── materials/        # Material definitions
│   │   ├── controls/         # User interaction controls
│   │   ├── ductwork/         # Ductwork rendering system
│   │   ├── piping/           # Piping system components
│   │   └── trade-rack/       # Rack structure components
│   ├── forms/                # Form components
│   ├── layout/               # Layout components
│   ├── mep/                  # MEP (Mechanical/Electrical/Plumbing)
│   ├── navigation/           # Navigation components
│   ├── projects/             # Project management
│   └── ui/                   # Reusable UI components
├── hooks/                    # Custom React hooks
├── pages/                    # Page components
├── types/                    # Type definitions
└── utils/                    # Utility functions
```

## 🛠️ Key Features

### 3D Visualization Engine

- **Interactive Scene**: OrbitControls-enabled 3D navigation
- **Material System**: Centralized material management with PBR rendering
- **Measurement Tools**: Real-time distance and dimension measurement
- **Snap System**: Geometry-based snap points for precise alignment

### Multi-Trade Rack System

- **Configurable Structures**: Dynamic rack generation with customizable dimensions
- **Post & Beam Configuration**: Separate materials for visual distinction
- **Tier Management**: Multi-level rack systems with individual tier properties

### MEP Integration

- **Ductwork Rendering**: Comprehensive HVAC duct visualization
- **Piping Systems**: Complete pipe routing and configuration
- **Cable Management**: Conduit and cable tray systems

### Building Shell

- **Envelope Design**: Floor, ceiling, roof, and wall configuration
- **Material Management**: Centralized building material system
- **Dimensional Control**: Precise building shell parameters

## 🎮 Usage

### Basic Configuration

1. **Project Setup**: Create or load a project configuration
2. **Rack Design**: Configure multi-trade rack dimensions and properties
3. **MEP Integration**: Add ductwork, piping, and electrical systems
4. **3D Visualization**: Navigate and inspect the 3D model
5. **Measurement**: Use measurement tools for precision verification
6. **Export**: Generate project manifests and configuration files

### Advanced Features

- **AI Chat Interface**: OpenAI-powered configuration assistance
- **Saved Configurations**: Store and recall project setups
- **Template System**: Predefined rack configurations
- **Real-time Updates**: Live parameter adjustment with immediate visual feedback

## 🔧 Development

### Available Scripts

```bash
npm start          # Development server (localhost:3000)
npm run build      # Production build
npm run test       # Run tests
npm run deploy     # Deploy to GitHub Pages
```

### Environment Configuration

- `.env.production` - Production environment variables
- Source maps disabled for IP protection

### Code Style

- **Copyright Headers**: All source files include DPR Construction copyright
- **Component Organization**: Modular, reusable component architecture
- **Three.js Integration**: Optimized 3D rendering pipeline
- **Memory Management**: Proper disposal of 3D resources

## 📊 Performance

- **Optimized Builds**: Minified and compressed production assets
- **Memory Efficient**: Proper Three.js resource cleanup
- **Responsive Design**: Mobile and desktop compatibility
- **Source Map Protection**: IP-secured production builds

## 🌐 Deployment

**Live Application**: https://abhipalit3.github.io/Configur-react

### Deployment Process

1. Production build generation
2. Source map removal for IP protection
3. GitHub Pages deployment
4. Automated CI/CD pipeline

## 🔐 Security

- **Proprietary License**: Full IP protection
- **Source Code Protection**: No source maps in production
- **Access Control**: DPR Construction internal use only
- **Secure Deployment**: Protected build artifacts

## 📞 Support

For internal DPR Construction support:

- **Technical Issues**: Contact development team
- **Feature Requests**: Submit through internal channels
- **License Questions**: Contact legal department

---

**DPR Construction - Innovation in Construction Technology**

*This software represents proprietary technology developed for DPR Construction's prefabrication automation initiatives.*
# Live Matrix Designer

A web-based tool for designing and animating patterns on an LED matrix, with real-time control via serial communication.

## Features

*   **Real-time LED Matrix Visualization:** See your designs come to life instantly on a virtual matrix.
*   **Drawing Tools:**
    *   **Pencil:** Draw individual pixels with a selected color.
    *   **Fill:** Flood-fill areas with a selected color.
*   **Text Display & Scrolling:** Display custom text on the matrix, with scrolling animation options.
*   **Animation Modes:**
    *   **Rainbow:** Dynamic rainbow patterns.
    *   **Plasma:** Hypnotic plasma effects.
    *   **Custom Frames:** Create and manage multiple frames for custom animations.
*   **Frame Management:** Add, delete, and duplicate animation frames.
*   **Serial Communication:** Connect to a physical LED matrix via a serial port for real-time hardware control.
*   **Brightness Control:** Adjust the overall brightness of the matrix.

## Technologies Used

*   **Frontend:** React, TypeScript, Vite
*   **Backend:** Node.js, Express, TypeScript
*   **Communication:** WebSockets, SerialPort API
*   **Styling:** Tailwind CSS (inferred from project structure)

## Setup

To get this project up and running on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/coff33ninja/Matrix-Painter.git
    cd Matrix-Painter
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run in development mode:**
    This will start both the client (Vite) and the server (Node.js).
    ```bash
    npm run dev
    ```
    The client will typically run on `http://localhost:5173` and the server on `http://localhost:3000` (or similar, check your console output).

4.  **Build for production:**
    ```bash
    npm run build
    ```

## Usage

1.  **Connect to Serial Port:** Use the "Connect" button in the Serial Panel to establish a connection with your LED matrix hardware.
2.  **Select Color and Tool:** Choose your desired color from the color picker and select a drawing tool (Pencil or Fill).
3.  **Design on the Matrix:** Click or drag on the virtual matrix to create your patterns.
4.  **Manage Frames:** Use the Frames Panel to add new frames, duplicate existing ones, or delete them to create custom animations.
5.  **Text & Animations:** Enter text in the Text Panel and choose whether to display it statically or with a scrolling animation. Experiment with Rainbow and Plasma animations from the Toolbar.
6.  **Adjust Brightness:** Use the brightness slider in the Toolbar to control the LED output.

## Future Improvements

### 🚀 High Impact, Easy Implementation

#### Enhanced Drawing Tools
- [x] **Spray Tool** - Random pixel scatter effect
- [ ] **Copy/Paste** - Select areas and duplicate them

#### Color Management
- [ ] **Color Palette Presets** - Save/load custom color schemes
- [ ] **Color Picker from Grid** - Eyedropper tool to sample colors
- [ ] **Gradient Tool** - Create smooth color transitions
- [ ] **HSV Color Wheel** - More intuitive color selection
- [ ] **Recent Colors** - Quick access to recently used colors

#### Animation Enhancements
- [ ] **Frame Onion Skinning** - See previous/next frames while editing
- [ ] **Animation Speed Preview** - Real-time speed adjustment
- [ ] **Bounce Animation** - Forward-backward loop mode
- [ ] **Frame Interpolation** - Auto-generate in-between frames
- [ ] **Animation Export** - Save as GIF/video files

### 🎯 Medium Impact, Moderate Effort

#### Advanced Text Features
- [ ] **Multiple Font Support** - Load custom bitmap fonts
- [ ] **Text Effects** - Outline, shadow, rainbow text
- [ ] **Vertical Text** - Top-to-bottom text rendering
- [ ] **Text Along Path** - Curved and shaped text
- [ ] **Unicode Support** - Emoji and special characters

#### Pattern & Template System
- [ ] **Pattern Library** - Pre-made designs (hearts, stars, etc.)
- [ ] **Template Gallery** - Holiday themes, logos, icons
- [ ] **Pattern Generator** - Procedural patterns (checkerboard, waves)
- [ ] **Import Images** - Convert small images to pixel art
- [ ] **QR Code Generator** - Create scannable QR codes

#### Advanced Animations
- [ ] **Physics Simulation** - Bouncing balls, falling particles
- [ ] **Fire Effect** - Realistic flame simulation
- [ ] **Water Ripple** - Expanding circle effects
- [ ] **Matrix Rain** - Classic "digital rain" effect
- [ ] **Starfield** - Moving star background
- [ ] **Conway's Game of Life** - Cellular automaton

### 🛠️ Power User Features

#### Layering System
- [ ] **Multiple Layers** - Background, foreground, effects
- [ ] **Blend Modes** - Add, multiply, overlay effects
- [ ] **Layer Opacity** - Transparent overlays
- [ ] **Layer Groups** - Organize complex compositions

#### Advanced Serial Features
- [ ] **Multiple Matrix Support** - Control several matrices
- [ ] **Serial Terminal** - Debug and send custom commands
- [ ] **Device Profiles** - Save settings for different hardware
- [ ] **Auto-Discovery** - Detect matrix dimensions automatically
- [ ] **Firmware Updater** - Update device firmware via web

#### Project Management
- [ ] **Save/Load Projects** - Complete project files
- [ ] **Export Formats** - JSON, binary, C++ arrays
- [ ] **Project History** - Undo/redo for entire sessions
- [ ] **Backup System** - Auto-save and recovery
- [ ] **Version Control** - Track project changes

### 🎮 Interactive Features

#### Games & Demos
- [ ] **Snake Game** - Classic snake with score display
- [ ] **Pong** - Two-player paddle game
- [ ] **Tetris** - Falling blocks puzzle
- [ ] **Clock Display** - Digital/analog clock faces
- [ ] **Weather Display** - Live weather animations

#### Real-time Integration
- [ ] **Music Visualizer** - React to audio input
- [ ] **Webcam Integration** - Live video to pixel art
- [ ] **Social Media Display** - Show notifications/feeds
- [ ] **Stock Ticker** - Scrolling financial data
- [ ] **News Feed** - Live news headlines

### 💡 Creative Tools

#### Advanced Effects
- [ ] **Blur/Sharpen** - Image processing effects
- [ ] **Color Filters** - Sepia, negative, posterize
- [ ] **Dithering** - Better color reduction algorithms
- [ ] **Noise Generation** - Random texture effects
- [ ] **Edge Detection** - Outline extraction

#### Interactive Drawing
- [ ] **Pressure Sensitivity** - Variable opacity/size (if supported)
- [ ] **Gesture Recognition** - Draw shapes by gesture
- [ ] **Auto-Complete** - Suggest shape completions
- [ ] **Smart Fill** - Intelligent flood fill with options
- [ ] **Magnetic Selection** - Edge-aware selection tools

### 🌐 Web & Connectivity

#### Cloud Features
- [ ] **Online Gallery** - Share creations with community
- [ ] **Cloud Sync** - Save projects to cloud storage
- [ ] **Collaboration** - Real-time multi-user editing
- [ ] **Template Sharing** - Community template library

#### Advanced Connectivity
- [ ] **WiFi Configuration** - Set up device WiFi via web
- [ ] **MQTT Support** - IoT integration and control
- [ ] **API Endpoints** - REST API for external control
- [ ] **Webhook Integration** - Trigger animations from external events

### 📊 Development Phases

#### Phase 1 (Quick Wins) 🏃‍♂️
- [ ] Circle Tool
- [ ] Color Palette Presets
- [ ] Frame Onion Skinning
- [ ] Pattern Library

#### Phase 2 (Enhanced Experience) 🎨
- [ ] Advanced Text Effects
- [ ] Physics Animations
- [ ] Save/Load Projects
- [ ] Multiple Layers

#### Phase 3 (Pro Features) 🚀
- [ ] Music Visualizer
- [ ] Games Integration
- [ ] Cloud Sync
- [ ] Real-time Collaboration

---

## Recent Updates

### ✅ Performance & Code Quality Improvements (Latest)
- [x] **Fixed inefficient deep copying** in frame updates
- [x] **Optimized Cell component rendering** with React.memo
- [x] **Enhanced error handling** in serial communication
- [x] **Added loading states** for better UX
- [x] **Separated animation states** to prevent frame overwrites
- [x] **Improved TypeScript typing** throughout codebase
- [x] **Enhanced buffer allocation** for better performance
- [x] **Proper useCallback implementation** to prevent unnecessary re-renders

Enjoy designing!
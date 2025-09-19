# Matrix Painter for WS2812B LED Matrix

This project is a Python-based graphical user interface (GUI) for experimenting with and controlling addressable RGB LED strips arranged in a serpentine layout to form a matrix. It provides a rich set of tools to draw, create animations, and visualize effects on a 9x22 matrix before sending them to the physical hardware.

## Project Status

**This is Prototype 1.** The script is designed for a 9x22 matrix but is intended to be a foundational tool for testing on much larger designs in the future. The script itself will evolve over time to handle more complex animations and instructions, but the current version represents a deliberately limited scope suitable for a hobbyist project.

## Project Background

This project is the result of over a year of meticulous research into LED matrices, microcontrollers, and software control. After a long phase of learning from various forums, AI assistants, and educational YouTube videos, the hardware was recently assembled for the first phase of testing, with this GUI being the result.

## Features

- **Live Drawing Canvas**: A scalable 9x22 pixel canvas that mirrors the physical LED matrix.
- **Rich Drawing Tools**:
    - Brush, Line, Rectangle, Circle, Flood Fill, and Eraser.
    - Adjustable brush size and opacity.
    - Color chooser with support for color variance and automatic color cycling.
- **Advanced Animation Engine**:
    - Capture static drawings and animate them.
    - Control animation speed and direction (X/Y).
    - Pre-built animation patterns: Horizontal/Vertical Bounce, Circular, Figure-8, and Spiral In/Out.
- **Real-time Generative Effects**:
    - Rainbow Wave, Plasma, Fire, Matrix Rain, Sparkles, and Color Morph.
    - Adjustable speed, intensity, and scale for effects.
- **File Operations**:
    - Load/Save drawings as PNG images.
    - Record and save animations as GIFs.
    - Export and import animations in a portable JSON format.
- **Hardware Integration**:
    - Connects to an Arduino or other microcontroller over a serial port.
    - Real-time brightness control.

## Future Development

The ultimate goal for this project is to scale it up to drive animations on large-scale matrices of up to **10,000 LEDs**. The current development roadmap is focused on testing progressively more powerful hardware to achieve this:

-   **Arduino Nano:** Testing on an Arduino Nano with a USB-C connection to evaluate if the power delivery is better suited for more demanding animations.
-   **ESP32:** Migrating the project to a WiFi-compatible ESP32 to enable wireless control of the matrix.
-   **Teensy:** Exploring the use of a Teensy board for its powerful processing capabilities, which could handle more complex effects and larger matrices.

## Hardware & Power Requirements

### Core Components
- A **9x22 WS2812B** (or compatible, e.g., NeoPixel) LED matrix in a serpentine layout. The `ROWS` and `COLS` constants in the script can be adjusted for other sizes.
- An **Arduino Uno** (or similar microcontroller) to drive the LED matrix. This was tested on an Uno connected with a standard **USB Type-B cable**.
- A computer to run the `Matrix_Painter.py` GUI.

> **A Note on Testing Hardware:** This project was successfully developed using a low-cost Arduino clone (from Temu) and a generic 2-meter addressable RGB strip that was cut and hand-soldered into a matrix via trial and error. This demonstrates that expensive or official hardware is not a requirement to get started!

### ⚠️ Important Notes on Power
- **USB Power is Limited**: Powering the Arduino and a 9x22 LED matrix directly from a computer's USB port is sufficient for basic prototyping but has significant limitations.
- **Risk of Disconnection**: High brightness levels combined with intense animations or effects can draw excessive current, potentially causing the Arduino to disconnect from the computer.
- **Recommendation**: For any extended use or complex animations, it is **strongly recommended to use a separate, external power source** for the LED matrix. When prototyping over USB, keep the brightness low and be mindful of the complexity of the animations you run.

## Software Requirements

- Python 3.6+
- The following Python libraries:
    - `pyserial`
    - `Pillow` (PIL)

## Installation

1.  **Install Python Libraries**:
    ```sh
    pip install pyserial Pillow
    ```
2.  **Upload the Arduino Driver**:
    - For the UI to communicate with the hardware, you **must** upload the provided `MatrixDriver.ino` sketch to your microcontroller.
    - Open `MatrixDriver.ino` in the Arduino IDE.
    - Make sure you have the necessary LED library installed (e.g., Adafruit NeoPixel or FastLED).
    - Upload the sketch to your board.

## How to Use

1.  Connect the LED matrix and the programmed Arduino to your computer.
2.  Run the main application:
    ```sh
    python Matrix_Painter.py
    ```
3.  **Connect to Hardware**:
    - In the "Connection" panel, select the correct serial port for your Arduino.
    - Click "Connect". The status should update to "Connected".
    - Use the "Brightness" slider to control the matrix brightness.
4.  **Draw and Animate**:
    - Use the **Drawing Tools** to create a static image.
    - Use the **Animation** tab to capture your drawing and set it in motion.
    - Use the **Effects** tab to run generative animations.
    - Use **File Operations** to save or load your work.

## Project Files

-   `Matrix_Painter.py`: The main Python script that runs the GUI application.
-   `MatrixDriver.ino`: The crucial Arduino sketch required for the microcontroller to drive the LED matrix.

## License

This project is open-source. You are free to use, modify, and distribute it. Consider adding a license like MIT if you plan to share it widely.

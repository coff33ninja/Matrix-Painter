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

Enjoy designing!

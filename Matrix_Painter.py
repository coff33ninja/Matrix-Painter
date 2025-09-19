import tkinter as tk
from tkinter import ttk, colorchooser, filedialog, messagebox
import serial
import serial.tools.list_ports
import time
import math
import json
import random
import copy
from PIL import Image
import colorsys
from datetime import datetime

# ======================  USER SETTINGS  ======================
ROWS = 9
COLS = 22
SCALE = 20
DEFAULT_BRIGHT = 32
# ===============================================================

# ======================  SERIAL WRAPPER  ======================
class SerialLink:
    def __init__(self, port, baud=115200):
        self.ser = serial.Serial(port, baud, timeout=0)
        time.sleep(2)

    def close(self):
        self.ser.close()
        
    def send_full_frame(self, buf):
        self.ser.write(bytearray([0xFF]) + buf)
        
    def send_pixel(self, x, y, r, g, b):
        self.ser.write(bytearray([0x01, x, y, r, g, b]))
        
    def set_brightness(self, val):
        self.ser.write(bytearray([0x02, val & 0xFF]))
# ===============================================================

# ======================  FRAME BUFFER  ==============
frame = bytearray(ROWS * COLS * 3)
animation_frames = []  # For recording animations
recording = False
playback_index = 0

def idx(x, y):
    if y & 1:
        logical = y * COLS + (COLS - 1 - x)
    else:
        logical = y * COLS + x
    return logical * 3

def set_pixel(x, y, r, g, b):
    if 0 <= x < COLS and 0 <= y < ROWS:
        i = idx(x, y)
        frame[i] = r & 0xFF
        frame[i+1] = g & 0xFF
        frame[i+2] = b & 0xFF

def get_pixel(x, y):
    i = idx(x, y)
    return frame[i], frame[i+1], frame[i+2]
# ===============================================================

# ======================  MAIN APPLICATION CLASS  =============
class MatrixPainter:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title('Matrix Painter – 9×22 WS2812B')
        self.root.resizable(False, False)
        
        # Application state
        self.serial_link = None
        self.animation_running = False
        self.recording = False
        self.animation_frames = []
        self.current_tool = 'brush'
        self.current_color = (255, 255, 255)
        self.show_on_screen = tk.BooleanVar(value=True)
        
        # Advanced brush settings
        self.brush_size = tk.IntVar(value=1)
        self.brush_opacity = tk.DoubleVar(value=1.0)
        self.color_variance = tk.DoubleVar(value=0.0)
        self.auto_color_cycle = tk.BooleanVar(value=False)
        self.color_cycle_speed = tk.DoubleVar(value=1.0)
        self.color_hue_offset = 0
        
        # Animation settings
        self.anim_speed = tk.DoubleVar(value=2.0)
        self.direction_x = tk.DoubleVar(value=1.0)
        self.direction_y = tk.DoubleVar(value=0.0)
        
        # Animation state
        self.captured_drawing = None  # Store user's drawing
        self.animation_offset_x = 0.0
        self.animation_offset_y = 0.0
        self.animation_time = 0
        self.keep_alive = False
        
        self.setup_ui()
        self.init_canvas()
        
    def setup_ui(self):
        # Create main container with notebook for tabs
        main_container = ttk.Frame(self.root)
        main_container.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Connection panel at top
        self.setup_connection_panel(main_container)
        
        # Canvas in middle
        self.setup_canvas(main_container)
        
        # Tabbed control panel at bottom
        self.setup_control_tabs(main_container)
        
    def setup_connection_panel(self, parent):
        conn_frame = ttk.LabelFrame(parent, text="Connection", padding=10)
        conn_frame.pack(fill='x', pady=(0, 10))
        
        # Port selection
        ttk.Label(conn_frame, text="Port:").grid(row=0, column=0, padx=5)
        self.port_var = tk.StringVar()
        self.port_combo = ttk.Combobox(conn_frame, textvariable=self.port_var,
                                      width=12, state='readonly')
        self.port_combo.grid(row=0, column=1, padx=5)
        
        ttk.Button(conn_frame, text='Refresh', 
                  command=self.refresh_ports).grid(row=0, column=2, padx=5)
        ttk.Button(conn_frame, text='Connect', 
                  command=self.connect).grid(row=0, column=3, padx=5)
        
        # Status
        self.status_lbl = ttk.Label(conn_frame, text='Not connected')
        self.status_lbl.grid(row=0, column=4, padx=20)
        
        # Brightness
        ttk.Label(conn_frame, text="Brightness:").grid(row=0, column=5, padx=(20,5))
        self.bright_slider = ttk.Scale(conn_frame, from_=0, to=255, 
                                      orient='horizontal', length=150,
                                      command=self.brightness_changed)
        self.bright_slider.set(DEFAULT_BRIGHT)
        self.bright_slider.grid(row=0, column=6, padx=5)
        
        self.refresh_ports()
        
    def setup_canvas(self, parent):
        canvas_frame = ttk.Frame(parent)
        canvas_frame.pack(pady=10)
        
        self.canvas = tk.Canvas(canvas_frame,
                              width=COLS * SCALE,
                              height=ROWS * SCALE,
                              bg='black',
                              highlightthickness=1,
                              highlightbackground='gray')
        self.canvas.pack()
        
        # Canvas mouse bindings
        self.canvas.bind('<ButtonPress-1>', self.on_mouse_down)
        self.canvas.bind('<B1-Motion>', self.on_mouse_move)
        self.canvas.bind('<ButtonRelease-1>', self.on_mouse_up)
        self.canvas.bind('<Motion>', self.on_mouse_hover)
        
        # Canvas state
        self.cell_id = [[None for _ in range(COLS)] for _ in range(ROWS)]
        self.start_pt = None
        self.preview_ids = []
        
    def setup_control_tabs(self, parent):
        # Create notebook for tabbed interface
        self.notebook = ttk.Notebook(parent)
        self.notebook.pack(fill='both', expand=True, pady=(10, 0))
        
        # Drawing Tools Tab
        self.setup_drawing_tab()
        
        # Animation Tab
        self.setup_animation_tab()
        
        # Effects Tab
        self.setup_effects_tab()
        
        # File Operations Tab
        self.setup_file_tab()
        
    def setup_drawing_tab(self):
        draw_frame = ttk.Frame(self.notebook)
        self.notebook.add(draw_frame, text="Drawing Tools")
        
        # Tool selection
        tools_frame = ttk.LabelFrame(draw_frame, text="Tools", padding=10)
        tools_frame.grid(row=0, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        self.tool_var = tk.StringVar(value='brush')
        tools = [('Brush', 'brush'), ('Line', 'line'), ('Rect', 'rect'), 
                ('Circle', 'circle'), ('Fill', 'fill'), ('Eraser', 'eraser')]
        
        for i, (text, value) in enumerate(tools):
            ttk.Radiobutton(tools_frame, text=text, variable=self.tool_var, 
                           value=value).grid(row=0, column=i, padx=5)
        
        # Brush settings
        brush_frame = ttk.LabelFrame(draw_frame, text="Brush Settings", padding=10)
        brush_frame.grid(row=1, column=0, sticky='ew', padx=5, pady=5)
        
        ttk.Label(brush_frame, text="Size:").grid(row=0, column=0, sticky='w')
        ttk.Scale(brush_frame, from_=1, to=5, orient='horizontal', 
                 variable=self.brush_size).grid(row=0, column=1, sticky='ew')
        
        ttk.Label(brush_frame, text="Opacity:").grid(row=1, column=0, sticky='w')
        ttk.Scale(brush_frame, from_=0.1, to=1.0, orient='horizontal', 
                 variable=self.brush_opacity).grid(row=1, column=1, sticky='ew')
        
        ttk.Label(brush_frame, text="Color Variance:").grid(row=2, column=0, sticky='w')
        ttk.Scale(brush_frame, from_=0, to=50, orient='horizontal', 
                 variable=self.color_variance).grid(row=2, column=1, sticky='ew')
        
        brush_frame.columnconfigure(1, weight=1)
        
        # Color settings
        color_frame = ttk.LabelFrame(draw_frame, text="Color Settings", padding=10)
        color_frame.grid(row=1, column=1, sticky='ew', padx=5, pady=5)
        
        self.color_btn = tk.Button(color_frame, text='Choose Color', 
                                  command=self.choose_color,
                                  bg='white', width=15)
        self.color_btn.grid(row=0, column=0, columnspan=2, pady=5)
        
        ttk.Checkbutton(color_frame, text="Auto Color Cycle", 
                       variable=self.auto_color_cycle).grid(row=1, column=0, columnspan=2)
        
        ttk.Label(color_frame, text="Cycle Speed:").grid(row=2, column=0, sticky='w')
        ttk.Scale(color_frame, from_=0.1, to=5.0, orient='horizontal', 
                 variable=self.color_cycle_speed).grid(row=2, column=1, sticky='ew')
        
        color_frame.columnconfigure(1, weight=1)
        
        # Quick actions
        actions_frame = ttk.LabelFrame(draw_frame, text="Quick Actions", padding=10)
        actions_frame.grid(row=2, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        ttk.Button(actions_frame, text='Clear All', 
                  command=self.clear_matrix).grid(row=0, column=0, padx=5)
        ttk.Button(actions_frame, text='Undo Last', 
                  command=self.undo_last).grid(row=0, column=1, padx=5)
        ttk.Checkbutton(actions_frame, text="Show on Screen", 
                       variable=self.show_on_screen).grid(row=0, column=2, padx=5)
        
        draw_frame.columnconfigure(0, weight=1)
        draw_frame.columnconfigure(1, weight=1)
        
    def setup_animation_tab(self):
        anim_frame = ttk.Frame(self.notebook)
        self.notebook.add(anim_frame, text="Animation")
        
        # Drawing Movement Controls
        movement_frame = ttk.LabelFrame(anim_frame, text="Move Your Drawing", padding=10)
        movement_frame.grid(row=0, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        # Direction controls
        ttk.Label(movement_frame, text="X Direction:").grid(row=0, column=0, sticky='w')
        ttk.Scale(movement_frame, from_=-5, to=5, orient='horizontal', 
                 variable=self.direction_x).grid(row=0, column=1, sticky='ew')
        
        ttk.Label(movement_frame, text="Y Direction:").grid(row=1, column=0, sticky='w')
        ttk.Scale(movement_frame, from_=-5, to=5, orient='horizontal', 
                 variable=self.direction_y).grid(row=1, column=1, sticky='ew')
        
        ttk.Label(movement_frame, text="Speed:").grid(row=2, column=0, sticky='w')
        ttk.Scale(movement_frame, from_=0.1, to=10, orient='horizontal', 
                 variable=self.anim_speed).grid(row=2, column=1, sticky='ew')
        
        movement_frame.columnconfigure(1, weight=1)
        
        # Animation controls
        control_frame = ttk.LabelFrame(anim_frame, text="Animation Controls", padding=10)
        control_frame.grid(row=1, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        ttk.Button(control_frame, text='Start Moving', 
                  command=self.start_drawing_animation).grid(row=0, column=0, padx=5)
        ttk.Button(control_frame, text='Stop Animation', 
                  command=self.stop_animation).grid(row=0, column=1, padx=5)
        ttk.Button(control_frame, text='Keep Alive (Loop)', 
                  command=self.keep_alive_animation).grid(row=0, column=2, padx=5)
        
        # Movement patterns
        pattern_frame = ttk.LabelFrame(anim_frame, text="Movement Patterns", padding=10)
        pattern_frame.grid(row=2, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        ttk.Button(pattern_frame, text='Bounce Horizontal', 
                  command=self.animate_bounce_horizontal).grid(row=0, column=0, padx=5, pady=2)
        ttk.Button(pattern_frame, text='Bounce Vertical', 
                  command=self.animate_bounce_vertical).grid(row=0, column=1, padx=5, pady=2)
        ttk.Button(pattern_frame, text='Circular Motion', 
                  command=self.animate_circular).grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Button(pattern_frame, text='Figure-8', 
                  command=self.animate_figure8).grid(row=1, column=0, padx=5, pady=2)
        ttk.Button(pattern_frame, text='Spiral In', 
                  command=self.animate_spiral_in).grid(row=1, column=1, padx=5, pady=2)
        ttk.Button(pattern_frame, text='Spiral Out', 
                  command=self.animate_spiral_out).grid(row=1, column=2, padx=5, pady=2)
        
        # Drawing capture
        capture_frame = ttk.LabelFrame(anim_frame, text="Capture Current Drawing", padding=10)
        capture_frame.grid(row=3, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        ttk.Button(capture_frame, text='Capture Drawing', 
                  command=self.capture_current_drawing).grid(row=0, column=0, padx=5)
        ttk.Button(capture_frame, text='Clear Captured', 
                  command=self.clear_captured_drawing).grid(row=0, column=1, padx=5)
        
        self.captured_lbl = ttk.Label(capture_frame, text="No drawing captured")
        self.captured_lbl.grid(row=0, column=2, padx=20)
        
        anim_frame.columnconfigure(0, weight=1)
        anim_frame.columnconfigure(1, weight=1)
        
    def setup_effects_tab(self):
        effects_frame = ttk.Frame(self.notebook)
        self.notebook.add(effects_frame, text="Effects")
        
        # Real-time effects
        realtime_frame = ttk.LabelFrame(effects_frame, text="Real-time Effects", padding=10)
        realtime_frame.grid(row=0, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        effects = [
            ("Rainbow Wave", self.effect_rainbow_wave),
            ("Plasma", self.effect_plasma),
            ("Fire", self.effect_fire),
            ("Matrix Rain", self.effect_matrix_rain),
            ("Sparkles", self.effect_sparkles),
            ("Color Morph", self.effect_color_morph),
            ("Corner Rainbow", self.effect_corner_rainbow)
        ]
        
        for i, (name, func) in enumerate(effects):
            row, col = divmod(i, 3)
            ttk.Button(realtime_frame, text=name, 
                      command=func).grid(row=row, column=col, padx=5, pady=2, sticky='ew')
        
        realtime_frame.columnconfigure(0, weight=1)
        realtime_frame.columnconfigure(1, weight=1)
        realtime_frame.columnconfigure(2, weight=1)
        
        # Effect parameters
        params_frame = ttk.LabelFrame(effects_frame, text="Effect Parameters", padding=10)
        params_frame.grid(row=1, column=0, columnspan=2, sticky='ew', padx=5, pady=5)
        
        self.effect_speed = tk.DoubleVar(value=5.0)
        self.effect_intensity = tk.DoubleVar(value=128.0)
        self.effect_scale = tk.DoubleVar(value=1.0)
        
        ttk.Label(params_frame, text="Speed:").grid(row=0, column=0, sticky='w')
        ttk.Scale(params_frame, from_=0.1, to=20, orient='horizontal', 
                 variable=self.effect_speed).grid(row=0, column=1, sticky='ew')
        
        ttk.Label(params_frame, text="Intensity:").grid(row=1, column=0, sticky='w')
        ttk.Scale(params_frame, from_=0, to=255, orient='horizontal', 
                 variable=self.effect_intensity).grid(row=1, column=1, sticky='ew')
        
        ttk.Label(params_frame, text="Scale:").grid(row=2, column=0, sticky='w')
        ttk.Scale(params_frame, from_=0.1, to=5, orient='horizontal', 
                 variable=self.effect_scale).grid(row=2, column=1, sticky='ew')
        
        params_frame.columnconfigure(1, weight=1)
        effects_frame.columnconfigure(0, weight=1)
        effects_frame.columnconfigure(1, weight=1)
        
    def setup_file_tab(self):
        file_frame = ttk.Frame(self.notebook)
        self.notebook.add(file_frame, text="File Operations")
        
        # Image operations
        image_frame = ttk.LabelFrame(file_frame, text="Images", padding=10)
        image_frame.grid(row=0, column=0, sticky='ew', padx=5, pady=5)
        
        ttk.Button(image_frame, text='Load Image', 
                  command=self.load_image).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(image_frame, text='Save as PNG', 
                  command=self.save_png).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(image_frame, text='Save as GIF', 
                  command=self.save_gif).grid(row=0, column=2, padx=5, pady=5)
        
        # Animation operations
        anim_file_frame = ttk.LabelFrame(file_frame, text="Animations", padding=10)
        anim_file_frame.grid(row=1, column=0, sticky='ew', padx=5, pady=5)
        
        ttk.Button(anim_file_frame, text='Load Animation', 
                  command=self.load_animation).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(anim_file_frame, text='Save Animation', 
                  command=self.save_animation).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(anim_file_frame, text='Export JSON', 
                  command=self.export_json).grid(row=0, column=2, padx=5, pady=5)
        
        file_frame.columnconfigure(0, weight=1)
        
    # ====================== CONNECTION METHODS ======================
    def refresh_ports(self):
        ports = [p.device for p in serial.tools.list_ports.comports()]
        self.port_combo['values'] = ports
        if ports:
            self.port_combo.current(0)
            
    def connect(self):
        port = self.port_var.get()
        if not port:
            messagebox.showerror('Error', 'Select a port first')
            return
        try:
            self.serial_link = SerialLink(port)
            self.status_lbl.config(text=f'Connected to {port}')
        except Exception as e:
            messagebox.showerror('Serial error', str(e))
            
    def brightness_changed(self, value):
        if self.serial_link:
            self.serial_link.set_brightness(int(float(value)))
            
    # ====================== CANVAS METHODS ======================
    def init_canvas(self):
        self.clear_matrix()
        
    def rgb_to_hex(self, rgb):
        return '#%02x%02x%02x' % rgb
        
    def draw_square(self, x, y, color, update_canvas=True):
        if not (0 <= x < COLS and 0 <= y < ROWS):
            return
            
        set_pixel(x, y, *color)
        
        if not update_canvas:
            return
            
        hexcol = self.rgb_to_hex(color)
        if self.cell_id[y][x] is None:
            x0, y0 = x * SCALE, y * SCALE
            rect = self.canvas.create_rectangle(
                x0, y0, x0 + SCALE, y0 + SCALE,
                fill=hexcol, outline='')
            self.cell_id[y][x] = rect
        else:
            self.canvas.itemconfig(self.cell_id[y][x], fill=hexcol)
            
    def update_canvas(self):
        for y in range(ROWS):
            for x in range(COLS):
                r, g, b = get_pixel(x, y)
                self.draw_square(x, y, (r, g, b), True)
                
    def send_to_matrix(self):
        if self.serial_link:
            self.serial_link.send_full_frame(frame)

    def record_frame(self):
        if self.recording:
            self.animation_frames.append(frame[:])
            
    # ====================== DRAWING METHODS ======================
    def choose_color(self):
        color = colorchooser.askcolor(title='Choose color')
        if color[0]:
            self.current_color = tuple(int(v) for v in color[0])
            self.color_btn.config(bg=self.rgb_to_hex(self.current_color))
            
    def get_current_color(self):
        if self.auto_color_cycle.get():
            # Cycle through hue spectrum
            hue = (self.color_hue_offset % 360) / 360
            self.color_hue_offset += self.color_cycle_speed.get()
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            color = (int(r * 255), int(g * 255), int(b * 255))
        else:
            color = self.current_color
            
        # Apply color variance
        if self.color_variance.get() > 0:
            variance = self.color_variance.get()
            r, g, b = color
            r = max(0, min(255, r + random.randint(-int(variance), int(variance))))
            g = max(0, min(255, g + random.randint(-int(variance), int(variance))))
            b = max(0, min(255, b + random.randint(-int(variance), int(variance))))
            color = (r, g, b)
            
        return color
        
    def apply_brush(self, x, y):
        size = self.brush_size.get()
        opacity = self.brush_opacity.get()
        color = self.get_current_color()
        
        # Apply brush with size and opacity
        for dy in range(-size//2, size//2 + 1):
            for dx in range(-size//2, size//2 + 1):
                if dx*dx + dy*dy <= (size//2)**2:  # Circular brush
                    px, py = x + dx, y + dy
                    if 0 <= px < COLS and 0 <= py < ROWS:
                        if opacity < 1.0:
                            # Blend with existing pixel
                            old_r, old_g, old_b = get_pixel(px, py)
                            new_r = int(old_r * (1-opacity) + color[0] * opacity)
                            new_g = int(old_g * (1-opacity) + color[1] * opacity)
                            new_b = int(old_b * (1-opacity) + color[2] * opacity)
                            final_color = (new_r, new_g, new_b)
                        else:
                            final_color = color
                        self.draw_square(px, py, final_color, self.show_on_screen.get())
                        
    # ====================== MOUSE HANDLERS ======================
    def on_mouse_down(self, event):
        self.start_pt = (event.x // SCALE, event.y // SCALE)
        
    def on_mouse_move(self, event):
        if not self.start_pt:
            return
            
        x, y = event.x // SCALE, event.y // SCALE
        tool = self.tool_var.get()
        
        if tool == 'brush':
            self.apply_brush(x, y)
        elif tool == 'eraser':
            self.apply_brush_color(x, y, (0, 0, 0))
            
    def on_mouse_up(self, event):
        if not self.start_pt:
            return
            
        x1, y1 = event.x // SCALE, event.y // SCALE
        x0, y0 = self.start_pt
        tool = self.tool_var.get()
        color = self.get_current_color()
        
        if tool == 'line':
            self.draw_line(x0, y0, x1, y1, color)
        elif tool == 'rect':
            self.draw_rect(x0, y0, x1, y1, color)
        elif tool == 'circle':
            r = int(math.hypot(x1 - x0, y1 - y0))
            self.draw_circle(x0, y0, r, color)
        elif tool == 'fill':
            self.flood_fill(x1, y1, color)
            
        self.send_to_matrix()
        self.start_pt = None
        
    def on_mouse_hover(self, event):
        # Could add preview cursor here
        pass
        
    def apply_brush_color(self, x, y, color):
        size = self.brush_size.get()
        for dy in range(-size//2, size//2 + 1):
            for dx in range(-size//2, size//2 + 1):
                if dx*dx + dy*dy <= (size//2)**2:
                    px, py = x + dx, y + dy
                    if 0 <= px < COLS and 0 <= py < ROWS:
                        self.draw_square(px, py, color, self.show_on_screen.get())
                        
    # ====================== SHAPE METHODS ======================
    def draw_line(self, x0, y0, x1, y1, color):
        dx = abs(x1 - x0)
        sx = 1 if x0 < x1 else -1
        dy = -abs(y1 - y0)
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        
        while True:
            self.draw_square(x0, y0, color, self.show_on_screen.get())
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy
                
    def draw_rect(self, x0, y0, x1, y1, color):
        if x0 > x1:
            x0, x1 = x1, x0
        if y0 > y1:
            y0, y1 = y1, y0
        
        # Draw rectangle outline
        for x in range(x0, x1 + 1):
            self.draw_square(x, y0, color, self.show_on_screen.get())
            self.draw_square(x, y1, color, self.show_on_screen.get())
        for y in range(y0, y1 + 1):
            self.draw_square(x0, y, color, self.show_on_screen.get())
            self.draw_square(x1, y, color, self.show_on_screen.get())
            
    def draw_circle(self, cx, cy, r, color):
        x = r
        y = 0
        err = 0
        
        while x >= y:
            points = [
                (cx + x, cy + y), (cx + y, cy + x), (cx - y, cy + x),
                (cx - x, cy + y), (cx - x, cy - y), (cx - y, cy - x),
                (cx + y, cy - x), (cx + x, cy - y)
            ]
            
            for px, py in points:
                self.draw_square(px, py, color, self.show_on_screen.get())
                
            y += 1
            err += 1 + 2*y
            if 2*(err - x) + 1 > 0:
                x -= 1
                err += 1 - 2*x
                
    def flood_fill(self, x, y, new_color):
        if not (0 <= x < COLS and 0 <= y < ROWS):
            return
            
        old_color = get_pixel(x, y)
        if old_color == new_color:
            return
            
        stack = [(x, y)]
        while stack:
            cx, cy = stack.pop()
            if not (0 <= cx < COLS and 0 <= cy < ROWS):
                continue
            if get_pixel(cx, cy) != old_color:
                continue
                
            self.draw_square(cx, cy, new_color, self.show_on_screen.get())
            
            stack.extend([(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)])
            
    # ====================== UTILITY METHODS ======================
    def clear_matrix(self):
        global frame
        frame = bytearray(ROWS * COLS * 3)
        for y in range(ROWS):
            for x in range(COLS):
                self.draw_square(x, y, (0, 0, 0), self.show_on_screen.get())
        self.send_to_matrix()
        
    def undo_last(self):
        # Simple undo - just clear the matrix for now
        # Could be to store drawing states
        self.clear_matrix()
        messagebox.showinfo("Undo", "Matrix cleared - undo coming soon!")
            
    # ====================== USER DRAWING ANIMATION ======================
    def capture_current_drawing(self):
        """Capture the current drawing for animation"""
        self.captured_drawing = []
        
        # Store all non-black pixels with their positions and colors
        for y in range(ROWS):
            for x in range(COLS):
                r, g, b = get_pixel(x, y)
                if r > 0 or g > 0 or b > 0:  # Non-black pixel
                    self.captured_drawing.append({
                        'x': x, 'y': y, 'color': (r, g, b)
                    })
        
        if self.captured_drawing:
            self.captured_lbl.config(text=f"Captured {len(self.captured_drawing)} pixels")
        else:
            self.captured_lbl.config(text="No drawing found to capture")
            
    def clear_captured_drawing(self):
        """Clear the captured drawing"""
        self.captured_drawing = None
        self.captured_lbl.config(text="No drawing captured")
        
    def start_drawing_animation(self):
        """Start moving the captured drawing based on direction vectors"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = False
        self.animation_offset_x = 0.0
        self.animation_offset_y = 0.0
        self.status_lbl.config(text='Moving drawing...')
        self.move_drawing_step()
        
    def keep_alive_animation(self):
        """Keep the animation running continuously (loop)"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = True
        self.animation_offset_x = 0.0
        self.animation_offset_y = 0.0
        self.status_lbl.config(text='Drawing moving (keep alive)...')
        self.move_drawing_step()
        
    def move_drawing_step(self):
        """Move the captured drawing one step"""
        if not self.animation_running or not self.captured_drawing:
            return
            
        # Clear the matrix
        self.clear_matrix_silent()
        
        # Calculate movement
        dx = self.direction_x.get() * self.anim_speed.get() * 0.1
        dy = self.direction_y.get() * self.anim_speed.get() * 0.1
        
        self.animation_offset_x += dx
        self.animation_offset_y += dy
        
        # Draw the captured drawing at new position
        drawing_visible = False
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + self.animation_offset_x) % COLS
            new_y = int(pixel['y'] + self.animation_offset_y) % ROWS
            
            # Handle wrapping for continuous movement
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                drawing_visible = True
                
        self.send_to_matrix()
        
        # Continue animation if keep_alive or if drawing is still visible
        if self.keep_alive or drawing_visible:
            delay = max(10, int(100 / self.anim_speed.get()))
            self.root.after(delay, self.move_drawing_step)
        else:
            self.animation_running = False
            self.status_lbl.config(text='Animation finished')
            
    def clear_matrix_silent(self):
        """Clear matrix without updating status or recording"""
        global frame
        frame = bytearray(ROWS * COLS * 3)
        if self.show_on_screen.get():
            for y in range(ROWS):
                for x in range(COLS):
                    self.draw_square(x, y, (0, 0, 0), True)
                    
    # ====================== PATTERN ANIMATIONS ======================
    def animate_bounce_horizontal(self):
        """Make drawing bounce horizontally"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = True
        self.animation_time = 0
        self.status_lbl.config(text='Bouncing horizontally...')
        self.bounce_horizontal_step()
        
    def bounce_horizontal_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        # Calculate bounce position
        bounce_range = COLS - 1
        position = (math.sin(self.animation_time * self.anim_speed.get() * 0.1) + 1) * bounce_range / 2
        offset_x = position
        
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + offset_x) % COLS
            new_y = pixel['y']
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
        delay = max(10, int(100 / self.anim_speed.get()))
        self.root.after(delay, self.bounce_horizontal_step)
        
    def animate_bounce_vertical(self):
        """Make drawing bounce vertically"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = True
        self.animation_time = 0
        self.status_lbl.config(text='Bouncing vertically...')
        self.bounce_vertical_step()
        
    def bounce_vertical_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        bounce_range = ROWS - 1
        position = (math.sin(self.animation_time * self.anim_speed.get() * 0.1) + 1) * bounce_range / 2
        offset_y = position
        
        for pixel in self.captured_drawing:
            new_x = pixel['x']
            new_y = int(pixel['y'] + offset_y) % ROWS
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
        delay = max(10, int(100 / self.anim_speed.get()))
        self.root.after(delay, self.bounce_vertical_step)
        
    def animate_circular(self):
        """Make drawing move in a circle"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = True
        self.animation_time = 0
        self.status_lbl.config(text='Circular motion...')
        self.circular_step()
        
    def circular_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        # Calculate circular position
        radius_x = COLS / 4
        radius_y = ROWS / 4
        center_x = COLS / 2
        center_y = ROWS / 2
        
        angle = self.animation_time * self.anim_speed.get() * 0.1
        offset_x = math.cos(angle) * radius_x
        offset_y = math.sin(angle) * radius_y
        
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + offset_x + center_x - COLS/2) % COLS
            new_y = int(pixel['y'] + offset_y + center_y - ROWS/2) % ROWS
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
        delay = max(10, int(100 / self.anim_speed.get()))
        self.root.after(delay, self.circular_step)
        
    def animate_figure8(self):
        """Make drawing move in a figure-8 pattern"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.keep_alive = True
        self.animation_time = 0
        self.status_lbl.config(text='Figure-8 pattern...')
        self.figure8_step()
        
    def figure8_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        # Figure-8 equations
        t = self.animation_time * self.anim_speed.get() * 0.05
        scale_x = COLS / 6
        scale_y = ROWS / 4
        
        offset_x = math.sin(t) * scale_x
        offset_y = math.sin(2 * t) * scale_y
        
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + offset_x + COLS/2 - pixel['x']) % COLS
            new_y = int(pixel['y'] + offset_y + ROWS/2 - pixel['y']) % ROWS
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
        delay = max(10, int(100 / self.anim_speed.get()))
        self.root.after(delay, self.figure8_step)
        
    def animate_spiral_in(self):
        """Make drawing spiral inward"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.animation_time = 0
        self.status_lbl.config(text='Spiraling in...')
        self.spiral_in_step()
        
    def spiral_in_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        # Spiral inward
        max_radius = max(COLS, ROWS) / 2
        current_radius = max_radius * (1 - self.animation_time * self.anim_speed.get() * 0.01)
        
        if current_radius <= 0:
            self.animation_running = False
            self.status_lbl.config(text='Spiral complete')
            return
            
        angle = self.animation_time * self.anim_speed.get() * 0.2
        offset_x = math.cos(angle) * current_radius
        offset_y = math.sin(angle) * current_radius
        
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + offset_x + COLS/2 - pixel['x']) % COLS
            new_y = int(pixel['y'] + offset_y + ROWS/2 - pixel['y']) % ROWS
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
        delay = max(10, int(100 / self.anim_speed.get()))
        self.root.after(delay, self.spiral_in_step)
        
    def animate_spiral_out(self):
        """Make drawing spiral outward"""
        if not self.captured_drawing:
            messagebox.showinfo("No Drawing", "Capture a drawing first")
            return
            
        self.animation_running = True
        self.animation_time = 0
        self.status_lbl.config(text='Spiraling out...')
        self.spiral_out_step()
        
    def spiral_out_step(self):
        if not self.animation_running or not self.captured_drawing:
            return
            
        self.clear_matrix_silent()
        
        # Spiral outward
        max_radius = max(COLS, ROWS)
        current_radius = self.animation_time * self.anim_speed.get() * 0.1
        
        if current_radius > max_radius:
            if self.keep_alive:
                self.animation_time = 0  # Reset for continuous spiral
                current_radius = 0
            else:
                self.animation_running = False
                self.status_lbl.config(text='Spiral complete')
                return
            
        angle = self.animation_time * self.anim_speed.get() * 0.2
        offset_x = math.cos(angle) * current_radius
        offset_y = math.sin(angle) * current_radius
        
        for pixel in self.captured_drawing:
            new_x = int(pixel['x'] + offset_x + COLS/2 - pixel['x']) % COLS
            new_y = int(pixel['y'] + offset_y + ROWS/2 - pixel['y']) % ROWS
            
            if 0 <= new_x < COLS and 0 <= new_y < ROWS:
                self.draw_square(new_x, new_y, pixel['color'], self.show_on_screen.get())
                
        self.send_to_matrix()
        self.animation_time += 1
        
    def stop_animation(self):
        """Stop any running animation"""
        self.animation_running = False
        self.keep_alive = False
        self.status_lbl.config(text='Animation stopped')
        
    # ====================== ADVANCED EFFECTS ======================
    def effect_rainbow_wave(self):
        self.animation_running = True
        self.status_lbl.config(text='Rainbow wave effect running')
        self.rainbow_offset = 0
        self.rainbow_wave_step()
        
    def rainbow_wave_step(self):
        if not self.animation_running:
            return
            
        for y in range(ROWS):
            for x in range(COLS):
                # Create wave pattern
                wave = math.sin((x + self.rainbow_offset) * 0.5) * 0.5 + 0.5
                hue = (wave + y * 0.1) % 1.0
                
                r, g, b = colorsys.hsv_to_rgb(hue, 1.0, self.effect_intensity.get() / 255)
                color = (int(r * 255), int(g * 255), int(b * 255))
                
                self.draw_square(x, y, color, self.show_on_screen.get())
                
        self.send_to_matrix()
        self.rainbow_offset += self.effect_speed.get() * 0.1
        
        delay = max(10, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.rainbow_wave_step)
        
    def effect_plasma(self):
        self.animation_running = True
        self.status_lbl.config(text='Plasma effect running')
        self.plasma_time = 0
        self.plasma_step()
        
    def plasma_step(self):
        if not self.animation_running:
            return
            
        scale = self.effect_scale.get()
        
        for y in range(ROWS):
            for x in range(COLS):
                # Plasma algorithm
                v1 = math.sin(x * scale * 0.1 + self.plasma_time)
                v2 = math.sin(y * scale * 0.1 + self.plasma_time)
                v3 = math.sin((x + y) * scale * 0.1 + self.plasma_time)
                v4 = math.sin(math.sqrt(x*x + y*y) * scale * 0.1 + self.plasma_time)
                
                plasma = (v1 + v2 + v3 + v4) / 4
                hue = (plasma + 1) / 2  # Normalize to 0-1
                
                r, g, b = colorsys.hsv_to_rgb(hue, 1.0, self.effect_intensity.get() / 255)
                color = (int(r * 255), int(g * 255), int(b * 255))
                
                self.draw_square(x, y, color, self.show_on_screen.get())
                
        self.send_to_matrix()
        self.plasma_time += self.effect_speed.get() * 0.01
        
        delay = max(10, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.plasma_step)
        
    def effect_fire(self):
        self.animation_running = True
        self.status_lbl.config(text='Fire effect running')
        self.fire_buffer = [[0 for _ in range(COLS)] for _ in range(ROWS + 1)]
        self.fire_step()
        
    def fire_step(self):
        if not self.animation_running:
            return
            
        # Add heat at bottom
        for x in range(COLS):
            self.fire_buffer[ROWS][x] = random.randint(0, int(self.effect_intensity.get()))
            
        # Propagate heat upward
        for y in range(ROWS):
            for x in range(COLS):
                heat = 0
                count = 0
                
                # Average surrounding pixels
                for dx in [-1, 0, 1]:
                    for dy in [0, 1]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < COLS and 0 <= ny <= ROWS:
                            heat += self.fire_buffer[ny][nx]
                            count += 1
                            
                # Cool down and set new heat
                self.fire_buffer[y][x] = max(0, heat // count - random.randint(0, 3))
                
                # Convert heat to color
                heat_val = self.fire_buffer[y][x]
                if heat_val < 64:
                    color = (heat_val * 4, 0, 0)
                elif heat_val < 128:
                    color = (255, (heat_val - 64) * 4, 0)
                else:
                    color = (255, 255, (heat_val - 128) * 2)
                    
                self.draw_square(x, y, color, self.show_on_screen.get())
                
        self.send_to_matrix()
        
        delay = max(50, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.fire_step)
        
    def effect_matrix_rain(self):
        self.animation_running = True
        self.status_lbl.config(text='Matrix rain effect running')
        self.rain_drops = []
        
        # Initialize rain drops
        for _ in range(COLS // 2):
            self.rain_drops.append({
                'x': random.randint(0, COLS - 1),
                'y': random.randint(-ROWS, 0),
                'speed': random.uniform(0.5, 2.0),
                'brightness': random.randint(64, 255)
            })
            
        self.matrix_rain_step()
        
    def matrix_rain_step(self):
        if not self.animation_running:
            return
            
        # Fade all pixels
        for y in range(ROWS):
            for x in range(COLS):
                r, g, b = get_pixel(x, y)
                r = int(r * 0.9)
                g = int(g * 0.9)
                b = int(b * 0.9)
                self.draw_square(x, y, (r, g, b), False)
                
        # Update rain drops
        for drop in self.rain_drops:
            drop['y'] += drop['speed']
            
            # Draw trail
            for trail in range(3):
                y_pos = int(drop['y'] - trail)
                if 0 <= y_pos < ROWS:
                    brightness = drop['brightness'] * (1.0 - trail * 0.3)
                    color = (0, int(brightness), 0)  # Green matrix style
                    self.draw_square(drop['x'], y_pos, color, False)
                    
            # Reset if off screen
            if drop['y'] > ROWS + 3:
                drop['y'] = random.randint(-ROWS, 0)
                drop['x'] = random.randint(0, COLS - 1)
                drop['speed'] = random.uniform(0.5, 2.0)
                drop['brightness'] = random.randint(64, 255)
                
        if self.show_on_screen.get():
            self.update_canvas()
        self.send_to_matrix()
        
        delay = max(50, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.matrix_rain_step)
        
    def effect_sparkles(self):
        self.animation_running = True
        self.status_lbl.config(text='Sparkles effect running')
        self.sparkles_step()
        
    def sparkles_step(self):
        if not self.animation_running:
            return
            
        # Fade all pixels
        for y in range(ROWS):
            for x in range(COLS):
                r, g, b = get_pixel(x, y)
                r = int(r * 0.95)
                g = int(g * 0.95)
                b = int(b * 0.95)
                self.draw_square(x, y, (r, g, b), False)
                
        # Add new sparkles
        num_sparkles = max(1, int(self.effect_intensity.get() / 32))
        for _ in range(num_sparkles):
            x = random.randint(0, COLS - 1)
            y = random.randint(0, ROWS - 1)
            
            # Random bright color
            hue = random.random()
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            color = (int(r * 255), int(g * 255), int(b * 255))
            
            self.draw_square(x, y, color, False)
            
        if self.show_on_screen.get():
            self.update_canvas()
        self.send_to_matrix()
        
        delay = max(50, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.sparkles_step)
        
    def effect_color_morph(self):
        self.animation_running = True
        self.status_lbl.config(text='Color morph effect running')
        self.morph_time = 0
        self.color_morph_step()
        
    def color_morph_step(self):
        if not self.animation_running:
            return
            
        # Create morphing colors based on position and time
        for y in range(ROWS):
            for x in range(COLS):
                # Calculate morphing hue
                distance = math.sqrt((x - COLS/2)**2 + (y - ROWS/2)**2)
                hue = (distance * 0.1 + self.morph_time) % 1.0
                
                r, g, b = colorsys.hsv_to_rgb(hue, 1.0, self.effect_intensity.get() / 255)
                color = (int(r * 255), int(g * 255), int(b * 255))
                
                self.draw_square(x, y, color, self.show_on_screen.get())
                
        self.send_to_matrix()
        self.morph_time += self.effect_speed.get() * 0.01
        
        delay = max(10, int(1000 / self.effect_speed.get()))
        self.root.after(delay, self.color_morph_step)

    def effect_corner_rainbow(self):
        self.animation_running = True
        self.status_lbl.config(text='Corner Rainbow effect running')
        self.animation_time = 0
        self.corner_effect_current_corner = 0
        self.corner_effect_fade_level = 255
        self.corner_effect_fading_out = False
        self.corner_effect_last_switch_time = time.time()
        self.corner_rainbow_step()

    def corner_rainbow_step(self):
        if not self.animation_running:
            return

        self.animation_time += 1
        t = self.animation_time * self.effect_speed.get() * 0.2

        # Pulsing brightness (breathing effect)
        # beatsin8(6, 180, 255) -> 6 BPM sine wave between 180 and 255
        bpm = 6
        min_bright = 180
        max_bright = 255
        beat = (math.sin(time.time() * (bpm / 60.0) * 2 * math.pi) + 1) / 2
        pulse = min_bright + beat * (max_bright - min_bright)

        # Manage fading/switching
        if not self.corner_effect_fading_out and (time.time() - self.corner_effect_last_switch_time > random.uniform(3, 5)):
            self.corner_effect_fading_out = True

        if self.corner_effect_fading_out:
            if self.corner_effect_fade_level > 10:
                self.corner_effect_fade_level -= 10
            else:
                self.corner_effect_fade_level = 0
                self.corner_effect_current_corner = random.randint(0, 3)
                self.corner_effect_fading_out = False
        else:
            if self.corner_effect_fade_level < 245:
                self.corner_effect_fade_level += 10
            else:
                self.corner_effect_fade_level = 255
                self.corner_effect_last_switch_time = time.time()

        # Draw rainbow from currentCorner
        for y in range(ROWS):
            for x in range(COLS):
                diag = 0
                if self.corner_effect_current_corner == 0: # Top-Left
                    diag = x + y
                elif self.corner_effect_current_corner == 1: # Top-Right
                    diag = (COLS - 1 - x) + y
                elif self.corner_effect_current_corner == 2: # Bottom-Left
                    diag = x + (ROWS - 1 - y)
                elif self.corner_effect_current_corner == 3: # Bottom-Right
                    diag = (COLS - 1 - x) + (ROWS - 1 - y)

                hue = ((diag * 12) + t) / 255.0
                hue = hue - math.floor(hue) # equivalent of & 0xFF

                # Combine fadeLevel and pulse
                brightness = (pulse / 255.0) * (self.corner_effect_fade_level / 255.0)
                
                r, g, b = colorsys.hsv_to_rgb(hue, 1.0, brightness)
                color = (int(r * 255), int(g * 255), int(b * 255))
                self.draw_square(x, y, color, self.show_on_screen.get())

        self.send_to_matrix()
        
        delay = 30 # ms, for ~33 FPS
        self.root.after(delay, self.corner_rainbow_step)
        
    # ====================== FILE OPERATIONS ======================
    def load_image(self):
        filename = filedialog.askopenfilename(
            filetypes=[('Image files', '*.png *.jpg *.jpeg *.bmp')])
        if not filename:
            return
            
        try:
            img = Image.open(filename).convert('RGB')
            img = img.resize((COLS, ROWS), Image.LANCZOS)
            
            for y in range(ROWS):
                for x in range(COLS):
                    r, g, b = img.getpixel((x, y))
                    set_pixel(x, y, r, g, b)
                    
            if self.show_on_screen.get():
                self.update_canvas()
            self.send_to_matrix()
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to load image: {e}')
            
    def save_png(self):
        filename = filedialog.asksaveasfilename(
            defaultextension='.png',
            filetypes=[('PNG files', '*.png')])
        if not filename:
            return
            
        try:
            img = Image.new('RGB', (COLS, ROWS))
            pixels = img.load()
            
            for y in range(ROWS):
                for x in range(COLS):
                    pixels[x, y] = get_pixel(x, y)
                    
            # Scale up for better visibility
            img = img.resize((COLS * 10, ROWS * 10), Image.NEAREST)
            img.save(filename)
            
            messagebox.showinfo('Success', f'Saved to {filename}')
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to save PNG: {e}')
            
    def save_gif(self):
        if not self.animation_frames:
            messagebox.showinfo("No Animation", "Record an animation first")
            return
            
        filename = filedialog.asksaveasfilename(
            defaultextension='.gif',
            filetypes=[('GIF files', '*.gif')])
        if not filename:
            return
            
        try:
            images = []
            for frame_data in self.animation_frames:
                img = Image.new('RGB', (COLS, ROWS))
                pixels = img.load()
                
                for y in range(ROWS):
                    for x in range(COLS):
                        i = idx(x, y)
                        r, g, b = frame_data[i], frame_data[i+1], frame_data[i+2]
                        pixels[x, y] = (r, g, b)
                        
                # Scale up
                img = img.resize((COLS * 10, ROWS * 10), Image.NEAREST)
                images.append(img)
                
            # Save as animated GIF
            duration = max(1, int(1000 / self.anim_speed.get()))
            images[0].save(filename, save_all=True, append_images=images[1:],
                          duration=duration, loop=0)
                          
            messagebox.showinfo('Success', f'Saved animation to {filename}')
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to save GIF: {e}')
            
    def load_animation(self):
        filename = filedialog.askopenfilename(
            filetypes=[('JSON files', '*.json')])
        if not filename:
            return
            
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
                
            self.animation_frames = []
            
            if 'frames' in data:
                # Load frame-based animation
                for frame_info in data['frames']:
                    frame_data = bytearray(ROWS * COLS * 3)
                    
                    if 'data' in frame_info:
                        # Direct frame data
                        for i, val in enumerate(frame_info['data'][:len(frame_data)]):
                            frame_data[i] = int(val)
                    elif 'pixels' in frame_info:
                        # Pixel-based data
                        for pixel in frame_info['pixels']:
                            x, y = pixel['x'], pixel['y']
                            r, g, b = pixel['c']
                            if 0 <= x < COLS and 0 <= y < ROWS:
                                i = idx(x, y)
                                frame_data[i] = r
                                frame_data[i+1] = g
                                frame_data[i+2] = b
                                
                    self.animation_frames.append(frame_data)
                    
            self.frames_lbl.config(text=f"Frames: {len(self.animation_frames)}")
            messagebox.showinfo('Success', f'Loaded {len(self.animation_frames)} frames')
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to load animation: {e}')
            
    def save_animation(self):
        if not self.animation_frames:
            messagebox.showinfo("No Animation", "Record an animation first")
            return
            
        filename = filedialog.asksaveasfilename(
            defaultextension='.json',
            filetypes=[('JSON files', '*.json')])
        if not filename:
            return
            
        try:
            data = {
                'fps': int(self.anim_speed.get()),
                'frames': []
            }
            
            for frame_data in self.animation_frames:
                frame_info = {
                    'data': list(frame_data),
                    'duration': 1
                }
                data['frames'].append(frame_info)
                
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
                
            messagebox.showinfo('Success', f'Saved animation to {filename}')
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to save animation: {e}')
            
    def export_json(self):
        filename = filedialog.asksaveasfilename(
            defaultextension='.json',
            filetypes=[('JSON files', '*.json')])
        if not filename:
            return
            
        try:
            data = {
                'matrix_info': {
                    'rows': ROWS,
                    'cols': COLS,
                    'created': datetime.now().isoformat()
                },
                'current_frame': list(frame)
            }
            
            if self.animation_frames:
                data['animation'] = {
                    'fps': int(self.anim_speed.get()),
                    'frame_count': len(self.animation_frames),
                    'frames': [list(f) for f in self.animation_frames]
                }
                
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
                
            messagebox.showinfo('Success', f'Exported to {filename}')
            
        except Exception as e:
            messagebox.showerror('Error', f'Failed to export: {e}')
            
    def run(self):
        self.root.mainloop()

# ======================  MAIN ENTRY POINT  ===================
if __name__ == '__main__':
    app = MatrixPainter()
    app.run()
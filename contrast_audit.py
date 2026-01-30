
import math

def hsl_to_rgb(h, s, l):
    # s and l are percentages 0-100, h is 0-360
    s /= 100.0
    l /= 100.0
    
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60.0) % 2 - 1))
    m = l - c / 2.0
    
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
        
    return (r + m), (g + m), (b + m)

def get_relative_luminance(r, g, b):
    # Convert RGB to linear RGB
    def linearize(v):
        if v <= 0.03928:
            return v / 12.92
        return ((v + 0.055) / 1.055) ** 2.4
        
    r_lin = linearize(r)
    g_lin = linearize(g)
    b_lin = linearize(b)
    
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin

def calculate_contrast_ratio(l1, l2):
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_color_pair(name, h1, s1, l1, h2, s2, l2):
    r1, g1, b1 = hsl_to_rgb(h1, s1, l1)
    r2, g2, b2 = hsl_to_rgb(h2, s2, l2)
    
    lum1 = get_relative_luminance(r1, g1, b1)
    lum2 = get_relative_luminance(r2, g2, b2)
    
    ratio = calculate_contrast_ratio(lum1, lum2)
    
    print(f"Checking {name}:")
    print(f"  Color 1 (HSL: {h1}, {s1}, {l1}) -> Lum: {lum1:.4f}")
    print(f"  Color 2 (HSL: {h2}, {s2}, {l2}) -> Lum: {lum2:.4f}")
    print(f"  Contrast Ratio: {ratio:.2f}:1")
    
    if ratio >= 7:
        print("  ✅ AAA Pass (Excellent)")
    elif ratio >= 4.5:
        print("  ✅ AA Pass (Good for normal text)")
    elif ratio >= 3:
        print("  ⚠️ AA Large Pass (Good for large text/UI only)")
    else:
        print("  ❌ FAIL (Too low)")
    print("-" * 40)

# Colors from index.css

# Light Mode
# --accent-highlight: 77 90% 55%; 
# --accent-highlight-foreground: 0 0% 10%;
check_color_pair("Light Mode - Accent Highlight vs Foreground", 
                 77, 90, 55, 
                 0, 0, 10)

# --accent: 180 90% 97%;
# --accent-foreground: 180 90% 45%;
check_color_pair("Light Mode - Accent vs Foreground", 
                 180, 90, 97, 
                 180, 90, 45)                 

# Dark Mode
# --accent-highlight: 77 90% 65%;
# --accent-highlight-foreground: 0 0% 10%;
check_color_pair("Dark Mode - Accent Highlight vs Foreground", 
                 77, 90, 65, 
                 0, 0, 10)

# --accent: 180 90% 15%;
# --accent-foreground: 180 90% 85%;
check_color_pair("Dark Mode - Accent vs Foreground", 
                 180, 90, 15, 
                 180, 90, 85)

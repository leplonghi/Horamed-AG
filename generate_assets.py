from PIL import Image, ImageDraw, ImageFont
import os

# Create directory
if not os.path.exists('playstore_assets'):
    os.makedirs('playstore_assets')

# 1. Copy Icon 512
try:
    img_512 = Image.open('public/icon-512.png')
    img_512.save('playstore_assets/icon_512.png')
    print("✅ Icon 512 saved")
except:
    print("❌ public/icon-512.png not found")

# 2. Create Feature Graphic (1024x500)
# Create a solid background (Royal Blue / Medical Blue)
feature = Image.new('RGB', (1024, 500), color = '#2E4C9D')
draw = ImageDraw.Draw(feature)

# Try to paste the icon in the center
try:
    icon = Image.open('public/icon-512.png')
    # Resize icon to fit nicely
    icon = icon.resize((300, 300))
    # Paste centered
    x = (1024 - 300) // 2
    y = (500 - 300) // 2
    feature.paste(icon, (x, y), icon if icon.mode == 'RGBA' else None)
except:
    pass

feature.save('playstore_assets/feature_graphic.png')
print("✅ Feature Graphic saved")

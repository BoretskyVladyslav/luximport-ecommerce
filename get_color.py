
from PIL import Image
import sys

def get_pixel_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        # Get top left pixel
        pixel = img.getpixel((10, 10))
        return '#{:02x}{:02x}{:02x}'.format(*pixel)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    print(get_pixel_color('public/images/hero-bg-mobile.jpg'))

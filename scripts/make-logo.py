import os
import shutil
from PIL import Image

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ico_path = os.path.join(root_dir, 'icon1.ico')
    public_dir = os.path.join(root_dir, 'client', 'public')
    os.makedirs(public_dir, exist_ok=True)

    print(f"Reading ICO from: {ico_path}")
    ico = Image.open(ico_path)

    # Find the largest frame in the ICO
    largest_frame = None
    max_size = (0, 0)

    try:
        n_frames = getattr(ico, 'n_frames', 1)
        for i in range(n_frames):
            ico.seek(i)
            frame = ico.copy().convert('RGBA')
            if frame.width * frame.height > max_size[0] * max_size[1]:
                max_size = (frame.width, frame.height)
                largest_frame = frame
    except Exception as e:
        print(f"Frame iteration exception: {e}")
        ico.seek(0)
        largest_frame = ico.convert('RGBA')

    print(f"Largest frame size: {largest_frame.size}")

    # Check corners for solid background
    w, h = largest_frame.size
    corners = [
        largest_frame.getpixel((0, 0)),
        largest_frame.getpixel((w - 1, 0)),
        largest_frame.getpixel((0, h - 1)),
        largest_frame.getpixel((w - 1, h - 1)),
    ]
    print(f"Corner pixels: {corners}")

    # Check if corners are opaque light/off-white (e.g. RGB > 230 and Alpha > 200)
    has_solid_light_bg = all(c[3] > 200 and c[0] > 230 and c[1] > 230 and c[2] > 230 for c in corners)

    processed = largest_frame
    if has_solid_light_bg:
        print("Detected solid light/white square background. Making background transparent or cropped.")
        # If it's a solid white background, let's floodfill transparency from corners or make near-white transparent
        from PIL import ImageDraw
        # Convert near-white connected background to transparent using floodfill
        # Or make near-white pixels (where r,g,b > 240) transparent if outer boundary
        # A clean way with PIL: floodfill from corners on a mask
        mask = Image.new('L', (w, h), 0)
        for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
            # Floodfill contiguous light pixels
            ImageDraw.floodfill(processed, pt, (0, 0, 0, 0), thresh=25)
        
        # Crop bounding box of non-transparent area
        bbox = processed.getbbox()
        if bbox:
            cropped = processed.crop(bbox)
            # Re-center cropped image in a square canvas with small padding
            max_dim = max(cropped.width, cropped.height)
            sq = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
            offset = ((max_dim - cropped.width) // 2, (max_dim - cropped.height) // 2)
            sq.paste(cropped, offset, cropped)
            processed = sq

    # Save destinations
    sizes = {
        'logo.png': (256, 256),
        'favicon-32.png': (32, 32),
        'apple-touch-icon.png': (180, 180),
        'icon-192.png': (192, 192),
        'icon-512.png': (512, 512),
    }

    for filename, size in sizes.items():
        out_path = os.path.join(public_dir, filename)
        resized = processed.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, format='PNG')
        print(f"Saved: {out_path} ({size[0]}x{size[1]})")

    # Copy original favicon.ico into client/public/favicon.ico
    fav_dest = os.path.join(public_dir, 'favicon.ico')
    shutil.copyfile(ico_path, fav_dest)
    print(f"Copied original favicon to: {fav_dest}")

if __name__ == '__main__':
    main()

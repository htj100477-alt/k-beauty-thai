import os
import glob
from PIL import Image

parts_dir = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_parts"
parts = sorted(glob.glob(os.path.join(parts_dir, "part_*.jpg")))

print("index | file_name | size")
print("---|---|---")
for i, p in enumerate(parts):
    size = os.path.getsize(p)
    if size < 5000:
        continue
    img = Image.open(p)
    print(f"{i} | {os.path.basename(p)} | {img.size}")

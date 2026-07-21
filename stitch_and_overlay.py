from PIL import Image, ImageDraw, ImageFont
import os, glob

parts_dir = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_parts"
out_path = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_full_detail.jpg"

# 부품 이미지들 순서대로 로드 (너무 작은건 제외 - 빈 조각)
parts = sorted(glob.glob(os.path.join(parts_dir, "part_*.jpg")))
images = []
for p in parts:
    size = os.path.getsize(p)
    if size < 5000:  # 5KB 미만 스킵
        print(f"  스킵 (너무 작음): {os.path.basename(p)} ({size} bytes)")
        continue
    try:
        img = Image.open(p)
        images.append(img)
        print(f"  로드: {os.path.basename(p)} → {img.size}")
    except Exception as e:
        print(f"  오류: {os.path.basename(p)} - {e}")

print(f"\n총 {len(images)}개 이미지 이어붙이기...")

# 최대 너비 기준
max_w = max(img.width for img in images)

# 세로 이어붙이기
total_h = sum(img.height for img in images)
combined = Image.new("RGB", (max_w, total_h), (255, 255, 255))

y = 0
for img in images:
    # 너비 맞추기
    if img.width != max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)
    combined.paste(img, (0, y))
    y += img.height

print(f"합친 이미지 크기: {combined.size}")

# === 태국어 오버레이 (하단) ===
combined_rgba = combined.convert("RGBA")
overlay = Image.new("RGBA", combined_rgba.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

W, H = combined_rgba.size
box_h = 280
box_y = H - box_h

draw.rectangle([(0, box_y), (W, H)], fill=(0, 0, 0, 185))

font_path = r"C:\Windows\Fonts\Tahoma.ttf"
texts = [
    ("ข้อมูลสินค้าภาษาไทย", 42, (80, 220, 160, 255)),
    ("แบรนด์: อีออม (EAOM) | หน้ากากรักษาสิวและดูแลผิว", 28, (255, 255, 255, 230)),
    ("จำนวน: 3 แผ่น | เหมาะสำหรับผิวเป็นสิวและผิวมัน", 28, (255, 255, 255, 200)),
    ("สินค้าแท้ 100% นำเข้าจากเกาหลี ผ่าน Olive Young", 26, (100, 255, 180, 220)),
]

y_txt = box_y + 22
for text, size, color in texts:
    f = ImageFont.truetype(font_path, size)
    draw.text((24, y_txt), text, font=f, fill=color)
    y_txt += size + 14

result = Image.alpha_composite(combined_rgba, overlay).convert("RGB")
result.save(out_path, "JPEG", quality=88)
print(f"저장 완료: {out_path}")
print(f"최종 크기: {result.size}")

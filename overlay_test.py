from PIL import Image, ImageDraw, ImageFont
import os

# 원본 이미지
img_path = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_detail.jpg"
out_path = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_overlay_test.jpg"

img = Image.open(img_path).convert("RGBA")
W, H = img.size
print(f"원본 이미지 크기: {W} x {H}")

# 오버레이 레이어 생성
overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# 태국어 폰트 (Windows 기본 태국어 지원 폰트)
font_paths = [
    r"C:\Windows\Fonts\Tahoma.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\THSarabunNew.ttf",
]
font_large = None
font_small = None
for fp in font_paths:
    if os.path.exists(fp):
        font_large = ImageFont.truetype(fp, 36)
        font_small = ImageFont.truetype(fp, 24)
        print(f"사용 폰트: {fp}")
        break

if not font_large:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()
    print("기본 폰트 사용")

# ============================================================
# 이미지 하단에 반투명 태국어 번역 박스 추가
# ============================================================
box_h = 220
box_y = H - box_h

# 반투명 다크 박스
draw.rectangle([(0, box_y), (W, H)], fill=(0, 0, 0, 180))

# 태국어 텍스트
texts = [
    ("ข้อมูลสินค้าภาษาไทย", 36, (80, 220, 160, 255)),
    ("แบรนด์: อีออม (EAOM) | หน้ากากรักษาสิวและดูแลผิว", 24, (255, 255, 255, 230)),
    ("จำนวน: 3 แผ่น | เหมาะสำหรับผิวเป็นสิวและผิวมัน", 24, (255, 255, 255, 200)),
    ("สินค้าแท้ 100% นำเข้าจากเกาหลี ผ่าน Olive Young", 22, (100, 255, 180, 220)),
]

y = box_y + 20
for text, size, color in texts:
    try:
        f = ImageFont.truetype(font_paths[0] if os.path.exists(font_paths[0]) else font_paths[1], size)
    except:
        f = font_small
    draw.text((20, y), text, font=f, fill=color)
    y += size + 12

# 합성
result = Image.alpha_composite(img, overlay).convert("RGB")
result.save(out_path, "JPEG", quality=90)
print(f"\n✅ 저장 완료: {out_path}")
print(f"결과 이미지 크기: {result.size}")

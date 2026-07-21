import os
from PIL import Image, ImageDraw, ImageFont

parts_dir = r"C:\Users\s8253\Desktop\oliveyoung-maskpack-images\A000000248829_parts"
font_path = r"C:\Windows\Fonts\Tahoma.ttf"

def draw_clean_overlay(filename, title, lines, bg_color=(255, 255, 255)):
    file_path = os.path.join(parts_dir, filename)
    if not os.path.exists(file_path):
        return
    
    # 덮어쓰기 위해 원본 열기
    img = Image.open(file_path).convert("RGB")
    W, H = img.size
    
    # 완전히 배경색으로 덮어버림 (한국어 텍스트 완전 제거 효과)
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (W, H)], fill=bg_color)
    
    # 상단 패딩
    y_txt = 40
    
    # 제목 작성
    f_title = ImageFont.truetype(font_path, 30)
    draw.text((40, y_txt), title, font=f_title, fill=(30, 41, 59)) # Slate 800
    
    # 구분선
    y_txt += 50
    draw.line([(40, y_txt), (W-40, y_txt)], fill=(226, 232, 240), width=2)
    y_txt += 30
    
    # 본문 내용 작성
    f_desc = ImageFont.truetype(font_path, 20)
    for line in lines:
        # 긴 문장은 자동 줄바꿈
        words = line.split(" ")
        current_line = ""
        for word in words:
            test_line = current_line + " " + word if current_line else word
            # 대략적인 너비 체크
            if len(test_line) * 11 > (W - 80):
                draw.text((40, y_txt), current_line, font=f_desc, fill=(71, 85, 105)) # Slate 600
                y_txt += 32
                current_line = word
            else:
                current_line = test_line
        if current_line:
            draw.text((40, y_txt), current_line, font=f_desc, fill=(71, 85, 105))
            y_txt += 32
        y_txt += 12 # 단락 간격
        
    img.save(file_path, "JPEG", quality=95)
    print(f"  [완전 덮어쓰기 완료] {filename}")

# 1. part_027 (전성분 및 주의사항) - 완전 덮어쓰기
draw_clean_overlay(
    "part_027.jpg",
    "รายละเอียดส่วนประกอบและข้อควรระวัง (Ingredients & Precautions)",
    [
        "ชื่อผลิตภัณฑ์: EAOM Trouble Patch Mask",
        "ปริมาณ: 20ml x 3 แผ่น",
        "ส่วนประกอบทั้งหมด: น้ำบริสุทธิ์, สารสกัดจากบิฟิดา, โปรพันไดออล, เมทิลโพรพันไดออล, ไดโพรพิลีนไกลคอล, 1,2-เฮกเซนไดออล, โพลีกลีเซอริล-6, สารสกัดจากทีทรี, สารสกัดจากทีทรีขาว, ไฮโดรไลซ์เอสเทอร์, เอทิลเฮกซิลกลีเซอรีน, คาร์โบเมอร์, โทรเมทามีน, บิวทิลีนไกลคอล, แซนแทนกัม, อะลันโทอิน, โซเดียมไฮยาลูโรเนต, ไดโซเดียมอีดีทีเอ, กลีเซอรีน, เบต้ากลูแคน, สารสกัดจากใบเบย์, สารสกัดจากยูคาลิปตัส",
        "ข้อควรระวังในการใช้งาน:",
        "1. หากมีอาการผิดปกติหรือผลข้างเคียง เช่น จุดแดง บวม หรือคัน บริเวณที่ใช้เนื่องจากแสงแดดโดยตรงระหว่างหรือหลังใช้เครื่องสำอาง ให้ปรึกษาผู้เชี่ยวชาญ",
        "2. หลีกเลี่ยงการใช้บริเวณที่มีบาดแผล",
        "3. ข้อควรระวังในการเก็บรักษา: ก) เก็บให้พ้นมือเด็ก ข) เก็บให้พ้นแสงแดดโดยตรง",
        "4. หลีกเลี่ยงการใช้บริเวณรอบดวงตา"
    ]
)

# 2. part_028 (유통기한 및 제조국) - 완전 덮어쓰기
draw_clean_overlay(
    "part_028.jpg",
    "ข้อมูลการผลิตและหมดอายุ (Product Details)",
    [
        "ผู้จัดจำหน่ายเครื่องสำอาง: บริษัท นิวซีเล็คท์ จำกัด",
        "ผู้ผลิต: ระบุแยกต่างหากบนบรรจุภัณฑ์",
        "ประเทศที่ผลิต: สาธารณรัฐเกาหลี (South Korea)",
        "ระยะเวลาการใช้งาน: 36 เดือนก่อนเปิดใช้งาน, 12 เดือนหลังเปิดใช้งานครั้งแรก"
    ]
)

# 3. part_024 (이옴 케어 루틴) - 완전 덮어쓰기 (약간 베이지 배경 적용)
draw_clean_overlay(
    "part_024.jpg",
    "ขั้นตอนการดูแลผิวมีปัญหาของ EAOM (EAOM Skin Care Routine)",
    [
        "STEP 01: EAOM Trouble Patch Mask (มาสก์แผ่น)",
        "ช่วยขจัดซีบัมฝังลึกและทำความสะอาดรูขุมขนอย่างหมดจด (ใช้สัปดาห์ละ 2-3 ครั้ง)",
        "",
        "STEP 02: Trouble Control Pad (โทนเนอร์แผ่น)",
        "ช่วยผลัดเซลล์ผิวอย่างอ่อนโยน ปรับผิวให้เรียบเนียน (ใช้ทุกเช้าและเย็น)",
        "",
        "STEP 03: Trouble Targeting Serum (เซรั่ม)",
        "ปรับสมดุลความชุ่มชื้นและน้ำมันบนใบหน้า ช่วยจัดการปัญหาสิวอย่างตรงจุด (ใช้ทุกเช้าและเย็น)"
    ],
    bg_color=(248, 246, 242) # 원래 이미지의 미색 배경톤 매칭
)

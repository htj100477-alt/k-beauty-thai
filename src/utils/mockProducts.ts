import { calculateThbPrice } from './pricing';

export interface Product {
  id: string;
  goods_no: string;
  brand: string;
  name: string;
  price_krw: number;
  price_thb: number;
  thumbnail_url: string;
  detail_description_image: string;
  ingredients: string;
  precautions: string;
  category: string;
  weight_grams: number;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    goods_no: 'A000000247086',
    brand: '다슈 (DASHU)',
    name: '[변우석 굿즈/탈모완화] 다슈 데일리 밀크씨슬 블루바이옴 스칼프 샴푸 500ml',
    price_krw: 16900,
    price_thb: calculateThbPrice(16900, 500), // 500g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0024/A00000024708618ko.jpg?l=ko',
    detail_description_image: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/crop/A000000247086/202607200755/crop0/image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/attached/2026/07/16/8be_16164446.jpg?created=202607200755',
    ingredients: '정제수, 소듐C14-16올레핀설포네이트, 라우릴하이드록시설테인, 카페인, 소듐클로라이드, 엘-멘톨, 향료,스타이렌/아크릴레이트코폴리머, 소듐벤조에이트, 하이드록시아세토페논, 피피지-3카프릴릴에터, 구아하이드록시프로필트라이모늄클로라이드, 카프릴릴글라이콜, 트라이하이드록시스테아린, 소듐설페이트, 테트라데센, 헥사데센, 시트릭애씨드, 코코-글루코사이드, 폴리쿼터늄-10, 글리세린, 에틸헥실글리세린, 다이소듐이디티에이, 벤조익애씨드, 흰무늬엉겅퀴추출물(10,000ppb), 부틸렌글라이콜, 1,2-헥산다이올, 비피다발효추출물(1,000ppb), 락토바실러스발효용해물(1,100ppb), 락토코쿠스발효추출물(1,000ppb),빙하수, 알지닌, 서양민들레잎추출물, 검정콩추출물, 약모밀추출물, 병풀캘러스세포외소포, 맥주효모추출물, 하이드록시시트로넬알, 리모넨, 리날룰',
    precautions: '1. 화장품 사용 시 또는 사용 후 직사광선에 의하여 사용부위가 붉은 반점, 부어오름 또는 가려움증 등의 이상 증상이나 부작용이 있는 경우에는 전문의 등과 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 보관 및 취급 시 주의사항 가. 어린이의 손이 닿지 않는 곳에 보관할 것 나. 직사광선을 피해서 보관할 것 4. 눈에 들어갔을 때 즉시 씻어낼 것',
    category: '뷰티 > 맨즈에딧 > 헤어케어 > 두피케어',
    weight_grams: 500
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    goods_no: 'A000000202777',
    brand: '헤라 (HERA)',
    name: '[프리미엄 1위] 헤라 블랙 쿠션 파운데이션 기획 (15g + 15g 리필포함) 9 Colors',
    price_krw: 59740,
    price_thb: calculateThbPrice(59740, 100), // 100g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0020/A00000020277792ko.jpg?l=ko',
    detail_description_image: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/crop/A000000202777/202607200755/crop0/image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/attached/2026/07/16/8be_16164446.jpg?created=202607200755',
    ingredients: '정제수, 메틸트라이메티콘, 티타늄디옥사이드, 다이메티콘, 에틸헥실메톡시신나메이트, 실리카, 폴리메틸메타크릴레이트, 부틸렌글라이콜다이카프릴레이트/다이카프레이트, 나이아신아마이드, 아데노신, 하이알루로닉애씨드',
    precautions: '1. 사용 중 붉은 반점, 부어오름, 가려움증 등의 이상이 있는 경우 전문의와 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 직사광선을 피해서 보관할 것',
    category: '뷰티 > 메이크업 > 페이스메이크업 > 쿠션',
    weight_grams: 100
  },
  {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    goods_no: 'A000000223414',
    brand: '메디힐 (MEDIHEAL)',
    name: '[15년 연속 1위] 메디힐 에센셜 마스크팩 10+1매 기획 세트 (티트리/콜라겐/마데카소사이드)',
    price_krw: 10000,
    price_thb: calculateThbPrice(10000, 300), // 300g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0022/A000000223414117ko.jpg?l=ko',
    detail_description_image: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/crop/A000000223414/202607200755/crop0/image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/attached/2026/07/16/8be_16164446.jpg?created=202607200755',
    ingredients: '정제수, 글리세린, 프로판다이올, 티트리잎추출물(10,000ppm), 마데카소사이드(100ppm), 병풀추출물',
    precautions: '1. 화장품 사용 시 이상이 있는 경우 사용을 중지하고 피부과 전문의에게 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 어린이의 손이 닿지 않는 곳에 보관할 것',
    category: '뷰티 > 마스크팩 > 시트마스크 > 에센셜마스크',
    weight_grams: 300
  },
  {
    id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    goods_no: 'A000000259560',
    brand: '맥 (MAC)',
    name: '[NEW] MAC 러스터글래스 쉬어-샤인 립스틱 기획 단품 (촉촉한 립스틱)',
    price_krw: 37050,
    price_thb: calculateThbPrice(37050, 50), // 50g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0025/A00000025956006ko.jpg?l=ko',
    detail_description_image: '',
    ingredients: '다이아이소스테아릴말레이트, 하이드로제네이티드폴리아이소부텐, 비스-베헤닐/아이소스테아릴/피토스체릴다이머다이리놀레일다이머다이리놀리에이트',
    precautions: '1. 상처가 있는 부위에는 사용을 자제할 것 2. 유소아의 손이 닿지 않는 곳에 보관할 것',
    category: '뷰티 > 메이크업 > 립메이크업 > 립스틱',
    weight_grams: 50
  },
  {
    id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    goods_no: 'A000000240910',
    brand: '오아드 (Oiad)',
    name: '[단독기획] 오아드 립티크 13종 단품/기획 (초밀착 립틴트)',
    price_krw: 17500,
    price_thb: calculateThbPrice(17500, 60), // 60g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0024/A00000024091057ko.jpg?l=ko',
    detail_description_image: '',
    ingredients: '다이메티콘, 정제수, 부틸렌글라이콜, 다이메티콘크로스폴리머, 글리세린',
    precautions: '1. 눈에 들어가지 않도록 주의할 것 2. 상처 부위 사용 자제 3. 직사광선 피할 것',
    category: '뷰티 > 메이크업 > 립메이크업 > 틴트',
    weight_grams: 60
  },
  {
    id: 'f6a7b8c9-d01e-2f3a-4b5c-6d7e8f9a0b1c',
    goods_no: 'A000000259209',
    brand: '바세린 (Vaseline)',
    name: '[NEW] 바세린 글루타히야 세럼 바디로션 300ml 3종 택1 (듀이/플로리스/프로에이지)',
    price_krw: 10200,
    price_thb: calculateThbPrice(10200, 350), // 350g
    thumbnail_url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0025/A00000025920903ko.jpg?l=ko',
    detail_description_image: '',
    ingredients: '정제수, 글리세린, 나이아신아마이드, 글루타티온, 소듐하이알루로네이트, 토코페릴아세테이트',
    precautions: '1. 피부에 이상이 생겼을 경우 사용을 중지하고 전문의와 상담할 것 2. 직사광선을 피해 서늘한 곳에 보관할 것',
    category: '뷰티 > 바디케어 > 바디로션/크림 > 바디로션',
    weight_grams: 350
  }
];

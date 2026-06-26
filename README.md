# Weather Window - go/no-go weather windows for outdoor operations (MPP service)

Agent gui dia diem + activity -> server lay forecast Open-Meteo -> tra ve cac CUA SO
thoi gian tot trong 48h toi, kem dieu kien va yeu to gioi han. Ban "quyet dinh",
khong phai so lieu tho. Tra phi per-call qua MPP tren Tempo (USDC.e).

## Vi sao lam cai nay
Open-Meteo cho so lieu forecast free. Nhung agent lap ke hoach viec ngoai troi nhay
thoi tiet (bay drone, phun thuoc, viec ngoai troi) van phai tu bien so thanh "khi nao
moi nen lam". Service nay lam dung buoc do: ap nguong theo tung activity, tra ve cua so
dung duoc. Agent luoi tu lam buoc nay -> chiu tra. Day la value, khong phai data tho.

## Activities (them moi = them 1 entry trong lib/activities.ts)
- drone: bay drone/UAV (gio, giat, mua, tam nhin)
- agriculture_spraying: phun thuoc (gio nhe on dinh, khong mua, nhiet do vua)
- outdoor_work: viec ngoai troi (kho rao, gio an toan, nhiet do lam viec duoc)

## Endpoint
POST /api/weather-window
body: { "activity": "...", "lat": .., "lon": .. }  hoac  { "activity": "...", "place": "Hanoi" }
optional: "hours" (default 48, max 72)

## Nguon
- Open-Meteo forecast: https://api.open-meteo.com  (free, khong key)
- Open-Meteo geocoding (khi truyen place): https://geocoding-api.open-meteo.com

## Chay local
```
npm install
copy .env.example .env   (RECIPIENT ca 2 dong, CONTACT_EMAIL, PREVIEW_KEY)
npm run dev
```

## Test khong can tra tien (preview)
```
$body = '{"activity":"drone","place":"Hanoi"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/weather-window?preview=KEY" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 8
```
XOA PREVIEW_KEY tren production.

## Deploy + dang ky
1. Push GitHub -> import Vercel -> ENV: RECIPIENT ca 2 dong, TEMPO_NETWORK=mainnet,
   PAY_TOKEN (USDC.e), BASE_URL = domain chinh (khong dau / cuoi), MPP_SECRET_KEY,
   CONTACT_EMAIL, KHONG dat PREVIEW_KEY.
2. Redeploy bo tick build cache de realm = domain chinh.
3. Validate: npx -y agentcash check "https://<domain>/api/weather-window"
4. Dang ky: mppscan.com/register.

## Luu y thang than
- Nguong la heuristic mac dinh, KHONG phai chuan an toan/hang khong/phap ly. Co disclaimer.
- Open-Meteo free khong key, free-tier non-commercial. Neu volume lon, kiem chinh sach
  thuong mai cua Open-Meteo (co the can ban tra phi cua ho).
- Thi truong agent con nho, traffic se thap. Day la dat cho, khong phai thu nhap ngay.

# CusBox360 Deployment & On-Premises Packaging Guide (`deploy/`)

CusBox360 ใช้ **Single Docker Image เดียวกันทั้งหมด** ทั้งสำหรับระบบ Cloud Multi-Tenant SaaS และการส่งมอบติดตั้ง On-Premises รายลูกค้า โดยกำหนดประเภทธุรกิจและโมดูลตามสัญญาตอน Runtime เท่านั้น

---

## 1. การสร้าง Tenant ใหม่บน Cloud SaaS ด้วยคำสั่งเดียว

```bash
# โรงพยาบาล
npm run cb360 -- tenant create --template hospital --slug rama-hosp --name "โรงพยาบาลรามาเมดิคอล" --domain rama.cb360.online

# บริษัทประกันภัย
npm run cb360 -- tenant create --template insurance --slug siam-insure --name "สยามประกันภัย" --domain insure.cb360.online

# ตรวจสอบความถูกต้องของทุก Template
npm run cb360 -- template validate
```

---

## 2. การติดตั้ง On-Premises ด้วย Docker Compose (Image เดิม)

```bash
cd deploy
cp .env.onprem.example .env
# แก้ไข CB360_PRELOAD_TEMPLATE=hospital หรือ insurance และระบุ CB360_LICENSED_ENTITLEMENTS ตามสัญญา
docker compose up -d
```

---

## 3. การติดตั้ง On-Premises บน Kubernetes ด้วย Helm

```bash
# ติดตั้งสำหรับลูกค้าโรงพยาบาล (ใช้ image เดิม + values-hospital.yaml)
helm upgrade --install cb360-hosp ./deploy/helm/cusbox360 \
  -f ./deploy/helm/cusbox360/values-hospital.yaml

# ติดตั้งสำหรับลูกค้าบริษัทประกันภัย (ใช้ image เดิม + values-insurance.yaml)
helm upgrade --install cb360-ins ./deploy/helm/cusbox360 \
  -f ./deploy/helm/cusbox360/values-insurance.yaml
```

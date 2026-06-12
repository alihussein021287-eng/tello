#!/bin/bash
# ============================================================
#  🏺 Tello — Deploy & Update Script
#  fshsmart.com
#  الاستخدام:
#    bash tello-deploy.sh install   ← تثبيت كامل من صفر
#    bash tello-deploy.sh update    ← تحديث بعد تعديل الكود
#    bash tello-deploy.sh restart   ← إعادة تشغيل كل شيء
#    bash tello-deploy.sh logs      ← مشاهدة اللوغات
#    bash tello-deploy.sh backup    ← نسخ احتياطي للـ DB
#    bash tello-deploy.sh status    ← حالة كل الـ services
# ============================================================

set -e

# ── الألوان ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${CYAN}ℹ  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}▶ $1${NC}"; }

DEPLOY_DIR="/opt/tello"
DOMAIN="fshsmart.com"
EMAIL="admin@fshsmart.com"
COMPOSE="docker compose -f $DEPLOY_DIR/docker-compose.yml"

# ══════════════════════════════════════════════════════════
# INSTALL — تثبيت كامل من صفر
# ══════════════════════════════════════════════════════════
cmd_install() {
  echo -e "${BOLD}${CYAN}"
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║   🏺 Tello — Full Install              ║"
  echo "  ║   fshsmart.com                        ║"
  echo "  ╚══════════════════════════════════════╝"
  echo -e "${NC}"

  # ── 1. تحديث النظام ────────────────────────────────────
  step "1/10 تحديث النظام"
  apt-get update -qq && apt-get upgrade -y -qq
  apt-get install -y -qq curl wget git nano ufw htop unzip openssl
  ok "النظام محدث"

  # ── 2. Firewall ─────────────────────────────────────────
  step "2/10 إعداد Firewall"
  ufw allow OpenSSH   > /dev/null
  ufw allow 80/tcp    > /dev/null
  ufw allow 443/tcp   > /dev/null
  ufw --force enable  > /dev/null
  ok "Firewall جاهز (22, 80, 443)"

  # ── 3. Docker ───────────────────────────────────────────
  step "3/10 تثبيت Docker"
  if command -v docker &>/dev/null; then
    warn "Docker موجود مسبقاً — نتخطى"
  else
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    ok "Docker مثبت"
  fi
  apt-get install -y -qq docker-compose-plugin
  ok "Docker Compose مثبت"

  # ── 4. SSL ──────────────────────────────────────────────
  step "4/10 شهادة SSL"
  apt-get install -y -qq certbot

  if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    warn "شهادة SSL موجودة مسبقاً — نتخطى"
  else
    info "جاري طلب شهادة SSL لـ $DOMAIN ..."
    certbot certonly --standalone \
      -d $DOMAIN -d www.$DOMAIN \
      -d api.$DOMAIN -d admin.$DOMAIN -d storage.$DOMAIN \
      --non-interactive --agree-tos -m $EMAIL \
      || warn "فشل SSL — تأكد أن DNS يشير للـ VPS"
    ok "شهادة SSL جاهزة"
  fi

  # تجديد تلقائي
  (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * 0 certbot renew --quiet") | crontab -
  ok "تجديد SSL تلقائي مضبوط"

  # ── 5. رفع الكود ───────────────────────────────────────
  step "5/10 رفع ملفات Tello"
  mkdir -p $DEPLOY_DIR

  # إذا الكود موجود (ZIP أو git) — وإلا نعطي تعليمات
  if [ -f "/root/tello-project.zip" ]; then
    info "وجدنا tello-project.zip — نفك الضغط"
    cd /root
    unzip -q tello-project.zip
    cp -r tello/. $DEPLOY_DIR/
    rm -rf tello tello-project.zip
    ok "الكود في $DEPLOY_DIR"
  elif [ -d "$DEPLOY_DIR/docker-compose.yml" ]; then
    ok "الكود موجود مسبقاً"
  else
    warn "لم أجد الكود — ارفع tello-project.zip لـ /root/ ثم أعد تشغيل:"
    echo "       scp tello-project.zip root@YOUR_IP:/root/"
    echo "       bash tello-deploy.sh install"
    exit 1
  fi

  # ── 6. ملف .env ─────────────────────────────────────────
  step "6/10 إعداد ملف البيئة"
  if [ ! -f "$DEPLOY_DIR/.env" ]; then
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env

    # توليد قيم عشوائية تلقائياً
    DB_PASS=$(openssl rand -hex 16)
    REDIS_PASS=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    MINIO_PASS=$(openssl rand -hex 12)
    INTERNAL_KEY=$(openssl rand -hex 16)

    sed -i "s/STRONG_PASSWORD_HERE/$DB_PASS/g"        $DEPLOY_DIR/.env
    sed -i "s/REDIS_PASSWORD_HERE/$REDIS_PASS/g"      $DEPLOY_DIR/.env
    sed -i "s/change-this-to-a-very-long-random-string-minimum-32-chars/$JWT_SECRET/g" $DEPLOY_DIR/.env
    sed -i "s/MINIO_PASSWORD_HERE/$MINIO_PASS/g"      $DEPLOY_DIR/.env
    sed -i "s/random-internal-key-here/$INTERNAL_KEY/g" $DEPLOY_DIR/.env
    sed -i "s|your_strong_password_here|$DB_PASS|g"   $DEPLOY_DIR/.env

    # Fix DATABASE_URL
    sed -i "s|postgresql://tello:.*@postgres|postgresql://tello:$DB_PASS@postgres|g" $DEPLOY_DIR/.env
    sed -i "s|redis://:.*@redis|redis://:$REDIS_PASS@redis|g" $DEPLOY_DIR/.env

    echo ""
    warn "مهم جداً! أضف ANTHROPIC_API_KEY في الملف:"
    echo "       nano $DEPLOY_DIR/.env"
    echo ""
    echo "       ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE"
    echo ""
    read -p "       اضغط Enter بعد ما تضيف المفتاح..." _
  else
    warn ".env موجود مسبقاً — نتخطى"
  fi

  # ── 7. Nginx ─────────────────────────────────────────────
  step "7/10 إعداد Nginx"
  apt-get install -y -qq nginx
  cp $DEPLOY_DIR/infra/nginx/nginx.conf /etc/nginx/nginx.conf
  nginx -t && systemctl enable nginx && systemctl restart nginx
  ok "Nginx جاهز"

  # ── 8. بناء وتشغيل ──────────────────────────────────────
  step "8/10 بناء Docker containers"
  cd $DEPLOY_DIR
  $COMPOSE build --parallel
  ok "Build انتهى"

  step "9/10 تشغيل كل الـ services"
  $COMPOSE up -d
  info "انتظر 15 ثانية حتى تشتغل قاعدة البيانات..."
  sleep 15
  ok "Services شغالة"

  # ── 9. DB Migration ──────────────────────────────────────
  step "10/10 تهيئة قاعدة البيانات"
  $COMPOSE exec -T api bun run db:push
  ok "قاعدة البيانات جاهزة"

  # ── إنشاء Admin ─────────────────────────────────────────
  echo ""
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  إنشاء حساب الأدمن${NC}"
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  read -p "  اسم الأدمن: " ADMIN_NAME
  read -p "  إيميل الأدمن: " ADMIN_EMAIL
  read -s -p "  كلمة المرور: " ADMIN_PASS
  echo ""

  HASHED=$($COMPOSE exec -T api bun -e "
    const b = require('bcryptjs');
    process.stdout.write(b.hashSync('$ADMIN_PASS', 12));
  ")

  $COMPOSE exec -T postgres psql -U tello -d tello_db -c "
    INSERT INTO \"User\" (id, name, email, password, role, \"isActive\", \"createdAt\", \"updatedAt\")
    VALUES (
      gen_random_uuid()::text,
      '$ADMIN_NAME',
      '$ADMIN_EMAIL',
      '$HASHED',
      'ADMIN', true, NOW(), NOW()
    ) ON CONFLICT (email) DO NOTHING;
  " > /dev/null

  ok "حساب الأدمن جاهز"

  # ── MinIO Bucket ─────────────────────────────────────────
  sleep 3
  MINIO_USER=$(grep MINIO_USER $DEPLOY_DIR/.env | cut -d= -f2)
  MINIO_PASS_VAL=$(grep "^MINIO_PASSWORD=" $DEPLOY_DIR/.env | cut -d= -f2)
  $COMPOSE exec -T minio mc alias set local http://localhost:9000 "$MINIO_USER" "$MINIO_PASS_VAL" > /dev/null 2>&1 || true
  $COMPOSE exec -T minio mc mb local/tello-products > /dev/null 2>&1 || true
  $COMPOSE exec -T minio mc anonymous set public local/tello-products > /dev/null 2>&1 || true
  ok "MinIO bucket جاهز"

  # ── الملخص النهائي ──────────────────────────────────────
  echo ""
  echo -e "${BOLD}${GREEN}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   🏺 Tello شغال! كل شيء جاهز              ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  🌐 الموقع:    ${CYAN}https://$DOMAIN${NC}"
  echo -e "  ⚙️  API:       ${CYAN}https://api.$DOMAIN/api/health${NC}"
  echo -e "  🛡️  الأدمن:   ${CYAN}https://admin.$DOMAIN${NC}"
  echo -e "  📦 Storage:  ${CYAN}https://storage.$DOMAIN${NC}"
  echo ""
  echo -e "  📧 الأدمن:   ${YELLOW}$ADMIN_EMAIL${NC}"
  echo ""
  echo -e "  ${YELLOW}احفظ ملف .env في مكان آمن!${NC}"
  echo "  cat $DEPLOY_DIR/.env"
  echo ""
}

# ══════════════════════════════════════════════════════════
# UPDATE — تحديث بعد تعديل الكود
# ══════════════════════════════════════════════════════════
cmd_update() {
  echo -e "${BOLD}${CYAN}🔄 Tello Update${NC}"
  echo ""

  cd $DEPLOY_DIR

  # إذا في ZIP جديد
  if [ -f "/root/tello-project.zip" ]; then
    step "فك ضغط الكود الجديد"
    cd /root
    unzip -q tello-project.zip
    # احتفظ بـ .env الحالي
    cp $DEPLOY_DIR/.env /tmp/tello.env.bak
    cp -r tello/. $DEPLOY_DIR/
    cp /tmp/tello.env.bak $DEPLOY_DIR/.env
    rm -rf tello tello-project.zip
    ok "الكود محدث"
  fi

  cd $DEPLOY_DIR

  step "بناء containers جديدة"
  $COMPOSE build --parallel
  ok "Build انتهى"

  step "تطبيق تغييرات قاعدة البيانات"
  $COMPOSE up -d postgres redis
  sleep 5
  $COMPOSE exec -T api bun run db:push || warn "لا يوجد تغييرات في DB"

  step "تحديث Services بدون downtime"
  $COMPOSE up -d --no-deps web admin api ai
  ok "Services محدثة"

  step "تنظيف images القديمة"
  docker image prune -f > /dev/null
  ok "تنظيف انتهى"

  echo ""
  ok "✨ Tello محدث وشغال!"
  cmd_status
}

# ══════════════════════════════════════════════════════════
# RESTART — إعادة تشغيل
# ══════════════════════════════════════════════════════════
cmd_restart() {
  step "إعادة تشغيل كل الـ services"
  cd $DEPLOY_DIR
  $COMPOSE restart
  ok "كل شيء أعيد تشغيله"
  cmd_status
}

# ══════════════════════════════════════════════════════════
# STATUS — حالة الـ services
# ══════════════════════════════════════════════════════════
cmd_status() {
  echo ""
  echo -e "${BOLD}📊 حالة Tello Services${NC}"
  echo "────────────────────────────────"
  cd $DEPLOY_DIR
  $COMPOSE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $COMPOSE ps
  echo ""

  # تحقق سريع من الـ endpoints
  echo -e "${BOLD}🌐 فحص الـ Endpoints${NC}"
  echo "────────────────────────────────"

  check_url() {
    local url=$1
    local label=$2
    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✅${NC} $label — $url"
    else
      echo -e "  ${RED}❌${NC} $label — $url"
    fi
  }

  check_url "https://$DOMAIN"               "الموقع"
  check_url "https://api.$DOMAIN/api/health" "API"
  check_url "https://admin.$DOMAIN"          "الأدمن"
  echo ""
}

# ══════════════════════════════════════════════════════════
# LOGS — مشاهدة اللوغات
# ══════════════════════════════════════════════════════════
cmd_logs() {
  SERVICE=${2:-""}
  cd $DEPLOY_DIR
  if [ -n "$SERVICE" ]; then
    info "لوغات $SERVICE (Ctrl+C للخروج)"
    $COMPOSE logs -f --tail=100 $SERVICE
  else
    info "لوغات كل الـ services (Ctrl+C للخروج)"
    $COMPOSE logs -f --tail=50
  fi
}

# ══════════════════════════════════════════════════════════
# BACKUP — نسخ احتياطي
# ══════════════════════════════════════════════════════════
cmd_backup() {
  BACKUP_DIR="/opt/backups/tello"
  mkdir -p $BACKUP_DIR

  FILENAME="tello_db_$(date +%Y%m%d_%H%M%S).sql"

  step "نسخ احتياطي لقاعدة البيانات"
  cd $DEPLOY_DIR
  $COMPOSE exec -T postgres pg_dump -U tello tello_db > "$BACKUP_DIR/$FILENAME"
  gzip "$BACKUP_DIR/$FILENAME"
  ok "Backup محفوظ: $BACKUP_DIR/$FILENAME.gz"

  # احتفظ بآخر 7 نسخ فقط
  ls -t $BACKUP_DIR/*.gz 2>/dev/null | tail -n +8 | xargs -r rm
  info "تم الاحتفاظ بآخر 7 نسخ احتياطية فقط"

  # ضبط cron تلقائي
  (crontab -l 2>/dev/null | grep -v tello_backup; echo "0 2 * * * bash $0 backup") | crontab -
  ok "نسخ احتياطي تلقائي كل يوم 2 صباحاً"
}

# ══════════════════════════════════════════════════════════
# HELP
# ══════════════════════════════════════════════════════════
cmd_help() {
  echo ""
  echo -e "${BOLD}🏺 Tello Deploy Script${NC}"
  echo ""
  echo "  الاستخدام:"
  echo -e "    ${CYAN}bash tello-deploy.sh install${NC}    ← تثبيت كامل من صفر"
  echo -e "    ${CYAN}bash tello-deploy.sh update${NC}     ← تحديث بعد تعديل الكود"
  echo -e "    ${CYAN}bash tello-deploy.sh restart${NC}    ← إعادة تشغيل"
  echo -e "    ${CYAN}bash tello-deploy.sh status${NC}     ← حالة الـ services"
  echo -e "    ${CYAN}bash tello-deploy.sh logs${NC}       ← كل اللوغات"
  echo -e "    ${CYAN}bash tello-deploy.sh logs api${NC}   ← لوغ service معين"
  echo -e "    ${CYAN}bash tello-deploy.sh backup${NC}     ← نسخ احتياطي"
  echo ""
  echo "  أمثلة:"
  echo "    bash tello-deploy.sh logs ai"
  echo "    bash tello-deploy.sh logs web"
  echo "    bash tello-deploy.sh logs postgres"
  echo ""
}

# ══════════════════════════════════════════════════════════
# Router
# ══════════════════════════════════════════════════════════
case "${1:-help}" in
  install) cmd_install ;;
  update)  cmd_update  ;;
  restart) cmd_restart ;;
  status)  cmd_status  ;;
  logs)    cmd_logs "$@" ;;
  backup)  cmd_backup  ;;
  *)       cmd_help    ;;
esac

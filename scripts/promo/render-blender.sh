#!/usr/bin/env bash
# 渲 3D 技能树的开场、片尾两段（Blender 5.2 Eevee），编成 Remotion 读的 mp4。约 10–15 分钟（RTX 3080）。
# 用法（Git Bash，项目根目录）：bash scripts/promo/render-blender.sh [intro|outro ...]
# 依赖：src/promo/public/build/timeline.json（动画时刻跟旁白走，旁白改了要重渲）
set -euo pipefail
cd "$(dirname "$0")/../.."
B=${BLENDER:-D:/steam/steamapps/common/Blender/blender.exe}
mkdir -p temp/promo/logs src/promo/public/blender
for shot in "${@:-intro outro}"; do
  for s in $shot; do
    rm -rf "temp/promo/blender/$s"
    "$B" -b --factory-startup -P scripts/promo/blender-tree.py -- --shot "$s" --out "temp/promo/blender/$s" --samples 48 \
      > "temp/promo/logs/blender-$s.log" 2>&1 || { tail -20 "temp/promo/logs/blender-$s.log"; exit 1; }
    ffmpeg -nostdin -y -loglevel error -framerate 30 -start_number 0 -i "temp/promo/blender/$s/%04d.png" \
      -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p "src/promo/public/blender/$s.mp4"
    echo "$s: $(ls temp/promo/blender/$s | wc -l) 帧 → src/promo/public/blender/$s.mp4"
  done
done

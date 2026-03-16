#!/bin/bash

# 前端项目部署脚本
# 使用方法: ./deploy.sh

set -e

# 加载配置
source .env.deploy

echo "===================================="
echo "前端项目部署脚本"
echo "===================================="
echo ""
echo "服务器: ${DEPLOY_HOST}"
echo "端口: ${DEPLOY_PORT}"
echo "用户: ${DEPLOY_USER}"
echo "路径: ${DEPLOY_PATH}"
echo ""

# 检查 dist 目录是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，请先执行 npm run build"
    exit 1
fi

echo "开始部署..."
echo ""

# 使用 rsync 同步文件
rsync -avz --delete -e "ssh -p ${DEPLOY_PORT}" dist/ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}

echo ""
echo "===================================="
echo "部署完成！"
echo "请访问 http://${DEPLOY_HOST} 验证"
echo "===================================="

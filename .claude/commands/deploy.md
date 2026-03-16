# deploy - 构建并部署前端项目到云端服务器

将当前 Vue 前端项目构建打包，并通过 SSH + rsync 部署到云端服务器。

## 执行步骤

### 1. 检查配置文件

首先检查项目根目录下的部署配置文件 `.env.deploy` 是否存在。如果不存在，创建一个模板文件并提示用户填写。

配置文件格式：
```bash
# 服务器配置
DEPLOY_HOST=your-server-ip
DEPLOY_PORT=22
DEPLOY_USER=your-username
DEPLOY_PATH=/path/to/deploy/directory

# 可选：SSH 私钥路径（如果不使用默认 ~/.ssh/id_rsa）
# DEPLOY_SSH_KEY=~/.ssh/id_rsa
```

### 2. 构建项目

执行以下命令构建项目：
```bash
npm run build
```

检查构建是否成功，如果失败则停止部署并报告错误。

### 3. 部署到服务器

使用 rsync 将 `dist` 目录同步到服务器：

```bash
rsync -avz --delete -e "ssh -p ${DEPLOY_PORT}" dist/ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}
```

如果 rsync 不可用，则使用 scp：
```bash
scp -P ${DEPLOY_PORT} -r dist/* ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}
```

### 4. 验证部署

部署完成后，提示用户访问网站验证部署结果。

## 参数

- `--skip-build`: 跳过构建步骤，直接部署现有的 dist 目录
- `--dry-run`: 仅显示将要执行的命令，不实际执行
- `--no-delete`: 同步时不删除服务器上多余的文件

## 示例

```bash
# 正常部署
/deploy

# 跳过构建，直接部署
/deploy --skip-build

# 预览部署命令（不实际执行）
/deploy --dry-run

# 保留服务器上多余文件
/deploy --no-delete
```

## 注意事项

1. 确保本地已配置 SSH 密钥认证，或准备好服务器密码
2. 确保服务器上的目标目录存在且有写入权限
3. 部署会覆盖服务器上的文件，请确保已备份重要数据
4. `.env.deploy` 文件包含敏感信息，请确保已添加到 `.gitignore`

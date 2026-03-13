# Dev Toolbox 功能路线图

> 参考: [IT-Tools](https://it-tools.tech), [CyberChef](https://gchq.github.io/CyberChef/), [SmallDev.tools](https://smalldev.tools/), [regex101](https://regex101.com/), [crontab.guru](https://crontab.guru/)

## 当前已实现 ✅

### Time 时间
- [x] Epoch Converter (时间戳转换) - 含批量、时长、特殊格式、代码示例
- [x] Cron Parser (Cron 解析器)

### Encoding 编码
- [x] Base64 Encode/Decode
- [x] URL Encode/Decode
- [x] JWT Decode

### Text 文本
- [x] Regex Tester (正则测试)
- [x] Case Converter (大小写转换)
- [x] Diff Viewer (差异对比)
- [x] Line Tools (行处理工具)

### JSON / Data
- [x] JSON Formatter (JSON 格式化)
- [x] JSON ↔ YAML

### Generators 生成器
- [x] UUID Generator
- [x] Hash Generator (SHA-1, SHA-256, SHA-512)
- [x] Password Generator
- [x] QR Code Generator

### Crypto 加密
- [x] HMAC Generator

---

## 待开发功能 📋

### Phase 1: 编码转换扩展 🔄

| 工具 | 描述 | 优先级 |
|------|------|--------|
| HTML Entity Encode/Decode | HTML 实体编码解码 (`&lt;` ↔ `<`) | P0 |
| Unicode Escape/Unescape | Unicode 转义 (`\u4e2d` ↔ `中`) | P0 |
| Hex ↔ String | 十六进制与字符串互转 | P0 |
| Hex ↔ Decimal ↔ Binary | 进制转换器 | P0 |
| ASCII ↔ Hex ↔ Binary | ASCII 码转换 | P1 |
| Punycode Encode/Decode | 国际化域名编码 | P2 |
| ROT13 / Caesar Cipher | 简单加密 | P2 |

### Phase 2: 加密安全工具 🔐

| 工具 | 描述 | 优先级 |
|------|------|--------|
| AES Encrypt/Decrypt | AES 加解密 (ECB/CBC/GCM) | P0 |
| RSA Key Generator | RSA 密钥对生成 | P1 |
| Bcrypt Hash/Verify | Bcrypt 密码哈希 | P1 |
| MD5 Hash | MD5 哈希 (仅用于校验) | P0 |
| Hash File | 文件哈希计算 | P1 |
| Checksum Calculator | 校验和计算 (CRC32, Adler32) | P2 |
| Token Generator | 安全令牌生成 | P1 |

### Phase 3: 网络工具 🌐

| 工具 | 描述 | 优先级 |
|------|------|--------|
| URL Parser | URL 解析器 (协议、域名、路径、参数) | P0 |
| Query String Parser | 查询字符串解析 | P0 |
| IPv4/IPv6 Converter | IP 地址转换和信息 | P1 |
| CIDR Calculator | 子网计算器 | P1 |
| MAC Address Lookup | MAC 地址查询 (OUI) | P2 |
| HTTP Header Parser | HTTP 头解析 | P1 |
| User Agent Parser | UA 解析 | P1 |
| Data URL Generator | Data URI 生成器 | P1 |

### Phase 4: 文本处理增强 📝

| 工具 | 描述 | 优先级 |
|------|------|--------|
| Text Statistics | 字数/字符/词数/行数统计 | P0 |
| Lorem Ipsum Generator | 占位文本生成 | P0 |
| String Escape/Unescape | 字符串转义 (JSON/JS/SQL) | P0 |
| Markdown Preview | Markdown 实时预览 | P1 |
| Text to NATO Phonetic | 北约音标字母转换 | P2 |
| Slugify | URL Slug 生成 | P1 |
| Truncate Text | 文本截断工具 | P2 |
| Remove Duplicate Lines | 去重行 (已在 Line Tools) | ✅ |
| Sort Lines | 排序行 (已在 Line Tools) | ✅ |

### Phase 5: 代码格式化 💻

| 工具 | 描述 | 优先级 |
|------|------|--------|
| SQL Formatter | SQL 格式化/美化 | P0 |
| HTML Formatter | HTML 格式化 | P0 |
| CSS Formatter/Minifier | CSS 格式化/压缩 | P0 |
| JavaScript Formatter/Minifier | JS 格式化/压缩 | P0 |
| XML Formatter | XML 格式化 | P1 |
| TOML ↔ JSON ↔ YAML | 配置格式互转 | P1 |
| CSV ↔ JSON | CSV 与 JSON 互转 | P1 |

### Phase 6: 生成器扩展 🎲

| 工具 | 描述 | 优先级 |
|------|------|--------|
| ULID Generator | ULID 生成 | P1 |
| NanoID Generator | NanoID 生成 | P1 |
| Fake Data Generator | 假数据生成 (姓名、邮箱、地址等) | P0 |
| Random Number Generator | 随机数生成 | P1 |
| Random String Generator | 随机字符串生成 | P1 |
| Credit Card Generator | 测试信用卡号生成 (Luhn) | P2 |
| IBAN Generator/Validator | IBAN 生成验证 | P2 |

### Phase 7: 图片工具 🖼️ ✅

| 工具 | 描述 | 优先级 |
|------|------|--------|
| ✅ Image ↔ Base64 | 图片与 Base64 互转 | P0 |
| ✅ Image Compressor | 图片压缩 | P1 |
| ✅ Image Format Converter | 图片格式转换 | P1 |
| ✅ Favicon Generator | Favicon 生成 | P2 |
| ✅ SVG Optimizer | SVG 优化 | P2 |
| ✅ Color Picker & Converter | 颜色选择器和转换器 | P0 |
| ✅ Image Color Extractor | 图片取色 | P2 |

### Phase 8: 颜色工具 🎨 ✅

| 工具 | 描述 | 优先级 |
|------|------|--------|
| ✅ Color Converter | HEX/RGB/HSL/CMYK 互转 | P0 |
| ✅ Color Palette Generator | 调色板生成 | P1 |
| ✅ Contrast Checker | 对比度检查 (WCAG) | P1 |
| ✅ Color Blindness Simulator | 色盲模拟 | P2 |
| ✅ Gradient Generator | 渐变生成器 | P1 |
| ✅ Color Shades Generator | 色调生成 | P1 |

### Phase 9: 开发者工具 🛠️ ✅

| 工具 | 描述 | 优先级 |
|------|------|--------|
| ✅ JWT Generator | JWT 生成 (配合现有解码) | P0 |
| ✅ Basic Auth Generator | Basic Auth 头生成/解码 | P1 |
| ✅ OAuth Token Parser | OAuth Token 解析 | P2 |
| ✅ SAML Decoder | SAML 解码 | P2 |
| ✅ Chmod Calculator | Unix 权限计算器 | P0 |
| ✅ Crontab Generator | Cron 表达式生成器 | P1 |
| ✅ Git Command Reference | Git 命令快速参考 | P2 |
| ✅ Docker Compose Templates | Docker Compose 模板 | P2 |

### Phase 10: 数学与单位 🔢 ✅

| 工具 | 描述 | 优先级 |
|------|------|--------|
| ✅ Unit Converter | 单位转换 (长度/重量/温度等) | P0 |
| ✅ Byte Size Converter | 字节大小转换 (KB/MB/GB) | P0 |
| ✅ Percentage Calculator | 百分比计算器 | P1 |
| ✅ Math Expression Evaluator | 数学表达式计算 | P1 |
| ✅ Roman Numeral Converter | 罗马数字转换 | P2 |
| ✅ Aspect Ratio Calculator | 宽高比计算器 | P1 |

### Phase 11: 验证器 ✓

| 工具 | 描述 | 优先级 |
|------|------|--------|
| JSON Validator | JSON 验证 (已在 Formatter) | ✅ |
| Email Validator | 邮箱格式验证 | P1 |
| URL Validator | URL 格式验证 | P1 |
| Credit Card Validator | 信用卡号验证 (Luhn) | P1 |
| Phone Number Parser | 电话号码解析 | P2 |
| UUID Validator | UUID 验证 | P1 |
| IP Address Validator | IP 地址验证 | P1 |

### Phase 12: 杂项工具 🧰

| 工具 | 描述 | 优先级 |
|------|------|--------|
| Emoji Picker | Emoji 选择器 | P1 |
| Keyboard Shortcut Reference | 快捷键参考 | P2 |
| Barcode Generator | 条形码生成 | P1 |
| PDF Viewer | PDF 查看器 | P2 |
| Text to Speech | 文字转语音 | P2 |
| OTP Generator | OTP/TOTP 生成器 | P1 |
| WiFi QR Code Generator | WiFi 二维码生成 | P1 |

---

## 开发优先级说明

- **P0** - 核心功能，高频使用，优先实现
- **P1** - 重要功能，常用工具
- **P2** - 扩展功能，锦上添花

## 技术考虑

1. **本地处理** - 所有工具在浏览器本地运行，不上传数据
2. **Web Crypto API** - 加密功能使用原生 API
3. **Web Workers** - 大文件/复杂计算使用 Worker
4. **i18n** - 所有工具支持中英文
5. **Pipeline** - 新工具提供 transforms 供管道使用
6. **响应式** - 支持移动端

## 统计

- 已实现: **84** 个工具 (Phase 1-10 完成)
- 待开发: **~32** 个工具
- 总计: **~95** 个工具

---

## 开发进度追踪

### Phase 1 进度
- [x] HTML Entity Encode/Decode
- [x] Unicode Escape/Unescape
- [x] Hex ↔ String
- [x] Hex ↔ Decimal ↔ Binary
- [x] ASCII ↔ Hex ↔ Binary
- [x] Punycode Encode/Decode
- [x] ROT13 / Caesar Cipher

### Phase 2 进度
- [x] AES Encrypt/Decrypt
- [x] RSA Key Generator
- [x] Bcrypt Hash/Verify (PBKDF2)
- [x] MD5 Hash
- [x] Hash File
- [x] Checksum Calculator
- [x] Token Generator

### Phase 3 进度
- [x] URL Parser
- [x] Query String Parser
- [x] IPv4/IPv6 Converter
- [x] CIDR Calculator
- [x] User Agent Parser
- [x] HTTP Header Parser
- [x] Data URL Generator

### Phase 4 进度
- [x] Text Statistics
- [x] Lorem Ipsum Generator
- [x] String Escape/Unescape
- [x] Markdown Preview
- [x] NATO Phonetic Alphabet
- [x] Slugify
- [x] Truncate Text

### Phase 5 进度
- [x] SQL Formatter
- [x] HTML Formatter
- [x] CSS Formatter/Minifier
- [x] JavaScript Formatter/Minifier
- [x] XML Formatter
- [x] TOML ↔ JSON ↔ YAML
- [x] CSV ↔ JSON

### Phase 6 进度
- [x] ULID Generator
- [x] NanoID Generator
- [x] Fake Data Generator
- [x] Random Number Generator
- [x] Random String Generator
- [x] Credit Card Generator (Luhn)
- [x] IBAN Generator/Validator

### Phase 7 进度
- [x] Image ↔ Base64
- [x] Image Compressor
- [x] Image Format Converter
- [x] Favicon Generator
- [x] SVG Optimizer
- [x] Color Picker & Converter
- [x] Image Color Extractor

### Phase 8 进度
- [x] Color Converter
- [x] Color Palette Generator
- [x] Contrast Checker
- [x] Color Blindness Simulator
- [x] Gradient Generator
- [x] Color Shades Generator

### Phase 9 进度
- [x] JWT Generator
- [x] Basic Auth Generator
- [x] OAuth Token Parser
- [x] SAML Decoder
- [x] Chmod Calculator
- [x] Crontab Generator
- [x] Git Command Reference
- [x] Docker Compose Templates

### Phase 10 进度
- [x] Unit Converter
- [x] Byte Size Converter
- [x] Percentage Calculator
- [x] Math Expression Evaluator
- [x] Roman Numeral Converter
- [x] Aspect Ratio Calculator

*(更多阶段待更新)*

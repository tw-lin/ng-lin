docs/
├─ audit                        # 平台審計紀錄與查詢
├─ audit-hooks                  # 即時審計事件監控
├─ compliance-reports           # 法規遵循報告（SOC2, ISO, GDPR）
├─ logging                      # 系統與事件日誌
├─ retention-policies           # 代碼與元數據保存/刪除策略
├─ identity                     # 使用者、Bot、App 身份管理
├─ multi-tenancy                # 組織/租戶隔離與邊界
├─ event-bus                    # 平台事件總線（webhook / workflow triggers）
├─ org-policies                  # 組織層策略設定
├─ team-management               # Team 權限與角色管理
├─ repo-management               # Repository 創建、命名、生命周期管理
├─ branch-protection             # 分支保護規則（required reviews、status checks）
├─ branch-security-rules         # 分支安全策略（2FA, force push 限制）
├─ branch-naming-conventions     # 分支命名規範
├─ tag-policies                  # Release / Tag 策略
├─ repository-archiving          # 不活躍 repo 封存/生命周期管理
├─ pull-requests                 # 變更提案、審核契約、風險閘門
├─ code-owners                   # 所有權管理與審核責任
├─ issues                        # 協作與決策背景原語
├─ milestones                    # Issue / PR 的目標與進度節點
├─ labels                        # Issue / PR 分類、篩選、治理
├─ assignees-management          # Issue / PR 指派策略
├─ reviewers-management          # PR Review 負責人管理
├─ discussions                   # 非同步協作與社交–技術圖譜
├─ projects                      # 高層次協作與跨 repo 規劃
├─ repository-templates           # 標準化 repo 建立模板
├─ issue-templates                # Issue 樣板（治理標準化）
├─ pull-request-templates         # PR 樣板（治理與一致性）
├─ code-review-guidelines         # PR / Code Review 審查規範
├─ actions                        # GitHub Actions workflow 核心
├─ workflow-templates             # Actions workflow 標準化模板
├─ workflow-approval-gates        # 手動審批點 / 風險閘門
├─ workflow-environments          # Workflow 對應的執行環境策略
├─ scheduled-jobs                 # 定時工作治理與審計
├─ runners                        # Workflow 執行環境抽象（自托管 / GitHub-hosted）
├─ secrets                        # 平台範圍 Secrets 管理
├─ environment-secrets            # Environment 綁定 Secrets
├─ oidc                           # Actions / Apps 身份聯邦與信任邊界
├─ dependabot                     # 自動依賴更新工具
├─ dependabot-policies            # 依賴更新策略與治理
├─ codeql                         # 靜態代碼分析工具
├─ secret-scanning                # 代碼庫敏感資訊檢測
├─ security-policies              # Repository / Org 安全策略
├─ vulnerability-management       # 漏洞管理流程與治理
├─ apps                           # GitHub App / Marketplace 集成
├─ webhooks                       # 外部系統事件通知接口
├─ api                            # REST / GraphQL API 擴展接口
├─ templates                      # repo / issue / PR 樣板集合
├─ environments                   # CI/CD / workflow 執行環境管理

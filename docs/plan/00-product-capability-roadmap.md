# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 当前实现基线：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> 已完成阶段：**Milestone H — Evidence Integrity · Done**
> 当前阶段：**Milestone I — Merge-Gated Production Promotion · Design Review**

## 1. 当前产品判断

Orbis 已完成从结构化静态发布、Presentation、Discovery、Registry、SEO、Knowledge Lifecycle、Scheduled Daily 到 Evidence Integrity 的完整稳态能力。

当前真实使用暴露的最高优先级缺口已经从“内容可信度”转移到“发布操作重复审批”：

```text
PR Build + Trusted Preview
        ↓
Human merge
        ↓
fresh main Site Build
        ↓
manual Production dispatch   ← repeated post-merge friction
```

PR #37（2026-09-08）与 PR #38（2026-09-09）连续证明：Human merge 已经是实际的内容发布批准点，但当前仍需要在 green exact-main Build 后再次手工点击 Production。

因此 Post-H Roadmap Refresh 选择 **Milestone I — Merge-Gated Production Promotion**。

Decision record：[`2026-09-09 · Product Capability Roadmap Refresh`](./2026-09-09-product-capability-roadmap-refresh.md)。

Design：[`Milestone I · Merge-Gated Production Promotion Design`](../superpowers/specs/2026-09-09-merge-gated-production-design.md) · **Design Review**。

## 2. 已完成 Milestones

### Milestone A — Discoverable Orbis · Done
Plan 10，PR #8 / #9 / #10。

### Milestone B — Presentation Platform · Done
Plan 20，PR #11 / #12。

### Milestone C — Weekly Intelligence · Done
Plan 30，PR #13 / #14。

### Milestone D — Knowledge Identity · Done
Plan 40，PR #15 / #19。

### Milestone E — Search & Share Ready · Done
Plan 50，PR #21 / #22。

### Milestone F — Durable Knowledge · Done
Plan 60，PR #23 / #24。

### Milestone G — Sustainable Automation · Done
Plan 70。

### Milestone H — Evidence Integrity · Done
Plan 80，PR #34 / #35 / #36。

Milestone H final production baseline：

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
Production                   34191412383 success
```

Milestone H 完成 Evidence V1 claim → evidence relation、reader-visible correction provenance 与 append-only published correction guard。

## 3. Post-H real evidence

### 2026-09-08 · PR #37

```text
merge commit                 0eeb0648c889c8184e8a4dc90282a9f0c51f92fd
fresh main Site Build        34208091062 success
```

该 artifact 已包含 2026-09-08 Daily，但 merge + green Build 并不会自动推进 Production；线上仍需要另一次人工 Production action。

### 2026-09-09 · PR #38

```text
merge commit                 e639758d993dfdb60791f300c78a6319f1dfe54a
fresh main Site Build        34298769971 success
manual Production run        34299051576 success
Production latest            /2026/09/09/
```

这是第二个连续 Daily 周期，需要在 Human merge 之后再次进行 Production approval。

结论：这是新的、重复、可测量的真实操作摩擦，证据强度高于当前 Search / Weekly Automation / Directory 候选。

## 4. Milestone I — Merge-Gated Production Promotion

目标：

> **Human merge 成为正常发布流程的唯一人工 Production approval。**

只有在 Human merge 之后产生的 exact-main Site Build 成功时，trusted promotion 才可以自动部署该 exact artifact。

目标链路：

```text
Scheduled / Human contribution
        ↓
read-only PR Build
        ↓
Trusted Preview
        ↓
Human merge                         ← sole normal human approval
        ↓
Orbis Site Build · push/main
contents: read
        ↓
exact `orbis-site` artifact
        ↓
trusted workflow_run promotion
        ↓
prove all:
  build conclusion = success
  source event = push
  source branch = main
  source SHA = current main SHA
  source SHA associated with merged PR → main
        ↓
download exact source-run artifact
        ↓
Pages artifact + deploy
        ↓
public smoke
```

## 5. Milestone I authority boundary

Milestone I 不是“Agent 自动发布”。

Scheduled Daily 仍然：

```text
automation/daily/*
    → exact Daily candidate
    → PR only
    → no merge
    → no Pages/OIDC
```

Correction workflow 也仍然需要 Human merge。

新的 Pages authority 只存在于 default-branch trusted promotion workflow 的 deploy job；PR code、Scheduled code 和 ordinary Site Build 都不获得 Production credentials。

Human merge provenance 必须可机器检查。普通 direct push 到 main 不能仅因为 Build green 就自动 Production；如果无法证明 SHA 来自 merged PR，则 fail closed 并使用 manual recovery path。

## 6. Stale build protection

Milestone I 必须阻止旧 main artifact 在较新 merge 后被部署：

```text
merge A → Build A
merge B → main advances → Build B
Build A finishes later
```

Promotion 必须比较：

```text
source workflow_run.head_sha
==
current refs/heads/main SHA
```

不相等时 Build A 只记录 `stale-main`，不得部署。

## 7. Manual recovery

当前 `.github/workflows/pages-production.yml` 在 Milestone I first release 继续保留，定位调整为：

```text
break-glass / explicit recovery
```

而不是正常 Daily merge 后的第二个人工批准点。

Manual recovery 继续保持：

- `workflow_dispatch`；
- main-only deployment；
- full build + validation；
- public smoke；
- Scheduled Agent 不可触发。

## 8. Candidate status after refresh

| 能力 | 状态 | 判断 |
|---|---|---|
| Merge-Gated Production Promotion | **Selected / Design Review** | 连续 #37 / #38 真实摩擦 |
| Static Full-text Search | Deferred | 尚无更强真实检索失败证据 |
| Weekly Scheduled Automation | Deferred | 尚无稳定重复人工负担证据 |
| Source / Author Directory | Deferred | Registry 规模与浏览需求仍不足 |
| Legacy Evidence migration | Maintenance debt | 按真实 correction/reuse 需求推进 |
| Automatic Registry mutation | Reject for now | authority 增量过高 |
| Multi-provider orchestration | Reject for now | 当前无真实需求 |

## 9. Milestone I acceptance direction

最终至少要证明：

- merged PR → fresh main Build → automatic Production promotion；
- exact Build artifact 被直接 promotion，不从“最新成功 run”模糊选择；
- stale successful Build 不会部署；
- failed / cancelled Build 不会部署；
- manual Site Build dispatch 不会部署；
- direct-push / no-merged-PR provenance fail closed；
- Pages/OIDC 权限只在 trusted deploy job；
- public smoke 成功；
- 一个真实 Scheduled Daily merge 不再需要第二次人工 Production 点击；
- manual recovery path 继续可用。

## 10. 当前 Gate

```text
Milestone H · Done
      ↓
Post-H Roadmap Refresh · Done
      ↓
Milestone I selected
      ↓
Merge-Gated Production Design Review      ← current
      ↓
Design approval
      ↓
implementation plan
      ↓
isolated PR
      ↓
implementation merge automatic promotion proof
      ↓
real Daily no-second-click proof
      ↓
Milestone I Done
```

**当前不创建 Plan 90，也不改 main workflow。先完成 Milestone I Design Review。**

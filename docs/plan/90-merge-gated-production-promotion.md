# 90 · Merge-Gated Production Promotion

> 状态：Review Gate
> Roadmap Milestone：I — Merge-Gated Production Promotion
> Design：[`2026-09-09-merge-gated-production-design.md`](../superpowers/specs/2026-09-09-merge-gated-production-design.md) · Approved
> Implementation base：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Implementation branch：`feat/merge-gated-production-promotion`
> PR：#39
> Final 90A head：`e47ba81663dc56be166657390a1c90ebcda83a6c`

## 1. 目标

把正常发布流程从两次人工批准收敛为一次 Human merge，同时保持 Scheduled Agent、PR code 和普通 Build 无 Production authority。

```text
PR Build + Trusted Preview
        ↓
Human merge                    ← normal Production approval
        ↓
Orbis Site Build
        ↓
exact green main artifact
        ↓
trusted eligibility gate
        ↓
exact artifact promotion
        ↓
GitHub Pages + public smoke
```

## 2. Authority invariant

Milestone I 不授权：

- auto-merge；
- Scheduled Daily direct-main；
- Scheduled Daily Pages/OIDC；
- PR artifact 直接部署 Production；
- arbitrary branch deploy；
- direct push 自动发布；
- Registry mutation；
- automatic rollback。

正常 Production authority 仍来自 Human PR merge。

## 3. 90A — Promotion Contract · Review Gate

PR #39 已实现：

- pure promotion eligibility policy；
- workflow contract tests；
- trusted `.github/workflows/pages-promote.yml`；
- `workflow_run` from `Orbis Site Build` only；
- exact `workflow_run.id` + `orbis-site` artifact download；
- current-main SHA equality gate；
- exactly-one merged PR → main provenance gate；
- source `merge_commit_sha == source SHA`；
- stale-main successful no-deploy；
- packaging 后、deploy 前再次检查 current main；
- deploy-job-only Pages/OIDC；
- no checkout / no rebuild in promotion workflow；
- existing dynamic public smoke contract；
- manual `Orbis Pages Production` retained unchanged as break-glass。

### RED evidence

```text
Run       34301462494
Head      1bf4e8fbf9e16d4af5fa33cabc7b00a9cedfa307
Result    failure
Failure   ERR_MODULE_NOT_FOUND · tools/pages-promotion/eligibility.ts
```

Frozen install、Path Guard 与全部既有 Scheduled Daily / correction contracts 先通过，新 focused suite 才因尚未存在的 eligibility implementation 失败，因此这是有效 RED。

### Final GREEN evidence

```text
PR                        #39
Base                      main@e639758d993dfdb60791f300c78a6319f1dfe54a
Head                      e47ba81663dc56be166657390a1c90ebcda83a6c
PR Build                  34301641815 success
Preview Artifact          10085185214
Artifact SHA-256          35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview Publish   34301843125 success
Preview                   https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-39/index.html
```

Focused GREEN contracts：

```text
Merge-gated Production eligibility policy contract passed
Merge-gated Production promotion workflow contract passed
```

Trusted publisher 从 exact source run `34301641815` 下载 artifact `10085185214`，验证相同 SHA-256 后发布 `preview-pr-39`，并在评论 Preview URL 前完成公网 RSS / favicon availability smoke。

### 90A acceptance

- [x] RED contract observed before implementation exists；
- [x] eligibility policy tests green；
- [x] workflow contract tests green；
- [x] full `pnpm build` green；
- [x] Trusted Preview green；
- [x] Human Review Gate reached；
- [x] no Production deployment from implementation PR；
- [ ] Human merge。

## 4. Changed-file scope

Exactly five files：

```text
.github/workflows/pages-promote.yml
package.json
tools/pages-promotion/eligibility.ts
tools/pages-promotion/eligibility.test.ts
tools/pages-promotion/workflow-contract.test.ts
```

No `content/**`、Registry、Astro、Slidev、generated output、Scheduled producer 或 existing manual Production workflow changes。

## 5. 90B — Real-cycle Closeout · Blocked by 90A Human merge

PR #39 Human merge 后，**不要手动 dispatch `Orbis Pages Production`**，以保留真实 automatic-promotion proof。

必须验证：

- fresh main Site Build 自动触发 `Orbis Pages Promote`；
- source run SHA == current main == deployed Pages source SHA；
- promoted artifact 正是 triggering Site Build 的 `orbis-site`；
- public smoke passes；
- no manual Production click is needed；
- 一个之后的真实 Scheduled Daily Human merge 再次重复同一路径；
- 然后才能 Milestone I Done。

## 6. Failure semantics

```text
failed source Build                 deny
workflow_dispatch Site Build        deny
non-main source                     deny
stale source SHA                    stale-main / successful no-deploy
no merged PR provenance             deny
ambiguous merged PR provenance      deny
merge SHA mismatch                  deny
artifact missing                    fail closed
Pages deployment/smoke failure      fail
```

## 7. Current Gate

```text
Design Approved
      ↓
90A RED / GREEN                    Done
      ↓
PR Build                           Done
      ↓
Trusted Preview                    Done
      ↓
Human Review                       ← current
      ↓
Human merge
      ↓
90B automatic exact-SHA promotion proof
      ↓
real Daily no-second-click proof
      ↓
Milestone I Done
```

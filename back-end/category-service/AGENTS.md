<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **category-service** (204 symbols, 397 relationships, 19 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/category-service/context` | Codebase overview, check index freshness |
| `gitnexus://repo/category-service/clusters` | All functional areas |
| `gitnexus://repo/category-service/processes` | All execution flows |
| `gitnexus://repo/category-service/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## 1. CHẾ ĐỘ HƯỚNG DẪN & CODE MẪU (TUTOR MODE - BẮT BUỘC)
- **Khi người dùng yêu cầu thực hiện bất kỳ chức năng nào:**
  - **TUYỆT ĐỐI KHÔNG tự ý code trực tiếp hay sửa file mã nguồn của dự án** (không dùng các công cụ ghi file hoặc thay thế file mã nguồn của ứng dụng).
  - **CHỈ cung cấp code mẫu (code blocks)** hoàn chỉnh, chuẩn cú pháp.
  - **HƯỚNG DẪN CHI TIẾT** nội dung, ý nghĩa của từng đoạn code, giải thích luồng xử lý và vị trí cụ thể (tên file, đường dẫn package, phạm vi hàm) để người dùng tự tay thực hiện vào codebase.

## 2. QUY TRÌNH SUPERPOWERS & GITNEXUS (CODE INTELLIGENCE)
- Sử dụng quy trình của **Superpowers** để lên kế hoạch rõ ràng từng bước, chia nhỏ task độc lập và kiểm thử (TDD / verification).
- Khi dự án đã có mã nguồn và được index bởi **GitNexus**, luôn sử dụng GitNexus (`impact`, `query`, `context`) để phân tích đồ thị code trước khi đề xuất sửa đổi.

## 3. TRIẾT LÝ PONYTAIL (TỐI GIẢN & YAGNI)
- Áp dụng triết lý tối giản: YAGNI (You Aren't Gonna Need It).
- Tận dụng tối đa tính năng sẵn có của Java 21 (như `record` cho DTO), Spring Boot 3.x (Spring Data JPA, Bean Validation, Spring Security) và ràng buộc trực tiếp dưới PostgreSQL (`UNIQUE (type, code)`).
- Tránh over-engineering: không tạo interface thừa khi chỉ có 1 class, không viết mapper phức tạp khi 1 hàm/constructor trong `record` là đủ.

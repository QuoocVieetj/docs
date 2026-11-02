<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is configured with **GitNexus**, **Superpowers**, and **Ponytail** skills in `.agents/skills/`.

> Once source files and `.git` are initialized, run `npx -y gitnexus@latest analyze` from the project root to index the repository.

## Always Do

- **MUST run impact analysis before editing/proposing changes.** Use `impact({target: "symbolName", direction: "upstream"})` (MCP) or `npx -y gitnexus@latest impact "symbolName" --direction upstream --repo .` (CLI fallback); report callers, processes, and risk.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP).
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## CLI & Skills

| Task | Read this skill file |
| --- | --- |
| Brainstorming & Planning | `.agents/skills/brainstorming/SKILL.md`, `.agents/skills/writing-plans/SKILL.md` |
| Understand architecture / "How does X work?" | `.agents/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.agents/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.agents/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.agents/skills/gitnexus-refactoring/SKILL.md` |
| Minimal code & YAGNI | `.agents/skills/ponytail/SKILL.md`, `.agents/skills/gitnexus-ponytail/SKILL.md` |

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


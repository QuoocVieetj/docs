package com.example.document_service.controller;

import com.example.document_service.dto.CategoryRequest;
import com.example.document_service.dto.CategoryResponse;
import com.example.document_service.entity.CategoryType;
import com.example.document_service.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // 1. API danh sách có lọc theo type (và tùy chọn lọc activeOnly)
    // VD: GET /api/categories?type=DOC_TYPE
    // VD: GET /api/categories?type=DOC_TYPE&activeOnly=true
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam(required = false) CategoryType type,
            @RequestParam(required = false) Boolean activeOnly
    ) {
        Boolean isActiveFilter = Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null;
        return ResponseEntity.ok(categoryService.getCategories(type, isActiveFilter));
    }

    // 2. API phục vụ riêng cho Dropdown (luôn chỉ trả về danh mục đang hoạt động is_active = true)
    // VD: GET /api/categories/active?type=URGENCY
    @GetMapping("/active")
    public ResponseEntity<List<CategoryResponse>> getActiveCategoriesForDropdown(
            @RequestParam(required = false) CategoryType type
    ) {
        return ResponseEntity.ok(categoryService.getCategories(type, true));
    }

    // 3. API thêm danh mục mới
    // POST /api/categories
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 4. API sửa danh mục
    // PUT /api/categories/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    // 5. API ngưng dùng danh mục (is_active = false), KHÔNG có API xóa
    // PATCH /api/categories/{id}/deactivate
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CategoryResponse> deactivateCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.deactivateCategory(id));
    }
}
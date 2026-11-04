package com.example.category_service.service;

import com.example.category_service.dto.CategoryRequest;
import com.example.category_service.dto.CategoryResponse;
import com.example.category_service.entity.Category;
import com.example.category_service.entity.CategoryType;
import com.example.category_service.exception.DuplicateResourceException;
import com.example.category_service.exception.ResourceNotFoundException;
import com.example.category_service.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // 1. Lấy danh sách (hỗ trợ lọc type, lọc activeOnly)
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(CategoryType type, Boolean activeOnly) {
        return categoryRepository.findAllByFilter(type, activeOnly)
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    // 2. Thêm mới danh mục
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String normalizedCode = request.code().trim().toUpperCase();

        if (categoryRepository.existsByTypeAndCodeIgnoreCase(request.type(), normalizedCode)) {
            throw new DuplicateResourceException(
                    "Mã danh mục '" + normalizedCode + "' đã tồn tại trong nhóm " + request.type()
            );
        }

        Category category = new Category(
                request.type(),
                normalizedCode,
                request.name().trim(),
                request.symbol() != null ? request.symbol().trim() : null
        );

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    // 3. Cập nhật danh mục
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));

        String normalizedCode = request.code().trim().toUpperCase();

        if (categoryRepository.existsByTypeAndCodeIgnoreCaseAndIdNot(request.type(), normalizedCode, id)) {
            throw new DuplicateResourceException(
                    "Mã danh mục '" + normalizedCode + "' đã tồn tại trong nhóm " + request.type()
            );
        }

        category.setType(request.type());
        category.setCode(normalizedCode);
        category.setName(request.name().trim());
        category.setSymbol(request.symbol() != null ? request.symbol().trim() : null);

        return CategoryResponse.fromEntity(category);
    }

    // 4. Ngưng dùng danh mục (Soft-disable, không xóa)
    @Transactional
    public CategoryResponse deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));

        category.setActive(false);
        return CategoryResponse.fromEntity(category);
    }
}
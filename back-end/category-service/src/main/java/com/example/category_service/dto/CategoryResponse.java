package com.example.category_service.dto;

import com.example.category_service.entity.Category;
import com.example.category_service.entity.CategoryType;

public record CategoryResponse(
        Long id,
        CategoryType type,
        String code,
        String name,
        String symbol,
        boolean isActive
) {
    public static CategoryResponse fromEntity(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getType(),
                category.getCode(),
                category.getName(),
                category.getSymbol(),
                category.isActive()
        );
    }
}

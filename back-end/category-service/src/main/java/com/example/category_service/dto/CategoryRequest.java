package com.example.category_service.dto;

import com.example.category_service.entity.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotNull(message = "Loại danh mục (type) không được để trống")
        CategoryType type,

        @NotBlank(message = "Mã danh mục (code) không được để trống")
        @Size(max = 50, message = "Mã danh mục tối đa 50 ký tự")
        String code,

        @NotBlank(message = "Tên danh mục (name) không được để trống")
        @Size(max = 255, message = "Tên danh mục tối đa 255 ký tự")
        String name,

        @Size(max = 20, message = "Ký hiệu (symbol) tối đa 20 ký tự")
        String symbol
) {
}
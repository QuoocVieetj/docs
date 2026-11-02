package com.example.category_service.repository;

import com.example.category_service.entity.Category;
import com.example.category_service.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    boolean existsByTypeAndCodeIgnoreCase(CategoryType type, String code);
    boolean existsByTypeAndCodeIgnoreCaseAndIdNot(CategoryType type, String code, Long id);

    @Query("""
            SELECT c FROM Category c
            WHERE (:type IS NULL OR c.type = :type)
              AND (:isActive IS NULL OR c.isActive = :isActive)
            ORDER BY c.type ASC, c.id ASC
            """)
    List<Category> findAllByFilter(
            @Param("type") CategoryType type,
            @Param("isActive") Boolean isActive
    );
}

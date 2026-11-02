package com.example.document_service.entity;

import jakarta.persistence.*;

@Entity 
@Table (name = "categories")
public class Category {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated (EnumType.STRING)
    @Column (nullable = false, length = 50)
    private CategoryType type;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 20)
    private String symbol;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    public Category() {
    }
    
    public Category(CategoryType type, String code, String name, String symbol) {
        this.type = type;
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isActive = true;
    }
    public Long getId() {
        return id;
    }
    public CategoryType getType() {
        return type;
    }
    public void setType(CategoryType type) {
        this.type = type;
    }
    public String getCode() {
        return code;
    }
    public void setCode(String code) {
        this.code = code;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getSymbol() {
        return symbol;
    }
    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }
    public boolean isActive() {
        return isActive;
    }
    public void setActive(boolean active) {
        isActive = active;
    }
}


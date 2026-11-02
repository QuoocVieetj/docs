CREATE TABLE categories (
    id        BIGSERIAL    PRIMARY KEY,
    type      VARCHAR(50)  NOT NULL,
    code      VARCHAR(50)  NOT NULL,
    name      VARCHAR(255) NOT NULL,
    symbol    VARCHAR(20),
    is_active BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_categories_type_code UNIQUE (type, code),
    CONSTRAINT chk_categories_type CHECK (
        type IN ('DOC_TYPE', 'URGENCY', 'CONFIDENTIALITY', 'POSITION', 'SEND_METHOD', 'FIELD')
    )
);

CREATE INDEX idx_categories_type_active ON categories (type, is_active);

-- Dữ liệu mẫu (Seed data) để test ngay các loại danh mục
INSERT INTO categories (type, code, name, symbol, is_active) VALUES
    ('DOC_TYPE', 'QD', 'Quyết định', 'QĐ', TRUE),
    ('DOC_TYPE', 'CV', 'Công văn', 'CV', TRUE),
    ('DOC_TYPE', 'TB', 'Thông báo', 'TB', TRUE),
    ('URGENCY', 'THUONG', 'Thường', NULL, TRUE),
    ('URGENCY', 'KHAN', 'Khẩn', 'K', TRUE),
    ('URGENCY', 'HOA_TOC', 'Hỏa tốc', 'HT', TRUE),
    ('CONFIDENTIALITY', 'THUONG', 'Thường', NULL, TRUE),
    ('CONFIDENTIALITY', 'MAT', 'Mật', 'M', TRUE),
    ('POSITION', 'GIAM_DOC', 'Giám đốc', 'GĐ', TRUE),
    ('POSITION', 'TRUONG_PHONG', 'Trưởng phòng', 'TP', TRUE),
    ('SEND_METHOD', 'BUU_DIEN', 'Bưu điện', NULL, TRUE),
    ('SEND_METHOD', 'TRUC_TIEP', 'Trực tiếp', NULL, TRUE);
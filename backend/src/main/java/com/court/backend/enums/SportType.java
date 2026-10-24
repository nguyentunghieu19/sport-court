package com.court.backend.enums;

public enum SportType {
    FOOTBALL("Bóng đá"),
    BADMINTON("Cầu lông"),
    PICKLEBALL("Pickleball"),
    TENNIS("Tennis"),
    BASKETBALL("Bóng rổ"),
    VOLLEYBALL("Bóng chuyền"),
    TABLE_TENNIS("Bóng bàn"),
    OTHER("Khác");

    private final String label;

    SportType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
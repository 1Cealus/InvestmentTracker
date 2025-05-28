package io.cealus.invest_track.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.cealus.invest_track.entity.Investment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InvestmentDTO {

    private Long id;
    private String name;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private BigDecimal amount;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    // New Fields
    private String category;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal purchasePrice;
    private String notes;

    // Constructors
    public InvestmentDTO() {}

    public InvestmentDTO(Investment investment) {
        this.id = investment.getId();
        this.name = investment.getName();
        this.date = investment.getDate();
        this.amount = investment.getAmount();
        this.timestamp = investment.getTimestamp();
        // New fields
        this.category = investment.getCategory();
        this.symbol = investment.getSymbol();
        this.quantity = investment.getQuantity();
        this.purchasePrice = investment.getPurchasePrice();
        this.notes = investment.getNotes();
    }

    // Convert DTO to Entity
    public Investment toEntity() {
        Investment investment = new Investment();
        investment.setId(this.id);
        investment.setName(this.name);
        investment.setDate(this.date);
        investment.setTimestamp(this.timestamp != null ? this.timestamp : LocalDateTime.now());
        // New fields
        investment.setCategory(this.category);
        investment.setSymbol(this.symbol);
        investment.setQuantity(this.quantity);
        investment.setPurchasePrice(this.purchasePrice);
        investment.setNotes(this.notes);

        // Calculate amount if quantity and price are available
        if (this.quantity != null && this.purchasePrice != null) {
            investment.setAmount(this.quantity.multiply(this.purchasePrice));
        } else {
            investment.setAmount(this.amount);
        }

        return investment;
    }

    // Getters and Setters for all fields
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
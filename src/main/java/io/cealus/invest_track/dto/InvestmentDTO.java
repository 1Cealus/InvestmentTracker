package io.cealus.invest_track.dto;

import io.cealus.invest_track.entity.Investment;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InvestmentDTO {
    
    private Long id;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    private BigDecimal amount;
    
    private String name;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Constructors
    public InvestmentDTO() {}
    
    public InvestmentDTO(Investment investment) {
        this.id = investment.getId();
        this.date = investment.getDate();
        this.amount = investment.getAmount();
        this.name = investment.getName();
        this.timestamp = investment.getTimestamp();
    }
    
    public InvestmentDTO(LocalDate date, BigDecimal amount, String name) {
        this.date = date;
        this.amount = amount;
        this.name = name;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    // Convert to Entity
    public Investment toEntity() {
        Investment investment = new Investment();
        investment.setId(this.id);
        investment.setDate(this.date);
        investment.setAmount(this.amount);
        investment.setName(this.name);
        if (this.timestamp != null) {
            investment.setTimestamp(this.timestamp);
        }
        return investment;
    }
}
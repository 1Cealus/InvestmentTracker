package io.cealus.invest_track.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investments")
public class Investment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    // Constructors
    public Investment() {
        this.timestamp = LocalDateTime.now();
    }
    
    public Investment(LocalDate date, BigDecimal amount, String name) {
        this.date = date;
        this.amount = amount;
        this.name = name;
        this.timestamp = LocalDateTime.now();
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
    
    @Override
    public String toString() {
        return "Investment{" +
                "id=" + id +
                ", date=" + date +
                ", amount=" + amount +
                ", name='" + name + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
package io.cealus.invest_track.repository;

import io.cealus.invest_track.entity.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    
    List<Investment> findAllByOrderByTimestampDesc();
    
    @Query("SELECT SUM(i.amount) FROM Investment i")
    Optional<BigDecimal> getTotalAmount();
    
    @Query("SELECT AVG(i.amount) FROM Investment i")
    Optional<BigDecimal> getAverageAmount();
    
    @Query("SELECT i FROM Investment i ORDER BY i.timestamp DESC LIMIT 1")
    Optional<Investment> findLatestInvestment();
    
    List<Investment> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Investment> findByNameContainingIgnoreCase(String name);
}
package io.cealus.invest_track.repository;

import io.cealus.invest_track.entity.Investment;
import io.cealus.invest_track.entity.User; // Import User
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    
    List<Investment> findByUserOrderByTimestampDesc(User user);
    
    @Query("SELECT SUM(i.amount) FROM Investment i WHERE i.user = :user")
    Optional<BigDecimal> getTotalAmount(@Param("user") User user);
    
    @Query("SELECT AVG(i.amount) FROM Investment i WHERE i.user = :user")
    Optional<BigDecimal> getAverageAmount(@Param("user") User user);
    
    @Query("SELECT i FROM Investment i WHERE i.user = :user ORDER BY i.timestamp DESC LIMIT 1")
    Optional<Investment> findLatestInvestment(@Param("user") User user);
    
    List<Investment> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
    
    List<Investment> findByUserAndNameContainingIgnoreCase(User user, String name);

    long countByUser(User user);

    @Modifying
    void deleteByUser(User user);
}
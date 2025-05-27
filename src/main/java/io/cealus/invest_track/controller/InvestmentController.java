package io.cealus.invest_track.controller;

import io.cealus.invest_track.dto.InvestmentDTO;
import io.cealus.invest_track.service.InvestmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/investments")
@CrossOrigin(origins = "http://localhost:3000")
public class InvestmentController {
    
    @Autowired
    private InvestmentService investmentService;
    
    @GetMapping
    public ResponseEntity<List<InvestmentDTO>> getAllInvestments() {
        List<InvestmentDTO> investments = investmentService.getAllInvestments();
        return ResponseEntity.ok(investments);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InvestmentDTO> getInvestmentById(@PathVariable Long id) {
        Optional<InvestmentDTO> investment = investmentService.getInvestmentById(id);
        return investment.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createInvestment(@RequestBody InvestmentDTO investmentDTO) {
        try {
            InvestmentDTO createdInvestment = investmentService.createInvestment(investmentDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdInvestment);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvestment(@PathVariable Long id, @RequestBody InvestmentDTO investmentDTO) {
        try {
            Optional<InvestmentDTO> updatedInvestment = investmentService.updateInvestment(id, investmentDTO);
            return updatedInvestment.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(@PathVariable Long id) {
        boolean deleted = investmentService.deleteInvestment(id);
        return deleted ? ResponseEntity.noContent().build() 
                      : ResponseEntity.notFound().build();
    }
    
    @DeleteMapping
    public ResponseEntity<Void> deleteAllInvestments() {
        investmentService.deleteAllInvestments();
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getInvestmentStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAmount", investmentService.getTotalAmount());
        stats.put("averageAmount", investmentService.getAverageAmount());
        stats.put("totalCount", investmentService.getTotalCount());
        stats.put("latestDate", investmentService.getLatestInvestmentDate().orElse(null));
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<InvestmentDTO>> searchInvestments(@RequestParam String name) {
        List<InvestmentDTO> investments = investmentService.searchInvestmentsByName(name);
        return ResponseEntity.ok(investments);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<InvestmentDTO>> getInvestmentsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<InvestmentDTO> investments = investmentService.getInvestmentsByDateRange(startDate, endDate);
        return ResponseEntity.ok(investments);
    }
}
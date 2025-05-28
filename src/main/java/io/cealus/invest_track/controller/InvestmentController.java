package io.cealus.invest_track.controller;

import io.cealus.invest_track.dto.InvestmentDTO;
import io.cealus.invest_track.entity.User;
import io.cealus.invest_track.repository.UserRepository;
import io.cealus.invest_track.service.InvestmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Collections;
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

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Principal principal) {
        return userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + principal.getName()));
    }

    @GetMapping
    public ResponseEntity<List<InvestmentDTO>> getAllInvestments(Principal principal) {
        List<InvestmentDTO> investments = investmentService.getAllInvestments(getCurrentUser(principal));
        return ResponseEntity.ok(investments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestmentDTO> getInvestmentById(@PathVariable Long id, Principal principal) {
        Optional<InvestmentDTO> investment = investmentService.getInvestmentById(id, getCurrentUser(principal));
        return investment.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInvestment(@RequestBody InvestmentDTO dto, Principal principal) {
        try {
            InvestmentDTO created = investmentService.createInvestment(dto, getCurrentUser(principal));
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvestment(@PathVariable Long id, @RequestBody InvestmentDTO investmentDTO, Principal principal) {
        try {
            // The service method must verify the investment belongs to the current user
            Optional<InvestmentDTO> updatedInvestment = investmentService.updateInvestment(id, investmentDTO);
            return updatedInvestment.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/import")
    public ResponseEntity<?> importInvestments(@RequestBody List<InvestmentDTO> dtos, Principal principal) {
        if (dtos == null || dtos.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "No data to import."));
        }
        try {
            List<InvestmentDTO> importedInvestments = investmentService.importInvestments(dtos, getCurrentUser(principal));
            Map<String, Object> response = new HashMap<>();
            response.put("message", importedInvestments.size() + " investments imported successfully.");
            response.put("importedCount", importedInvestments.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Validation error during import: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred during import: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(@PathVariable Long id, Principal principal) {
        boolean deleted = investmentService.deleteInvestment(id, getCurrentUser(principal));
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllInvestments(Principal principal) {
        investmentService.deleteAllInvestments(getCurrentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getInvestmentStats(Principal principal) {
        User user = getCurrentUser(principal);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAmount", investmentService.getTotalAmount(user));
        stats.put("averageAmount", investmentService.getAverageAmount(user));
        stats.put("totalCount", investmentService.getTotalCount(user));
        stats.put("latestDate", investmentService.getLatestInvestmentDate(user).orElse(null));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/search")
    public ResponseEntity<List<InvestmentDTO>> searchInvestments(@RequestParam String name, Principal principal) {
        List<InvestmentDTO> investments = investmentService.searchInvestmentsByName(getCurrentUser(principal), name);
        return ResponseEntity.ok(investments);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<InvestmentDTO>> getInvestmentsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Principal principal) {
        List<InvestmentDTO> investments = investmentService.getInvestmentsByDateRange(getCurrentUser(principal), startDate, endDate);
        return ResponseEntity.ok(investments);
    }
}
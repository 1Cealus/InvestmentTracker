package io.cealus.invest_track.service;

import io.cealus.invest_track.dto.InvestmentDTO;
import io.cealus.invest_track.entity.Investment;
import io.cealus.invest_track.repository.InvestmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvestmentService {
    
    @Autowired
    private InvestmentRepository investmentRepository;
    
    public List<InvestmentDTO> getAllInvestments() {
        return investmentRepository.findAllByOrderByTimestampDesc()
                .stream()
                .map(InvestmentDTO::new)
                .collect(Collectors.toList());
    }
    
    public Optional<InvestmentDTO> getInvestmentById(Long id) {
        return investmentRepository.findById(id)
                .map(InvestmentDTO::new);
    }
    
    public InvestmentDTO createInvestment(InvestmentDTO investmentDTO) {
        if (investmentDTO.getAmount() == null || investmentDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        
        if (investmentDTO.getName() == null || investmentDTO.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Investment name is required");
        }
        
        if (investmentDTO.getDate() == null) {
            throw new IllegalArgumentException("Investment date is required");
        }
        
        Investment investment = investmentDTO.toEntity();
        Investment savedInvestment = investmentRepository.save(investment);
        return new InvestmentDTO(savedInvestment);
    }
    
    public Optional<InvestmentDTO> updateInvestment(Long id, InvestmentDTO investmentDTO) {
        return investmentRepository.findById(id)
                .map(existingInvestment -> {
                    existingInvestment.setDate(investmentDTO.getDate());
                    existingInvestment.setAmount(investmentDTO.getAmount());
                    existingInvestment.setName(investmentDTO.getName());
                    Investment updatedInvestment = investmentRepository.save(existingInvestment);
                    return new InvestmentDTO(updatedInvestment);
                });
    }
    
    public boolean deleteInvestment(Long id) {
        if (investmentRepository.existsById(id)) {
            investmentRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public void deleteAllInvestments() {
        investmentRepository.deleteAll();
    }
    
    public BigDecimal getTotalAmount() {
        return investmentRepository.getTotalAmount().orElse(BigDecimal.ZERO);
    }
    
    public BigDecimal getAverageAmount() {
        return investmentRepository.getAverageAmount().orElse(BigDecimal.ZERO);
    }
    
    public long getTotalCount() {
        return investmentRepository.count();
    }
    
    public Optional<LocalDate> getLatestInvestmentDate() {
        return investmentRepository.findLatestInvestment()
                .map(Investment::getDate);
    }
    
    public List<InvestmentDTO> getInvestmentsByDateRange(LocalDate startDate, LocalDate endDate) {
        return investmentRepository.findByDateBetween(startDate, endDate)
                .stream()
                .map(InvestmentDTO::new)
                .collect(Collectors.toList());
    }
    
    public List<InvestmentDTO> searchInvestmentsByName(String name) {
        return investmentRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(InvestmentDTO::new)
                .collect(Collectors.toList());
    }
}
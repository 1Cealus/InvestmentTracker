# Investment Tracker Pro

A modern full-stack investment tracking application built with Spring Boot and React.

## Features

- 💰 Track investment amounts and dates
- 📊 View portfolio statistics (total, average, count)
- 📈 Investment history with beautiful UI
- 📥 Export data to CSV
- 🗑️ Clear all data functionality

## Technology Stack

### Backend
- **Java 21**
- **Spring Boot 3.5**
- **Spring Web** - REST API endpoints
- **Spring Data JPA** - Database operations
- **H2 Database** - In-memory database for development
- **Spring Boot DevTools** - Development utilities

### Frontend
- **React 18**
- **Axios** - HTTP client
- **Modern CSS** - Responsive design with gradients and animations



### Prerequisites
- Java 21 or higher
- Maven 3.6+ 
- Node.js 18+ (for frontend development)

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd investment-tracker
   ```

2. **Build and run with Maven (includes frontend build)**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```


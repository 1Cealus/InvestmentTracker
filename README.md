# Investment Tracker Pro

A modern full-stack investment tracking application built with Spring Boot and React.

## Features

- 💰 Track investment amounts and dates
- 📊 View portfolio statistics (total, average, count)
- 📈 Investment history with beautiful UI
- 📥 Export data to CSV
- 🗑️ Clear all data functionality
- 📱 Responsive design for mobile and desktop

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

## Project Structure

```
investment-tracker/
├── src/
│   ├── main/
│   │   ├── java/com/example/investmenttracker/
│   │   │   ├── InvestmentTrackerApplication.java     # Main Spring Boot app
│   │   │   ├── config/
│   │   │   │   └── WebConfig.java                    # CORS configuration
│   │   │   ├── controller/
│   │   │   │   └── InvestmentController.java         # REST API endpoints
│   │   │   ├── dto/
│   │   │   │   └── InvestmentDTO.java               # Data Transfer Object
│   │   │   ├── entity/
│   │   │   │   └── Investment.java                   # JPA Entity
│   │   │   ├── repository/
│   │   │   │   └── InvestmentRepository.java         # Data access layer
│   │   │   └── service/
│   │   │       └── InvestmentService.java            # Business logic
│   │   ├── resources/
│   │   │   ├── application.properties                # Spring Boot config
│   │   │   └── static/                              # Built React app (after build)
│   │   └── frontend/                                # React source code
│   │       ├── public/
│   │       │   └── index.html
│   │       ├── src/
│   │       │   ├── App.js                           # Main React component
│   │       │   ├── App.css                          # Component styles
│   │       │   ├── index.js                         # React entry point
│   │       │   └── index.css                        # Global styles
│   │       └── package.json                         # Frontend dependencies
└── pom.xml                                          # Maven configuration
```

## API Endpoints

### Investments
- `GET /api/investments` - Get all investments
- `GET /api/investments/{id}` - Get investment by ID
- `POST /api/investments` - Create new investment
- `PUT /api/investments/{id}` - Update investment
- `DELETE /api/investments/{id}` - Delete investment
- `DELETE /api/investments` - Delete all investments

### Statistics
- `GET /api/investments/stats` - Get portfolio statistics

### Search & Filter
- `GET /api/investments/search?name={name}` - Search by investment name
- `GET /api/investments/date-range?startDate={date}&endDate={date}` - Filter by date range

## Getting Started

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

3. **Access the application**
   - Frontend: http://localhost:8080
   - H2 Console: http://localhost:8080/h2-console
     - JDBC URL: `jdbc:h2:mem:investment_tracker`
     - Username: `sa`
     - Password: (leave empty)

### Development Mode

For development with hot reload:

1. **Start the backend**
   ```bash
   mvn spring-boot:run
   ```

2. **Start the frontend development server**
   ```bash
   cd src/main/frontend
   npm install
   npm start
   ```

3. **Access the application**
   - Frontend (dev): http://localhost:3000
   - Backend API: http://localhost:8080/api

## Configuration

### Database
The application uses H2 in-memory database by default. To use a persistent database, update `application.properties`:

```properties
# For persistent H2 database
spring.datasource.url=jdbc:h2:file:./data/investment_tracker
spring.jpa.hibernate.ddl-auto=update

# For MySQL (add MySQL dependency to pom.xml)
spring.datasource.url=jdbc:mysql://localhost:3306/investment_tracker
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

### CORS
CORS is configured to allow requests from `http://localhost:3000` for development. Update `WebConfig.java` for production.

## Building for Production

```bash
mvn clean package
java -jar target/investment-tracker-0.0.1-SNAPSHOT.jar
```

The application will serve the React frontend from the Spring Boot backend on port 8080.

## Features Overview

### Investment Management
- Add new investments with date, amount, and name
- View all investments in chronological order
- Real-time portfolio statistics

### Data Export
- Export investment data to CSV format
- Includes all investment details and timestamps

### User Interface
- Modern, responsive design
- Smooth animations and hover effects
- Status notifications for user actions
- Mobile-friendly layout

### Data Persistence  
- All data is stored in H2 database
- Automatic schema creation
- Data validation on both frontend and backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
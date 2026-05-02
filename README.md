# Team Task Manager

A full-stack project & task management web application built with **Java Spring Boot**, **MySQL**, and a **Vanilla JS** SPA frontend.

## Features
- 🔐 JWT authentication (signup / login)
- 👥 Role-based access control (Admin / Member)
- 📁 Project management with team members
- ✅ Task management with Kanban board (drag-and-drop)
- 📊 Dashboard with Chart.js stats & charts
- ⚠️ Overdue task highlighting
- 🔍 Search & filter tasks and projects
- 📱 Fully responsive (mobile + desktop)

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Java 17, Spring Boot 3.2 |
| Security | Spring Security + JWT (jjwt 0.11.5) |
| Database | MySQL 8 + Spring Data JPA |
| Frontend | HTML5, CSS3, Vanilla JS |
| Charts | Chart.js 4 |
| Deployment | Railway |

## Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8.0+

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

### 2. Create MySQL database
```sql
CREATE DATABASE teamtaskdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure environment
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/teamtaskdb?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_MYSQL_USER
spring.datasource.password=YOUR_MYSQL_PASSWORD
jwt.secret=YourSuperSecretKeyAtLeast32CharsLong
```

### 4. Build and run
```bash
cd backend
mvn clean package -DskipTests
java -jar target/team-task-manager-1.0.0.jar
```

Open **http://localhost:9595** in your browser.

> Tables are auto-created by Hibernate (`ddl-auto=update`).

### 5. Create first Admin user
After signing up, manually set role in MySQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register |
| POST | `/api/auth/login` | Public | Login → JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/users` | Admin | List users |
| PUT | `/api/users/{id}/role` | Admin | Update role |
| DELETE | `/api/users/{id}` | Admin | Delete user |
| GET | `/api/projects` | JWT | List projects |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/{id}` | Admin | Update project |
| DELETE | `/api/projects/{id}` | Admin | Delete project |
| POST | `/api/projects/{id}/members` | Admin | Add member |
| DELETE | `/api/projects/{id}/members/{uid}` | Admin | Remove member |
| GET | `/api/tasks` | JWT | List tasks |
| POST | `/api/tasks` | JWT | Create task |
| PUT | `/api/tasks/{id}` | JWT | Update task |
| DELETE | `/api/tasks/{id}` | Admin | Delete task |
| PATCH | `/api/tasks/{id}/status` | JWT | Update status |
| GET | `/api/tasks/dashboard` | JWT | Dashboard stats |

## Railway Deployment

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-username/team-task-manager.git
git push -u origin main
```

### 2. Create Railway project
1. Go to [railway.app](https://railway.app) and login
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### 3. Add MySQL plugin
1. In Railway project → **+ New** → **Database** → **MySQL**
2. Railway will auto-provision a MySQL instance

### 4. Set environment variables
In your Railway service settings → **Variables**, click **Reference Variable** or add them manually:
```
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=YourSuperSecretKeyAtLeast32CharsLong
```

> [!TIP]
> Railway automatically provides `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, and `MYSQLPASSWORD` when you add the MySQL plugin. My optimized configuration uses these automatically, so you don't need to manually construct the `MYSQL_URL` unless you want to override it.

### 5. Deploy
Railway auto-detects the Maven project and builds/deploys on every push.

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `MYSQL_URL` | Full JDBC MySQL URL | `jdbc:mysql://localhost:3306/teamtaskdb` |
| `MYSQL_USER` | MySQL username | `root` |
| `MYSQL_PASSWORD` | MySQL password | `root` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | *change in prod* |
| `JWT_EXPIRATION` | Token TTL in milliseconds | `86400000` (24h) |
| `PORT` | Server port | `8080` |

## Project Structure
```
team-task-manager/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/teamtask/
│       │   ├── config/          # SecurityConfig
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Request & Response DTOs
│       │   ├── entity/          # JPA entities & enums
│       │   ├── exception/       # Global error handler
│       │   ├── repository/      # Spring Data JPA repos
│       │   ├── security/        # JWT provider & filter
│       │   └── service/         # Business logic
│       └── resources/
│           ├── application.properties
│           ├── application-prod.properties
│           └── static/          # Frontend SPA
│               ├── index.html   # Login / Signup
│               ├── dashboard.html
│               ├── tasks.html   # Kanban board
│               ├── projects.html
│               ├── admin.html
│               ├── css/styles.css
│               └── js/
└── README.md
```

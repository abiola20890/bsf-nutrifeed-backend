# 🌱 BSF-Nutrifeed Backend API

A scalable, data-driven backend system for sustainable Black Soldier Fly (BSF) poultry feed production, developed in alignment with **UN SDG 3 — Good Health and Well-being**.

Built by Ibilola Abiola

---

## 🚀 Live Demo

| Environment | URL |
|---|---|
| Production API | https://bsf-nutrifeed-backend.onrender.com |
| Swagger Docs | https://bsf-nutrifeed-backend.onrender.com/api-docs |
| Health Check | https://bsf-nutrifeed-backend.onrender.com/health |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | Backend framework |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens (JWT) | Authentication |
| Zod | Input validation |
| Docker | Containerization |
| Render | Cloud deployment |
| GitHub Codespaces | Cloud development |

---

## 📁 Project Structure
```
bsf-nutrifeed-backend/
├── logs/
│   └── .gitkeep
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection with retry logic
│   │   └── swagger.js             # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   ├── auth.controller.js     # Register, login, get current user
│   │   ├── feed.controller.js     # Feed record CRUD
│   │   └── monitor.controller.js  # Monitoring logs & dashboard
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT protect & role-based access
│   │   ├── errorHandler.js        # Global error & 404 handler
│   │   ├── validate.js            # Zod validation middleware
│   │   └── validateObjectId.js    # MongoDB ObjectId validator
│   ├── models/
│   │   ├── user.model.js          # User schema (farmer, admin)
│   │   ├── FeedRecord.js          # Feed production schema
│   │   └── MonitoringData.js      # Larvae & environment schema
│   ├── routes/
│   │   ├── auth.route.js          # Auth routes
│   │   ├── feed.route.js          # Feed routes
│   │   └── monitor.route.js       # Monitor routes
│   ├── utils/
│   │   ├── jwt.js                 # Token generation
│   │   └── response.js            # Standardized API responses
│   ├── validators/
│   │   ├── auth.validator.js      # Auth Zod schemas
│   │   ├── feed.validator.js      # Feed Zod schemas
│   │   └── monitor.validator.js   # Monitor Zod schemas
│   └── app.js                     # Express app setup
├── .dockerignore
├── .env                           # Environment variables (not committed)
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── server.js                      # Entry point
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=12
```

---

## 🛠️ Installation & Setup

### Local Development

**1. Clone the repository:**
```bash
git clone https://github.com/abiola20890/bsf-nutrifeed-backend.git
cd bsf-nutrifeed-backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create `.env` file** and fill in your environment variables.

**4. Start the development server:**
```bash
npm run dev
```

---

### Docker Development

**1. Make sure Docker is installed and running.**

**2. Build and start containers:**
```bash
docker-compose up --build
```

**3. Stop containers:**
```bash
docker-compose down
```

---

## 📖 API Documentation

### Swagger UI (Interactive)
Full interactive API documentation available at:
```
https://bsf-nutrifeed-backend.onrender.com/api-docs
```
> For local development:
```
http://localhost:5000/api-docs
```

### Postman Collection
Import the Postman collection to test all endpoints locally or on the live server.

**Base URL:** `https://bsf-nutrifeed-backend.onrender.com`

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get tokens |
| GET | `/api/auth/me` | Protected | Get current user |

### Feed Routes (`/api/feed`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/feed` | Protected | Create feed record |
| GET | `/api/feed` | Protected | Get all feed records |
| GET | `/api/feed/:id` | Protected | Get single feed record |
| PUT | `/api/feed/:id` | Protected | Update feed record |
| DELETE | `/api/feed/:id` | Protected | Delete feed record |

### Monitor Routes (`/api/monitor`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/monitor` | Protected | Submit monitoring log |
| GET | `/api/monitor/dashboard` | Protected | Get dashboard metrics |
| GET | `/api/monitor/:feedRecordId` | Protected | Get logs for a batch |

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📊 Sample Requests & Responses

### Register
```json
POST /api/auth/register
{
  "name": "John Farmer",
  "email": "john@bsfnutrifeed.com",
  "password": "password123",
  "role": "farmer",
  "farmName": "Green BSF Farm",
  "location": "Abuja, Nigeria"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "69c63bfc1e8268050f303d6a",
      "name": "John Farmer",
      "email": "john@bsfnutrifeed.com",
      "role": "farmer",
      "farmName": "Green BSF Farm",
      "location": "Abuja, Nigeria"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Create Feed Record
```json
POST /api/feed
{
  "batchId": "BATCH-001",
  "inputs": {
    "organicWaste": 50,
    "waterUsed": 20,
    "additives": "Calcium carbonate"
  },
  "outputs": {
    "feedProduced": 0,
    "larvaeHarvested": 0,
    "compostGenerated": 0
  },
  "startDate": "2026-03-27",
  "notes": "First BSF batch test"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feed record created successfully",
  "data": {
    "batchId": "BATCH-001",
    "status": "ongoing",
    "efficiency": "0.00"
  }
}
```

### Create Monitoring Log
```json
POST /api/monitor
{
  "feedRecord": "69c63fd89db4b3b9c70a6382",
  "larvaeGrowth": {
    "currentWeight": 150,
    "growthStage": "young_larvae",
    "mortality": 3
  },
  "environment": {
    "temperature": 28,
    "humidity": 70,
    "pH": 6.5
  },
  "dailyInput": 500,
  "dailyOutput": 420,
  "remarks": "Larvae growing well, conditions stable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monitoring log created successfully",
  "data": {
    "dailyEfficiency": "0.84",
    "mortalityStatus": "healthy"
  }
}
```

---

## 🐛 Debugging & Performance Report

### Issues Encountered

**1. Zod v4 Breaking Change**
Zod v4 replaced `result.error.errors` with `result.error.issues`, causing all
validation middleware to fail with `Cannot read properties of undefined (reading 'map')`.
This was traced using the global `errorHandler` middleware which logs full
stack traces in development mode.

**Fix:** Updated all Zod error handling to use `result.error.issues`:
```javascript
const errors = result.error.issues.map((e) => ({
  field: e.path.join('.'),
  message: e.message,
}));
```

---

**2. Case-Sensitive File Imports on Linux/Docker**
File names like `validateobjectID.js` and `feedRecord.js` worked on Windows
but crashed inside Docker due to Linux's case-sensitive filesystem.
Errors were identified via Docker container logs:
```bash
docker-compose logs -f api
```

**Fix:** Renamed all files to match exact import casing and used `sed` to
fix imports across route files:
```bash
mv src/middlewares/validateobjectID.js src/middlewares/validateObjectId.js
sed -i 's/validateobjectID/validateObjectId/g' src/routes/feed.route.js
```

---

**3. Mongoose Virtuals Not Rendering with `.lean()`**
Virtual fields like `efficiency`, `dailyEfficiency`, and `mortalityStatus`
were missing from API responses because `.lean()` returns plain JavaScript
objects that bypass Mongoose's `toJSON` transform and virtuals.

**Fix:** Removed `.lean()` on queries that need virtuals. For queries where
performance matters, used `Object.assign()` + `.save()` pattern instead of
`findOneAndUpdate` to trigger pre-save hooks and `toJSON` automatically.

---

**4. `endDate` Validator Failing on `findOneAndUpdate`**
The Mongoose `endDate > startDate` validator used `this.startDate` which
is `undefined` during `findOneAndUpdate` since only the updated fields
are available, not the full document.

**Fix:** Moved date validation to the controller level by fetching the
existing document first, then comparing dates manually before updating:
```javascript
const existing = await FeedRecord.findOne({ _id: req.params.id });
if (endDate && startDate && endDate <= startDate) {
  return errorResponse(res, 'End date must be after start date', 400);
}
Object.assign(existing, req.body);
await existing.save();
```

---

**5. Express 5 Wildcard Route Incompatibility**
`app.options('*', cors())` crashed on Render because Express 5 no longer
supports the `*` wildcard in route paths.

**Fix:** Removed `app.options('*', cors())` since the `cors()` middleware
already handles preflight OPTIONS requests automatically.

---

### Performance Improvements

**1. `.lean()` on Read-Only Queries**
Applied `.lean()` to all read-only queries (`GET` endpoints) for a
significant memory and speed boost since plain JS objects are lighter
than full Mongoose documents.

**2. Compound Indexes**
Added compound indexes to MongoDB schemas to optimize frequent query patterns:
```javascript
feedRecordSchema.index({ farmer: 1, batchId: 1 }, { unique: true });
monitoringDataSchema.index({ feedRecord: 1, logDate: 1 }, { unique: true });
```

**3. Parallel Database Queries**
Used `Promise.all()` in dashboard and list endpoints to run multiple
database queries simultaneously instead of sequentially:
```javascript
const [records, total] = await Promise.all([
  FeedRecord.find(filter)...,
  FeedRecord.countDocuments(filter),
]);
```

**4. Selective Field Projection**
Used `.select('-__v')` and `.select('_id name email role isActive')`
to fetch only required fields, reducing data transfer between
MongoDB and the application.

**5. MongoDB Connection Retry Logic**
Implemented retry logic in `db.js` with configurable attempts and
delay to handle temporary network interruptions gracefully:
```javascript
const connectDB = async (retries = 5, delay = 5000) => { ... }
```

---

## 🐳 Docker

### Dockerfile Stages
- **development** — runs with `nodemon` for hot reload
- **production** — runs with `node` for optimized performance

### Commands
```bash
# Start in development
docker-compose up --build

# Run in background
docker-compose up --build -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f api
```
## NEW ENDPOINTS 

### Auth Routes — New (Week 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/refresh-token` | Public | Refresh access token |
| POST | `/api/auth/logout` | Protected | Logout current user |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password/:token` | Public | Reset password with token |

### Report Routes (`/api/reports`) — New (Week 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/production` | Protected | Full farm production report |
| GET | `/api/reports/analytics` | Protected | Monthly trends & analytics |
| GET | `/api/reports/batch/:batchId` | Protected | Single batch detailed report |
| GET | `/api/reports/admin/all` | Admin only | All farmers overview |

### Audit Routes (`/api/audit`) — New (Week 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/audit` | Admin only | System audit logs with filters |

---

## NEW FEATURES
## ⚡ Week 2 Enhancements

| Feature | Description |
|---|---|
| **Caching** | node-cache on dashboard, feed records & reports — 60s TTL |
| **Rate Limiting** | Global: 100 req/15min · Auth: 10 req/15min |
| **Soft Delete** | Records marked isDeleted — never permanently lost |
| **Audit Trail** | Every action logged — who, what, when, where |
| **Diff Utility** | Only changed fields stored in audit log |
| **Refresh Tokens** | Full token rotation flow implemented |
| **Password Reset** | SHA256 hashed token · 10min expiry |
| **Data Anonymization** | Email, name, IP anonymized in audit logs |
| **Report Endpoints** | Production, analytics, batch reports |
| **Admin Dashboard** | Platform-wide farmer overview |


## 📝 License

This project is developed for educational purposes as part of the
**DSHub Otondo Team** program.

---

## 👥 Author

**BSF-Nutrifeed Backend**
Developed by Ibilola Abiola
In alignment with UN SDG 3 — Good Health and Well-being
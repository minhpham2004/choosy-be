Choosy Backend API

Choosy is a NestJS-based backend that powers the Choosy hobby-matching platform. It provides secure RESTful APIs for user management, matching, chat, reporting, and moderation.

Project Structure

The backend follows a modular architecture, with each feature encapsulated in its own folder containing its controller, service, schema, and DTOs.

src/
│
├── main.ts                   # Application entry point
├── app.module.ts              # Root application module
│
├── auth/                      # Authentication & authorization (JWT)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.dto.ts
│   └── auth.schema.ts
│
├── user/                      # User registration & account details
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.dto.ts
│   └── user.schema.ts
│
├── profile/                   # Profile info
│   ├── profile.controller.ts
│   ├── profile.service.ts
│   ├── profile.dto.ts
│   └── profile.schema.ts
│
├── match/                     # Matching logic & mutual like detection
│   ├── match.controller.ts
│   ├── match.service.ts
│   ├── match.dto.ts
│   └── match.schema.ts
│
├── chat/                      # Messaging between users
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── chat.dto.ts
│   └── chat.schema.ts
│
├── block/                     # User block and safety management
│   ├── block.controller.ts
│   ├── block.service.ts
│   ├── block.dto.ts
│   └── block.schema.ts
│
└── report/                    # Report features
    ├── report.controller.ts
    ├── report.service.ts
    ├── report.dto.ts
    └── report.schema.ts


Each module exposes its own routes and communicates via dependency injection within the NestJS ecosystem.

Team Responsibilities
Member	Responsibilities
- Harry:	Chat and messaging system
- Minh:	Matching logic and image hosting integration
- Anthony:	Safety, reporting, and admin-related features
- Nathan:	Authentication, account creation
- Rayan:	User profiles and profile management

Technologies and Frameworks
- Framework: NestJS (Node.js 20 LTS)
- Language: TypeScript
- Database: MongoDB (hosted on MongoDB Atlas)
- Authentication: JWT (JSON Web Token)
- Image Hosting: Cloudinary API (for profile photos)
- Testing: Jest (unit and e2e testing)
- Deployment: Azure App Service via Azure DevOps pipelines


Environment Configuration
Create a .env file in the backend root directory:
PORT=8080
MONGODB_URI=mongodb+srv://ngocminhpham:CV4onnHfEDfBPCjG@choosy.tnoiskn.mongodb.net/?retryWrites=true&w=majority&appName=choosy
DB_NAME=choosy
JWT_SECRET=dev-secret


Steps to Run the Project
1. Install Dependencies
npm install

2. Start the Application
# Development mode
npm run start:dev

# Production mode
npm run start:prod


The API runs by default at:
http://localhost:8080

3. Run Tests
npm run test
npm run test:e2e
npm run test:cov


Notes for Tutor
- This repository contains backend code only (NestJS API)
- Frontend is deployed separately under the choosy App Service
- All environment variables and credentials are managed securely in Azure DevOps variable groups
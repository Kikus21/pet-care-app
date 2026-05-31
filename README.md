# Darling & Care — Pet Care App

Aplikácia na správu zvierat a ich procedúr (očkovanie, návštevy veterinára, atď.)

## Spustenie projektu

### 1. Backend (BE)
```bash
cd server
npm install
node app.js
```
BE beží na `http://localhost:3001`

### 2. Frontend (FE)
```bash
cd client
npm install
npm start
```
FE beží na `http://localhost:3000`

## Štruktúra projektu

```
pet-care-app/
├── client/        # React SPA (frontend)
│   ├── src/
│   │   ├── pages/       # DashboardPage, AnimalsPage, ProceduresPage, HistoryPage
│   │   ├── components/  # Modaly (AddAnimal, AddProcedure, EditAnimal, EditProcedure)
│   │   ├── context/     # AppContext, DashboardContext, modal contexty
│   │   └── utils/       # Preklady (translations.js)
│   └── public/
└── server/        # Express.js REST API (backend)
    ├── abl/       # Business logika
    ├── controllers/
    └── dao/       # JSON file storage
```

## Technológie

| | Technológia |
|---|---|
| Frontend | React 19, React Router v6 |
| Backend | Express.js 5, Node.js |
| Storage | JSON file-based |

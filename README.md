# payroll

Monorepo structure:

- `backend/` Laravel API + admin dashboard
- `frontend/` React (Vite) client

## Run backend (Laravel)

```powershell
cd backend
composer install
php artisan serve
```

Optional assets (Laravel Vite):

```powershell
cd backend
npm install
npm run dev
```

## Run frontend (React)

```powershell
cd frontend
npm install
npm run dev
```

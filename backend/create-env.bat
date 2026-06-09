@echo off
(
echo PORT=5000
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=hostel_management
echo DB_USER=postgres
echo DB_PASSWORD=your_postgres_password_here
echo JWT_SECRET=zuct_hostel_super_secret_key_2026
echo FRONTEND_URL=http://localhost:5173
) > .env
echo .env file created successfully!
echo Now open .env in Notepad and replace your_postgres_password_here with your real password.
pause

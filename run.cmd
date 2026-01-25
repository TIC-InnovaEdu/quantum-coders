@echo off
rem Script para probar el sitio localmente (Windows)
rem Navega a la carpeta public relativa a este archivo y levanta un servidor

setlocal

rem Ir a la carpeta public (ubicada junto a este script)
cd /d "%~dp0public"
if errorlevel 1 goto cd_error

set PORT=5000

rem Intentar usar Node.js (npx) con el paquete 'serve'
where npx >nul 2>nul
if %ERRORLEVEL%==0 (
	echo Iniciando servidor con npx serve en http://localhost:%PORT%
	rem Lanzar el servidor en una nueva ventana para no bloquear este script
	start "Servidor Quantum Coders" cmd /c npx --yes serve -l %PORT%
	rem Pequeña espera para que el servidor arranque
	timeout /t 2 /nobreak >nul
	rem Abrir el navegador por defecto apuntando al sitio
	start "" http://localhost:%PORT%
	echo Listo: se abrio el sitio en tu navegador.
	goto end
)

rem Fallback: intentar con Python si esta disponible
where python >nul 2>nul
if %ERRORLEVEL%==0 (
	echo Iniciando servidor con Python en http://localhost:%PORT%
	start "Servidor Quantum Coders" cmd /c python -m http.server %PORT%
	timeout /t 2 /nobreak >nul
	start "" http://localhost:%PORT%
	echo Listo: se abrio el sitio en tu navegador.
	goto end
)

echo No se encontro Node.js (npx) ni Python.
echo Instala Node.js desde https://nodejs.org y vuelve a ejecutar este script.
pause
goto end

:cd_error
echo No se pudo acceder a la carpeta 'public'.
echo Asegurate de que este script este en la raiz del repositorio y que exista la carpeta 'public'.
pause
goto end

:end
endlocal
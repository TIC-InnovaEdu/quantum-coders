# Runa Pachawan - Proyecto de Prácticas de Servicio Comunitario

[![Play Online](https://img.shields.io/badge/Play-Online-brightgreen?style=for-the-badge&logo=github)](https://tic-innovaedu.github.io/quantum-coders/)

Este proyecto es una aplicación web interactiva basada en la cultura andina, desarrollada como parte de las **Prácticas de Servicio Comunitario - Grupo 1** de la Universidad Politécnica Salesiana (UPS).

## 🎮 Juega Ahora
Puedes acceder al juego directamente desde tu navegador aquí:
👉 **[https://tic-innovaedu.github.io/quantum-coders/](https://tic-innovaedu.github.io/quantum-coders/)**

## � Carpeta de Instalación (Recomendado para Presentaciones)
Para facilitar la instalación en múltiples equipos sin descargar todo el repositorio, utiliza la carpeta `Instalador`:

1. Copia la carpeta **`Instalador`** a tu pendrive.
2. En la máquina de destino, abre la carpeta y ejecuta **`setup.ps1`** (Clic derecho > Ejecutar con PowerShell).
3. El script creará automáticamente un acceso directo en el **Escritorio** con el icono del juego y en modo aplicación independiente.

### Contenido de la carpeta Instalador:
- `setup.ps1`: Script de automatización.
- `Assets/Icono.png`: Imagen oficial para el acceso directo.

## 👥 Integrantes del Equipo
- **Rodrigo Damián Orlando**
- **Henry Mateo Rosero Gaibor**
- **Winston Geovanni Quinde Pezo**

## 🎮 El Juego: Runa Pachawan
Runa Pachawan es una experiencia lúdica diseñada para resaltar y preservar elementos de la cultura andina a través de mecánicas de juego de plataformas, interacción con NPCs (como Ayllu) y resolución de desafíos.

## 🚀 Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3 y JavaScript (Vanilla JS).
- **Backend/Infraestructura**: 
  - **Firebase Auth**: Autenticación segura mediante Correo/Contraseña y Google Sign-In.
  - **Firestore**: Base de datos NoSQL en tiempo real para el almacenamiento de puntuaciones y perfiles de usuario.
  - **Firebase Hosting**: Despliegue y alojamiento de la aplicación web.

## 📁 Estructura del Proyecto
- `public/`: Núcleo de la aplicación.
  - `index.html`: Punto de entrada principal de la aplicación.
  - `auth.js`: Módulo de autenticación y lógica de Firebase.
  - `func.js`: Lógica del juego, físicas, enemigos e interacciones.
  - `interface.css`: Estilos del HUD, modales y diseño responsivo.
  - `estilos.css`: Estilos base del motor de juego.
  - `Resources/`: Activos multimedia (imágenes, sprites, música y efectos de sonido).
- `firestore.rules`: Configuración de seguridad para el acceso a la base de datos.
- `firebase.json`: Configuración de despliegue y reglas de hosting.
- `.firebaserc`: Identificador del proyecto en Firebase (`practicas-comunitarias-a63ba`).

## 🛠️ Configuración para Desarrollo
1. Asegúrate de tener habilitados los proveedores de **Correo electrónico** y **Google** en la consola de Firebase Auth.
2. Las reglas de Firestore deben permitir la escritura en la colección `users` y `scores`.
3. Para ejecutar localmente, se recomienda un servidor web simple (como la extensión Live Server de VS Code).

---
*© 2026 - Grupo 1 de Prácticas de Servicio Comunitario (UPS)*

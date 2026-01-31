# Script de Instalación Portable - Runa Pachawan
# Este script genera un acceso directo limpio (Modo App) en el escritorio del usuario.

$ShortcutName = "Runa Pachawan"
$GameURL = "https://tic-innovaedu.github.io/quantum-coders/"
$PngPath = "$PSScriptRoot\Assets\Icono.png"
$IcoPath = "$PSScriptRoot\Assets\Icono.ico"

# --- FUNCIÓN DE CONVERSIÓN PNG A ICO (Manual y Robusta) ---
function Convert-PngToIco {
    param([string]$PngPath, [string]$IcoPath)
    
    $pngBytes = [System.IO.File]::ReadAllBytes($PngPath)
    $pngSize = $pngBytes.Length
    
    # Obtener dimensiones (asumimos que el PNG es cuadrado y < 256x256)
    Add-Type -AssemblyName System.Drawing
    $bmp = [System.Drawing.Bitmap]::FromFile($PngPath)
    $width = [math]::Min($bmp.Width, 255)
    $height = [math]::Min($bmp.Height, 255)
    $bmp.Dispose()

    $icoHeader = [byte[]] @(
        0, 0,           # Reserved
        1, 0,           # Type (Icon)
        1, 0,           # Count (1 image)
        
        # Directory Entry
        $width,         # Width
        $height,        # Height
        0,              # Color palette
        0,              # Reserved
        1, 0,           # Color planes
        32, 0,          # Bits per pixel
        ($pngSize -band 0xff), (($pngSize -shr 8) -band 0xff), (($pngSize -shr 16) -band 0xff), (($pngSize -shr 24) -band 0xff), # Size
        22, 0, 0, 0     # Offset (Header 6 + Entry 16 = 22)
    )

    $fileStream = [System.IO.File]::Create($IcoPath)
    $fileStream.Write($icoHeader, 0, $icoHeader.Length)
    $fileStream.Write($pngBytes, 0, $pngBytes.Length)
    $fileStream.Close()
}

if (-not (Test-Path $IcoPath)) {
    Write-Host "Generando icono compatible con Windows..." -ForegroundColor Cyan
    try {
        Convert-PngToIco -PngPath $PngPath -IcoPath $IcoPath
    } catch {
        Write-Host "Error al generar el .ico: $($_.Exception.Message)" -ForegroundColor Red
        $IcoPath = $PngPath
    }
} else {
    # Forzar regeneración para asegurar que no esté corrupto
    try {
        Convert-PngToIco -PngPath $PngPath -IcoPath $IcoPath
    } catch {}
}

# Rutas de Navegadores
$ChromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
$ChromePath86 = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
$EdgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"

if (Test-Path $ChromePath) {
    $Target = $ChromePath
} elseif (Test-Path $ChromePath86) {
    $Target = $ChromePath86
} elseif (Test-Path $EdgePath) {
    $Target = $EdgePath
} else {
    Write-Host "No se encontró Chrome ni Edge. Se usará el navegador predeterminado." -ForegroundColor Yellow
    $Target = "cmd.exe"
    $Args = "/c start $GameURL"
}

if ($Target -ne "cmd.exe") {
    $Args = "--app=$GameURL"
}

# Asegurar que las rutas sean absolutas para el acceso directo
$AbsTarget = (Resolve-Path $Target).Path
$AbsIcoPath = (Resolve-Path $IcoPath).Path

# Crear el acceso directo en el ESCRITORIO del usuario
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\$ShortcutName.lnk")
$Shortcut.TargetPath = $AbsTarget
$Shortcut.Arguments = $Args
$Shortcut.IconLocation = "$AbsIcoPath,0" # ,0 indica el primer icono en el archivo
$Shortcut.Description = "Jugar Runa Pachawan (Modo App)"
$Shortcut.WorkingDirectory = $DesktopPath
$Shortcut.Save()

Write-Host "`n✅ ¡Instalación Exitosa!" -ForegroundColor Green
Write-Host "Se ha creado un acceso directo en tu Escritorio con el icono oficial."
Write-Host "Puedes cerrar esta ventana y empezar a jugar.`n"
pause

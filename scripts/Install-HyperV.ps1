#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instala Hyper-V en Windows Server y deja el host listo para importar maquinas virtuales.

.DESCRIPTION
    - Verifica requisitos (hardware virtualización, SO compatible)
    - Instala el rol Hyper-V con herramientas de administración
    - Crea un vSwitch externo sobre el adaptador de red activo
    - Configura rutas de almacenamiento por defecto
    - Solicita reinicio al finalizar

.PARAMETER VMStoragePath
    Ruta donde se guardarán los archivos de VM. Default: D:\VMs

.PARAMETER VHDStoragePath
    Ruta donde se guardarán los VHDs. Default: D:\VMs\VHDs

.PARAMETER SwitchName
    Nombre del vSwitch externo a crear. Default: vSwitch-Externo

.EXAMPLE
    .\Install-HyperV.ps1
    .\Install-HyperV.ps1 -VMStoragePath "E:\VMs" -SwitchName "LAN"
#>

[CmdletBinding()]
param(
    [string]$VMStoragePath  = "D:\VMs",
    [string]$VHDStoragePath = "D:\VMs\VHDs",
    [string]$SwitchName     = "vSwitch-Externo"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Msg)
    Write-Host "`n[+] $Msg" -ForegroundColor Cyan
}

function Write-OK   { param([string]$Msg) Write-Host "    OK  $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "    AVISO  $Msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$Msg) Write-Host "    ERROR  $Msg" -ForegroundColor Red; exit 1 }

# ─── 1. VERIFICAR SO ─────────────────────────────────────────────────────────
Write-Step "Verificando sistema operativo..."
$os = Get-CimInstance Win32_OperatingSystem
if ($os.ProductType -eq 1) {
    Write-Warn "Estás en Windows cliente (no Server). Hyper-V se instalará igual, pero para producción se recomienda Windows Server."
}
Write-OK "SO: $($os.Caption)"

# ─── 2. VERIFICAR VIRTUALIZACIÓN EN HARDWARE ─────────────────────────────────
Write-Step "Verificando soporte de virtualización en hardware..."
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1

# VirtualizationFirmwareEnabled puede no existir en todos los builds
$virt = $cpu.VirtualizationFirmwareEnabled
if ($null -eq $virt) {
    Write-Warn "No se pudo detectar VirtualizationFirmwareEnabled. Verifica en BIOS/UEFI que Intel VT-x / AMD-V esté habilitado."
} elseif (-not $virt) {
    Write-Fail "La virtualización por hardware está DESHABILITADA en el BIOS/UEFI. Habilita Intel VT-x o AMD-V y vuelve a ejecutar este script."
} else {
    Write-OK "Virtualización por hardware habilitada."
}

# ─── 3. INSTALAR ROL HYPER-V ─────────────────────────────────────────────────
Write-Step "Instalando rol Hyper-V y herramientas de administración..."
$feature = Get-WindowsFeature -Name Hyper-V

if ($feature.InstallState -eq "Installed") {
    Write-OK "Hyper-V ya estaba instalado."
} else {
    $result = Install-WindowsFeature `
        -Name Hyper-V `
        -IncludeManagementTools `
        -IncludeAllSubFeature `
        -Verbose:$false

    if ($result.Success) {
        Write-OK "Rol Hyper-V instalado correctamente."
    } else {
        Write-Fail "Falló la instalación del rol Hyper-V. Revisa el Event Viewer."
    }
}

# ─── 4. CREAR DIRECTORIOS DE ALMACENAMIENTO ───────────────────────────────────
Write-Step "Creando directorios de almacenamiento..."
foreach ($path in @($VMStoragePath, $VHDStoragePath)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-OK "Creado: $path"
    } else {
        Write-OK "Ya existe: $path"
    }
}

# ─── 5. CONFIGURAR RUTAS POR DEFECTO EN HYPER-V ──────────────────────────────
Write-Step "Configurando rutas por defecto en Hyper-V..."
try {
    Set-VMHost `
        -VirtualMachinePath $VMStoragePath `
        -VirtualHardDiskPath $VHDStoragePath
    Write-OK "Rutas de VM y VHD configuradas."
} catch {
    Write-Warn "No se pudieron configurar las rutas de Hyper-V ahora (requiere reinicio). Se configurarán en el próximo inicio."
}

# ─── 6. CREAR vSWITCH EXTERNO ────────────────────────────────────────────────
Write-Step "Configurando vSwitch externo '$SwitchName'..."
try {
    $existingSwitch = Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue
    if ($existingSwitch) {
        Write-OK "vSwitch '$SwitchName' ya existe."
    } else {
        # Detecta el adaptador físico con conexión activa (excluyendo loopback y virtuales)
        $nic = Get-NetAdapter |
            Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -notmatch "Hyper-V|Virtual|Loopback|Bluetooth" } |
            Sort-Object -Property LinkSpeed -Descending |
            Select-Object -First 1

        if ($null -eq $nic) {
            Write-Warn "No se encontró adaptador físico activo. Crea el vSwitch manualmente desde Hyper-V Manager."
        } else {
            New-VMSwitch `
                -Name $SwitchName `
                -NetAdapterName $nic.Name `
                -AllowManagementOS $true | Out-Null
            Write-OK "vSwitch '$SwitchName' creado sobre adaptador '$($nic.Name)'."
        }
    }
} catch {
    Write-Warn "No se pudo crear el vSwitch ahora (requiere que Hyper-V esté activo). Créalo manualmente tras el reinicio."
    Write-Warn "  New-VMSwitch -Name '$SwitchName' -NetAdapterName '<adaptador>' -AllowManagementOS `$true"
}

# ─── 7. RESUMEN ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  INSTALACIÓN COMPLETADA" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Almacenamiento VMs : $VMStoragePath"
Write-Host "  Almacenamiento VHDs: $VHDStoragePath"
Write-Host "  vSwitch externo    : $SwitchName"
Write-Host ""
Write-Host "  Próximos pasos para importar tu máquina:" -ForegroundColor Yellow
Write-Host "  1. Reinicia el servidor (obligatorio)"
Write-Host "  2. Copia los archivos .vmcx / .vhd(x) a $VMStoragePath"
Write-Host "  3. En Hyper-V Manager: Acción > Importar máquina virtual..."
Write-Host "     O en PowerShell:"
Write-Host "     Import-VM -Path '<ruta>\<nombre>.vmcx'" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# ─── 8. REINICIO ─────────────────────────────────────────────────────────────
$reboot = Read-Host "`n¿Reiniciar ahora? (s/n)"
if ($reboot -match "^[sS]") {
    Write-Host "Reiniciando en 10 segundos... (Ctrl+C para cancelar)" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Restart-Computer -Force
} else {
    Write-Host "Reinicia manualmente cuando estés listo para usar Hyper-V." -ForegroundColor Yellow
}

# Sistema de Diseño y Estética Visual — SISTEMA FAC2026

## 🎨 Principios de Diseño
El sistema utiliza una interfaz minimalista, limpia, moderna y corporativa de alto impacto.

### 1. Paleta de Colores Corporativa
- **Verde Esmeralda / Menta (Identidad Logo)**:
  - Primario: `#059669` / `#10b981` / `#34d399`
  - Gradiente Botones: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
  - Sombra Activa: `rgba(16, 185, 129, 0.32)`
- **Azul Real / Corporativo**:
  - Primario: `#0d47c9` / `#1d4ed8` / `#2563eb` / `#3b82f6`
  - Gradiente: `linear-gradient(135deg, #0d47c9 0%, #2563eb 100%)`
- **Cyan Oceánico**:
  - Primario: `#0284c7` / `#0ea5e9` / `#38bdf8`
- **Pizarra / Slate**:
  - Primario: `#0f172a` / `#1e293b` / `#334155` / `#64748b`
- **Fondos y Superficies**:
  - Modo Claro: Fondo `#f8fafc` o `#f4f7fb`, Tarjetas `#ffffff`, Bordes `#e2e8f0`
  - Modo Oscuro: Fondo `#0a0f1d`, Tarjetas `#131b2e`, Bordes `#222f49`, Inputs `#0b1120`

### 2. Tipografía y Micro-Textos
- Fuente principal: `'Poppins', sans-serif`.
- Etiquetas de formulario (`label`): `font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--gris);`.
- Títulos de tarjeta: `font-size: 21px; font-weight: 800; letter-spacing: -0.2px;`.

### 3. Formas y Bordes Redondeados
- **Botones de Acción**: Estilo píldora `border-radius: 50px`.
- **Inputs, Selects y Textareas**: `border-radius: 14px; padding: 13px 16px;`.
- **Tarjetas y Paneles**: `border-radius: 24px` a `26px; padding: 26px` a `30px;`.
- **Badges y Etiquetas de Estado**: Píldoras `border-radius: 50px` con padding `6px 14px` a `8px 20px`.
- **Tablas**: Bordes redondeados `border-radius: 16px; overflow: hidden;`.

### 4. Animaciones y Microinteracciones
- Hover en tarjetas: `transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);`.
- Hover en botones: `transform: translateY(-2px);`.
- Indicador de estado MH: Punto pulsante (`pulseDot 2s infinite ease-in-out`).

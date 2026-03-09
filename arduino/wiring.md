# Kiln Controller Wiring

Based on the pin definitions in `src/kiln.cpp`, here is the wiring guide for connecting the TinyDuino SAMD to the Adafruit MAX31855 thermocouple amplifier and the Solid State Relays (SSRs).

## Pin Connections

### MAX31855 Thermocouple Amplifier

| TinyDuino SAMD (Host) | Adafruit MAX31855 Breakout | Description |
| :--- | :--- | :--- |
| **GND** | **GND** | Ground |
| **VCC** (3.3V or 5V) | **Vin** | Power |
| **Pin 5** | **CLK** | SPI Clock |
| **Pin 4** | **CS** | Chip Select |
| **Pin 3** | **DO** | Data Out (MISO) |

### Thermocouple

| Thermocouple (Type K) | MAX31855 Terminal Block |
| :--- | :--- |
| **Yellow Wire (+)** | **+** |
| **Red Wire (-)** | **-** |

*(Note: If using IEC standard, Green is + and White is -)*

### Solid State Relays (SSRs)

| TinyDuino SAMD (Host) | SSR Terminal | Description |
| :--- | :--- | :--- |
| **Pin 6** | **Control + (Upper SSR)** | Upper Element Control |
| **Pin 7** | **Control + (Lower SSR)** | Lower Element Control |
| **GND** | **Control - (Both SSRs)** | Common Ground |

## Schematic Diagram (Mermaid Viewer)

```mermaid
graph LR
    subgraph TinyDuino [TinyDuino SAMD]
        P3[Pin 3]
        P4[Pin 4]
        P5[Pin 5]
        P6[Pin 6]
        P7[Pin 7]
        VCC[VCC]
        GND[GND]
    end

    subgraph MAX31855 [Adafruit MAX31855]
        DO[DO]
        CS[CS]
        CLK[CLK]
        Vin[Vin]
        bGND[GND]
        Tp[Term +]
        Tm[Term -]
    end

    subgraph TC [Thermocouple Type K]
        WireY[Yellow Wire +]
        WireR[Red Wire -]
    end

    subgraph SSR_UPPER [Upper SSR]
        SSR1_P[Control +]
        SSR1_N[Control -]
    end

    subgraph SSR_LOWER [Lower SSR]
        SSR2_P[Control +]
        SSR2_N[Control -]
    end

    P3 --> DO
    P4 --> CS
    P5 --> CLK
    VCC --> Vin
    GND --> bGND

    WireY --> Tp
    WireR --> Tm

    P6 --> SSR1_P
    GND --> SSR1_N
    P7 --> SSR2_P
    GND --> SSR2_N
```

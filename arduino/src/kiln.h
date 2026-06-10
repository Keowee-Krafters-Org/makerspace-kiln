#ifndef KILN_H
#define KILN_H
#define VERSION "0.3.0"
#include <Arduino.h>
#include <PID_v1.h>
#include <Adafruit_MAX31856.h>
#include <ArduinoJson.h> 




#define MAX_PROFILE_STEPS 20

// --- Hardware Pins ---
// For MAX31856, use the TinyZero SPI terminal block pins (PA16..PA19).
// In the zeroUSB variant these map to digital pins 35/37/36/34:
// MOSI=35(PA16), SCK=37(PA17), SS=36(PA18), MISO=34(PA19)
#define MAX_MISO_PIN 34
#define MAX_MOSI_PIN 35
#define MAXCS        36
#define MAX_SCK_PIN  37
#define LED_PIN 13

// Temporary diagnostic mode: cycles SS and SCK through fixed states so a
// meter can verify terminal-to-pin mapping. Set to 0 for normal operation.
#define SPI_PIN_DIAGNOSTIC_MODE 0

// --- Runtime Configuration ---
#define PID_WINDOW_SIZE 10000
#define MAX_SAFE_TEMPERATURE 1100.0

// MAX31856 fault register bits
#define MAX31856_FAULT_CJRANGE 0x80
#define MAX31856_FAULT_TCRANGE 0x40
#define MAX31856_FAULT_CJHIGH  0x20
#define MAX31856_FAULT_CJLOW   0x10
#define MAX31856_FAULT_TCHIGH  0x08
#define MAX31856_FAULT_TCLOW   0x04
#define MAX31856_FAULT_OVUV    0x02
#define MAX31856_FAULT_OPEN    0x01

// Tracking window safety: terminate if SOAK temp stays outside allowed band.
// Tune these to ignore normal oscillation while catching external heat loss.
#define TRACKING_WINDOW_DEVIATION_C 60.0
#define TRACKING_WINDOW_HOLD_MS 180000UL
#define TRACKING_WINDOW_MIN_SETPOINT_C 150.0

// Response-lag safety: catches no-heat situations (power/timer/breaker off)
// by requiring measurable temperature rise under sustained heat demand.
#define RESPONSE_LAG_MIN_SETPOINT_C 150.0
#define RESPONSE_LAG_DEMAND_C 40.0
#define RESPONSE_LAG_HEATER_OUTPUT_MIN 2500.0
#define RESPONSE_LAG_WINDOW_MS 300000UL
#define RESPONSE_LAG_MIN_RISE_C 5.0

enum KilnState { IDLE, PREHEAT, RAMP, SOAK, COOL, COMPLETED, ABORTED, EMERGENCY_STOP, ERROR_STATE };

struct ProfileStep {
    KilnState type;
    double targetTemperature;
    unsigned long duration; // stored in milliseconds. If 0, use rate.
    double rate; // degrees per hour. Used if duration is 0.
    double initialSetpoint; // Optional override
};

struct Profile {
    char id[21]; // Changed from long long to char array for large numbers
    char name[64];
    int stepCount;
    ProfileStep steps[MAX_PROFILE_STEPS];
};

void updateLedIndicator();
void reportStatus(bool forceReport = false);
void handleCommand(JsonDocument& doc);
#if defined(ARDUINO_ARCH_SAMD)
#define Serial_ SerialUSB
#else
#define Serial_ Serial
#endif

#endif
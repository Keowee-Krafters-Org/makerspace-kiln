#ifndef KILN_H
#define KILN_H
#define VERSION "0.2.0"
#include <Arduino.h>
#include <PID_v1.h>
#include <Adafruit_MAX31856.h>
#include <ArduinoJson.h> 




#define MAX_PROFILE_STEPS 20

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
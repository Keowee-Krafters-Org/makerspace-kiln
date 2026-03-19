
#include <Arduino.h>
#ifndef DRIVER
#define DRIVER
#define SSR_UPPER 0
#define SSR_LOWER 1

/**
 * Sets the SSR to Full ON (5V) or Full OFF (0V)
 * @param pin   The channel on the TinyShield (0, 1, 2, or 3)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state); 

/**
 * Emergency Shutdown: Pulls all SSRs LOW immediately
 */
void killAllHeat() ;

bool setupIO();

bool getSSRState(uint8_t pin);

//#define DRIVER_PIO // Uncomment to use direct pin control for SSRs (simpler but may have timing issues at very low PID windows)
//#define DRIVER_PWM // Uncomment to use PWM-based SSR control (requires Adafruit PWM Shield)
#define DRIVER_MOTOR // Uncomment to use the TinyCircuits Motor Driver shield
#endif
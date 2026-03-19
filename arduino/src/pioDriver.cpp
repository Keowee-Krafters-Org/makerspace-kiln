#include "driver.h"

#ifdef DRIVER_PIO

#include <Arduino.h>
#include "pioDriver.h"

#define SSR_1_1 6
#define SSR_1_2 7
#define SSR_2_1 -1 // Not used
#define SSR_2_2 -1 // Not used

/**
 * Sets the SSR to Full ON (5V) or Full OFF (0V)
 * @param pin   The channel on the TinyShield (0, 1, 2, or 3)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (pin == SSR_UPPER) {
        digitalWrite(SSR_1_1, state ? HIGH : LOW);
        digitalWrite(SSR_1_2, state ? HIGH : LOW);
    } else if (pin == SSR_LOWER) {
        if(SSR_2_1 > -1) digitalWrite(SSR_2_1, state ? HIGH : LOW);
        if(SSR_2_2 > -1) digitalWrite(SSR_2_2, state ? HIGH : LOW);
    }
}

/**
 * Emergency Shutdown: Pulls all SSRs LOW immediately
 */
void killAllHeat() {
    digitalWrite(SSR_1_1, LOW);
    digitalWrite(SSR_1_2, LOW);
    if(SSR_2_1 > -1) digitalWrite(SSR_2_1, LOW);
    if(SSR_2_2 > -1) digitalWrite(SSR_2_2, LOW);
}

bool setupIO() {
    pinMode(SSR_1_1, OUTPUT);
    pinMode(SSR_1_2, OUTPUT);
    if(SSR_2_1 > -1) pinMode(SSR_2_1, OUTPUT);
    if(SSR_2_2 > -1) pinMode(SSR_2_2, OUTPUT);
    return true;
}

bool getSSRState(uint8_t pin) {
    if (pin == SSR_UPPER) {
        return digitalRead(SSR_1_1) == HIGH;
    } else if (pin == SSR_LOWER) {
        return digitalRead(SSR_1_2) == HIGH;
    }
    return false;
}

#endif // DRIVER == DRIVER_PIO
#include <Arduino.h>
#include "pwmDriver.h"
#include <Adafruit_PWMServoDriver.h>

extern Adafruit_PWMServoDriver pwm;

/**
 * Sets the SSR to Full ON (5V) or Full OFF (0V)
 * @param pin   The channel on the TinyShield (0, 1, 2, or 3)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (state) {
        // Full ON: Set the "Always ON" bit in the PCA9685 register
        pwm.setPWM(pin, 4096, 0); 
    } else {
        // Full OFF: Set the "Always OFF" bit
        pwm.setPWM(pin, 0, 4096);
    }
}

/**
 * Emergency Shutdown: Pulls all SSRs LOW immediately
 */
void killAllHeat() {
    for (uint8_t i = 0; i < 4; i++) {
        setSSRState(i, false);
    }
}
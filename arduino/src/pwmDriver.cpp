#include "driver.h"
#ifdef DRIVER_PWM

#include <Arduino.h>
#include "pwmDriver.h"
#include <Adafruit_PWMServoDriver.h>

#define SSR_1_1 0
#define SSR_1_2 1
#define SSR_2_1 2
#define SSR_2_2 3

extern Adafruit_PWMServoDriver pwm;

/**
 * Sets the SSR to Full ON (5V) or Full OFF (0V)
 * @param pin   The channel on the TinyShield (0, 1, 2, or 3)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (pin == SSR_UPPER) {
        if (state) {
            pwm.setPWM(SSR_1_1, 4096, 0);
            pwm.setPWM(SSR_1_2, 4096, 0);
        } else {
            pwm.setPWM(SSR_1_1, 0, 4096);
            pwm.setPWM(SSR_1_2, 0, 4096);
        }
    } else if (pin == SSR_LOWER) {
        if (state) {
            pwm.setPWM(SSR_2_1, 4096, 0);
            pwm.setPWM(SSR_2_2, 4096, 0);
        } else {
            pwm.setPWM(SSR_2_1, 0, 4096);
            pwm.setPWM(SSR_2_2, 0, 4096);
        }
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

void setupIO() {
    pwm.begin();
    pwm.setPWMFreq(1000); // Set to 1kHz
}

bool getSSRState(uint8_t pin) {
    return false; // Not implemented for PWM driver
}

#endif // DRIVER_PWM
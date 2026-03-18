#include "driver.h"
#ifdef DRIVER_PWM

#include <Arduino.h>
#include "pwmDriver.h"
#include <Adafruit_PWMServoDriver.h>

#define SSR_1_1 0
#define SSR_1_2 1
#define SSR_2_1 2
#define SSR_2_2 3
#define MAXIMUN_PWM_VALUE 4096
#define MINIMUM_PWM_VALUE 0
#define ON_STATE MAXIMUN_PWM_VALUE, MINIMUM_PWM_VALUE
#define OFF_STATE MINIMUM_PWM_VALUE, MAXIMUN_PWM_VALUE

extern Adafruit_PWMServoDriver pwm;

/**
 * Sets the SSR to Full ON (5V) or Full OFF (0V)
 * @param pin   The channel on the TinyShield (0, 1, 2, or 3)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (pin == SSR_UPPER) {
        if (state) {
            pwm.setPWM(SSR_1_1, ON_STATE);
            pwm.setPWM(SSR_1_2, ON_STATE);
        } else {
            pwm.setPWM(SSR_1_1, OFF_STATE);
            pwm.setPWM(SSR_1_2, OFF_STATE);
        }
    } else if (pin == SSR_LOWER) {
        if (state) {
            pwm.setPWM(SSR_2_1, ON_STATE);
            pwm.setPWM(SSR_2_2, ON_STATE);
        } else {
            pwm.setPWM(SSR_2_1, OFF_STATE);
            pwm.setPWM(SSR_2_2, OFF_STATE);
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
    // Retrive the ON/OFF state based on the PWM value of the first channel for each SSR
    if (pin == SSR_UPPER) {
        return pwm.getPWM(SSR_1_1) == ON_STATE;
    } else if (pin == SSR_LOWER) {
        return pwm.getPWM(SSR_2_1) == ON_STATE;
    }
    return false;
}

#endif // DRIVER_PWM
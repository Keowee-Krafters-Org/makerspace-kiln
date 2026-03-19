#include "driver.h"

#ifdef DRIVER_MOTOR

#include <Arduino.h>
#include <MotorDriver.h>
#include <Wire.h>
#include "ATtiny841Lib.h"

MotorDriver motor(NO_R_REMOVED);

#define PWM_PERIOD 20000 // 20ms, standard for servos, but works for motors

/**
 * Sets the SSR to Full ON or Full OFF
 * @param pin   The motor channel on the TinyShield (1 or 2)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (pin == SSR_UPPER) {
        motor.setMotor(1, state ? PWM_PERIOD : 0);
    } else if (pin == SSR_LOWER) {
        motor.setMotor(2, state ? PWM_PERIOD : 0);
    }
}

/**
 * Emergency Shutdown: Turns all motors OFF immediately
 */
void killAllHeat() {
    motor.setMotor(1, 0);
    motor.setMotor(2, 0);
}

bool setupIO() {
    Wire.begin();
    if (motor.begin(PWM_PERIOD)) {
        return false;
    }
    return true;
}

bool getSSRState(uint8_t pin) {
    if (pin == SSR_UPPER) {
        // Motor 1 corresponds to PWM values in RETURN_VAL_REG_0 and RETURN_VAL_REG_1
        return motor.read(RETURN_VAL_REG_0) != 0 || motor.read(RETURN_VAL_REG_1) != 0;
    } else if (pin == SSR_LOWER) {
        // Motor 2 corresponds to PWM values in RETURN_VAL_REG_2 and RETURN_VAL_REG_3
        return motor.read(RETURN_VAL_REG_2) != 0 || motor.read(RETURN_VAL_REG_3) != 0;
    }
    return false;
}

#endif // DRIVER_MOTOR

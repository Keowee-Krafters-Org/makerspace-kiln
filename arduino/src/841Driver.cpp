#include "driver.h"

#ifdef DRIVER_MOTOR

#include <Arduino.h>
#include <MotorDriver.h>
#include <Wire.h>
#include "ATtiny841Lib.h"

MotorDriver driverLower(NO_R_REMOVED);
MotorDriver driverUpper(R1_REMOVED);

#define PWM_PERIOD 20000 // 20ms, standard for servos, but works for motors

/**
 * Sets the SSR to Full ON or Full OFF
 * @param pin   The motor channel on the TinyShield (1 or 2)
 * @param state True for ON, False for OFF
 */
void setSSRState(uint8_t pin, bool state) {
    if (pin == SSR_UPPER) {
        driverUpper.setMotor(1, state ? PWM_PERIOD : 0);
        driverUpper.setMotor(2, state ? PWM_PERIOD : 0);
    } else if (pin == SSR_LOWER) {
        driverLower.setMotor(1, state ? PWM_PERIOD : 0);
        driverLower.setMotor(2, state ? PWM_PERIOD : 0);
    }
}

/**
 * Emergency Shutdown: Turns all motors OFF immediately
 */
void killAllHeat() {
    driverLower.setMotor(1, 0);
    driverLower.setMotor(2, 0);
    driverUpper.setMotor(1, 0);
    driverUpper.setMotor(2, 0);
}

void setupIO() {
    Wire.begin();
    if (driverLower.begin(PWM_PERIOD) || driverUpper.begin(PWM_PERIOD)) {
        // You might want to add some error handling here
        // For example, light up an LED or print to serial
        while(1);
    }
}

bool getSSRState(uint8_t pin) {
    if (pin == SSR_UPPER) {
        // Motor 1 corresponds to PWM values in RETURN_VAL_REG_0 and RETURN_VAL_REG_1
        return driverUpper.read(RETURN_VAL_REG_0) != 0 || driverUpper.read(RETURN_VAL_REG_1) != 0;
    } else if (pin == SSR_LOWER) {
        // Motor 2 corresponds to PWM values in RETURN_VAL_REG_2 and RETURN_VAL_REG_3
        return driverLower.read(RETURN_VAL_REG_2) != 0 || driverLower.read(RETURN_VAL_REG_3) != 0;
    }
    return false;
}

#endif // DRIVER_MOTOR

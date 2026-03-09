#ifndef PWM_DRIVER_H
#define PWM_DRIVER_H
#include <Adafruit_PWMServoDriver.h>
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

#endif // PWM_DRIVER_H
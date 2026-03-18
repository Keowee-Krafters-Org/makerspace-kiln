#include "driver.h"
#ifdef DRIVER_PIO
#include <Arduino.h>

/********************
 * PIO Driver for SSR Control
 * Uses direct digitalWrite to control SSRs connected to specific pins.
 * Simpler but may have timing issues at very low PID windows.
 ********************/  

#endif // DRIVER_PIO
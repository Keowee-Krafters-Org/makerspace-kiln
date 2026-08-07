/*
 * Kiln Controller v0.2.0
 * Multi-step profile support
 */
#include "driver.h"
#include "kiln.h"

// --- Globals ---
KilnState currentState = IDLE;
Profile activeProfile;
int currentStepIndex = 0;
unsigned long totalProfileDuration = 0; // Total estimated duration in ms

double setpoint = 0, input = 0, output = 0;
// Tuning for seconds-based window output (0-10000ms)
// Kp=250 means 40 degrees error gives 10000ms output (Full ON)
double Kp=250, Ki=2, Kd=400;
PID kilnPID(&input, &output, &setpoint, Kp, Ki, Kd, DIRECT);
Adafruit_MAX31856 thermocouple = Adafruit_MAX31856(MAXCS, MAX_MOSI_PIN, MAX_MISO_PIN, MAX_SCK_PIN);

#ifdef DRIVER_PWM
#include <Adafruit_PWMServoDriver.h>
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();
#endif

// Simulation
bool isSimulated = false;
double simulatedInput = 0.0;
unsigned long simulationStartTime = 0;
unsigned long simulationTimeout = 0;

// Timing
unsigned long windowStartTime;
unsigned long stepStartTime = 0;
unsigned long profileStartTime = 0;
unsigned long lastReportTime = 0;
const unsigned long REPORT_INTERVAL = 2000;

// Commanded heater state used for status reporting.
bool ssrUpperOn = false;
bool ssrLowerOn = false;

int nan_count = 0;
uint8_t lastFaultCode = 0;
bool faultReported = false;
const char* lastErrorType = "";
const char* lastErrorMessage = "";
unsigned long trackingDeviationStartTime = 0;
double lastTrackingDeviation = 0.0;
unsigned long responseLagStartTime = 0;
double responseLagStartTemp = 0.0;
unsigned long saturationLagStartTime = 0;
double saturationLagStartTemp = 0.0;
const char* trackingFaultReason = "";

// SSR thermal fault detection (LC1219Z protection)
unsigned long ssrThermalFaultStartTime = 0;
double ssrThermalFaultStartTemp = 0.0;

// LED
unsigned long ledLastChangeTime = 0;
bool ledState = HIGH;

// Prototypes
KilnState parseStateString(const char* str);
const char* stateToString(KilnState s);
void runProfileLogic();
void forceStop();
unsigned long calculateTotalDuration();
void addMax31856FaultFlags(JsonDocument& doc, uint8_t fault);
bool verifyMax31856Communication();
bool checkTrackingWindowFault(unsigned long now);

void setup() {
    Serial_.begin(9600); 
    while(!Serial_); 
    delay(2000); 
    
    JsonDocument doc;
    doc["state"] = "IDLE";
    doc["message"] = "Kiln Controller 2.0 Starting";
    doc["version"] = VERSION;
    serializeJson(doc, Serial_);
    Serial_.println();

    pinMode(LED_PIN, OUTPUT);

#if SPI_PIN_DIAGNOSTIC_MODE
    pinMode(MAXCS, OUTPUT);
    pinMode(MAX_SCK_PIN, OUTPUT);
    pinMode(MAX_MOSI_PIN, OUTPUT); 
    pinMode(MAX_MISO_PIN, OUTPUT);
    while (1) {
       
        // Phase 1: All LOW

        digitalWrite(MAXCS, LOW);
        digitalWrite(MAX_MOSI_PIN, LOW);
        digitalWrite(MAX_MISO_PIN, LOW);
        digitalWrite(MAX_SCK_PIN, LOW);
        Serial_.println("LOW, LOW LOW LOW");
        delay(5000);
        digitalWrite(MAXCS, HIGH);
        digitalWrite(MAX_MOSI_PIN, LOW);
        digitalWrite(MAX_MISO_PIN, LOW);
        digitalWrite(MAX_SCK_PIN, LOW);
        Serial_.println("HIGH, LOW LOW LOW");
        delay(5000);
        
 // Phase 1: SS HIGH, SCK LOW
        digitalWrite(MAXCS, LOW);
        digitalWrite(MAX_MOSI_PIN, HIGH);
        digitalWrite(MAX_MISO_PIN, LOW);
        digitalWrite(MAX_SCK_PIN, LOW);
        Serial_.println("LOW, HIGH, LOW, LOW");
        delay(5000);

        digitalWrite(MAXCS, LOW);
        digitalWrite(MAX_MOSI_PIN, LOW);
        digitalWrite(MAX_MISO_PIN, HIGH);
        digitalWrite(MAX_SCK_PIN, LOW);
        Serial_.println("LOW, LOW , HIGH, LOW");
  
        delay(5000);

        digitalWrite(MAXCS, LOW);
        digitalWrite(MAX_MOSI_PIN, LOW);
        digitalWrite(MAX_MISO_PIN, LOW);
        digitalWrite(MAX_SCK_PIN, HIGH);
        Serial_.println("LOW, LOW , LOW, HIGH");
        delay(5000);
    
    }
#endif

    // Initialize MAX31856
    if (!thermocouple.begin()) {
        JsonDocument errDoc;
        errDoc["state"] = "ERROR";
        errDoc["message"] = "MAX31856 not found!";
        serializeJson(errDoc, Serial_);
        Serial_.println();
        while (1) delay(10); // Halt on critical error
    }
    thermocouple.setThermocoupleType(MAX31856_TCTYPE_S);
    if (!verifyMax31856Communication()) {
        JsonDocument errDoc;
        errDoc["state"] = "ERROR";
        errDoc["fault_code"] = 255;
        errDoc["error_type"] = "COMMUNICATION";
        errDoc["message"] = "MAX31856 readback check failed";
        errDoc["cs_pin"] = MAXCS;
        serializeJson(errDoc, Serial_);
        Serial_.println();
    }

    setupIO();
    
    windowStartTime = millis();
    kilnPID.SetOutputLimits(0, PID_WINDOW_SIZE);
    kilnPID.SetMode(AUTOMATIC);
}

void loop() {
    unsigned long now = millis();

    // 1. Read Input
    if (isSimulated && (now - simulationStartTime < simulationTimeout)) {
        input = simulatedInput;
    } else {
        isSimulated = false;
        input = thermocouple.readThermocoupleTemperature();
    }
    
    uint8_t fault = 0;
    if (!isSimulated) {
        fault = thermocouple.readFault();
    }

    bool readFailed = isnan(input);
    bool hasSensorFault = fault != 0;
    bool shouldReportError = false;

    if (readFailed) {
        nan_count++;
        shouldReportError = (nan_count > 10);
    } else {
        nan_count = 0;
    }

    // MAX31856 can return a numeric temp while fault bits are set (e.g. open TC).
    if (hasSensorFault) {
        shouldReportError = true;
    }

    if (shouldReportError) {
        // Safety-first: drop heat outputs immediately on any sensor fault.
        forceStop();

        if (!faultReported || fault != lastFaultCode) {
            JsonDocument doc;
            doc["state"] = "ERROR";
            doc["fault_code"] = fault;

            if (fault == 0xFF) {
                lastErrorType = "COMMUNICATION";
                lastErrorMessage = "MAX31856 communication error";
                doc["error_type"] = "COMMUNICATION";
                doc["message"] = "MAX31856 communication error";
            } else if (fault != 0) {
                lastErrorType = "THERMOCOUPLE";
                doc["error_type"] = "THERMOCOUPLE";
                if ((fault & MAX31856_FAULT_OPEN) != 0) {
                    lastErrorMessage = "Thermocouple open circuit";
                    doc["message"] = "Thermocouple open circuit";
                } else {
                    lastErrorMessage = "Thermocouple fault";
                    doc["message"] = "Thermocouple fault";
                }
                addMax31856FaultFlags(doc, fault);
            } else {
                lastErrorType = "READ";
                lastErrorMessage = "Temperature read failed";
                doc["error_type"] = "READ";
                doc["message"] = "Temperature read failed";
            }

            serializeJson(doc, Serial_);
            Serial_.println();
        }

        faultReported = true;
        lastFaultCode = fault;
        currentState = ERROR_STATE;
    } else {
        faultReported = false;
        lastFaultCode = 0;
        lastErrorType = "";
        lastErrorMessage = "";
    }

    // 2. Serial Commands
    if (Serial_.available() > 0) {
        String s = Serial_.readStringUntil('\n');
        s.trim();
        if (s.length() > 0) {
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, s);
            if (!error) {
                handleCommand(doc);
            }
        }
    }

    // 3. Logic
    if (currentState == RAMP || currentState == SOAK || currentState == COOL) {
        runProfileLogic();
    } else if (currentState == COMPLETED || currentState == ABORTED || currentState == EMERGENCY_STOP) {
        forceStop();
    }

    // 4. PID & Output
    if (currentState == RAMP || currentState == SOAK || currentState == COOL) {
        // Window Rollover
        if (now - windowStartTime > PID_WINDOW_SIZE) {
            windowStartTime += PID_WINDOW_SIZE;
        }
        
        kilnPID.Compute();
        
        // SSR thermal protection: cap output at 85% to keep LC1219Z junction safe
        if (output > SSR_MAX_DUTY_CYCLE) {
            output = SSR_MAX_DUTY_CYCLE;
        }

        bool heatOn = output > (now - windowStartTime);
        setSSRState(SSR_UPPER, heatOn);
        setSSRState(SSR_LOWER, heatOn);
        ssrUpperOn = heatOn;
        ssrLowerOn = heatOn;

        // Check for SSR thermal fault (output capped but temp not rising)
        if (checkSSRThermalFault(now)) {
            forceStop();
            lastErrorType = "SSR_THERMAL";
            lastErrorMessage = "SSR thermal fault detected (probable thermal fold-back)";
            lastFaultCode = 0;
            currentState = ERROR_STATE;

            JsonDocument doc;
            doc["state"] = "ERROR";
            doc["error_type"] = "SSR_THERMAL";
            doc["message"] = lastErrorMessage;
            doc["setpoint"] = setpoint;
            doc["input"] = input;
            doc["deviation"] = lastTrackingDeviation;
            doc["output_capped"] = SSR_MAX_DUTY_CYCLE;
            doc["window_ms"] = SSR_THERMAL_FAULT_WINDOW_MS;
            doc["min_rise"] = SSR_THERMAL_FAULT_MIN_RISE_C;
            serializeJson(doc, Serial_);
            Serial_.println();
        }

        // Tracking window safety check (after PID so output demand is current).
        if (checkTrackingWindowFault(now)) {
            forceStop();
            lastErrorType = "TRACKING";
            if (strcmp(trackingFaultReason, "RESPONSE_LAG") == 0) {
                lastErrorMessage = "Temperature response lag exceeded";
            } else {
                lastErrorMessage = "Tracking window exceeded";
            }
            lastFaultCode = 0;
            currentState = ERROR_STATE;

            JsonDocument doc;
            doc["state"] = "ERROR";
            doc["error_type"] = "TRACKING";
            doc["tracking_reason"] = trackingFaultReason;
            doc["message"] = lastErrorMessage;
            doc["deviation"] = lastTrackingDeviation;
            doc["allowed_deviation"] = TRACKING_WINDOW_DEVIATION_C;
            doc["hold_ms"] = TRACKING_WINDOW_HOLD_MS;
            doc["lag_window_ms"] = RESPONSE_LAG_WINDOW_MS;
            doc["lag_min_rise"] = RESPONSE_LAG_MIN_RISE_C;
            serializeJson(doc, Serial_);
            Serial_.println();
        }
    } else {
        forceStop();
    }

    // 5. Reporting
    updateLedIndicator();
    reportStatus();
}

void forceStop() {
    output = 0;
    killAllHeat();
    ssrUpperOn = false;
    ssrLowerOn = false;
}

void advanceToNextStep(double nextInitialSetpoint) {
    currentStepIndex++;
    stepStartTime = millis();
    if (currentStepIndex < activeProfile.stepCount) {
        // Keep status/PID coherent during the transition tick by carrying the
        // next step's initial setpoint immediately.
        setpoint = nextInitialSetpoint;
        activeProfile.steps[currentStepIndex].initialSetpoint = nextInitialSetpoint;
        currentState = activeProfile.steps[currentStepIndex].type;
    }
}

void runProfileLogic() {
    if (currentStepIndex >= activeProfile.stepCount) {
        currentState = COMPLETED;
        return;
    }

    ProfileStep& step = activeProfile.steps[currentStepIndex];
    unsigned long elapsed = millis() - stepStartTime;
    bool stepComplete = false;
    double nextInitial = setpoint; 
    
    // Cap the target temperature for safety
    double safeTarget = min(step.targetTemperature, MAX_SAFE_TEMPERATURE);

    if (step.type == SOAK) {
        setpoint = safeTarget;
        if (elapsed >= (unsigned long)step.duration * 60000) {
            stepComplete = true;
            nextInitial = setpoint;
        }
    } else {
        // Shared logic for RAMP and COOL
        double effectiveRate = 0.0;
        
        // 1. Determine Effective Rate
        if (step.duration > 0) {
            double hours = step.duration / 60.0;
            if (hours > 0) {
                effectiveRate = abs(step.targetTemperature - step.initialSetpoint) / hours;
            }
        } else if (step.rate > 0) {
            effectiveRate = step.rate;
        }

        // 2. Handle Natural Cool (Specific Case: COOL with no Rate/Duration)
        bool isNaturalCool = (step.type == COOL && step.duration == 0 && step.rate == 0);

        if (isNaturalCool) {
            setpoint = 0;
            if (input <= safeTarget) {
                stepComplete = true;
                nextInitial = input; // Start next step from actual temp (since setpoint was 0)
            }
        } else {
            // 3. Handle Controlled RAMP/COOL or Instant Jump
            if (effectiveRate > 0) {
                double durationHours = elapsed / 3600000.0;
                double delta = effectiveRate * durationHours;
                
                if (safeTarget >= step.initialSetpoint) {
                    setpoint = step.initialSetpoint + delta;
                    if (setpoint > safeTarget) setpoint = safeTarget;
                } else {
                    setpoint = step.initialSetpoint - delta;
                    if (setpoint < safeTarget) setpoint = safeTarget;
                }
            } else {
                // Instant Jump (RAMP with rate/dur 0) or Holding (if rate 0)
                setpoint = safeTarget;
            }

            // 4. Check for Completion (Wait for Reach + Duration)
            bool durationMet = true;
            if (step.duration > 0) {
                 durationMet = (elapsed >= (unsigned long)step.duration * 60000);
            }

            bool targetReached = false;
            bool inputReached = false;
            
            if (safeTarget >= step.initialSetpoint) {
                // Direction: UP
                if (setpoint >= safeTarget) targetReached = true;
                if (input >= safeTarget) inputReached = true;
            } else {
                // Direction: DOWN
                if (setpoint <= safeTarget) targetReached = true;
                if (input <= safeTarget) inputReached = true;
            }
            
            // Step is complete when Duration is met AND Target is reached (Setpoint & Input)
            if (durationMet && targetReached && inputReached) {
                stepComplete = true;
                nextInitial = setpoint;
            }
        }
    }

    if (stepComplete) {
        advanceToNextStep(nextInitial);
    }
}

void handleCommand(JsonDocument& doc) {
    const char* cmd = doc["command"];
    JsonDocument response;
    response["status"] = "ok";

    if (strcmp(cmd, "profile") == 0) {
        // Parse ID and Name
        // Default to "0" if no ID provided, to ensure we always have a string ID
        strlcpy(activeProfile.id, doc["id"] | "null", sizeof(activeProfile.id));
    
        strlcpy(activeProfile.name, doc["name"] | "Unnamed", sizeof(activeProfile.name));

        JsonArray steps = doc["steps"];
        activeProfile.stepCount = 0;
        if (steps) {
            for(JsonObject s : steps) {
                if (activeProfile.stepCount >= MAX_PROFILE_STEPS) break;
                ProfileStep& ps = activeProfile.steps[activeProfile.stepCount];
                ps.type = parseStateString(s["type"]);
                ps.targetTemperature = s["targetTemperature"]; // float
                ps.duration = s["duration"]; // int (minutes)
                ps.rate = s["rate"]; // float (deg/hr)
                activeProfile.stepCount++;
            }
        }
        currentStepIndex = 0;
        currentState = IDLE;
        response["message"] = "Profile loaded";
        response["profileId"] = activeProfile.id;
        // Immediately report new status with the loaded profile ID
        reportStatus(true); 
    } 
    else if (strcmp(cmd, "start") == 0) {
        if (activeProfile.stepCount > 0) {
            currentStepIndex = 0;
            currentState = activeProfile.steps[0].type;
            // Best effort start point
            activeProfile.steps[0].initialSetpoint = (isnan(input) ? 25 : input); 
            stepStartTime = millis();
            profileStartTime = millis();
            totalProfileDuration = calculateTotalDuration();
            response["message"] = "Started";
        } else {
            response["status"] = "error";
            response["message"] = "No profile loaded";
        }
    }
    else if (strcmp(cmd, "stop") == 0) {
        currentState = ABORTED;
        response["message"] = "Stopped";
    }
    else if (strcmp(cmd, "testInput") == 0) {
        simulatedInput = doc["temperature"];
        
        bool wasSimulated = isSimulated;
        isSimulated = true;
        
        // Only reset timer if duration is explicitly provided or if starting from stopped state
        if (doc["duration"]) {
            simulationStartTime = millis();
            unsigned long dur = doc["duration"];
            if (dur == 0) dur = 120;
            simulationTimeout = dur * 60000;
        } else if (!wasSimulated) {
            // Implicit start with default duration
            simulationStartTime = millis();
            simulationTimeout = 120 * 60000;
        }
        // If running and no duration provided, preserve existing timeout

        if (doc["setPoint"]) {
            setpoint = doc["setPoint"];
        }
        response["message"] = "Simulating";
    }
    else if (strcmp(cmd, "status") == 0) {
        reportStatus(true);
        return; 
    }
    
    serializeJson(response, Serial_);
    Serial_.println();
}

KilnState parseStateString(const char* str) {
    if (!str) return IDLE;
    if (strcmp(str, "RAMP") == 0) return RAMP;
    if (strcmp(str, "SOAK") == 0) return SOAK;
    if (strcmp(str, "COOL") == 0) return COOL;
    return IDLE;
}

const char* stateToString(KilnState s) {
    switch(s) {
        case IDLE: return "IDLE";
        case RAMP: return "RAMP";
        case SOAK: return "SOAK";
        case COOL: return "COOL";
        case COMPLETED: return "COMPLETED";
        case ABORTED: return "ABORTED";
        case EMERGENCY_STOP: return "EMERGENCY_STOP";
        case ERROR_STATE: return "ERROR";
        default: return "UNKNOWN";
    }
}

void addMax31856FaultFlags(JsonDocument& doc, uint8_t fault) {
    doc["fault_open"] = (fault & MAX31856_FAULT_OPEN) != 0;
    doc["fault_over_under_voltage"] = (fault & MAX31856_FAULT_OVUV) != 0;
    doc["fault_tc_low"] = (fault & MAX31856_FAULT_TCLOW) != 0;
    doc["fault_tc_high"] = (fault & MAX31856_FAULT_TCHIGH) != 0;
    doc["fault_cj_low"] = (fault & MAX31856_FAULT_CJLOW) != 0;
    doc["fault_cj_high"] = (fault & MAX31856_FAULT_CJHIGH) != 0;
    doc["fault_tc_range"] = (fault & MAX31856_FAULT_TCRANGE) != 0;
    doc["fault_cj_range"] = (fault & MAX31856_FAULT_CJRANGE) != 0;
}

bool verifyMax31856Communication() {
    // Read back the configured type. This catches many "all 1s" SPI failures.
    max31856_thermocoupletype_t tcType = thermocouple.getThermocoupleType();
    if (tcType != MAX31856_TCTYPE_S) {
        return false;
    }

    // 0xFF typically means MISO pulled high / no valid slave response.
    uint8_t fault = thermocouple.readFault();
    if (fault == 0xFF) {
        return false;
    }

    return true;
}

bool checkTrackingWindowFault(unsigned long now) {
    if (isnan(input) || !(currentState == RAMP || currentState == SOAK)) {
        trackingDeviationStartTime = 0;
        lastTrackingDeviation = 0.0;
        responseLagStartTime = 0;
        responseLagStartTemp = input;
        saturationLagStartTime = 0;
        saturationLagStartTemp = input;
        trackingFaultReason = "";
        return false;
    }

    bool trackingWindowFault = false;
    bool responseLagFault = false;
    bool responseLagSaturatedFault = false;

    // 1) SOAK deviation window (existing behavior)
    if (currentState == SOAK && setpoint >= TRACKING_WINDOW_MIN_SETPOINT_C) {
        double deviation = abs(input - setpoint);
        lastTrackingDeviation = deviation;

        if (deviation <= TRACKING_WINDOW_DEVIATION_C) {
            trackingDeviationStartTime = 0;
        } else {
            if (trackingDeviationStartTime == 0) {
                trackingDeviationStartTime = now;
            } else if ((now - trackingDeviationStartTime) >= TRACKING_WINDOW_HOLD_MS) {
                trackingWindowFault = true;
            }
        }
    } else {
        trackingDeviationStartTime = 0;
    }

    // 2) RAMP/SOAK response lag (new behavior)
    double demand = setpoint - input;
    bool sustainedHeatDemand =
        setpoint >= RESPONSE_LAG_MIN_SETPOINT_C &&
        demand >= RESPONSE_LAG_DEMAND_C &&
        output >= RESPONSE_LAG_HEATER_OUTPUT_MIN;

    if (!sustainedHeatDemand) {
        responseLagStartTime = 0;
        responseLagStartTemp = input;
    } else {
        if (responseLagStartTime == 0) {
            responseLagStartTime = now;
            responseLagStartTemp = input;
        } else if ((now - responseLagStartTime) >= RESPONSE_LAG_WINDOW_MS) {
            double rise = input - responseLagStartTemp;
            if (rise < RESPONSE_LAG_MIN_RISE_C) {
                responseLagFault = true;
                lastTrackingDeviation = demand;
            } else {
                // Temperature is rising; start a fresh observation window.
                responseLagStartTime = now;
                responseLagStartTemp = input;
            }
        }
    }

    // 3) Fast saturated-output lag trip
    bool saturatedHeatDemand =
        setpoint >= RESPONSE_LAG_MIN_SETPOINT_C &&
        demand >= RESPONSE_LAG_DEMAND_C &&
        output >= RESPONSE_LAG_SATURATION_OUTPUT_MIN;

    if (!saturatedHeatDemand) {
        saturationLagStartTime = 0;
        saturationLagStartTemp = input;
    } else {
        if (saturationLagStartTime == 0) {
            saturationLagStartTime = now;
            saturationLagStartTemp = input;
        } else if ((now - saturationLagStartTime) >= RESPONSE_LAG_SATURATION_WINDOW_MS) {
            double saturatedRise = input - saturationLagStartTemp;
            if (saturatedRise < RESPONSE_LAG_SATURATION_MIN_RISE_C) {
                responseLagSaturatedFault = true;
                lastTrackingDeviation = demand;
            } else {
                saturationLagStartTime = now;
                saturationLagStartTemp = input;
            }
        }
    }

    if (responseLagSaturatedFault) {
        trackingFaultReason = "RESPONSE_LAG_SATURATED";
        return true;
    }

    if (responseLagFault) {
        trackingFaultReason = "RESPONSE_LAG";
        return true;
    }

    if (trackingWindowFault) {
        trackingFaultReason = "DEVIATION_WINDOW";
        return true;
    }

    trackingFaultReason = "";
    return false;
}

bool checkSSRThermalFault(unsigned long now) {
    // Detect SSR thermal fold-back: output is capped but temperature not rising.
    // LC1219Z SSRs have Tj(max)=120°C and derate sharply at 50°C+ ambient.
    // If control box near kiln reaches 60-80°C and SSR in thermal stress,
    // it may enter fold-back or latch. This function detects that pattern.
    
    if (isnan(input) || !(currentState == RAMP || currentState == SOAK)) {
        ssrThermalFaultStartTime = 0;
        ssrThermalFaultStartTemp = input;
        return false;
    }

    // Only check if output is capped (at SSR_MAX_DUTY_CYCLE limit)
    // and there is substantial heat demand
    bool outputCapped = output >= SSR_MAX_DUTY_CYCLE;
    bool heatDemand = setpoint >= RESPONSE_LAG_MIN_SETPOINT_C && 
                      (setpoint - input) >= RESPONSE_LAG_DEMAND_C;

    if (!outputCapped || !heatDemand) {
        ssrThermalFaultStartTime = 0;
        ssrThermalFaultStartTemp = input;
        return false;
    }

    // Output is capped and heat demand is present.
    // If temperature isn't rising over 2 minutes, SSR likely in fold-back.
    if (ssrThermalFaultStartTime == 0) {
        ssrThermalFaultStartTime = now;
        ssrThermalFaultStartTemp = input;
    } else if ((now - ssrThermalFaultStartTime) >= SSR_THERMAL_FAULT_WINDOW_MS) {
        double rise = input - ssrThermalFaultStartTemp;
        if (rise < SSR_THERMAL_FAULT_MIN_RISE_C) {
            // Temperature stalled despite capped output and demand
            lastTrackingDeviation = setpoint - input;
            trackingFaultReason = "SSR_THERMAL_FAULT";
            return true;
        } else {
            // Temp rising, reset window
            ssrThermalFaultStartTime = now;
            ssrThermalFaultStartTemp = input;
        }
    }

    return false;
}

unsigned long calculateTotalDuration() {
    unsigned long total = 0;
    double currentTemp = isnan(input) ? 25.0 : input;
    
    for(int i=0; i < activeProfile.stepCount; i++) {
        ProfileStep& step = activeProfile.steps[i];
        
        if (step.type == RAMP) {
            if (step.duration > 0) {
                total += (unsigned long)step.duration * 60000;
                currentTemp = step.targetTemperature;
            } else if (step.rate > 0) {
                double diff = abs(step.targetTemperature - currentTemp);
                double hours = diff / step.rate;
                total += (unsigned long)(hours * 3600000);
                currentTemp = step.targetTemperature;
            } else {
                 // Instant jump, 0 time
                 currentTemp = step.targetTemperature;
            }
        } else if (step.type == SOAK) {
            total += (unsigned long)step.duration * 60000;
        } else if (step.type == COOL) {
             if (step.duration > 0) {
                 total += (unsigned long)step.duration * 60000;
             } else {
                 // Fallback estimate for natural cool
                 double diff = 0;
                 if (currentTemp > step.targetTemperature) diff = currentTemp - step.targetTemperature;
                 double hours = diff / 150.0;
                 total += (unsigned long)(hours * 3600000);
             }
             currentTemp = step.targetTemperature;
        }
    }
    return total;
}

unsigned long estimateTimeRemaining() {
    if (activeProfile.stepCount == 0 || currentState == IDLE || currentState == COMPLETED) return 0;
    
    long runElapsed = millis() - profileStartTime;
    long theoreticalRemaining = totalProfileDuration - runElapsed;
    
    if (theoreticalRemaining < 0) return 0;
    return theoreticalRemaining;
}


void reportStatus(bool force) {
    if (force || (millis() - lastReportTime > REPORT_INTERVAL)) {
        lastReportTime = millis();
        JsonDocument doc;
        doc["state"] = stateToString(currentState);
        doc["profileId"] = activeProfile.id;
        doc["currentStep"] = currentStepIndex + 1;
        doc["totalSteps"] = activeProfile.stepCount;
        doc["input"] = input;
        doc["setpoint"] = setpoint;
        
        // Add targetTemperature from current step
        if (activeProfile.stepCount > 0 && currentStepIndex < activeProfile.stepCount) {
             doc["targetTemperature"] = activeProfile.steps[currentStepIndex].targetTemperature;
        } else {
             doc["targetTemperature"] = 0;
        }
        
        doc["timeRemaining"] = estimateTimeRemaining();
        doc["output"] = output;
        doc["ssrUpper"] = ssrUpperOn;
        doc["ssrLower"] = ssrLowerOn;
        doc["ssrMaxDutyCycle"] = SSR_MAX_DUTY_CYCLE;  // SSR thermal protection limit
        doc["ssrOutputCapped"] = (output >= SSR_MAX_DUTY_CYCLE);  // Is output at limit?
        doc["isSimulated"] = isSimulated;

        if (currentState == ERROR_STATE && lastErrorType[0] != '\0') {
            doc["fault_code"] = lastFaultCode;
            doc["error_type"] = lastErrorType;
            doc["message"] = lastErrorMessage;
            if (strcmp(lastErrorType, "THERMOCOUPLE") == 0) {
                addMax31856FaultFlags(doc, lastFaultCode);
            }
        }
        
        serializeJson(doc, Serial_);
        Serial_.println();
    }
}

void updateLedIndicator() {
    unsigned long now = millis();
    if (currentState == RAMP) {
        digitalWrite(LED_PIN, HIGH);
    } else if (currentState == SOAK) {
        if (now - ledLastChangeTime > 500) {
            ledState = !ledState;
            digitalWrite(LED_PIN, ledState);
            ledLastChangeTime = now;
        }
    } else {
        digitalWrite(LED_PIN, LOW);
    }
}

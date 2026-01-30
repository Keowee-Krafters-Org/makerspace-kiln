/*
 * Kiln Controller v0.2.0
 * Multi-step profile support
 */
#include "kiln.h"

// --- Hardware Pins ---
#define DO   3
#define CS   4
#define CLK  5
#define SSR_PIN_UPPER 6
#define SSR_PIN_LOWER 7
#define LED_PIN 13 

// --- Configuration ---
#define PID_WINDOW_SIZE 10000

// --- Globals ---
KilnState currentState = IDLE;
Profile activeProfile;
int currentStepIndex = 0;
unsigned long totalProfileDuration = 0; // Total estimated duration in ms

double setpoint = 0, input = 0, output = 0;
// Tuning for seconds-based window output (0-10000ms)
// Kp=1000 means 10 degrees error gives 10000ms output (Full ON)
double Kp=1000, Ki=10, Kd=100;
PID kilnPID(&input, &output, &setpoint, Kp, Ki, Kd, DIRECT);
Adafruit_MAX31855 thermocouple(CLK, CS, DO);

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

// LED
unsigned long ledLastChangeTime = 0;
bool ledState = HIGH;

// Prototypes
KilnState parseStateString(const char* str);
const char* stateToString(KilnState s);
void runProfileLogic();
void forceStop();
unsigned long calculateTotalDuration();

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

    pinMode(SSR_PIN_UPPER, OUTPUT);
    pinMode(SSR_PIN_LOWER, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    
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
        input = thermocouple.readCelsius();
    }
    
    if (isnan(input)) {
        currentState = EMERGENCY_STOP;
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
        
        if (output > (now - windowStartTime)) {
            digitalWrite(SSR_PIN_UPPER, HIGH);
            digitalWrite(SSR_PIN_LOWER, HIGH);
        } else {
            digitalWrite(SSR_PIN_UPPER, LOW);
            digitalWrite(SSR_PIN_LOWER, LOW);
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
    digitalWrite(SSR_PIN_UPPER, LOW);
    digitalWrite(SSR_PIN_LOWER, LOW);
}

void advanceToNextStep(double nextInitialSetpoint) {
    currentStepIndex++;
    stepStartTime = millis();
    if (currentStepIndex < activeProfile.stepCount) {
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

    if (step.type == SOAK) {
        setpoint = step.targetTemperature;
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
        if (step.type == COOL && effectiveRate <= 0) {
            setpoint = 0;
            if (input <= step.targetTemperature) {
                stepComplete = true;
                nextInitial = input; // Start next step from actual temp (since setpoint was 0)
            }
        } else {
            // 3. Handle Controlled RAMP/COOL or Instant Jump
            if (effectiveRate > 0) {
                double durationHours = elapsed / 3600000.0;
                double delta = effectiveRate * durationHours;
                
                if (step.targetTemperature >= step.initialSetpoint) {
                    setpoint = step.initialSetpoint + delta;
                    if (setpoint > step.targetTemperature) setpoint = step.targetTemperature;
                } else {
                    setpoint = step.initialSetpoint - delta;
                    if (setpoint < step.targetTemperature) setpoint = step.targetTemperature;
                }
            } else {
                // Instant Jump (RAMP with rate/dur 0)
                setpoint = step.targetTemperature;
            }

            // 4. Check for Completion (Wait for Reach)
            bool targetReached = false;
            bool inputReached = false;
            
            if (step.targetTemperature >= step.initialSetpoint) {
                // Direction: UP
                if (setpoint >= step.targetTemperature) targetReached = true;
                if (input >= step.targetTemperature) inputReached = true;
            } else {
                // Direction: DOWN
                if (setpoint <= step.targetTemperature) targetReached = true;
                if (input <= step.targetTemperature) inputReached = true;
            }
            
            if (targetReached && inputReached) {
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
        activeProfile.id = doc["id"] | 0;
        strlcpy(activeProfile.name, doc["name"] | "Unnamed", sizeof(activeProfile.name));

        JsonArray steps = doc["steps"];
        activeProfile.stepCount = 0;
        for(JsonObject s : steps) {
            if (activeProfile.stepCount >= MAX_PROFILE_STEPS) break;
            ProfileStep& ps = activeProfile.steps[activeProfile.stepCount];
            ps.type = parseStateString(s["type"]);
            ps.targetTemperature = s["targetTemperature"]; // float
            ps.duration = s["duration"]; // int (minutes)
            ps.rate = s["rate"]; // float (deg/hr)
            activeProfile.stepCount++;
        }
        currentStepIndex = 0;
        currentState = IDLE;
        response["message"] = "Profile loaded";
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
        isSimulated = true;
        simulationStartTime = millis();
        
        // Default to 120 minutes if duration is not provided
        unsigned long dur = 120;
        if (doc["duration"].is<unsigned long>()) {
             dur = doc["duration"];
             if (dur == 0) dur = 120;
        }
        simulationTimeout = dur * 60000;

        if (doc["setPoint"].is<double>()) {
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
        default: return "UNKNOWN";
    }
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
        doc["ssrUpper"] = digitalRead(SSR_PIN_UPPER) == HIGH;
        doc["ssrLower"] = digitalRead(SSR_PIN_LOWER) == HIGH;
        doc["isSimulated"] = isSimulated;
        
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

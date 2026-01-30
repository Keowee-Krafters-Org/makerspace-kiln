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

void runProfileLogic() {
    if (currentStepIndex >= activeProfile.stepCount) {
        currentState = COMPLETED;
        return;
    }

    ProfileStep& step = activeProfile.steps[currentStepIndex];
    unsigned long elapsed = millis() - stepStartTime;

    if (step.type == RAMP) {
        // Option 1: Rate-based RAMP (deg/hr)
        if (step.rate > 0) {
            double durationHours = elapsed / 3600000.0;
            double delta = step.rate * durationHours;
            
            if (step.targetTemperature > step.initialSetpoint) {
                // Heating up
                setpoint = step.initialSetpoint + delta;
                if (setpoint >= step.targetTemperature) {
                    setpoint = step.targetTemperature;
                    currentStepIndex++;
                    stepStartTime = millis();
                    if (currentStepIndex < activeProfile.stepCount) {
                        activeProfile.steps[currentStepIndex].initialSetpoint = setpoint;
                        currentState = activeProfile.steps[currentStepIndex].type;
                    }
                }
            } else {
                // Cooling down (controlled)
                setpoint = step.initialSetpoint - delta;
                if (setpoint <= step.targetTemperature) {
                    setpoint = step.targetTemperature;
                    currentStepIndex++;
                    stepStartTime = millis();
                    if (currentStepIndex < activeProfile.stepCount) {
                        activeProfile.steps[currentStepIndex].initialSetpoint = setpoint;
                        currentState = activeProfile.steps[currentStepIndex].type;
                    }
                }
            }
        }
        // Option 2: Duration-based RAMP (minutes)
        else if (step.duration > 0) {
             unsigned long durationMs = step.duration * 60000;
             if (elapsed >= durationMs) {
                 // Finished
                 setpoint = step.targetTemperature;
                 currentStepIndex++;
                 stepStartTime = millis();
                 if (currentStepIndex < activeProfile.stepCount) {
                     activeProfile.steps[currentStepIndex].initialSetpoint = setpoint;
                     currentState = activeProfile.steps[currentStepIndex].type;
                 }
             } else {
                 // Interpolate
                 double progress = (double)elapsed / (double)durationMs;
                 setpoint = step.initialSetpoint + ((step.targetTemperature - step.initialSetpoint) * progress);
             }
        }
    } else if (step.type == SOAK) {
        setpoint = step.targetTemperature;
        if (elapsed >= (step.duration * 60000)) {
            currentStepIndex++;
            stepStartTime = millis();
            if (currentStepIndex < activeProfile.stepCount) {
                activeProfile.steps[currentStepIndex].initialSetpoint = setpoint;
                currentState = activeProfile.steps[currentStepIndex].type;
            }
        }
    } else if (step.type == COOL) {
        setpoint = 0; // Natural cool
        if (input <= step.targetTemperature) {
            currentStepIndex++;
            stepStartTime = millis();
            if (currentStepIndex < activeProfile.stepCount) {
                activeProfile.steps[currentStepIndex].initialSetpoint = input;
                currentState = activeProfile.steps[currentStepIndex].type;
            }
        }
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
        
        unsigned long dur = doc["duration"] | 1;
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

unsigned long estimateTimeRemaining() {
    unsigned long total = 0;
    
    // 1. Current Step Remaining
    if (activeProfile.stepCount > 0 && currentStepIndex < activeProfile.stepCount) {
        ProfileStep& step = activeProfile.steps[currentStepIndex];
        unsigned long elapsed = millis() - stepStartTime;
        
        if (step.type == RAMP) {
             if (step.rate > 0) {
                 double diff = abs(step.targetTemperature - setpoint);
                 double hours = diff / step.rate;
                 total += (unsigned long)(hours * 3600000);
             } else if (step.duration > 0) {
                 unsigned long durMs = step.duration * 60000;
                 if (durMs > elapsed) total += (durMs - elapsed);
             }
        } else if (step.type == SOAK) {
             unsigned long durMs = step.duration * 60000;
             if (durMs > elapsed) total += (durMs - elapsed);
        }
    }
    
    // 2. Future Steps
    if (activeProfile.stepCount > 0) {
        for (int i = currentStepIndex + 1; i < activeProfile.stepCount; i++) {
            ProfileStep& step = activeProfile.steps[i];
            ProfileStep& prev = activeProfile.steps[i-1];
            
            if (step.type == RAMP) {
                if (step.rate > 0) {
                    double startT = prev.targetTemperature;
                    double diff = abs(step.targetTemperature - startT);
                    double hours = diff / step.rate;
                    total += (unsigned long)(hours * 3600000);
                } else if (step.duration > 0) {
                    total += step.duration * 60000;
                }
            } else if (step.type == SOAK) {
                total += step.duration * 60000;
            }
        }
    }
    return total;
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

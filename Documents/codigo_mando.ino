#include <Arduino.h>
#include <BleKeyboard.h>

BleKeyboard tecladoBLE("ESP32 Teclado2", "GeovanniQuinde,OrlandoRodrigo,HenryRosero", 100);

const int PIN_A     = 12;
const int PIN_B     = 27;
const int PIN_Z     = 26;
const int PIN_ESC   = 14;

const int PIN_LEFT  = 25;
const int PIN_UP    = 32;
const int PIN_RIGHT = 33;

const uint32_t DEBOUNCE_MS = 25;

// Estados
bool rawA=false, rawB=false, rawZ=false, rawESC=false;
bool rawL=false, rawU=false, rawR=false;

bool stA=false, stB=false, stZ=false, stESC=false;
bool stL=false, stU=false, stR=false;

uint32_t tA=0, tB=0, tZ=0, tESC=0, tL=0, tU=0, tR=0;


static inline bool pressed(int pin) {
  return digitalRead(pin) == LOW;
}

void handleButton(int pin, uint8_t key,
                  bool &raw, bool &st, uint32_t &tstamp) {
  bool r = pressed(pin);

  if (r != raw) {
    raw = r;
    tstamp = millis();
  }

  if ((millis() - tstamp) > DEBOUNCE_MS && st != raw) {
    st = raw;
    if (tecladoBLE.isConnected()) {
      if (st) tecladoBLE.press(key);
      else    tecladoBLE.release(key);
    }
  }
}

void setup() {
  Serial.begin(19200);


  pinMode(PIN_A,     INPUT_PULLUP);
  pinMode(PIN_B,     INPUT_PULLUP);
  pinMode(PIN_Z,     INPUT_PULLUP);
  pinMode(PIN_ESC,   INPUT_PULLUP);

  pinMode(PIN_LEFT,  INPUT_PULLUP);
  pinMode(PIN_UP,    INPUT_PULLUP);
  pinMode(PIN_RIGHT, INPUT_PULLUP);

  tecladoBLE.begin();
  Serial.println("Conecta por Bluetooth a ESP32 Teclado2");
}

void loop() {
  handleButton(PIN_A,   'a',             rawA,   stA,   tA);
  handleButton(PIN_B,   'b',             rawB,   stB,   tB);
  handleButton(PIN_Z,   'z',             rawZ,   stZ,   tZ);
  handleButton(PIN_ESC, KEY_ESC,         rawESC, stESC, tESC);

  handleButton(PIN_LEFT,  KEY_LEFT_ARROW,  rawL, stL, tL);
  handleButton(PIN_UP,    KEY_UP_ARROW,    rawU, stU, tU);
  handleButton(PIN_RIGHT, KEY_RIGHT_ARROW, rawR, stR, tR);bb

  if (!tecladoBLE.isConnected()) {
    tecladoBLE.releaseAll();
  }

  delay(1);
}

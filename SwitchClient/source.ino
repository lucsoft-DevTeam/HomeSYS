#include <Wire.h>

void setup() {
  pinMode(13,OUTPUT);
  digitalWrite(13,true);
  Wire.begin(8);      
  Wire.onReceive(receiveEvent);
  Serial.begin(9600);  
  
  for (int i=5; i <=12; i++){
    pinMode(i,OUTPUT);
    digitalWrite(i,true);
  }
  Serial.println("[SwitchClient] Loading...");
  digitalWrite(13,false);
}

void loop() {
}

void receiveEvent(int howMany) {
   digitalWrite(13,true);
  while (1 < Wire.available()) {
    char c = Wire.read();
    Serial.print(c);
  }
  int x = Wire.read();
  digitalWrite(13,false);
  Serial.println(x);
  if (x <= 8 && x >= 1) {
    digitalWrite(x+4, HIGH);
  } else if (x >= 9 ) {
    digitalWrite(x+4 -8, LOW); 
  } 
}

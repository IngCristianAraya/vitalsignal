import serial
import requests
import re
import time
import json

# Configuración
SERIAL_PORT = 'COM4'  # Cambia según tu puerto
BAUDRATE = 115200
API_URL = 'http://localhost:5000/api/lecturas'
USER_ID = 1  # ID del usuario en la base de datos

def parse_data(data_string):
    """Extrae los valores de la cadena de datos del Arduino."""
    try:
        bpm_match = re.search(r'BPM: (\d+\.\d+)', data_string)
        spo2_match = re.search(r'SpO2: (\d+)', data_string)
        temp_match = re.search(r'Temperature: (\d+\.\d+)', data_string)
        anomalia_match = re.search(r'Anomalia: (\w+)', data_string)
        
        return {
            'pulso': float(bpm_match.group(1)) if bpm_match else 0,
            'spo2': int(spo2_match.group(1)) if spo2_match else 0,
            'temperatura': float(temp_match.group(1)) if temp_match else 0,
            'anomalia': anomalia_match.group(1) if anomalia_match else 'normal',
            'idUsuario': USER_ID
        }
    except Exception as e:
        print(f"Error analizando datos: {e}")
        return None

def send_to_api(data):
    """Envía los datos a la API."""
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            print(f"Datos enviados correctamente: {data}")
            return True
        else:
            print(f"Error enviando datos: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error de conexión: {e}")
        return False

def main():
    """Función principal del puente Arduino-API."""
    print("Iniciando puente Arduino-API...")
    
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
        print(f"Conectado a {SERIAL_PORT} a {BAUDRATE} baudios")
        
        last_send_time = 0
        MIN_SEND_INTERVAL = 5  # segundos entre envíos para no saturar la BD
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                print(f"Datos recibidos: {line}")
                
                current_time = time.time()
                if current_time - last_send_time >= MIN_SEND_INTERVAL:
                    data = parse_data(line)
                    if data and data['pulso'] > 0:  # Solo enviar datos válidos
                        if send_to_api(data):
                            last_send_time = current_time
                
            time.sleep(0.1)  # Pequeña pausa para no saturar la CPU
            
    except serial.SerialException as e:
        print(f"Error de comunicación serial: {e}")
    except KeyboardInterrupt:
        print("Programa terminado por el usuario")
    finally:
        if 'ser' in locals():
            ser.close()
            print("Puerto serial cerrado")

if __name__ == "__main__":
    main()
